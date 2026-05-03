describe('Frontend — Gerador de Condições de Teste', () => {
  const FIXED_DOC = {
    id: 'CT-001',
    requirements: 'RN2',
    project: 'Sistema Hospitalar',
    conditions: [
      { condId: 1, description: 'Validar agendamento com dados válidos', priority: 'Alta' },
      { condId: 2, description: 'Validar agendamento com data no passado', priority: 'Média' },
    ],
  };

  beforeEach(() => {
    // Isola do backend: sem documentos existentes ao carregar
    cy.intercept('GET', 'http://localhost:4000/test-conditions', { body: [] }).as('loadDocs');

    // Salvar retorna documento fixo sem depender do backend real
    cy.intercept('POST', 'http://localhost:4000/test-conditions', {
      statusCode: 201,
      body: FIXED_DOC,
    }).as('saveDoc');

    // Stub da API externa de tradução para evitar dependência de rede
    cy.intercept('GET', 'https://translate.googleapis.com/translate_a/single**', (req) => {
      const q = decodeURIComponent(req.query.q || 'text');
      req.reply({ statusCode: 200, body: [[[q, q]], null, 'pt'] });
    }).as('translate');

    cy.intercept('GET', 'http://localhost:4000/projects', { body: [] }).as('loadProjects');

    cy.fixture('user').then((user) => {
      cy.loginByApi(user.email, user.password);
    });
    cy.visit('/gerador-condicoes-teste');
  });

  context('Carregamento da página', () => {
    it('deve exibir o título do gerador', () => {
      cy.contains('Gerador de Condições de Teste').should('be.visible');
    });

    it('deve exibir os campos do formulário', () => {
      cy.get('input[placeholder="Ex: RN2"]').should('be.visible');
      cy.contains('Requisitos Testados').should('be.visible');
      cy.contains('Condições de Teste').should('be.visible');
      cy.contains('Prioridade').should('be.visible');
    });

    it('deve exibir o nome do usuário logado', () => {
      cy.fixture('user').then((user) => {
        cy.contains(user.name).should('be.visible');
      });
    });
  });

  context('Preenchimento com exemplo', () => {
    it('deve preencher o formulário ao clicar em Preencher Exemplo', () => {
      cy.contains('Preencher Exemplo').click();
      cy.get('input[placeholder="Ex: RN2"]').should('not.have.value', '');
    });
  });

  context('Geração de condições de teste', () => {
    it('deve gerar e exibir um documento na sidebar', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Condições de Teste').click();

      // Sidebar deve aparecer com o novo documento (aguarda resposta da API)
      cy.contains('CT-', { timeout: 15000 }).scrollIntoView().should('be.visible');
    });

    it('deve exibir as condições geradas com os dados corretos', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Condições de Teste').click();
      cy.contains('CT-', { timeout: 15000 }).scrollIntoView().should('be.visible');
      cy.contains('Condições de Teste Geradas').should('be.visible');
    });
  });

  context('Navegação por abas', () => {
    it('deve navegar entre as abas PT, EN, ES', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Condições de Teste').click();
      cy.contains('CT-', { timeout: 15000 }).scrollIntoView().should('be.visible');

      cy.contains('button', 'English').click();
      cy.contains('button', 'English').should('be.visible');

      cy.contains('button', 'Español').click();
      cy.contains('button', 'Español').should('be.visible');

      cy.contains('button', 'Português').click();
    });
  });

  context('Logout', () => {
    it('deve deslogar ao clicar em Sair', () => {
      cy.contains('button', 'Sair').click();
      cy.url().should('include', '/login');
    });
  });
});
