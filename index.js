// script.js
// Importações do Firebase (usando a versão modular)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5Fwfiz-b0RtQoEI-cXUgBuyxaMe8qGqg",
  authDomain: "colaboradores-2482c.firebaseapp.com",
  projectId: "colaboradores-2482c",
  storageBucket: "colaboradores-2482c.firebasestorage.app",
  messagingSenderId: "1048155134876",
  appId: "1:1048155134876:web:fc65584b1392da4de70659",
  measurementId: "G-6744E95DF8"
};

// Inicializa o Firebase (aplicativo e analytics)
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Você pode futuramente adicionar listeners ou lógica de redirecionamento aqui.
// Por enquanto, apenas confirma a inicialização no console (opcional).
console.log('🔥 Firebase inicializado com sucesso');