const { DataTypes } = require('sequelize');

async function ensureUsersRoleColumn(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('users');

  if (table.role) {
    return false;
  }

  await queryInterface.addColumn('users', 'role', {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
  });

  return true;
}

async function ensureSchemaCompatibility(sequelize) {
  try {
    const addedUsersRole = await ensureUsersRoleColumn(sequelize);

    if (addedUsersRole) {
      console.log('Schema compatibility: added missing users.role column');
    }
  } catch (error) {
    console.error('Schema compatibility check failed:', error.message);
    throw error;
  }
}

module.exports = {
  ensureSchemaCompatibility,
};
