const API = Cypress.env('apiUrl') || 'http://localhost:4000';

describe('API — Relatórios de Sessão', () => {
  let token;
  let createdId;

  const payload = {
    date: '2026-03-20T10:20',
    tester: 'Maria Gomes',
    module: 'Agendamento de Consultas',
    project: 'Sistema Hospitalar',
    charter: {
      text: 'Explore a funcionalidade de agendamento\nCom foco em validação de regras de negócio\nPara descobrir se o sistema lida com situações inválidas',
    },
    sessionSize: '30 minutos',
    notes: [
      { type: 'I', text: 'Consegui agendar consulta duplicada no mesmo horário' },
      { type: 'R', text: 'Consultas duplicadas podem gerar conflitos graves no atendimento' },
    ],
    defects: ['Sistema permite agendamento duplicado', 'Datas passadas são aceitas'],
    questions: ['O sistema deveria bloquear agendamentos duplicados?'],
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

  context('POST /session-reports', () => {
    it('deve criar um novo relatório de sessão', () => {
      req('POST', '/session-reports', payload).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body).to.have.property('id');
        expect(res.body.id).to.match(/^SR-\d{3}$/);
        expect(res.body.tester).to.eq('Maria Gomes');
        expect(res.body.module).to.eq('Agendamento de Consultas');
        expect(res.body.notes).to.have.length(2);
        expect(res.body.defects).to.have.length(2);
        createdId = res.body.id;
      });
    });
  });

  context('GET /session-reports', () => {
    it('deve retornar a lista de relatórios', () => {
      req('GET', '/session-reports').then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
      });
    });

    it('deve conter o relatório recém-criado', () => {
      req('GET', '/session-reports').then((res) => {
        const found = res.body.find((r) => r.id === createdId);
        expect(found).to.exist;
        expect(found.tester).to.eq('Maria Gomes');
      });
    });
  });

  context('PUT /session-reports/:id', () => {
    it('deve atualizar o testador e módulo do relatório', () => {
      const updated = { ...payload, tester: 'João Silva', module: 'Cadastro de Pacientes' };
      req('PUT', `/session-reports/${createdId}`, updated).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.tester).to.eq('João Silva');
        expect(res.body.module).to.eq('Cadastro de Pacientes');
        expect(res.body.id).to.eq(createdId);
      });
    });

    it('deve retornar 404 para ID inexistente', () => {
      req('PUT', '/session-reports/SR-99999', payload).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  context('DELETE /session-reports/:id', () => {
    it('deve excluir o relatório criado', () => {
      req('DELETE', `/session-reports/${createdId}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.ok).to.be.true;
      });
    });

    it('deve confirmar que o relatório foi removido', () => {
      req('GET', '/session-reports').then((res) => {
        const found = res.body.find((r) => r.id === createdId);
        expect(found).to.be.undefined;
      });
    });
  });
});
