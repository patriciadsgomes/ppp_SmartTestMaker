import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Home from './Home';
import SessionReport from './SessionReport';
import TestConditions from './TestConditions';
import Login from './Login';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';

function ProtectedRoute({ element }) {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute element={<Home />} />} />
        <Route path="/gerador-casos-teste" element={<ProtectedRoute element={<App />} />} />
        <Route path="/gerador-relatorio-sessao" element={<ProtectedRoute element={<SessionReport />} />} />
        <Route path="/gerador-condicoes-teste" element={<ProtectedRoute element={<TestConditions />} />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
