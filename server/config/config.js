const { loadEnv } = require('./loadEnv');

if (process.env.NODE_ENV !== 'production') {
    loadEnv();
}

function buildDialectOptions() {
    const raw = String(process.env.DB_SSL || '').trim().toLowerCase();
    const useSsl = raw ? raw === 'true' : process.env.NODE_ENV === 'production';

    if (!useSsl) {
        return {};
    }

    return {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    };
}

function buildConfig() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for Sequelize CLI.');
    }

    return {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        logging: false,
        ...buildDialectOptions(),
    };
}

module.exports = {
    development: buildConfig(),
    test: buildConfig(),
    production: buildConfig(),
};
