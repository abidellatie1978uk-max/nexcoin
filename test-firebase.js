
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBv8ljlrTY9LsoPUZPQpw1YaX2W6D5_O54",
    authDomain: "nexcoin-1f42f.firebaseapp.com",
    projectId: "nexcoin-1f42f",
    storageBucket: "nexcoin-1f42f.firebasestorage.app",
    messagingSenderId: "575773698878",
    appId: "1:575773698878:web:29261adabbe23c039f1a6f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebase() {
    console.log("🔍 Iniciando teste de conexão Firebase...");
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        console.log(`✅ Conexão bem-sucedida! Encontrados ${querySnapshot.size} usuários.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao conectar com Firebase:", error);
        process.exit(1);
    }
}

testFirebase();
