describe('QR Code Scanner Integration', () => {
  beforeEach(() => {
    cy.clearTestData()
    // Create test users
    cy.createTestUser({
      name: 'Scanner Teacher',
      email: 'teacher@example.com',
      role: 'teacher',
      is_alouaoui: false
    })
    cy.createTestUser({
      name: 'Student User',
      email: 'student@example.com',
      role: 'student',
      year_of_study: '2AM'
    })
    
    // Mock geolocation for school premise checks
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsArgWith(0, {
        coords: {
          latitude: 36.7538, // Algiers coordinates (mock school location)
          longitude: 3.0588,
          accuracy: 10
        }
      })
    })
  })

  describe('QR Scanner Setup', () => {
    beforeEach(() => {
      cy.loginAsTeacher()
      cy.visit('/scanner')
    })

    it('should initialize camera for QR scanning', () => {
      // Mock camera access
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getVideoTracks: () => [{ stop: cy.stub() }]
        })
      })
      
      // Should request camera permission
      cy.get('[data-cy=camera-permission-request]').should('be.visible')
      cy.get('[data-cy=allow-camera-button]').click()
      
      // Should show camera view
      cy.get('[data-cy=camera-preview]').should('be.visible')
      cy.get('[data-cy=scanner-overlay]').should('be.visible')
      cy.get('[data-cy=scan-instructions]').should('contain', 'Point camera at QR code')
    })

    it('should handle camera permission denied', () => {
      // Mock camera permission denied
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects({
          name: 'NotAllowedError',
          message: 'Permission denied'
        })
      })
      
      cy.get('[data-cy=allow-camera-button]').click()
      
      // Should show permission error
      cy.get('[data-cy=camera-error]').should('be.visible')
      cy.get('[data-cy=permission-error]').should('contain', 'Camera permission required')
      cy.get('[data-cy=enable-camera-instructions]').should('be.visible')
    })

    it('should show scanner interface elements', () => {
      // Mock successful camera access
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getVideoTracks: () => [{ stop: cy.stub() }]
        })
      })
      
      cy.get('[data-cy=allow-camera-button]').click()
      
      // Check scanner UI elements
      cy.get('[data-cy=scanner-frame]').should('be.visible')
      cy.get('[data-cy=scan-area]').should('be.visible')
      cy.get('[data-cy=scanner-controls]').should('be.visible')
      cy.get('[data-cy=flash-toggle]').should('be.visible')
      cy.get('[data-cy=camera-switch]').should('be.visible')
      cy.get('[data-cy=manual-entry-button]').should('be.visible')
    })

    it('should support manual QR code entry', () => {
      cy.get('[data-cy=manual-entry-button]').click()
      
      // Should show manual entry modal
      cy.get('[data-cy=manual-entry-modal]').should('be.visible')
      cy.get('[data-cy=qr-code-input]').should('be.visible')
      cy.get('[data-cy=verify-button]').should('be.visible')
      
      // Enter QR code manually
      const testQrCode = 'student-qr-12345-abcdef'
      cy.get('[data-cy=qr-code-input]').type(testQrCode)
      cy.get('[data-cy=verify-button]').click()
      
      // Should process the QR code
      cy.get('[data-cy=processing-qr]').should('be.visible')
    })
  })

  describe('Student QR Code Scanning', () => {
    beforeEach(() => {
      cy.loginAsTeacher()
      
      // Mock successful camera setup
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getVideoTracks: () => [{ stop: cy.stub() }]
        })
      })
      
      cy.visit('/scanner')
      cy.get('[data-cy=allow-camera-button]').click()
    })

    it('should successfully scan valid student QR code', () => {
      const validQrCode = 'student-qr-abc123def456'
      
      // Mock QR code verification API
      cy.intercept('POST', '/api/qr/verify', {
        success: true,
        student: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          year_of_study: '2AM',
          subscription_status: 'active',
          photo: '/photos/john-doe.jpg'
        },
        attendance: {
          date: '2025-09-23',
          time: '08:30:00',
          status: 'present'
        }
      })
      
      // Simulate QR code detection
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: validQrCode }
        }))
      })
      
      // Should show scan success
      cy.get('[data-cy=scan-success]').should('be.visible')
      cy.get('[data-cy=student-name]').should('contain', 'John Doe')
      cy.get('[data-cy=student-photo]').should('be.visible')
      cy.get('[data-cy=subscription-status]').should('contain', 'Active')
      cy.get('[data-cy=attendance-confirmed]').should('contain', 'Attendance marked')
    })

    it('should handle invalid QR code', () => {
      const invalidQrCode = 'invalid-qr-code-xyz'
      
      // Mock invalid QR code response
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Invalid QR code format'
        }
      })
      
      // Simulate invalid QR code detection
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: invalidQrCode }
        }))
      })
      
      // Should show error message
      cy.get('[data-cy=scan-error]').should('be.visible')
      cy.get('[data-cy=error-message]').should('contain', 'Invalid QR code')
      cy.get('[data-cy=try-again-button]').should('be.visible')
    })

    it('should handle expired QR code', () => {
      const expiredQrCode = 'student-qr-expired123'
      
      // Mock expired QR code response
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 410,
        body: {
          success: false,
          message: 'QR code has expired',
          student: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        }
      })
      
      // Simulate expired QR code detection
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: expiredQrCode }
        }))
      })
      
      // Should show expiration error with student info
      cy.get('[data-cy=scan-error]').should('be.visible')
      cy.get('[data-cy=expired-message]').should('contain', 'QR code has expired')
      cy.get('[data-cy=student-name]').should('contain', 'Jane Smith')
      cy.get('[data-cy=refresh-qr-instruction]').should('be.visible')
    })

    it('should handle student without subscription', () => {
      const noSubscriptionQrCode = 'student-qr-nosubscription123'
      
      // Mock student without subscription
      cy.intercept('POST', '/api/qr/verify', {
        success: true,
        student: {
          id: 2,
          name: 'Bob Wilson',
          email: 'bob@example.com',
          year_of_study: '1AM',
          subscription_status: 'expired',
          photo: '/photos/bob-wilson.jpg'
        },
        attendance: null,
        warning: 'Student subscription has expired'
      })
      
      // Simulate QR code detection
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: noSubscriptionQrCode }
        }))
      })
      
      // Should show warning but allow entry if permitted
      cy.get('[data-cy=subscription-warning]').should('be.visible')
      cy.get('[data-cy=expired-subscription-message]').should('contain', 'subscription has expired')
      cy.get('[data-cy=allow-entry-button]').should('be.visible')
      cy.get('[data-cy=deny-entry-button]').should('be.visible')
    })

    it('should handle location-based access control', () => {
      const validQrCode = 'student-qr-location123'
      
      // Mock location outside school premises
      cy.window().then((win) => {
        win.navigator.geolocation.getCurrentPosition.callsArgWith(0, {
          coords: {
            latitude: 40.7128, // New York coordinates (far from school)
            longitude: -74.0060,
            accuracy: 10
          }
        })
      })
      
      // Mock location verification failure
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 403,
        body: {
          success: false,
          message: 'Access denied: Not within school premises',
          location_error: true
        }
      })
      
      // Simulate QR code detection
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: validQrCode }
        }))
      })
      
      // Should show location error
      cy.get('[data-cy=location-error]').should('be.visible')
      cy.get('[data-cy=location-message]').should('contain', 'Not within school premises')
      cy.get('[data-cy=override-location-button]').should('be.visible') // For emergency access
    })
  })

  describe('Attendance Management', () => {
    beforeEach(() => {
      cy.loginAsTeacher()
      cy.visit('/attendance')
    })

    it('should display daily attendance overview', () => {
      // Mock attendance data
      cy.intercept('GET', '/api/attendance/today', {
        date: '2025-09-23',
        total_students: 45,
        present: 32,
        absent: 13,
        late_arrivals: 3,
        recent_scans: [
          {
            id: 1,
            student_name: 'John Doe',
            time: '08:15:00',
            status: 'present'
          },
          {
            id: 2,
            student_name: 'Jane Smith',
            time: '08:45:00',
            status: 'late'
          }
        ]
      })
      
      cy.reload()
      
      // Check attendance summary
      cy.get('[data-cy=attendance-date]').should('contain', 'September 23, 2025')
      cy.get('[data-cy=total-students]').should('contain', '45')
      cy.get('[data-cy=present-count]').should('contain', '32')
      cy.get('[data-cy=absent-count]').should('contain', '13')
      cy.get('[data-cy=late-count]').should('contain', '3')
      
      // Check recent scans
      cy.get('[data-cy=recent-scan]').should('have.length', 2)
      cy.get('[data-cy=scan-student-name]').first().should('contain', 'John Doe')
      cy.get('[data-cy=scan-time]').first().should('contain', '08:15')
    })

    it('should allow manual attendance marking', () => {
      cy.get('[data-cy=manual-attendance-button]').click()
      
      // Should show student search
      cy.get('[data-cy=student-search-modal]').should('be.visible')
      cy.get('[data-cy=student-search-input]').type('Alice')
      
      // Mock search results
      cy.intercept('GET', '/api/students/search?q=Alice', {
        students: [
          {
            id: 5,
            name: 'Alice Johnson',
            email: 'alice@example.com',
            year_of_study: '3AM',
            photo: '/photos/alice.jpg'
          }
        ]
      })
      
      cy.get('[data-cy=student-result]').should('be.visible')
      cy.get('[data-cy=student-result]').click()
      
      // Mark attendance
      cy.get('[data-cy=mark-present-button]').click()
      
      // Should update attendance list
      cy.get('[data-cy=attendance-success]').should('contain', 'Attendance marked for Alice Johnson')
    })

    it('should export attendance reports', () => {
      cy.get('[data-cy=export-attendance-button]').click()
      
      // Should show export options
      cy.get('[data-cy=export-modal]').should('be.visible')
      cy.get('[data-cy=export-date-range]').should('be.visible')
      cy.get('[data-cy=export-format]').select('Excel')
      
      // Set date range
      cy.get('[data-cy=date-from]').type('2025-09-01')
      cy.get('[data-cy=date-to]').type('2025-09-23')
      
      cy.get('[data-cy=confirm-export]').click()
      
      // Should initiate download
      cy.get('[data-cy=export-progress]').should('be.visible')
      cy.get('[data-cy=download-ready]', { timeout: 5000 }).should('be.visible')
    })

    it('should show attendance statistics', () => {
      cy.get('[data-cy=statistics-tab]').click()
      
      // Mock statistics data
      cy.intercept('GET', '/api/attendance/stats', {
        week_stats: {
          monday: { present: 42, total: 45 },
          tuesday: { present: 40, total: 45 },
          wednesday: { present: 44, total: 45 },
          thursday: { present: 41, total: 45 },
          friday: { present: 39, total: 45 }
        },
        top_attendees: [
          { name: 'John Doe', attendance_rate: 98.5 },
          { name: 'Jane Smith', attendance_rate: 95.2 }
        ],
        frequent_late: [
          { name: 'Bob Wilson', late_count: 5 }
        ]
      })
      
      cy.reload()
      
      // Should show attendance chart
      cy.get('[data-cy=attendance-chart]').should('be.visible')
      cy.get('[data-cy=top-attendees-list]').should('be.visible')
      cy.get('[data-cy=attendee-name]').first().should('contain', 'John Doe')
      cy.get('[data-cy=attendance-rate]').first().should('contain', '98.5%')
    })
  })

  describe('QR Code Security', () => {
    beforeEach(() => {
      cy.loginAsTeacher()
      cy.visit('/scanner')
      
      // Setup camera
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getVideoTracks: () => [{ stop: cy.stub() }]
        })
      })
      cy.get('[data-cy=allow-camera-button]').click()
    })

    it('should prevent QR code replay attacks', () => {
      const usedQrCode = 'student-qr-used123'
      
      // First scan - successful
      cy.intercept('POST', '/api/qr/verify', {
        success: true,
        student: { name: 'Test Student' },
        attendance: { status: 'present' }
      }).as('firstScan')
      
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: usedQrCode }
        }))
      })
      
      cy.wait('@firstScan')
      cy.get('[data-cy=scan-success]').should('be.visible')
      
      // Second scan with same code - should be rejected
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 409,
        body: {
          success: false,
          message: 'QR code already used today',
          already_used: true
        }
      }).as('secondScan')
      
      // Simulate scanning same code again
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: usedQrCode }
        }))
      })
      
      cy.wait('@secondScan')
      cy.get('[data-cy=already-used-error]').should('be.visible')
      cy.get('[data-cy=duplicate-scan-message]').should('contain', 'already used today')
    })

    it('should validate QR code format and integrity', () => {
      const malformedQrCode = 'invalid-format-123'
      
      // Mock format validation error
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 422,
        body: {
          success: false,
          message: 'Invalid QR code format',
          validation_error: true
        }
      })
      
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: malformedQrCode }
        }))
      })
      
      // Should show format error
      cy.get('[data-cy=format-error]').should('be.visible')
      cy.get('[data-cy=format-error-message]').should('contain', 'Invalid QR code format')
    })

    it('should handle rate limiting', () => {
      // Mock rate limiting response
      cy.intercept('POST', '/api/qr/verify', {
        statusCode: 429,
        body: {
          success: false,
          message: 'Too many scan attempts. Please wait.',
          retry_after: 60
        }
      })
      
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('qr-code-detected', {
          detail: { code: 'any-qr-code' }
        }))
      })
      
      // Should show rate limiting message
      cy.get('[data-cy=rate-limit-error]').should('be.visible')
      cy.get('[data-cy=retry-after-message]').should('contain', 'Please wait 60 seconds')
      cy.get('[data-cy=retry-timer]').should('be.visible')
    })

    it('should log security events', () => {
      cy.visit('/admin/security-logs')
      
      // Mock security logs
      cy.intercept('GET', '/api/admin/security-logs', {
        logs: [
          {
            id: 1,
            event: 'qr_replay_attempt',
            message: 'Attempted to reuse QR code',
            student: 'John Doe',
            timestamp: '2025-09-23T09:15:00Z',
            severity: 'medium'
          },
          {
            id: 2,
            event: 'location_violation',
            message: 'QR scan from unauthorized location',
            student: 'Jane Smith',
            timestamp: '2025-09-23T09:10:00Z',
            severity: 'high'
          }
        ]
      })
      
      cy.reload()
      
      // Should display security events
      cy.get('[data-cy=security-log]').should('have.length', 2)
      cy.get('[data-cy=log-event]').first().should('contain', 'qr_replay_attempt')
      cy.get('[data-cy=log-severity]').should('contain', 'medium')
      cy.get('[data-cy=log-timestamp]').should('be.visible')
    })
  })

  describe('Mobile Scanner Optimization', () => {
    beforeEach(() => {
      // Simulate mobile viewport
      cy.viewport(375, 667) // iPhone SE dimensions
      cy.loginAsTeacher()
      cy.visit('/scanner')
    })

    it('should adapt scanner interface for mobile', () => {
      // Should show mobile-optimized interface
      cy.get('[data-cy=mobile-scanner-interface]').should('be.visible')
      cy.get('[data-cy=scanner-frame]').should('have.css', 'width').and('match', /300px|90%/)
      
      // Controls should be easily accessible
      cy.get('[data-cy=scanner-controls]').should('be.visible')
      cy.get('[data-cy=flash-toggle]').should('have.css', 'min-height', '44px') // Touch target size
    })

    it('should support touch gestures', () => {
      // Mock camera setup
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
          getVideoTracks: () => [{ stop: cy.stub() }]
        })
      })
      
      cy.get('[data-cy=allow-camera-button]').click()
      
      // Test touch interactions
      cy.get('[data-cy=scanner-frame]').trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
      cy.get('[data-cy=focus-indicator]').should('be.visible')
      
      // Test pinch-to-zoom (simulated)
      cy.get('[data-cy=scanner-frame]').trigger('gesturestart', { scale: 1.5 })
      cy.get('[data-cy=zoom-level]').should('contain', '1.5x')
    })

    it('should handle device orientation changes', () => {
      cy.window().then((win) => {
        // Simulate orientation change
        win.dispatchEvent(new Event('orientationchange'))
      })
      
      // Scanner should adapt to new orientation
      cy.get('[data-cy=scanner-orientation-message]').should('be.visible')
      cy.get('[data-cy=portrait-mode-recommendation]').should('contain', 'rotate to portrait')
    })
  })
})