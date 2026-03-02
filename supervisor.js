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

// Formatação da função (primeira letra maiúscula)
function formatarFuncao(input) {
  let valor = input.value.trim();
  if (valor.length > 0) {
    valor = valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
    input.value = valor;
  }
}
const funcaoInput = document.getElementById('funcFuncao');
if (funcaoInput) {
  funcaoInput.addEventListener('blur', () => formatarFuncao(funcaoInput));
}

// Máscara de horário (formato 1700 -> 17:00)
function mascaraHorario(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length >= 3) {
    v = v.substring(0, 4);
    v = v.replace(/^(\d{2})(\d{2})$/, '$1:$2');
  }
  input.value = v;
}

// Inicialização
function iniciar() {
  carregarPostos();
  carregarFuncionarios();
  carregarPresenca();
  setupFiltros();
  setupMobileFilters(); // Reaproveita função anterior (se existir)
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
const jornadasContainer = document.getElementById('jornadasContainer');
const addJornadaBtn = document.getElementById('addJornadaBtn');

// Função para criar um bloco de jornada (vazio ou preenchido)
function criarBlocoJornada(dados = { dias: [], horaInicio: '', horaFim: '' }, index = Date.now()) {
  const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const nomesDias = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };

  const bloco = document.createElement('div');
  bloco.className = 'jornada-bloco';
  bloco.dataset.index = index;

  // Botão remover (se não for o único)
  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.className = 'btn-remover-jornada';
  btnRemover.innerHTML = '<i class="fas fa-times"></i>';
  btnRemover.addEventListener('click', () => {
    if (document.querySelectorAll('.jornada-bloco').length > 1) {
      bloco.remove();
    } else {
      alert('É necessário pelo menos uma jornada.');
    }
  });

  // Container dos botões de dia
  const diasDiv = document.createElement('div');
  diasDiv.className = 'dias-botoes';

  diasSemana.forEach(dia => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn-dia ${dados.dias.includes(dia) ? 'selected' : ''}`;
    btn.textContent = nomesDias[dia];
    btn.dataset.dia = dia;
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
    });
    diasDiv.appendChild(btn);
  });

  // Campos de horário
  const horarioRow = document.createElement('div');
  horarioRow.className = 'form-row';

  const inicioGroup = document.createElement('div');
  inicioGroup.className = 'form-group';
  inicioGroup.innerHTML = `
    <label>Início</label>
    <input type="text" class="horario-inicio" placeholder="HH:MM" value="${dados.horaInicio}" maxlength="5">
  `;

  const fimGroup = document.createElement('div');
  fimGroup.className = 'form-group';
  fimGroup.innerHTML = `
    <label>Fim</label>
    <input type="text" class="horario-fim" placeholder="HH:MM" value="${dados.horaFim}" maxlength="5">
  `;

  horarioRow.appendChild(inicioGroup);
  horarioRow.appendChild(fimGroup);

  // Aplica máscara aos inputs de hora
  const inicioInput = inicioGroup.querySelector('input');
  const fimInput = fimGroup.querySelector('input');
  inicioInput.addEventListener('input', () => mascaraHorario(inicioInput));
  fimInput.addEventListener('input', () => mascaraHorario(fimInput));

  bloco.appendChild(btnRemover);
  bloco.appendChild(diasDiv);
  bloco.appendChild(horarioRow);

  return bloco;
}

// Adicionar nova jornada ao clicar no botão
addJornadaBtn.addEventListener('click', () => {
  const novoBloco = criarBlocoJornada();
  jornadasContainer.appendChild(novoBloco);
});

// Função para coletar os dados das jornadas do formulário
function coletarJornadas() {
  const blocos = document.querySelectorAll('.jornada-bloco');
  const jornadas = [];

  blocos.forEach(bloco => {
    const diasSelecionados = [];
    bloco.querySelectorAll('.btn-dia.selected').forEach(btn => {
      diasSelecionados.push(btn.dataset.dia);
    });

    const horaInicio = bloco.querySelector('.horario-inicio').value;
    const horaFim = bloco.querySelector('.horario-fim').value;

    // Só adiciona se tiver pelo menos um dia e horários preenchidos
    if (diasSelecionados.length > 0 && horaInicio && horaFim) {
      jornadas.push({
        dias: diasSelecionados,
        horaInicio,
        horaFim
      });
    }
  });

  return jornadas;
}

// Preencher o formulário com os dados do funcionário (inclusive jornadas)
async function preencherFormFuncionario(dados) {
  document.getElementById('funcNome').value = dados.nome || '';
  document.getElementById('funcCpf').value = dados.cpf || '';
  document.getElementById('funcFuncao').value = dados.funcao || '';
  await preencherSelectPostos(dados.postoId);
  
  // Limpar container de jornadas
  jornadasContainer.innerHTML = '';
  
  // Adicionar blocos de jornada
  if (dados.jornadas && dados.jornadas.length > 0) {
    dados.jornadas.forEach(j => {
      const bloco = criarBlocoJornada(j);
      jornadasContainer.appendChild(bloco);
    });
  } else {
    // Se não houver, adiciona um bloco vazio
    jornadasContainer.appendChild(criarBlocoJornada());
  }
}

novoFuncionarioBtn.addEventListener('click', () => {
  preencherSelectPostos();
  funcionarioForm.reset();
  funcIdField.value = '';
  funcFormTitle.innerText = 'Cadastrar Funcionário';
  
  // Limpar e adicionar um bloco de jornada padrão
  jornadasContainer.innerHTML = '';
  jornadasContainer.appendChild(criarBlocoJornada());
  
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
  const funcaoFormatada = funcao.charAt(0).toUpperCase() + funcao.slice(1).toLowerCase();
  const jornadas = coletarJornadas();

  if (!nome || !cpf || !postoId || !funcaoFormatada || jornadas.length === 0) {
    alert('Preencha todos os campos e adicione pelo menos uma jornada válida.');
    return;
  }

  try {
    if (id) {
      const funcRef = doc(db, "funcionarios", id);
      await updateDoc(funcRef, { 
        nome, 
        cpf, 
        postoId, 
        postoNome, 
        funcao: funcaoFormatada, 
        jornadas 
      });
    } else {
      await addDoc(collection(db, "funcionarios"), { 
        nome, 
        cpf, 
        postoId, 
        postoNome, 
        funcao: funcaoFormatada, 
        jornadas 
      });
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
  const funcaoFiltro = document.getElementById('filtroFuncaoFunc').value.toLowerCase();

  const dadosFiltrados = funcionariosData.filter(f => {
    if (!f) return false;
    const nome = (f.nome || '').toLowerCase();
    const matchNome = nome.includes(searchTerm);
    const matchPosto = !postoFiltro || (f.postoId || '') === postoFiltro;
    const matchFuncao = !funcaoFiltro || (f.funcao || '').toLowerCase().includes(funcaoFiltro);
    return matchNome && matchPosto && matchFuncao;
  });

  let html = '';
  dadosFiltrados.forEach(f => {
    // Formatar exibição das jornadas
    let jornadasStr = '';
    if (f.jornadas && f.jornadas.length > 0) {
      jornadasStr = f.jornadas.map(j => {
        const dias = j.dias.map(d => {
          const mapa = { seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom' };
          return mapa[d] || d;
        }).join(', ');
        return `${dias} ${j.horaInicio}-${j.horaFim}`;
      }).join(' | ');
    }

    html += `<tr>
      <td>${f.nome || ''}</td>
      <td>${f.cpf || ''}</td>
      <td>${f.postoNome || ''}</td>
      <td>${f.funcao || ''}</td>
      <td>${jornadasStr}</td>
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

    // Determinar status baseado nas jornadas
    let status = 'Folga';
    let statusClass = 'folga';
    let jornadaDesc = 'Folga';

    if (f.jornadas && f.jornadas.length > 0) {
      // Verifica se algum dos blocos de jornada inclui o dia de hoje
      const jornadaHoje = f.jornadas.find(j => j.dias.includes(diaHoje));
      if (jornadaHoje) {
        if (presencasHojeMap.has(f.id)) {
          status = 'Confirmado';
          statusClass = 'confirmado';
        } else {
          status = 'Aguardando';
          statusClass = 'aguardando';
        }
        jornadaDesc = `${jornadaHoje.horaInicio} - ${jornadaHoje.horaFim}`;
      }
    }

    f._status = status;
    f._statusClass = statusClass;
    f._jornadaDesc = jornadaDesc;

    const matchStatus = !statusFiltro || status === statusFiltro;

    return matchNome && matchPosto && matchFuncao && matchStatus;
  });

  let html = '';
  dadosFiltrados.forEach(f => {
    html += `<tr>
      <td>${f.nome || ''}</td>
      <td>${f.postoNome || ''}</td>
      <td>${f.funcao || ''}</td>
      <td>${f._jornadaDesc}</td>
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
      funcIdField.value = id;
      funcFormTitle.innerText = 'Editar Funcionário';
      await preencherFormFuncionario(docSnap.data());
      formFuncionario.style.display = 'block';
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

// Função para filtro mobile (pode ser mantida, mas não é essencial agora)
function setupMobileFilters() {
  // Implementação anterior, se desejar manter
}