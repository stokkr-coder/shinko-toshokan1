/**
 * Motor de "Importação Inteligente".
 *
 * Reconhece os formatos de entrada mencionados no documento:
 *   - Título – Autor Sobrenome
 *   - Autor Sobrenome – Título
 *   - Sobrenome, Autor – Título
 *   - Título – Série (Autor Sobrenome)
 *   - Título – [Série] – Autor Sobrenome
 *   - Série - VolCode - Título - Autor   (ex: "Perry Rhodan - PR1825 - Luta por Trieger - Hubert Haensel")
 *
 * Isso é heurística, não mágica: para coleções com nomes/siglas muito
 * particulares, cadastre a série em SERIES_CONHECIDAS abaixo para melhorar
 * a detecção, e sempre revise o resultado na tela de importação antes de
 * confirmar — o app te deixa corrigir título/autor/volume/gênero manualmente.
 */

const { normalizarAutor } = require('./normalizeAutor');

// Séries conhecidas, o padrão de código de volume que usam (opcional) e o
// gênero Shinko sugerido (opcional — usado para pré-selecionar o campo
// "Gênero" no formulário quando a série é reconhecida).
// Adicione outras séries aqui conforme forem aparecendo no seu acervo.
const SERIES_CONHECIDAS = [
  { nome: 'Perry Rhodan', regexVolume: /PR\s*(\d+)/i, generoSugerido: '42' },
  { nome: 'Patrística', regexVolume: null, generoSugerido: null },
  { nome: 'Doctor Who', regexVolume: null, generoSugerido: '45' },
  { nome: 'Star Wars', regexVolume: null, generoSugerido: '44' },
  { nome: 'Star Trek', regexVolume: null, generoSugerido: '43' },
  { nome: 'Babylon 5', regexVolume: null, generoSugerido: '46' },
  { nome: 'Battlestar Galactica', regexVolume: null, generoSugerido: '47' },
];

function extrairVolumeGenerico(texto) {
  // "Vol 01", "Vol. 12", "Volume 3", "#7", "v01"
  const padroes = [
    /vol(?:ume)?\.?\s*(\d+)/i,
    /\bv\.?\s?(\d+)\b/i,
    /#(\d+)/,
  ];
  for (const p of padroes) {
    const m = texto.match(p);
    if (m) return Number(m[1]);
  }
  return null;
}

/**
 * Procura uma série conhecida dentro do texto e devolve
 * { nome, volume, generoSugerido, regexVolume } ou null.
 * `volume` só vem preenchido se o próprio `texto` contiver o código
 * (ex: "PR1825" dentro do nome da série) — quando o volume está em outro
 * pedaço da linha (caso mais comum), use extrairVolumeDaSerie() nesse pedaço.
 */
function detectarSerie(texto) {
  for (const serie of SERIES_CONHECIDAS) {
    if (texto.toLowerCase().includes(serie.nome.toLowerCase())) {
      let volume = null;
      if (serie.regexVolume) {
        const m = texto.match(serie.regexVolume);
        if (m) volume = Number(m[1]);
      }
      return { nome: serie.nome, volume, generoSugerido: serie.generoSugerido, regexVolume: serie.regexVolume };
    }
  }
  return null;
}

/** Extrai o volume de um pedaço de texto específico, usando o regex da série se houver. */
function extrairVolumeDaSerie(serieInfo, texto) {
  if (serieInfo?.regexVolume) {
    const m = texto.match(serieInfo.regexVolume);
    if (m) return Number(m[1]);
  }
  return extrairVolumeGenerico(texto);
}

/**
 * Recebe uma linha bruta (como vem da planilha/lista do usuário) e devolve
 * uma estrutura parcial pronta para revisão:
 *   { titulo, autorBruto, serie, volume, generoSugerido, origem }
 */
function interpretarLinha(linhaBruta) {
  const linha = linhaBruta.trim();

  // 1. Autor entre parênteses no final: "Título (Sobrenome, Nome)" ou "Título (Sobrenome)"
  const matchParenteses = /^(.*)\(([^)]+)\)\s*$/.exec(linha);
  if (matchParenteses) {
    const titulo = matchParenteses[1].replace(/[-–]\s*$/, '').trim();
    const autorBruto = matchParenteses[2].trim();
    const serieInfo = detectarSerie(titulo);
    return {
      titulo,
      autorBruto,
      serie: serieInfo?.nome || null,
      volume: serieInfo ? extrairVolumeDaSerie(serieInfo, titulo) : extrairVolumeGenerico(titulo),
      generoSugerido: serieInfo?.generoSugerido || null,
      origem: 'parenteses',
    };
  }

  // Divide por hífen/travessão, preservando pedaços não vazios
  const partes = linha.split(/\s+[-–]\s+/).map((p) => p.trim()).filter(Boolean);

  if (partes.length === 1) {
    // Só o título, sem autor identificável
    return { titulo: partes[0], autorBruto: null, serie: null, volume: null, generoSugerido: null, origem: 'sem-separador' };
  }

  // 2. "Série - VolCode - Título - Autor" (4 partes, ex: Perry Rhodan)
  if (partes.length >= 4) {
    const serieInfo = detectarSerie(partes[0]);
    if (serieInfo) {
      const volCode = partes[1];
      const volumeDoCodigo = extrairVolumeDaSerie(serieInfo, volCode);
      const titulo = partes.slice(2, partes.length - 1).join(' - ');
      const autorBruto = partes[partes.length - 1];
      return {
        titulo: `${serieInfo.nome} - ${volCode} - ${titulo}`,
        autorBruto,
        serie: serieInfo.nome,
        volume: volumeDoCodigo || null,
        generoSugerido: serieInfo.generoSugerido || null,
        origem: 'serie-4-partes',
      };
    }
  }

  // 3. "Sobrenome, Nome - Título" (autor já no formato-alvo, na frente)
  if (/^[^,]+,\s*.+$/.test(partes[0]) && partes.length === 2) {
    const serieInfo = detectarSerie(partes[1]);
    return {
      titulo: partes[1],
      autorBruto: partes[0],
      serie: serieInfo?.nome || null,
      volume: serieInfo ? extrairVolumeDaSerie(serieInfo, partes[1]) : extrairVolumeGenerico(partes[1]),
      generoSugerido: serieInfo?.generoSugerido || null,
      origem: 'sobrenome-virgula-titulo',
    };
  }

  // 4. "Título - Série (Autor)" já tratado no bloco de parênteses acima.

  // 5. Duas partes: ambíguo entre "Título - Autor" e "Autor - Título".
  //    Heurística: nomes de autor costumam ter poucas palavras (<=4) e
  //    não conter ":" nem múltiplas vírgulas; títulos tendem a ser mais
  //    longos ou ter pontuação. Quando ambíguo, assume "Título - Autor"
  //    (formato mais comum relatado) e sinaliza baixa confiança.
  if (partes.length === 2) {
    const [a, b] = partes;
    const bParecAutor = b.split(/\s+/).length <= 4 && !/[:;]/.test(b);
    const aParecAutor = a.split(/\s+/).length <= 4 && !/[:;]/.test(a);

    const montar = (titulo, autorBruto, origem, confianca) => {
      const serieInfo = detectarSerie(titulo);
      return {
        titulo,
        autorBruto,
        serie: serieInfo?.nome || null,
        volume: serieInfo ? extrairVolumeDaSerie(serieInfo, titulo) : extrairVolumeGenerico(titulo),
        generoSugerido: serieInfo?.generoSugerido || null,
        origem,
        confianca,
      };
    };

    if (bParecAutor && !aParecAutor) return montar(a, b, 'titulo-autor', 'alta');
    if (aParecAutor && !bParecAutor) return montar(b, a, 'autor-titulo', 'alta');
    // Ambíguo — assume título - autor mas marca baixa confiança para revisão manual
    return montar(a, b, 'ambiguo', 'baixa');
  }

  // Fallback: junta tudo como título
  return { titulo: linha, autorBruto: null, serie: null, volume: null, generoSugerido: null, origem: 'fallback' };
}

/**
 * Pipeline completo: interpreta a linha e já devolve o autor normalizado.
 */
function processarEntradaBruta(linhaBruta) {
  const interpretado = interpretarLinha(linhaBruta);
  const autorNormalizado = interpretado.autorBruto ? normalizarAutor(interpretado.autorBruto) : null;
  return { ...interpretado, autor: autorNormalizado };
}

module.exports = { interpretarLinha, processarEntradaBruta, detectarSerie, extrairVolumeGenerico, SERIES_CONHECIDAS };
