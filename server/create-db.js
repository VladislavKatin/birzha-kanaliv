require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: 'postgres'
    });

    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='youtoobe'");
        if (res.rows.length === 0) {
            await client.query('CREATE DATABASE youtoobe');
            console.log('Database "youtoobe" created successfully!');
        } else {
            console.log('Database "youtoobe" already exists.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
