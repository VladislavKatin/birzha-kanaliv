const router = require('express').Router();
const { Review, TrafficMatch, YouTubeAccount, User, ActionLog } = require('../models');
const auth = require('../middleware/auth');

/**
 * Get user and their primary YouTube channel.
 * @param {string} firebaseUid
 * @returns {Object|null} { user, account }
 */
async function getUserChannel(firebaseUid) {
    const user = await User.findOne({ where: { firebaseUid } });
    if (!user) return null;
    const account = await YouTubeAccount.findOne({ where: { userId: user.id } });
    return { user, account };
}

/**
 * @route POST /api/reviews
 * @description Leave a review after a completed exchange. One review per match per side.
 * @access Private (match participant only)
 * @param {string} matchId - Match UUID
 * @param {number} rating - 1-5 stars
 * @param {string} [comment] - Review text
 * @returns {Object} review
 */
router.post('/', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) {
            return res.status(400).json({ error: 'Підключіть YouTube-канал' });
        }

        const { matchId, rating, comment } = req.body;

        if (!matchId || !rating) {
            return res.status(400).json({ error: 'matchId та rating обов\'язкові' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Рейтинг має бути від 1 до 5' });
        }

        // Verify match exists and is completed
        const match = await TrafficMatch.findByPk(matchId);
        if (!match) return res.status(404).json({ error: 'Match not found' });

        if (match.status !== 'completed') {
            return res.status(400).json({ error: 'Відгук можна залишити лише після завершення обміну' });
        }

        // Verify user is part of this match
        const isInitiator = match.initiatorChannelId === result.account.id;
        const isTarget = match.targetChannelId === result.account.id;

        if (!isInitiator && !isTarget) {
            return res.status(403).json({ error: 'Не ваш обмін' });
        }

        // Determine who we're reviewing
        const toChannelId = isInitiator ? match.targetChannelId : match.initiatorChannelId;

        // Check if already reviewed
        const existing = await Review.findOne({
            where: {
                matchId,
                fromChannelId: result.account.id,
            },
        });

        if (existing) {
            return res.status(409).json({ error: 'Ви вже залишили відгук для цього обміну' });
        }

        const review = await Review.create({
            matchId,
            fromChannelId: result.account.id,
            toChannelId,
            rating,
            comment,
        });

        await ActionLog.create({
            userId: result.user.id,
            action: 'review_created',
            details: { reviewId: review.id, matchId, rating },
            ip: req.ip,
        });

        res.status(201).json({ review });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ error: 'Не вдалося залишити відгук' });
    }
});

/**
 * @route GET /api/reviews/channel/:channelId
 * @description Get all reviews for a channel with average rating
 * @access Public
 * @param {string} channelId - Channel UUID
 * @returns {Object} reviews[], rating { average, count }
 */
router.get('/channel/:channelId', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { toChannelId: req.params.channelId },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'fromChannel',
                    attributes: ['channelTitle', 'channelAvatar', 'subscribers'],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.json({
            reviews,
            rating: {
                average: Math.round(avgRating * 10) / 10,
                count: reviews.length,
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

module.exports = router;
