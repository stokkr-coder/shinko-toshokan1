/**
 * Taxonomia do Shinko Toshokan.
 * Extraída do documento "estrutura_Biblioteca_Shinko" + ajustes enviados por Oscar.
 * Edite aqui para adicionar novos códigos de mídia ou gênero.
 */

const MIDIAS = {
  '0T': { nome: 'Teologia & Estudos Religiosos', descricao: 'Ensaios teológicos, doutrina, patrística, sermões, apologética e documentos eclesiásticos.' },
  '0L': { nome: 'Literatura & Ficção Geral', descricao: 'Romances, ficção cristã, suspense, terror, ficção científica, poesia e teatro.' },
  '3M': { nome: 'Mangás & Light Novels', descricao: 'Quadrinhos, artes e light novels de origem japonesa.' },
  '4M': { nome: 'Manhwas', descricao: 'Quadrinhos e webtoons de origem coreana.' },
  '5M': { nome: 'Manhuas', descricao: 'Quadrinhos de origem chinesa/taiwanesa.' },
  '1C': { nome: 'Comics / HQs Ocidentais', descricao: 'HQs americanas, europeias (franco-belga) e brasileiras.' },
};

/**
 * Bloco único de gêneros de ficção, compartilhado por TODAS as mídias
 * narrativas: 0L (Literatura), 3M (Mangás/LN), 4M (Manhwas), 5M (Manhuas)
 * e 1C (Comics/HQs) — terror, fantasia, sci-fi etc. atravessam esses
 * formatos igualmente. Só a Teologia (0T) tem tabela própria, abaixo.
 *
 * Códigos marcados "(sugestão)" foram propostos por não haver, na tabela
 * original, um código claro para esse tipo de obra em HQ/mangá/manhua/
 * manhwa. Edite/renumere à vontade — são só um ponto de partida.
 */
const GENEROS_FICCAO = {
  '30': { nome: 'Terror, Horror, Thriller & Gótico', descricao: 'Ficção de horror, suspense cósmico e mistério sombrio (ex: Lovecraft, Stephen King).' },
  '34': { nome: 'Ficção Apocalíptica & Sobrevivência / Zumbis', descricao: 'Ficção apocalíptica secular e histórias de contaminação.' },
  '35': { nome: 'Thriller Cristão, Guerra Espiritual & Sobrenatural', descricao: 'Suspense e ficção de mistério com combate espiritual ou elementos bíblicos (ex: Frank Peretti).' },
  '40': { nome: 'Ficção Científica Genérica / Hard Sci-Fi (sugestão)', descricao: 'Sci-fi e space opera que não pertence a nenhuma franquia específica das listadas abaixo — preenche o código "guarda-chuva" 40 que na tabela original era só um cabeçalho.' },
  '41': { nome: 'Light Novels / Isekai Militar', descricao: 'Light novels de fantasia militar, isekai com foco tático/bélico.' },
  '42': { nome: 'Perry Rhodan', descricao: 'Série Perry Rhodan e spin-offs diretos.' },
  '43': { nome: 'Star Trek', descricao: 'Franquia Star Trek — romances, quadrinhos, tie-ins.' },
  '44': { nome: 'Star Wars', descricao: 'Franquia Star Wars — romances, quadrinhos, tie-ins.' },
  '45': { nome: 'Doctor Who', descricao: 'Franquia Doctor Who — romances, quadrinhos, tie-ins.' },
  '46': { nome: 'Babylon 5', descricao: 'Franquia Babylon 5 — romances, quadrinhos, tie-ins.' },
  '47': { nome: 'Battlestar Galactica', descricao: 'Franquia Battlestar Galactica — romances, quadrinhos, tie-ins.' },
  '48': { nome: 'Universos Expandidos (outros)', descricao: 'Tie-ins e universos expandidos de outras franquias sci-fi não listadas acima.' },
  '49': { nome: 'Distopia / Steampunk', descricao: 'Distopias e ficção steampunk/retrofuturista.' },
  '51': { nome: 'Fantasia Épica & Mítica', descricao: 'Fantasia de alto nível, mitologia recontada e lendas medievais (ex: Tolkien).' },
  '55': { nome: 'Ficção Cristã, Fantasia Teológica & Alegoria', descricao: 'Romances alegóricos e fantasia de inspiração cristã (ex: C.S. Lewis, Bunyan).' },
  '60': { nome: 'Drama, Slice of Life & Literatura Geral', descricao: 'Romances contemporâneos, ficção humanista e literatura geral.' },
  '65': { nome: 'Artes Marciais, Cultivo & Wuxia/Xianxia (sugestão)', descricao: 'Ficção de cultivo/artes marciais chinesa e derivados — gênero central em manhuas (5M) e cada vez mais comum em manhwas (4M), sem equivalente na tabela original.' },
  '70': { nome: 'Super-Heróis & Ação Heroica (sugestão)', descricao: 'HQs de super-heróis e ação heroica em geral — núcleo do catálogo ocidental (1C) e presente também em manhwas de ação (ex: regressão/torre/caçadores).' },
  '75': { nome: 'Mistério & Policial Confessional', descricao: 'Histórias investigativas com personagens ou temáticas clericais (ex: Padre Brown).' },
  '80': { nome: 'Humor, Sátira & Crônicas', descricao: 'Ficção cômica, textos satíricos e compilações de humor.' },
};

const GENEROS = {
  '0T': {
    '01': { nome: 'Teologia Católica: Patrística & Concílios', descricao: 'Escritos dos Padres da Igreja, apologética primitiva e documentos dos primeiros séculos (ex: Justino de Roma, Agostinho, Orígenes).' },
    '02': { nome: 'Teologia Católica: Escolástica & Doutrina', descricao: 'Filosofia e teologia medieval/moderna católica, tomismo, espiritualidade e mística (ex: São Tomás de Aquino, Thomas Merton, Padre Pio).' },
    '03': { nome: 'Teologia Católica: Ensaios, Apologética & Aforismos', descricao: 'Obras defensivas, crônicas e ensaios confessionalmente católicos (ex: G.K. Chesterton).' },
    '04': { nome: 'Teologia Protestante: Sistemática & Reformada', descricao: 'Teologia dogmática, confissões de fé e doutrina reformada/evangélica (ex: Calvino, Bavinck).' },
    '05': { nome: 'Teologia Protestante: Puritanismo, Sermões & Espiritualidade', descricao: 'Coleções de sermões, edificação e devocionais puritanos (ex: Spurgeon, Jonathan Edwards, Bunyan - ensaios).' },
    '06': { nome: 'Teologia Protestante: Apologética & Ensaios', descricao: 'Apologética, ética e filosofia de viés protestante/anglicano (ex: C.S. Lewis).' },
    '07': { nome: 'Estudos Bíblicos, Apócrifos & História da Igreja', descricao: 'Comentários bíblicos, hermenêutica, textos apócrifos, manuscritos e historiografia cristã.' },
  },
  '0L': GENEROS_FICCAO,
  '3M': GENEROS_FICCAO,
  '4M': GENEROS_FICCAO,
  '5M': GENEROS_FICCAO,
  '1C': GENEROS_FICCAO,
};

function listarMidias() {
  return Object.entries(MIDIAS).map(([codigo, v]) => ({ codigo, ...v }));
}

function listarGeneros(codigoMidia) {
  const tabela = GENEROS[codigoMidia] || GENEROS_FICCAO; // fallback para ficção
  return Object.entries(tabela).map(([codigo, v]) => ({ codigo, ...v }));
}

module.exports = { MIDIAS, GENEROS, GENEROS_FICCAO, listarMidias, listarGeneros };
