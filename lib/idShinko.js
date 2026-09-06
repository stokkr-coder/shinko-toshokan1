/**
 * Geração do ID Shinko: ST.[Mídia].[Gênero].[Slug]-[Volume]
 *
 * Padding do volume: 2 dígitos por padrão (00, 01, 02...). Se o volume
 * ultrapassar 99 (ex: Perry Rhodan PR1825 = volume 1825), o padding sobe
 * automaticamente para 4 dígitos — sem precisar configurar nada.
 */

function padVolume(volume) {
  const n = Number(volume) || 0;
  const digitos = n > 99 ? 4 : 2;
  return String(n).padStart(digitos, '0');
}

function gerarIdShinko({ midia, genero, slugAutor, volume = 0 }) {
  if (!midia || !genero || !slugAutor) {
    throw new Error('midia, genero e slugAutor são obrigatórios para gerar o ID Shinko.');
  }
  const volumeFormatado = padVolume(volume);
  return `ST.${midia.toUpperCase()}.${String(genero).padStart(2, '0')}.${slugAutor.toUpperCase()}-${volumeFormatado}`;
}

/**
 * Quebra um ID Shinko de volta em suas partes. Útil para edição/validação.
 */
function parseIdShinko(id) {
  const m = /^ST\.([0-9A-Z]{2})\.(\d{2})\.([A-Z]{4})-(\d{2,4})$/.exec(id.trim());
  if (!m) return null;
  const [, midia, genero, slugAutor, volume] = m;
  return { midia, genero, slugAutor, volume: Number(volume) };
}

/**
 * Monta o nome de arquivo digital padronizado:
 * [ID-Shinko] - [Título da Obra] - [Autor].[extensão]
 */
function gerarNomeArquivo({ id, titulo, autorDisplay, extensao }) {
  const ext = extensao.replace(/^\./, '');
  return `${id} - ${titulo} - ${autorDisplay}.${ext}`;
}

module.exports = { gerarIdShinko, parseIdShinko, gerarNomeArquivo, padVolume };
