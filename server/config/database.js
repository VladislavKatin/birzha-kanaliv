const { loadEnv } = require('./loadEnv');

// In Railway production, do not load .env files. Railway injects env vars itself.
if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

function shouldUseSsl() {
    const raw = String(process.env.DB_SSL || '').trim().toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return process.env.NODE_ENV === 'production';
}

function normalizeDatabaseUrl(connectionString) {
    const value = String(connectionString || '').trim();
    if (!value) {
        return value;
    }

    try {
        const url = new URL(value);
        // Let Sequelize/pg SSL settings come from dialectOptions.
        url.searchParams.delete('sslmode');
        url.searchParams.delete('uselibpqcompat');
        return url.toString();
    } catch {
        return value;
    }
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Set it in server/.env.local for development or Railway environment variables for production.');
}

const sequelizeOptions = {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};

if (shouldUseSsl()) {
    sequelizeOptions.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    };
}

module.exports = {
    databaseUrl,
    sequelizeOptions,
};
