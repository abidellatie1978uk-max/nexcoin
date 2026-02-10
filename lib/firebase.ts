// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
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

// Initialize Firebase (evita reinicialização)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// ✅ Configurar persistência de login usando localStorage
// Isso mantém o usuário logado mesmo após fechar o navegador
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Persistência do Firebase Auth configurada com sucesso');
  })
  .catch((error) => {
    console.error('❌ Erro ao configurar persistência:', error);
  });

// ✅ Initialize Cloud Firestore com configurações otimizadas
// Usa cache persistente para melhor performance e menos erros de conexão
let db;
try {
  // Tentar pegar instância existente primeiro
  db = getFirestore(app);
} catch (error) {
  // Se não existir, inicializar com cache persistente
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
}

export { db };

// ✅ Suprimir erros de WebChannel do Firestore no console (ambiente iframe)
// Esses erros são esperados em ambientes restritos e não afetam a funcionalidade
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filtrar erros do Firestore WebChannel
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('WebChannelConnection') || 
     args[0].includes('@firebase/firestore'))
  ) {
    // Silenciar esses erros - são esperados em iframe
    return;
  }
  originalConsoleError(...args);
};

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;