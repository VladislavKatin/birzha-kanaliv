const admin = require('../config/firebase');
const { User } = require('../models');

async function ensureNotSuspended(firebaseUid) {
    const user = await User.findOne({
        where: { firebaseUid },
        attributes: ['role'],
    });

    if (user && user.role === 'suspended') {
        return false;
    }

    return true;
}

const auth = async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        const testUid = req.headers['x-test-firebase-uid'];
        if (testUid) {
            const allowed = await ensureNotSuspended(testUid);
            if (!allowed) {
                return res.status(403).json({ error: 'Обліковий запис тимчасово призупинено' });
            }
            req.firebaseUser = {
                uid: testUid,
                email: req.headers['x-test-email'] || `${testUid}@example.test`,
                name: req.headers['x-test-name'] || testUid,
                picture: null,
            };
            return next();
        }
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Необхідна авторизація' });
    }

    const token = authHeader.split(' ')[1];

    try {
        if (!admin.apps.length) {
            console.log('ENV CHECK', {
                FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
                FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'OK' : 'MISSING',
                FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'OK' : 'MISSING',
            });
            console.warn('Firebase Admin not initialized - skipping token verification');
            return res.status(503).json({ error: 'Сервіс авторизації не налаштований' });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        const allowed = await ensureNotSuspended(decodedToken.uid);
        if (!allowed) {
            return res.status(403).json({ error: 'Обліковий запис тимчасово призупинено' });
        }
        req.firebaseUser = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Невалідний токен' });
    }
};

module.exports = auth;
