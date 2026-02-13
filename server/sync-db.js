const { sequelize } = require('./models');

async function syncDatabase() {
    try {
        await sequelize.sync({ force: false });
        console.log('All tables synced successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err.message);
        process.exit(1);
    }
}

syncDatabase();
