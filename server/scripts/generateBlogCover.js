const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadEnv } = require('../config/loadEnv');
const {
    DEFAULT_MODEL_ID,
    createLeonardoGeneration,
    waitForLeonardoImages,
} = require('../services/leonardoService');

if (process.env.NODE_ENV !== 'production') {
    loadEnv();
}

function parseArgs(argv) {
    const args = {};

    for (let index = 0; index < argv.length; index += 1) {
        const item = argv[index];
        if (!item.startsWith('--')) {
            continue;
        }

        const key = item.slice(2);
        const next = argv[index + 1];
        if (!next || next.startsWith('--')) {
            args[key] = 'true';
            continue;
        }

        args[key] = next;
        index += 1;
    }

    return args;
}

function requireArg(args, key) {
    const value = String(args[key] || '').trim();
    if (!value) {
        throw new Error(`--${key} is required`);
    }
    return value;
}

function detectExtension(url, contentType) {
    if (contentType && contentType.includes('png')) return '.png';
    if (contentType && contentType.includes('jpeg')) return '.jpg';
    if (contentType && contentType.includes('webp')) return '.webp';

    try {
        const pathname = new URL(url).pathname;
        const ext = path.extname(pathname);
        if (ext) return ext;
    } catch {
        return '.png';
    }

    return '.png';
}

async function downloadImage(url, outputPath) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
    });

    const extension = detectExtension(url, response.headers['content-type']);
    const finalPath = outputPath.endsWith(extension) ? outputPath : `${outputPath}${extension}`;

    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.writeFileSync(finalPath, response.data);

    return finalPath;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const slug = requireArg(args, 'slug');
    const prompt = requireArg(args, 'prompt');

    const width = Number(args.width || 1536);
    const height = Number(args.height || 1024);
    const outputBasePath = args.output
        ? path.resolve(process.cwd(), args.output)
        : path.resolve(process.cwd(), '../client/public/images/blog', slug);

    console.log('Leonardo request starting', {
        slug,
        modelId: args.model || DEFAULT_MODEL_ID,
        width,
        height,
        outputBasePath,
    });

    const created = await createLeonardoGeneration({
        prompt,
        negativePrompt: args['negative-prompt'],
        width,
        height,
        modelId: args.model,
        presetStyle: args['preset-style'],
        styleUUID: args['style-uuid'],
        numImages: Number(args['num-images'] || 1),
    });

    console.log('Generation created', {
        generationId: created.generationId,
    });

    const completed = await waitForLeonardoImages(created.generationId, {
        maxAttempts: Number(args['max-attempts'] || 50),
        delayMs: Number(args['delay-ms'] || 3000),
    });

    const firstImage = completed.images[0];
    const imageUrl = firstImage?.url || firstImage?.generated_image?.url;

    if (!imageUrl) {
        throw new Error(`Leonardo image URL missing: ${JSON.stringify(firstImage)}`);
    }

    const finalPath = await downloadImage(imageUrl, outputBasePath);
    const relativeFromClientPublic = `/${path.relative(
        path.resolve(process.cwd(), '../client/public'),
        finalPath,
    ).replace(/\\/g, '/')}`;

    console.log('Blog cover generated', {
        filePath: finalPath,
        publicPath: relativeFromClientPublic,
        generationId: created.generationId,
    });
}

main().catch((error) => {
    console.error('Blog cover generation failed:', error.message);
    process.exitCode = 1;
});
