const { execFile } = require('child_process');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

function rodar(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: REPO_ROOT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve(stdout.trim());
    });
  });
}

/**
 * Publica as alterações do acervo: git add + commit + push.
 * Retorna um resumo do que foi feito. Se não houver nada para commitar,
 * avisa em vez de dar erro.
 */
async function publicar(mensagem) {
  await rodar('git', ['add', 'data/acervo.json']);

  const status = await rodar('git', ['status', '--porcelain', 'data/acervo.json']);
  if (!status) {
    return { publicado: false, mensagem: 'Nada para publicar — o acervo já está igual ao último commit.' };
  }

  const msg = mensagem && mensagem.trim() ? mensagem.trim() : `Atualiza acervo — ${new Date().toISOString()}`;
  await rodar('git', ['commit', '-m', msg]);
  await rodar('git', ['push']);

  return { publicado: true, mensagem: `Publicado com sucesso: "${msg}"` };
}

module.exports = { publicar };
