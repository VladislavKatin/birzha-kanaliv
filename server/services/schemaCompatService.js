const { DataTypes } = require('sequelize');

async function addColumnIfMissing(queryInterface, tableName, table, columnName, definition) {
  if (table[columnName]) {
    return false;
  }

  await queryInterface.addColumn(tableName, columnName, definition);
  return true;
}

async function backfillFromLegacyColumn(sequelize, tableName, targetColumn, legacyColumn) {
  await sequelize.query(
    `UPDATE "${tableName}" SET "${targetColumn}" = "${legacyColumn}" WHERE "${targetColumn}" IS NULL AND "${legacyColumn}" IS NOT NULL`
  );
}

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

async function ensureUsersCamelCaseCompatibility(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('users');

  const compatibilityColumns = [
    {
      target: 'firebaseUid',
      legacy: 'firebase_uid',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'displayName',
      legacy: 'display_name',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'photoURL',
      legacy: 'photo_url',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'professionalRole',
      legacy: 'professional_role',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'companyName',
      legacy: 'company_name',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'socialLinks',
      legacy: 'social_links',
      definition: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    {
      target: 'privacySettings',
      legacy: 'privacy_settings',
      definition: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    {
      target: 'notificationPrefs',
      legacy: 'notification_prefs',
      definition: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          email_new_proposal: true,
          email_message: true,
          email_deal_complete: true,
          telegram: false,
          webpush: false,
        },
      },
    },
    {
      target: 'createdAt',
      legacy: 'created_at',
      definition: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      target: 'updatedAt',
      legacy: 'updated_at',
      definition: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
  ];

  const addedColumns = [];

  for (const column of compatibilityColumns) {
    if (!table[column.target] && table[column.legacy]) {
      const added = await addColumnIfMissing(queryInterface, 'users', table, column.target, column.definition);
      if (added) {
        await backfillFromLegacyColumn(sequelize, 'users', column.target, column.legacy);
        addedColumns.push(`${column.target}<-${column.legacy}`);
      }
    }
  }

  return addedColumns;
}

async function ensureSchemaCompatibility(sequelize) {
  try {
    const addedUsersRole = await ensureUsersRoleColumn(sequelize);
    const camelCaseColumns = await ensureUsersCamelCaseCompatibility(sequelize);

    if (addedUsersRole) {
      console.log('Schema compatibility: added missing users.role column');
    }

    if (camelCaseColumns.length > 0) {
      console.log(`Schema compatibility: added camelCase user columns (${camelCaseColumns.join(', ')})`);
    }
  } catch (error) {
    console.error('Schema compatibility check failed:', error.message);
    throw error;
  }
}

module.exports = {
  ensureSchemaCompatibility,
};
