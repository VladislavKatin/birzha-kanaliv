const router = require('express').Router();
const { sequelize, User, YouTubeAccount, ActionLog } = require('../models');
const auth = require('../middleware/auth');
const admin = require('../config/firebase');
const { logInfo, logError } = require('../services/logger');
const { isNonEmptyString } = require('../utils/validators');

function mapAuthLoginError(error) {
    if (error.message === 'EMAIL_ALREADY_LINKED_TO_ANOTHER_USER') {
        return {
            status: 409,
            body: { error: 'Email already linked to another user' },
        };
    }

    if (error?.name === 'SequelizeUniqueConstraintError') {
        return {
            status: 409,
            body: {
                error: 'Database uniqueness conflict during auth sync',
                details: error.errors?.map((item) => item.message).join('; ') || error.message,
            },
        };
    }

    if (error?.name === 'SequelizeValidationError') {
        return {
            status: 400,
            body: {
                error: 'Database validation failed during auth sync',
                details: error.errors?.map((item) => item.message).join('; ') || error.message,
            },
        };
    }

    if (error?.name === 'SequelizeDatabaseError') {
        return {
            status: 500,
            body: {
                error: 'Database error during auth sync',
                details: error.parent?.message || error.message,
            },
        };
    }

    return {
        status: 500,
        body: {
            error: 'Authentication failed',
            details: error.message,
        },
    };
}

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

async function buildAuthResponse(user) {
    const youtubeAccount = await YouTubeAccount.findOne({
        where: { userId: user.id },
    });

    return {
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
    };
}

async function syncFirebaseUser({ req, firebaseUser, logEvent }) {
    const { uid, email, name, picture } = firebaseUser;

    if (!isNonEmptyString(uid) || !isNonEmptyString(email)) {
        return {
            status: 400,
            body: { error: 'Некоректні дані авторизації' },
        };
    }

    logInfo(`${logEvent}.request`, { firebaseUid: uid });

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

        await ActionLog.create({
            userId: user.id,
            action: created ? `${logEvent.replace(/\./g, '_')}_created_user` : logEvent.replace(/\./g, '_'),
            details: { firebaseUid: uid },
            ip: req.ip,
        }, { transaction });
    });

    const payload = await buildAuthResponse(user);

    logInfo(`${logEvent}.success`, {
        firebaseUid: uid,
        userId: user.id,
        created,
        youtubeConnected: payload.youtubeConnected,
    });

    return { status: 200, body: payload };
}

function getBearerToken(req) {
    const authHeader = String(req.headers.authorization || '');
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim();
    }
    return null;
}

router.post('/login', auth, async (req, res) => {
    try {
        const result = await syncFirebaseUser({
            req,
            firebaseUser: req.firebaseUser,
            logEvent: 'auth.login',
        });
        res.status(result.status).json(result.body);
    } catch (error) {
        logError('auth.login.failed', {
            firebaseUid: req.firebaseUser?.uid || null,
            error,
        });
        const mappedError = mapAuthLoginError(error);
        res.status(mappedError.status).json(mappedError.body);
    }
});

router.post('/google', async (req, res) => {
    try {
        if (!admin.apps.length) {
            return res.status(503).json({ error: 'Сервіс авторизації не налаштований' });
        }

        const idToken = String(req.body?.idToken || getBearerToken(req) || '').trim();
        if (!idToken) {
            return res.status(400).json({ error: 'Firebase idToken is required' });
        }

        const decoded = await admin.auth().verifyIdToken(idToken);
        const result = await syncFirebaseUser({
            req,
            firebaseUser: decoded,
            logEvent: 'auth.google',
        });
        res.status(result.status).json(result.body);
    } catch (error) {
        logError('auth.google.failed', {
            error,
        });

        if (error?.code || /token/i.test(String(error?.message || ''))) {
            return res.status(401).json({
                error: 'invalid_token',
                details: error.message,
            });
        }

        const mappedError = mapAuthLoginError(error);
        res.status(mappedError.status).json(mappedError.body);
    }
});

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

        const payload = await buildAuthResponse(user);
        res.json(payload);
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
