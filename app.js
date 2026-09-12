const MIDIAS = {
  '0T': { nome: 'Teologia & Estudos Religiosos', descricao: 'Ensaios teológicos, doutrina, patrística, sermões, apologética e documentos eclesiásticos.' },
  '0L': { nome: 'Literatura & Ficção Geral', descricao: 'Romances, ficção cristã, suspense, terror, ficção científica, poesia e teatro.' },
  '3M': { nome: 'Mangás & Light Novels', descricao: 'Quadrinhos, artes e light novels de origem japonesa.' },
  '4M': { nome: 'Manhwas', descricao: 'Quadrinhos e webtoons de origem coreana.' },
  '5M': { nome: 'Manhuas', descricao: 'Quadrinhos de origem chinesa/taiwanesa.' },
  '1C': { nome: 'Comics / HQs Ocidentais', descricao: 'HQs americanas, europeias (franco-belga) e brasileiras.' },
};

// Bloco de gêneros de ficção, compartilhado por 0L / 3M / 4M / 5M / 1C.
const GENEROS_FICCAO = {
  '30': { nome: 'Terror, Horror, Thriller & Gótico', descricao: 'Ficção de horror, suspense cósmico e mistério sombrio.' },
  '34': { nome: 'Ficção Apocalíptica & Sobrevivência / Zumbis', descricao: 'Ficção apocalíptica secular e histórias de contaminação.' },
  '35': { nome: 'Thriller Cristão, Guerra Espiritual & Sobrenatural', descricao: 'Suspense com combate espiritual ou elementos bíblicos.' },
  '40': { nome: 'Ficção Científica Genérica / Hard Sci-Fi', descricao: 'Sci-fi e space opera sem franquia específica.' },
  '41': { nome: 'Light Novels / Isekai Militar', descricao: 'Light novels de fantasia militar, isekai tático.' },
  '42': { nome: 'Perry Rhodan', descricao: 'Série Perry Rhodan e spin-offs diretos.' },
  '43': { nome: 'Star Trek', descricao: 'Franquia Star Trek — romances, quadrinhos, tie-ins.' },
  '44': { nome: 'Star Wars', descricao: 'Franquia Star Wars — romances, quadrinhos, tie-ins.' },
  '45': { nome: 'Doctor Who', descricao: 'Franquia Doctor Who — romances, quadrinhos, tie-ins.' },
  '46': { nome: 'Babylon 5', descricao: 'Franquia Babylon 5 — romances, quadrinhos, tie-ins.' },
  '47': { nome: 'Battlestar Galactica', descricao: 'Franquia Battlestar Galactica — romances, quadrinhos, tie-ins.' },
  '48': { nome: 'Universos Expandidos (outros)', descricao: 'Tie-ins de outras franquias sci-fi não listadas.' },
  '49': { nome: 'Distopia / Steampunk', descricao: 'Distopias e ficção steampunk/retrofuturista.' },
  '51': { nome: 'Fantasia Épica & Mítica', descricao: 'Fantasia de alto nível, mitologia recontada.' },
  '55': { nome: 'Ficção Cristã, Fantasia Teológica & Alegoria', descricao: 'Romances alegóricos e fantasia de inspiração cristã.' },
  '60': { nome: 'Drama, Slice of Life & Literatura Geral', descricao: 'Romances contemporâneos, ficção humanista.' },
  '65': { nome: 'Artes Marciais, Cultivo & Wuxia/Xianxia', descricao: 'Ficção de cultivo/artes marciais chinesa e derivados.' },
  '70': { nome: 'Super-Heróis & Ação Heroica', descricao: 'HQs de super-heróis e ação heroica em geral.' },
  '75': { nome: 'Mistério & Policial Confessional', descricao: 'Histórias investigativas com temática clerical.' },
  '80': { nome: 'Humor, Sátira & Crônicas', descricao: 'Ficção cômica, textos satíricos e compilações de humor.' },
};

const GENEROS = {
  '0T': {
    '01': { nome: 'Patrística & Concílios', descricao: 'Escritos dos Padres da Igreja e apologética primitiva.' },
    '02': { nome: 'Escolástica & Doutrina', descricao: 'Filosofia e teologia medieval/moderna católica.' },
    '03': { nome: 'Ensaios, Apologética & Aforismos', descricao: 'Obras defensivas e ensaios confessionalmente católicos.' },
    '04': { nome: 'Sistemática & Reformada', descricao: 'Teologia dogmática e doutrina reformada/evangélica.' },
    '05': { nome: 'Puritanismo, Sermões & Espiritualidade', descricao: 'Coleções de sermões e devocionais puritanos.' },
    '06': { nome: 'Apologética Protestante & Ensaios', descricao: 'Apologética e filosofia de viés protestante/anglicano.' },
    '07': { nome: 'Estudos Bíblicos & História da Igreja', descricao: 'Comentários bíblicos, hermenêutica e historiografia cristã.' },
  },
  '0L': GENEROS_FICCAO, '3M': GENEROS_FICCAO, '4M': GENEROS_FICCAO, '5M': GENEROS_FICCAO, '1C': GENEROS_FICCAO,
};

const STATUS_LABELS = { quero_ler: 'Quero ler', lendo: 'Lendo', lido: 'Lido' };

let acervo = [];
let metas = {};
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
    if (respMeta && respMeta.ok) metas = (await respMeta.json()).metas || {};
  } catch (e) {
    document.getElementById('contagem').textContent = 'Erro ao carregar o acervo.';
    return;
  }

  document.getElementById('navTotalAcervo').textContent = acervo.length;
  document.getElementById('navTotalLendo').textContent = acervo.filter((i) => i.status === 'lendo').length;
  document.getElementById('navTotalQuerLer').textContent = acervo.filter((i) => i.status === 'quero_ler').length;
  document.getElementById('contagem').textContent = `${acervo.length} registro(s) catalogado(s)`;

  renderMetricsStrip();
  montarChipsStatus();
  montarChipsMidia();
  renderAcervo(acervo);
  renderTaxonomia();
  renderLeitura();
  renderQueroLer();
}

// ---------- Navegação entre telas ----------
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('ativo'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('ativa'));
    btn.classList.add('ativo');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('ativa');
    window.scrollTo({ top: 0 });
  });
});

// ---------- Metrics strip ----------
function renderMetricsStrip() {
  const lidos = acervo.filter((i) => i.status === 'lido');
  const paginasLidas = lidos.reduce((soma, i) => soma + (Number(i.paginas) || 0), 0);

  const anoAtual = new Date().getFullYear();
  const metaAno = metas[String(anoAtual)];
  let cardMeta;
  if (metaAno) {
    const lidosNoAno = lidos.filter((i) => i.dataConclusao && i.dataConclusao.startsWith(String(anoAtual))).length;
    const pct = Math.min(100, Math.round((lidosNoAno / metaAno) * 100));
    cardMeta = { indice: '04', label: `meta ${anoAtual} — ${lidosNoAno} de ${metaAno}`, valor: `${pct}%`, accent: true };
  } else {
    cardMeta = { indice: '04', label: `sem meta definida para ${anoAtual}`, valor: '—', accent: true };
  }

  const cards = [
    { indice: '01', label: 'itens no acervo', valor: acervo.length },
    { indice: '02', label: 'lidos', valor: lidos.length },
    { indice: '03', label: 'páginas lidas', valor: paginasLidas.toLocaleString('pt-BR') },
    cardMeta,
  ];

  document.getElementById('metricsStrip').innerHTML = cards.map((c) => `
    <div class="metric-card ${c.accent ? 'accent' : ''}">
      <span class="metric-index"><b>${c.indice}</b></span>
      <div><strong>${c.valor}</strong><span>${c.label}</span></div>
    </div>
  `).join('');
}

// ---------- Filtros (Acervo) ----------
function montarChipsStatus() {
  const presentes = [...new Set(acervo.map((i) => i.status).filter(Boolean))];
  const container = document.getElementById('chipsStatus');
  if (presentes.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = presentes.map((c) => `<button class="chip" data-status="${c}">${STATUS_LABELS[c] || c}</button>`).join('');
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filtroStatus = filtroStatus === chip.dataset.status ? null : chip.dataset.status;
      container.querySelectorAll('.chip').forEach((c) => c.classList.toggle('ativo', c.dataset.status === filtroStatus));
      aplicarFiltros();
    });
  });
}

function montarChipsMidia() {
  const presentes = [...new Set(acervo.map((i) => i.midia))];
  const container = document.getElementById('chipsMidia');
  container.innerHTML = presentes.map((c) => `<button class="chip" data-midia="${c}">${(MIDIAS[c] || {}).nome || c}</button>`).join('');
  container.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filtroMidia = filtroMidia === chip.dataset.midia ? null : chip.dataset.midia;
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
      i.titulo.toLowerCase().includes(termo) || i.autor.toLowerCase().includes(termo) ||
      (i.serie || '').toLowerCase().includes(termo) || i.id.toLowerCase().includes(termo)
    );
  }
  renderAcervo(resultado);
}
document.getElementById('busca').addEventListener('input', aplicarFiltros);

// ---------- Cover / placeholder ----------
function coverHtml(item, classeExtra) {
  if (item.capa) return `<img class="record-cover ${classeExtra || ''}" src="${item.capa}" alt="" loading="lazy">`;
  return `<div class="cover-placeholder ${classeExtra || ''}">📖</div>`;
}

// ---------- Acervo ----------
function renderAcervo(itens) {
  const lista = document.getElementById('listaAcervo');
  const vazio = document.getElementById('vazio');
  if (itens.length === 0) { lista.innerHTML = ''; vazio.style.display = 'block'; return; }
  vazio.style.display = 'none';

  lista.innerHTML = itens.map((i) => `
    <div class="record-card" data-id="${i.id}">
      ${coverHtml(i)}
      <div class="record-body">
        <div class="record-title">${i.titulo}</div>
        ${i.serie ? `<div class="record-series">${i.serie}</div>` : ''}
        <div class="record-author">${i.autor}</div>
        <div class="record-meta">
          <span class="record-id-tag">${i.id}</span>
          ${i.status ? `<span class="status-tag ${i.status}">${STATUS_LABELS[i.status]}</span>` : ''}
          ${i.avaliacao ? `<span class="record-stars">${'★'.repeat(i.avaliacao)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  lista.querySelectorAll('.record-card').forEach((el) => {
    el.addEventListener('click', () => {
      const item = acervo.find((i) => i.id === el.dataset.id);
      if (item) abrirModal(item);
    });
  });
}

// ---------- Taxonomia ----------
// 0T tem tabela própria; as outras 5 mídias compartilham o mesmo bloco de
// gêneros de ficção — mostrar isso 5x seria repetitivo, então agrupamos.
function renderTaxonomia() {
  const container = document.getElementById('taxonomiaConteudo');

  const linhasMidia = Object.entries(MIDIAS).map(([codigo, midia]) => {
    const contagem = acervo.filter((i) => i.midia === codigo).length;
    return `
      <div class="taxonomy-row">
        <code>${codigo}</code>
        <div>
          <div class="nome-genero">${midia.nome}</div>
          <div class="desc-genero">${midia.descricao}</div>
        </div>
        <span class="contagem-genero">${contagem}</span>
      </div>
    `;
  }).join('');

  const grupoMidias = `
    <div class="taxonomy-group">
      <div class="taxonomy-group-heading">
        <div><p class="eyebrow">Códigos</p><h3>Mídia</h3></div>
      </div>
      ${linhasMidia}
    </div>
  `;

  const grupoTeologia = montarGrupoTaxonomia({
    eyebrow: '0T',
    titulo: MIDIAS['0T'].nome,
    subtitulo: null,
    generos: GENEROS['0T'],
    contarPorMidia: '0T',
  });

  const midiasFiccao = ['0L', '3M', '4M', '5M', '1C'];
  const grupoFiccao = montarGrupoTaxonomia({
    eyebrow: 'Ficção',
    titulo: 'Bloco de Ficção (compartilhado)',
    subtitulo: `Vale para: ${midiasFiccao.map((c) => MIDIAS[c].nome).join(', ')}`,
    generos: GENEROS_FICCAO,
    contarPorMidia: midiasFiccao,
  });

  container.innerHTML = grupoMidias + grupoTeologia + grupoFiccao;
}

function montarGrupoTaxonomia({ eyebrow, titulo, subtitulo, generos, contarPorMidia }) {
  const midiasAlvo = Array.isArray(contarPorMidia) ? contarPorMidia : [contarPorMidia];

  const linhas = Object.entries(generos).map(([codigoGenero, genero]) => {
    const contagem = acervo.filter((i) => midiasAlvo.includes(i.midia) && i.genero === codigoGenero).length;
    return `
      <div class="taxonomy-row">
        <code>${codigoGenero}</code>
        <div>
          <div class="nome-genero">${genero.nome}</div>
          <div class="desc-genero">${genero.descricao}</div>
        </div>
        <span class="contagem-genero">${contagem}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="taxonomy-group">
      <div class="taxonomy-group-heading">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h3>${titulo}</h3>
          ${subtitulo ? `<div class="desc-genero" style="margin-top:3px;">${subtitulo}</div>` : ''}
        </div>
      </div>
      ${linhas}
    </div>
  `;
}

// ---------- Leitura ----------
function renderLeitura() {
  const lendo = acervo.filter((i) => i.status === 'lendo');
  const lendoContainer = document.getElementById('lendoAgora');
  document.getElementById('lendoVazio').style.display = lendo.length ? 'none' : 'block';
  lendoContainer.innerHTML = lendo.map((i) => `
    <div class="reading-now-card" data-id="${i.id}">
      ${coverHtml(i)}
      <div>
        <p class="eyebrow">${(MIDIAS[i.midia] || {}).nome || i.midia}</p>
        <h3>${i.titulo}</h3>
        <p>${i.autor}${i.serie ? ' · ' + i.serie : ''}</p>
      </div>
    </div>
  `).join('');
  lendoContainer.querySelectorAll('.reading-now-card').forEach((el) => {
    el.addEventListener('click', () => {
      const item = acervo.find((i) => i.id === el.dataset.id);
      if (item) abrirModal(item);
    });
  });

  const lidos = acervo.filter((i) => i.status === 'lido').sort((a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || ''));
  const timeline = document.getElementById('timelineLidos');
  if (lidos.length === 0) {
    timeline.innerHTML = '<p style="padding:14px 12px; color:var(--tinta-mais-suave); font-size:0.82rem;">Nenhuma leitura concluída registrada ainda.</p>';
    return;
  }
  timeline.innerHTML = lidos.map((i) => `
    <div class="timeline-row" data-id="${i.id}">
      <time>${i.dataConclusao ? formatarData(i.dataConclusao) : '—'}</time>
      <div class="timeline-corpo">
        <strong>${i.titulo}</strong>
        <span class="record-author">${i.autor}</span>
      </div>
      ${i.avaliacao ? `<span class="record-stars">${'★'.repeat(i.avaliacao)}</span>` : ''}
    </div>
  `).join('');
  timeline.querySelectorAll('.timeline-row').forEach((el) => {
    el.addEventListener('click', () => {
      const item = acervo.find((i) => i.id === el.dataset.id);
      if (item) abrirModal(item);
    });
  });
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ---------- Quero ler ----------
function renderQueroLer() {
  const lista = acervo.filter((i) => i.status === 'quero_ler').sort((a, b) => (a.ordem ?? Infinity) - (b.ordem ?? Infinity));
  const container = document.getElementById('listaQueroLer');
  document.getElementById('queroLerVazio').style.display = lista.length ? 'none' : 'block';

  container.innerHTML = lista.map((i, idx) => `
    <div class="want-card" data-id="${i.id}">
      <span class="want-order">${idx + 1}</span>
      ${coverHtml(i)}
      <div class="want-body">
        <h3>${i.titulo}</h3>
        <p>${i.autor}${i.serie ? ' · ' + i.serie : ''}</p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.want-card').forEach((el) => {
    el.addEventListener('click', () => {
      const item = acervo.find((i) => i.id === el.dataset.id);
      if (item) abrirModal(item);
    });
  });
}

// ---------- Modal de detalhe ----------
function abrirModal(item) {
  document.getElementById('modalCapaWrap').innerHTML = coverHtml(item);
  document.getElementById('modalSerie').textContent = item.serie || '';
  document.getElementById('modalSerie').style.display = item.serie ? 'block' : 'none';
  document.getElementById('modalTitulo').textContent = item.titulo;
  document.getElementById('modalAutor').textContent = item.autor;

  const estrelas = document.getElementById('modalEstrelas');
  estrelas.textContent = item.avaliacao ? '★'.repeat(item.avaliacao) + '☆'.repeat(5 - item.avaliacao) : '';
  estrelas.style.display = item.avaliacao ? 'block' : 'none';

  const statusEl = document.getElementById('modalStatus');
  statusEl.textContent = item.status ? STATUS_LABELS[item.status] : '';
  statusEl.className = `status-tag ${item.status || ''}`;
  statusEl.style.display = item.status ? 'inline-block' : 'none';

  document.getElementById('modalMidia').textContent = (MIDIAS[item.midia] || {}).nome || item.midia;
  document.getElementById('modalId').textContent = item.id;

  document.getElementById('modalOverlay').style.display = 'flex';
}

function fecharModal() { document.getElementById('modalOverlay').style.display = 'none'; }
document.getElementById('modalFechar').addEventListener('click', fecharModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => { if (e.target.id === 'modalOverlay') fecharModal(); });

iniciar();
