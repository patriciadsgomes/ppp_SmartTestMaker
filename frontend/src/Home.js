import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f6f8fa' }}>
      <img src="/logoSmartTestMaker.jpeg" alt="SmartTest Marker Logo" height="180" style={{ marginBottom: 16 }} />
      <h1 style={{ color: '#1976d2', marginBottom: 32, marginTop: 0 }}>Bem-vindo ao SmartTest Marker</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
        <button className="main-btn" style={mainBtnStyle} onClick={() => navigate('/gerador-casos-teste')}>
          Gerador de Casos de Teste
        </button>
        <button className="main-btn" style={mainBtnStyle} onClick={() => navigate('/gerador-relatorio-sessao')}>
          Gerador de Relatório de Sessão
        </button>
        <button className="main-btn" style={mainBtnStyle} onClick={() => navigate('/gerador-condicoes-teste')}>
          Gerador de Condições de Teste
        </button>
      </div>
    </div>
  );
}

const mainBtnStyle = {
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '18px 0',
  fontWeight: 700,
  fontSize: 20,
  cursor: 'pointer',
  boxShadow: '0 2px 8px #0001',
  transition: 'background 0.2s',
  width: '100%'
};
