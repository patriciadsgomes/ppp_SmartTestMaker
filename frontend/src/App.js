
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TRANSLATION_LIMIT_MSG = 'ATENÇÃO: Você usou todas as traduções gratuitas disponíveis por hoje.';

const PRIORITY_MAP = {
  en: { 'Baixa': 'Low', 'Média': 'Medium', 'Alta': 'High' },
  es: { 'Baixa': 'Baja', 'Média': 'Media', 'Alta': 'Alta' }
};

const PRIORITY_OPTIONS = {
  en: ['Low', 'Medium', 'High'],
  es: ['Baja', 'Media', 'Alta']
};

function isLimitWarning(text) {
  return typeof text === 'string' && text.toUpperCase().includes('MYMEMORY WARNING');
}

async function translateText(text, from = 'pt', to = 'en') {
  if (!text || !text.trim()) return '';

  // Translate line by line to respect API length limits
  const lines = text.split('\n');
  try {
    const translatedLines = await Promise.all(
      lines.map(async (line) => {
        if (!line.trim()) return line;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(line)}&langpair=${from}|${to}`;
        const res = await fetch(url);
        const data = await res.json();
        const translated = data.responseData?.translatedText;
        if (isLimitWarning(translated)) throw new Error('limit');
        return translated || line;
      })
    );
    return translatedLines.join('\n');
  } catch (err) {
    if (err.message === 'limit') return TRANSLATION_LIMIT_MSG;
    return text;
  }
}

async function translateTestCaseAPI(testCase, to = 'en') {
  const translateArray = async items => Promise.all(items.map(item => translateText(item, 'pt', to)));

  const translateSteps = async items => Promise.all(items.map(async item => ({
    passo: item.passo,
    acao: await translateText(item.acao, 'pt', to),
    resultadoEsperado: await translateText(item.resultadoEsperado, 'pt', to)
  })));

  return {
    id: testCase.id,
    title: await translateText(testCase.title, 'pt', to),
    priority: await translateText(testCase.priority, 'pt', to),
    traceability: await translateText(testCase.traceability, 'pt', to),
    preconditions: await translateArray(testCase.preconditions),
    steps: await translateSteps(testCase.steps),
    postconditions: await translateArray(testCase.postconditions)
  };
}

const LANG_LABELS = {
  en: {
    title: 'Title',
    priority: 'Priority',
    traceability: 'Traceability',
    preconditions: 'Preconditions',
    steps: 'Steps (Action | Expected Result)',
    postconditions: 'Postconditions',
    translating: 'Translating...'
  },
  es: {
    title: 'Título',
    priority: 'Prioridad',
    traceability: 'Trazabilidad',
    preconditions: 'Precondiciones',
    steps: 'Pasos (Acción | Resultado Esperado)',
    postconditions: 'Poscondiciones',
    translating: 'Traduciendo...'
  }
};

function TranslatedInputs({ title, priority, traceability, preconditions, steps, postconditions, targetLang = 'en' }) {
  const labels = LANG_LABELS[targetLang];
  const [translated, setTranslated] = useState({
    title: '',
    priority: '',
    traceability: '',
    preconditions: '',
    steps: '',
    postconditions: ''
  });

  useEffect(() => {
    let active = true;

    async function translateAll() {
      setTranslated({
        title: labels.translating,
        priority: labels.translating,
        traceability: labels.translating,
        preconditions: labels.translating,
        steps: labels.translating,
        postconditions: labels.translating
      });

      const [translatedTitle, translatedTraceability, translatedPreconditions, translatedSteps, translatedPostconditions] = await Promise.all([
        translateText(title, 'pt', targetLang),
        translateText(traceability, 'pt', targetLang),
        translateText(preconditions, 'pt', targetLang),
        translateText(steps, 'pt', targetLang),
        translateText(postconditions, 'pt', targetLang)
      ]);

      if (!active) return;

      setTranslated({
        title: translatedTitle,
        priority: PRIORITY_MAP[targetLang]?.[priority] || priority,
        traceability: translatedTraceability,
        preconditions: translatedPreconditions,
        steps: translatedSteps,
        postconditions: translatedPostconditions
      });
    }

    translateAll();

    return () => {
      active = false;
    };
  }, [title, priority, traceability, preconditions, steps, postconditions, targetLang, labels.translating]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <label><b>{labels.title}</b></label>
        <input style={styles.input} value={translated.title} readOnly />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ width: 160 }}>
          <label><b>{labels.priority}</b></label>
          <select style={styles.input} value={translated.priority} disabled>
            {(PRIORITY_OPTIONS[targetLang] || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label><b>{labels.traceability}</b></label>
          <input style={styles.input} value={translated.traceability} readOnly />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label><b>{labels.preconditions}</b></label>
          <textarea style={styles.textarea} rows={3} value={translated.preconditions} readOnly />
        </div>
      </div>
      <div style={{ marginTop: 0, marginBottom: 0 }}>
        <label><b>{labels.steps}</b></label>
        <textarea style={styles.textarea} rows={6} value={translated.steps} readOnly />
      </div>
      <div style={{ marginTop: 0, marginBottom: 0 }}>
        <label><b>{labels.postconditions}</b></label>
        <textarea style={styles.textarea} rows={3} value={translated.postconditions} readOnly />
      </div>
    </>
  );
}

function TestCaseCard({ testCase, language }) {
  const labelsMap = {
    pt: {
      title: 'Título',
      priority: 'Prioridade',
      traceability: 'Rastreabilidade',
      preconditions: 'Pré-Condições',
      postconditions: 'Pós-Condições',
      steps: 'Passos',
      step: 'Passo',
      action: 'Ação',
      expectedResult: 'Resultado Esperado'
    },
    en: {
      title: 'Title',
      priority: 'Priority',
      traceability: 'Traceability',
      preconditions: 'Preconditions',
      postconditions: 'Postconditions',
      steps: 'Steps',
      step: 'Step',
      action: 'Action',
      expectedResult: 'Expected Result'
    },
    es: {
      title: 'Título',
      priority: 'Prioridad',
      traceability: 'Trazabilidad',
      preconditions: 'Precondiciones',
      postconditions: 'Poscondiciones',
      steps: 'Pasos',
      step: 'Paso',
      action: 'Acción',
      expectedResult: 'Resultado Esperado'
    }
  };
  const labels = labelsMap[language] || labelsMap.en;

  return (
    <div style={styles.card}>
      <div style={{ marginBottom: 8 }}><b>ID:</b> {testCase.id}</div>
      <div style={{ marginBottom: 8 }}><b>{labels.title}:</b> {testCase.title}</div>
      <div style={{ marginBottom: 8 }}><b>{labels.priority}:</b> {testCase.priority}</div>
      <div style={{ marginBottom: 8 }}><b>{labels.traceability}:</b> {testCase.traceability}</div>
      <div style={{ marginBottom: 8 }}>
        <b>{labels.preconditions}:</b>
        <ul>{testCase.preconditions.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>{labels.steps}:</b>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: '#e3eafc' }}>
              <th style={styles.tableHeader}>{labels.step}</th>
              <th style={styles.tableHeader}>{labels.action}</th>
              <th style={styles.tableHeader}>{labels.expectedResult}</th>
            </tr>
          </thead>
          <tbody>
            {testCase.steps.map((step, index) => (
              <tr key={index}>
                <td style={styles.tableCellCenter}>{step.passo}</td>
                <td style={styles.tableCell}>{step.acao}</td>
                <td style={styles.tableCell}>{step.resultadoEsperado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginBottom: 8, marginTop: 16 }}>
        <b>{labels.postconditions}:</b>
        <ul>{testCase.postconditions.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
    </div>
  );
}

const CARD_LABELS = {
  pt: { title: 'Título', priority: 'Prioridade', traceability: 'Rastreabilidade', preconditions: 'Pré-Condições', steps: 'Passos', step: 'Passo', action: 'Ação', expectedResult: 'Resultado Esperado', postconditions: 'Pós-Condições' },
  en: { title: 'Title', priority: 'Priority', traceability: 'Traceability', preconditions: 'Preconditions', steps: 'Steps', step: 'Step', action: 'Action', expectedResult: 'Expected Result', postconditions: 'Postconditions' },
  es: { title: 'Título', priority: 'Prioridad', traceability: 'Trazabilidad', preconditions: 'Precondiciones', steps: 'Pasos', step: 'Paso', action: 'Acción', expectedResult: 'Resultado Esperado', postconditions: 'Poscondiciones' }
};

function exportTXT(testCase, language) {
  const L = CARD_LABELS[language];
  const lines = [
    `ID: ${testCase.id}`,
    `${L.title}: ${testCase.title}`,
    `${L.priority}: ${testCase.priority}`,
    `${L.traceability}: ${testCase.traceability}`,
    `${L.preconditions}:`,
    ...testCase.preconditions.map(p => `  - ${p}`),
    `${L.steps}:`,
    ...testCase.steps.map(s => `  ${s.passo}. ${L.action}: ${s.acao} | ${L.expectedResult}: ${s.resultadoEsperado}`),
    `${L.postconditions}:`,
    ...testCase.postconditions.map(p => `  - ${p}`)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-case-${testCase.id}-${language}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(testCase, language) {
  const L = CARD_LABELS[language];
  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ['ID', 'title', 'priority', 'traceability', 'preconditions', 'step', 'action', 'expectedResult', 'postconditions'].map(h => escape(L[h] || h)),
    ...testCase.steps.map((s, i) => [
      escape(testCase.id),
      escape(testCase.title),
      escape(testCase.priority),
      escape(testCase.traceability),
      escape(i === 0 ? testCase.preconditions.join('; ') : ''),
      escape(s.passo),
      escape(s.acao),
      escape(s.resultadoEsperado),
      escape(i === 0 ? testCase.postconditions.join('; ') : '')
    ])
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `test-case-${testCase.id}-${language}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(testCase, language) {
  const L = CARD_LABELS[language];
  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;
  const blue = [25, 118, 210];      // #1976d2
  const lightBlue = [227, 234, 252]; // #e3eafc
  const textDark = [33, 33, 33];

  let y = 14;

  // ── Header bar ──────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('SmartTest Marker', margin + 4, y + 9.5);
  y += 20;

  // ── Card background ──────────────────────────────────────
  const cardStartY = y;

  // helper: field row
  const fieldRow = (label, value) => {
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    doc.text(`${label}:`, margin + 3, y);
    const labelW = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const wrapped = doc.splitTextToSize(String(value || ''), contentW - labelW - 6);
    doc.text(wrapped, margin + 3 + labelW, y);
    y += 6 * wrapped.length + 2;
  };

  // helper: section title
  const sectionTitle = (text) => {
    if (y > 260) { doc.addPage(); y = 14; }
    y += 2;
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin + 1, y - 4, contentW - 2, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    doc.text(text, margin + 4, y + 0.5);
    y += 7;
  };

  // helper: bullet list
  const bulletList = (items) => {
    items.forEach(item => {
      if (y > 262) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...textDark);
      doc.setFillColor(...blue);
      doc.circle(margin + 5, y - 1.2, 1, 'F');
      const wrapped = doc.splitTextToSize(item, contentW - 12);
      doc.text(wrapped, margin + 9, y);
      y += 5.5 * wrapped.length;
    });
    y += 2;
  };

  // ID row
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentW, y);
  y += 5;
  fieldRow('ID', testCase.id);
  fieldRow(L.title, testCase.title);

  // Priority + Traceability side by side
  if (y > 260) { doc.addPage(); y = 14; }
  const halfW = (contentW - 6) / 2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...blue);
  doc.text(`${L.priority}:`, margin + 3, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...textDark);
  doc.text(String(testCase.priority || ''), margin + 3 + doc.getTextWidth(`${L.priority}: `), y);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...blue);
  doc.text(`${L.traceability}:`, margin + 3 + halfW, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...textDark);
  doc.text(String(testCase.traceability || ''), margin + 3 + halfW + doc.getTextWidth(`${L.traceability}: `), y);
  y += 8;

  // Preconditions
  sectionTitle(L.preconditions);
  bulletList(testCase.preconditions);

  // Steps table
  sectionTitle(L.steps);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[L.step, L.action, L.expectedResult]],
    body: testCase.steps.map(s => [s.passo, s.acao, s.resultadoEsperado]),
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: { fontSize: 10, textColor: textDark, fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: { 0: { halign: 'center', cellWidth: 16 } },
    tableLineColor: blue,
    tableLineWidth: 0.3,
    theme: 'grid'
  });
  y = doc.lastAutoTable.finalY + 6;

  // Postconditions
  sectionTitle(L.postconditions);
  bulletList(testCase.postconditions);

  // draw card border around everything
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardStartY - 2, contentW, y - cardStartY + 4, 3, 3, 'S');

  doc.save(`test-case-${testCase.id}-${language}.pdf`);
}

function ExportButton({ testCase, language }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
      >
        ⬇ Exportar
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px #0002', zIndex: 100, minWidth: 130 }}>
          {[['PDF', () => exportPDF(testCase, language)], ['TXT', () => exportTXT(testCase, language)], ['CSV', () => exportCSV(testCase, language)]].map(([label, fn]) => (
            <button
              key={label}
              onClick={() => { fn(); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#333' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Média');
  const [traceability, setTraceability] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [steps, setSteps] = useState('');
  const [postconditions, setPostconditions] = useState('');
  const [allTestCases, setAllTestCases] = useState([]); // [{ id, pt, en, es }]
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pt');

  // Projects
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [projectError, setProjectError] = useState('');

  const selectedEntry = allTestCases.find(tc => tc.id === selectedId) || null;

  // Carregar projetos ao iniciar
  useEffect(() => {
    fetch('http://localhost:4000/projects')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, []);

  // Carregar casos salvos ao iniciar
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch('http://localhost:4000/test-cases');
        const cases = await res.json();
        if (!Array.isArray(cases) || cases.length === 0) return;

        const entries = await Promise.all(
          cases.map(async (ptCase) => {
            const [enCase, esCase] = await Promise.all([
              translateTestCaseAPI(ptCase, 'en'),
              translateTestCaseAPI(ptCase, 'es')
            ]);
            return { id: ptCase.id, pt: ptCase, en: enCase, es: esCase };
          })
        );

        // Deduplicate by id (keep last)
        const seen = new Map();
        for (const e of entries) seen.set(e.id, e);
        const unique = [...seen.values()];

        setAllTestCases(unique);
        setSelectedId(unique[unique.length - 1].id);
      } catch {
        // backend indisponível, ignora
      }
    }
    loadSaved();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const body = {
        title,
        priority,
        traceability,
        project: selectedProject,
        preconditions: preconditions.split('\n').map(item => item.trim()).filter(Boolean),
        steps: steps
          .split('\n')
          .map(line => {
            const [action, expectedResult] = line.split('|').map(item => item.trim());
            return action ? { action, expectedResult: expectedResult || '' } : null;
          })
          .filter(Boolean),
        postconditions: postconditions.split('\n').map(item => item.trim()).filter(Boolean)
      };

      const response = await fetch('http://localhost:4000/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      const ptCase = data.testCases[0];
      const [enCase, esCase] = await Promise.all([
        translateTestCaseAPI(ptCase, 'en'),
        translateTestCaseAPI(ptCase, 'es')
      ]);

      const newEntry = { id: ptCase.id, pt: ptCase, en: enCase, es: esCase };
      setAllTestCases(prev => {
        const idx = prev.findIndex(tc => tc.id === ptCase.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newEntry;
          return updated;
        }
        return [...prev, newEntry];
      });
      setSelectedId(ptCase.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    if (!selectedProject) setSelectedProject('Sistema Hospitalar');
    setTitle('Validar que uma consulta é agendada com sucesso para um paciente com dados válidos');
    setPriority('Alta');
    setTraceability('RN5');
    setPreconditions(
      'Paciente cadastrado no sistema\n' +
      'Médico cadastrado e ativo\n' +
      'Agenda do médico disponível\n' +
      'Usuário com permissão para agendamento'
    );
    setSteps(
      'Acessar o sistema hospitalar | Tela inicial do sistema é exibida\n' +
      'Realizar login com usuário válido | Acesso ao sistema é concedido\n' +
      'Acessar módulo de agendamento de consultas | Tela de agendamento é apresentada\n' +
      'Selecionar o paciente | Dados do paciente são exibidos\n' +
      'Selecionar o médico | Agenda do médico é exibida\n' +
      'Escolher data e horário disponíveis | Horário é selecionado com sucesso\n' +
      'Confirmar o agendamento | Consulta é registrada no sistema\n' +
      'Visualizar confirmação | Mensagem de sucesso é exibida'
    );
    setPostconditions(
      'Consulta registrada no sistema\n' +
      'Horário bloqueado na agenda do médico\n' +
      'Histórico do paciente atualizado\n' +
      'Confirmação disponível para o usuário'
    );
  };

  const clearForm = () => {
    setTitle('');
    setPriority('Média');
    setTraceability('');
    setPreconditions('');
    setSteps('');
    setPostconditions('');
    setError('');
    setTab('pt');
    setSelectedId(null);
    setEditingId(null);
    setShowNewProject(false);
    setNewProjectName('');
  };

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    try {
      await fetch(`http://localhost:4000/test-cases/${id}`, { method: 'DELETE' });
    } catch {
      // ignora erro de rede, remove da UI de qualquer forma
    }
    setAllTestCases(prev => {
      const updated = prev.filter(tc => tc.id !== id);
      if (selectedId === id) setSelectedId(updated.length > 0 ? updated[updated.length - 1].id : null);
      return updated;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (id, event) => {
    event.stopPropagation();
    const entry = allTestCases.find(tc => tc.id === id);
    if (!entry) return;
    const pt = entry.pt;
    setTitle(pt.title || '');
    setPriority(pt.priority || 'Média');
    setTraceability(pt.traceability || '');
    setPreconditions((pt.preconditions || []).join('\n'));
    setSteps((pt.steps || []).map(s => `${s.acao} | ${s.resultadoEsperado}`).join('\n'));
    setPostconditions((pt.postconditions || []).join('\n'));
    setEditingId(id);
    setSelectedId(id);
    setTab('pt');
    setSelectedProject(entry.project || entry.pt?.project || '');
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      const updatedPt = {
        title,
        priority,
        traceability,
        project: selectedProject,
        preconditions: preconditions.split('\n').map(p => p.trim()).filter(Boolean),
        steps: steps.split('\n').map((line, i) => {
          const [acao, resultadoEsperado] = line.split('|').map(p => p.trim());
          return { passo: i + 1, acao: acao || '', resultadoEsperado: resultadoEsperado || '' };
        }).filter(s => s.acao),
        postconditions: postconditions.split('\n').map(p => p.trim()).filter(Boolean)
      };
      const response = await fetch(`http://localhost:4000/test-cases/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPt)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar');
      }
      const savedPt = await response.json();
      const [enCase, esCase] = await Promise.all([
        translateTestCaseAPI(savedPt, 'en'),
        translateTestCaseAPI(savedPt, 'es')
      ]);
      setAllTestCases(prev => prev.map(tc =>
        tc.id === editingId ? { id: editingId, pt: savedPt, en: enCase, es: esCase } : tc
      ));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      const res = await fetch('http://localhost:4000/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao criar projeto');
      setProjects(prev => [...prev, saved]);
      setSelectedProject(saved.name);
      setNewProjectName('');
      setShowNewProject(false);
    } catch (e) { setError(e.message); }
  };

  const handleRenameProject = async () => {
    const name = editingProjectName.trim();
    if (!name || !editingProjectId) return;
    setProjectError('');
    try {
      const res = await fetch(`http://localhost:4000/projects/${editingProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Erro ao renomear projeto');
      const oldName = projects.find(p => p.id === editingProjectId)?.name;
      setProjects(prev => prev.map(p => p.id === editingProjectId ? updated : p));
      setSelectedProject(updated.name);
      // Atualizar o nome do projeto nos casos de teste já carregados na UI
      if (oldName) {
        setAllTestCases(prev => prev.map(tc => {
          const proj = tc.project || tc.pt?.project;
          if (proj !== oldName) return tc;
          return {
            ...tc,
            project: updated.name,
            pt: { ...tc.pt, project: updated.name }
          };
        }));
      }
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (e) { setProjectError(e.message); }
  };

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Excluir o projeto "${proj.name}"? Os casos de teste vinculados não serão excluídos.`)) return;
    setProjectError('');
    try {
      await fetch(`http://localhost:4000/projects/${proj.id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== proj.id));
      if (selectedProject === proj.name) setSelectedProject('');
      if (projectFilter === proj.name) setProjectFilter('');
    } catch (e) { setProjectError(e.message); }
  };

  const hasSidebar = allTestCases.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0, margin: 0 }}>
      <div style={{ maxWidth: hasSidebar ? 1120 : 800, margin: '40px auto', fontFamily: 'sans-serif', display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 16px' }}>

        {/* Sidebar */}
        {hasSidebar && (
          <div style={{ width: 230, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 16, position: 'sticky', top: 24 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2', fontSize: 15, borderBottom: '1px solid #e3eafc', paddingBottom: 8 }}>
                Casos de Teste
              </h3>
              {/* Project filter */}
              <div style={{ marginBottom: 10 }}>
                <select
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #bbb', padding: '5px 8px', fontSize: 12, color: '#333' }}
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                >
                  <option value=''>Todos os projetos</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allTestCases.filter(tc => !projectFilter || (tc.project || tc.pt?.project) === projectFilter).map(tc => (
                  <li
                    key={tc.id}
                    onClick={() => setSelectedId(tc.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      marginBottom: 6,
                      cursor: 'pointer',
                      background: selectedId === tc.id ? '#e3eafc' : '#f6f8fa',
                      border: selectedId === tc.id ? '1.5px solid #1976d2' : '1px solid #ddd',
                      transition: 'background 0.15s, border 0.15s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 6
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: '#1976d2', fontSize: 12 }}>{tc.id}</span>
                      {(tc.project || tc.pt?.project) && (
                        <span style={{ display: 'block', color: '#888', fontSize: 10, marginTop: 1 }}>📁 {tc.project || tc.pt?.project}</span>
                      )}
                      <span style={{ display: 'block', color: '#333', fontSize: 12, marginTop: 2, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                        {tc.pt.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={(e) => handleEdit(tc.id, e)}
                        title="Editar"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          color: '#1976d2',
                          fontSize: 14,
                          lineHeight: 1,
                          flexShrink: 0,
                          borderRadius: 4
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDelete(tc.id, e)}
                        title="Excluir"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          color: '#d32f2f',
                          fontSize: 14,
                          lineHeight: 1,
                          flexShrink: 0,
                          borderRadius: 4
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ marginBottom: 0, marginTop: 0, color: '#1976d2' }}>Gerador de Casos de Teste</h1>
                <div style={{ color: '#555', marginTop: 10, fontSize: 18 }}>
                  Geração estruturada de casos de teste baseada na ISO-29119-3.
                </div>
                <div style={{ color: '#555', marginTop: 12, fontSize: 16 }}>
                  <b>Preencha os campos ou use o exemplo para experimentar.</b>
                </div>
              </div>
              <img src="/logoSmartTestMaker.jpeg" alt="SmartTest Marker Logo" height="110" style={{ marginLeft: 16, flexShrink: 0 }} />
            </div>
            <hr style={{ margin: '24px 0' }} />

            {tab === 'pt' ? (
              <>
                {/* Project selector */}
                <div style={{ marginBottom: 20, background: '#f0f4ff', border: '1px solid #e3eafc', borderRadius: 8, padding: 16 }}>
                  <label><b>Projeto</b></label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <select
                      style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                      value={selectedProject}
                      onChange={e => {
                        if (e.target.value === '__new__') { setShowNewProject(true); setEditingProjectId(null); }
                        else { setSelectedProject(e.target.value); setShowNewProject(false); setEditingProjectId(null); }
                      }}
                    >
                      <option value=''>-- Selecione um projeto --</option>
                      {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      <option value='__new__'>+ Criar novo projeto...</option>
                    </select>
                    {selectedProject && !showNewProject && (() => {
                      const proj = projects.find(p => p.name === selectedProject);
                      return proj ? (
                        <>
                          <button
                            title="Renomear projeto"
                            onClick={() => { setEditingProjectId(proj.id); setEditingProjectName(proj.name); setShowNewProject(false); }}
                            style={{ background: 'none', border: '1px solid #1976d2', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', color: '#1976d2', fontSize: 14 }}
                          >✏️</button>
                          <button
                            title="Excluir projeto"
                            onClick={() => handleDeleteProject(proj)}
                            style={{ background: 'none', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', color: '#d32f2f', fontSize: 14 }}
                          >🗑️</button>
                        </>
                      ) : null;
                    })()}
                  </div>
                  {editingProjectId && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                        value={editingProjectName}
                        onChange={e => { setEditingProjectName(e.target.value); setProjectError(''); }}
                        placeholder='Novo nome do projeto'
                        onKeyDown={e => e.key === 'Enter' && handleRenameProject()}
                      />
                      <button onClick={handleRenameProject} style={{ ...styles.primaryButton, padding: '8px 16px', fontSize: 14 }}>Salvar</button>
                      <button onClick={() => { setEditingProjectId(null); setEditingProjectName(''); setProjectError(''); }} style={{ ...styles.clearButton, padding: '8px 16px', fontSize: 14 }}>Cancelar</button>
                    </div>
                  )}
                  {projectError && (
                    <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 6, background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 6, padding: '6px 10px' }}>
                      {projectError}
                    </div>
                  )}
                  {showNewProject && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        style={{ ...styles.input, marginBottom: 0, flex: 1 }}
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder='Nome do novo projeto'
                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                      />
                      <button onClick={handleCreateProject} style={{ ...styles.primaryButton, padding: '8px 16px', fontSize: 14 }}>Criar</button>
                      <button onClick={() => { setShowNewProject(false); setNewProjectName(''); }} style={{ ...styles.clearButton, padding: '8px 16px', fontSize: 14 }}>Cancelar</button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label><b>Título do Teste</b></label>
                  <input style={styles.input} value={title} onChange={event => setTitle(event.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 0 }}>
                  <div style={{ width: 160 }}>
                    <label><b>Prioridade</b></label>
                    <select style={styles.input} value={priority} onChange={event => setPriority(event.target.value)}>
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label><b>Rastreabilidade</b></label>
                    <input style={styles.input} value={traceability} onChange={event => setTraceability(event.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <label><b>Pré-condições</b></label>
                    <textarea
                      style={styles.textarea}
                      rows={3}
                      placeholder="Uma por linha"
                      value={preconditions}
                      onChange={event => setPreconditions(event.target.value)}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 0, marginBottom: 0 }}>
                  <label><b>Passos (Ação | Resultado Esperado)</b></label>
                  <textarea
                    style={styles.textarea}
                    rows={6}
                    placeholder="Ação | Resultado Esperado, um por linha"
                    value={steps}
                    onChange={event => setSteps(event.target.value)}
                  />
                </div>
                <div style={{ marginTop: 0, marginBottom: 0 }}>
                  <label><b>Pós-condições</b></label>
                  <textarea
                    style={styles.textarea}
                    rows={3}
                    placeholder="Uma por linha"
                    value={postconditions}
                    onChange={event => setPostconditions(event.target.value)}
                  />
                </div>
              </>
            ) : (
              <TranslatedInputs
                title={title}
                priority={priority}
                traceability={traceability}
                preconditions={preconditions}
                steps={steps}
                postconditions={postconditions}
                targetLang={tab}
              />
            )}

            {editingId && (
              <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 6, padding: '8px 14px', marginTop: 16, fontSize: 13, color: '#795548' }}>
                ✏️ Editando caso de teste <b>{editingId}</b>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {editingId ? (
                <>
                  <button onClick={handleUpdate} disabled={loading || !title || !steps} style={styles.primaryButton}>
                    {loading ? 'Atualizando...' : 'Atualizar Caso de Teste'}
                  </button>
                  <button onClick={() => { setEditingId(null); clearForm(); }} style={styles.clearButton}>
                    Cancelar Edição
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleGenerate} disabled={loading || !title || !steps} style={styles.primaryButton}>
                    {loading ? 'Gerando...' : 'Gerar Caso de Teste'}
                  </button>
                  <button onClick={fillExample} style={styles.secondaryButton}>
                    Preencher Exemplo
                  </button>
                  <button onClick={clearForm} style={styles.clearButton}>
                    Limpar
                  </button>
                </>
              )}
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {selectedEntry && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ color: '#1976d2', margin: 0 }}>Caso de Teste Gerado</h2>
                  <ExportButton testCase={selectedEntry[tab] || selectedEntry.pt} language={tab} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setTab('pt')} style={tab === 'pt' ? styles.activeTabButton : styles.tabButton}>
                    Português
                  </button>
                  <button onClick={() => setTab('en')} style={tab === 'en' ? styles.activeTabButton : styles.tabButton}>
                    English
                  </button>
                  <button onClick={() => setTab('es')} style={tab === 'es' ? styles.activeTabButton : styles.tabButton}>
                    Español
                  </button>
                </div>

                {tab === 'pt' && <TestCaseCard testCase={selectedEntry.pt} language="pt" />}
                {tab === 'en' && selectedEntry.en && <TestCaseCard testCase={selectedEntry.en} language="en" />}
                {tab === 'es' && selectedEntry.es && <TestCaseCard testCase={selectedEntry.es} language="es" />}
              </div>
            )}
          </div>

          <footer style={{ textAlign: 'center', color: '#888', marginTop: 32, fontSize: 15 }}>
            <hr style={{ margin: '32px 0 12px 0' }} />
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => navigate('/')}
                style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 32px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                ← Voltar ao Menu Principal
              </button>
            </div>
            <div>
              <b>SmartTest Marker</b> - Projeto acadêmico para geração de documentos de teste estruturados.<br />
              Desenvolvido por Patricia da Silva Gomes baseado no material da Mentoria do Julio de Lima - {new Date().getFullYear()}
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}

const styles = {
  input: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 6,
    border: '1px solid #bbb',
    padding: 8
  },
  textarea: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 6,
    border: '1px solid #bbb',
    padding: 8
  },
  primaryButton: {
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer'
  },
  secondaryButton: {
    background: '#eee',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: 6,
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer'
  },
  clearButton: {
    background: '#f5f5f5',
    color: '#d32f2f',
    border: '1px solid #d32f2f',
    borderRadius: 6,
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer'
  },
  errorBox: {
    color: '#fff',
    background: '#d32f2f',
    borderRadius: 6,
    padding: 12,
    marginTop: 24
  },
  tabButton: {
    padding: '6px 18px',
    borderRadius: 6,
    border: '1px solid #bbb',
    background: '#fff',
    color: '#1976d2',
    fontWeight: 600,
    cursor: 'pointer'
  },
  activeTabButton: {
    padding: '6px 18px',
    borderRadius: 6,
    border: '2px solid #1976d2',
    background: '#e3eafc',
    color: '#1976d2',
    fontWeight: 600,
    cursor: 'pointer'
  },
  card: {
    background: '#f9f9f9',
    border: '1px solid #1976d2',
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    boxShadow: '0 1px 6px #0001'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff'
  },
  tableHeader: {
    border: '1px solid #1976d2',
    padding: 6
  },
  tableCell: {
    border: '1px solid #1976d2',
    padding: 6
  },
  tableCellCenter: {
    border: '1px solid #1976d2',
    textAlign: 'center',
    padding: 6
  }
};

export default App;
