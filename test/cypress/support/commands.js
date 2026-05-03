const API = Cypress.env('apiUrl') || 'http://localhost:4000';

// Realiza login via API e salva o token no localStorage
Cypress.Commands.add('loginByApi', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${API}/auth/login`,
    body: { email, password },
  }).then((res) => {
    window.localStorage.setItem('smarttest_token', res.body.token);
    window.localStorage.setItem('smarttest_user', JSON.stringify(res.body.user));
  });
});

// Realiza uma requisição autenticada na API
Cypress.Commands.add('apiRequest', (method, path, body) => {
  const token = window.localStorage.getItem('smarttest_token');
  return cy.request({
    method,
    url: `${API}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    body,
    failOnStatusCode: false,
  });
});

// Obtém apenas o token via API (sem alterar localStorage)
Cypress.Commands.add('getAuthToken', () => {
  return cy
    .fixture('user')
    .then((user) =>
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: { email: user.email, password: user.password },
      })
    )
    .its('body.token');
});
