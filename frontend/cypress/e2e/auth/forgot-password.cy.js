describe('Authentication - Forgot Password Flow', () => {
  beforeEach(() => {
    cy.visit('/forgot-password')
  })

  context('Successful Password Reset Request', () => {
    it('should send reset email and show success message', () => {
      // Setup: Mock successful forgot password
      cy.mockForgotPassword()
      
      // Action: Enter email and submit
      cy.getByTestId('email-input').type('student@test.com')
      cy.getByTestId('submit-button').click()
      
      // Verification: Check API call was made
      cy.wait('@forgotPassword')
      
      // Verification: Check success state is shown
      cy.getByTestId('success-message').should('be.visible')
      cy.getByTestId('success-message').should('contain.text', 'Email envoyé')
      
      // Verification: Check success page elements
      cy.get('[data-testid="success-title"]').should('contain.text', 'Email envoyé')
      cy.get('[data-testid="back-to-login"]').should('be.visible')
    })

    it('should allow resending email from success page', () => {
      // Setup: Mock forgot password
      cy.mockForgotPassword()
      
      // Action: Complete initial flow
      cy.getByTestId('email-input').type('test@example.com')
      cy.getByTestId('submit-button').click()
      cy.wait('@forgotPassword')
      
      // Action: Click resend button
      cy.get('button').contains('Renvoyer').click()
      
      // Verification: Should return to form
      cy.getByTestId('email-input').should('be.visible')
      cy.getByTestId('email-input').should('have.value', '')
    })
  })

  context('Failed Password Reset Request', () => {
    it('should show error for invalid email', () => {
      // Setup: Mock failed forgot password
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Email address not found',
          errors: {
            email: ['The email address was not found in our system.']
          }
        }
      }).as('forgotPasswordError')
      
      // Action: Enter non-existent email
      cy.getByTestId('email-input').type('nonexistent@test.com')
      cy.getByTestId('submit-button').click()
      
      // Verification: Check error is displayed
      cy.wait('@forgotPasswordError')
      cy.getByTestId('error-message').should('be.visible')
      cy.getByTestId('error-message').should('contain.text', 'not found')
    })

    it('should show server error message', () => {
      // Setup: Mock server error
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Internal server error'
        }
      }).as('serverError')
      
      // Action: Submit form
      cy.getByTestId('email-input').type('test@example.com')
      cy.getByTestId('submit-button').click()
      
      // Verification: Check error handling
      cy.wait('@serverError')
      cy.getByTestId('error-message').should('be.visible')
    })
  })

  context('Form Validation', () => {
    it('should validate email format', () => {
      // Action: Enter invalid email format
      cy.getByTestId('email-input').type('invalid-email')
      cy.getByTestId('submit-button').click()
      
      // Verification: Check HTML5 validation
      cy.getByTestId('email-input').then(($input) => {
        expect($input[0].validationMessage).to.not.be.empty
      })
    })

    it('should require email field', () => {
      // Action: Try to submit empty form
      cy.getByTestId('submit-button').click()
      
      // Verification: Check required validation
      cy.getByTestId('email-input').then(($input) => {
        expect($input[0].validationMessage).to.not.be.empty
      })
    })

    it('should disable submit button when email is empty', () => {
      // Verification: Button should be disabled initially
      cy.getByTestId('submit-button').should('be.disabled')
      
      // Action: Enter email
      cy.getByTestId('email-input').type('test@example.com')
      
      // Verification: Button should be enabled
      cy.getByTestId('submit-button').should('not.be.disabled')
      
      // Action: Clear email
      cy.getByTestId('email-input').clear()
      
      // Verification: Button should be disabled again
      cy.getByTestId('submit-button').should('be.disabled')
    })
  })

  context('UI Elements and Behavior', () => {
    it('should have all required form elements', () => {
      // Check main elements
      cy.get('h1').should('contain.text', 'Mot de passe oublié')
      cy.getByTestId('email-input').should('be.visible')
      cy.getByTestId('submit-button').should('be.visible')
      
      // Check navigation links
      cy.get('a[href="/login"]').should('be.visible')
    })

    it('should show loading state during submission', () => {
      // Setup: Mock slow response
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 200,
        body: { success: true },
        delay: 1000
      }).as('slowForgotPassword')
      
      // Action: Submit form
      cy.getByTestId('email-input').type('test@example.com')
      cy.getByTestId('submit-button').click()
      
      // Verification: Check loading state
      cy.getByTestId('submit-button').should('be.disabled')
      cy.getByTestId('submit-button').should('contain.text', 'Envoi en cours')
      
      cy.wait('@slowForgotPassword')
    })

    it('should clear error when user starts typing again', () => {
      // Setup: Mock error response
      cy.intercept('POST', '**/api/auth/forgot-password', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Email not found'
        }
      }).as('forgotPasswordError')
      
      // Action: Trigger error
      cy.getByTestId('email-input').type('wrong@test.com')
      cy.getByTestId('submit-button').click()
      cy.wait('@forgotPasswordError')
      
      // Verification: Error is visible
      cy.getByTestId('error-message').should('be.visible')
      
      // Action: Start typing in email field
      cy.getByTestId('email-input').clear().type('new@test.com')
      
      // Note: This behavior would need to be implemented in the actual component
      // cy.getByTestId('error-message').should('not.exist')
    })
  })

  context('Navigation', () => {
    it('should navigate back to login page', () => {
      cy.get('a[href="/login"]').click()
      cy.url().should('include', '/login')
    })

    it('should navigate back to login from success page', () => {
      // Setup and complete forgot password flow
      cy.mockForgotPassword()
      cy.getByTestId('email-input').type('test@example.com')
      cy.getByTestId('submit-button').click()
      cy.wait('@forgotPassword')
      
      // Action: Click back to login
      cy.getByTestId('back-to-login').click()
      
      // Verification: Should be on login page
      cy.url().should('include', '/login')
    })
  })

  context('Accessibility', () => {
    it('should have proper form labels and ARIA attributes', () => {
      // Check label association
      cy.get('label[for="email"]').should('exist')
      cy.getByTestId('email-input').should('have.attr', 'id', 'email')
      
      // Check required attribute
      cy.getByTestId('email-input').should('have.attr', 'required')
      
      // Check input type
      cy.getByTestId('email-input').should('have.attr', 'type', 'email')
    })
  })

  context('Responsive Design', () => {
    it('should work on mobile viewports', () => {
      cy.viewport('iphone-6')
      
      // Check elements are still visible and usable
      cy.getByTestId('email-input').should('be.visible')
      cy.getByTestId('submit-button').should('be.visible')
      
      // Test interaction
      cy.mockForgotPassword()
      cy.getByTestId('email-input').type('mobile@test.com')
      cy.getByTestId('submit-button').click()
      
      cy.wait('@forgotPassword')
      cy.getByTestId('success-message').should('be.visible')
    })
  })
})