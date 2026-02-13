module.exports = {
    env: {
        node: true,
        es2022: true,
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    extends: ['eslint:recommended'],
    rules: {
        // ── Best Practices ──
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off', // Server needs console.log
        'consistent-return': 'warn',
        'no-var': 'error',
        'prefer-const': 'warn',
        'eqeqeq': ['warn', 'smart'],

        // ── Style (soft) ──
        'no-trailing-spaces': 'warn',
        'no-multiple-empty-lines': ['warn', { max: 2 }],
        'comma-dangle': ['warn', 'always-multiline'],
    },
    ignorePatterns: ['node_modules/', 'dist/'],
};
