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

app.put('/test-cases/:id', (req, res) => {
  const filePath = path.join(process.cwd(), 'testcases.json');
  try {
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Test case not found' });
    const cases = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const index = cases.findIndex(tc => String(tc.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Test case not found' });
    cases[index] = { ...cases[index], ...req.body, id: cases[index].id };
    fs.writeFileSync(filePath, JSON.stringify(cases, null, 2));
    res.json(cases[index]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Projects ───────────────────────────────────────────────
const PROJECTS_FILE = path.join(process.cwd(), 'projects.json');

function readProjects() {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
  } catch { return []; }
}
function writeProjects(data) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

app.get('/projects', (req, res) => {
  res.json(readProjects());
});

app.post('/projects', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
  const projects = readProjects();
  if (projects.find(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Projeto já existe' });
  }
  const id = 'PRJ-' + String(projects.length + 1).padStart(3, '0');
  const newProject = { id, name: name.trim() };
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

app.delete('/projects/:id', (req, res) => {
  writeProjects(readProjects().filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

app.put('/projects/:id', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
  const projects = readProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Projeto não encontrado' });
  if (projects.find((p, i) => i !== idx && p.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Já existe um projeto com esse nome' });
  }
  const oldName = projects[idx].name;
  const newName = name.trim();
  projects[idx].name = newName;
  writeProjects(projects);

  // Atualizar o campo project em todos os casos de teste que usam o nome antigo
  const casesPath = path.join(process.cwd(), 'testcases.json');
  try {
    if (fs.existsSync(casesPath)) {
      const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      const updated = cases.map(tc => tc.project === oldName ? { ...tc, project: newName } : tc);
      fs.writeFileSync(casesPath, JSON.stringify(updated, null, 2));
    }
  } catch { /* não bloqueia a resposta se testcases.json falhar */ }

  // Atualizar project em session-reports.json
  const sessionPath = path.join(process.cwd(), 'session-reports.json');
  try {
    if (fs.existsSync(sessionPath)) {
      const reports = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
      const updated = reports.map(r => r.project === oldName ? { ...r, project: newName } : r);
      fs.writeFileSync(sessionPath, JSON.stringify(updated, null, 2));
    }
  } catch { /* não bloqueia */ }

  // Atualizar project em test-conditions.json
  const condPath = path.join(process.cwd(), 'test-conditions.json');
  try {
    if (fs.existsSync(condPath)) {
      const conds = JSON.parse(fs.readFileSync(condPath, 'utf-8'));
      const updated = conds.map(c => c.project === oldName ? { ...c, project: newName } : c);
      fs.writeFileSync(condPath, JSON.stringify(updated, null, 2));
    }
  } catch { /* não bloqueia */ }

  res.json({ ...projects[idx], updatedCases: true });
});

// ── Test Conditions ────────────────────────────────────────
const CONDITIONS_FILE = path.join(process.cwd(), 'test-conditions.json');

function readConditions() {
  try {
    if (!fs.existsSync(CONDITIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CONDITIONS_FILE, 'utf-8'));
  } catch { return []; }
}
function writeConditions(data) {
  fs.writeFileSync(CONDITIONS_FILE, JSON.stringify(data, null, 2));
}

app.get('/test-conditions', (req, res) => {
  res.json(readConditions());
});

app.post('/test-conditions', (req, res) => {
  const all = readConditions();
  const id = 'CT-' + String(all.length + 1).padStart(3, '0');
  const newDoc = { id, ...req.body };
  all.push(newDoc);
  writeConditions(all);
  res.status(201).json(newDoc);
});

app.put('/test-conditions/:id', (req, res) => {
  const all = readConditions();
  const idx = all.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id };
  writeConditions(all);
  res.json(all[idx]);
});

app.delete('/test-conditions/:id', (req, res) => {
  writeConditions(readConditions().filter(d => d.id !== req.params.id));
  res.json({ ok: true });
});

// ── Session Reports ────────────────────────────────────────
const SESSION_FILE = path.join(process.cwd(), 'session-reports.json');

function readSessions() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return [];
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  } catch { return []; }
}
function writeSessions(data) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
}

app.get('/session-reports', (req, res) => {
  res.json(readSessions());
});

app.post('/session-reports', (req, res) => {
  const sessions = readSessions();
  const id = 'SR-' + String(sessions.length + 1).padStart(3, '0');
  const newSession = { id, ...req.body };
  sessions.push(newSession);
  writeSessions(sessions);
  res.status(201).json(newSession);
});

app.put('/session-reports/:id', (req, res) => {
  const sessions = readSessions();
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  sessions[idx] = { ...sessions[idx], ...req.body, id: sessions[idx].id };
  writeSessions(sessions);
  res.json(sessions[idx]);
});

app.delete('/session-reports/:id', (req, res) => {
  const sessions = readSessions().filter(s => s.id !== req.params.id);
  writeSessions(sessions);
  res.json({ ok: true });
});

// ── Test Cases ────────────────────────────────────────────
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
