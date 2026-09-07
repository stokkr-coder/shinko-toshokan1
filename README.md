# Shinko Toshokan — Sistema de Acervo v2

Controle de acervo pessoal (livros, teologia, mangás, manhwas, manhuas e
comics) com o esquema de ID **Shinko**: `ST.[Mídia].[Gênero].[Slug-Vol]`.

- 🖥️ **Desktop** — app local para cadastro manual, importação em massa via
  Excel e publicação das alterações.
- 📱 **Celular** — site estático (somente leitura) hospedado gratuitamente
  no GitHub Pages, que lê os mesmos dados.
- 🔗 **Sincronização** — os dados moram em `data/acervo.json`, dentro do
  próprio repositório Git. Você edita no desktop, publica (`git push`), e
  o site do celular já reflete a alteração.

---

## 1. Estrutura do projeto

```
shinko-toshokan-v2/
├── data/
│   ├── acervo.json           ← "banco de dados" (JSON versionado no Git)
│   └── meta.json              ← meta de leitura anual
├── capas/                     ← imagens de capa enviadas por upload
├── lib/                       ← lógica compartilhada (normalização, IDs, parser)
│   ├── taxonomia.js
│   ├── normalizeAutor.js
│   ├── idShinko.js
│   ├── parseEntry.js
│   ├── dataStore.js
│   ├── metaLeitura.js
│   └── publicar.js
├── desktop/                   ← app local (Node + Express), só roda na sua máquina
│   ├── server.js
│   └── public/                 (formulário, importação, listagem, edição)
├── index.html, app.js, style.css, manifest.json, icon.svg
│                               ← site estático do celular (raiz do repo)
└── package.json
```

## 2. Colocando no GitHub

1. Crie um repositório novo no GitHub (pode ser privado).
2. Dentro da pasta `shinko-toshokan-v2`, rode:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão do Shinko Toshokan v2"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages** e configure:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / pasta **`/ (root)`**
4. Depois de alguns segundos, o GitHub te dá o link público, algo como
   `https://SEU_USUARIO.github.io/SEU_REPO/`. Esse é o site que você abre
   no celular (pode salvar como atalho na tela inicial).

> **Importante**: escolha a pasta **raiz** (`/`) nas configurações do Pages,
> não `/docs` — o `index.html` do celular e o `data/acervo.json` estão na
> raiz do repositório de propósito, para que o `fetch('./data/acervo.json')`
> funcione sem configuração extra.

## 3. Rodando o app desktop

Precisa ter [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente).

```bash
cd shinko-toshokan-v2
npm install
npm start
```

Abra `http://localhost:3000` no navegador do computador. Lá você tem 3 abas:

- **Cadastro manual**: cole uma referência em texto livre (ex:
  `O Peregrino - John Bunyan`) e clique em "Interpretar" — o app tenta
  identificar título, autor, série e volume automaticamente. Revise os
  campos, escolha mídia/gênero e confirme.
- **Importar planilha**: envie um `.xlsx`. Duas opções de colunas:
  - `Titulo | Autor | Midia | Genero | Volume | Serie` (campos já separados), ou
  - uma única coluna `Entrada` com o texto bruto — o mesmo interpretador
    do cadastro manual roda linha a linha.
- **Acervo**: lista tudo o que já foi cadastrado, com busca e opção de excluir.

Quando terminar suas alterações, clique em **⬆️ Publicar alterações** no
topo — isso roda `git add` + `commit` + `push` automaticamente, usando o
Git já configurado na sua máquina (o mesmo que você usou para clonar/criar
o repositório).

## 4. Testando localmente antes de publicar

```bash
npm test
```
Roda uma bateria rápida dos módulos de normalização de autor, geração de
ID e interpretação de texto — útil se você editar a taxonomia ou as regras
de parsing.

## 5. Esquema do ID Shinko

```
ST . [Mídia] . [Gênero] . [Slug-Autor]-[Volume]
     2 chars    2 dígitos   4 letras     2 ou 4 dígitos
```

- **Mídia**: `0T` Teologia, `0L` Literatura/Ficção, `3M` Mangás/LN,
  `4M` Manhwas, `5M` Manhuas, `1C` Comics/HQs.
- **Gênero**: código de 2 dígitos. Teologia (`0T`) tem tabela própria
  (01–07). As outras cinco mídias (`0L`, `3M`, `4M`, `5M`, `1C`) **compartilham
  um único bloco de gêneros de ficção** (30–80) — terror, fantasia, sci-fi
  etc. valem tanto para um romance quanto para um mangá ou HQ do mesmo
  gênero. Tabela completa em `lib/taxonomia.js` (`GENEROS_FICCAO`), edite
  livremente. Códigos marcados "(sugestão)" (`40`, `65`, `70`) foram
  propostos para preencher lacunas que a tabela original deixava —
  ficção científica sem franquia definida, artes marciais/cultivo (comum
  em manhuas) e super-heróis/ação heroica (comum em HQs ocidentais e
  manhwas de ação).
- **Slug do autor**: 4 primeiras letras do sobrenome, maiúsculas, sem acento.
- **Volume**: `00` por padrão; se passar de 99 (ex: Perry Rhodan #1825), o
  app usa 4 dígitos automaticamente (`1825`) em vez de 2.

Quando o importador reconhece uma série de franquia (Perry Rhodan, Star
Trek, Star Wars, Doctor Who, Babylon 5, Battlestar Galactica), ele já
pré-seleciona o gênero correspondente (e troca a mídia para Literatura se
estiver em Teologia) — sempre revise antes de confirmar.

### Padronização de autor

Regra: a **última palavra** do nome completo é o sobrenome; o resto
(incluindo partículas como "de", "da", "van") fica no "nome", na ordem
original, depois da vírgula:

- `Rodrigo de Oliveira` → `OLIVEIRA, Rodrigo de`
- `São Luís Maria Grignion de Montfort` → `MONTFORT, São Luís Maria Grignion de`
- `Tokurō Nukui` → `NUKUI, Tokurō`

Se algum autor específico precisar de uma regra diferente, edite
`lib/normalizeAutor.js` ou corrija manualmente o campo antes de confirmar
o cadastro — a tela sempre te deixa revisar antes de salvar.

## 6. Séries com código próprio (ex: Perry Rhodan)

`lib/parseEntry.js` tem uma lista `SERIES_CONHECIDAS` onde você cadastra
séries e, opcionalmente, um padrão de código de volume (regex). Isso ajuda
o interpretador a separar automaticamente "Perry Rhodan - PR1825 - Luta
por Trieger - Hubert Haensel" em série, volume, título e autor. Adicione
outras séries suas nessa lista conforme forem aparecendo no acervo.

## 7. Novidades: capa, status de leitura e meta anual

- **Capa**: no cadastro inicial você pode colar um link de imagem (`capaUrl`).
  Depois de criado, abra o item na aba **Acervo → ✏️ editar** para enviar
  um arquivo de capa (fica salvo em `capas/ID.jpg` no próprio repositório
  — por isso só é possível depois que o item já tem um ID). Formatos
  aceitos: JPG, PNG, WEBP, GIF, até 6MB.
- **Status de leitura**: cada item pode ser marcado como *Quero ler*,
  *Lendo* ou *Lido*, com nota de 1 a 5 estrelas e data de conclusão. O site
  do celular mostra chips pra filtrar por status.
- **Meta de leitura anual**: aba **🎯 Meta de leitura** no desktop — defina
  quantos itens você quer terminar no ano. O celular calcula automaticamente
  quantos itens com status "Lido" têm `dataConclusao` naquele ano e mostra
  uma barra de progresso, estilo o Reading Challenge do Goodreads.
- **Correção de cadastro**: botão ✏️ na aba Acervo reabre o formulário
  preenchido — altere o que precisar e clique em "Salvar alterações".
- **Tela de abertura**: o site do celular mostra uma splash screen breve
  (ícone + nome do app) antes do acervo carregar. Também inclui um
  `manifest.json` e ícone, então ao "Adicionar à tela inicial" o app abre
  com ícone e nome próprios, sem a barra do navegador.

Todos esses dados extras (`status`, `avaliacao`, `dataConclusao`, `capa`)
também podem vir na planilha de importação em lote — veja as colunas
aceitas na aba "Importar planilha" do app.

## 9. Limitações conhecidas

- O parser de texto livre é heurístico — formatos ambíguos (ex:
  "Título - Autor" vs "Autor - Título" quando ambos têm poucas palavras)
  são sinalizados com `confiança: baixa` na tela para você revisar, não são
  garantidos 100% corretos.
- O site do celular é **somente leitura** por enquanto (conforme decidido).
  Se um dia você quiser editar também pelo celular, dá para evoluir depois
  para um banco na nuvem (Firebase/Supabase) — mas isso muda a arquitetura,
  me avise se quiser esse caminho no futuro.
- `git push` no botão "Publicar" depende de você já ter configurado
  autenticação do Git na máquina (SSH key ou token) — é a mesma que você
  usa para outros repositórios.
