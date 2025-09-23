describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.clearTestData()
  })

  describe('User Registration', () => {
    it('should allow new student registration', () => {
      cy.visit('/register')
      
      // Fill registration form
      cy.get('[data-cy=name-input]').type('John Doe')
      cy.get('[data-cy=email-input]').type('john.doe@example.com')
      cy.get('[data-cy=phone-input]').type('0555123456')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=password-confirmation-input]').type('password123')
      cy.get('[data-cy=role-select]').select('student')
      cy.get('[data-cy=year-select]').select('2AM')
      
      // Submit registration
      cy.get('[data-cy=register-button]').click()
      
      // Should redirect to dashboard with success message
      cy.url().should('include', '/dashboard')
      cy.get('[data-cy=welcome-message]').should('contain', 'Welcome, John Doe')
      
      // Check if user data is stored in localStorage
      cy.window().then((win) => {
        const user = JSON.parse(win.localStorage.getItem('user'))
        expect(user.name).to.equal('John Doe')
        expect(user.email).to.equal('john.doe@example.com')
        expect(user.role).to.equal('student')
      })
    })

    it('should show validation errors for invalid registration data', () => {
      cy.visit('/register')
      
      // Try to submit empty form
      cy.get('[data-cy=register-button]').click()
      
      // Should show validation errors
      cy.get('[data-cy=name-error]').should('be.visible')
      cy.get('[data-cy=email-error]').should('be.visible')
      cy.get('[data-cy=password-error]').should('be.visible')
    })

    it('should prevent registration with existing email', () => {
      // Create a user first
      cy.createTestUser({
        name: 'Existing User',
        email: 'existing@example.com'
      })

      cy.visit('/register')
      
      // Try to register with same email
      cy.get('[data-cy=name-input]').type('New User')
      cy.get('[data-cy=email-input]').type('existing@example.com')
      cy.get('[data-cy=phone-input]').type('0555123457')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=password-confirmation-input]').type('password123')
      cy.get('[data-cy=role-select]').select('student')
      cy.get('[data-cy=year-select]').select('2AM')
      
      cy.get('[data-cy=register-button]').click()
      
      // Should show error message
      cy.get('[data-cy=email-error]').should('contain', 'already taken')
    })
  })

  describe('User Login', () => {
    beforeEach(() => {
      // Create test user for login tests
      cy.createTestUser({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'password123'
      })
    })

    it('should allow valid user login', () => {
      cy.get('[data-cy=email-input]').type('student@example.com')
      cy.get('[data-cy=password-input]').type('password123')
      cy.get('[data-cy=login-button]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.get('[data-cy=user-name]').should('contain', 'Test Student')
      
      // Check authentication token is stored
      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token')
        expect(token).to.exist
      })
    })

    it('should reject invalid credentials', () => {
      cy.get('[data-cy=email-input]').type('student@example.com')
      cy.get('[data-cy=password-input]').type('wrongpassword')
      cy.get('[data-cy=login-button]').click()
      
      // Should show error message
      cy.get('[data-cy=login-error]').should('contain', 'Invalid credentials')
      cy.url().should('include', '/login')
    })

    it('should show validation errors for empty fields', () => {
      cy.get('[data-cy=login-button]').click()
      
      cy.get('[data-cy=email-error]').should('be.visible')
      cy.get('[data-cy=password-error]').should('be.visible')
    })

    it('should remember user session on page refresh', () => {
      // Login first
      cy.loginAsStudent()
      cy.visit('/dashboard')
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.get('[data-cy=user-name]').should('be.visible')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      cy.createTestUser({
        name: 'Test Student',
        email: 'student@example.com'
      })
      cy.loginAsStudent()
      cy.visit('/dashboard')
    })

    it('should allow user to logout', () => {
      cy.get('[data-cy=user-menu]').click()
      cy.get('[data-cy=logout-button]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      
      // Should clear authentication data
      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token')
        const user = win.localStorage.getItem('user')
        expect(token).to.be.null
        expect(user).to.be.null
      })
    })

    it('should redirect to login when accessing protected routes after logout', () => {
      // Logout
      cy.get('[data-cy=user-menu]').click()
      cy.get('[data-cy=logout-button]').click()
      
      // Try to access protected route
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Password Reset', () => {
    beforeEach(() => {
      cy.createTestUser({
        name: 'Test User',
        email: 'reset@example.com'
      })
    })

    it('should allow password reset request', () => {
      cy.get('[data-cy=forgot-password-link]').click()
      
      cy.url().should('include', '/forgot-password')
      
      cy.get('[data-cy=email-input]').type('reset@example.com')
      cy.get('[data-cy=reset-button]').click()
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain', 'reset link sent')
    })

    it('should handle invalid email for password reset', () => {
      cy.get('[data-cy=forgot-password-link]').click()
      
      cy.get('[data-cy=email-input]').type('nonexistent@example.com')
      cy.get('[data-cy=reset-button]').click()
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain', 'email not found')
    })
  })

  describe('Profile Management', () => {
    beforeEach(() => {
      cy.createTestUser({
        name: 'Profile User',
        email: 'profile@example.com',
        phone: '0555123456'
      })
      cy.login('profile@example.com', 'password123')
      cy.visit('/profile')
    })

    it('should display user profile information', () => {
      cy.get('[data-cy=profile-name]').should('contain', 'Profile User')
      cy.get('[data-cy=profile-email]').should('contain', 'profile@example.com')
      cy.get('[data-cy=profile-phone]').should('contain', '0555123456')
    })

    it('should allow profile information update', () => {
      cy.get('[data-cy=edit-profile-button]').click()
      
      cy.get('[data-cy=name-input]').clear().type('Updated Name')
      cy.get('[data-cy=phone-input]').clear().type('0555999888')
      
      cy.get('[data-cy=save-button]').click()
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain', 'Profile updated')
      
      // Should display updated information
      cy.get('[data-cy=profile-name]').should('contain', 'Updated Name')
      cy.get('[data-cy=profile-phone]').should('contain', '0555999888')
    })

    it('should allow QR token regeneration', () => {
      // Get initial QR code
      cy.get('[data-cy=qr-code]').invoke('attr', 'src').as('initialQR')
      
      cy.get('[data-cy=refresh-qr-button]').click()
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain', 'QR code refreshed')
      
      // QR code should be different
      cy.get('@initialQR').then((initialSrc) => {
        cy.get('[data-cy=qr-code]').invoke('attr', 'src').should('not.equal', initialSrc)
      })
    })
  })

  describe('Device Management', () => {
    beforeEach(() => {
      cy.createTestUser({
        name: 'Device User',
        email: 'device@example.com'
      })
    })

    it('should enforce single device policy', () => {
      // Login on first device
      cy.login('device@example.com', 'password123')
      cy.visit('/dashboard')
      cy.get('[data-cy=user-name]').should('be.visible')
      
      // Simulate login from another device by clearing storage and logging in again
      cy.clearLocalStorage()
      cy.login('device@example.com', 'password123')
      cy.visit('/dashboard')
      
      // First session should be invalidated, but second should work
      cy.get('[data-cy=user-name]').should('be.visible')
    })

    it('should handle device switching gracefully', () => {
      // Login
      cy.login('device@example.com', 'password123')
      cy.visit('/dashboard')
      
      // Simulate session invalidation from another device
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'invalid-token')
      })
      
      // Try to access protected content
      cy.visit('/chapters')
      
      // Should redirect to login due to invalid token
      cy.url().should('include', '/login')
      cy.get('[data-cy=session-expired-message]').should('contain', 'session expired')
    })
  })
})