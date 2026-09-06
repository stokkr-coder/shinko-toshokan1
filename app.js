const MIDIAS = {
  '0T': 'Teologia',
  '0L': 'Literatura & Ficção',
  '3M': 'Mangás/LN',
  '4M': 'Manhwas',
  '5M': 'Manhuas',
  '1C': 'Comics/HQs',
};

let acervo = [];
let filtroMidia = null;

async function iniciar() {
  try {
    const resp = await fetch('./data/acervo.json', { cache: 'no-store' });
    const json = await resp.json();
    acervo = json.itens || [];
  } catch (e) {
    document.getElementById('contagem').textContent = 'Erro ao carregar o acervo.';
    return;
  }

  document.getElementById('contagem').textContent = `${acervo.length} item(ns) no acervo`;
  montarChips();
  renderizar(acervo);
}

function montarChips() {
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
      <div class="item-titulo">${i.titulo}</div>
      ${i.serie ? `<div class="item-serie">${i.serie}</div>` : ''}
      <div class="item-autor">${i.autor}</div>
      <div class="item-rodape">
        <span class="item-id">${i.id}</span>
        <span>${MIDIAS[i.midia] || i.midia}</span>
      </div>
    </div>
  `).join('');
}

document.getElementById('busca').addEventListener('input', aplicarFiltros);

iniciar();
