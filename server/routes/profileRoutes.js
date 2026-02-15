const router = require('express').Router();
const { sequelize, User, YouTubeAccount, TrafficMatch, Review, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { validate: isUuid } = require('uuid');

async function getUser(firebaseUid, transaction = null) {
    return User.findOne({ where: { firebaseUid }, ...(transaction ? { transaction } : {}) });
}

function normalizeIp(rawIp) {
    const value = String(rawIp || '').trim();
    if (!value) return '';
    if (value.startsWith('::ffff:')) return value.replace('::ffff:', '');
    if (value === '::1') return '127.0.0.1';
    return value;
}

function resolveClientIp(req) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const realIp = String(req.headers['x-real-ip'] || '').trim();
    const cfIp = String(req.headers['cf-connecting-ip'] || '').trim();
    const candidate = cfIp || forwarded || realIp || req.ip || '';
    return normalizeIp(candidate);
}

function isLocalOrPrivateIp(ip) {
    if (!ip) return true;
    if (ip === '127.0.0.1' || ip === '0.0.0.0') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
    if (ip.includes(':')) return ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fd') || ip.startsWith('fc');
    return false;
}

router.get('/me', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id },
            attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'totalViews', 'niche', 'language', 'country', 'verified', 'isActive'],
            order: [['createdAt', 'DESC']],
        });

        return res.json({
            profile: {
                ...user.toJSON(),
                channels,
            },
        });
    } catch (error) {
        console.error('Get own profile error:', error);
        return res.status(500).json({ error: 'Failed to get profile' });
    }
});

router.get('/network-info', auth, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const user = await getUser(req.firebaseUser.uid, transaction);
            if (!user) {
                return { error: { status: 404, body: { error: 'User not found' } } };
            }

            const clientIp = resolveClientIp(req);
            const fromHeaders = {
                ip: clientIp || 'Невідомо',
                city: String(req.headers['cf-ipcity'] || '').trim() || null,
                provider: String(req.headers['cf-isp'] || '').trim() || null,
                country: String(req.headers['cf-ipcountry'] || '').trim() || null,
                source: 'headers',
            };

            let networkInfo = fromHeaders;

            if (!isLocalOrPrivateIp(clientIp)) {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 1800);
                    const response = await fetch(`https://ipwho.is/${encodeURIComponent(clientIp)}`, {
                        signal: controller.signal,
                        headers: { accept: 'application/json' },
                    });
                    clearTimeout(timeout);
                    if (response.ok) {
                        const body = await response.json();
                        if (body?.success !== false) {
                            networkInfo = {
                                ip: body.ip || fromHeaders.ip,
                                city: body.city || fromHeaders.city || null,
                                provider: body.connection?.isp || fromHeaders.provider || null,
                                country: body.country || fromHeaders.country || null,
                                source: 'ipwhois',
                            };
                        }
                    }
                } catch {
                    // fallback to headers only
                }
            }

            await ActionLog.create({
                userId: user.id,
                action: 'profile_network_info_viewed',
                details: {
                    ip: networkInfo.ip,
                    source: networkInfo.source,
                },
                ip: req.ip,
            }, { transaction });

            return {
                networkInfo,
                checkedAt: new Date().toISOString(),
            };
        });

        if (payload.error) {
            return res.status(payload.error.status).json(payload.error.body);
        }

        return res.json(payload);
    } catch (error) {
        console.error('Get network info error:', error);
        return res.status(500).json({ error: 'Failed to get network info' });
    }
});

router.get('/:userId', async (req, res) => {
    try {
        if (!isUuid(req.params.userId)) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const user = await User.findByPk(req.params.userId, {
            attributes: { exclude: ['firebaseUid'] },
        });
        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const privacy = user.privacySettings || {};
        const profile = {
            id: user.id,
            displayName: user.displayName,
            photoURL: user.photoURL,
            badges: user.badges || [],
            createdAt: user.createdAt,
        };

        const conditionalFields = [
            'bio',
            'location',
            'languages',
            'birthYear',
            'gender',
            'professionalRole',
            'companyName',
            'website',
            'socialLinks',
        ];

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
            } catch (_e) {
                // Not logged in or invalid token -> treat as public.
            }
        }

        for (const field of conditionalFields) {
            const visibility = privacy[field] || 'public';
            if (visibility === 'public') {
                profile[field] = user[field];
            } else if (visibility === 'verified' && requesterVerified) {
                profile[field] = user[field];
            }
        }

        const channels = await YouTubeAccount.findAll({
            where: { userId: user.id, isActive: true },
            attributes: ['id', 'channelId', 'channelTitle', 'channelAvatar', 'subscribers', 'totalViews', 'niche', 'verified'],
        });

        const channelIds = channels.map((channel) => channel.id);
        let completedExchanges = 0;
        let avgRating = 0;
        let reviewCount = 0;

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
                ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount) * 10) / 10
                : 0;
        }

        profile.stats = { completedExchanges, avgRating, reviewCount };
        profile.channels = channels;

        return res.json({ profile });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({ error: 'Failed to get profile' });
    }
});

router.put('/', auth, async (req, res) => {
    try {
        const payload = await sequelize.transaction(async (transaction) => {
            const user = await getUser(req.firebaseUser.uid, transaction);
            if (!user) return { error: { status: 404, body: { error: 'User not found' } } };

            const allowed = ['displayName', 'bio', 'location', 'languages', 'birthYear', 'gender', 'professionalRole', 'companyName', 'website', 'socialLinks'];

            const updates = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            await user.update(updates, { transaction });
            await ActionLog.create({
                userId: user.id,
                action: 'profile_updated',
                details: { fields: Object.keys(updates) },
                ip: req.ip,
            }, { transaction });

            return { user };
        });

        if (payload.error) return res.status(payload.error.status).json(payload.error.body);
        return res.json({ user: payload.user });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.put('/privacy', auth, async (req, res) => {
    try {
        const { privacySettings } = req.body;
        if (!privacySettings || typeof privacySettings !== 'object') {
            return res.status(400).json({ error: 'Invalid privacy settings' });
        }

        const validValues = ['public', 'verified', 'private'];
        for (const value of Object.values(privacySettings)) {
            if (!validValues.includes(value)) {
                return res.status(400).json({ error: `Невірне значення приватності: ${value}` });
            }
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const user = await getUser(req.firebaseUser.uid, transaction);
            if (!user) return { error: { status: 404, body: { error: 'User not found' } } };

            const nextPrivacy = { ...user.privacySettings, ...privacySettings };
            await user.update({ privacySettings: nextPrivacy }, { transaction });
            await ActionLog.create({
                userId: user.id,
                action: 'profile_privacy_updated',
                details: { keys: Object.keys(privacySettings) },
                ip: req.ip,
            }, { transaction });

            return { privacySettings: nextPrivacy };
        });

        if (payload.error) return res.status(payload.error.status).json(payload.error.body);
        return res.json({ privacySettings: payload.privacySettings });
    } catch (error) {
        console.error('Update privacy error:', error);
        return res.status(500).json({ error: 'Failed to update privacy' });
    }
});

router.post('/avatar', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { avatar } = req.body;
        if (!avatar) return res.status(400).json({ error: 'No avatar data' });

        const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = avatar.startsWith('data:image/png') ? 'png' : 'jpg';
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
        const filename = `${user.id}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), base64Data, 'base64');

        const photoURL = `/uploads/avatars/${filename}`;

        await sequelize.transaction(async (transaction) => {
            await user.update({ photoURL }, { transaction });
            await ActionLog.create({
                userId: user.id,
                action: 'profile_avatar_updated',
                details: { filename },
                ip: req.ip,
            }, { transaction });
        });

        return res.json({ photoURL });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

router.put('/notifications', auth, async (req, res) => {
    try {
        const { notificationPrefs } = req.body;
        if (!notificationPrefs || typeof notificationPrefs !== 'object') {
            return res.status(400).json({ error: 'Invalid notification prefs' });
        }

        const payload = await sequelize.transaction(async (transaction) => {
            const user = await getUser(req.firebaseUser.uid, transaction);
            if (!user) return { error: { status: 404, body: { error: 'User not found' } } };

            const nextPrefs = { ...user.notificationPrefs, ...notificationPrefs };
            await user.update({ notificationPrefs: nextPrefs }, { transaction });
            await ActionLog.create({
                userId: user.id,
                action: 'profile_notifications_updated',
                details: { keys: Object.keys(notificationPrefs) },
                ip: req.ip,
            }, { transaction });
            return { notificationPrefs: nextPrefs };
        });

        if (payload.error) return res.status(payload.error.status).json(payload.error.body);
        return res.json({ notificationPrefs: payload.notificationPrefs });
    } catch (error) {
        console.error('Update notification prefs error:', error);
        return res.status(500).json({ error: 'Failed to update notifications' });
    }
});

module.exports = router;
