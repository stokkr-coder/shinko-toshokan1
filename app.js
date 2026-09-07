const MIDIAS = {
  '0T': 'Teologia',
  '0L': 'Literatura & Ficção',
  '3M': 'Mangás/LN',
  '4M': 'Manhwas',
  '5M': 'Manhuas',
  '1C': 'Comics/HQs',
};

const STATUS_LABELS = { quero_ler: '📌 Quero ler', lendo: '📖 Lendo', lido: '✅ Lido' };

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

  document.getElementById('contagem').textContent = `${acervo.length} item(ns) no acervo`;
  montarChipsStatus();
  montarChipsMidia();
  renderizar(acervo);
}

function montarMetaLeitura(metas) {
  const anoAtual = new Date().getFullYear();
  const meta = metas[String(anoAtual)];
  if (!meta) return; // sem meta definida para o ano — não mostra a barra

  const lidosNoAno = acervo.filter((i) => i.status === 'lido' && i.dataConclusao && i.dataConclusao.startsWith(String(anoAtual))).length;
  const porcentagem = Math.min(100, Math.round((lidosNoAno / meta) * 100));

  document.getElementById('metaTexto').textContent = `🎯 Meta ${anoAtual}: ${lidosNoAno} de ${meta} lidos`;
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

function renderizar(itens) {
  const lista = document.getElementById('lista');
  const vazio = document.getElementById('vazio');

  if (itens.length === 0) {
    lista.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  lista.innerHTML = itens.map((i) => `
    <div class="item">
      ${i.capa
        ? `<img class="item-capa" src="${i.capa}" alt="" loading="lazy">`
        : `<div class="item-capa-vazia">📖</div>`}
      <div class="item-corpo">
        <div class="item-titulo">${i.titulo}</div>
        ${i.serie ? `<div class="item-serie">${i.serie}</div>` : ''}
        <div class="item-autor">${i.autor}</div>
        ${i.avaliacao ? `<div class="item-estrelas">${'⭐'.repeat(i.avaliacao)}</div>` : ''}
        <div class="item-rodape">
          <span class="item-id">${i.id}</span>
          ${i.status ? `<span class="status-badge ${i.status}">${STATUS_LABELS[i.status]}</span>` : ''}
          <span>${MIDIAS[i.midia] || i.midia}</span>
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('busca').addEventListener('input', aplicarFiltros);

iniciar();
