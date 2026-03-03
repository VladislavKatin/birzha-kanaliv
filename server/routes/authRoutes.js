const router = require('express').Router();
const { sequelize, User, YouTubeAccount, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const { logInfo, logError } = require('../services/logger');
const { isNonEmptyString } = require('../utils/validators');

async function resolveOrCreateUser({ transaction, uid, email, name, picture }) {
    let user = await User.findOne({
        where: { firebaseUid: uid },
        transaction,
    });

    if (user) {
        const nextDisplayName = name || user.displayName || email.split('@')[0];
        const nextPhotoUrl = picture || user.photoURL || null;

        if (
            user.email !== email ||
            user.displayName !== nextDisplayName ||
            user.photoURL !== nextPhotoUrl
        ) {
            const emailOwner = await User.findOne({
                where: { email },
                transaction,
            });

            if (emailOwner && emailOwner.id !== user.id) {
                throw new Error('EMAIL_ALREADY_LINKED_TO_ANOTHER_USER');
            }

            await user.update({
                email,
                displayName: nextDisplayName,
                photoURL: nextPhotoUrl,
            }, { transaction });
        }

        return { user, created: false };
    }

    user = await User.findOne({
        where: { email },
        transaction,
    });

    if (user) {
        const nextDisplayName = user.displayName || name || email.split('@')[0];
        const nextPhotoUrl = picture || user.photoURL || null;

        await user.update({
            firebaseUid: uid,
            displayName: nextDisplayName,
            photoURL: nextPhotoUrl,
        }, { transaction });

        return { user, created: false };
    }

    user = await User.create({
        firebaseUid: uid,
        email,
        displayName: name || email.split('@')[0],
        photoURL: picture || null,
    }, { transaction });

    return { user, created: true };
}

/**
 * @route POST /api/auth/login
 * @description Login or register user via Firebase token. Creates DB user on first login.
 * @access Private (Firebase token required)
 * @returns {Object} user - User data + YouTube account info
 */
router.post('/login', auth, async (req, res) => {
    try {
        console.log('FIREBASE USER:', req.firebaseUser);
        const { uid, email, name, picture } = req.firebaseUser;
        if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
            return res.status(400).json({ error: 'Некоректні дані авторизації' });
        }
        logInfo('auth.login.request', { firebaseUid: uid });

        let user;
        let created = false;

        await sequelize.transaction(async (transaction) => {
            const resolved = await resolveOrCreateUser({
                transaction,
                uid,
                email,
                name,
                picture,
            });
            user = resolved.user;
            created = resolved.created;
            console.log('DB USER:', {
                id: user.id,
                firebaseUid: user.firebaseUid,
                email: user.email,
                displayName: user.displayName,
                created,
            });

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
        if (error.message === 'EMAIL_ALREADY_LINKED_TO_ANOTHER_USER') {
            return res.status(409).json({ error: 'Email already linked to another user' });
        }
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
