'use strict';

const { randomUUID } = require('crypto');

const ADMIN_EMAIL = 'vladkatintam@gmail.com';
const ADMIN_FIREBASE_UID = 'seed-firebase-uid-admin-vlad';
const ADMIN_DISPLAY_NAME = 'Vlad Admin';

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(
                `
                INSERT INTO users (
                    id,
                    "firebaseUid",
                    email,
                    "displayName",
                    "notificationPrefs",
                    role,
                    "createdAt",
                    "updatedAt"
                ) VALUES (
                    :id,
                    :firebaseUid,
                    :email,
                    :displayName,
                    :notificationPrefs::jsonb,
                    'admin',
                    :createdAt,
                    :updatedAt
                )
                ON CONFLICT (email)
                DO UPDATE SET
                    role = 'admin',
                    "updatedAt" = EXCLUDED."updatedAt"
                `,
                {
                    transaction,
                    replacements: {
                        id: randomUUID(),
                        firebaseUid: ADMIN_FIREBASE_UID,
                        email: ADMIN_EMAIL,
                        displayName: ADMIN_DISPLAY_NAME,
                        notificationPrefs: JSON.stringify({
                            email_new_proposal: true,
                            email_message: true,
                            email_deal_complete: true,
                            telegram: false,
                            webpush: false,
                        }),
                        createdAt: now,
                        updatedAt: now,
                    },
                },
            );

            const [[adminUser]] = await queryInterface.sequelize.query(
                'SELECT id FROM users WHERE email = :email LIMIT 1',
                {
                    transaction,
                    replacements: { email: ADMIN_EMAIL },
                },
            );

            if (adminUser?.id) {
                await queryInterface.bulkInsert(
                    'action_logs',
                    [
                        {
                            id: randomUUID(),
                            userId: adminUser.id,
                            action: 'admin_seed_bootstrap',
                            details: JSON.stringify({
                                scope: 'admin_bootstrap_seed',
                                email: ADMIN_EMAIL,
                                role: 'admin',
                            }),
                            ip: '127.0.0.1',
                            createdAt: now,
                            updatedAt: now,
                        },
                    ],
                    { transaction },
                );
            }
        });
    },

    async down(queryInterface, Sequelize) {
        const now = new Date();

        await queryInterface.sequelize.transaction(async (transaction) => {
            const [[adminUser]] = await queryInterface.sequelize.query(
                'SELECT id, "firebaseUid" FROM users WHERE email = :email LIMIT 1',
                {
                    transaction,
                    replacements: { email: ADMIN_EMAIL },
                },
            );

            if (!adminUser?.id) {
                return;
            }

            await queryInterface.sequelize.query(
                `
                DELETE FROM action_logs
                WHERE "userId" = :userId
                  AND action = 'admin_seed_bootstrap'
                `,
                {
                    transaction,
                    replacements: { userId: adminUser.id },
                },
            );

            if (adminUser.firebaseUid === ADMIN_FIREBASE_UID) {
                await queryInterface.bulkDelete(
                    'users',
                    { id: adminUser.id },
                    { transaction },
                );
                return;
            }

            await queryInterface.sequelize.query(
                `
                UPDATE users
                SET role = 'user', "updatedAt" = :updatedAt
                WHERE id = :userId
                `,
                {
                    transaction,
                    replacements: { userId: adminUser.id, updatedAt: now },
                },
            );
        });
    },
};
