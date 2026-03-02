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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "loginsupervisor.html";
  } else {
    iniciar();
  }
});

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
    fecharFiltroMobile();
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

// Formata função: primeira letra maiúscula, restante minúscula
function formatarFuncao(input) {
  let val = input.value.trim();
  if (val.length > 0) {
    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    input.value = val;
  }
}

// Máscara de hora: 0800 -> 08:00
function mascaraHora(input) {
  let v = input.value.replace(/\D/g, ''); // remove não dígitos
  if (v.length > 4) v = v.slice(0, 4);
  
  if (v.length >= 3) {
    // Formata como HH:MM
    let horas = v.slice(0, 2);
    let minutos = v.slice(2, 4);
    // Valida horas e minutos
    if (parseInt(horas) > 23) horas = '23';
    if (parseInt(minutos) > 59) minutos = '59';
    input.value = horas + ':' + minutos;
  } else {
    input.value = v;
  }
}

// Configurar máscaras nos campos de hora
const funcInicio = document.getElementById('funcInicio');
const funcFim = document.getElementById('funcFim');
if (funcInicio) {
  funcInicio.addEventListener('input', () => mascaraHora(funcInicio));
  funcInicio.addEventListener('blur', () => mascaraHora(funcInicio));
}
if (funcFim) {
  funcFim.addEventListener('input', () => mascaraHora(funcFim));
  funcFim.addEventListener('blur', () => mascaraHora(funcFim));
}

// Configurar formatação da função
const funcFuncao = document.getElementById('funcFuncao');
if (funcFuncao) {
  funcFuncao.addEventListener('blur', () => formatarFuncao(funcFuncao));
}

// Inicialização
function iniciar() {
  carregarPostos();
  carregarFuncionarios();
  carregarPresenca();
  setupFiltros();
  setupMobileFilters();
  setupDiasBotoes(); // configura botões de dias
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

// ---------- FUNCIONÁRIOS ----------
let funcionariosData = [];
const novoFuncionarioBtn = document.getElementById('novoFuncionarioBtn');
const formFuncionario = document.getElementById('formFuncionario');
const cancelarFuncionario = document.getElementById('cancelarFuncionario');
const funcionarioForm = document.getElementById('funcionarioForm');
const funcIdField = document.getElementById('funcId');
const funcFormTitle = document.getElementById('funcFormTitle');
const funcDiasHidden = document.getElementById('funcDias');

// Configura botões de dias da semana
function setupDiasBotoes() {
  const botoes = document.querySelectorAll('.dia-btn');
  botoes.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      atualizarDiasHidden();
    });
  });
}

function atualizarDiasHidden() {
  const selecionados = [];
  document.querySelectorAll('.dia-btn.selected').forEach(btn => {
    selecionados.push(btn.dataset.dia);
  });
  funcDiasHidden.value = selecionados.join(',');
}

function setDiasSelecionados(diasString) {
  // diasString ex: "seg,ter,qua"
  const diasArray = diasString ? diasString.split(',') : [];
  document.querySelectorAll('.dia-btn').forEach(btn => {
    const dia = btn.dataset.dia;
    if (diasArray.includes(dia)) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
  atualizarDiasHidden();
}

novoFuncionarioBtn.addEventListener('click', () => {
  preencherSelectPostos();
  funcionarioForm.reset();
  setDiasSelecionados(''); // limpa seleção
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

funcionarioForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = funcIdField.value;
  const nome = document.getElementById('funcNome').value.trim();
  const cpf = document.getElementById('funcCpf').value.trim();
  const postoSelect = document.getElementById('funcPosto');
  const postoId = postoSelect.value;
  const postoNome = postoSelect.options[postoSelect.selectedIndex]?.dataset.nome || '';
  const funcao = document.getElementById('funcFuncao').value.trim();
  formatarFuncao({ value: funcao }); // garante formatação

  // Dias da semana
  const diasSelecionados = funcDiasHidden.value;
  if (!diasSelecionados) {
    alert('Selecione pelo menos um dia da semana.');
    return;
  }

  // Horários
  const inicio = document.getElementById('funcInicio').value.trim();
  const fim = document.getElementById('funcFim').value.trim();
  if (!inicio || !fim) {
    alert('Preencha horário de início e fim.');
    return;
  }

  // Valida formato HH:MM
  const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!horaRegex.test(inicio) || !horaRegex.test(fim)) {
    alert('Horário inválido. Use formato HH:MM (ex: 08:00, 17:30).');
    return;
  }

  // Cria descrição da jornada
  const mapaDias = {
    seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom'
  };
  const diasArray = diasSelecionados.split(',');
  const diasFormatados = diasArray.map(d => mapaDias[d]).join(', ');
  const jornadaDesc = `${diasFormatados} · ${inicio} às ${fim}`;

  const dadosFuncionario = {
    nome,
    cpf,
    postoId,
    postoNome,
    funcao,
    diasTrabalho: diasArray, // array de dias
    horaInicio: inicio,
    horaFim: fim,
    jornadaDesc // para exibição rápida
  };

  try {
    if (id) {
      const funcRef = doc(db, "funcionarios", id);
      await updateDoc(funcRef, dadosFuncionario);
    } else {
      await addDoc(collection(db, "funcionarios"), dadosFuncionario);
    }
    funcionarioForm.reset();
    setDiasSelecionados('');
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
  const funcaoFiltro = document.getElementById('filtroFuncaoFunc').value.toLowerCase();

  const dadosFiltrados = funcionariosData.filter(f => {
    if (!f) return false;
    const nome = (f.nome || '').toLowerCase();
    const matchNome = nome.includes(searchTerm);
    const matchPosto = !postoFiltro || (f.postoId || '') === postoFiltro;
    const funcao = (f.funcao || '').toLowerCase();
    const matchFuncao = !funcaoFiltro || funcao.includes(funcaoFiltro);
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
let presencasHojeMap = new Map();

function carregarPresenca() {
  const qFuncionarios = query(collection(db, "funcionarios"), orderBy("nome"));
  onSnapshot(qFuncionarios, async () => {
    await atualizarPresenca();
  });

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

  const funcSnapshot = await getDocs(collection(db, "funcionarios"));
  funcionariosPresenca = [];
  funcSnapshot.forEach(doc => {
    funcionariosPresenca.push({ id: doc.id, ...doc.data() });
  });

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
  const funcaoFiltro = document.getElementById('filtroFuncaoPresenca').value.toLowerCase();
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

    const funcao = (f.funcao || '').toLowerCase();
    const matchFuncao = !funcaoFiltro || funcao.includes(funcaoFiltro);

    // Determinar status
    let status = 'Folga';
    let statusClass = 'folga';

    const diasTrabalho = f.diasTrabalho || [];
    const isDiaTrabalho = diasTrabalho.includes(diaHoje);

    if (isDiaTrabalho) {
      if (presencasHojeMap.has(f.id)) {
        status = 'Confirmado';
        statusClass = 'confirmado';
      } else {
        status = 'Aguardando';
        statusClass = 'aguardando';
      }
    }

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

function setupFiltros() {
  document.getElementById('searchFuncionarios').addEventListener('input', aplicarFiltrosFuncionarios);
  document.getElementById('filtroPostoFunc').addEventListener('change', aplicarFiltrosFuncionarios);
  document.getElementById('filtroFuncaoFunc').addEventListener('input', aplicarFiltrosFuncionarios);

  document.getElementById('searchPostos').addEventListener('input', filtrarPostos);

  document.getElementById('searchPresenca').addEventListener('input', aplicarFiltrosPresenca);
  document.getElementById('filtroPostoPresenca').addEventListener('change', aplicarFiltrosPresenca);
  document.getElementById('filtroFuncaoPresenca').addEventListener('input', aplicarFiltrosPresenca);
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
      // Preenche dias e horários
      setDiasSelecionados(data.diasTrabalho ? data.diasTrabalho.join(',') : '');
      document.getElementById('funcInicio').value = data.horaInicio || '';
      document.getElementById('funcFim').value = data.horaFim || '';
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
    } else if (tipo === 'funcionario') {
      await deleteDoc(doc(db, "funcionarios", id));
    }
  } catch (error) {
    alert('Erro ao excluir: ' + error.message);
  }
}

// ---------- FUNÇÕES PARA MOBILE (FILTRO OCULTO) ----------
function setupMobileFilters() {
  const filtrosBars = document.querySelectorAll('.filtros-bar');
  
  filtrosBars.forEach(bar => {
    if (bar.querySelector('.btn-filtro-mobile')) return;

    const filtrosDiv = bar.querySelector('.filtros');
    if (!filtrosDiv) return;

    const btnFiltro = document.createElement('div');
    btnFiltro.className = 'btn-filtro-mobile';
    btnFiltro.innerHTML = '<i class="fas fa-filter"></i>';
    
    const searchBox = bar.querySelector('.search-box');
    if (searchBox) {
      searchBox.insertAdjacentElement('afterend', btnFiltro);
    } else {
      bar.appendChild(btnFiltro);
    }

    btnFiltro.addEventListener('click', (e) => {
      e.stopPropagation();
      filtrosDiv.classList.toggle('show');
      btnFiltro.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!bar.contains(e.target)) {
        filtrosDiv.classList.remove('show');
        btnFiltro.classList.remove('active');
      }
    });
  });
}

function fecharFiltroMobile() {
  document.querySelectorAll('.filtros').forEach(f => f.classList.remove('show'));
  document.querySelectorAll('.btn-filtro-mobile').forEach(b => b.classList.remove('active'));
}