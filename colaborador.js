import { initializeApp } from "https://cdn.skypack.dev/firebase@9.22.0/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  query, 
  where 
} from "https://cdn.skypack.dev/firebase@9.22.0/firestore";

// Configuração do Firebase (mesma do supervisor)
const firebaseConfig = {
  apiKey: "AIzaSyB5Fwfiz-b0RtQoEI-cXUgBuyxaMe8qGqg",
  authDomain: "colaboradores-2482c.firebaseapp.com",
  projectId: "colaboradores-2482c",
  storageBucket: "colaboradores-2482c.firebasestorage.app",
  messagingSenderId: "1048155134876",
  appId: "1:1048155134876:web:fc65584b1392da4de70659",
  measurementId: "G-6744E95DF8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elementos do DOM
const postoSelect = document.getElementById('postoSelect');
const cpfInput = document.getElementById('cpfInput');
const buscaForm = document.getElementById('buscaForm');
const mensagemInfo = document.getElementById('mensagemInfo');
const resultadoArea = document.getElementById('resultadoArea');
const btnConfirmar = document.getElementById('btnConfirmar');
const spanNome = document.getElementById('nomeFunc');
const spanFuncao = document.getElementById('funcaoFunc');
const spanJornada = document.getElementById('jornadaFunc');
const spanPosto = document.getElementById('postoFunc');

// Variáveis globais
let postos = [];
let funcionarioEncontrado = null;

// Máscara de CPF
function mascaraCPF(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}
cpfInput.addEventListener('input', () => mascaraCPF(cpfInput));

// Funções auxiliares de mensagem
function mostrarInfo(texto, tipo = 'info') {
  mensagemInfo.style.display = 'block';
  mensagemInfo.className = `mensagem-${tipo}`;
  mensagemInfo.textContent = texto;
}

function limparInfo() {
  mensagemInfo.style.display = 'none';
  mensagemInfo.textContent = '';
}

// Carregar postos do Firebase
async function carregarPostos() {
  try {
    const querySnapshot = await getDocs(collection(db, "postos"));
    postos = [];
    let options = '<option value="">Selecione um posto</option>';
    querySnapshot.forEach(doc => {
      const posto = { id: doc.id, ...doc.data() };
      postos.push(posto);
      options += `<option value="${doc.id}">${posto.nome}</option>`;
    });
    postoSelect.innerHTML = options;
  } catch (error) {
    console.error('Erro ao carregar postos:', error);
    postoSelect.innerHTML = '<option value="">Erro ao carregar postos</option>';
    mostrarInfo('Erro ao carregar postos. Tente novamente.', 'erro');
  }
}

// Buscar funcionário por CPF e posto (considerando CPF sem formatação no banco)
async function buscarFuncionario(cpf, postoId) {
  // Remove formatação do CPF digitado
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Busca todos os funcionários do posto (já que não podemos fazer where com cpf formatado)
  const q = query(
    collection(db, "funcionarios"),
    where("postoId", "==", postoId)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    let encontrado = null;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      // Compara o CPF do banco (removendo formatação) com o digitado
      const cpfBanco = (data.cpf || '').replace(/\D/g, '');
      if (cpfBanco === cpfLimpo) {
        encontrado = { id: doc.id, ...data };
      }
    });
    return encontrado;
  } catch (error) {
    console.error('Erro na busca:', error);
    throw error;
  }
}

// Exibir dados do funcionário na tela
function exibirDadosFuncionario(func) {
  spanNome.textContent = func.nome || 'Não informado';
  spanFuncao.textContent = func.funcao || 'Não informado';
  spanJornada.textContent = func.jornadaDesc || 'Não informado';
  
  // Buscar nome do posto pelo ID
  const posto = postos.find(p => p.id === func.postoId);
  spanPosto.textContent = posto ? posto.nome : (func.postoNome || 'Não informado');
  
  resultadoArea.style.display = 'block';
  limparInfo();
}

// Limpar resultado
function limparResultado() {
  resultadoArea.style.display = 'none';
  funcionarioEncontrado = null;
}

// Verificar se já existe presença hoje para este funcionário
async function verificarPresencaHoje(funcionarioId) {
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const presencaQuery = query(
    collection(db, "presencas"),
    where("funcionarioId", "==", funcionarioId),
    where("dataStr", "==", hoje)
  );
  const snapshot = await getDocs(presencaQuery);
  return !snapshot.empty;
}

// Registrar presença no Firebase
async function registrarPresenca() {
  if (!funcionarioEncontrado) return;
  
  const hoje = new Date();
  const dataStr = hoje.toISOString().split('T')[0];
  const timestamp = hoje.getTime();
  
  try {
    // Verificar se já existe presença hoje
    const jaExiste = await verificarPresencaHoje(funcionarioEncontrado.id);
    if (jaExiste) {
      mostrarInfo('Presença já registrada hoje para este funcionário.', 'info');
      btnConfirmar.disabled = true;
      return;
    }
    
    // Registrar nova presença
    const presencaRef = collection(db, "presencas");
    await addDoc(presencaRef, {
      funcionarioId: funcionarioEncontrado.id,
      funcionarioNome: funcionarioEncontrado.nome,
      postoId: funcionarioEncontrado.postoId,
      postoNome: funcionarioEncontrado.postoNome,
      data: timestamp,
      dataStr: dataStr,
      hora: hoje.toLocaleTimeString('pt-BR'),
      timestamp: timestamp
    });
    
    mostrarInfo('Presença confirmada com sucesso!', 'sucesso');
    btnConfirmar.disabled = true;
  } catch (error) {
    console.error('Erro ao registrar presença:', error);
    mostrarInfo('Erro ao registrar presença. Tente novamente.', 'erro');
  }
}

// Evento de submit do formulário de busca
buscaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparInfo();
  limparResultado();
  
  const postoId = postoSelect.value;
  const cpf = cpfInput.value.trim();
  
  if (!postoId) {
    mostrarInfo('Selecione um posto.', 'erro');
    return;
  }
  
  if (!cpf) {
    mostrarInfo('Digite seu CPF.', 'erro');
    return;
  }
  
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    mostrarInfo('CPF inválido. Digite 11 números.', 'erro');
    return;
  }
  
  mostrarInfo('Buscando...', 'info');
  
  try {
    const funcionario = await buscarFuncionario(cpf, postoId);
    if (funcionario) {
      funcionarioEncontrado = funcionario;
      exibirDadosFuncionario(funcionario);
      
      // Verificar se já tem presença hoje para habilitar/desabilitar botão
      const jaTemPresenca = await verificarPresencaHoje(funcionario.id);
      btnConfirmar.disabled = jaTemPresenca;
      
      if (jaTemPresenca) {
        mostrarInfo('Presença já registrada hoje.', 'info');
      }
    } else {
      mostrarInfo('Nenhum funcionário encontrado com esse CPF no posto selecionado.', 'erro');
    }
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    mostrarInfo('Erro ao buscar funcionário. Tente novamente.', 'erro');
  }
});

// Evento de clique no botão confirmar
btnConfirmar.addEventListener('click', registrarPresenca);

// Inicialização: carregar postos ao abrir a página
carregarPostos();