# SmartTest Marker

Projeto acadêmico para geração de casos de teste estruturados.
Desenvolvido por Patricia da Silva Gomes baseado no material da Mentoria do ![Julio de Lima](https://github.com/juliodelimas/).

Aplicação web para geração estruturada de casos de teste baseada na norma **ISO-29119-3**, com suporte a múltiplos idiomas (Português, Inglês e Espanhol), persistência de dados, exportação de relatórios e interface intuitiva.

<img src="frontend/public/logoSmartTestMaker.jpeg" alt="SmartTest Marker Logo" width="200" />

---

## O que o sistema faz

- **Gera casos de teste estruturados** a partir de um título, prioridade, rastreabilidade, pré-condições, passos e pós-condições, seguindo o padrão ISO-29119-3.
- **Traduz automaticamente** os casos de teste para Inglês e Espanhol via API MyMemory, com detecção de limite diário de traduções gratuitas.
- **Exibe os casos em três abas de idioma**: Português (PT), Inglês (EN) e Espanhol (ES).
- **Salva todos os casos de teste** em arquivo `testcases.json` no backend, com persistência entre reinicializações do servidor.
- **Lista os casos salvos** em uma barra lateral (sidebar), permitindo navegar, selecionar e visualizar qualquer caso gerado anteriormente.
- **Exclui casos de teste** individualmente pela sidebar, com sincronização automática no backend.
- **Exporta casos de teste** nos formatos:
  - **PDF** — com layout estilizado, cabeçalho colorido, tabela de passos e bordas.
  - **TXT** — texto simples estruturado.
  - **CSV** — uma linha por passo, compatível com Excel/Sheets.

---

## Estrutura do Projeto

```
ppp_SmartTestMaker/
├── backend/
│   ├── src/
│   │   ├── index.js          # Servidor Express (API REST)
│   │   └── testGenerator.js  # Gerador de casos de teste ISO-29119-3
│   ├── testcases.json        # Persistência dos casos de teste
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── logoSmartTestMaker.jpeg
│   └── src/
│       └── App.js            # Interface React principal
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
| `GET` | `/test-cases` | Lista todos os casos de teste salvos |
| `POST` | `/generate-tests` | Gera e salva um novo caso de teste |
| `DELETE` | `/test-cases/:id` | Remove um caso de teste pelo ID |

### Exemplo de requisição `POST /generate-tests`

```json
{
  "title": "Login com credenciais válidas",
  "priority": "Alta",
  "traceability": "REQ-001",
  "preconditions": ["Usuário cadastrado no sistema", "Aplicação disponível"],
  "steps": [
    { "acao": "Acessar a página de login", "resultadoEsperado": "Página de login exibida" },
    { "acao": "Inserir usuário e senha válidos", "resultadoEsperado": "Campos preenchidos" },
    { "acao": "Clicar em Entrar", "resultadoEsperado": "Usuário redirecionado ao dashboard" }
  ],
  "postconditions": ["Sessão iniciada com sucesso"]
}
```

---

## Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, jsPDF, jspdf-autotable |
| Backend | Node.js, Express (ESM) |
| Tradução | MyMemory API (gratuita, sem chave) |
| Persistência | JSON file (`testcases.json`) |
| Padrão | ISO-29119-3 |

---

## Observações

- As traduções automáticas usam a API gratuita [MyMemory](https://mymemory.translated.net/), que possui um limite diário de caracteres. Ao atingir o limite, uma mensagem de aviso é exibida na interface.
- O arquivo `testcases.json` é criado automaticamente na primeira execução do backend.
- O ID dos casos de teste é persistido entre reinicializações (sem duplicatas).

