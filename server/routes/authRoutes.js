const router = require('express').Router();
const { sequelize, User, YouTubeAccount, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const { logInfo, logError } = require('../services/logger');
const { isNonEmptyString } = require('../utils/validators');

/**
 * @route POST /api/auth/login
 * @description Login or register user via Firebase token. Creates DB user on first login.
 * @access Private (Firebase token required)
 * @returns {Object} user - User data + YouTube account info
 */
router.post('/login', auth, async (req, res) => {
    try {
        const { uid, email, name, picture } = req.firebaseUser;
        if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
            return res.status(400).json({ error: 'Некоректні дані авторизації' });
        }
        logInfo('auth.login.request', { firebaseUid: uid });

        let user;
        let created = false;

        await sequelize.transaction(async (transaction) => {
            const [resolvedUser, wasCreated] = await User.findOrCreate({
                where: { firebaseUid: uid },
                defaults: {
                    firebaseUid: uid,
                    email,
                    displayName: name || email.split('@')[0],
                    photoURL: picture || null,
                },
                transaction,
            });
            user = resolvedUser;
            created = wasCreated;

            await ActionLog.create({
                userId: user.id,
                action: created ? 'auth_login_created_user' : 'auth_login',
                details: { firebaseUid: uid },
                ip: req.ip,
            }, { transaction });
        });

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
                notificationPrefs: user.notificationPrefs || {},
                role: user.role,
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
        logInfo('auth.login.success', {
            firebaseUid: uid,
            userId: user.id,
            created,
            youtubeConnected: !!youtubeAccount,
        });
    } catch (error) {
        logError('auth.login.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
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
        logInfo('auth.me.request', { firebaseUid: req.firebaseUser.uid });
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
                notificationPrefs: user.notificationPrefs || {},
                role: user.role,
                createdAt: user.createdAt,
            },
            youtubeConnected: !!user.youtubeAccount,
            youtubeAccount: user.youtubeAccount || null,
        });
        logInfo('auth.me.success', {
            firebaseUid: req.firebaseUser.uid,
            userId: user.id,
            youtubeConnected: !!user.youtubeAccount,
        });
    } catch (error) {
        logError('auth.me.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

module.exports = router;
