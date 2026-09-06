const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'acervo.json');

function garantirArquivo() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify({ itens: [] }, null, 2), 'utf-8');
  }
}

function lerAcervo() {
  garantirArquivo();
  const bruto = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    const json = JSON.parse(bruto);
    if (!Array.isArray(json.itens)) json.itens = [];
    return json;
  } catch (e) {
    throw new Error(`data/acervo.json está corrompido ou mal formatado: ${e.message}`);
  }
}

function salvarAcervo(acervo) {
  // Ordena por ID para manter o diff do Git legível entre commits
  acervo.itens.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(DATA_PATH, JSON.stringify(acervo, null, 2), 'utf-8');
}

function buscarPorId(id) {
  const acervo = lerAcervo();
  return acervo.itens.find((i) => i.id === id) || null;
}

/**
 * Descobre o próximo volume livre para uma combinação mídia+gênero+slugAutor,
 * usado quando o item não faz parte de uma série numerada explicitamente
 * (evita colisão de ID entre obras diferentes do mesmo autor/gênero).
 */
function proximoVolumeLivre(acervo, midia, genero, slugAutor) {
  const prefixo = `ST.${midia}.${genero}.${slugAutor}-`;
  const usados = acervo.itens
    .filter((i) => i.id.startsWith(prefixo))
    .map((i) => Number(i.id.slice(prefixo.length)));
  let v = 0;
  while (usados.includes(v)) v += 1;
  return v;
}

function inserirItem(item) {
  const acervo = lerAcervo();
  if (acervo.itens.some((i) => i.id === item.id)) {
    throw new Error(`ID já existe no acervo: ${item.id}`);
  }
  acervo.itens.push(item);
  salvarAcervo(acervo);
  return item;
}

function atualizarItem(id, dadosNovos) {
  const acervo = lerAcervo();
  const idx = acervo.itens.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Item não encontrado: ${id}`);
  acervo.itens[idx] = { ...acervo.itens[idx], ...dadosNovos };
  salvarAcervo(acervo);
  return acervo.itens[idx];
}

function removerItem(id) {
  const acervo = lerAcervo();
  const antes = acervo.itens.length;
  acervo.itens = acervo.itens.filter((i) => i.id !== id);
  if (acervo.itens.length === antes) throw new Error(`Item não encontrado: ${id}`);
  salvarAcervo(acervo);
}

module.exports = {
  DATA_PATH,
  lerAcervo,
  salvarAcervo,
  buscarPorId,
  proximoVolumeLivre,
  inserirItem,
  atualizarItem,
  removerItem,
};
