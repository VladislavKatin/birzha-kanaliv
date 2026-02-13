const router = require('express').Router();
const { User, YouTubeAccount, TrafficMatch, Review } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

/**
 * Get user by Firebase UID.
 * @param {string} firebaseUid
 * @returns {Model|null} User instance
 */
async function getUser(firebaseUid) {
    return User.findOne({ where: { firebaseUid } });
}

/**
 * @route GET /api/profile/:userId
 * @description Get public profile with privacy-filtered fields, channels, and stats
 * @access Public (optional auth for verified-only fields)
 * @param {string} userId - User UUID
 * @returns {Object} profile - Filtered profile with stats and channels
 */
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId, {
            attributes: { exclude: ['firebaseUid'] },
        });
        if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

        const privacy = user.privacySettings || {};

        // Filter fields by privacy
        const profile = {
            id: user.id,
            displayName: user.displayName,
            photoURL: user.photoURL,
            badges: user.badges || [],
            createdAt: user.createdAt,
        };

        // Apply privacy: 'public' (default), 'verified', 'private'
        const conditionalFields = ['bio', 'location', 'languages', 'birthYear', 'gender',
            'professionalRole', 'companyName', 'website', 'socialLinks'];

        // Check if requester is verified (has verified channel)
        let requesterVerified = false;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const admin = require('../config/firebase');
                const token = authHeader.replace('Bearer ', '');
                const decoded = await admin.auth().verifyIdToken(token);
                const requester = await User.findOne({ where: { firebaseUid: decoded.uid } });
                if (requester) {
                    const verifiedChannel = await YouTubeAccount.findOne({
                        where: { userId: requester.id, verified: true },
                    });
                    requesterVerified = !!verifiedChannel;
                }
            } catch (e) { /* not logged in or invalid token — treat as public */ }
        }

        for (const field of conditionalFields) {
            const visibility = privacy[field] || 'public';
            if (visibility === 'public') {
                profile[field] = user[field];
            } else if (visibility === 'verified' && requesterVerified) {
                profile[field] = user[field];
            }
            // 'private' fields are never exposed
        }

        // Channels
        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id, isActive: true },
            attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'totalViews', 'niche', 'verified'],
        });

        // Stats
        const channelIds = channels.map(c => c.id);
        let completedExchanges = 0, avgRating = 0, reviewCount = 0;

        if (channelIds.length > 0) {
            completedExchanges = await TrafficMatch.count({
                where: {
                    [Op.or]: [
                        { initiatorChannelId: { [Op.in]: channelIds } },
                        { targetChannelId: { [Op.in]: channelIds } },
                    ],
                    status: 'completed',
                },
            });

            const reviews = await Review.findAll({
                where: { toChannelId: { [Op.in]: channelIds } },
                attributes: ['rating'],
            });
            reviewCount = reviews.length;
            avgRating = reviewCount > 0
                ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
                : 0;
        }

        profile.stats = { completedExchanges, avgRating, reviewCount };
        profile.channels = channels;

        res.json({ profile });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * @route PUT /api/profile
 * @description Update own profile fields (displayName, bio, location, etc.)
 * @access Private
 * @returns {Object} user
 */
router.put('/', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allowed = ['displayName', 'bio', 'location', 'languages', 'birthYear',
            'gender', 'professionalRole', 'companyName', 'website', 'socialLinks'];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        await user.update(updates);
        res.json({ user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @route PUT /api/profile/privacy
 * @description Update privacy settings per field (public/verified/private)
 * @access Private
 * @param {Object} privacySettings - { fieldName: 'public'|'verified'|'private' }
 * @returns {Object} privacySettings
 */
router.put('/privacy', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { privacySettings } = req.body;
        if (!privacySettings || typeof privacySettings !== 'object') {
            return res.status(400).json({ error: 'Invalid privacy settings' });
        }

        // Validate values
        const validValues = ['public', 'verified', 'private'];
        for (const val of Object.values(privacySettings)) {
            if (!validValues.includes(val)) {
                return res.status(400).json({ error: `Невірне значення приватності: ${val}` });
            }
        }

        await user.update({ privacySettings: { ...user.privacySettings, ...privacySettings } });
        res.json({ privacySettings: user.privacySettings });
    } catch (error) {
        console.error('Update privacy error:', error);
        res.status(500).json({ error: 'Failed to update privacy' });
    }
});

/**
 * @route POST /api/profile/avatar
 * @description Upload avatar as base64 encoded image
 * @access Private
 * @param {string} avatar - Base64 encoded image (data URI)
 * @returns {Object} photoURL
 */
router.post('/avatar', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Simple base64 upload (no multer needed for MVP)
        const { avatar } = req.body; // base64 string
        if (!avatar) return res.status(400).json({ error: 'No avatar data' });

        // Save to uploads dir
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = avatar.startsWith('data:image/png') ? 'png' : 'jpg';
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
        const filename = `${user.id}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), base64Data, 'base64');

        const photoURL = `/uploads/avatars/${filename}`;
        await user.update({ photoURL });

        res.json({ photoURL });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

/**
 * @route PUT /api/profile/notifications
 * @description Update notification preferences (email, telegram, webpush)
 * @access Private
 * @param {Object} notificationPrefs - Preference flags
 * @returns {Object} notificationPrefs
 */
router.put('/notifications', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { notificationPrefs } = req.body;
        if (!notificationPrefs || typeof notificationPrefs !== 'object') {
            return res.status(400).json({ error: 'Invalid notification prefs' });
        }

        await user.update({ notificationPrefs: { ...user.notificationPrefs, ...notificationPrefs } });
        res.json({ notificationPrefs: user.notificationPrefs });
    } catch (error) {
        console.error('Update notification prefs error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

module.exports = router;
