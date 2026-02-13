const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_DATA_URL_REGEX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i;

function estimateBase64Bytes(dataUrl) {
    const base64 = dataUrl.split(',')[1] || '';
    const padding = (base64.match(/=+$/) || [''])[0].length;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function normalizeImageData(imageData) {
    if (typeof imageData !== 'string') return null;
    const value = imageData.trim();
    if (!value) return null;
    if (!IMAGE_DATA_URL_REGEX.test(value)) {
        throw new Error('Image must be a valid base64 data URL');
    }
    if (estimateBase64Bytes(value) > MAX_IMAGE_BYTES) {
        throw new Error('Image exceeds 3MB limit');
    }
    return value;
}

function normalizeIncomingMessagePayload({ content, imageData }) {
    const text = typeof content === 'string' ? content.trim() : '';
    const image = normalizeImageData(imageData);

    if (!text && !image) {
        throw new Error('Message must contain text or image');
    }

    return {
        text,
        imageData: image,
        storedContent: JSON.stringify({
            v: 1,
            t: text || null,
            i: image || null,
        }),
    };
}

function parseStoredMessageContent(content) {
    if (typeof content !== 'string') {
        return { text: '', imageData: null };
    }

    try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.v === 1 && (typeof parsed.t === 'string' || parsed.t === null)) {
            return {
                text: parsed.t || '',
                imageData: typeof parsed.i === 'string' ? parsed.i : null,
            };
        }
    } catch (_) {
        // Legacy plain-text messages are kept as-is.
    }

    return { text: content, imageData: null };
}

function formatMessageForClient(message) {
    const raw = typeof message.toJSON === 'function' ? message.toJSON() : message;
    const parsed = parseStoredMessageContent(raw.content);
    return {
        ...raw,
        content: parsed.text || '',
        contentText: parsed.text || '',
        imageData: parsed.imageData,
    };
}

module.exports = {
    normalizeIncomingMessagePayload,
    parseStoredMessageContent,
    formatMessageForClient,
};
