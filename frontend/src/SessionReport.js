import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SESSION_SIZES = ['10 minutos', '20 minutos', '30 minutos', '45 minutos', '60 minutos', '90 minutos'];
const NOTE_TYPES = ['I', 'R'];

// ── Export helpers ──────────────────────────────────────────────────────────

function exportTXT(report) {
  const lines = [
    '====================================',
    '       RELATÓRIO DE SESSÃO DE TESTE',
    '====================================',
    `ID: ${report.id}`,
    `Data e Hora do Início: ${report.date}`,
    `Nome do Testador: ${report.tester}`,
    `Módulo: ${report.module}`,
    '',
    '── TEST CHARTER ──────────────────────',
    ...(report.charter.text || '').split('\n').map(l => l),
    '',
    `Tamanho da Sessão: ${report.sessionSize}`,
    '',
    '── NOTAS ─────────────────────────────',
    ...(report.notes || []).map(n => `(${n.type}) ${n.text}`),
    '',
    '── DEFEITOS ──────────────────────────',
    ...(report.defects || []).map((d, i) => `${i + 1}. ${d}`),
    '',
    '── PERGUNTAS ─────────────────────────',
    ...(report.questions || []).map((q, i) => `${i + 1}. ${q}`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-sessao-${report.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(report) {
  const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const rows = [
    ['ID', 'Data/Hora', 'Testador', 'Módulo', 'Test Charter', 'Tamanho', 'Tipo Nota', 'Nota', 'Defeito', 'Pergunta'].map(escape),
    ...(report.notes || [{ type: '', text: '' }]).map((n, i) => [
      escape(report.id),
      escape(report.date),
      escape(report.tester),
      escape(report.module),
      escape(i === 0 ? report.charter.text : ''),
      escape(report.sessionSize),
      escape(n.type),
      escape(n.text),
      escape((report.defects || [])[i] || ''),
      escape((report.questions || [])[i] || ''),
    ]),
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-sessao-${report.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(report) {
  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;
  const blue = [25, 118, 210];
  const lightBlue = [227, 234, 252];
  const textDark = [33, 33, 33];

  let y = 14;

  // Header bar
  doc.setFillColor(...blue);
  doc.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('SmartTest Marker — Relatório de Sessão', margin + 4, y + 9.5);
  y += 20;

  const fieldRow = (label, value) => {
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...blue);
    doc.text(`${label}:`, margin + 3, y);
    const lw = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...textDark);
    const wrapped = doc.splitTextToSize(String(value || ''), contentW - lw - 6);
    doc.text(wrapped, margin + 3 + lw, y);
    y += 6 * wrapped.length + 2;
  };

  const sectionTitle = text => {
    if (y > 260) { doc.addPage(); y = 14; }
    y += 2;
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin + 1, y - 4, contentW - 2, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...blue);
    doc.text(text, margin + 4, y + 0.5);
    y += 7;
  };

  const bulletList = items => {
    items.forEach(item => {
      if (y > 262) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...textDark);
      doc.setFillColor(...blue);
      doc.circle(margin + 5, y - 1.2, 1, 'F');
      const wrapped = doc.splitTextToSize(String(item), contentW - 12);
      doc.text(wrapped, margin + 9, y);
      y += 5.5 * wrapped.length;
    });
    y += 2;
  };

  // Header fields
  fieldRow('ID', report.id);
  fieldRow('Data e Hora do Início', report.date);
  fieldRow('Nome do Testador', report.tester);
  fieldRow('Módulo', report.module);
  y += 2;

  // Charter
  sectionTitle('Test Charter');
  if (y > 260) { doc.addPage(); y = 14; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...textDark);
  const charterLines = doc.splitTextToSize(String(report.charter.text || ''), contentW - 6);
  doc.text(charterLines, margin + 3, y);
  y += 5.5 * charterLines.length + 4;

  fieldRow('Tamanho da Sessão', report.sessionSize);
  y += 2;

  // Notes
  sectionTitle('Notas');
  if (report.notes && report.notes.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tipo', 'Nota']],
      body: report.notes.map(n => [`(${n.type})`, n.text]),
      headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 10, textColor: textDark },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: { 0: { halign: 'center', cellWidth: 18 } },
      theme: 'grid',
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Defects
  sectionTitle('Defeitos');
  bulletList(report.defects || []);

  // Questions
  sectionTitle('Perguntas');
  bulletList(report.questions || []);

  doc.save(`relatorio-sessao-${report.id}.pdf`);
}

// ── Export dropdown button ──────────────────────────────────────────────────
function ExportButton({ report }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = e => { if (!e.target.closest('#export-dd')) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div id="export-dd" style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={btnStyles.export}>⬇ Exportar</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px #0002', zIndex: 100, minWidth: 130 }}>
          {[['PDF', () => exportPDF(report)], ['TXT', () => exportTXT(report)], ['CSV', () => exportCSV(report)]].map(([label, fn]) => (
            <button key={label} onClick={() => { fn(); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '10px 18px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#333' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Report card (read-only display) ────────────────────────────────────────
function ReportCard({ report }) {
  return (
    <div style={cardStyle}>
      <div style={rowStyle}><b>ID:</b> {report.id}</div>
      <div style={rowStyle}><b>Data e Hora do Início:</b> {report.date}</div>
      <div style={rowStyle}><b>Nome do Testador:</b> {report.tester}</div>
      <div style={rowStyle}><b>Módulo:</b> {report.module}</div>

      <div style={sectionTitleStyle}>Test Charter</div>
      <div style={{ ...rowStyle, whiteSpace: 'pre-line' }}>{report.charter.text}</div>

      <div style={sectionTitleStyle}>Tamanho da Sessão</div>
      <div style={rowStyle}>{report.sessionSize}</div>

      <div style={sectionTitleStyle}>Notas</div>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#e3eafc' }}>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Nota</th>
          </tr>
        </thead>
        <tbody>
          {(report.notes || []).map((n, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, width: 60 }}>({n.type})</td>
              <td style={tdStyle}>{n.text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={sectionTitleStyle}>Defeitos</div>
      <ul>{(report.defects || []).map((d, i) => <li key={i}>{d}</li>)}</ul>

      <div style={sectionTitleStyle}>Perguntas</div>
      <ul>{(report.questions || []).map((q, i) => <li key={i}>{q}</li>)}</ul>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function SessionReport() {
  const navigate = useNavigate();

  // form state
  const [date, setDate] = useState('');
  const [tester, setTester] = useState('');
  const [module, setModule] = useState('');
  const [charterText, setCharterText] = useState('');
  const [sessionSize, setSessionSize] = useState('10 minutos');
  const [notes, setNotes] = useState([{ type: 'I', text: '' }]);
  const [defects, setDefects] = useState(['']);
  const [questions, setQuestions] = useState(['']);

  // app state
  const [allReports, setAllReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // projects
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [projectError, setProjectError] = useState('');

  const selectedReport = allReports.find(r => r.id === selectedId) || null;

  // Load saved reports
  useEffect(() => {
    fetch('http://localhost:4000/projects')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('http://localhost:4000/session-reports')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllReports(data);
          setSelectedId(data[data.length - 1].id);
        }
      })
      .catch(() => {});
  }, []);

  const buildPayload = () => ({
    date,
    tester,
    module,
    project: selectedProject,
    charter: { text: charterText },
    sessionSize,
    notes: notes.filter(n => n.text.trim()),
    defects: defects.filter(d => d.trim()),
    questions: questions.filter(q => q.trim()),
  });

  const clearForm = () => {
    setDate(''); setTester(''); setModule('');
    setCharterText('');
    setSessionSize('10 minutos');
    setNotes([{ type: 'I', text: '' }]);
    setDefects(['']);
    setQuestions(['']);
    setError(''); setEditingId(null); setSelectedId(null);
    setShowNewProject(false); setNewProjectName(''); setEditingProjectId(null); setEditingProjectName(''); setProjectError('');
  };

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:4000/session-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao salvar');
      setAllReports(prev => [...prev, saved]);
      setSelectedId(saved.id);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`http://localhost:4000/session-reports/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao atualizar');
      setAllReports(prev => prev.map(r => r.id === editingId ? saved : r));
      setEditingId(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try { await fetch(`http://localhost:4000/session-reports/${id}`, { method: 'DELETE' }); } catch {}
    setAllReports(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (selectedId === id) setSelectedId(updated.length > 0 ? updated[updated.length - 1].id : null);
      return updated;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (id, e) => {
    e.stopPropagation();
    const r = allReports.find(rep => rep.id === id);
    if (!r) return;
    setDate(r.date || '');
    setTester(r.tester || '');
    setModule(r.module || '');
    setCharterText(r.charter?.text || '');
    setSessionSize(r.sessionSize || '10 minutos');
    setNotes(r.notes?.length ? r.notes : [{ type: 'I', text: '' }]);
    setDefects(r.defects?.length ? r.defects : ['']);
    setQuestions(r.questions?.length ? r.questions : ['']);
    setEditingId(id);
    setSelectedId(id);
    setSelectedProject(r.project || '');
  };

  const fillExample = () => {
    if (!selectedProject) setSelectedProject('Sistema Hospitalar');
    setDate('2026-03-20T10:20');
    setTester('Maria Gomes');
    setModule('Agendamento de Consultas');
    setCharterText(
      'Explore a funcionalidade de agendamento de consultas\n' +
      'Com a heurística de testes focada em validação de regras de negócio e comportamento inesperado\n' +
      'Para descobrir se o sistema lida corretamente com situações inválidas ou inconsistentes no agendamento'
    );
    setSessionSize('30 minutos');
    setNotes([
      { type: 'I', text: 'Consegui agendar uma consulta para o mesmo paciente no mesmo horário com o mesmo médico' },
      { type: 'I', text: 'O sistema não apresentou nenhuma validação de conflito de agenda' },
      { type: 'I', text: 'Tentei agendar uma consulta com data no passado e o sistema permitiu' },
      { type: 'R', text: 'Se múltiplas consultas forem agendadas no mesmo horário, pode gerar conflitos graves no atendimento' },
      { type: 'R', text: 'Permitir agendamento em datas passadas pode comprometer relatórios e histórico médico' },
    ]);
    setDefects([
      'O sistema permite agendamento duplicado para o mesmo horário e médico',
      'É possível agendar consultas em datas passadas',
      'Falta validação de conflito de agenda',
      'Feedback visual de sucesso é pouco claro ou inexistente',
      'Não há bloqueio para horários fora da agenda do médico',
    ]);
    setQuestions([
      'O sistema deveria permitir múltiplos agendamentos no mesmo horário para o mesmo médico?',
      'Existe alguma regra para limite de consultas por paciente por dia?',
      'Como o sistema deve se comportar em casos de conflito de agenda?',
    ]);
  };

  // Dynamic list helpers
  const updateNote = (i, field, val) => setNotes(prev => prev.map((n, idx) => idx === i ? { ...n, [field]: val } : n));
  const addNote = () => setNotes(prev => [...prev, { type: 'I', text: '' }]);
  const removeNote = i => setNotes(prev => prev.filter((_, idx) => idx !== i));

  const updateList = (setter) => (i, val) => setter(prev => prev.map((v, idx) => idx === i ? val : v));
  const addToList = (setter) => () => setter(prev => [...prev, '']);
  const removeFromList = (setter) => (i) => setter(prev => prev.filter((_, idx) => idx !== i));

  const hasSidebar = allReports.length > 0;
  const canSave = tester && module && charterText;

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    setProjectError('');
    try {
      const res = await fetch('http://localhost:4000/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao criar projeto');
      setProjects(prev => [...prev, saved]);
      setSelectedProject(saved.name);
      setNewProjectName(''); setShowNewProject(false);
    } catch (e) { setProjectError(e.message); }
  };

  const handleRenameProject = async () => {
    const name = editingProjectName.trim();
    if (!name || !editingProjectId) return;
    setProjectError('');
    try {
      const res = await fetch(`http://localhost:4000/projects/${editingProjectId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Erro ao renomear projeto');
      const oldName = projects.find(p => p.id === editingProjectId)?.name;
      setProjects(prev => prev.map(p => p.id === editingProjectId ? updated : p));
      setSelectedProject(updated.name);
      if (oldName) setAllReports(prev => prev.map(r => r.project === oldName ? { ...r, project: updated.name } : r));
      setEditingProjectId(null); setEditingProjectName('');
    } catch (e) { setProjectError(e.message); }
  };

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Excluir o projeto "${proj.name}"? Os relatórios vinculados não serão excluídos.`)) return;
    setProjectError('');
    try {
      await fetch(`http://localhost:4000/projects/${proj.id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== proj.id));
      if (selectedProject === proj.name) setSelectedProject('');
      if (projectFilter === proj.name) setProjectFilter('');
    } catch (e) { setProjectError(e.message); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fa', padding: 0, margin: 0 }}>
      <div style={{ maxWidth: hasSidebar ? 1120 : 800, margin: '40px auto', fontFamily: 'sans-serif', display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 16px' }}>

        {/* Sidebar */}
        {hasSidebar && (
          <div style={{ width: 230, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 16, position: 'sticky', top: 24 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2', fontSize: 15, borderBottom: '1px solid #e3eafc', paddingBottom: 8 }}>Relatórios de Sessão</h3>
              {/* Project filter */}
              <div style={{ marginBottom: 10 }}>
                <select style={{ width: '100%', borderRadius: 6, border: '1px solid #bbb', padding: '5px 8px', fontSize: 12, color: '#333' }}
                  value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                  <option value=''>Todos os projetos</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allReports.filter(r => !projectFilter || r.project === projectFilter).map(r => (
                  <li key={r.id} onClick={() => setSelectedId(r.id)}
                    style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 6, cursor: 'pointer', background: selectedId === r.id ? '#e3eafc' : '#f6f8fa', border: selectedId === r.id ? '1.5px solid #1976d2' : '1px solid #ddd', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: '#1976d2', fontSize: 12 }}>{r.id}</span>
                      {r.project && <span style={{ display: 'block', color: '#888', fontSize: 10, marginTop: 1 }}>📁 {r.project}</span>}
                      <span style={{ display: 'block', color: '#333', fontSize: 12, marginTop: 2, wordBreak: 'break-word' }}>{r.module}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={(e) => handleEdit(r.id, e)} title="Editar" style={btnStyles.icon}>✏️</button>
                      <button onClick={(e) => handleDelete(r.id, e)} title="Excluir" style={{ ...btnStyles.icon, color: '#d32f2f' }}>🗑️</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 32, marginBottom: 24 }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <h1 style={{ margin: 0, color: '#1976d2' }}>Gerador de Relatório de Sessão</h1>
                <div style={{ color: '#555', marginTop: 8, fontSize: 16 }}>
                  Inspirado no artigo de John Bach sobre Session-Based Test Management (2001)
                </div>
              </div>
              <img src="/logoSmartTestMaker.jpeg" alt="Logo" height="100" style={{ marginLeft: 16, flexShrink: 0 }} />
            </div>
            <hr style={{ margin: '20px 0' }} />

            {/* ── Form ── */}
            {/* Project selector */}
            <div style={{ marginBottom: 20, background: '#f0f4ff', border: '1px solid #e3eafc', borderRadius: 8, padding: 16 }}>
              <label><b>Projeto</b></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <select style={{ flex: 1, borderRadius: 6, border: '1px solid #bbb', padding: '8px', fontSize: 14 }}
                  value={selectedProject}
                  onChange={e => {
                    if (e.target.value === '__new__') { setShowNewProject(true); setEditingProjectId(null); }
                    else { setSelectedProject(e.target.value); setShowNewProject(false); setEditingProjectId(null); }
                  }}>
                  <option value=''>-- Selecione um projeto --</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  <option value='__new__'>+ Criar novo projeto...</option>
                </select>
                {selectedProject && !showNewProject && (() => {
                  const proj = projects.find(p => p.name === selectedProject);
                  return proj ? (
                    <>
                      <button title="Renomear projeto" onClick={() => { setEditingProjectId(proj.id); setEditingProjectName(proj.name); setShowNewProject(false); }}
                        style={{ background: 'none', border: '1px solid #1976d2', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', color: '#1976d2', fontSize: 14 }}>✏️</button>
                      <button title="Excluir projeto" onClick={() => handleDeleteProject(proj)}
                        style={{ background: 'none', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer', padding: '6px 8px', color: '#d32f2f', fontSize: 14 }}>🗑️</button>
                    </>
                  ) : null;
                })()}
              </div>
              {editingProjectId && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input style={{ flex: 1, borderRadius: 6, border: '1px solid #bbb', padding: 8, fontSize: 14 }}
                    value={editingProjectName} onChange={e => { setEditingProjectName(e.target.value); setProjectError(''); }}
                    placeholder='Novo nome do projeto' onKeyDown={e => e.key === 'Enter' && handleRenameProject()} />
                  <button onClick={handleRenameProject} style={actionBtnStyle('#1976d2')}>Salvar</button>
                  <button onClick={() => { setEditingProjectId(null); setEditingProjectName(''); setProjectError(''); }} style={actionBtnStyle('#d32f2f')}>Cancelar</button>
                </div>
              )}
              {showNewProject && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input style={{ flex: 1, borderRadius: 6, border: '1px solid #bbb', padding: 8, fontSize: 14 }}
                    value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                    placeholder='Nome do novo projeto' onKeyDown={e => e.key === 'Enter' && handleCreateProject()} />
                  <button onClick={handleCreateProject} style={actionBtnStyle('#1976d2')}>Criar</button>
                  <button onClick={() => { setShowNewProject(false); setNewProjectName(''); }} style={actionBtnStyle('#d32f2f')}>Cancelar</button>
                </div>
              )}
              {projectError && <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 6, background: '#fff3f3', border: '1px solid #f5c6c6', borderRadius: 6, padding: '6px 10px' }}>{projectError}</div>}
            </div>

            {/* Header info */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label><b>Data e Hora do Início</b></label>
                <input type="datetime-local" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label><b>Nome do Testador</b></label>
                <input style={inputStyle} value={tester} onChange={e => setTester(e.target.value)} placeholder="Ex: Maria Gomes" />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label><b>Módulo</b></label>
                <input style={inputStyle} value={module} onChange={e => setModule(e.target.value)} placeholder="Ex: Transferências" />
              </div>
            </div>

            {/* Charter */}
            <div style={sectionBoxStyle}>
              <div style={sectionLabelStyle}>Test Charter</div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
                Formato sugerido:<br />
                <code>Explore &lt;Alvo&gt;</code><br />
                <code>Com &lt;Recursos&gt;</code><br />
                <code>Para descobrir &lt;Informação&gt;</code>
              </div>
              <textarea
                style={{ ...textareaStyle, fontFamily: 'inherit' }}
                rows={4}
                value={charterText}
                onChange={e => setCharterText(e.target.value)}
                placeholder=""
              />
            </div>

            {/* Session size */}
            <div style={{ marginBottom: 20 }}>
              <label><b>Tamanho da Sessão</b></label>
              <select style={inputStyle} value={sessionSize} onChange={e => setSessionSize(e.target.value)}>
                {SESSION_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div style={sectionBoxStyle}>
              <div style={sectionLabelStyle}>Notas <span style={{ fontSize: 12, fontWeight: 400, color: '#666' }}>(I = Informação &nbsp;|&nbsp; R = Risco)</span></div>
              {notes.map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <select value={n.type} onChange={e => updateNote(i, 'type', e.target.value)}
                    style={{ ...inputStyle, width: 70, marginBottom: 0, flexShrink: 0 }}>
                    {NOTE_TYPES.map(t => <option key={t} value={t}>({t})</option>)}
                  </select>
                  <textarea
                    style={{ ...textareaStyle, flex: 1, marginBottom: 0 }}
                    rows={2}
                    value={n.text}
                    onChange={e => updateNote(i, 'text', e.target.value)}
                    placeholder="Descreva a nota..."
                  />
                  {notes.length > 1 && (
                    <button onClick={() => removeNote(i)} style={btnStyles.remove}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addNote} style={btnStyles.addItem}>+ Adicionar Nota</button>
            </div>

            {/* Defects */}
            <div style={sectionBoxStyle}>
              <div style={sectionLabelStyle}>Defeitos</div>
              {defects.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <textarea
                    style={{ ...textareaStyle, flex: 1, marginBottom: 0 }}
                    rows={2}
                    value={d}
                    onChange={e => updateList(setDefects)(i, e.target.value)}
                    placeholder="Descreva o defeito..."
                  />
                  {defects.length > 1 && (
                    <button onClick={() => removeFromList(setDefects)(i)} style={btnStyles.remove}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addToList(setDefects)} style={btnStyles.addItem}>+ Adicionar Defeito</button>
            </div>

            {/* Questions */}
            <div style={sectionBoxStyle}>
              <div style={sectionLabelStyle}>Perguntas</div>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                    value={q}
                    onChange={e => updateList(setQuestions)(i, e.target.value)}
                    placeholder="Digite a pergunta..."
                  />
                  {questions.length > 1 && (
                    <button onClick={() => removeFromList(setQuestions)(i)} style={btnStyles.remove}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={addToList(setQuestions)} style={btnStyles.addItem}>+ Adicionar Pergunta</button>
            </div>

            {editingId && (
              <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 6, padding: '8px 14px', marginTop: 16, fontSize: 13, color: '#795548' }}>
                ✏️ Editando relatório <b>{editingId}</b>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
              {editingId ? (
                <>
                  <button onClick={handleUpdate} disabled={loading || !canSave} style={btnStyles.primary}>
                    {loading ? 'Atualizando...' : 'Atualizar Relatório'}
                  </button>
                  <button onClick={() => { setEditingId(null); clearForm(); }} style={btnStyles.clear}>Cancelar Edição</button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={loading || !canSave} style={btnStyles.primary}>
                    {loading ? 'Salvando...' : 'Gerar Relatório'}
                  </button>
                  <button onClick={fillExample} style={btnStyles.secondary}>Preencher Exemplo</button>
                  <button onClick={clearForm} style={btnStyles.clear}>Limpar</button>
                </>
              )}
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {/* Report display */}
            {selectedReport && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ color: '#1976d2', margin: 0 }}>Relatório de Sessão Gerado</h2>
                  <ExportButton report={selectedReport} />
                </div>
                <ReportCard report={selectedReport} />
              </div>
            )}
          </div>

          <footer style={{ textAlign: 'center', color: '#888', marginTop: 32, fontSize: 15 }}>
            <hr style={{ margin: '32px 0 12px 0' }} />
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => navigate('/')} style={btnStyles.primary}>← Voltar ao Menu Principal</button>
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

// ── Styles ──────────────────────────────────────────────────────────────────
const inputStyle = { width: '100%', marginBottom: 8, borderRadius: 6, border: '1px solid #bbb', padding: 8, boxSizing: 'border-box' };
const textareaStyle = { width: '100%', marginBottom: 8, borderRadius: 6, border: '1px solid #bbb', padding: 8, boxSizing: 'border-box' };
const sectionBoxStyle = { background: '#f6f8fa', border: '1px solid #e3eafc', borderRadius: 8, padding: 16, marginBottom: 20 };
const sectionLabelStyle = { fontWeight: 700, color: '#1976d2', fontSize: 15, marginBottom: 12 };
const sectionTitleStyle = { fontWeight: 700, color: '#1976d2', fontSize: 14, marginTop: 14, marginBottom: 6, borderBottom: '1px solid #e3eafc', paddingBottom: 4 };
const rowStyle = { marginBottom: 8 };
const cardStyle = { background: '#f9f9f9', border: '1px solid #1976d2', borderRadius: 8, padding: 18, boxShadow: '0 1px 6px #0001' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', background: '#fff' };
const thStyle = { border: '1px solid #1976d2', padding: 6, fontWeight: 700 };
const tdStyle = { border: '1px solid #1976d2', padding: 6 };
const errorStyle = { color: '#fff', background: '#d32f2f', borderRadius: 6, padding: 12, marginTop: 16 };

const btnStyles = {
  primary: { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  secondary: { background: '#eee', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  clear: { background: '#f5f5f5', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  export: { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  addItem: { background: 'none', color: '#1976d2', border: '1px dashed #1976d2', borderRadius: 6, padding: '5px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 4 },
  remove: { background: 'none', border: 'none', color: '#d32f2f', fontWeight: 700, fontSize: 16, cursor: 'pointer', flexShrink: 0, padding: '4px 6px' },
  icon: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#1976d2', fontSize: 14, lineHeight: 1, flexShrink: 0, borderRadius: 4 },
};

const actionBtnStyle = (color) => ({
  background: color, color: '#fff', border: 'none', borderRadius: 6,
  padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
});
