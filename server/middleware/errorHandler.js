module.exports = (err, req, res, next) => {
    console.error('Error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Помилка валідації',
            details: err.errors.map(e => e.message)
        });
    }

    // Sequelize unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'Запис з такими даними вже існує'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Внутрішня помилка сервера'
    });
};
