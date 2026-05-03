describe('Frontend — Gerador de Relatório de Sessão', () => {
  const FIXED_REPORT = {
    id: 'SR-001',
    date: '2026-03-20T10:20',
    tester: 'Maria Gomes',
    module: 'Agendamento de Consultas',
    project: 'Sistema Hospitalar',
    charter: { text: 'Explore a funcionalidade de agendamento de consultas' },
    sessionSize: '30 minutos',
    notes: [{ type: 'I', text: 'Consegui agendar uma consulta duplicada' }],
    defects: ['O sistema permite agendamento duplicado'],
    questions: ['O sistema deveria permitir múltiplos agendamentos?'],
  };

  beforeEach(() => {
    // Isola do backend: sem relatórios existentes ao carregar
    cy.intercept('GET', 'http://localhost:4000/session-reports', { body: [] }).as('loadReports');

    // Salvar retorna relatório fixo sem depender do backend real
    cy.intercept('POST', 'http://localhost:4000/session-reports', {
      statusCode: 201,
      body: FIXED_REPORT,
    }).as('saveReport');

    // Stub da API externa de tradução para evitar dependência de rede
    cy.intercept('GET', 'https://translate.googleapis.com/translate_a/single**', (req) => {
      const q = decodeURIComponent(req.query.q || 'text');
      req.reply({ statusCode: 200, body: [[[q, q]], null, 'pt'] });
    }).as('translate');

    cy.intercept('GET', 'http://localhost:4000/projects', { body: [] }).as('loadProjects');

    cy.fixture('user').then((user) => {
      cy.loginByApi(user.email, user.password);
    });
    cy.visit('/gerador-relatorio-sessao');
  });

  context('Carregamento da página', () => {
    it('deve exibir o título do gerador', () => {
      cy.contains('Gerador de Relatório de Sessão').should('be.visible');
    });

    it('deve exibir os campos do formulário', () => {
      cy.contains('Nome do Testador').should('be.visible');
      cy.contains('Módulo').should('be.visible');
      cy.contains('Test Charter').should('be.visible');
      cy.contains('Tamanho da Sessão').should('be.visible');
      cy.contains('Notas').should('be.visible');
      cy.contains('Defeitos').should('be.visible');
      cy.contains('Perguntas').should('be.visible');
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
      cy.get('input[placeholder="Ex: Maria Gomes"]').should('not.have.value', '');
    });
  });

  context('Geração de relatório de sessão', () => {
    it('deve gerar e exibir um relatório na sidebar', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Relatório').click();

      // Sidebar deve aparecer com o novo relatório (aguarda resposta da API)
      cy.contains('SR-', { timeout: 15000 }).scrollIntoView().should('be.visible');
    });

    it('deve exibir o relatório gerado com os dados corretos', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Relatório').click();
      cy.contains('SR-', { timeout: 15000 }).scrollIntoView().should('be.visible');
      cy.contains('Relatório de Sessão Gerado').should('be.visible');
      cy.contains('Maria Gomes').should('be.visible');
    });
  });

  context('Navegação por abas', () => {
    it('deve navegar entre as abas PT, EN, ES', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Relatório').click();
      cy.contains('SR-', { timeout: 15000 }).scrollIntoView().should('be.visible');

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
