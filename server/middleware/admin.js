const { User } = require('../models');

/**
 * Admin middleware — verifies the authenticated user has admin role.
 * Must be used AFTER the `auth` middleware so `req.firebaseUser` is set.
 *
 * @middleware
 * @requires auth
 * @returns {403} If user is not an admin
 */
const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { firebaseUid: req.firebaseUser.uid },
            attributes: ['id', 'role'],
        });

        if (!user) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Доступ заборонено. Потрібні права адміністратора.' });
        }

        req.dbUser = user;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error.message);
        return res.status(500).json({ error: 'Помилка перевірки прав' });
    }
};

module.exports = adminMiddleware;
