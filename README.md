# SmartTest Marker

Projeto acadêmico para geração de documentos de teste estruturados.
Desenvolvido por Patricia da Silva Gomes baseado no material da Mentoria do [Julio de Lima](https://github.com/juliodelimas/).

Aplicação web para geração estruturada de documentos de teste baseada na norma **ISO-29119-3**, com suporte a múltiplos idiomas (Português, Inglês e Espanhol), persistência de dados, exportação de relatórios e interface intuitiva.

<img src="frontend/public/logoSmartTestMaker.jpeg" alt="SmartTest Marker Logo" width="200" />

---

## O que o sistema faz

### Gerador de Casos de Teste
- **Gera casos de teste estruturados** a partir de um título, prioridade, rastreabilidade, pré-condições, passos e pós-condições, seguindo o padrão ISO-29119-3.
- **Traduz automaticamente** os casos de teste para Inglês e Espanhol via Google Translate API não-oficial (sem cadastro, sem limite diário).
- **Exibe os casos em três abas de idioma**: Português (PT), Inglês (EN) e Espanhol (ES).
- **Salva todos os casos de teste** com persistência entre reinicializações do servidor.
- **Lista os casos salvos** em sidebar, permitindo navegar, selecionar, editar e excluir.
- **Exporta casos de teste** nos formatos PDF, TXT e CSV em todos os idiomas.

### Gerador de Condições de Teste
- **Gera condições de teste estruturadas** a partir de requisitos e uma tabela com ID, descrição e prioridade.
- **Traduz automaticamente** as condições para Inglês e Espanhol.
- **Exibe em três abas de idioma**: Português (PT), Inglês (EN) e Espanhol (ES).
- **Persiste e lista** as condições geradas em sidebar com filtro por projeto.
- **Exporta** nos formatos PDF, TXT e CSV em todos os idiomas.

### Gerador de Relatório de Sessão
- **Gera relatórios de sessão exploratória** no formato SBTM (Session-Based Test Management), inspirado no artigo de John Bach (2001).
- **Campos suportados**: data/hora, testador, módulo, Test Charter, tamanho da sessão, notas (I/R), defeitos e perguntas.
- **Traduz automaticamente** todos os campos do relatório para Inglês e Espanhol.
- **Exibe em três abas de idioma**: Português (PT), Inglês (EN) e Espanhol (ES).
- **Persiste e lista** os relatórios em sidebar com filtro por projeto.
- **Exporta** nos formatos PDF, TXT e CSV em todos os idiomas.

### Funcionalidades comuns
- **Autenticação de usuário** com login/logout.
- **Gerenciamento de projetos**: criar, renomear e excluir projetos; filtrar documentos por projeto na sidebar.
- **Sidebar paginada** (10 itens por página) com edição e exclusão individuais.
- **Exportação multilíngue**: o arquivo exportado (PDF/TXT/CSV) sempre reflete o idioma da aba selecionada.

---

## Estrutura do Projeto

```
ppp_SmartTestMaker/
├── backend/
│   ├── src/
│   │   ├── index.js              # Servidor Express (API REST)
│   │   └── testGenerator.js      # Gerador de casos de teste ISO-29119-3
│   ├── testcases.json            # Persistência dos casos de teste
│   ├── test-conditions.json      # Persistência das condições de teste
│   ├── session-reports.json      # Persistência dos relatórios de sessão
│   ├── projects.json             # Persistência dos projetos
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── logoSmartTestMaker.jpeg
│   └── src/
│       ├── App.js                # Gerador de Casos de Teste
│       ├── TestConditions.js     # Gerador de Condições de Teste
│       ├── SessionReport.js      # Gerador de Relatório de Sessão
│       ├── Home.js               # Menu principal
│       ├── Login.js              # Tela de autenticação
│       └── UserHeader.js         # Cabeçalho com info do usuário
├── test/
│   ├── cypress/
│   │   └── e2e/
│   │       ├── api/              # Testes de API (Cypress)
│   │       └── frontend/         # Testes de frontend (Cypress)
│   ├── unit/
│   │   └── testGenerator.test.js # Testes unitários (Mocha)
│   └── package.json
└── README.md
```

---

## Pré-requisitos

- **Node.js** v18 ou superior
- **npm** v9 ou superior

---

## Como executar

### 1. Backend (API — porta 4000)

```bash
cd backend
npm install
npm start
```

### 2. Frontend (React — porta 3000)

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/login` | Autenticação de usuário |
| `GET` | `/projects` | Lista todos os projetos |
| `POST` | `/projects` | Cria um novo projeto |
| `PUT` | `/projects/:id` | Renomeia um projeto |
| `DELETE` | `/projects/:id` | Remove um projeto |
| `GET` | `/test-cases` | Lista todos os casos de teste |
| `POST` | `/generate-tests` | Gera e salva um novo caso de teste |
| `PUT` | `/test-cases/:id` | Atualiza um caso de teste |
| `DELETE` | `/test-cases/:id` | Remove um caso de teste |
| `GET` | `/test-conditions` | Lista todas as condições de teste |
| `POST` | `/test-conditions` | Cria condições de teste |
| `PUT` | `/test-conditions/:id` | Atualiza condições de teste |
| `DELETE` | `/test-conditions/:id` | Remove condições de teste |
| `GET` | `/session-reports` | Lista todos os relatórios de sessão |
| `POST` | `/session-reports` | Cria um relatório de sessão |
| `PUT` | `/session-reports/:id` | Atualiza um relatório de sessão |
| `DELETE` | `/session-reports/:id` | Remove um relatório de sessão |

---

## Testes

O projeto possui dois níveis de testes, ambos executados com `npm test` a partir da pasta `test/`.

### Testes Unitários — `test/unit/`

Arquivo: `testGenerator.test.js`  
Framework: **Mocha** com `assert` nativo do Node.js  
Reporter: **Mochawesome** — gera relatório HTML interativo em `test/reports/unit/unit-report.html`

Cobrem a função `generateTestCases` do backend, verificando:

- Estrutura do retorno (array com exatamente 1 caso de teste)
- Presença de todas as propriedades obrigatórias da norma ISO-29119-3 (`id`, `title`, `priority`, `traceability`, `preconditions`, `steps`, `postconditions`)
- Valores padrão aplicados quando campos não são informados
- Mapeamento e numeração sequencial dos passos
- Formato do ID (`TC-NNN`)
- Campo `project` e rastreabilidade

**Técnica utilizada: Partição de Equivalência**

Cada `describe` agrupa entradas equivalentes para testar um comportamento isolado. Para cada comportamento são definidas duas partições — válida e inválida (ou "informado" vs "não informado") — e cada partição é representada por um único caso de teste. Exemplos:

| Comportamento | Partição válida | Partição inválida |
|---|---|---|
| Prioridade | `priority: 'Alta'` → preserva o valor | sem `priority` → aplica `'Média'` |
| ID | `id: 'TC-999'` → usa o ID fornecido | sem `id` → gera no formato `TC-NNN` |
| Steps | array com itens → mapeia e numera | array vazio → gera passo padrão |
| Pré-condições | array informado → preserva | sem `preconditions` → aplica `['Nenhuma']` |

### Testes E2E — `test/cypress/e2e/`

Framework: **Cypress**  
Relatório gerado em: `test/reports/cypress/`

#### API (`api/`)
Testam diretamente os endpoints do backend:

| Arquivo | Endpoints cobertos |
|---|---|
| `auth.cy.js` | `/auth/register`, `/auth/login` |
| `projects.cy.js` | `/projects` (GET, POST, PUT, DELETE) |
| `test-cases.cy.js` | `/test-cases`, `/generate-tests` |
| `test-conditions.cy.js` | `/test-conditions` (GET, POST, PUT, DELETE) |
| `session-reports.cy.js` | `/session-reports` (GET, POST, PUT, DELETE) |

#### Frontend (`frontend/`)
Testam a interface completa de cada gerador:

| Arquivo | Página testada |
|---|---|
| `login.cy.js` | Tela de autenticação |
| `home.cy.js` | Menu principal |
| `test-cases.cy.js` | Gerador de Casos de Teste |
| `session-report.cy.js` | Gerador de Relatório de Sessão |
| `test-conditions.cy.js` | Gerador de Condições de Teste |

Os testes de frontend usam **stubs de rede** (`cy.intercept`) para isolar o frontend do backend e da API de tradução, garantindo estabilidade e reprodutibilidade independente do estado do banco de dados.

### Executar os testes

```bash
cd test
npm install

# Todos os testes (unitários + E2E)
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes de API (Cypress)
npm run test:api

# Apenas testes de frontend (Cypress)
npm run test:e2e

# Cypress com interface gráfica
npm run cy:open
```

---

## Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, jsPDF, jspdf-autotable |
| Backend | Node.js, Express (ESM) |
| Tradução | Google Translate API não-oficial (gratuita, sem chave, sem limite diário) |
| Persistência | Arquivos JSON no backend |
| Padrão | ISO-29119-3 (casos e condições de teste), SBTM — John Bach 2001 (relatório de sessão) |
| Testes unitários | Mocha + assert (Node.js) + Mochawesome (relatórios HTML) |
| Testes E2E | Cypress |

---

## Observações

- As traduções automáticas usam o endpoint não-oficial do [Google Translate](https://translate.googleapis.com), que não requer cadastro nem possui limite diário. Todo o conteúdo gerado (título, pré-condições, passos, pós-condições, notas, defeitos, perguntas, condições) é traduzido automaticamente.
- Os arquivos JSON de persistência são criados automaticamente na primeira execução do backend.
- Os IDs dos documentos são persistidos entre reinicializações (sem duplicatas).
- A exportação (PDF, TXT, CSV) sempre usa o idioma da aba atualmente selecionada.

