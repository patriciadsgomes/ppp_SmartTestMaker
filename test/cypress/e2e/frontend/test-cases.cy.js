describe('Frontend — Gerador de Casos de Teste', () => {
  const FIXED_TC = {
    id: 'TC-001',
    title: 'Validar que uma consulta é agendada com sucesso',
    priority: 'Alta',
    traceability: 'RN5',
    project: 'Sistema Hospitalar',
    preconditions: ['Paciente cadastrado no sistema'],
    steps: [{ passo: 1, acao: 'Acessar o sistema', resultadoEsperado: 'Tela exibida' }],
    postconditions: ['Consulta registrada'],
  };

  beforeEach(() => {
    // Isola do backend: sem casos existentes ao carregar
    cy.intercept('GET', 'http://localhost:4000/test-cases', { body: [] }).as('loadCases');

    // Geração retorna caso fixo sem depender do backend real
    cy.intercept('POST', 'http://localhost:4000/generate-tests', {
      statusCode: 200,
      body: { testCases: [FIXED_TC] },
    }).as('generateCase');

    // Stub da API externa de tradução para evitar dependência de rede
    cy.intercept('GET', 'https://translate.googleapis.com/translate_a/single**', (req) => {
      const q = decodeURIComponent(req.query.q || 'text');
      req.reply({ statusCode: 200, body: [[[q, q]], null, 'pt'] });
    }).as('translate');

    cy.fixture('user').then((user) => {
      cy.loginByApi(user.email, user.password);
    });
    cy.visit('/gerador-casos-teste');
  });

  context('Carregamento da página', () => {
    it('deve exibir o título do gerador', () => {
      cy.contains('Gerador de Casos de Teste').should('be.visible');
    });

    it('deve exibir os campos do formulário', () => {
      cy.get('input[placeholder*="título"]').should('be.visible');
      cy.contains('Prioridade').should('be.visible');
      cy.contains('Rastreabilidade').should('be.visible');
      cy.contains('Pré-condições').should('be.visible');
      cy.contains('Passos').should('be.visible');
      cy.contains('Pós-condições').should('be.visible');
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
      cy.get('input[placeholder*="título"]').should('not.have.value', '');
    });
  });

  context('Geração de caso de teste', () => {
    it('deve gerar e exibir um caso de teste na sidebar', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Caso de Teste').click();

      // Sidebar deve aparecer com o novo caso (aguarda resposta da API)
      cy.contains('TC-', { timeout: 15000 }).scrollIntoView().should('be.visible');
    });

    it('deve exibir o caso de teste gerado em formato PT', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Caso de Teste').click();
      cy.contains('TC-', { timeout: 15000 }).scrollIntoView().should('be.visible');
      cy.contains('Prioridade').should('be.visible');
      cy.contains('Alta').should('be.visible');
    });
  });

  context('Navegação por abas', () => {
    it('deve navegar entre as abas PT, EN, ES', () => {
      cy.contains('Preencher Exemplo').click();
      cy.contains('button', 'Gerar Caso de Teste').click();
      cy.contains('TC-', { timeout: 15000 }).scrollIntoView().should('be.visible');

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
