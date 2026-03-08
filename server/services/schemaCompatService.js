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

async function ensureCompatibilityColumns(sequelize, tableName, compatibilityColumns) {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable(tableName);
  const addedColumns = [];

  for (const column of compatibilityColumns) {
    if (!table[column.target] && table[column.legacy]) {
      const added = await addColumnIfMissing(queryInterface, tableName, table, column.target, column.definition);
      if (added) {
        await backfillFromLegacyColumn(sequelize, tableName, column.target, column.legacy);
        addedColumns.push(`${tableName}.${column.target}<-${column.legacy}`);
      }
    }
  }

  return addedColumns;
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
  return ensureCompatibilityColumns(sequelize, 'users', [
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
  ]);
}

async function ensureYouTubeAccountsCamelCaseCompatibility(sequelize) {
  return ensureCompatibilityColumns(sequelize, 'youtube_accounts', [
    {
      target: 'userId',
      legacy: 'user_id',
      definition: { type: DataTypes.UUID, allowNull: true },
    },
    {
      target: 'channelId',
      legacy: 'channel_id',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'channelTitle',
      legacy: 'channel_title',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'channelAvatar',
      legacy: 'channel_avatar',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'totalViews',
      legacy: 'total_views',
      definition: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    },
    {
      target: 'totalVideos',
      legacy: 'total_videos',
      definition: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      target: 'avgViews30d',
      legacy: 'avg_views_30d',
      definition: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      target: 'subGrowth30d',
      legacy: 'sub_growth_30d',
      definition: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      target: 'averageWatchTime',
      legacy: 'average_watch_time',
      definition: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    },
    {
      target: 'recentVideos',
      legacy: 'recent_videos',
      definition: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    },
    {
      target: 'accessToken',
      legacy: 'access_token',
      definition: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      target: 'refreshToken',
      legacy: 'refresh_token',
      definition: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      target: 'isFlagged',
      legacy: 'is_flagged',
      definition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      target: 'flagReason',
      legacy: 'flag_reason',
      definition: { type: DataTypes.STRING, allowNull: true },
    },
    {
      target: 'isActive',
      legacy: 'is_active',
      definition: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      target: 'lastAnalyticsUpdate',
      legacy: 'last_analytics_update',
      definition: { type: DataTypes.DATE, allowNull: true },
    },
    {
      target: 'connectedAt',
      legacy: 'connected_at',
      definition: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
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
  ]);
}

async function ensureActionLogsCamelCaseCompatibility(sequelize) {
  return ensureCompatibilityColumns(sequelize, 'action_logs', [
    {
      target: 'userId',
      legacy: 'user_id',
      definition: { type: DataTypes.UUID, allowNull: true },
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
  ]);
}

async function ensureSchemaCompatibility(sequelize) {
  try {
    const addedUsersRole = await ensureUsersRoleColumn(sequelize);
    const usersCamelCaseColumns = await ensureUsersCamelCaseCompatibility(sequelize);
    const youtubeAccountsCamelCaseColumns = await ensureYouTubeAccountsCamelCaseCompatibility(sequelize);
    const actionLogsCamelCaseColumns = await ensureActionLogsCamelCaseCompatibility(sequelize);
    const addedColumns = [
      ...usersCamelCaseColumns,
      ...youtubeAccountsCamelCaseColumns,
      ...actionLogsCamelCaseColumns,
    ];

    if (addedUsersRole) {
      console.log('Schema compatibility: added missing users.role column');
    }

    if (addedColumns.length > 0) {
      console.log(`Schema compatibility: added camelCase compatibility columns (${addedColumns.join(', ')})`);
    }
  } catch (error) {
    console.error('Schema compatibility check failed:', error.message);
    throw error;
  }
}

module.exports = {
  ensureSchemaCompatibility,
};
