const fs = require('fs');
const path = require('path');

const META_PATH = path.join(__dirname, '..', 'data', 'meta.json');

function garantirArquivo() {
  if (!fs.existsSync(META_PATH)) {
    fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
    fs.writeFileSync(META_PATH, JSON.stringify({ metas: {} }, null, 2), 'utf-8');
  }
}

function lerMetas() {
  garantirArquivo();
  const bruto = fs.readFileSync(META_PATH, 'utf-8');
  try {
    const json = JSON.parse(bruto);
    if (!json.metas) json.metas = {};
    return json;
  } catch (e) {
    throw new Error(`data/meta.json está corrompido: ${e.message}`);
  }
}

function salvarMetaDoAno(ano, quantidade) {
  const dados = lerMetas();
  dados.metas[String(ano)] = Number(quantidade);
  fs.writeFileSync(META_PATH, JSON.stringify(dados, null, 2), 'utf-8');
  return dados;
}

module.exports = { lerMetas, salvarMetaDoAno, META_PATH };
