const API = Cypress.env('apiUrl') || 'http://localhost:4000';

describe('API — Casos de Teste', () => {
  let token;
  let createdId;

  const payload = {
    title: 'Validar agendamento de consulta com dados válidos',
    priority: 'Alta',
    traceability: 'RN5',
    project: 'Sistema Hospitalar',
    preconditions: ['Paciente cadastrado no sistema', 'Médico com agenda disponível'],
    steps: [
      { action: 'Acessar a tela de agendamento', expectedResult: 'Tela exibida corretamente' },
      { action: 'Preencher dados do paciente', expectedResult: 'Dados aceitos sem erros' },
      { action: 'Selecionar médico e horário', expectedResult: 'Horário disponível selecionado' },
      { action: 'Confirmar agendamento', expectedResult: 'Consulta registrada com sucesso' },
    ],
    postconditions: ['Consulta registrada no sistema', 'Notificação enviada ao paciente'],
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

  context('POST /generate-tests', () => {
    it('deve gerar e salvar um caso de teste estruturado', () => {
      req('POST', '/generate-tests', payload).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('testCases');
        expect(res.body.testCases).to.be.an('array').with.length(1);

        const tc = res.body.testCases[0];
        expect(tc).to.have.property('id');
        expect(tc.id).to.match(/^TC-\d{3}$/);
        expect(tc.title).to.eq(payload.title);
        expect(tc.priority).to.eq('Alta');
        expect(tc.traceability).to.eq('RN5');
        expect(tc.steps).to.have.length(4);
        expect(tc.steps[0]).to.have.keys('passo', 'acao', 'resultadoEsperado');
        expect(tc.steps[0].passo).to.eq(1);
        expect(tc.preconditions).to.deep.eq(payload.preconditions);
        expect(tc.postconditions).to.deep.eq(payload.postconditions);

        createdId = tc.id;
      });
    });

    it('deve gerar um caso de teste com valores padrão quando campos opcionais ausentes', () => {
      req('POST', '/generate-tests', {
        title: 'Caso mínimo',
        steps: [{ action: 'Ação básica', expectedResult: 'Resultado esperado' }],
      }).then((res) => {
        expect(res.status).to.eq(200);
        const tc = res.body.testCases[0];
        expect(tc.priority).to.eq('Média');
        expect(tc.preconditions).to.deep.eq(['Nenhuma']);
        expect(tc.postconditions).to.deep.eq(['Nenhuma']);
      });
    });
  });

  context('GET /test-cases', () => {
    it('deve retornar a lista de casos de teste', () => {
      req('GET', '/test-cases').then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.greaterThan(0);
      });
    });

    it('deve conter o caso de teste recém-criado', () => {
      req('GET', '/test-cases').then((res) => {
        const found = res.body.find((tc) => tc.id === createdId);
        expect(found).to.exist;
        expect(found.title).to.eq(payload.title);
      });
    });
  });

  context('PUT /test-cases/:id', () => {
    it('deve atualizar o título e prioridade de um caso de teste', () => {
      const updated = { ...payload, title: 'Título Atualizado', priority: 'Baixa' };
      req('PUT', `/test-cases/${createdId}`, updated).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.title).to.eq('Título Atualizado');
        expect(res.body.priority).to.eq('Baixa');
        expect(res.body.id).to.eq(createdId);
      });
    });

    it('deve retornar 404 para ID inexistente', () => {
      req('PUT', '/test-cases/TC-99999', payload).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });

  context('DELETE /test-cases/:id', () => {
    it('deve excluir o caso de teste criado', () => {
      req('DELETE', `/test-cases/${createdId}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.ok).to.be.true;
      });
    });

    it('deve confirmar que o caso foi removido da lista', () => {
      req('GET', '/test-cases').then((res) => {
        const found = res.body.find((tc) => tc.id === createdId);
        expect(found).to.be.undefined;
      });
    });
  });
});
