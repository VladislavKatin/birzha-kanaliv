const { Client } = require('pg');
const { loadEnv } = require('./config/loadEnv');

loadEnv();

function buildClientConfig() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required to connect to PostgreSQL.');
    }

    const rawDbSsl = String(process.env.DB_SSL || '').trim().toLowerCase();
    const useSsl = rawDbSsl ? rawDbSsl === 'true' : process.env.NODE_ENV === 'production';

    return {
        connectionString: process.env.DATABASE_URL,
        ...(useSsl ? {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        } : {}),
    };
}

async function createDatabase() {
    const client = new Client(buildClientConfig());

    try {
        await client.connect();
        const res = await client.query('SELECT current_database() AS name');

        if (!res.rows.length) {
            console.log('Connected to PostgreSQL, but no database name was returned.');
            return;
        }

        console.log(`Connected to database "${res.rows[0].name}".`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
