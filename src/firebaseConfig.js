import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  storageBucket: 'rocas-543b0.appspot.com'
});

const bucket = admin.storage().bucket(); // Esto crea una referencia a tu bucket de Firebase Storage.


export { bucket };
