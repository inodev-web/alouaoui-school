// ***********************************************
// This file contains custom commands and overrides existing commands.
//
// For more comprehensive examples of custom commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password,
      device_uuid: 'cypress-test-device'
    }
  }).then((response) => {
    window.localStorage.setItem('auth_token', response.body.token)
    window.localStorage.setItem('user', JSON.stringify(response.body.user))
  })
})

// Login as student
Cypress.Commands.add('loginAsStudent', () => {
  cy.login('student@example.com', 'password123')
})

// Login as teacher
Cypress.Commands.add('loginAsTeacher', () => {
  cy.login('alouaoui@example.com', 'password123')
})

// Create test user
Cypress.Commands.add('createTestUser', (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '0555123456',
    password: 'password123',
    role: 'student',
    year_of_study: '2AM'
  }

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: { ...defaultUser, ...userData }
  })
})

// Wait for video to load
Cypress.Commands.add('waitForVideoLoad', () => {
  cy.get('video', { timeout: 15000 }).should('be.visible')
  cy.get('video').should(($video) => {
    expect($video[0].readyState).to.be.at.least(2) // HAVE_CURRENT_DATA
  })
})

// Check if element is in viewport
Cypress.Commands.add('isInViewport', (element) => {
  cy.get(element).then(($el) => {
    const rect = $el[0].getBoundingClientRect()
    expect(rect.top).to.be.at.least(0)
    expect(rect.left).to.be.at.least(0)
    expect(rect.bottom).to.be.at.most(Cypress.config().viewportHeight)
    expect(rect.right).to.be.at.most(Cypress.config().viewportWidth)
  })
})

// Custom command to handle file uploads
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/jpeg') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    const blob = Cypress.Blob.base64StringToBlob(fileContent, fileType)
    const file = new File([blob], fileName, { type: fileType })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    cy.get(selector).then(subject => {
      subject[0].files = dataTransfer.files
      subject[0].dispatchEvent(new Event('change', { bubbles: true }))
    })
  })
})

// Clear test data
Cypress.Commands.add('clearTestData', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clear-data`,
    failOnStatusCode: false
  })
})

// Declare global types for TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsStudent(): Chainable<void>
      loginAsTeacher(): Chainable<void>
      createTestUser(userData?: object): Chainable<void>
      waitForVideoLoad(): Chainable<void>
      isInViewport(element: string): Chainable<void>
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>
      clearTestData(): Chainable<void>
    }
  }
}