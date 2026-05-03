const { defineConfig } = require('cypress');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportPageTitle: 'SmartTest Maker — Relatório de Testes',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    reportDir: 'reports/cypress',
    reportFilename: '[name]-report',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on) {
      require('cypress-mochawesome-reporter/plugin')(on);
    },
    env: {
      apiUrl: 'http://localhost:4000',
    },
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
  },
});
