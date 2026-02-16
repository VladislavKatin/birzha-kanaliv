const router = require('express').Router();
const { sequelize, User, YouTubeAccount, TrafficMatch, TrafficOffer, Review, ActionLog, Message } = require('../models');
const auth = require('../middleware/auth');

/**
 * Get user by Firebase UID.
 * @param {string} firebaseUid
 * @returns {Model|null} User instance
 */
async function getUser(firebaseUid) {
    return User.findOne({ where: { firebaseUid } });
}

/**
 * @route GET /api/gdpr/export
 * @description Export all user data as downloadable JSON (GDPR compliance)
 * @access Private
 * @returns {File} JSON file with user, channels, offers, matches, reviews, messages, logs
 */
router.get('/export', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id },
            attributes: { exclude: ['accessToken', 'refreshToken'] },
        });
        const channelIds = channels.map((channel) => channel.id);

        const offers = channelIds.length > 0
            ? await TrafficOffer.findAll({ where: { channelId: channelIds } })
            : [];

        const matches = channelIds.length > 0
            ? await TrafficMatch.findAll({
                where: {
                    [require('sequelize').Op.or]: [
                        { initiatorChannelId: channelIds },
                        { targetChannelId: channelIds },
                    ],
                },
            })
            : [];

        const reviews = channelIds.length > 0
            ? await Review.findAll({
                where: {
                    [require('sequelize').Op.or]: [
                        { fromChannelId: channelIds },
                        { toChannelId: channelIds },
                    ],
                },
            })
            : [];

        const messages = await Message.findAll({
            where: { senderUserId: user.id },
        });

        const logs = await ActionLog.findAll({
            where: { userId: user.id },
            order: [['createdAt', 'DESC']],
            limit: 500,
        });

        const exportData = {
            exportedAt: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                bio: user.bio,
                location: user.location,
                languages: user.languages,
                gender: user.gender,
                professionalRole: user.professionalRole,
                companyName: user.companyName,
                website: user.website,
                socialLinks: user.socialLinks,
                privacySettings: user.privacySettings,
                badges: user.badges,
                notificationPrefs: user.notificationPrefs,
                createdAt: user.createdAt,
            },
            channels: channels.map((channel) => channel.toJSON()),
            offers: offers.map((offer) => offer.toJSON()),
            matches: matches.map((match) => match.toJSON()),
            reviews: reviews.map((review) => review.toJSON()),
            messages: messages.map((message) => ({ id: message.id, content: message.content, createdAt: message.createdAt })),
            actionLogs: logs.map((log) => log.toJSON()),
        };

        res.setHeader('Content-Disposition', 'attachment; filename="my-data-export.json"');
        res.setHeader('Content-Type', 'application/json');
        return res.json(exportData);
    } catch (error) {
        console.error('GDPR export error:', error);
        return res.status(500).json({ error: 'Failed to export data' });
    }
});

/**
 * @route DELETE /api/gdpr/account
 * @description Anonymize and delete user account (GDPR right to erasure)
 * @access Private
 * @param {string} confirmation - Must be 'DELETE_MY_ACCOUNT'
 * @returns {Object} message
 */
router.delete('/account', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { confirmation } = req.body;
        if (confirmation !== 'DELETE_MY_ACCOUNT') {
            return res.status(400).json({ error: 'Для підтвердження надішліть { confirmation: "DELETE_MY_ACCOUNT" }' });
        }

        await sequelize.transaction(async (transaction) => {
            await user.update({
                displayName: 'Видалений користувач',
                email: `deleted_${user.id}@deleted.local`,
                photoURL: null,
                bio: null,
                location: null,
                languages: [],
                birthYear: null,
                gender: null,
                professionalRole: null,
                companyName: null,
                website: null,
                socialLinks: {},
                privacySettings: {},
                badges: [],
                notificationPrefs: {},
            }, { transaction });

            await YouTubeAccount.destroy({ where: { userId: user.id }, transaction });

            await ActionLog.create({
                userId: user.id,
                action: 'account_deleted',
                details: { timestamp: new Date().toISOString() },
                ip: req.ip,
            }, { transaction });
        });

        return res.json({ message: 'Акаунт видалено. Ваші дані анонімізовані.' });
    } catch (error) {
        console.error('GDPR delete error:', error);
        return res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
