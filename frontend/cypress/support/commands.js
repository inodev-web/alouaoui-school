// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- Authentication Commands --

/**
 * Login as Admin User
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => {
    const adminToken = 'admin-token-123-test'
    const adminData = {
      id: 1,
      name: 'Alouaoui Admin',
      email: 'admin@alouaoui-school.com',
      role: 'admin',
      abilities: ['admin']
    }
    
    win.localStorage.setItem('auth_token', adminToken)
    win.localStorage.setItem('user_data', JSON.stringify(adminData))
    win.localStorage.setItem('device_uuid', 'test-device-admin-uuid')
  })
})

/**
 * Login as Student User
 */
Cypress.Commands.add('loginAsStudent', () => {
  cy.window().then((win) => {
    const studentToken = 'student-token-456-test'
    const studentData = {
      id: 2,
      name: 'Student Test',
      email: 'student@test.com',
      role: 'student',
      year_of_study: 'Bac',
      abilities: ['student']
    }
    
    win.localStorage.setItem('auth_token', studentToken)
    win.localStorage.setItem('user_data', JSON.stringify(studentData))
    win.localStorage.setItem('device_uuid', 'test-device-student-uuid')
  })
})

/**
 * Logout user
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('auth_token')
    win.localStorage.removeItem('user_data')
    win.localStorage.removeItem('device_uuid')
  })
})

// -- API Mocking Commands --

/**
 * Mock successful login response
 */
Cypress.Commands.add('mockLoginSuccess', (userRole = 'student') => {
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: userRole === 'admin' ? 1 : 2,
          name: userRole === 'admin' ? 'Admin User' : 'Student User',
          email: userRole === 'admin' ? 'admin@test.com' : 'student@test.com',
          role: userRole
        },
        token: `${userRole}-token-test-123`,
        device_uuid: `test-device-${userRole}`
      }
    }
  }).as('loginRequest')
})

/**
 * Mock dashboard data
 */
Cypress.Commands.add('mockDashboardData', (type = 'student') => {
  if (type === 'admin') {
    cy.intercept('GET', '**/api/dashboard/admin', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          stats: {
            total_students: 150,
            total_courses: 25,
            total_revenue: 15750,
            active_subscriptions: 89,
            pending_payments: 12
          },
          growth: {
            students_growth: 15.2,
            revenue_growth: 23.5,
            courses_growth: 8.1
          },
          recent_activities: []
        }
      }
    }).as('adminDashboard')
  } else {
    cy.intercept('GET', '**/api/dashboard/student', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: 2,
            name: 'Student Test'
          },
          subscription: {
            status: 'active',
            teacher_name: 'Prof. Alouaoui',
            expires_at: '2025-12-31',
            days_remaining: 45
          },
          stats: {
            chapters_available: 24,
            videos_watched: 15,
            sessions_attended: 8,
            progress_percentage: 62
          },
          recent_activity: [
            {
              description: 'Vidéo "Chapitre 5: Fonctions" visionnée',
              created_at: '2025-01-20'
            }
          ],
          upcoming_sessions: [
            {
              teacher_name: 'Prof. Alouaoui',
              session_date: '2025-01-25',
              start_time: '14:00',
              status: 'Confirmé'
            }
          ]
        }
      }
    }).as('studentDashboard')
  }
})

/**
 * Mock events slider
 */
Cypress.Commands.add('mockEventsSlider', () => {
  cy.intercept('GET', '**/api/events/slider', {
    statusCode: 200,
    body: {
      success: true,
      data: [
        {
          id: 1,
          title: 'Nouveau chapitre disponible',
          description: 'Découvrez le chapitre sur les équations',
          slider_image_url: '/images/event1.jpg',
          alt_text: 'Nouveau chapitre',
          event_type: 'course',
          redirect_url: '/student/chapters',
          requires_subscription: true,
          teacher_name: 'Prof. Alouaoui',
          can_access: false,
          access_message: 'Abonnement requis'
        },
        {
          id: 2,
          title: 'Session live demain',
          description: 'Rejoignez la session de révision',
          slider_image_url: '/images/event2.jpg',
          alt_text: 'Session live',
          event_type: 'live',
          redirect_url: '/student/lives',
          requires_subscription: true,
          teacher_name: 'Prof. Alouaoui',
          can_access: true,
          access_message: null
        }
      ]
    }
  }).as('eventsSlider')
})

/**
 * Mock public stats
 */
Cypress.Commands.add('mockPublicStats', () => {
  cy.intercept('GET', '**/api/dashboard/public', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        total_students: 150,
        total_courses: 25,
        success_rate: 95,
        years_experience: 8
      }
    }
  }).as('publicStats')
})

/**
 * Mock forgot password
 */
Cypress.Commands.add('mockForgotPassword', () => {
  cy.intercept('POST', '**/api/auth/forgot-password', {
    statusCode: 200,
    body: {
      success: true,
      message: 'Un email de réinitialisation a été envoyé à votre adresse.'
    }
  }).as('forgotPassword')
})

// -- UI Helper Commands --

/**
 * Get element by test id
 */
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`)
})

/**
 * Check if loading spinner is visible and then hidden
 */
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('exist')
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist')
})

/**
 * Fill login form and submit
 */
Cypress.Commands.add('fillAndSubmitLogin', (email = 'student@test.com', password = 'password123') => {
  cy.getByTestId('email-input').clear().type(email)
  cy.getByTestId('password-input').clear().type(password)
  cy.getByTestId('login-button').click()
})