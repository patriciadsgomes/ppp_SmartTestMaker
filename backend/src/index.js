import express from 'express';
import cors from 'cors';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import { generateTestCases } from './testGenerator.js';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const swaggerDocument = YAML.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/test-cases', (req, res) => {
  const filePath = path.join(process.cwd(), 'testcases.json');
  try {
    if (!fs.existsSync(filePath)) return res.json([]);
    const cases = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Deduplicate by id before returning
    const seen = new Map();
    for (const tc of cases) seen.set(tc.id, tc);
    res.json([...seen.values()]);
  } catch (e) {
    res.json([]);
  }
});

app.delete('/test-cases/:id', (req, res) => {
  const filePath = path.join(process.cwd(), 'testcases.json');
  try {
    if (!fs.existsSync(filePath)) return res.json({ ok: true });
    const cases = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const filtered = cases.filter(tc => String(tc.id) !== String(req.params.id));
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/generate-tests', async (req, res) => {
  try {
    // Validar que 'title' e pelo menos um passo estejam presentes
    const { title, steps } = req.body;
    if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: title and steps' });
    }
    const testCases = await generateTestCases(req.body);

    // Salvar cada test case gerado em testcases.json
    const filePath = path.join(process.cwd(), 'testcases.json');
    let allCases = [];
    try {
      if (fs.existsSync(filePath)) {
        allCases = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      allCases = [];
    }
    allCases.push(...testCases);
    // Deduplicate: keep last entry per id
    const seen = new Map();
    for (const tc of allCases) seen.set(tc.id, tc);
    fs.writeFileSync(filePath, JSON.stringify([...seen.values()], null, 2));

    res.json({ testCases });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
