describe('Frontend — Home', () => {
  beforeEach(() => {
    cy.fixture('user').then((user) => {
      cy.loginByApi(user.email, user.password);
    });
    cy.visit('/');
  });

  it('deve exibir o logo e o título da aplicação', () => {
    cy.get('img[alt*="SmartTest"]').should('be.visible');
    cy.contains('Bem-vindo ao SmartTest').should('be.visible');
  });

  it('deve exibir os três botões de navegação', () => {
    cy.contains('Gerador de Casos de Teste').should('be.visible');
    cy.contains('Gerador de Relatório de Sessão').should('be.visible');
    cy.contains('Gerador de Condições de Teste').should('be.visible');
  });

  it('deve exibir o nome do usuário logado no cabeçalho', () => {
    cy.fixture('user').then((user) => {
      cy.contains(user.name).should('be.visible');
    });
  });

  it('deve exibir o botão de Sair', () => {
    cy.contains('button', 'Sair').should('be.visible');
  });

  it('deve navegar para o Gerador de Casos de Teste', () => {
    cy.contains('Gerador de Casos de Teste').click();
    cy.url().should('include', '/gerador-casos-teste');
  });

  it('deve navegar para o Gerador de Relatório de Sessão', () => {
    cy.contains('Gerador de Relatório de Sessão').click();
    cy.url().should('include', '/gerador-relatorio-sessao');
  });

  it('deve navegar para o Gerador de Condições de Teste', () => {
    cy.contains('Gerador de Condições de Teste').click();
    cy.url().should('include', '/gerador-condicoes-teste');
  });

  it('deve deslogar e redirecionar para /login ao clicar em Sair', () => {
    cy.contains('button', 'Sair').click();
    cy.url().should('include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'smarttest_token').should('be.null');
  });
});
