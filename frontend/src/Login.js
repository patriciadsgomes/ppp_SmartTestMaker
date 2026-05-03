import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAuth } from './auth';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!name.trim()) return setError('Informe seu nome completo.');
      if (password !== confirmPassword) return setError('As senhas não coincidem.');
      if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password };

      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar solicitação');
      saveAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={styles.card}>
        {/* Logo + branding */}
        <div style={styles.logoArea}>
          <img src="/logoSmartTestMaker.jpeg" alt="SmartTest Maker" style={styles.logo} />
          <h1 style={styles.appTitle}>SmartTest Maker</h1>
          <p style={styles.appSubtitle}>Sistema Acadêmico de Gerenciamento de Testes</p>
          <div style={styles.divider} />
        </div>

        {/* Mode toggle */}
        <div style={styles.toggleRow}>
          <button
            onClick={() => switchMode('login')}
            style={{ ...styles.toggleBtn, ...(mode === 'login' ? styles.toggleActive : {}) }}
          >
            Entrar
          </button>
          <button
            onClick={() => switchMode('register')}
            style={{ ...styles.toggleBtn, ...(mode === 'register' ? styles.toggleActive : {}) }}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nome Completo</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Ex: Maria Gomes"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              style={styles.input}
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirmar Senha</label>
              <input
                style={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️ {error}</span>
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading
              ? '...'
              : mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>
          Baseado nas normas <strong>ISO-29119-3</strong> · Projeto Acadêmico
        </p>
      </div>
    </div>
  );
}

const blue = '#1976d2';
const blueDark = '#1256a0';
const blueLight = '#e3eafc';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 50%, #1565c0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    top: -100,
    right: -100,
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    bottom: -80,
    left: -80,
    pointerEvents: 'none',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
    padding: '40px 44px 32px',
    width: '100%',
    maxWidth: 420,
    position: 'relative',
    zIndex: 1,
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: 24,
  },
  logo: {
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  appTitle: {
    margin: '0 0 4px',
    fontSize: 24,
    fontWeight: 700,
    color: blue,
    letterSpacing: '-0.5px',
  },
  appSubtitle: {
    margin: '0 0 16px',
    fontSize: 13,
    color: '#666',
    lineHeight: 1.4,
  },
  divider: {
    height: 3,
    width: 50,
    background: `linear-gradient(90deg, ${blue}, #64b5f6)`,
    borderRadius: 2,
    margin: '0 auto',
  },
  toggleRow: {
    display: 'flex',
    gap: 0,
    background: blueLight,
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    background: 'transparent',
    color: '#555',
    transition: 'all 0.2s',
  },
  toggleActive: {
    background: blue,
    color: '#fff',
    boxShadow: '0 2px 8px rgba(25,118,210,0.4)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#444',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1.5px solid #ddd',
    fontSize: 14,
    color: '#333',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
    lineHeight: 1,
  },
  errorBox: {
    background: '#fff3f3',
    border: '1px solid #f5c6c6',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#c62828',
    fontSize: 13,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    padding: '13px 0',
    background: `linear-gradient(90deg, ${blue}, ${blueDark})`,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 4,
    boxShadow: '0 4px 16px rgba(25,118,210,0.35)',
    transition: 'opacity 0.2s',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#aaa',
    marginTop: 24,
    marginBottom: 0,
  },
};
