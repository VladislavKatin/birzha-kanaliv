const router = require('express').Router();
const { sequelize, TrafficOffer, YouTubeAccount, User, TrafficMatch, ActionLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { getUserChannelsByFirebaseUid, resolveActionChannelId } = require('../services/channelAccessService');
const { getSystemLimits } = require('../services/systemLimitsService');
const { ensureAutoOffersForChannels } = require('../services/autoOfferService');
const { sendTelegramNotificationToUser } = require('../services/telegramService');
const { normalizeOptionalString, parseInteger, isEnumValue } = require('../utils/validators');

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

function validateOfferPayload(body) {
    const type = body?.type;
    const description = normalizeOptionalString(body?.description);
    const niche = normalizeOptionalString(body?.niche);
    const language = normalizeOptionalString(body?.language);
    const minSubscribers = parseInteger(body?.minSubscribers, 0);
    const maxSubscribers = parseInteger(body?.maxSubscribers, 0);

    if (!isEnumValue(type, ['subs', 'views'])) {
        return { error: 'Type must be "subs" or "views"' };
    }

    if (description && description.length > 4000) {
        return { error: 'Опис занадто довгий (максимум 4000 символів)' };
    }
    if (niche && niche.length > 80) {
        return { error: 'Ніша занадто довга (максимум 80 символів)' };
    }
    if (language && language.length > 24) {
        return { error: 'Значення мови занадто довге (максимум 24 символи)' };
    }
    if (minSubscribers < 0 || maxSubscribers < 0) {
        return { error: 'Кількість підписників не може бути від’ємною' };
    }
    if (maxSubscribers > 0 && minSubscribers > maxSubscribers) {
        return { error: 'Мінімальна кількість підписників не може перевищувати максимальну' };
    }

    return {
        value: {
            type,
            description,
            niche,
            language,
            minSubscribers,
            maxSubscribers,
        },
    };
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

        if (process.env.NODE_ENV !== 'test') {
            const limitsConfig = await getSystemLimits({ ActionLog });
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const weeklyOffers = await TrafficOffer.count({
                where: {
                    channelId: selected.channelId,
                    createdAt: { [Op.gte]: oneWeekAgo },
                },
            });

            if (weeklyOffers >= limitsConfig.limits.offersPerWeek) {
                try {
                    await sequelize.transaction(async (transaction) => {
                        await ActionLog.create({
                            userId: result.user.id,
                            action: 'rate_limit_offer_create_blocked',
                            details: {
                                channelId: selected.channelId,
                                weeklyOffers,
                                limit: limitsConfig.limits.offersPerWeek,
                            },
                            ip: req.ip,
                        }, { transaction });
                    });
                } catch (auditError) {
                    console.error('Failed to write rate-limit audit log:', auditError);
                }
                return res.status(429).json({
                    error: `Maximum ${limitsConfig.limits.offersPerWeek} offers per week. Try again later.`,
                });
            }
        }

        const validated = validateOfferPayload(req.body || {});
        if (validated.error) {
            return res.status(400).json({ error: validated.error });
        }
        const { type, description, niche, language, minSubscribers, maxSubscribers } = validated.value;

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
        const { type, niche, language, minSubs, maxSubs, page = 1, limit = 20, includeAll, status } = req.query;
        const where = {};
        const includeAllEnabled = ['1', 'true', 'yes'].includes(String(includeAll || '').toLowerCase());

        if (status) {
            where.status = status;
        }

        if (includeAllEnabled) {
            await ensureAutoOffersForChannels({
                sequelize,
                YouTubeAccount,
                TrafficOffer,
                ActionLog,
                reason: 'offers_catalog_opened',
            });
        }

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
                    where: {
                        isActive: true,
                        isFlagged: false,
                        channelId: { [Op.notLike]: 'UC_DEMO_%' },
                    },
                    attributes: [
                        'id',
                        'channelId',
                        'channelTitle',
                        'channelAvatar',
                        'description',
                        'subscribers',
                        'totalViews',
                        'totalVideos',
                        'avgViews30d',
                        'subGrowth30d',
                        'averageWatchTime',
                        'ctr',
                        'niche',
                        'language',
                        'country',
                    ],
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
        const offer = await TrafficOffer.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: YouTubeAccount,
                    as: 'channel',
                    where: {
                        isActive: true,
                        isFlagged: false,
                        channelId: { [Op.notLike]: 'UC_DEMO_%' },
                    },
                    attributes: [
                        'id',
                        'channelId',
                        'channelTitle',
                        'channelAvatar',
                        'description',
                        'subscribers',
                        'totalViews',
                        'totalVideos',
                        'avgViews30d',
                        'subGrowth30d',
                        'averageWatchTime',
                        'ctr',
                        'niche',
                        'language',
                        'country',
                    ],
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

        const payload = await sequelize.transaction(async (transaction) => {
            const offer = await TrafficOffer.findByPk(req.params.id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!offer) {
                return { error: { status: 404, body: { error: 'Offer not found' } } };
            }
            if (offer.channelId === selected.channelId) {
                return { error: { status: 400, body: { error: 'Cannot respond to your own offer' } } };
            }

            // No hard cap for creating new offer responses.
            // Users can negotiate multiple exchanges in parallel.

            const existing = await TrafficMatch.findOne({
                where: {
                    offerId: offer.id,
                    initiatorChannelId: selected.channelId,
                    status: { [Op.in]: ['pending', 'accepted'] },
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (existing) {
                await ActionLog.create({
                    userId: result.user.id,
                    action: 'match_respond_idempotent_hit',
                    details: { matchId: existing.id, offerId: offer.id, initiatorChannelId: selected.channelId },
                    ip: req.ip,
                }, { transaction });

                return { match: existing, idempotent: true };
            }

            const match = await TrafficMatch.create({
                offerId: offer.id,
                initiatorChannelId: selected.channelId,
                targetChannelId: offer.channelId,
                status: 'pending',
            }, { transaction });

            await ActionLog.create({
                userId: result.user.id,
                action: 'match_created',
                details: { matchId: match.id, offerId: offer.id, initiatorChannelId: selected.channelId },
                ip: req.ip,
            }, { transaction });

            return { match, idempotent: false };
        });

        if (payload.error) {
            return res.status(payload.error.status).json(payload.error.body);
        }

        if (!payload.idempotent) {
            try {
                const [targetChannel, initiatorChannel] = await Promise.all([
                    YouTubeAccount.findByPk(payload.match.targetChannelId, { attributes: ['userId', 'channelTitle'] }),
                    YouTubeAccount.findByPk(payload.match.initiatorChannelId, { attributes: ['channelTitle'] }),
                ]);

                if (targetChannel?.userId) {
                    const initiatorTitle = initiatorChannel?.channelTitle || 'Інший канал';
                    const targetTitle = targetChannel.channelTitle || 'Ваш канал';
                    await sendTelegramNotificationToUser(
                        targetChannel.userId,
                        `Новий запит на обмін для каналу "${targetTitle}" від "${initiatorTitle}". Перевірте вхідні запити у кабінеті.`
                    );
                }
            } catch (notifyError) {
                console.error('Telegram notify (new match) failed:', notifyError.message);
            }
        }

        return res.status(payload.idempotent ? 200 : 201).json({ match: payload.match, idempotent: payload.idempotent });
    } catch (error) {
        console.error('Respond to offer error:', error);
        res.status(500).json({ error: 'Failed to respond to offer' });
    }
});

module.exports = router;

