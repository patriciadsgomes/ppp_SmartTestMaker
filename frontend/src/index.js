import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Home from './Home';
import SessionReport from './SessionReport';
import TestConditions from './TestConditions';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gerador-casos-teste" element={<App />} />
        <Route path="/gerador-relatorio-sessao" element={<SessionReport />} />
        <Route path="/gerador-condicoes-teste" element={<TestConditions />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
