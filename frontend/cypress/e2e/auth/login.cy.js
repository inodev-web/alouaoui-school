describe('Authentication - Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  context('Successful Login', () => {
    it('should allow student to login and redirect to student dashboard', () => {
      // Setup: Mock successful student login
      cy.mockLoginSuccess('student')
      cy.mockDashboardData('student')
      
      // Action: Fill and submit login form
      cy.fillAndSubmitLogin('student@test.com', 'password123')
      
      // Verification: Check API call was made
      cy.wait('@loginRequest')
      
      // Verification: Check redirection to student dashboard
      cy.url().should('include', '/student')
      
      // Verification: Check token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.exist
        expect(win.localStorage.getItem('user_data')).to.exist
      })
      
      // Verification: Check dashboard loads
      cy.wait('@studentDashboard')
      cy.getByTestId('dashboard-title').should('contain.text', 'Dashboard Étudiant')
    })

    it('should allow admin to login and redirect to admin dashboard', () => {
      // Setup: Mock successful admin login
      cy.mockLoginSuccess('admin')
      cy.mockDashboardData('admin')
      
      // Action: Fill and submit login form
      cy.fillAndSubmitLogin('admin@test.com', 'password123')
      
      // Verification: Check API call was made
      cy.wait('@loginRequest')
      
      // Verification: Check redirection to admin dashboard
      cy.url().should('include', '/admin')
      
      // Verification: Check admin dashboard loads
      cy.wait('@adminDashboard')
      cy.getByTestId('admin-dashboard-title').should('be.visible')
    })
  })

  context('Failed Login', () => {
    it('should show error message for invalid credentials', () => {
      // Setup: Mock failed login
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Invalid credentials',
          errors: {
            login: ['The provided credentials are incorrect.']
          }
        }
      }).as('loginFailure')
      
      // Action: Fill form with invalid credentials
      cy.fillAndSubmitLogin('invalid@test.com', 'wrongpassword')
      
      // Verification: Check error is displayed
      cy.wait('@loginFailure')
      cy.getByTestId('error-message').should('be.visible')
      cy.getByTestId('error-message').should('contain.text', 'Invalid credentials')
      
      // Verification: User stays on login page
      cy.url().should('include', '/login')
    })

    it('should show validation errors for empty fields', () => {
      // Action: Try to submit empty form
      cy.getByTestId('login-button').click()
      
      // Verification: Check validation messages
      cy.getByTestId('email-input').then(($input) => {
        expect($input[0].validationMessage).to.not.be.empty
      })
    })
  })

  context('UI Elements', () => {
    it('should have all required form elements', () => {
      cy.getByTestId('email-input').should('be.visible')
      cy.getByTestId('password-input').should('be.visible')
      cy.getByTestId('login-button').should('be.visible')
      
      // Check forgot password link
      cy.get('a[href="/forgot-password"]').should('be.visible')
      
      // Check register link
      cy.get('a[href="/register"]').should('be.visible')
    })

    it('should show loading state during login', () => {
      // Setup: Mock slow login response
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: { success: true },
        delay: 1000
      }).as('slowLogin')
      
      // Action: Fill and submit form
      cy.fillAndSubmitLogin()
      
      // Verification: Check loading state
      cy.getByTestId('login-button').should('be.disabled')
      cy.getByTestId('login-button').should('contain.text', 'Connexion en cours')
      
      cy.wait('@slowLogin')
    })
  })

  context('Navigation', () => {
    it('should navigate to forgot password page', () => {
      cy.get('a[href="/forgot-password"]').click()
      cy.url().should('include', '/forgot-password')
    })

    it('should navigate to register page', () => {
      cy.get('a[href="/register"]').click()
      cy.url().should('include', '/register')
    })
  })

  context('Device Management', () => {
    it('should handle device conflict error', () => {
      // Setup: Mock device conflict
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 409,
        body: {
          success: false,
          message: 'Session active détectée sur un autre appareil',
          error_code: 'DEVICE_CONFLICT'
        }
      }).as('deviceConflict')
      
      // Action: Try to login
      cy.fillAndSubmitLogin()
      
      // Verification: Check device conflict message
      cy.wait('@deviceConflict')
      cy.getByTestId('error-message').should('contain.text', 'autre appareil')
    })
  })
})