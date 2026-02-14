'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const now = new Date();
        const seedUserIds = [
            '11111111-1111-4111-8111-111111111111',
            '22222222-2222-4222-8222-222222222222',
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        ];
        const seedUserEmails = [
            'creator.one@example.com',
            'creator.two@example.com',
            'demo.one@example.com',
            'demo.two@example.com',
        ];
        const seedChannelIds = [
            '33333333-3333-4333-8333-333333333333',
            '44444444-4444-4444-8444-444444444444',
            'aaaa1111-aaaa-4111-8111-aaaaaaaa1111',
            'bbbb2222-bbbb-4222-8222-bbbbbbbb2222',
            'cccc3333-cccc-4333-8333-cccccccc3333',
            'dddd4444-dddd-4444-8444-dddddddd4444',
        ];
        const seedOfferIds = [
            '55555555-5555-4555-8555-555555555555',
            'a1010101-1010-4101-8101-a10101010101',
            'a2020202-2020-4202-8202-a20202020202',
            'a3030303-3030-4303-8303-a30303030303',
            'a4040404-4040-4404-8404-a40404040404',
            'a5050505-5050-4505-8505-a50505050505',
        ];

        const users = [
            {
                id: '11111111-1111-4111-8111-111111111111',
                firebaseUid: 'seed-firebase-uid-1',
                email: 'creator.one@example.com',
                displayName: 'Dmytro K.',
                photoURL: 'https://api.dicebear.com/9.x/initials/svg?seed=Dmytro%20K',
                bio: 'Tech creator from Kyiv focused on AI and productivity.',
                location: 'Kyiv, UA',
                languages: JSON.stringify(['uk', 'en']),
                birthYear: 1994,
                gender: null,
                professionalRole: 'YouTube Creator',
                companyName: null,
                website: 'https://example.com/kyiv-tech-digest',
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
                displayName: 'Alina M.',
                photoURL: 'https://api.dicebear.com/9.x/initials/svg?seed=Alina%20M',
                bio: 'Explaining finance and business metrics for creators.',
                location: 'Lviv, UA',
                languages: JSON.stringify(['uk', 'en']),
                birthYear: 1996,
                gender: null,
                professionalRole: 'Business Creator',
                companyName: null,
                website: 'https://example.com/urban-finance-lab',
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
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                firebaseUid: 'seed-firebase-uid-demo-1',
                email: 'demo.one@example.com',
                displayName: 'Marta Nowak',
                photoURL: null,
                bio: 'Travel creator building concise city guides and route breakdowns.',
                location: 'Warsaw, PL',
                languages: JSON.stringify(['en']),
                birthYear: 1992,
                gender: null,
                professionalRole: 'Travel Creator',
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
                id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                firebaseUid: 'seed-firebase-uid-demo-2',
                email: 'demo.two@example.com',
                displayName: 'Leon Richter',
                photoURL: null,
                bio: 'Gaming and education creator focused on highlights and STEM content.',
                location: 'Berlin, DE',
                languages: JSON.stringify(['en']),
                birthYear: 1993,
                gender: null,
                professionalRole: 'Gaming Creator',
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
                channelId: 'UC_KYIV_TECH_DIGEST',
                channelTitle: 'Kyiv Tech Digest',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=KyivTechDigest',
                description: 'Weekly videos about AI tools, automation workflows and creator productivity in Ukrainian.',
                subscribers: 184200,
                totalViews: 19640000,
                totalVideos: 412,
                avgViews30d: 136000,
                subGrowth30d: 4200,
                averageWatchTime: 7.2,
                ctr: 5.3,
                niche: 'tech',
                language: 'uk',
                country: 'UA',
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
                channelId: 'UC_URBAN_FINANCE_LAB',
                channelTitle: 'Urban Finance Lab',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=UrbanFinanceLab',
                description: 'Finance explainers for creators: CPM, retention, sponsorship math and channel unit economics.',
                subscribers: 127500,
                totalViews: 11280000,
                totalVideos: 265,
                avgViews30d: 91000,
                subGrowth30d: 2800,
                averageWatchTime: 6.8,
                ctr: 4.9,
                niche: 'business',
                language: 'uk',
                country: 'UA',
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
                id: 'aaaa1111-aaaa-4111-8111-aaaaaaaa1111',
                userId: users[2].id,
                channelId: 'UC_DEMO_TRAVEL_BYTE_UA',
                channelTitle: 'Travel Byte UA',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=TravelByteUA',
                description: 'Short city guides, affordable routes and practical travel hacks.',
                subscribers: 38900,
                totalViews: 2840000,
                totalVideos: 154,
                avgViews30d: 27000,
                subGrowth30d: 860,
                averageWatchTime: 5.4,
                ctr: 4.1,
                niche: 'travel',
                language: 'en',
                country: 'PL',
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
                id: 'bbbb2222-bbbb-4222-8222-bbbbbbbb2222',
                userId: users[2].id,
                channelId: 'UC_DEMO_GAMEFORGE_HIGHLIGHTS',
                channelTitle: 'GameForge Highlights',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=GameForgeHighlights',
                description: 'Competitive gameplay breakdowns, strategy clips and weekly recaps.',
                subscribers: 61500,
                totalViews: 5120000,
                totalVideos: 331,
                avgViews30d: 45000,
                subGrowth30d: 1100,
                averageWatchTime: 4.9,
                ctr: 5.0,
                niche: 'gaming',
                language: 'en',
                country: 'DE',
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
                id: 'cccc3333-cccc-4333-8333-cccccccc3333',
                userId: users[3].id,
                channelId: 'UC_DEMO_CULINARY_SPRINT',
                channelTitle: 'Culinary Sprint',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=CulinarySprint',
                description: '10-minute recipes, meal prep routines and kitchen productivity tips.',
                subscribers: 47200,
                totalViews: 3620000,
                totalVideos: 210,
                avgViews30d: 32500,
                subGrowth30d: 740,
                averageWatchTime: 5.9,
                ctr: 4.7,
                niche: 'food',
                language: 'en',
                country: 'PL',
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
                id: 'dddd4444-dddd-4444-8444-dddddddd4444',
                userId: users[3].id,
                channelId: 'UC_DEMO_STEM_SPARK_KIDS',
                channelTitle: 'STEM Spark Kids',
                channelAvatar: 'https://api.dicebear.com/9.x/shapes/svg?seed=STEMSparkKids',
                description: 'Science experiments and educational activities for kids and parents.',
                subscribers: 29800,
                totalViews: 1910000,
                totalVideos: 140,
                avgViews30d: 18000,
                subGrowth30d: 520,
                averageWatchTime: 6.4,
                ctr: 4.4,
                niche: 'education',
                language: 'en',
                country: 'UA',
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
                description: 'Looking for a deep-dive collab around AI workflow optimization for creators.',
                niche: 'tech',
                language: 'uk',
                minSubscribers: 20000,
                maxSubscribers: 500000,
                status: 'matched',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'a1010101-1010-4101-8101-a10101010101',
                channelId: channels[0].id,
                type: 'subs',
                description: 'Шукаю партнерів для серії відео про AI-інструменти для малого бізнесу.',
                niche: 'tech',
                language: 'uk',
                minSubscribers: 15000,
                maxSubscribers: 300000,
                status: 'open',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'a2020202-2020-4202-8202-a20202020202',
                channelId: channels[1].id,
                type: 'views',
                description: 'Потрібні колаборації по темам CPM, монетизація та бренд-інтеграції.',
                niche: 'business',
                language: 'uk',
                minSubscribers: 10000,
                maxSubscribers: 250000,
                status: 'open',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'a3030303-3030-4303-8303-a30303030303',
                channelId: channels[2].id,
                type: 'subs',
                description: 'Travel vlog cross-promo with short-form hooks.',
                niche: 'travel',
                language: 'en',
                minSubscribers: 5000,
                maxSubscribers: 100000,
                status: 'open',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'a4040404-4040-4404-8404-a40404040404',
                channelId: channels[3].id,
                type: 'views',
                description: 'Exchange gaming highlight placements for weekend streams.',
                niche: 'gaming',
                language: 'en',
                minSubscribers: 7000,
                maxSubscribers: 120000,
                status: 'open',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: 'a5050505-5050-4505-8505-a50505050505',
                channelId: channels[4].id,
                type: 'subs',
                description: 'Recipe audience swap with healthy lifestyle creators.',
                niche: 'food',
                language: 'en',
                minSubscribers: 3000,
                maxSubscribers: 80000,
                status: 'open',
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
                content: 'Seed message: proposal details for AI workflow collaboration.',
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
            // Make seed idempotent for repeated db:seed:all runs.
            await queryInterface.bulkDelete('action_logs', { id: ['99999999-9999-4999-8999-999999999999'] }, { transaction });
            await queryInterface.bulkDelete('messages', { id: ['88888888-8888-4888-8888-888888888888'] }, { transaction });
            await queryInterface.bulkDelete('chat_rooms', { id: ['77777777-7777-4777-8777-777777777777'] }, { transaction });
            await queryInterface.bulkDelete('traffic_matches', { id: ['66666666-6666-4666-8666-666666666666'] }, { transaction });
            await queryInterface.bulkDelete('traffic_offers', { id: seedOfferIds }, { transaction });
            await queryInterface.bulkDelete('youtube_accounts', { id: seedChannelIds }, { transaction });
            await queryInterface.bulkDelete('users', { id: seedUserIds }, { transaction });
            await queryInterface.bulkDelete('users', { email: seedUserEmails }, { transaction });

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
                id: [
                    '55555555-5555-4555-8555-555555555555',
                    'a1010101-1010-4101-8101-a10101010101',
                    'a2020202-2020-4202-8202-a20202020202',
                    'a3030303-3030-4303-8303-a30303030303',
                    'a4040404-4040-4404-8404-a40404040404',
                    'a5050505-5050-4505-8505-a50505050505',
                ],
            }, { transaction });

            await queryInterface.bulkDelete('youtube_accounts', {
                id: [
                    '33333333-3333-4333-8333-333333333333',
                    '44444444-4444-4444-8444-444444444444',
                    'aaaa1111-aaaa-4111-8111-aaaaaaaa1111',
                    'bbbb2222-bbbb-4222-8222-bbbbbbbb2222',
                    'cccc3333-cccc-4333-8333-cccccccc3333',
                    'dddd4444-dddd-4444-8444-dddddddd4444',
                ],
            }, { transaction });

            await queryInterface.bulkDelete('users', {
                id: [
                    '11111111-1111-4111-8111-111111111111',
                    '22222222-2222-4222-8222-222222222222',
                    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                ],
            }, { transaction });
        });
    },
};
