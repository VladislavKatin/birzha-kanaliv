const router = require('express').Router();
const { User, YouTubeAccount } = require('../models');
const auth = require('../middleware/auth');

/**
 * @route POST /api/auth/login
 * @description Login or register user via Firebase token. Creates DB user on first login.
 * @access Private (Firebase token required)
 * @returns {Object} user - User data + YouTube account info
 */
router.post('/login', auth, async (req, res) => {
    try {
        const { uid, email, name, picture } = req.firebaseUser;

        let user = await User.findOne({ where: { firebaseUid: uid } });

        if (!user) {
            user = await User.create({
                firebaseUid: uid,
                email,
                displayName: name || email.split('@')[0],
                photoURL: picture || null,
            });
        }

        // Check if user has connected YouTube
        const youtubeAccount = await YouTubeAccount.findOne({
            where: { userId: user.id },
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: user.createdAt,
            },
            youtubeConnected: !!youtubeAccount,
            youtubeAccount: youtubeAccount
                ? {
                    channelId: youtubeAccount.channelId,
                    channelTitle: youtubeAccount.channelTitle,
                    channelAvatar: youtubeAccount.channelAvatar,
                    subscribers: youtubeAccount.subscribers,
                }
                : null,
        });
    } catch (error) {
        console.error('Auth login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * @route GET /api/auth/me
 * @description Get current authenticated user info with YouTube account
 * @access Private
 * @returns {Object} user, youtubeConnected, youtubeAccount
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { firebaseUid: req.firebaseUser.uid },
            include: [{ model: YouTubeAccount, as: 'youtubeAccount' }],
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: user.createdAt,
            },
            youtubeConnected: !!user.youtubeAccount,
            youtubeAccount: user.youtubeAccount || null,
        });
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;
