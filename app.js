const MIDIAS = {
  '0T': 'Teologia',
  '0L': 'Literatura & Ficção',
  '3M': 'Mangás/LN',
  '4M': 'Manhwas',
  '5M': 'Manhuas',
  '1C': 'Comics/HQs',
};

const STATUS_LABELS = { quero_ler: '📌 Quero ler', lendo: '📖 Lendo', lido: '✅ Lido' };

// Paleta de "encadernação" para lombadas sem capa — tons de couro/tecido que
// combinam com a madeira da estante. A cor é escolhida de forma determinística
// a partir do ID, então o mesmo livro sempre cai na mesma cor.
const CORES_LOMBADA = ['#6b2d2d', '#2d4a5e', '#3f5c3f', '#5c4a2d', '#4a2d5c', '#2d5c56', '#6b4423', '#3d3d5c'];

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
  montarChipsStatus();
  montarChipsMidia();
  renderizar(acervo);
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
