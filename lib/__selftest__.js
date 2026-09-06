const assert = require('assert');
const { normalizarAutor, gerarSlugAutor } = require('./normalizeAutor');
const { gerarIdShinko, parseIdShinko, padVolume } = require('./idShinko');
const { interpretarLinha, processarEntradaBruta } = require('./parseEntry');

// --- normalizeAutor ---
assert.strictEqual(normalizarAutor('Rodrigo de Oliveira').display, 'OLIVEIRA, Rodrigo de');
assert.strictEqual(normalizarAutor('J.R.R. Tolkien').display, 'TOLKIEN, J.R.R.');
assert.strictEqual(gerarSlugAutor('Oliveira'), 'OLIV');
assert.strictEqual(gerarSlugAutor('Zen'), 'ZENX');

// --- idShinko ---
assert.strictEqual(padVolume(5), '05');
assert.strictEqual(padVolume(1825), '1825');
assert.strictEqual(gerarIdShinko({ midia: '0L', genero: '51', slugAutor: 'TOLK', volume: 0 }), 'ST.0L.51.TOLK-00');
assert.strictEqual(gerarIdShinko({ midia: '0L', genero: '41', slugAutor: 'HAEN', volume: 1825 }), 'ST.0L.41.HAEN-1825');
assert.deepStrictEqual(parseIdShinko('ST.0L.51.TOLK-00'), { midia: '0L', genero: '51', slugAutor: 'TOLK', volume: 0 });

// --- parseEntry ---
const r1 = interpretarLinha('O Peregrino - John Bunyan');
assert.strictEqual(r1.titulo, 'O Peregrino');
assert.strictEqual(r1.autorBruto, 'John Bunyan');

const r2 = interpretarLinha('Perry Rhodan - PR1825 - Luta por Trieger - Hubert Haensel');
assert.strictEqual(r2.serie, 'Perry Rhodan');
assert.strictEqual(r2.volume, 1825);
assert.strictEqual(r2.autorBruto, 'Hubert Haensel');
assert.strictEqual(r2.generoSugerido, '42');

const r3 = processarEntradaBruta('O Peregrino - John Bunyan');
assert.strictEqual(r3.autor.display, 'BUNYAN, John');

console.log('✅ Todos os testes passaram.');
