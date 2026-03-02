// Importações do Firebase via CDN (Skypack)
import { initializeApp } from "https://cdn.skypack.dev/firebase@9.22.0/app";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://cdn.skypack.dev/firebase@9.22.0/auth";
// Se quiser analytics, descomente a linha abaixo e use o getAnalytics
// import { getAnalytics } from "https://cdn.skypack.dev/firebase@9.22.0/analytics";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5Fwfiz-b0RtQoEI-cXUgBuyxaMe8qGqg",
  authDomain: "colaboradores-2482c.firebaseapp.com",
  projectId: "colaboradores-2482c",
  storageBucket: "colaboradores-2482c.firebasestorage.app",
  messagingSenderId: "1048155134876",
  appId: "1:1048155134876:web:fc65584b1392da4de70659",
  measurementId: "G-6744E95DF8"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // opcional
const auth = getAuth(app);

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const mensagemErro = document.getElementById('mensagemErro');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// Função para exibir mensagens de erro
function mostrarErro(texto) {
  mensagemErro.style.display = 'block';
  mensagemErro.textContent = texto;
}

function limparErro() {
  mensagemErro.style.display = 'none';
  mensagemErro.textContent = '';
}

// Login com email/senha
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparErro();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    mostrarErro('Preencha todos os campos.');
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Login bem-sucedido
    console.log('Login efetuado:', userCredential.user.email);
    // Redireciona para supervisor.html
    window.location.href = 'supervisor.html';
  } catch (error) {
    console.error('Erro no login:', error.code, error.message);
    // Mensagens específicas conforme o erro
    switch (error.code) {
      case 'auth/user-not-found':
        mostrarErro('Usuário não encontrado. Verifique o e-mail digitado.');
        break;
      case 'auth/wrong-password':
        mostrarErro('Senha incorreta. Tente novamente.');
        break;
      case 'auth/invalid-email':
        mostrarErro('Formato de e-mail inválido.');
        break;
      case 'auth/too-many-requests':
        mostrarErro('Muitas tentativas falhas. Tente mais tarde.');
        break;
      case 'auth/user-disabled':
        mostrarErro('Esta conta foi desativada.');
        break;
      default:
        mostrarErro('Erro ao fazer login. Verifique sua conexão.');
    }
  }
});

// Recuperação de senha (esqueci minha senha)
forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    alert('Por favor, digite seu e-mail no campo acima para recuperar a senha.');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert(`E-mail de recuperação enviado para ${email}. Verifique sua caixa de entrada.`);
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error.code, error.message);
    switch (error.code) {
      case 'auth/user-not-found':
        alert('Este e-mail não está cadastrado.');
        break;
      case 'auth/invalid-email':
        alert('E-mail inválido.');
        break;
      default:
        alert('Erro ao enviar e-mail. Tente novamente mais tarde.');
    }
  }
});