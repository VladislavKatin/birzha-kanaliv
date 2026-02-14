module.exports = (err, req, res, next) => {
    console.error('Error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map((e) => e.message),
        });
    }

    // Sequelize unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'A record with these values already exists',
        });
    }

    // Default error
    return res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
};
