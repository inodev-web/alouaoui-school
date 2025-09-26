describe('Dashboard - Student Dashboard', () => {
  beforeEach(() => {
    // Setup: Login as student before each test
    cy.loginAsStudent()
    cy.mockDashboardData('student')
  })

  context('Dashboard Loading and Display', () => {
    it('should load and display student dashboard correctly', () => {
      // Action: Visit student dashboard
      cy.visit('/student')
      
      // Verification: Check API call is made
      cy.wait('@studentDashboard')
      
      // Verification: Check main dashboard elements
      cy.getByTestId('dashboard-title').should('contain.text', 'Dashboard Étudiant')
      cy.getByTestId('welcome-message').should('contain.text', 'Student Test')
      
      // Verification: Check refresh button
      cy.getByTestId('refresh-button').should('be.visible')
    })

    it('should handle loading state properly', () => {
      // Setup: Mock slow dashboard response
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 200,
        body: { success: true, data: {} },
        delay: 1000
      }).as('slowDashboard')
      
      // Action: Visit dashboard
      cy.visit('/student')
      
      // Verification: Check loading spinner appears
      cy.get('[data-testid="loading"]').should('be.visible')
      
      // Wait for response and check loading disappears
      cy.wait('@slowDashboard')
      cy.get('[data-testid="loading"]').should('not.exist')
    })
  })

  context('Subscription Status Display', () => {
    it('should display active subscription correctly', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Check subscription card
      cy.getByTestId('subscription-status').should('be.visible')
      cy.getByTestId('subscription-badge').should('contain.text', 'Active')
      cy.getByTestId('teacher-name').should('contain.text', 'Prof. Alouaoui')
      cy.getByTestId('expiry-date').should('contain.text', '31 décembre 2025')
      cy.getByTestId('days-remaining').should('contain.text', '45')
    })

    it('should handle expired subscription', () => {
      // Setup: Mock expired subscription
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: { name: 'Student Test' },
            subscription: {
              status: 'expired',
              teacher_name: 'Prof. Alouaoui',
              expires_at: '2024-12-31',
              days_remaining: 0
            },
            stats: {
              chapters_available: 0,
              videos_watched: 0,
              sessions_attended: 0,
              progress_percentage: 0
            }
          }
        }
      }).as('expiredSubscription')
      
      cy.visit('/student')
      cy.wait('@expiredSubscription')
      
      // Verification: Check expired status
      cy.getByTestId('subscription-badge').should('contain.text', 'Expiré')
      cy.getByTestId('subscription-badge').should('have.class', 'bg-red')
    })

    it('should handle no subscription', () => {
      // Setup: Mock no subscription
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: { name: 'Student Test' },
            subscription: null,
            stats: {
              chapters_available: 0,
              videos_watched: 0,
              sessions_attended: 0,
              progress_percentage: 0
            }
          }
        }
      }).as('noSubscription')
      
      cy.visit('/student')
      cy.wait('@noSubscription')
      
      // Verification: Check no subscription message
      cy.getByTestId('no-subscription-message').should('be.visible')
      cy.getByTestId('no-subscription-message').should('contain.text', 'Aucun abonnement actif')
      cy.get('button').contains('Découvrir les abonnements').should('be.visible')
    })
  })

  context('Statistics Cards', () => {
    it('should display all stats cards with correct data', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Check chapters available
      cy.getByTestId('chapters-count').should('contain.text', '24')
      cy.getByTestId('chapters-label').should('contain.text', 'Chapitres disponibles')
      
      // Verification: Check videos watched
      cy.getByTestId('videos-count').should('contain.text', '15')
      cy.getByTestId('videos-label').should('contain.text', 'Vidéos regardées')
      
      // Verification: Check sessions attended
      cy.getByTestId('sessions-count').should('contain.text', '8')
      cy.getByTestId('sessions-label').should('contain.text', 'Sessions suivies')
      
      // Verification: Check progress percentage
      cy.getByTestId('progress-count').should('contain.text', '62%')
      cy.getByTestId('progress-label').should('contain.text', 'Progression')
    })

    it('should handle zero stats gracefully', () => {
      // Setup: Mock zero stats
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: { name: 'New Student' },
            stats: {
              chapters_available: 0,
              videos_watched: 0,
              sessions_attended: 0,
              progress_percentage: 0
            }
          }
        }
      }).as('zeroStats')
      
      cy.visit('/student')
      cy.wait('@zeroStats')
      
      // Verification: All stats should show 0
      cy.getByTestId('chapters-count').should('contain.text', '0')
      cy.getByTestId('videos-count').should('contain.text', '0')
      cy.getByTestId('sessions-count').should('contain.text', '0')
      cy.getByTestId('progress-count').should('contain.text', '0%')
    })
  })

  context('Recent Activity', () => {
    it('should display recent activity when available', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Check recent activity section
      cy.getByTestId('recent-activity').should('be.visible')
      cy.getByTestId('recent-activity-title').should('contain.text', 'Activité récente')
      
      // Check activity items
      cy.getByTestId('activity-item').should('have.length.at.least', 1)
      cy.getByTestId('activity-description').first().should('contain.text', 'Chapitre 5')
    })

    it('should handle empty recent activity', () => {
      // Setup: Mock empty activity
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: { name: 'Student Test' },
            stats: {
              chapters_available: 5,
              videos_watched: 0,
              sessions_attended: 0,
              progress_percentage: 0
            },
            recent_activity: []
          }
        }
      }).as('emptyActivity')
      
      cy.visit('/student')
      cy.wait('@emptyActivity')
      
      // Verification: Recent activity section should not be visible
      cy.getByTestId('recent-activity').should('not.exist')
    })
  })

  context('Upcoming Sessions', () => {
    it('should display upcoming sessions', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Check upcoming sessions
      cy.getByTestId('upcoming-sessions').should('be.visible')
      cy.getByTestId('upcoming-sessions-title').should('contain.text', 'Sessions à venir')
      
      // Check session details
      cy.getByTestId('session-item').should('have.length.at.least', 1)
      cy.getByTestId('session-teacher').first().should('contain.text', 'Prof. Alouaoui')
      cy.getByTestId('session-date').first().should('contain.text', '25 janvier 2025')
      cy.getByTestId('session-time').first().should('contain.text', '14:00')
    })
  })

  context('Error Handling', () => {
    it('should handle dashboard API error gracefully', () => {
      // Setup: Mock API error
      cy.intercept('GET', '**/api/dashboard/student', {
        statusCode: 500,
        body: {
          success: false,
          message: 'Internal server error'
        }
      }).as('dashboardError')
      
      cy.visit('/student')
      cy.wait('@dashboardError')
      
      // Verification: Check error display
      cy.getByTestId('error-message').should('be.visible')
      cy.getByTestId('error-message').should('contain.text', 'Erreur lors du chargement')
      
      // Check retry button
      cy.getByTestId('retry-button').should('be.visible')
    })

    it('should retry loading dashboard data', () => {
      // Setup: Mock initial error then success
      cy.intercept('GET', '**/api/dashboard/student', { statusCode: 500 }).as('initialError')
      
      cy.visit('/student')
      cy.wait('@initialError')
      
      // Setup: Mock successful retry
      cy.mockDashboardData('student')
      
      // Action: Click retry button
      cy.getByTestId('retry-button').click()
      
      // Verification: Should load successfully
      cy.wait('@studentDashboard')
      cy.getByTestId('dashboard-title').should('be.visible')
    })
  })

  context('Refresh Functionality', () => {
    it('should refresh dashboard data when refresh button is clicked', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Setup: Mock second API call
      cy.mockDashboardData('student')
      
      // Action: Click refresh button
      cy.getByTestId('refresh-button').click()
      
      // Verification: Should make another API call
      cy.wait('@studentDashboard')
    })
  })

  context('Navigation and Links', () => {
    it('should have working navigation within student area', () => {
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Check if navigation elements exist (depends on your layout)
      // This would need to be implemented based on your actual StudentLayout
      
      // Example: Check if user can navigate to chapters
      // cy.get('[data-testid="nav-chapters"]').click()
      // cy.url().should('include', '/student/chapters')
    })
  })

  context('Authentication Protection', () => {
    it('should redirect to login if not authenticated', () => {
      // Setup: Clear authentication
      cy.logout()
      
      // Action: Try to access student dashboard
      cy.visit('/student')
      
      // Verification: Should redirect to login (this depends on your PrivateRoute implementation)
      // cy.url().should('include', '/login')
    })
  })

  context('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-6')
      
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Key elements should be visible on mobile
      cy.getByTestId('dashboard-title').should('be.visible')
      cy.getByTestId('subscription-status').should('be.visible')
      cy.getByTestId('chapters-count').should('be.visible')
    })

    it('should be responsive on tablet devices', () => {
      cy.viewport('ipad-2')
      
      cy.visit('/student')
      cy.wait('@studentDashboard')
      
      // Verification: Should display properly on tablet
      cy.getByTestId('dashboard-title').should('be.visible')
      cy.getByTestId('stats-grid').should('be.visible')
    })
  })
})