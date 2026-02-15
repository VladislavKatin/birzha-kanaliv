const axios = require('axios');
const { sequelize, User, ActionLog } = require('../models');
const { verifyTelegramLinkToken } = require('./telegramLinkToken');

const TELEGRAM_API_URL = 'https://api.telegram.org';
const POLL_INTERVAL_MS = 3000;

let pollingOffset = 0;
let pollingTimer = null;
let pollingInFlight = false;

function getBotToken() {
    return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

function getBotUsername() {
    return String(process.env.TELEGRAM_BOT_USERNAME || '').replace('@', '').trim();
}

function isTelegramConfigured() {
    return !!getBotToken();
}

function getBotApiUrl(method) {
    return `${TELEGRAM_API_URL}/bot${getBotToken()}/${method}`;
}

async function sendTelegramMessage(chatId, text) {
    if (!isTelegramConfigured() || !chatId) {
        return { ok: false, reason: 'not_configured_or_chat_missing' };
    }

    try {
        await axios.post(getBotApiUrl('sendMessage'), {
            chat_id: chatId,
            text: String(text || ''),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        }, { timeout: 7000 });
        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            reason: error?.response?.data?.description || error.message || 'send_failed',
        };
    }
}

async function sendTelegramNotificationToUser(userId, text) {
    if (!isTelegramConfigured() || !userId) {
        return { ok: false, reason: 'not_configured_or_user_missing' };
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'notificationPrefs'] });
    if (!user) return { ok: false, reason: 'user_not_found' };

    const prefs = user.notificationPrefs || {};
    if (!prefs.telegram || !prefs.telegramChatId) {
        return { ok: false, reason: 'telegram_disabled_or_not_linked' };
    }

    return sendTelegramMessage(prefs.telegramChatId, text);
}

async function linkTelegramChatToUser({ userId, chatId, telegramUsername }) {
    return sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            return { ok: false, reason: 'user_not_found' };
        }

        const currentPrefs = user.notificationPrefs || {};
        const nextPrefs = {
            ...currentPrefs,
            telegram: true,
            telegramChatId: String(chatId),
            telegramUsername: telegramUsername ? String(telegramUsername) : null,
            telegramLinkedAt: new Date().toISOString(),
        };

        await user.update({ notificationPrefs: nextPrefs }, { transaction });
        await ActionLog.create({
            userId: user.id,
            action: 'telegram_linked',
            details: {
                chatId: String(chatId),
                telegramUsername: telegramUsername || null,
            },
            ip: 'telegram-bot',
        }, { transaction });

        return { ok: true, userId: user.id };
    });
}

async function unlinkTelegramChatForUser(userId, ip = null) {
    return sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(userId, { transaction });
        if (!user) {
            return { ok: false, reason: 'user_not_found' };
        }

        const currentPrefs = user.notificationPrefs || {};
        const nextPrefs = {
            ...currentPrefs,
            telegram: false,
            telegramChatId: null,
            telegramUsername: null,
            telegramLinkedAt: null,
        };

        await user.update({ notificationPrefs: nextPrefs }, { transaction });
        await ActionLog.create({
            userId: user.id,
            action: 'telegram_unlinked',
            details: {},
            ip: ip || null,
        }, { transaction });

        return { ok: true, notificationPrefs: nextPrefs };
    });
}

async function handleTelegramStartCommand(message) {
    const text = String(message?.text || '').trim();
    const payload = text.split(' ')[1] || '';
    const chatId = message?.chat?.id;
    const telegramUsername = message?.from?.username || null;

    if (!payload || !chatId) {
        await sendTelegramMessage(chatId, 'Щоб підключити сповіщення, відкрийте налаштування профілю та натисніть "Підключити Telegram".');
        return;
    }

    const verification = verifyTelegramLinkToken(payload);
    if (!verification.valid) {
        await sendTelegramMessage(chatId, 'Посилання недійсне або застаріло. Згенеруйте нове в налаштуваннях профілю.');
        return;
    }

    const linkResult = await linkTelegramChatToUser({
        userId: verification.userId,
        chatId: String(chatId),
        telegramUsername,
    });

    if (!linkResult.ok) {
        await sendTelegramMessage(chatId, 'Не вдалося підключити Telegram. Спробуйте ще раз пізніше.');
        return;
    }

    await sendTelegramMessage(chatId, 'Telegram-сповіщення підключено. Тепер ви будете отримувати важливі повідомлення сервісу.');
}

async function pollTelegramUpdates() {
    if (!isTelegramConfigured() || pollingInFlight) return;

    pollingInFlight = true;
    try {
        const response = await axios.get(getBotApiUrl('getUpdates'), {
            params: {
                timeout: 0,
                offset: pollingOffset ? pollingOffset + 1 : undefined,
            },
            timeout: 10000,
        });

        const updates = Array.isArray(response.data?.result) ? response.data.result : [];
        for (const update of updates) {
            pollingOffset = Math.max(pollingOffset, Number(update.update_id || 0));
            const message = update?.message;
            const text = String(message?.text || '');
            if (text.startsWith('/start')) {
                // eslint-disable-next-line no-await-in-loop
                await handleTelegramStartCommand(message);
            }
        }
    } catch (error) {
        const details = error?.response?.data || error.message;
        console.error('Telegram polling error:', details);
    } finally {
        pollingInFlight = false;
    }
}

function startTelegramBotPolling() {
    if (!isTelegramConfigured()) {
        console.log('Telegram bot is disabled (TELEGRAM_BOT_TOKEN is not set)');
        return;
    }
    if (pollingTimer) return;

    console.log(`Telegram bot polling started (@${getBotUsername() || 'unknown_bot'})`);
    pollTelegramUpdates();
    pollingTimer = setInterval(pollTelegramUpdates, POLL_INTERVAL_MS);
}

module.exports = {
    getBotUsername,
    isTelegramConfigured,
    sendTelegramMessage,
    sendTelegramNotificationToUser,
    startTelegramBotPolling,
    unlinkTelegramChatForUser,
};
