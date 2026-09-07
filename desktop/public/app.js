const el = (id) => document.getElementById(id);

const STATUS_LABELS = { quero_ler: '📌 Quero ler', lendo: '📖 Lendo', lido: '✅ Lido' };

let itemEditandoId = null; // null = modo cadastro; string = modo edição

// ---------- Navegação por abas ----------
document.querySelectorAll('.aba-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.aba-btn').forEach((b) => b.classList.remove('ativa'));
    document.querySelectorAll('.aba-conteudo').forEach((c) => c.classList.remove('ativa'));
    btn.classList.add('ativa');
    el(`aba-${btn.dataset.aba}`).classList.add('ativa');
    if (btn.dataset.aba === 'acervo') carregarAcervo();
    if (btn.dataset.aba === 'meta') carregarMetas();
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

// ---------- Preview local do arquivo de capa antes do upload ----------
el('capaArquivo').addEventListener('change', () => {
  const arquivo = el('capaArquivo').files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    el('previewCapa').src = leitor.result;
    el('previewCapaWrap').style.display = 'flex';
  };
  leitor.readAsDataURL(arquivo);
});

el('btnRemoverCapa').addEventListener('click', async () => {
  if (!itemEditandoId) return;
  if (!confirm('Remover a capa deste item?')) return;
  await fetch(`/api/itens/${encodeURIComponent(itemEditandoId)}/capa`, { method: 'DELETE' });
  el('previewCapaWrap').style.display = 'none';
  el('capaArquivo').value = '';
});

// ---------- Cadastro manual / edição ----------
el('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const corpo = {
    titulo: el('titulo').value.trim(),
    autorBruto: el('autorBruto').value.trim(),
    midia: el('midia').value,
    genero: el('genero').value,
    volume: el('volume').value === '' ? null : Number(el('volume').value),
    serie: el('serie').value.trim() || null,
    status: el('status').value || null,
    avaliacao: el('avaliacao').value || null,
    dataConclusao: el('dataConclusao').value || null,
    capaUrl: el('capaUrl').value.trim() || null,
  };

  const msg = el('msgCadastro');
  let resp, dados;

  if (itemEditandoId) {
    resp = await fetch(`/api/itens/${encodeURIComponent(itemEditandoId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...corpo, capa: corpo.capaUrl, capaTipo: corpo.capaUrl ? 'url' : undefined }),
    });
  } else {
    resp = await fetch('/api/itens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  }
  dados = await resp.json();

  if (!resp.ok) {
    msg.textContent = `❌ ${dados.erro}`;
    msg.className = 'mensagem erro';
    return;
  }

  // Se um arquivo de capa foi selecionado (só disponível em modo edição), envia agora
  const arquivoCapa = el('capaArquivo').files[0];
  if (arquivoCapa && itemEditandoId) {
    const formData = new FormData();
    formData.append('arquivo', arquivoCapa);
    const respCapa = await fetch(`/api/itens/${encodeURIComponent(itemEditandoId)}/capa`, { method: 'POST', body: formData });
    if (!respCapa.ok) {
      const erroCapa = await respCapa.json();
      msg.textContent = `⚠️ Item salvo, mas a capa falhou: ${erroCapa.erro}`;
      msg.className = 'mensagem aviso';
    }
  }

  msg.textContent = itemEditandoId ? `✅ Alterações salvas em ${dados.id}` : `✅ Adicionado: ${dados.id} — ${dados.titulo}`;
  if (msg.className !== 'mensagem aviso') msg.className = 'mensagem sucesso';

  sairModoEdicao();
  carregarAcervo();
});

function entrarModoEdicao(item) {
  itemEditandoId = item.id;

  el('tituloFormCadastro').textContent = 'Editar item';
  el('avisoEdicao').style.display = 'block';
  el('idEmEdicao').textContent = item.id;
  el('blocoInterpretar').style.display = 'none';
  el('blocoCapaArquivo').style.display = 'block';
  el('avisoCapaSoEdicao').style.display = 'none';
  el('btnSubmitCadastro').textContent = '💾 Salvar alterações';

  el('titulo').value = item.titulo || '';
  el('autorBruto').value = ''; // autor já normalizado não volta pro formato bruto — deixa em branco, opcional trocar
  el('autorBruto').placeholder = `Atual: ${item.autor} — deixe em branco para manter`;
  el('autorBruto').required = false;
  el('serie').value = item.serie || '';
  el('volume').value = item.volume ?? '';
  el('status').value = item.status || '';
  el('avaliacao').value = item.avaliacao || '';
  el('dataConclusao').value = item.dataConclusao || '';
  el('capaUrl').value = item.capaTipo === 'url' ? (item.capa || '') : '';

  if (item.capa) {
    el('previewCapa').src = item.capaTipo === 'arquivo' ? `/${item.capa}` : item.capa;
    el('previewCapaWrap').style.display = 'flex';
  } else {
    el('previewCapaWrap').style.display = 'none';
  }

  (async () => {
    el('midia').value = item.midia;
    await carregarGeneros();
    el('genero').value = item.genero;
    atualizarPreviaId();
  })();

  document.querySelector('[data-aba="cadastro"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sairModoEdicao() {
  itemEditandoId = null;
  el('formCadastro').reset();
  el('tituloFormCadastro').textContent = 'Cadastro manual';
  el('avisoEdicao').style.display = 'none';
  el('blocoInterpretar').style.display = 'block';
  el('blocoCapaArquivo').style.display = 'none';
  el('avisoCapaSoEdicao').style.display = 'block';
  el('btnSubmitCadastro').textContent = '➕ Adicionar ao acervo';
  el('previewCapaWrap').style.display = 'none';
  el('autorBruto').required = true;
  el('autorBruto').placeholder = '';
  el('entradaBruta').value = '';
  el('previaId').textContent = '';
  carregarMidias();
}

el('btnCancelarEdicao').addEventListener('click', sairModoEdicao);

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
      <td>${i.capa ? `<img class="capa-mini" src="${i.capaTipo === 'arquivo' ? '/' + i.capa : i.capa}" alt="">` : ''}</td>
      <td><code>${i.id}</code></td>
      <td>${i.titulo}</td>
      <td>${i.autor}</td>
      <td>${i.status ? `<span class="status-badge ${i.status}">${STATUS_LABELS[i.status]}</span>` : '—'}</td>
      <td>
        <button class="btn btn-editar" data-id="${i.id}">✏️</button>
        <button class="btn btn-excluir" data-id="${i.id}">🗑️</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-editar').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = acervoCache.find((i) => i.id === btn.dataset.id);
      if (item) entrarModoEdicao(item);
    });
  });

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

// ---------- Meta de leitura ----------
async function carregarMetas() {
  const dados = await fetch('/api/meta').then((r) => r.json());
  const anoAtual = new Date().getFullYear();
  el('anoMeta').value = el('anoMeta').value || anoAtual;
  if (dados.metas[String(el('anoMeta').value)] !== undefined) {
    el('quantidadeMeta').value = dados.metas[String(el('anoMeta').value)];
  }

  const tbody = document.querySelector('#tabelaMetas tbody');
  const anos = Object.keys(dados.metas).sort((a, b) => b - a);
  tbody.innerHTML = anos.map((ano) => `<tr><td>${ano}</td><td>${dados.metas[ano]}</td></tr>`).join('')
    || '<tr><td colspan="2">Nenhuma meta definida ainda.</td></tr>';
}

el('formMeta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ano = Number(el('anoMeta').value);
  const quantidade = Number(el('quantidadeMeta').value);
  const msg = el('msgMeta');

  const resp = await fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ano, quantidade }),
  });
  const dados = await resp.json();

  if (!resp.ok) {
    msg.textContent = `❌ ${dados.erro}`;
    msg.className = 'mensagem erro';
    return;
  }
  msg.textContent = `✅ Meta de ${ano} definida: ${quantidade} itens.`;
  msg.className = 'mensagem sucesso';
  carregarMetas();
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
