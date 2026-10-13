/* ============ FIREBASE CONFIG & INIT ============ */
/* Project: karobar-3dad1 */
var firebaseConfig = {
  apiKey: "AIzaSyBu0chDs6uecU0wJmZJLnsix2-j9TT-TgQ",
  authDomain: "karobar-3dad1.firebaseapp.com",
  projectId: "karobar-3dad1",
  storageBucket: "karobar-3dad1.firebasestorage.app",
  messagingSenderId: "963401809133",
  appId: "1:963401809133:web:1f041d69eb7f6400d0a0e4",
  measurementId: "G-98S6C96P84"
};

// A missing CDN SDK must not crash the local app during an offline launch.
window.fbAuth = null;
window.fbDB = null;
window.fbPersistenceReady = Promise.resolve();
if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window.fbAuth = firebase.auth();
    window.fbDB = firebase.firestore();
    // Cache authenticated document reads for offline desktop reopening.
    window.fbPersistenceReady = window.fbDB.enablePersistence({ synchronizeTabs: true }).catch(function (e) {
      console.warn('Offline cloud cache unavailable', e.code || e.message);
    });
    window.fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function (e) {
      console.warn('Auth persistence error', e);
    });
  } catch (e) {
    window.fbAuth = null;
    window.fbDB = null;
    console.warn('Cloud services unavailable', e);
  }
}
