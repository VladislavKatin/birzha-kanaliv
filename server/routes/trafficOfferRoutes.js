const router = require('express').Router();
const { sequelize, TrafficOffer, YouTubeAccount, User, TrafficMatch, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { getUserChannelsByFirebaseUid, resolveActionChannelId } = require('../services/channelAccessService');

function handleChannelSelectionError(res, errorCode, noChannelMessage) {
    if (errorCode === 'NO_CHANNELS_CONNECTED') {
        return res.status(400).json({ error: noChannelMessage });
    }
    if (errorCode === 'CHANNEL_NOT_OWNED') {
        return res.status(403).json({ error: 'Not your channel' });
    }
    if (errorCode === 'CHANNEL_ID_REQUIRED') {
        return res.status(400).json({ error: 'channelId is required when multiple channels are connected' });
    }
    return res.status(400).json({ error: 'Invalid channel selection' });
}

router.post('/', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        const selected = resolveActionChannelId({
            requestedChannelId: req.body.channelId,
            channelIds: result.channelIds,
        });

        if (selected.error) {
            return handleChannelSelectionError(
                res,
                selected.error,
                'Connect a YouTube channel before creating an offer'
            );
        }

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyOffers = await TrafficOffer.count({
            where: {
                channelId: selected.channelId,
                createdAt: { [Op.gte]: oneWeekAgo },
            },
        });

        if (weeklyOffers >= 5) {
            return res.status(429).json({
                error: 'Maximum 5 offers per week. Try again later.',
            });
        }

        const { type, description, niche, language, minSubscribers, maxSubscribers } = req.body;

        if (!type || !['subs', 'views'].includes(type)) {
            return res.status(400).json({ error: 'Type must be "subs" or "views"' });
        }

        const transaction = await sequelize.transaction();

        try {
            const offer = await TrafficOffer.create({
                channelId: selected.channelId,
                type,
                description,
                niche,
                language,
                minSubscribers: minSubscribers || 0,
                maxSubscribers: maxSubscribers || 0,
                status: 'open',
            }, { transaction });

            await ActionLog.create({
                userId: result.user.id,
                action: 'offer_created',
                details: { offerId: offer.id, type, channelId: selected.channelId },
                ip: req.ip,
            }, { transaction });

            await transaction.commit();
            res.status(201).json({ offer });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});

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

router.get('/my', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (result.channelIds.length === 0) {
            return res.status(404).json({ error: 'No channel connected' });
        }

        const offers = await TrafficOffer.findAll({
            where: { channelId: { [Op.in]: result.channelIds } },
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

        res.json({ offers, myChannelIds: result.channelIds });
    } catch (error) {
        console.error('Get my offers error:', error);
        res.status(500).json({ error: 'Failed to get offers' });
    }
});

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

router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) return res.status(404).json({ error: 'User not found' });
        if (result.channelIds.length === 0) return res.status(404).json({ error: 'No channel connected' });

        const offer = await TrafficOffer.findByPk(req.params.id);
        if (!offer) return res.status(404).json({ error: 'Offer not found' });
        if (!result.channelIds.includes(offer.channelId)) {
            return res.status(403).json({ error: 'Not your offer' });
        }

        const transaction = await sequelize.transaction();
        try {
            await offer.destroy({ transaction });
            await ActionLog.create({
                userId: result.user.id,
                action: 'offer_deleted',
                details: { offerId: offer.id, channelId: offer.channelId },
                ip: req.ip,
            }, { transaction });
            await transaction.commit();
            res.json({ message: 'Offer deleted' });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

router.post('/:id/respond', auth, async (req, res) => {
    try {
        const result = await getUserChannelsByFirebaseUid({
            User,
            YouTubeAccount,
            firebaseUid: req.firebaseUser.uid,
        });

        if (!result) {
            return res.status(404).json({ error: 'User not found' });
        }

        const selected = resolveActionChannelId({
            requestedChannelId: req.body.channelId,
            channelIds: result.channelIds,
        });

        if (selected.error) {
            return handleChannelSelectionError(
                res,
                selected.error,
                'Connect a YouTube channel before responding to an offer'
            );
        }

        const offer = await TrafficOffer.findByPk(req.params.id);
        if (!offer) return res.status(404).json({ error: 'Offer not found' });
        if (offer.status !== 'open') {
            return res.status(400).json({ error: 'Offer is no longer active' });
        }

        if (offer.channelId === selected.channelId) {
            return res.status(400).json({ error: 'Cannot respond to your own offer' });
        }

        const activeMatches = await TrafficMatch.count({
            where: {
                [Op.or]: [
                    { initiatorChannelId: selected.channelId },
                    { targetChannelId: selected.channelId },
                ],
                status: { [Op.in]: ['pending', 'accepted'] },
            },
        });

        if (activeMatches >= 3) {
            return res.status(429).json({
                error: 'Maximum 3 active exchanges at the same time',
            });
        }

        const transaction = await sequelize.transaction();

        try {
            const match = await TrafficMatch.create({
                offerId: offer.id,
                initiatorChannelId: selected.channelId,
                targetChannelId: offer.channelId,
                status: 'pending',
            }, { transaction });

            await offer.update({ status: 'matched' }, { transaction });

            await ActionLog.create({
                userId: result.user.id,
                action: 'match_created',
                details: { matchId: match.id, offerId: offer.id, initiatorChannelId: selected.channelId },
                ip: req.ip,
            }, { transaction });

            await transaction.commit();
            res.status(201).json({ match });
        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }
    } catch (error) {
        console.error('Respond to offer error:', error);
        res.status(500).json({ error: 'Failed to respond to offer' });
    }
});

module.exports = router;
