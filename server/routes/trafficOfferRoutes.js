const router = require('express').Router();
const { TrafficOffer, YouTubeAccount, User, TrafficMatch, ActionLog } = require('../models');
const { Op } = require('sequelize');
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
 * @route POST /api/offers
 * @description Create a new traffic exchange offer
 * @access Private (must have connected YouTube channel)
 * @param {string} type - Offer type: 'subs' or 'views'
 * @param {string} [description] - Offer description
 * @param {string} [niche] - Target niche filter
 * @param {string} [language] - Target language filter
 * @param {number} [minSubscribers=0] - Min subscriber requirement
 * @param {number} [maxSubscribers=0] - Max subscriber requirement
 * @returns {Object} offer
 */
router.post('/', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) {
            return res.status(400).json({ error: 'Підключіть YouTube-канал перед створенням пропозиції' });
        }

        // Anti-abuse: max 5 offers per week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyOffers = await TrafficOffer.count({
            where: {
                channelId: result.account.id,
                createdAt: { [Op.gte]: oneWeekAgo },
            },
        });

        if (weeklyOffers >= 5) {
            return res.status(429).json({
                error: 'Максимум 5 пропозицій на тиждень. Спробуйте пізніше.',
            });
        }

        const { type, description, niche, language, minSubscribers, maxSubscribers } = req.body;

        if (!type || !['subs', 'views'].includes(type)) {
            return res.status(400).json({ error: 'Тип має бути "subs" або "views"' });
        }

        const offer = await TrafficOffer.create({
            channelId: result.account.id,
            type,
            description,
            niche,
            language,
            minSubscribers: minSubscribers || 0,
            maxSubscribers: maxSubscribers || 0,
            status: 'open',
        });

        // Log action
        await ActionLog.create({
            userId: result.user.id,
            action: 'offer_created',
            details: { offerId: offer.id, type },
            ip: req.ip,
        });

        res.status(201).json({ offer });
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Не вдалося створити пропозицію' });
    }
});

/**
 * @route GET /api/offers
 * @description List open offers with optional filters (public)
 * @access Public
 * @param {string} [type] - 'subs' or 'views'
 * @param {string} [niche] - Filter by niche
 * @param {string} [language] - Filter by language
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Object} offers[], pagination
 */
router.get('/', async (req, res) => {
    try {
        const { type, niche, language, minSubs, maxSubs, page = 1, limit = 20 } = req.query;
        const where = { status: 'open' };

        if (type) where.type = type;
        if (niche) where.niche = niche;
        if (language) where.language = language;
        if (minSubs) where.minSubscribers = { [Op.lte]: parseInt(minSubs) };
        if (maxSubs) where.maxSubscribers = { [Op.gte]: parseInt(maxSubs) };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: offers } = await TrafficOffer.findAndCountAll({
            where,
            include: [
                {
                    model: YouTubeAccount,
                    as: 'channel',
                    attributes: ['channelTitle', 'channelAvatar', 'subscribers', 'niche', 'language', 'country'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            offers,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('List offers error:', error);
        res.status(500).json({ error: 'Failed to list offers' });
    }
});

/**
 * @route GET /api/offers/my
 * @description Get current user's own offers
 * @access Private
 * @returns {Object} offers[]
 */
router.get('/my', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) {
            return res.status(404).json({ error: 'No channel connected' });
        }

        const offers = await TrafficOffer.findAll({
            where: { channelId: result.account.id },
            include: [
                {
                    model: TrafficMatch,
                    as: 'matches',
                    include: [
                        { model: YouTubeAccount, as: 'initiatorChannel', attributes: ['channelTitle', 'channelAvatar', 'subscribers'] },
                        { model: YouTubeAccount, as: 'targetChannel', attributes: ['channelTitle', 'channelAvatar', 'subscribers'] },
                    ],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json({ offers });
    } catch (error) {
        console.error('Get my offers error:', error);
        res.status(500).json({ error: 'Failed to get offers' });
    }
});

/**
 * @route GET /api/offers/:id
 * @description Get single offer details with channel info
 * @access Public
 * @param {string} id - Offer UUID
 * @returns {Object} offer
 */
router.get('/:id', async (req, res) => {
    try {
        const offer = await TrafficOffer.findByPk(req.params.id, {
            include: [
                {
                    model: YouTubeAccount,
                    as: 'channel',
                    attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'totalViews', 'niche', 'language', 'country'],
                },
            ],
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json({ offer });
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ error: 'Failed to get offer' });
    }
});

// DELETE /api/offers/:id — cancel offer
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) return res.status(404).json({ error: 'No channel connected' });

        const offer = await TrafficOffer.findByPk(req.params.id);
        if (!offer) return res.status(404).json({ error: 'Offer not found' });
        if (offer.channelId !== result.account.id) {
            return res.status(403).json({ error: 'Not your offer' });
        }

        await offer.destroy();
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

/**
 * @route POST /api/offers/:id/respond
 * @description Respond to an offer — creates a pending match. Max 3 active matches.
 * @access Private (must have connected YouTube channel)
 * @param {string} id - Offer UUID
 * @returns {Object} match
 */
router.post('/:id/respond', auth, async (req, res) => {
    try {
        const result = await getUserChannel(req.firebaseUser.uid);
        if (!result?.account) {
            return res.status(400).json({ error: 'Підключіть YouTube-канал' });
        }

        const offer = await TrafficOffer.findByPk(req.params.id);
        if (!offer) return res.status(404).json({ error: 'Offer not found' });
        if (offer.status !== 'open') {
            return res.status(400).json({ error: 'Пропозиція вже не активна' });
        }

        // Can't respond to own offer
        if (offer.channelId === result.account.id) {
            return res.status(400).json({ error: 'Не можна відгукнутися на власну пропозицію' });
        }

        // Anti-abuse: max 3 active matches simultaneously
        const activeMatches = await TrafficMatch.count({
            where: {
                [Op.or]: [
                    { initiatorChannelId: result.account.id },
                    { targetChannelId: result.account.id },
                ],
                status: { [Op.in]: ['pending', 'accepted'] },
            },
        });

        if (activeMatches >= 3) {
            return res.status(429).json({
                error: 'Максимум 3 активних обміни одночасно',
            });
        }

        // Create match
        const match = await TrafficMatch.create({
            offerId: offer.id,
            initiatorChannelId: result.account.id,
            targetChannelId: offer.channelId,
            status: 'pending',
        });

        // Update offer status
        await offer.update({ status: 'matched' });

        // Log action
        await ActionLog.create({
            userId: result.user.id,
            action: 'match_created',
            details: { matchId: match.id, offerId: offer.id },
            ip: req.ip,
        });

        res.status(201).json({ match });
    } catch (error) {
        console.error('Respond to offer error:', error);
        res.status(500).json({ error: 'Failed to respond to offer' });
    }
});

module.exports = router;
