module.exports = (err, req, res, next) => {
    console.error('Error:', err);
    const requestId = req.requestId || null;

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map((e) => e.message),
            requestId,
        });
    }

    // Sequelize unique constraint
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'A record with these values already exists',
            requestId,
        });
    }

    // Default error
    const status = err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const safeMessage = status >= 500 && isProduction
        ? 'Internal server error'
        : (err.message || 'Internal server error');

    return res.status(status).json({
        error: safeMessage,
        requestId,
    });
};
