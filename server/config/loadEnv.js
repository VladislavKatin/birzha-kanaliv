const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let loaded = false;

function applyLegacyDatabaseUrl() {
    if (process.env.DATABASE_URL) {
        return;
    }

    const host = process.env.DB_HOST;
    const database = process.env.DB_NAME;
    const user = process.env.DB_USER;

    if (!host || !database || !user) {
        return;
    }

    const password = encodeURIComponent(process.env.DB_PASSWORD || '');
    const encodedUser = encodeURIComponent(user);
    const port = process.env.DB_PORT || '5432';
    process.env.DATABASE_URL = `postgresql://${encodedUser}:${password}@${host}:${port}/${database}`;
}

function loadEnv() {
    if (loaded) {
        return;
    }

    const rootDir = path.resolve(__dirname, '..');
    const nodeEnv = process.env.NODE_ENV || 'development';
    const envFiles = ['.env', `.env.${nodeEnv}`];

    if (nodeEnv !== 'production') {
        envFiles.push('.env.local');
    }

    envFiles.forEach((fileName) => {
        const filePath = path.join(rootDir, fileName);
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath, override: true });
        }
    });

    applyLegacyDatabaseUrl();

    loaded = true;
}

module.exports = { loadEnv };
