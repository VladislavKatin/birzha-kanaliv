const admin = require('firebase-admin');

let firebaseApp = null;

// Initialize Firebase Admin
// Option 1: Full service account credentials (production)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized (service account)');
}
// Option 2: Project ID only — uses verifyIdToken with project ID check
else if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin initialized (project ID only)');
} else {
    console.warn('⚠️  Firebase Admin not initialized — missing FIREBASE_PROJECT_ID');
}

module.exports = admin;
