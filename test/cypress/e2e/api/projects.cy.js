const API = Cypress.env('apiUrl') || 'http://localhost:4000';

describe('API — Projetos', () => {
  let token;
  let createdProjectId;
  const projectName = `Projeto Teste ${Date.now()}`;

  before(() => {
    cy.getAuthToken().then((t) => { token = t; });
  });

  const req = (method, path, body) =>
    cy.request({
      method,
      url: `${API}${path}`,
      headers: { Authorization: `Bearer ${token}` },
      body,
      failOnStatusCode: false,
    });

  context('GET /projects', () => {
    it('deve retornar a lista de projetos', () => {
      req('GET', '/projects').then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
      });
    });
  });

  context('POST /projects', () => {
    it('deve criar um novo projeto', () => {
      req('POST', '/projects', { name: projectName }).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.have.property('id');
        expect(res.body.name).to.eq(projectName);
        createdProjectId = res.body.id;
      });
    });

    it('deve rejeitar criação com nome vazio', () => {
      req('POST', '/projects', { name: '' }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });

    it('deve rejeitar nome de projeto duplicado', () => {
      req('POST', '/projects', { name: projectName }).then((res) => {
        expect(res.status).to.eq(409);
      });
    });
  });

  context('PUT /projects/:id', () => {
    it('deve renomear um projeto existente', () => {
      const newName = `${projectName} Renomeado`;
      req('PUT', `/projects/${createdProjectId}`, { name: newName }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.name).to.eq(newName);
      });
    });

    it('deve retornar 404 para projeto inexistente', () => {
      req('PUT', '/projects/PRJ-INVALIDO', { name: 'Qualquer' }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  context('DELETE /projects/:id', () => {
    it('deve excluir o projeto criado', () => {
      req('DELETE', `/projects/${createdProjectId}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.ok).to.be.true;
      });
    });

    it('deve confirmar que o projeto foi removido da lista', () => {
      req('GET', '/projects').then((res) => {
        const found = res.body.find((p) => p.id === createdProjectId);
        expect(found).to.be.undefined;
      });
    });
  });
});
