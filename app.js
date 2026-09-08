const MIDIAS = {
  '0T': 'Teologia',
  '0L': 'Literatura & Ficção',
  '3M': 'Mangás/LN',
  '4M': 'Manhwas',
  '5M': 'Manhuas',
  '1C': 'Comics/HQs',
};

// Nomes curtos de gênero, só para exibição no dashboard (mesmos códigos de
// lib/taxonomia.js no projeto desktop, resumidos).
const GENEROS_NOMES = {
  '01': 'Patrística', '02': 'Escolástica', '03': 'Apologética Católica',
  '04': 'Sist. Reformada', '05': 'Puritanismo', '06': 'Apologética Prot.', '07': 'Estudos Bíblicos',
  '30': 'Terror/Horror', '34': 'Apocalíptico', '35': 'Thriller Cristão',
  '40': 'Sci-Fi', '41': 'Isekai/LN Militar', '42': 'Perry Rhodan', '43': 'Star Trek',
  '44': 'Star Wars', '45': 'Doctor Who', '46': 'Babylon 5', '47': 'Battlestar Galactica',
  '48': 'Univ. Expandidos', '49': 'Distopia/Steampunk', '51': 'Fantasia Épica',
  '55': 'Ficção Cristã', '60': 'Drama/Slice of Life', '65': 'Cultivo/Wuxia',
  '70': 'Super-Heróis', '75': 'Mistério', '80': 'Humor/Sátira',
};

const STATUS_LABELS = { quero_ler: '📌 Quero ler', lendo: '📖 Lendo', lido: '✅ Lido' };

// Paleta de lombada (livros sem capa) — variações derivadas da paleta principal.
const CORES_LOMBADA = ['#425F70', '#5F9891', '#9C7870', '#7A9182', '#6B5A4A', '#364A57', '#4F7A74', '#7C5C56'];

function corLombada(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CORES_LOMBADA[hash % CORES_LOMBADA.length];
}

let acervo = [];
let filtroMidia = null;
let filtroStatus = null;

async function iniciar() {
  try {
    const [respAcervo, respMeta] = await Promise.all([
      fetch('./data/acervo.json', { cache: 'no-store' }),
      fetch('./data/meta.json', { cache: 'no-store' }).catch(() => null),
    ]);
    const json = await respAcervo.json();
    acervo = json.itens || [];

    if (respMeta && respMeta.ok) {
      const metaJson = await respMeta.json();
      montarMetaLeitura(metaJson.metas || {});
    }
  } catch (e) {
    document.getElementById('contagem').textContent = 'Erro ao carregar o acervo.';
    return;
  }

  document.getElementById('contagem').textContent = `${acervo.length} item(ns) na estante`;
  montarDashboard();
  montarChipsStatus();
  montarChipsMidia();
  renderizar(acervo);
}

// ---------- Dashboard ----------
function montarDashboard() {
  const total = acervo.length;
  const lidos = acervo.filter((i) => i.status === 'lido');
  const paginasLidas = lidos.reduce((soma, i) => soma + (Number(i.paginas) || 0), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statLidos').textContent = lidos.length;
  document.getElementById('statPaginas').textContent = paginasLidas.toLocaleString('pt-BR');

  renderizarBarras('barrasGenero', contarPor(acervo, 'genero', GENEROS_NOMES), 'genero', 6);
  renderizarBarras('barrasMidia', contarPor(acervo, 'midia', MIDIAS), 'midia', 6);
}

function contarPor(itens, campo, nomes) {
  const contagem = {};
  itens.forEach((i) => {
    const chave = i[campo];
    if (!chave) return;
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  return Object.entries(contagem)
    .map(([codigo, quantidade]) => ({ codigo, nome: nomes[codigo] || codigo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

function renderizarBarras(idContainer, dados, classeCor, limite) {
  const container = document.getElementById(idContainer);
  if (dados.length === 0) {
    container.innerHTML = '<p class="barra-vazia">Sem dados ainda.</p>';
    return;
  }
  const lista = dados.slice(0, limite);
  const maior = lista[0].quantidade;

  container.innerHTML = lista.map((d) => `
    <div class="barra-linha">
      <span class="barra-label" title="${d.nome}">${d.nome}</span>
      <span class="barra-trilha"><span class="barra-preenchida ${classeCor}" style="width:${Math.max(6, Math.round((d.quantidade / maior) * 100))}%"></span></span>
      <span class="barra-valor">${d.quantidade}</span>
    </div>
  `).join('');
}

function montarMetaLeitura(metas) {
  const anoAtual = new Date().getFullYear();
  const meta = metas[String(anoAtual)];
  if (!meta) return;

  const lidosNoAno = acervo.filter((i) => i.status === 'lido' && i.dataConclusao && i.dataConclusao.startsWith(String(anoAtual))).length;
  const porcentagem = Math.min(100, Math.round((lidosNoAno / meta) * 100));

  document.getElementById('metaTexto').textContent = `Meta ${anoAtual} — ${lidosNoAno} de ${meta} lidos`;
  document.getElementById('metaPorcentagem').textContent = `${porcentagem}%`;
  document.getElementById('metaBarraPreenchida').style.width = `${porcentagem}%`;
  document.getElementById('metaLeitura').style.display = 'block';
}

// ---------- Filtros ----------
function montarChipsStatus() {
  const statusPresentes = [...new Set(acervo.map((i) => i.status).filter(Boolean))];
  if (statusPresentes.length === 0) return;

  const container = document.getElementById('chipsStatus');
  container.innerHTML = statusPresentes.map((codigo) =>
    `<button class="chip" data-status="${codigo}">${STATUS_LABELS[codigo] || codigo}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const codigo = chip.dataset.status;
      filtroStatus = filtroStatus === codigo ? null : codigo;
      container.querySelectorAll('.chip').forEach((c) => c.classList.toggle('ativo', c.dataset.status === filtroStatus));
      aplicarFiltros();
    });
  });
}

function montarChipsMidia() {
  const midiasPresentes = [...new Set(acervo.map((i) => i.midia))];
  const container = document.getElementById('chipsMidia');
  container.innerHTML = midiasPresentes.map((codigo) =>
    `<button class="chip" data-midia="${codigo}">${MIDIAS[codigo] || codigo}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const codigo = chip.dataset.midia;
      filtroMidia = filtroMidia === codigo ? null : codigo;
      container.querySelectorAll('.chip').forEach((c) => c.classList.toggle('ativo', c.dataset.midia === filtroMidia));
      aplicarFiltros();
    });
  });
}

function aplicarFiltros() {
  const termo = document.getElementById('busca').value.trim().toLowerCase();
  let resultado = acervo;

  if (filtroMidia) resultado = resultado.filter((i) => i.midia === filtroMidia);
  if (filtroStatus) resultado = resultado.filter((i) => i.status === filtroStatus);

  if (termo) {
    resultado = resultado.filter((i) =>
      i.titulo.toLowerCase().includes(termo) ||
      i.autor.toLowerCase().includes(termo) ||
      (i.serie || '').toLowerCase().includes(termo) ||
      i.id.toLowerCase().includes(termo)
    );
  }

  renderizar(resultado);
}

// ---------- Estante ----------
function miniaturaHtml(item) {
  if (item.capa) {
    return `<img class="livro-capa" src="${item.capa}" alt="" loading="lazy">`;
  }
  return `
    <div class="livro-lombada" style="background:${corLombada(item.id)}">
      <span class="livro-lombada-texto">${item.titulo}</span>
    </div>
  `;
}

function renderizar(itens) {
  const estante = document.getElementById('estante');
  const vazio = document.getElementById('vazio');

  if (itens.length === 0) {
    estante.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  estante.innerHTML = itens.map((i) => `
    <div class="livro" data-id="${i.id}">
      ${miniaturaHtml(i)}
      ${i.status ? `<span class="status-ponto ${i.status}"></span>` : ''}
      ${i.avaliacao ? `<div class="livro-estrelas">${'★'.repeat(i.avaliacao)}</div>` : ''}
    </div>
  `).join('');

  estante.querySelectorAll('.livro').forEach((el) => {
    el.addEventListener('click', () => {
      const item = acervo.find((i) => i.id === el.dataset.id);
      if (item) abrirModal(item);
    });
  });
}

// ---------- Modal de detalhe ----------
function abrirModal(item) {
  document.getElementById('modalCapaWrap').innerHTML = item.capa
    ? `<img src="${item.capa}" alt="">`
    : `<div class="livro-lombada" style="background:${corLombada(item.id)}"><span class="livro-lombada-texto">${item.titulo}</span></div>`;

  document.getElementById('modalSerie').textContent = item.serie || '';
  document.getElementById('modalSerie').style.display = item.serie ? 'block' : 'none';
  document.getElementById('modalTitulo').textContent = item.titulo;
  document.getElementById('modalAutor').textContent = item.autor;

  const estrelas = document.getElementById('modalEstrelas');
  estrelas.textContent = item.avaliacao ? '★'.repeat(item.avaliacao) + '☆'.repeat(5 - item.avaliacao) : '';
  estrelas.style.display = item.avaliacao ? 'block' : 'none';

  const statusEl = document.getElementById('modalStatus');
  statusEl.textContent = item.status ? STATUS_LABELS[item.status] : '';
  statusEl.style.display = item.status ? 'inline-block' : 'none';

  document.getElementById('modalMidia').textContent = MIDIAS[item.midia] || item.midia;
  document.getElementById('modalId').textContent = item.id;

  document.getElementById('modalOverlay').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

document.getElementById('modalFechar').addEventListener('click', fecharModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') fecharModal();
});

document.getElementById('busca').addEventListener('input', aplicarFiltros);

iniciar();
