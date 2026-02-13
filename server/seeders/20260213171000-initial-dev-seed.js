'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();

        const users = [
            {
                id: '11111111-1111-4111-8111-111111111111',
                firebaseUid: 'seed-firebase-uid-1',
                email: 'creator.one@example.com',
                displayName: 'Creator One',
                photoURL: null,
                bio: 'Seed account for local development',
                location: 'US',
                languages: JSON.stringify(['en']),
                birthYear: 1994,
                gender: null,
                professionalRole: 'Content Creator',
                companyName: null,
                website: null,
                socialLinks: JSON.stringify({}),
                privacySettings: JSON.stringify({}),
                badges: JSON.stringify([]),
                notificationPrefs: JSON.stringify({
                    email_new_proposal: true,
                    email_message: true,
                    email_deal_complete: true,
                    telegram: false,
                    webpush: false,
                }),
                role: 'user',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '22222222-2222-4222-8222-222222222222',
                firebaseUid: 'seed-firebase-uid-2',
                email: 'creator.two@example.com',
                displayName: 'Creator Two',
                photoURL: null,
                bio: 'Second seed account for local development',
                location: 'US',
                languages: JSON.stringify(['en']),
                birthYear: 1996,
                gender: null,
                professionalRole: 'Streamer',
                companyName: null,
                website: null,
                socialLinks: JSON.stringify({}),
                privacySettings: JSON.stringify({}),
                badges: JSON.stringify([]),
                notificationPrefs: JSON.stringify({
                    email_new_proposal: true,
                    email_message: true,
                    email_deal_complete: true,
                    telegram: false,
                    webpush: false,
                }),
                role: 'user',
                createdAt: now,
                updatedAt: now,
            },
        ];

        const channels = [
            {
                id: '33333333-3333-4333-8333-333333333333',
                userId: users[0].id,
                channelId: 'UC_seed_channel_1',
                channelTitle: 'Creator One Channel',
                channelAvatar: null,
                description: 'Seed channel one',
                subscribers: 12000,
                totalViews: 450000,
                totalVideos: 110,
                avgViews30d: 5600,
                subGrowth30d: 320,
                averageWatchTime: 5.8,
                ctr: 4.2,
                niche: 'education',
                language: 'en',
                country: 'US',
                recentVideos: JSON.stringify([]),
                accessToken: null,
                refreshToken: null,
                isFlagged: false,
                flagReason: null,
                verified: true,
                isActive: true,
                lastAnalyticsUpdate: now,
                connectedAt: now,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '44444444-4444-4444-8444-444444444444',
                userId: users[1].id,
                channelId: 'UC_seed_channel_2',
                channelTitle: 'Creator Two Channel',
                channelAvatar: null,
                description: 'Seed channel two',
                subscribers: 9800,
                totalViews: 305000,
                totalVideos: 89,
                avgViews30d: 4200,
                subGrowth30d: 260,
                averageWatchTime: 6.1,
                ctr: 4.6,
                niche: 'gaming',
                language: 'en',
                country: 'US',
                recentVideos: JSON.stringify([]),
                accessToken: null,
                refreshToken: null,
                isFlagged: false,
                flagReason: null,
                verified: true,
                isActive: true,
                lastAnalyticsUpdate: now,
                connectedAt: now,
                createdAt: now,
                updatedAt: now,
            },
        ];

        const offers = [
            {
                id: '55555555-5555-4555-8555-555555555555',
                channelId: channels[0].id,
                type: 'views',
                description: 'Looking for collab in education niche',
                niche: 'education',
                language: 'en',
                minSubscribers: 5000,
                maxSubscribers: 50000,
                status: 'matched',
                createdAt: now,
                updatedAt: now,
            },
        ];

        const matches = [
            {
                id: '66666666-6666-4666-8666-666666666666',
                offerId: offers[0].id,
                initiatorChannelId: channels[1].id,
                targetChannelId: channels[0].id,
                status: 'accepted',
                initiatorConfirmed: false,
                targetConfirmed: false,
                completedAt: null,
                createdAt: now,
                updatedAt: now,
            },
        ];

        const chatRooms = [
            {
                id: '77777777-7777-4777-8777-777777777777',
                matchId: matches[0].id,
                createdAt: now,
                updatedAt: now,
            },
        ];

        const messages = [
            {
                id: '88888888-8888-4888-8888-888888888888',
                chatRoomId: chatRooms[0].id,
                senderUserId: users[0].id,
                content: 'Seed message: hi from creator one',
                createdAt: now,
                updatedAt: now,
            },
        ];

        const actionLogs = [
            {
                id: '99999999-9999-4999-8999-999999999999',
                userId: users[0].id,
                action: 'seed_data_inserted',
                details: JSON.stringify({
                    scope: 'initial_dev_seed',
                    entities: ['users', 'youtube_accounts', 'traffic_offers', 'traffic_matches', 'chat_rooms', 'messages'],
                }),
                ip: '127.0.0.1',
                createdAt: now,
                updatedAt: now,
            },
        ];

        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.bulkInsert('users', users, { transaction });
            await queryInterface.bulkInsert('youtube_accounts', channels, { transaction });
            await queryInterface.bulkInsert('traffic_offers', offers, { transaction });
            await queryInterface.bulkInsert('traffic_matches', matches, { transaction });
            await queryInterface.bulkInsert('chat_rooms', chatRooms, { transaction });
            await queryInterface.bulkInsert('messages', messages, { transaction });
            await queryInterface.bulkInsert('action_logs', actionLogs, { transaction });
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.bulkDelete('action_logs', {
                id: ['99999999-9999-4999-8999-999999999999'],
            }, { transaction });

            await queryInterface.bulkDelete('messages', {
                id: ['88888888-8888-4888-8888-888888888888'],
            }, { transaction });

            await queryInterface.bulkDelete('chat_rooms', {
                id: ['77777777-7777-4777-8777-777777777777'],
            }, { transaction });

            await queryInterface.bulkDelete('traffic_matches', {
                id: ['66666666-6666-4666-8666-666666666666'],
            }, { transaction });

            await queryInterface.bulkDelete('traffic_offers', {
                id: ['55555555-5555-4555-8555-555555555555'],
            }, { transaction });

            await queryInterface.bulkDelete('youtube_accounts', {
                id: [
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-4444-4444-8444-444444444444',
                ],
            }, { transaction });

            await queryInterface.bulkDelete('users', {
                id: [
                    '11111111-1111-4111-8111-111111111111',
                    '22222222-2222-4222-8222-222222222222',
                ],
            }, { transaction });
        });
    },
};
