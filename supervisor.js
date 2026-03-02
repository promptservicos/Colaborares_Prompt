import { initializeApp } from "https://cdn.skypack.dev/firebase@9.22.0/app";
import { getAuth, onAuthStateChanged, signOut } from "https://cdn.skypack.dev/firebase@9.22.0/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://cdn.skypack.dev/firebase@9.22.0/firestore";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Verifica autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "loginsupervisor.html";
  } else {
    iniciar();
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = "loginsupervisor.html";
  });
});

// Navegação por abas
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.dataset.tab;
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    tabContents.forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (tabId === 'presenca') {
      atualizarDataHoje();
    }
  });
});

function atualizarDataHoje() {
  const span = document.getElementById('dataHoje');
  if (span) {
    const hoje = new Date();
    const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
    span.innerText = hoje.toLocaleDateString('pt-BR', opcoes);
  }
}

// Máscara CPF
function mascaraCPF(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  input.value = v;
}
const cpfInput = document.getElementById('funcCpf');
if (cpfInput) {
  cpfInput.addEventListener('input', () => mascaraCPF(cpfInput));
}

// Inicialização
function iniciar() {
  carregarPostos();
  carregarJornadas();
  carregarFuncionarios();
  carregarPresenca();
  setupFiltros();
}

// ---------- POSTOS ----------
let postosData = [];
const novoPostoBtn = document.getElementById('novoPostoBtn');
const formPosto = document.getElementById('formPosto');
const cancelarPosto = document.getElementById('cancelarPosto');
const postoForm = document.getElementById('postoForm');
const postoIdField = document.getElementById('postoId');
const postoFormTitle = document.getElementById('postoFormTitle');

novoPostoBtn.addEventListener('click', () => {
  postoForm.reset();
  postoIdField.value = '';
  postoFormTitle.innerText = 'Cadastrar Posto';
  formPosto.style.display = 'block';
});

cancelarPosto.addEventListener('click', () => {
  formPosto.style.display = 'none';
  postoForm.reset();
});

postoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('postoNome').value.trim();
  const endereco = document.getElementById('postoEndereco').value.trim();
  const id = postoIdField.value;

  if (!nome || !endereco) return;

  try {
    if (id) {
      const postoRef = doc(db, "postos", id);
      await updateDoc(postoRef, { nome, endereco });
    } else {
      await addDoc(collection(db, "postos"), { nome, endereco });
    }
    postoForm.reset();
    formPosto.style.display = 'none';
  } catch (error) {
    alert('Erro ao salvar posto: ' + error.message);
  }
});

function carregarPostos() {
  const postosList = document.getElementById('postosList');
  const q = query(collection(db, "postos"), orderBy("nome"));

  onSnapshot(q, (snapshot) => {
    postosData = [];
    let html = '';
    snapshot.forEach(doc => {
      const p = { id: doc.id, ...doc.data() };
      postosData.push(p);
      html += `<tr>
        <td>${p.nome}</td>
        <td>${p.endereco}</td>
        <td>
          <button class="btn-acao btn-editar" data-id="${p.id}" data-tipo="posto"><i class="fas fa-edit"></i></button>
          <button class="btn-acao btn-excluir" data-id="${p.id}" data-tipo="posto"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    if (html === '') html = '<tr><td colspan="3" class="loading">Nenhum posto cadastrado.</td></tr>';
    postosList.innerHTML = html;
    atualizarSelectPostos();
    adicionarEventosAcao();
  });
}

// ---------- JORNADAS ----------
let jornadasData = [];
const novaJornadaBtn = document.getElementById('novaJornadaBtn');
const formJornada = document.getElementById('formJornada');
const cancelarJornada = document.getElementById('cancelarJornada');
const jornadaForm = document.getElementById('jornadaForm');
const jornadaIdField = document.getElementById('jornadaId');
const jornadaFormTitle = document.getElementById('jornadaFormTitle');

novaJornadaBtn.addEventListener('click', () => {
  jornadaForm.reset();
  jornadaIdField.value = '';
  jornadaFormTitle.innerText = 'Cadastrar Jornada';
  formJornada.style.display = 'block';
});

cancelarJornada.addEventListener('click', () => {
  formJornada.style.display = 'none';
  jornadaForm.reset();
});

jornadaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const checkboxes = document.querySelectorAll('#jornadaForm .dias-checkbox input:checked');
  const dias = Array.from(checkboxes).map(cb => cb.value);
  if (dias.length === 0) {
    alert('Selecione pelo menos um dia.');
    return;
  }
  const inicio = document.getElementById('jornadaInicio').value;
  const fim = document.getElementById('jornadaFim').value;
  const id = jornadaIdField.value;

  const mapaDias = {
    seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom'
  };
  const diasFormatados = dias.map(d => mapaDias[d]).join(', ');
  const descricao = `${diasFormatados} · ${inicio}h às ${fim}h`;

  try {
    if (id) {
      const jornadaRef = doc(db, "jornadas", id);
      await updateDoc(jornadaRef, { dias, horaInicio: inicio, horaFim: fim, descricao });
    } else {
      await addDoc(collection(db, "jornadas"), { dias, horaInicio: inicio, horaFim: fim, descricao });
    }
    jornadaForm.reset();
    formJornada.style.display = 'none';
  } catch (error) {
    alert('Erro ao salvar jornada: ' + error.message);
  }
});

function carregarJornadas() {
  const jornadasList = document.getElementById('jornadasList');
  const q = query(collection(db, "jornadas"), orderBy("descricao"));

  onSnapshot(q, (snapshot) => {
    jornadasData = [];
    let html = '';
    snapshot.forEach(doc => {
      const j = { id: doc.id, ...doc.data() };
      jornadasData.push(j);
      html += `<tr>
        <td>${j.descricao}</td>
        <td>
          <button class="btn-acao btn-editar" data-id="${j.id}" data-tipo="jornada"><i class="fas fa-edit"></i></button>
          <button class="btn-acao btn-excluir" data-id="${j.id}" data-tipo="jornada"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    });
    if (html === '') html = '<tr><td colspan="2" class="loading">Nenhuma jornada cadastrada.</td></tr>';
    jornadasList.innerHTML = html;
    atualizarSelectJornadas();
    adicionarEventosAcao();
  });
}

// ---------- FUNCIONÁRIOS ----------
let funcionariosData = [];
const novoFuncionarioBtn = document.getElementById('novoFuncionarioBtn');
const formFuncionario = document.getElementById('formFuncionario');
const cancelarFuncionario = document.getElementById('cancelarFuncionario');
const funcionarioForm = document.getElementById('funcionarioForm');
const funcIdField = document.getElementById('funcId');
const funcFormTitle = document.getElementById('funcFormTitle');

novoFuncionarioBtn.addEventListener('click', () => {
  preencherSelectPostos();
  preencherSelectJornadas();
  funcionarioForm.reset();
  funcIdField.value = '';
  funcFormTitle.innerText = 'Cadastrar Funcionário';
  formFuncionario.style.display = 'block';
});

cancelarFuncionario.addEventListener('click', () => {
  formFuncionario.style.display = 'none';
  funcionarioForm.reset();
});

async function preencherSelectPostos(selectedId = '') {
  const select = document.getElementById('funcPosto');
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const querySnapshot = await getDocs(collection(db, "postos"));
    let options = '<option value="">Selecione um posto</option>';
    querySnapshot.forEach(doc => {
      const posto = doc.data();
      const selected = (doc.id === selectedId) ? 'selected' : '';
      options += `<option value="${doc.id}" ${selected} data-nome="${posto.nome}">${posto.nome}</option>`;
    });
    select.innerHTML = options;
  } catch (error) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function preencherSelectJornadas(selectedId = '') {
  const select = document.getElementById('funcJornada');
  select.innerHTML = '<option value="">Carregando...</option>';
  try {
    const querySnapshot = await getDocs(collection(db, "jornadas"));
    let options = '<option value="">Selecione uma jornada</option>';
    querySnapshot.forEach(doc => {
      const j = doc.data();
      const selected = (doc.id === selectedId) ? 'selected' : '';
      options += `<option value="${doc.id}" ${selected} data-desc="${j.descricao}">${j.descricao}</option>`;
    });
    select.innerHTML = options;
  } catch (error) {
    select.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

funcionarioForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = funcIdField.value;
  const nome = document.getElementById('funcNome').value.trim();
  const cpf = document.getElementById('funcCpf').value.trim();
  const postoSelect = document.getElementById('funcPosto');
  const postoId = postoSelect.value;
  const postoNome = postoSelect.options[postoSelect.selectedIndex]?.dataset.nome || '';
  const funcao = document.getElementById('funcFuncao').value;
  const jornadaSelect = document.getElementById('funcJornada');
  const jornadaId = jornadaSelect.value;
  const jornadaDesc = jornadaSelect.options[jornadaSelect.selectedIndex]?.dataset.desc || '';

  if (!nome || !cpf || !postoId || !funcao || !jornadaId) {
    alert('Preencha todos os campos.');
    return;
  }

  try {
    if (id) {
      const funcRef = doc(db, "funcionarios", id);
      await updateDoc(funcRef, { nome, cpf, postoId, postoNome, funcao, jornadaId, jornadaDesc });
    } else {
      await addDoc(collection(db, "funcionarios"), { nome, cpf, postoId, postoNome, funcao, jornadaId, jornadaDesc });
    }
    funcionarioForm.reset();
    formFuncionario.style.display = 'none';
  } catch (error) {
    alert('Erro ao salvar funcionário: ' + error.message);
  }
});

function carregarFuncionarios() {
  const funcionariosList = document.getElementById('funcionariosList');
  const q = query(collection(db, "funcionarios"), orderBy("nome"));

  onSnapshot(q, (snapshot) => {
    funcionariosData = [];
    snapshot.forEach(doc => {
      funcionariosData.push({ id: doc.id, ...doc.data() });
    });
    aplicarFiltrosFuncionarios();
  });
}

function aplicarFiltrosFuncionarios() {
  const searchTerm = document.getElementById('searchFuncionarios').value.toLowerCase();
  const postoFiltro = document.getElementById('filtroPostoFunc').value;
  const funcaoFiltro = document.getElementById('filtroFuncaoFunc').value;

  const dadosFiltrados = funcionariosData.filter(f => {
    if (!f) return false;
    const nome = (f.nome || '').toLowerCase();
    const matchNome = nome.includes(searchTerm);
    const matchPosto = !postoFiltro || (f.postoId || '') === postoFiltro;
    const matchFuncao = !funcaoFiltro || (f.funcao || '') === funcaoFiltro;
    return matchNome && matchPosto && matchFuncao;
  });

  let html = '';
  dadosFiltrados.forEach(f => {
    html += `<tr>
      <td>${f.nome || ''}</td>
      <td>${f.cpf || ''}</td>
      <td>${f.postoNome || ''}</td>
      <td>${f.funcao || ''}</td>
      <td>${f.jornadaDesc || ''}</td>
      <td>
        <button class="btn-acao btn-editar" data-id="${f.id}" data-tipo="funcionario"><i class="fas fa-edit"></i></button>
        <button class="btn-acao btn-excluir" data-id="${f.id}" data-tipo="funcionario"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  });
  if (html === '') html = '<tr><td colspan="6" class="loading">Nenhum funcionário encontrado.</td></tr>';
  document.getElementById('funcionariosList').innerHTML = html;
  adicionarEventosAcao();
}

// ---------- PRESENÇA ----------
let funcionariosPresenca = [];
let jornadasMapPresenca = new Map();
let presencasHojeMap = new Map(); // Mapa de funcionarioId -> dados da presença (para status Confirmado)

function carregarPresenca() {
  // Monitora mudanças em funcionários
  const qFuncionarios = query(collection(db, "funcionarios"), orderBy("nome"));
  onSnapshot(qFuncionarios, async () => {
    await atualizarPresenca();
  });

  // Monitora mudanças em jornadas
  const qJornadas = query(collection(db, "jornadas"));
  onSnapshot(qJornadas, async () => {
    await atualizarPresenca();
  });

  // Monitora mudanças em presenças (para atualizar status em tempo real)
  const qPresencas = query(collection(db, "presencas"));
  onSnapshot(qPresencas, async () => {
    await atualizarPresenca();
  });
}

async function atualizarPresenca() {
  const hoje = new Date().getDay();
  const mapaDiaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const diaHoje = mapaDiaSemana[hoje];
  const dataStrHoje = new Date().toISOString().split('T')[0];

  // Buscar todos os funcionários
  const funcSnapshot = await getDocs(collection(db, "funcionarios"));
  funcionariosPresenca = [];
  funcSnapshot.forEach(doc => {
    funcionariosPresenca.push({ id: doc.id, ...doc.data() });
  });

  // Buscar todas as jornadas
  const jornadasSnapshot = await getDocs(collection(db, "jornadas"));
  jornadasMapPresenca.clear();
  jornadasSnapshot.forEach(doc => jornadasMapPresenca.set(doc.id, doc.data()));

  // Buscar presenças de hoje
  const presencasQuery = query(
    collection(db, "presencas"),
    where("dataStr", "==", dataStrHoje)
  );
  const presencasSnapshot = await getDocs(presencasQuery);
  presencasHojeMap.clear();
  presencasSnapshot.forEach(doc => {
    const p = doc.data();
    presencasHojeMap.set(p.funcionarioId, p);
  });

  aplicarFiltrosPresenca();
}

function aplicarFiltrosPresenca() {
  const searchTerm = document.getElementById('searchPresenca').value.toLowerCase();
  const postoFiltro = document.getElementById('filtroPostoPresenca').value;
  const funcaoFiltro = document.getElementById('filtroFuncaoPresenca').value;
  const statusFiltro = document.getElementById('filtroStatusPresenca').value;

  const hoje = new Date().getDay();
  const mapaDiaSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const diaHoje = mapaDiaSemana[hoje];

  const dadosFiltrados = funcionariosPresenca.filter(f => {
    if (!f) return false;

    const nome = (f.nome || '').toLowerCase();
    const matchNome = nome.includes(searchTerm);

    const postoId = f.postoId || '';
    const matchPosto = !postoFiltro || postoId === postoFiltro;

    const funcao = f.funcao || '';
    const matchFuncao = !funcaoFiltro || funcao === funcaoFiltro;

    // Determinar status
    let status = 'Folga';
    let statusClass = 'folga';

    const jornada = jornadasMapPresenca.get(f.jornadaId);
    const diasTrabalho = jornada?.dias || [];
    const isDiaTrabalho = diasTrabalho.includes(diaHoje);

    if (isDiaTrabalho) {
      // Verifica se já tem presença registrada hoje
      if (presencasHojeMap.has(f.id)) {
        status = 'Confirmado';
        statusClass = 'confirmado';
      } else {
        status = 'Aguardando';
        statusClass = 'aguardando';
      }
    } else {
      status = 'Folga';
      statusClass = 'folga';
    }

    // Guardar no objeto para usar no matchStatus e na exibição
    f._status = status;
    f._statusClass = statusClass;

    const matchStatus = !statusFiltro || status === statusFiltro;

    return matchNome && matchPosto && matchFuncao && matchStatus;
  });

  let html = '';
  dadosFiltrados.forEach(f => {
    html += `<tr>
      <td>${f.nome || ''}</td>
      <td>${f.postoNome || ''}</td>
      <td>${f.funcao || ''}</td>
      <td>${f.jornadaDesc || ''}</td>
      <td><span class="status ${f._statusClass}">${f._status}</span></td>
    </tr>`;
  });
  if (html === '') html = '<tr><td colspan="5" class="loading">Nenhum funcionário encontrado.</td></tr>';
  document.getElementById('presencaList').innerHTML = html;
}

// ---------- FUNÇÕES AUXILIARES ----------
function atualizarSelectPostos() {
  const selects = [
    document.getElementById('filtroPostoFunc'),
    document.getElementById('filtroPostoPresenca')
  ];
  selects.forEach(select => {
    if (!select) return;
    let options = '<option value="">Todos os postos</option>';
    postosData.forEach(p => {
      options += `<option value="${p.id}">${p.nome}</option>`;
    });
    select.innerHTML = options;
  });
}

function atualizarSelectJornadas() {
  // Atualiza select de jornada no formulário de funcionário? Já é feito sob demanda.
}

function setupFiltros() {
  document.getElementById('searchFuncionarios').addEventListener('input', aplicarFiltrosFuncionarios);
  document.getElementById('filtroPostoFunc').addEventListener('change', aplicarFiltrosFuncionarios);
  document.getElementById('filtroFuncaoFunc').addEventListener('change', aplicarFiltrosFuncionarios);

  document.getElementById('searchPostos').addEventListener('input', filtrarPostos);
  document.getElementById('searchJornadas').addEventListener('input', filtrarJornadas);

  document.getElementById('searchPresenca').addEventListener('input', aplicarFiltrosPresenca);
  document.getElementById('filtroPostoPresenca').addEventListener('change', aplicarFiltrosPresenca);
  document.getElementById('filtroFuncaoPresenca').addEventListener('change', aplicarFiltrosPresenca);
  document.getElementById('filtroStatusPresenca').addEventListener('change', aplicarFiltrosPresenca);
}

function filtrarPostos() {
  const term = document.getElementById('searchPostos').value.toLowerCase();
  const filtered = postosData.filter(p => 
    (p.nome || '').toLowerCase().includes(term) || 
    (p.endereco || '').toLowerCase().includes(term)
  );
  let html = '';
  filtered.forEach(p => {
    html += `<tr>
      <td>${p.nome || ''}</td>
      <td>${p.endereco || ''}</td>
      <td>
        <button class="btn-acao btn-editar" data-id="${p.id}" data-tipo="posto"><i class="fas fa-edit"></i></button>
        <button class="btn-acao btn-excluir" data-id="${p.id}" data-tipo="posto"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  });
  if (html === '') html = '<tr><td colspan="3" class="loading">Nenhum posto encontrado.</td></tr>';
  document.getElementById('postosList').innerHTML = html;
  adicionarEventosAcao();
}

function filtrarJornadas() {
  const term = document.getElementById('searchJornadas').value.toLowerCase();
  const filtered = jornadasData.filter(j => 
    (j.descricao || '').toLowerCase().includes(term)
  );
  let html = '';
  filtered.forEach(j => {
    html += `<tr>
      <td>${j.descricao || ''}</td>
      <td>
        <button class="btn-acao btn-editar" data-id="${j.id}" data-tipo="jornada"><i class="fas fa-edit"></i></button>
        <button class="btn-acao btn-excluir" data-id="${j.id}" data-tipo="jornada"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  });
  if (html === '') html = '<tr><td colspan="2" class="loading">Nenhuma jornada encontrada.</td></tr>';
  document.getElementById('jornadasList').innerHTML = html;
  adicionarEventosAcao();
}

function adicionarEventosAcao() {
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.removeEventListener('click', editarHandler);
    btn.addEventListener('click', editarHandler);
  });
  document.querySelectorAll('.btn-excluir').forEach(btn => {
    btn.removeEventListener('click', excluirHandler);
    btn.addEventListener('click', excluirHandler);
  });
}

async function editarHandler(e) {
  const id = e.currentTarget.dataset.id;
  const tipo = e.currentTarget.dataset.tipo;

  if (tipo === 'posto') {
    const docRef = doc(db, "postos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById('postoId').value = id;
      document.getElementById('postoNome').value = docSnap.data().nome || '';
      document.getElementById('postoEndereco').value = docSnap.data().endereco || '';
      document.getElementById('postoFormTitle').innerText = 'Editar Posto';
      document.getElementById('formPosto').style.display = 'block';
    }
  } else if (tipo === 'jornada') {
    const docRef = doc(db, "jornadas", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('jornadaId').value = id;
      document.getElementById('jornadaInicio').value = data.horaInicio || '';
      document.getElementById('jornadaFim').value = data.horaFim || '';
      document.querySelectorAll('#jornadaForm .dias-checkbox input').forEach(cb => {
        cb.checked = data.dias ? data.dias.includes(cb.value) : false;
      });
      document.getElementById('jornadaFormTitle').innerText = 'Editar Jornada';
      document.getElementById('formJornada').style.display = 'block';
    }
  } else if (tipo === 'funcionario') {
    const docRef = doc(db, "funcionarios", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('funcId').value = id;
      document.getElementById('funcNome').value = data.nome || '';
      document.getElementById('funcCpf').value = data.cpf || '';
      document.getElementById('funcFuncao').value = data.funcao || '';
      await preencherSelectPostos(data.postoId);
      await preencherSelectJornadas(data.jornadaId);
      document.getElementById('funcFormTitle').innerText = 'Editar Funcionário';
      document.getElementById('formFuncionario').style.display = 'block';
    }
  }
}

async function excluirHandler(e) {
  const id = e.currentTarget.dataset.id;
  const tipo = e.currentTarget.dataset.tipo;

  if (!confirm(`Tem certeza que deseja excluir este ${tipo}?`)) return;

  try {
    if (tipo === 'posto') {
      await deleteDoc(doc(db, "postos", id));
    } else if (tipo === 'jornada') {
      await deleteDoc(doc(db, "jornadas", id));
    } else if (tipo === 'funcionario') {
      await deleteDoc(doc(db, "funcionarios", id));
    }
  } catch (error) {
    alert('Erro ao excluir: ' + error.message);
  }
}