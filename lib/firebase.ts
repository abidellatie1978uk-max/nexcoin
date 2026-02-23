// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBv8ljlrTY9LsoPUZPQpw1YaX2W6D5_O54",
  authDomain: "nexcoin-1f42f.firebaseapp.com",
  projectId: "nexcoin-1f42f",
  storageBucket: "nexcoin-1f42f.firebasestorage.app",
  messagingSenderId: "575773698878",
  appId: "1:575773698878:web:29261adabbe23c039f1a6f"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Configurar persistência de login usando localStorage
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Persistência do Firebase Auth configurada');
  })
  .catch((err) => console.error('❌ Erro Auth persistence:', err));

// ✅ Suprimir erros de WebChannel do Firestore no console (ambiente iframe)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('WebChannelConnection') ||
      args[0].includes('@firebase/firestore'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

export { auth, db, storage };
export default app;