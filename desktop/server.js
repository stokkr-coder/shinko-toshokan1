const express = require('express');
const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');

const { listarMidias, listarGeneros } = require('../lib/taxonomia');
const { normalizarAutor, gerarSlugAutor } = require('../lib/normalizeAutor');
const { gerarIdShinko } = require('../lib/idShinko');
const { processarEntradaBruta } = require('../lib/parseEntry');
const store = require('../lib/dataStore');
const { publicar } = require('../lib/publicar');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Taxonomia (para preencher os <select> do formulário) ----------
app.get('/api/taxonomia/midias', (req, res) => {
  res.json(listarMidias());
});

app.get('/api/taxonomia/generos/:midia', (req, res) => {
  res.json(listarGeneros(req.params.midia));
});

// ---------- Listagem ----------
app.get('/api/itens', (req, res) => {
  const acervo = store.lerAcervo();
  res.json(acervo.itens);
});

// ---------- Cadastro manual ----------
app.post('/api/itens', (req, res) => {
  try {
    const { titulo, autorBruto, midia, genero, volume, serie, extras } = req.body;
    if (!titulo || !autorBruto || !midia || !genero) {
      return res.status(400).json({ erro: 'titulo, autorBruto, midia e genero são obrigatórios.' });
    }

    const autor = normalizarAutor(autorBruto);
    const slug = gerarSlugAutor(autor.sobrenome);

    const acervo = store.lerAcervo();
    const volumeFinal = volume !== undefined && volume !== null && volume !== ''
      ? Number(volume)
      : store.proximoVolumeLivre(acervo, midia, genero, slug);

    const id = gerarIdShinko({ midia, genero, slugAutor: slug, volume: volumeFinal });

    const item = {
      id,
      titulo,
      serie: serie || null,
      autor: autor.display,
      midia,
      genero,
      volume: volumeFinal,
      ...extras,
      criadoEm: new Date().toISOString(),
    };

    store.inserirItem(item);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

app.put('/api/itens/:id', (req, res) => {
  try {
    const atualizado = store.atualizarItem(req.params.id, req.body);
    res.json(atualizado);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

app.delete('/api/itens/:id', (req, res) => {
  try {
    store.removerItem(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(404).json({ erro: e.message });
  }
});

// ---------- Pré-visualização inteligente de uma linha de texto ----------
// Usado pelo formulário para sugerir título/autor/série/volume antes de confirmar.
app.post('/api/interpretar', (req, res) => {
  const { linha } = req.body;
  if (!linha) return res.status(400).json({ erro: 'Campo "linha" é obrigatório.' });
  res.json(processarEntradaBruta(linha));
});

// ---------- Importação em lote via planilha Excel ----------
// Espera colunas: Titulo | Autor | Midia | Genero | Volume (opcional) | Serie (opcional)
// Ou uma única coluna "Entrada" com o texto bruto (usa o parser inteligente).
app.post('/api/import', upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const cabecalho = sheet.getRow(1).values.map((v) => (v || '').toString().trim().toLowerCase());
    const idxEntrada = cabecalho.indexOf('entrada');
    const idxTitulo = cabecalho.indexOf('titulo') !== -1 ? cabecalho.indexOf('titulo') : cabecalho.indexOf('título');
    const idxAutor = cabecalho.indexOf('autor');
    const idxMidia = cabecalho.indexOf('midia') !== -1 ? cabecalho.indexOf('midia') : cabecalho.indexOf('mídia');
    const idxGenero = cabecalho.indexOf('genero') !== -1 ? cabecalho.indexOf('genero') : cabecalho.indexOf('gênero');
    const idxVolume = cabecalho.indexOf('volume');
    const idxSerie = cabecalho.indexOf('serie') !== -1 ? cabecalho.indexOf('serie') : cabecalho.indexOf('série');

    const resultados = { inseridos: [], erros: [] };
    const acervo = store.lerAcervo();

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // cabeçalho
      const valores = row.values;
      if (!valores || valores.every((v) => v === undefined || v === null || v === '')) return;

      try {
        let titulo, autorBruto, serie, volume;

        if (idxEntrada !== -1 && valores[idxEntrada]) {
          const interpretado = processarEntradaBruta(String(valores[idxEntrada]));
          titulo = interpretado.titulo;
          autorBruto = interpretado.autorBruto;
          serie = interpretado.serie;
          volume = interpretado.volume;
        } else {
          titulo = idxTitulo !== -1 ? valores[idxTitulo] : null;
          autorBruto = idxAutor !== -1 ? valores[idxAutor] : null;
          serie = idxSerie !== -1 ? valores[idxSerie] : null;
          volume = idxVolume !== -1 ? valores[idxVolume] : null;
        }

        const midia = idxMidia !== -1 ? String(valores[idxMidia]).trim() : null;
        const genero = idxGenero !== -1 ? String(valores[idxGenero]).trim() : null;

        if (!titulo || !autorBruto || !midia || !genero) {
          throw new Error('Linha incompleta (faltando título, autor, mídia ou gênero).');
        }

        const autor = normalizarAutor(String(autorBruto));
        const slug = gerarSlugAutor(autor.sobrenome);
        const volumeFinal = volume !== null && volume !== undefined && volume !== ''
          ? Number(volume)
          : store.proximoVolumeLivre(acervo, midia, genero, slug);

        const id = gerarIdShinko({ midia, genero, slugAutor: slug, volume: volumeFinal });

        if (acervo.itens.some((i) => i.id === id)) {
          throw new Error(`ID duplicado gerado (${id}) — item ignorado.`);
        }

        const item = {
          id,
          titulo: String(titulo).trim(),
          serie: serie ? String(serie).trim() : null,
          autor: autor.display,
          midia,
          genero,
          volume: volumeFinal,
          criadoEm: new Date().toISOString(),
        };

        acervo.itens.push(item);
        resultados.inseridos.push(item);
      } catch (e) {
        resultados.erros.push({ linha: rowNumber, erro: e.message });
      }
    });

    store.salvarAcervo(acervo);
    res.json(resultados);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

// ---------- Publicar (git add/commit/push) ----------
app.post('/api/publicar', async (req, res) => {
  try {
    const resultado = await publicar(req.body.mensagem);
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`Shinko Toshokan (desktop) rodando em http://localhost:${PORTA}`);
});
