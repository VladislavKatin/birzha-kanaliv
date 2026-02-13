module.exports = [
    {
        ignores: ['node_modules/**', 'dist/**'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        rules: {
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_|^(next|job|e|Sequelize)$',
                    varsIgnorePattern: '^_|^(firebaseApp|isRedisConnected|TrafficOffer|ChatRoom|channelIds|account)$',
                    caughtErrorsIgnorePattern: '^_|^e$',
                    destructuredArrayIgnorePattern: '^_',
                },
            ],
            'no-console': 'off',
            'consistent-return': 'off',
            'no-var': 'error',
            'prefer-const': 'warn',
            eqeqeq: ['warn', 'smart'],
            'no-trailing-spaces': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 2 }],
            'comma-dangle': 'off',
        },
    },
];
