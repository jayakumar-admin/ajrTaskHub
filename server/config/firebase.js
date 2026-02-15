const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  const bucket = admin.storage().bucket();
  console.log('Firebase Admin SDK initialized successfully.');

  module.exports = { bucket };

} catch (error) {
  console.error('*******************************************************************');
  console.error('CRITICAL: Firebase Admin SDK initialization failed.');
  console.error('Please ensure your service account key is located at:', serviceAccountPath);
  console.error('And that FIREBASE_STORAGE_BUCKET is set in your .env file.');
  console.error('Error details:', error.message);
  console.error('*******************************************************************');
  
  // Create a dummy bucket object so the app doesn't crash on startup
  module.exports = { 
    bucket: {
      file: () => ({
        createWriteStream: () => {
          const stream = require('stream');
          const passthrough = new stream.PassThrough();
          passthrough.end();
          // Immediately emit an error to notify the caller
          process.nextTick(() => {
            passthrough.emit('error', new Error('Firebase not configured. Upload will fail.'));
          });
          return passthrough;
        }
      })
    } 
  };
}
