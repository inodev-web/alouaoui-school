// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import 'cypress-file-upload'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configuration globale Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignorer certaines erreurs qui ne sont pas critiques pour les tests
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  if (err.message.includes('ChunkLoadError')) {
    return false
  }
  return true
})

// Configuration des timeouts et retry
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('requestTimeout', 10000)
Cypress.config('responseTimeout', 30000)

// Logs pour debugging en CI
if (Cypress.env('CI')) {
  Cypress.on('fail', (error) => {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  })
  
  beforeEach(() => {
    cy.log(`🧪 Starting test: ${Cypress.currentTest.title}`)
  })
  
  afterEach(() => {
    cy.log(`✅ Completed test: ${Cypress.currentTest.title}`)
  })
}

// Hide fetch/XHR requests from command log for cleaner test output
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}