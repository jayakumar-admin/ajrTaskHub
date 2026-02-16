const admin = require('firebase-admin');

try {
  // Initialize using Application Default Credentials
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  const bucket = admin.storage().bucket();

  console.log('Firebase Admin SDK initialized successfully using ADC.');

  module.exports = { bucket };

} catch (error) {
  console.error('*******************************************************************');
  console.error('CRITICAL: Firebase Admin SDK initialization failed.');
  console.error('Make sure you ran: gcloud auth application-default login');
  console.error('And FIREBASE_STORAGE_BUCKET is set in your .env file.');
  console.error('Error details:', error.message);
  console.error('*******************************************************************');

  const stream = require('stream');

  module.exports = {
    bucket: {
      file: () => ({
        createWriteStream: () => {
          const passthrough = new stream.PassThrough();
          passthrough.end();
          process.nextTick(() => {
            passthrough.emit('error', new Error('Firebase not configured. Upload will fail.'));
          });
          return passthrough;
        }
      })
    }
  };
}
