describe('Frontend — Login e Cadastro', () => {
  beforeEach(() => {
    // Limpa autenticação antes de cada teste
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  context('Página de Login', () => {
    it('deve exibir a tela de login com os elementos corretos', () => {
      cy.contains('SmartTest Maker').should('be.visible');
      cy.contains('Entrar').should('be.visible');
      cy.contains('Cadastrar-se').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.contains('button', 'Entrar no Sistema').should('be.visible');
    });

    it('deve exibir erro ao tentar login com credenciais inválidas', () => {
      cy.get('input[type="email"]').type('errado@smarttest.com');
      cy.get('input[type="password"]').type('senhaerrada');
      cy.contains('button', 'Entrar no Sistema').click();
      cy.contains('E-mail ou senha incorretos').should('be.visible');
    });

    it('deve exibir/ocultar a senha ao clicar no ícone de olho', () => {
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
      cy.get('button').contains('👁️').click();
      cy.get('input[type="text"]').should('exist');
      cy.get('button').contains('🙈').click();
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });

    it('deve redirecionar para a home após login válido', () => {
      cy.fixture('user').then((user) => {
        cy.get('input[type="email"]').type(user.email);
        cy.get('input[type="password"]').type(user.password);
        cy.contains('button', 'Entrar no Sistema').click();
        cy.url().should('eq', `${Cypress.config('baseUrl')}/`);
      });
    });

    it('deve salvar o token no localStorage após login', () => {
      cy.fixture('user').then((user) => {
        cy.get('input[type="email"]').type(user.email);
        cy.get('input[type="password"]').type(user.password);
        cy.contains('button', 'Entrar no Sistema').click();
        cy.window().its('localStorage').invoke('getItem', 'smarttest_token').should('exist');
      });
    });
  });

  context('Aba de Cadastro', () => {
    beforeEach(() => {
      cy.contains('button', 'Cadastrar-se').click();
    });

    it('deve exibir o campo de nome ao mudar para cadastro', () => {
      cy.get('input[placeholder*="Ex: Maria"]').should('be.visible');
      cy.contains('button', 'Criar Conta').should('be.visible');
    });

    it('deve exibir erro quando as senhas não coincidem', () => {
      cy.get('input[placeholder*="Ex: Maria"]').type('Novo Usuário');
      cy.get('input[type="email"]').type('novo@smarttest.com');
      cy.get('input[placeholder*="Mínimo"]').type('Senha@123');
      cy.get('input[placeholder*="Repita"]').type('SenhaDiferente');
      cy.contains('button', 'Criar Conta').click();
      cy.contains('senhas não coincidem').should('be.visible');
    });

    it('deve exibir erro quando a senha tem menos de 6 caracteres', () => {
      cy.get('input[placeholder*="Ex: Maria"]').type('Novo Usuário');
      cy.get('input[type="email"]').type('novo2@smarttest.com');
      cy.get('input[placeholder*="Mínimo"]').type('123');
      cy.get('input[placeholder*="Repita"]').type('123');
      cy.contains('button', 'Criar Conta').click();
      cy.contains('pelo menos 6 caracteres').should('be.visible');
    });
  });

  context('Proteção de Rotas', () => {
    it('deve redirecionar para /login ao acessar / sem autenticação', () => {
      cy.visit('/');
      cy.url().should('include', '/login');
    });

    it('deve redirecionar para /login ao acessar gerador sem autenticação', () => {
      cy.visit('/gerador-casos-teste');
      cy.url().should('include', '/login');
    });
  });
});
