const API = Cypress.env('apiUrl') || 'http://localhost:4000';

describe('API — Autenticação', () => {
  const timestamp = Date.now();
  const newUser = {
    name: 'Usuário Teste',
    email: `teste_${timestamp}@smarttest.com`,
    password: 'Senha@123',
  };

  context('POST /auth/login', () => {
    it('deve autenticar com credenciais válidas e retornar token', () => {
      cy.fixture('user').then((user) => {
        cy.request({
          method: 'POST',
          url: `${API}/auth/login`,
          body: { email: user.email, password: user.password },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body).to.have.property('token');
          expect(res.body).to.have.property('user');
          expect(res.body.user.email).to.eq(user.email);
          expect(res.body.user).to.not.have.property('passwordHash');
        });
      });
    });

    it('deve rejeitar senha incorreta com status 401', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: { email: 'mentor@smarttest.com', password: 'senhaerrada' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body).to.have.property('error');
      });
    });

    it('deve rejeitar e-mail desconhecido com status 401', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: { email: 'naoexiste@smarttest.com', password: 'qualquer' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
        expect(res.body).to.have.property('error');
      });
    });

    it('deve rejeitar requisição sem e-mail ou senha com status 400', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: {},
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  context('POST /auth/register', () => {
    it('deve cadastrar novo usuário e retornar token', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/register`,
        body: newUser,
      }).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.have.property('token');
        expect(res.body.user.email).to.eq(newUser.email);
        expect(res.body.user.name).to.eq(newUser.name);
      });
    });

    it('deve rejeitar e-mail duplicado com status 409', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/register`,
        body: newUser,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(409);
        expect(res.body.error).to.include('cadastrado');
      });
    });

    it('deve rejeitar senha com menos de 6 caracteres com status 400', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/register`,
        body: { name: 'Teste', email: 'outro@smarttest.com', password: '123' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });

    it('deve rejeitar cadastro sem nome com status 400', () => {
      cy.request({
        method: 'POST',
        url: `${API}/auth/register`,
        body: { email: 'semNome@smarttest.com', password: 'Senha@123' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  context('Proteção de rotas', () => {
    it('deve retornar 401 ao acessar rota protegida sem token', () => {
      cy.request({
        method: 'GET',
        url: `${API}/test-cases`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });

    it('deve retornar 401 com token inválido', () => {
      cy.request({
        method: 'GET',
        url: `${API}/test-cases`,
        headers: { Authorization: 'Bearer tokeninvalido123' },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(401);
      });
    });
  });
});
