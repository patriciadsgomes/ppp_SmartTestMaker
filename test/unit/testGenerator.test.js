import { generateTestCases } from '../../backend/src/testGenerator.js';
import { strict as assert } from 'assert';

describe('generateTestCases — Unitários', () => {
  describe('estrutura do retorno', () => {
    it('deve retornar um array com exatamente um caso de teste', async () => {
      const result = await generateTestCases({
        title: 'Teste de estrutura',
        steps: [{ action: 'Acessar sistema', expectedResult: 'Sistema acessado' }],
      });
      assert.ok(Array.isArray(result));
      assert.equal(result.length, 1);
    });

    it('deve conter todas as propriedades obrigatórias ISO-29119-3', async () => {
      const [tc] = await generateTestCases({
        title: 'Validar agendamento',
        priority: 'Alta',
        traceability: 'RN5',
        project: 'Sistema Hospitalar',
        preconditions: ['Paciente cadastrado'],
        steps: [{ action: 'Preencher dados', expectedResult: 'Dados aceitos' }],
        postconditions: ['Consulta registrada'],
      });

      assert.ok(tc.id, 'id deve estar presente');
      assert.ok(tc.title, 'title deve estar presente');
      assert.ok(tc.priority, 'priority deve estar presente');
      assert.ok(typeof tc.traceability === 'string', 'traceability deve ser string');
      assert.ok(Array.isArray(tc.preconditions), 'preconditions deve ser array');
      assert.ok(Array.isArray(tc.steps), 'steps deve ser array');
      assert.ok(Array.isArray(tc.postconditions), 'postconditions deve ser array');
    });
  });

  describe('valores padrão', () => {
    it('deve usar "Média" como prioridade padrão quando não informada', async () => {
      const [tc] = await generateTestCases({
        title: 'Teste sem prioridade',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.priority, 'Média');
    });

    it('deve usar título padrão quando não informado', async () => {
      const [tc] = await generateTestCases({ steps: [] });
      assert.equal(tc.title, 'Caso de Teste sem Título');
    });

    it('deve usar ["Nenhuma"] nas pré-condições quando não informadas', async () => {
      const [tc] = await generateTestCases({
        title: 'Sem precondições',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.deepEqual(tc.preconditions, ['Nenhuma']);
    });

    it('deve usar ["Nenhuma"] nas pós-condições quando não informadas', async () => {
      const [tc] = await generateTestCases({
        title: 'Sem pós-condições',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.deepEqual(tc.postconditions, ['Nenhuma']);
    });

    it('deve gerar passo padrão quando steps está vazio', async () => {
      const [tc] = await generateTestCases({ title: 'Sem passos', steps: [] });
      assert.equal(tc.steps.length, 1);
      assert.equal(tc.steps[0].acao, 'Ação não informada');
      assert.equal(tc.steps[0].resultadoEsperado, 'Resultado não informado');
    });
  });

  describe('mapeamento de steps para formato ISO-29119-3', () => {
    it('deve mapear cada step para { passo, acao, resultadoEsperado }', async () => {
      const [tc] = await generateTestCases({
        title: 'Mapeamento de passos',
        steps: [
          { action: 'Abrir sistema', expectedResult: 'Sistema aberto' },
          { action: 'Fazer login', expectedResult: 'Login realizado' },
          { action: 'Navegar para agendamento', expectedResult: 'Tela de agendamento exibida' },
        ],
      });
      assert.equal(tc.steps.length, 3);
      assert.deepEqual(tc.steps[0], { passo: 1, acao: 'Abrir sistema', resultadoEsperado: 'Sistema aberto' });
      assert.deepEqual(tc.steps[1], { passo: 2, acao: 'Fazer login', resultadoEsperado: 'Login realizado' });
      assert.equal(tc.steps[2].passo, 3);
    });

    it('deve numerar os passos sequencialmente a partir de 1', async () => {
      const steps = Array.from({ length: 5 }, (_, i) => ({
        action: `Ação ${i + 1}`,
        expectedResult: `Resultado ${i + 1}`,
      }));
      const [tc] = await generateTestCases({ title: 'Numeração de passos', steps });
      tc.steps.forEach((s, i) => {
        assert.equal(s.passo, i + 1);
      });
    });
  });

  describe('identificador do caso de teste', () => {
    it('deve gerar ID no formato TC-NNN', async () => {
      const [tc] = await generateTestCases({
        title: 'Verificar formato do ID',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.match(tc.id, /^TC-\d{3}$/);
    });

    it('deve usar o ID fornecido quando informado', async () => {
      const [tc] = await generateTestCases({
        id: 'TC-999',
        title: 'Teste com ID fixo',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.id, 'TC-999');
    });
  });

  describe('campo projeto', () => {
    it('deve incluir o projeto quando informado', async () => {
      const [tc] = await generateTestCases({
        title: 'Teste com projeto',
        project: 'Sistema Hospitalar',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.project, 'Sistema Hospitalar');
    });

    it('deve retornar string vazia no projeto quando não informado', async () => {
      const [tc] = await generateTestCases({
        title: 'Teste sem projeto',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.project, '');
    });
  });

  describe('rastreabilidade', () => {
    it('deve preservar a rastreabilidade informada', async () => {
      const [tc] = await generateTestCases({
        title: 'Rastreabilidade',
        traceability: 'RN5',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.traceability, 'RN5');
    });

    it('deve retornar string vazia quando traceability não informada', async () => {
      const [tc] = await generateTestCases({
        title: 'Sem rastreabilidade',
        steps: [{ action: 'Ação', expectedResult: 'Resultado' }],
      });
      assert.equal(tc.traceability, '');
    });
  });
});
