const API = Cypress.env('apiUrl') || 'http://localhost:4000';

describe('API — Condições de Teste', () => {
  let token;
  let createdId;

  const payload = {
    requirements: 'RN5 (Agendamento de consultas)',
    project: 'Sistema Hospitalar',
    conditions: [
      { condId: 1, description: 'Validação de disponibilidade de horário na agenda do médico', priority: 'Alta' },
      { condId: 2, description: 'Permitir ou bloquear agendamentos em datas passadas', priority: 'Alta' },
      { condId: 3, description: 'Validação de preenchimento obrigatório dos dados do paciente', priority: 'Média' },
      { condId: 4, description: 'Testar agendamento com dados inválidos', priority: 'Baixa' },
    ],
  };

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

  context('POST /test-conditions', () => {
    it('deve criar um novo documento de condições de teste', () => {
      req('POST', '/test-conditions', payload).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.have.property('id');
        expect(res.body.id).to.match(/^CT-\d{3}$/);
        expect(res.body.requirements).to.eq(payload.requirements);
        expect(res.body.conditions).to.have.length(4);
        expect(res.body.conditions[0].priority).to.eq('Alta');
        createdId = res.body.id;
      });
    });
  });

  context('GET /test-conditions', () => {
    it('deve retornar a lista de condições de teste', () => {
      req('GET', '/test-conditions').then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
      });
    });

    it('deve conter o documento recém-criado', () => {
      req('GET', '/test-conditions').then((res) => {
        const found = res.body.find((d) => d.id === createdId);
        expect(found).to.exist;
        expect(found.requirements).to.eq(payload.requirements);
      });
    });
  });

  context('PUT /test-conditions/:id', () => {
    it('deve atualizar os requisitos e condições', () => {
      const updated = { ...payload, requirements: 'RN6 (Cancelamento de consultas)' };
      req('PUT', `/test-conditions/${createdId}`, updated).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.requirements).to.eq('RN6 (Cancelamento de consultas)');
        expect(res.body.id).to.eq(createdId);
      });
    });

    it('deve retornar 404 para ID inexistente', () => {
      req('PUT', '/test-conditions/CT-99999', payload).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  context('DELETE /test-conditions/:id', () => {
    it('deve excluir o documento criado', () => {
      req('DELETE', `/test-conditions/${createdId}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.ok).to.be.true;
      });
    });

    it('deve confirmar que o documento foi removido', () => {
      req('GET', '/test-conditions').then((res) => {
        const found = res.body.find((d) => d.id === createdId);
        expect(found).to.be.undefined;
      });
    });
  });
});
