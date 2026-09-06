/**
 * Normalização de autor para o padrão Shinko: "SOBRENOME, Nome".
 *
 * Regras (conforme documento de estrutura):
 *  - Rodrigo de Oliveira            -> OLIVEIRA, Rodrigo de
 *  - São Luís Maria Grignion de Montfort -> MONTFORT, São Luís Maria Grignion de
 *  - Tokurō Nukui                   -> NUKUI, Tokurō
 *
 * Regra: o SOBRENOME é sempre a ÚLTIMA palavra do nome completo. Tudo o
 * que vem antes — incluindo partículas de ligação como "de", "da", "van"
 * — forma o "nome" e permanece na ORDEM ORIGINAL depois da vírgula. Isso é
 * o que os exemplos do documento mostram: a partícula "de" não gruda no
 * sobrenome, ela fica no fim do "nome" (ex: "..., Rodrigo de", não
 * "DE OLIVEIRA, Rodrigo").
 */

function normalizarAutor(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) {
    return { sobrenome: partes[0], nome: '', display: partes[0].toUpperCase() };
  }

  const sobrenome = partes[partes.length - 1];
  const nome = partes.slice(0, partes.length - 1).join(' ');

  return {
    sobrenome,
    nome,
    display: `${sobrenome.toUpperCase()}, ${nome}`,
  };
}

/**
 * Gera o slug de 4 letras maiúsculas a partir do sobrenome.
 * Remove acentos e caracteres não-alfabéticos antes de cortar.
 * Ex: OLIVEIRA -> OLIV | MONTFORT -> MONT | NUKUI -> NUKU
 */
function gerarSlugAutor(sobrenome) {
  const limpo = sobrenome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z]/g, '')       // remove espaços, hífens etc.
    .toUpperCase();

  if (limpo.length >= 4) return limpo.slice(0, 4);
  return limpo.padEnd(4, 'X'); // sobrenomes curtos (ex: "Zen" -> "ZENX")
}

module.exports = { normalizarAutor, gerarSlugAutor };
