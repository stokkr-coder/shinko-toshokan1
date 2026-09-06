const el = (id) => document.getElementById(id);

// ---------- Navegação por abas ----------
document.querySelectorAll('.aba-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.aba-btn').forEach((b) => b.classList.remove('ativa'));
    document.querySelectorAll('.aba-conteudo').forEach((c) => c.classList.remove('ativa'));
    btn.classList.add('ativa');
    el(`aba-${btn.dataset.aba}`).classList.add('ativa');
    if (btn.dataset.aba === 'acervo') carregarAcervo();
  });
});

// ---------- Taxonomia ----------
async function carregarMidias() {
  const midias = await fetch('/api/taxonomia/midias').then((r) => r.json());
  const select = el('midia');
  select.innerHTML = midias.map((m) => `<option value="${m.codigo}">${m.codigo} — ${m.nome}</option>`).join('');
  await carregarGeneros();
}

async function carregarGeneros() {
  const midia = el('midia').value;
  const generos = await fetch(`/api/taxonomia/generos/${midia}`).then((r) => r.json());
  const select = el('genero');
  select.innerHTML = generos.map((g) => `<option value="${g.codigo}">${g.codigo} — ${g.nome}</option>`).join('');
  atualizarPreviaId();
}

el('midia').addEventListener('change', carregarGeneros);
['genero', 'volume', 'autorBruto'].forEach((id) => el(id).addEventListener('input', atualizarPreviaId));

function atualizarPreviaId() {
  const midia = el('midia').value;
  const genero = el('genero').value;
  el('previaId').textContent = midia && genero ? `Prévia do ID: ST.${midia}.${genero}.XXXX-??` : '';
}

// ---------- Interpretar linha (parser inteligente) ----------
el('btnInterpretar').addEventListener('click', async () => {
  const linha = el('entradaBruta').value.trim();
  if (!linha) return;
  const r = await fetch('/api/interpretar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linha }),
  }).then((res) => res.json());

  el('titulo').value = r.titulo || '';
  el('autorBruto').value = r.autorBruto || '';
  el('serie').value = r.serie || '';
  if (r.volume !== null && r.volume !== undefined) el('volume').value = r.volume;

  if (r.generoSugerido) {
    // O código sugerido vive no bloco de ficção (0L/3M/4M/5M/1C), não em
    // Teologia (0T). Se a mídia atual for 0T, troca para 0L (Literatura)
    // como padrão razoável — o usuário pode trocar depois se for mangá/HQ.
    if (el('midia').value === '0T') {
      el('midia').value = '0L';
      await carregarGeneros();
    }
    if ([...el('genero').options].some((o) => o.value === r.generoSugerido)) {
      el('genero').value = r.generoSugerido;
    }
  }

  el('confiancaAviso').textContent = r.confianca === 'baixa'
    ? '⚠️ Não tive certeza se identifiquei título e autor corretamente — confira antes de salvar.'
    : (r.generoSugerido ? `ℹ️ Gênero (e mídia, se preciso) sugeridos automaticamente por reconhecer a série "${r.serie}". Confira antes de salvar.` : '');
  atualizarPreviaId();
});

// ---------- Cadastro manual ----------
el('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const corpo = {
    titulo: el('titulo').value.trim(),
    autorBruto: el('autorBruto').value.trim(),
    midia: el('midia').value,
    genero: el('genero').value,
    volume: el('volume').value === '' ? null : Number(el('volume').value),
    serie: el('serie').value.trim() || null,
  };

  const resp = await fetch('/api/itens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const dados = await resp.json();
  const msg = el('msgCadastro');

  if (resp.ok) {
    msg.textContent = `✅ Adicionado: ${dados.id} — ${dados.titulo}`;
    msg.className = 'mensagem sucesso';
    e.target.reset();
    el('entradaBruta').value = '';
    el('previaId').textContent = '';
    carregarAcervo();
  } else {
    msg.textContent = `❌ ${dados.erro}`;
    msg.className = 'mensagem erro';
  }
});

// ---------- Importação em lote ----------
el('btnImportar').addEventListener('click', async () => {
  const arquivo = el('arquivoImport').files[0];
  const div = el('resultadoImport');
  if (!arquivo) {
    div.textContent = 'Selecione um arquivo .xlsx primeiro.';
    div.className = 'mensagem erro';
    return;
  }

  const formData = new FormData();
  formData.append('arquivo', arquivo);

  div.textContent = 'Importando...';
  div.className = 'mensagem';

  const resp = await fetch('/api/import', { method: 'POST', body: formData });
  const dados = await resp.json();

  if (!resp.ok) {
    div.textContent = `❌ ${dados.erro}`;
    div.className = 'mensagem erro';
    return;
  }

  let texto = `✅ ${dados.inseridos.length} item(ns) importado(s).`;
  if (dados.erros.length) {
    texto += `\n⚠️ ${dados.erros.length} linha(s) com problema:\n`;
    texto += dados.erros.map((e) => `  Linha ${e.linha}: ${e.erro}`).join('\n');
  }
  div.textContent = texto;
  div.style.whiteSpace = 'pre-wrap';
  div.className = dados.erros.length ? 'mensagem aviso' : 'mensagem sucesso';
  carregarAcervo();
});

// ---------- Listagem do acervo ----------
let acervoCache = [];

async function carregarAcervo() {
  acervoCache = await fetch('/api/itens').then((r) => r.json());
  el('totalItens').textContent = acervoCache.length;
  renderizarTabela(acervoCache);
}

function renderizarTabela(itens) {
  const tbody = document.querySelector('#tabelaAcervo tbody');
  tbody.innerHTML = itens.map((i) => `
    <tr>
      <td><code>${i.id}</code></td>
      <td>${i.titulo}</td>
      <td>${i.autor}</td>
      <td>${i.serie || '—'}</td>
      <td><button class="btn btn-excluir" data-id="${i.id}">🗑️</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-excluir').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Remover ${btn.dataset.id} do acervo?`)) return;
      await fetch(`/api/itens/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
      carregarAcervo();
    });
  });
}

el('filtroAcervo').addEventListener('input', (e) => {
  const termo = e.target.value.toLowerCase();
  renderizarTabela(acervoCache.filter((i) =>
    i.titulo.toLowerCase().includes(termo) ||
    i.autor.toLowerCase().includes(termo) ||
    i.id.toLowerCase().includes(termo)
  ));
});

// ---------- Publicar (git add/commit/push) ----------
el('btnPublicar').addEventListener('click', async () => {
  const mensagem = prompt('Mensagem do commit (opcional):', '');
  if (mensagem === null) return; // cancelou

  el('btnPublicar').disabled = true;
  el('btnPublicar').textContent = '⏳ Publicando...';

  try {
    const resp = await fetch('/api/publicar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem }),
    });
    const dados = await resp.json();
    alert(dados.mensagem || dados.erro);
  } catch (e) {
    alert(`Erro ao publicar: ${e.message}`);
  } finally {
    el('btnPublicar').disabled = false;
    el('btnPublicar').textContent = '⬆️ Publicar alterações';
  }
});

// ---------- Inicialização ----------
carregarMidias();
carregarAcervo();
