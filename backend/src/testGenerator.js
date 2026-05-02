

// Estrutura de entrada esperada:
// {
//   id?: number,
//   title: string,
//   priority?: string,
//   traceability?: string,
//   preconditions?: array de strings,
//   steps: array de { action: string, expectedResult: string },
//   postconditions?: array de strings
// }

import fs from 'fs';
import path from 'path';

function loadMaxId() {
  try {
    const filePath = path.join(process.cwd(), 'testcases.json');
    if (!fs.existsSync(filePath)) return 0;
    const cases = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(cases) || cases.length === 0) return 0;
    return Math.max(...cases.map(tc => Number(tc.id) || 0));
  } catch {
    return 0;
  }
}

let testCaseCounter = loadMaxId() + 1;

export async function generateTestCases(input) {
  // Geração baseada na ISO-29119-3
  const {
    title,
    priority = 'Média',
    traceability = '',
    preconditions = [],
    steps = [],
    postconditions = []
  } = input;

  const testCase = {
    id: input.id || testCaseCounter++,
    title: title || 'Caso de Teste sem Título',
    priority,
    traceability,
    preconditions: preconditions.length ? preconditions : ['Nenhuma'],
    steps: steps.length
      ? steps.map((s, idx) => ({ passo: idx + 1, acao: s.action, resultadoEsperado: s.expectedResult }))
      : [{ passo: 1, acao: 'Ação não informada', resultadoEsperado: 'Resultado não informado' }],
    postconditions: postconditions.length ? postconditions : ['Nenhuma']
  };

  return [testCase];
}
