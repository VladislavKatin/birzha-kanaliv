const router = require('express').Router();
const { User, YouTubeAccount, TrafficMatch, TrafficOffer, Review, ActionLog, ChatRoom, Message } = require('../models');
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

        // Gather all user data
        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id },
            attributes: { exclude: ['accessToken', 'refreshToken'] },
        });
        const channelIds = channels.map(c => c.id);

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
            channels: channels.map(c => c.toJSON()),
            offers: offers.map(o => o.toJSON()),
            matches: matches.map(m => m.toJSON()),
            reviews: reviews.map(r => r.toJSON()),
            messages: messages.map(m => ({ id: m.id, content: m.content, createdAt: m.createdAt })),
            actionLogs: logs.map(l => l.toJSON()),
        };

        res.setHeader('Content-Disposition', 'attachment; filename="my-data-export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
    } catch (error) {
        console.error('GDPR export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
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

        // Anonymize user data
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
        });

        // Delete channels (cascade removes offers, matches are preserved with anonymized references)
        await YouTubeAccount.destroy({ where: { userId: user.id } });

        // Log the action
        await ActionLog.create({
            userId: user.id,
            action: 'account_deleted',
            details: { timestamp: new Date().toISOString() },
            ip: req.ip,
        });

        res.json({ message: 'Акаунт видалено. Ваші дані анонімізовані.' });
    } catch (error) {
        console.error('GDPR delete error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;
