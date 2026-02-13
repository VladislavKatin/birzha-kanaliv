export function parseManifest(rawManifest) {
    return JSON.parse(rawManifest);
}

export function collectManifestIconPaths(manifest) {
    if (!manifest || !Array.isArray(manifest.icons)) {
        return [];
    }

    return manifest.icons
        .map((icon) => icon?.src)
        .filter((src) => typeof src === 'string' && src.startsWith('/'));
}
