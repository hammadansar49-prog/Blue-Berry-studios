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

// Initialize Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);

// Global handles used by the sync code at the bottom of app.js
window.fbAuth = firebase.auth();
window.fbDB = firebase.firestore();

// Keep the user signed in across page reloads
window.fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(e){
  console.warn('Auth persistence error', e);
});
