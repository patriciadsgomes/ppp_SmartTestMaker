import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from './auth';

export default function UserHeader() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      padding: '8px 16px 0',
      maxWidth: 1120,
      margin: '0 auto',
    }}>
      <span style={{ fontSize: 13, color: '#555' }}>
        👤 <strong>{user.name}</strong> · {user.email}
      </span>
      <button
        onClick={handleLogout}
        style={{
          background: 'none',
          border: '1px solid #d32f2f',
          borderRadius: 6,
          padding: '5px 14px',
          color: '#d32f2f',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Sair
      </button>
    </div>
  );
}
