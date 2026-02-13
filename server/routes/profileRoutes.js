const router = require('express').Router();
const { User, YouTubeAccount, TrafficMatch, Review } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { validate: isUuid } = require('uuid');

async function getUser(firebaseUid) {
    return User.findOne({ where: { firebaseUid } });
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
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const allowed = ['displayName', 'bio', 'location', 'languages', 'birthYear', 'gender', 'professionalRole', 'companyName', 'website', 'socialLinks'];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        await user.update(updates);
        return res.json({ user });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.put('/privacy', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

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

        await user.update({ privacySettings: { ...user.privacySettings, ...privacySettings } });
        return res.json({ privacySettings: user.privacySettings });
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
        await user.update({ photoURL });

        return res.json({ photoURL });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

router.put('/notifications', auth, async (req, res) => {
    try {
        const user = await getUser(req.firebaseUser.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { notificationPrefs } = req.body;
        if (!notificationPrefs || typeof notificationPrefs !== 'object') {
            return res.status(400).json({ error: 'Invalid notification prefs' });
        }

        await user.update({ notificationPrefs: { ...user.notificationPrefs, ...notificationPrefs } });
        return res.json({ notificationPrefs: user.notificationPrefs });
    } catch (error) {
        console.error('Update notification prefs error:', error);
        return res.status(500).json({ error: 'Failed to update notifications' });
    }
});

module.exports = router;
