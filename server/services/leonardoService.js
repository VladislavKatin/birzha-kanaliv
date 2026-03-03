const axios = require('axios');

const LEONARDO_BASE_URL = process.env.LEONARDO_API_URL || 'https://cloud.leonardo.ai/api/rest/v1';
const DEFAULT_MODEL_ID = process.env.LEONARDO_MODEL_ID || 'aa77f04e-3eec-4034-9c07-d0f619684628';

function getLeonardoApiKey() {
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
        throw new Error('LEONARDO_API_KEY is required');
    }

    return apiKey;
}

function createLeonardoClient() {
    return axios.create({
        baseURL: LEONARDO_BASE_URL,
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${getLeonardoApiKey()}`,
            'content-type': 'application/json',
        },
        timeout: 60000,
    });
}

function extractGenerationId(payload) {
    return payload?.sdGenerationJob?.generationId
        || payload?.createJob?.generationId
        || payload?.generationId
        || payload?.job?.generationId
        || payload?.data?.sdGenerationJob?.generationId
        || null;
}

async function createLeonardoGeneration(options) {
    const client = createLeonardoClient();
    const response = await client.post('/generations', {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt || undefined,
        width: options.width || 1024,
        height: options.height || 1024,
        num_images: options.numImages || 1,
        modelId: options.modelId || DEFAULT_MODEL_ID,
        presetStyle: options.presetStyle || undefined,
        styleUUID: options.styleUUID || process.env.LEONARDO_STYLE_UUID || undefined,
        alchemy: options.alchemy !== false,
        contrast: options.contrast || undefined,
        photoReal: options.photoReal || false,
        photoRealVersion: options.photoRealVersion || undefined,
        public: false,
    });

    const generationId = extractGenerationId(response.data);

    if (!generationId) {
        throw new Error(`Leonardo generation ID missing: ${JSON.stringify(response.data)}`);
    }

    return {
        generationId,
        raw: response.data,
    };
}

async function getLeonardoGeneration(generationId) {
    const client = createLeonardoClient();
    const response = await client.get(`/generations/${generationId}`);
    return response.data;
}

async function waitForLeonardoImages(generationId, options = {}) {
    const maxAttempts = options.maxAttempts || 40;
    const delayMs = options.delayMs || 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const payload = await getLeonardoGeneration(generationId);
        const generation = payload?.generations_by_pk;
        const status = String(generation?.status || '').toUpperCase();
        const images = generation?.generated_images || [];

        if (images.length > 0 && status === 'COMPLETE') {
            return {
                status,
                images,
                raw: payload,
            };
        }

        if (status && status !== 'PENDING' && status !== 'STARTED' && status !== 'PROCESSING' && status !== 'COMPLETE') {
            throw new Error(`Leonardo generation failed with status ${status}`);
        }

        if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw new Error(`Leonardo generation timed out for ${generationId}`);
}

module.exports = {
    DEFAULT_MODEL_ID,
    createLeonardoGeneration,
    getLeonardoGeneration,
    waitForLeonardoImages,
};
