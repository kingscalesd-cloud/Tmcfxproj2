// Firebase Web SDK configuration for the TMC FX Academia web app.
// These values identify the Firebase project and are expected to be visible in browser code.
// Never put service-account credentials or private keys in this file.
export const firebaseConfig = {
  apiKey: "AIzaSyAUZIO9hiJb11NFDJtp359whzwIVBtemXE",
  authDomain: "tmcfx-9fe19.firebaseapp.com",
  projectId: "tmcfx-9fe19",
  storageBucket: "tmcfx-9fe19.firebasestorage.app",
  messagingSenderId: "537328432855",
  appId: "1:537328432855:web:b6fc46da3b285f2ffa6292",
  measurementId: "G-CCHGHCZTNQ"
};

export const firebaseConfigReady =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId) &&
  !firebaseConfig.apiKey.includes("YOUR_") &&
  !firebaseConfig.projectId.includes("YOUR_") &&
  !firebaseConfig.appId.includes("YOUR_");
