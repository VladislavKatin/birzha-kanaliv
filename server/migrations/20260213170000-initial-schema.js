'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.createTable('users', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                firebaseUid: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                },
                email: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                },
                displayName: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                photoURL: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                bio: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                location: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                languages: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: [],
                },
                birthYear: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                gender: {
                    type: Sequelize.STRING(30),
                    allowNull: true,
                },
                professionalRole: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                companyName: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                website: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                socialLinks: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: {},
                },
                privacySettings: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: {},
                },
                badges: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: [],
                },
                notificationPrefs: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: {
                        email_new_proposal: true,
                        email_message: true,
                        email_deal_complete: true,
                        telegram: false,
                        webpush: false,
                    },
                },
                role: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'user',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('youtube_accounts', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                userId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                channelId: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: true,
                },
                channelTitle: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                channelAvatar: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                subscribers: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                totalViews: {
                    type: Sequelize.BIGINT,
                    allowNull: false,
                    defaultValue: 0,
                },
                totalVideos: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                avgViews30d: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                subGrowth30d: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                averageWatchTime: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                ctr: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                    defaultValue: 0,
                },
                niche: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                language: {
                    type: Sequelize.STRING(5),
                    allowNull: true,
                },
                country: {
                    type: Sequelize.STRING(2),
                    allowNull: true,
                },
                recentVideos: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: [],
                },
                accessToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                refreshToken: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                isFlagged: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                flagReason: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                verified: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                lastAnalyticsUpdate: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                connectedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('traffic_offers', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                channelId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'youtube_accounts', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                type: {
                    type: Sequelize.ENUM('subs', 'views'),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                niche: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                language: {
                    type: Sequelize.STRING(5),
                    allowNull: true,
                },
                minSubscribers: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                maxSubscribers: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                status: {
                    type: Sequelize.ENUM('open', 'matched', 'completed'),
                    allowNull: false,
                    defaultValue: 'open',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('traffic_matches', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                offerId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'traffic_offers', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                initiatorChannelId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'youtube_accounts', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                targetChannelId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'youtube_accounts', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                status: {
                    type: Sequelize.ENUM('pending', 'accepted', 'completed', 'rejected'),
                    allowNull: false,
                    defaultValue: 'pending',
                },
                initiatorConfirmed: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                targetConfirmed: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                completedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('reviews', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                matchId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'traffic_matches', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                fromChannelId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'youtube_accounts', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                toChannelId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'youtube_accounts', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                rating: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                comment: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                isPublished: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('chat_rooms', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                matchId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    unique: true,
                    references: { model: 'traffic_matches', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('messages', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                chatRoomId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'chat_rooms', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                senderUserId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                content: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.createTable('action_logs', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                },
                userId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                },
                action: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                details: {
                    type: Sequelize.JSONB,
                    allowNull: false,
                    defaultValue: {},
                },
                ip: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            }, { transaction });

            await queryInterface.addIndex('youtube_accounts', ['userId'], { transaction });
            await queryInterface.addIndex('traffic_offers', ['channelId'], { transaction });
            await queryInterface.addIndex('traffic_offers', ['status'], { transaction });
            await queryInterface.addIndex('traffic_matches', ['offerId'], { transaction });
            await queryInterface.addIndex('traffic_matches', ['initiatorChannelId'], { transaction });
            await queryInterface.addIndex('traffic_matches', ['targetChannelId'], { transaction });
            await queryInterface.addIndex('traffic_matches', ['status'], { transaction });
            await queryInterface.addIndex('reviews', ['matchId'], { transaction });
            await queryInterface.addIndex('reviews', ['toChannelId'], { transaction });
            await queryInterface.addIndex('messages', ['chatRoomId'], { transaction });
            await queryInterface.addIndex('messages', ['senderUserId'], { transaction });
            await queryInterface.addIndex('action_logs', ['userId'], { transaction });
            await queryInterface.addIndex('action_logs', ['action'], { transaction });
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.dropTable('action_logs', { transaction });
            await queryInterface.dropTable('messages', { transaction });
            await queryInterface.dropTable('chat_rooms', { transaction });
            await queryInterface.dropTable('reviews', { transaction });
            await queryInterface.dropTable('traffic_matches', { transaction });
            await queryInterface.dropTable('traffic_offers', { transaction });
            await queryInterface.dropTable('youtube_accounts', { transaction });
            await queryInterface.dropTable('users', { transaction });

            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_traffic_offers_type";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_traffic_offers_status";', { transaction });
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_traffic_matches_status";', { transaction });
        });
    },
};
