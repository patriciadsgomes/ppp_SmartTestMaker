import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRIORITY_OPTIONS = ['Alta', 'Média', 'Baixa'];

// ── Export helpers ──────────────────────────────────────────────────────────

function exportTXT(doc) {
  const lines = [
    '====================================',
    '       CONDIÇÕES DE TESTE',
    '====================================',
    `ID: ${doc.id}`,
    `Requisitos Testados: ${doc.requirements}`,
    '',
    'ID  | Condição de Teste                                    | Prioridade',
    '----+------------------------------------------------------+-----------',
    ...(doc.conditions || []).map(c =>
      `${String(c.condId).padEnd(4)}| ${String(c.description).padEnd(53)}| ${c.priority}`
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `condicoes-teste-${doc.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(doc) {
  const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const rows = [
    ['Documento ID', 'Requisitos Testados', 'ID Condição', 'Condição de Teste', 'Prioridade'].map(escape),
    ...(doc.conditions || []).map(c => [
      escape(doc.id),
      escape(doc.requirements),
      escape(c.condId),
      escape(c.description),
      escape(c.priority),
    ]),
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `condicoes-teste-${doc.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(doc) {
  const pdf = new jsPDF();
  const margin = 14;
  const pageW = pdf.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;
  const blue = [25, 118, 210];
  const lightBlue = [227, 234, 252];
  const textDark = [33, 33, 33];

  let y = 14;

  // Header bar
  pdf.setFillColor(...blue);
  pdf.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text('SmartTest Marker — Condições de Teste', margin + 4, y + 9.5);
  y += 20;

  const fieldRow = (label, value) => {
    if (y > 260) { pdf.addPage(); y = 14; }
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...blue);
    pdf.text(`${label}:`, margin + 3, y);
    const lw = pdf.getTextWidth(`${label}: `);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...textDark);
    const wrapped = pdf.splitTextToSize(String(value || ''), contentW - lw - 6);
    pdf.text(wrapped, margin + 3 + lw, y);
    y += 6 * wrapped.length + 2;
  };

  const sectionTitle = text => {
    if (y > 260) { pdf.addPage(); y = 14; }
    y += 2;
    pdf.setFillColor(...lightBlue);
    pdf.roundedRect(margin + 1, y - 4, contentW - 2, 8, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...blue);
    pdf.text(text, margin + 4, y + 0.5);
    y += 7;
  };

  fieldRow('ID', doc.id);
  fieldRow('Requisitos Testados', doc.requirements);
  y += 2;

  sectionTitle('Condições de Teste');
  autoTable(pdf, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['ID', 'Condição de Teste', 'Prioridade']],
    body: (doc.conditions || []).map(c => [c.condId, c.description, c.priority]),
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: textDark },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: { 0: { halign: 'center', cellWidth: 16 }, 2: { halign: 'center', cellWidth: 28 } },
    theme: 'grid',
  });

  pdf.save(`condicoes-teste-${doc.id}.pdf`);
}

// ── Export dropdown ─────────────────────────────────────────────────────────
function ExportButton({ doc }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={btnStyles.export}>⬇ Exportar</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px #0002', zIndex: 100, minWidth: 130 }}>
          {[['PDF', () => exportPDF(doc)], ['TXT', () => exportTXT(doc)], ['CSV', () => exportCSV(doc)]].map(([label, fn]) => (
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

// ── Document card ───────────────────────────────────────────────────────────
function ConditionsCard({ doc }) {
  return (
    <div style={cardStyle}>
      <div style={rowStyle}><b>ID:</b> {doc.id}</div>
      <div style={rowStyle}><b>Requisitos Testados:</b> {doc.requirements}</div>
      <div style={sectionTitleStyle}>Condições de Teste</div>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#e3eafc' }}>
            <th style={{ ...thStyle, width: 50, textAlign: 'center' }}>ID</th>
            <th style={thStyle}>Condição de Teste</th>
            <th style={{ ...thStyle, width: 100, textAlign: 'center' }}>Prioridade</th>
          </tr>
        </thead>
        <tbody>
          {(doc.conditions || []).map((c, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{c.condId}</td>
              <td style={tdStyle}>{c.description}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{c.priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function TestConditions() {
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState('');
  const [conditions, setConditions] = useState([{ condId: 1, description: '', priority: 'Alta' }]);

  const [allDocs, setAllDocs] = useState([]);
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

  const selectedDoc = allDocs.find(d => d.id === selectedId) || null;

  useEffect(() => {
    fetch('http://localhost:4000/projects')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('http://localhost:4000/test-conditions')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllDocs(data);
          setSelectedId(data[data.length - 1].id);
        }
      })
      .catch(() => {});
  }, []);

  const buildPayload = () => ({
    requirements,
    project: selectedProject,
    conditions: conditions.filter(c => c.description.trim()),
  });

  const clearForm = () => {
    setRequirements('');
    setConditions([{ condId: 1, description: '', priority: 'Alta' }]);
    setError(''); setEditingId(null); setSelectedId(null);
    setShowNewProject(false); setNewProjectName(''); setEditingProjectId(null); setEditingProjectName(''); setProjectError('');
  };

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:4000/test-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao salvar');
      setAllDocs(prev => [...prev, saved]);
      setSelectedId(saved.id);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`http://localhost:4000/test-conditions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || 'Erro ao atualizar');
      setAllDocs(prev => prev.map(d => d.id === editingId ? saved : d));
      setEditingId(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try { await fetch(`http://localhost:4000/test-conditions/${id}`, { method: 'DELETE' }); } catch {}
    setAllDocs(prev => {
      const updated = prev.filter(d => d.id !== id);
      if (selectedId === id) setSelectedId(updated.length > 0 ? updated[updated.length - 1].id : null);
      return updated;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (id, e) => {
    e.stopPropagation();
    const d = allDocs.find(doc => doc.id === id);
    if (!d) return;
    setRequirements(d.requirements || '');
    setConditions(d.conditions?.length ? d.conditions : [{ condId: 1, description: '', priority: 'Alta' }]);
    setEditingId(id);
    setSelectedId(id);
    setSelectedProject(d.project || '');
  };

  const fillExample = () => {
    if (!selectedProject) setSelectedProject('Sistema Hospitalar');
    setRequirements('RN5 (Agendamento de consultas)');
    setConditions([
      { condId: 1, description: 'Validação de disponibilidade de horário na agenda do médico', priority: 'Alta' },
      { condId: 2, description: 'Permitir ou bloquear agendamentos em datas passadas', priority: 'Alta' },
      { condId: 3, description: 'Validação de preenchimento obrigatório dos dados do paciente', priority: 'Média' },
      { condId: 4, description: 'Validação de seleção de médico ativo no sistema', priority: 'Média' },
      { condId: 5, description: 'Testar agendamento com dados inválidos (ex: paciente inexistente)', priority: 'Baixa' },
      { condId: 6, description: 'Testar comportamento do sistema em falha de confirmação do agendamento', priority: 'Baixa' },
    ]);
  };

  const addCondition = () => {
    setConditions(prev => [...prev, { condId: prev.length + 1, description: '', priority: 'Alta' }]);
  };

  const updateCondition = (i, field, val) => {
    setConditions(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  };

  const removeCondition = (i) => {
    setConditions(prev => {
      const updated = prev.filter((_, idx) => idx !== i);
      return updated.map((c, idx) => ({ ...c, condId: idx + 1 }));
    });
  };

  const hasSidebar = allDocs.length > 0;
  const canSave = requirements && conditions.some(c => c.description.trim());

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
      if (oldName) setAllDocs(prev => prev.map(d => d.project === oldName ? { ...d, project: updated.name } : d));
      setEditingProjectId(null); setEditingProjectName('');
    } catch (e) { setProjectError(e.message); }
  };

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Excluir o projeto "${proj.name}"? Os documentos vinculados não serão excluídos.`)) return;
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
              <h3 style={{ margin: '0 0 12px 0', color: '#1976d2', fontSize: 15, borderBottom: '1px solid #e3eafc', paddingBottom: 8 }}>Condições de Teste</h3>
              {/* Project filter */}
              <div style={{ marginBottom: 10 }}>
                <select style={{ width: '100%', borderRadius: 6, border: '1px solid #bbb', padding: '5px 8px', fontSize: 12, color: '#333' }}
                  value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                  <option value=''>Todos os projetos</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {allDocs.filter(d => !projectFilter || d.project === projectFilter).map(d => (
                  <li key={d.id} onClick={() => setSelectedId(d.id)}
                    style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 6, cursor: 'pointer', background: selectedId === d.id ? '#e3eafc' : '#f6f8fa', border: selectedId === d.id ? '1.5px solid #1976d2' : '1px solid #ddd', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: '#1976d2', fontSize: 12 }}>{d.id}</span>
                      {d.project && <span style={{ display: 'block', color: '#888', fontSize: 10, marginTop: 1 }}>📁 {d.project}</span>}
                      <span style={{ display: 'block', color: '#333', fontSize: 12, marginTop: 2, wordBreak: 'break-word' }}>{d.requirements}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={(e) => handleEdit(d.id, e)} title="Editar" style={btnStyles.icon}>✏️</button>
                      <button onClick={(e) => handleDelete(d.id, e)} title="Excluir" style={{ ...btnStyles.icon, color: '#d32f2f' }}>🗑️</button>
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
                <h1 style={{ margin: 0, color: '#1976d2' }}>Gerador de Condições de Teste</h1>
                <div style={{ color: '#555', marginTop: 8, fontSize: 16 }}>
                  Geração estruturada de Condições de Teste na ISO-29119-3.
                </div>
              </div>
              <img src="/logoSmartTestMaker.jpeg" alt="Logo" height="100" style={{ marginLeft: 16, flexShrink: 0 }} />
            </div>
            <hr style={{ margin: '20px 0' }} />

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

            {/* Requirements */}
            <div style={{ marginBottom: 20 }}>
              <label><b>Requisitos Testados</b></label>
              <input
                style={inputStyle}
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
                placeholder="Ex: RN2"
              />
            </div>

            {/* Conditions table */}
            <div style={sectionBoxStyle}>
              <div style={sectionLabelStyle}>Condições de Teste</div>
              <table style={{ ...tableStyle, marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#e3eafc' }}>
                    <th style={{ ...thStyle, width: 50, textAlign: 'center' }}>ID</th>
                    <th style={thStyle}>Condição de Teste</th>
                    <th style={{ ...thStyle, width: 120, textAlign: 'center' }}>Prioridade</th>
                    <th style={{ ...thStyle, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {conditions.map((c, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#1976d2' }}>{c.condId}</td>
                      <td style={tdStyle}>
                        <textarea
                          style={{ ...textareaStyle, marginBottom: 0, minHeight: 38 }}
                          rows={2}
                          value={c.description}
                          onChange={e => updateCondition(i, 'description', e.target.value)}
                          placeholder="Descreva a condição de teste..."
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <select
                          style={{ ...inputStyle, marginBottom: 0, width: '100%' }}
                          value={c.priority}
                          onChange={e => updateCondition(i, 'priority', e.target.value)}
                        >
                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {conditions.length > 1 && (
                          <button onClick={() => removeCondition(i)} style={btnStyles.remove}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addCondition} style={btnStyles.addItem}>+ Adicionar Condição</button>
            </div>

            {editingId && (
              <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#795548' }}>
                ✏️ Editando <b>{editingId}</b>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {editingId ? (
                <>
                  <button onClick={handleUpdate} disabled={loading || !canSave} style={btnStyles.primary}>
                    {loading ? 'Atualizando...' : 'Atualizar Condições'}
                  </button>
                  <button onClick={() => { setEditingId(null); clearForm(); }} style={btnStyles.clear}>Cancelar Edição</button>
                </>
              ) : (
                <>
                  <button onClick={handleSave} disabled={loading || !canSave} style={btnStyles.primary}>
                    {loading ? 'Salvando...' : 'Gerar Condições de Teste'}
                  </button>
                  <button onClick={fillExample} style={btnStyles.secondary}>Preencher Exemplo</button>
                  <button onClick={clearForm} style={btnStyles.clear}>Limpar</button>
                </>
              )}
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {/* Document display */}
            {selectedDoc && (
              <div style={{ marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ color: '#1976d2', margin: 0 }}>Condições de Teste Geradas</h2>
                  <ExportButton doc={selectedDoc} />
                </div>
                <ConditionsCard doc={selectedDoc} />
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
const thStyle = { border: '1px solid #1976d2', padding: 8, fontWeight: 700 };
const tdStyle = { border: '1px solid #1976d2', padding: 6 };
const errorStyle = { color: '#fff', background: '#d32f2f', borderRadius: 6, padding: 12, marginTop: 16 };

const btnStyles = {
  primary: { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  secondary: { background: '#eee', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  clear: { background: '#f5f5f5', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  export: { background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  addItem: { background: 'none', color: '#1976d2', border: '1px dashed #1976d2', borderRadius: 6, padding: '5px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', marginTop: 4 },
  remove: { background: 'none', border: 'none', color: '#d32f2f', fontWeight: 700, fontSize: 16, cursor: 'pointer', padding: '4px 6px' },
  icon: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#1976d2', fontSize: 14, lineHeight: 1, flexShrink: 0, borderRadius: 4 },
};

const actionBtnStyle = (color) => ({
  background: color, color: '#fff', border: 'none', borderRadius: 6,
  padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
});
