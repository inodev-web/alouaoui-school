describe('Subscription and Checkout Flow', () => {
  beforeEach(() => {
    cy.clearTestData()
    // Create test users
    cy.createTestUser({
      name: 'Test Student',
      email: 'student@example.com',
      role: 'student',
      year_of_study: '2AM'
    })
    cy.createTestUser({
      name: 'Alouaoui Teacher',
      email: 'alouaoui@example.com',
      role: 'teacher',
      is_alouaoui: true
    })
  })

  describe('Subscription Plans', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      cy.visit('/pricing')
    })

    it('should display available subscription plans', () => {
      // Should show monthly and yearly plans
      cy.get('[data-cy=monthly-plan]').should('be.visible')
      cy.get('[data-cy=yearly-plan]').should('be.visible')
      
      // Should show plan features
      cy.get('[data-cy=plan-features]').should('contain', 'Access to all video content')
      cy.get('[data-cy=plan-features]').should('contain', 'Download materials')
      cy.get('[data-cy=plan-features]').should('contain', 'Priority support')
      
      // Should show pricing
      cy.get('[data-cy=monthly-price]').should('contain', '2000 DA')
      cy.get('[data-cy=yearly-price]').should('contain', '20000 DA')
    })

    it('should allow plan comparison', () => {
      cy.get('[data-cy=compare-plans-button]').click()
      
      // Should show comparison table
      cy.get('[data-cy=comparison-table]').should('be.visible')
      cy.get('[data-cy=feature-comparison]').should('contain', 'Video Access')
      cy.get('[data-cy=feature-comparison]').should('contain', 'Materials Download')
    })

    it('should show current subscription status', () => {
      // For new user without subscription
      cy.get('[data-cy=current-plan]').should('contain', 'No active subscription')
      cy.get('[data-cy=upgrade-button]').should('be.visible')
    })
  })

  describe('Subscription Checkout', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      cy.visit('/pricing')
    })

    it('should allow monthly subscription purchase', () => {
      cy.get('[data-cy=monthly-plan] [data-cy=select-plan-button]').click()
      
      // Should redirect to checkout
      cy.url().should('include', '/checkout')
      
      // Should show subscription details
      cy.get('[data-cy=plan-name]').should('contain', 'Monthly Subscription')
      cy.get('[data-cy=plan-price]').should('contain', '2000 DA')
      cy.get('[data-cy=billing-cycle]').should('contain', 'monthly')
    })

    it('should allow yearly subscription purchase', () => {
      cy.get('[data-cy=yearly-plan] [data-cy=select-plan-button]').click()
      
      cy.url().should('include', '/checkout')
      
      cy.get('[data-cy=plan-name]').should('contain', 'Yearly Subscription')
      cy.get('[data-cy=plan-price]').should('contain', '20000 DA')
      cy.get('[data-cy=discount-badge]').should('contain', 'Save 17%')
    })

    it('should show payment methods', () => {
      cy.get('[data-cy=monthly-plan] [data-cy=select-plan-button]').click()
      
      // Should show available payment methods
      cy.get('[data-cy=payment-method-ccp]').should('be.visible')
      cy.get('[data-cy=payment-method-edahabia]').should('be.visible')
      cy.get('[data-cy=payment-method-baridi]').should('be.visible')
    })
  })

  describe('CCP Payment Flow', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      cy.visit('/pricing')
      cy.get('[data-cy=monthly-plan] [data-cy=select-plan-button]').click()
    })

    it('should complete CCP payment process', () => {
      // Select CCP payment method
      cy.get('[data-cy=payment-method-ccp]').click()
      
      // Should show CCP payment details
      cy.get('[data-cy=ccp-account-number]').should('contain', '00799999001')
      cy.get('[data-cy=ccp-account-holder]').should('contain', 'ALOUAOUI SCHOOL')
      
      // Upload receipt
      cy.get('[data-cy=receipt-upload]').should('be.visible')
      cy.uploadFile('[data-cy=receipt-upload]', 'test-receipt.jpg')
      
      // Enter payment reference
      cy.get('[data-cy=payment-reference]').type('CCP123456789')
      
      // Submit payment
      cy.get('[data-cy=submit-payment-button]').click()
      
      // Should show success message
      cy.get('[data-cy=payment-success]').should('contain', 'Payment submitted successfully')
      cy.get('[data-cy=pending-approval]').should('contain', 'awaiting approval')
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      
      // Should show subscription status as pending
      cy.get('[data-cy=subscription-status]').should('contain', 'Pending Approval')
    })

    it('should validate payment form', () => {
      cy.get('[data-cy=payment-method-ccp]').click()
      
      // Try to submit without required fields
      cy.get('[data-cy=submit-payment-button]').click()
      
      // Should show validation errors
      cy.get('[data-cy=receipt-error]').should('contain', 'Receipt image is required')
      cy.get('[data-cy=reference-error]').should('contain', 'Payment reference is required')
    })

    it('should validate receipt image format', () => {
      cy.get('[data-cy=payment-method-ccp]').click()
      
      // Try to upload invalid file format
      cy.uploadFile('[data-cy=receipt-upload]', 'test-document.pdf', 'application/pdf')
      
      // Should show format error
      cy.get('[data-cy=receipt-error]').should('contain', 'Only image files are allowed')
    })
  })

  describe('Edahabia Payment Flow', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      cy.visit('/pricing')
      cy.get('[data-cy=yearly-plan] [data-cy=select-plan-button]').click()
    })

    it('should redirect to Edahabia gateway', () => {
      cy.get('[data-cy=payment-method-edahabia]').click()
      
      cy.get('[data-cy=edahabia-redirect-info]').should('be.visible')
      cy.get('[data-cy=proceed-to-edahabia]').click()
      
      // Should redirect to Edahabia (in test, we mock this)
      cy.url().should('include', 'payment-gateway')
      cy.get('[data-cy=gateway-amount]').should('contain', '20000 DA')
    })

    it('should handle successful Edahabia payment', () => {
      cy.get('[data-cy=payment-method-edahabia]').click()
      cy.get('[data-cy=proceed-to-edahabia]').click()
      
      // Simulate successful payment return
      cy.visit('/payment/callback?status=success&payment_id=EDAH123456')
      
      // Should show success message
      cy.get('[data-cy=payment-success]').should('contain', 'Payment completed successfully')
      cy.get('[data-cy=subscription-activated]').should('contain', 'Subscription is now active')
      
      // Should update subscription status
      cy.visit('/dashboard')
      cy.get('[data-cy=subscription-status]').should('contain', 'Active')
    })

    it('should handle failed Edahabia payment', () => {
      cy.get('[data-cy=payment-method-edahabia]').click()
      cy.get('[data-cy=proceed-to-edahabia]').click()
      
      // Simulate failed payment return
      cy.visit('/payment/callback?status=failed&error=insufficient_funds')
      
      // Should show error message
      cy.get('[data-cy=payment-error]').should('contain', 'Payment failed')
      cy.get('[data-cy=error-reason]').should('contain', 'Insufficient funds')
      
      // Should allow retry
      cy.get('[data-cy=retry-payment-button]').should('be.visible')
    })
  })

  describe('Subscription Management', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      // Assume user has an active subscription
      cy.visit('/account/subscription')
    })

    it('should display current subscription details', () => {
      // Mock active subscription data
      cy.intercept('GET', '/api/subscriptions/current', {
        subscription: {
          id: 1,
          type: 'monthly',
          status: 'active',
          start_date: '2025-09-01',
          end_date: '2025-10-01',
          payment_amount: 2000
        }
      })
      
      cy.reload()
      
      cy.get('[data-cy=subscription-type]').should('contain', 'Monthly')
      cy.get('[data-cy=subscription-status]').should('contain', 'Active')
      cy.get('[data-cy=next-billing]').should('contain', 'October 1, 2025')
      cy.get('[data-cy=monthly-cost]').should('contain', '2000 DA')
    })

    it('should allow subscription upgrade', () => {
      cy.get('[data-cy=upgrade-subscription]').click()
      
      cy.url().should('include', '/pricing')
      cy.get('[data-cy=current-plan-indicator]').should('be.visible')
      cy.get('[data-cy=upgrade-options]').should('be.visible')
    })

    it('should show subscription history', () => {
      cy.get('[data-cy=subscription-history-tab]').click()
      
      cy.get('[data-cy=history-item]').should('have.length.greaterThan', 0)
      cy.get('[data-cy=payment-date]').should('be.visible')
      cy.get('[data-cy=payment-amount]').should('be.visible')
      cy.get('[data-cy=payment-status]').should('be.visible')
    })

    it('should allow subscription cancellation', () => {
      cy.get('[data-cy=cancel-subscription]').click()
      
      // Should show cancellation confirmation
      cy.get('[data-cy=cancellation-modal]').should('be.visible')
      cy.get('[data-cy=cancellation-reason]').select('Too expensive')
      cy.get('[data-cy=feedback-text]').type('Need to focus on studies')
      
      cy.get('[data-cy=confirm-cancellation]').click()
      
      // Should show cancellation success
      cy.get('[data-cy=cancellation-success]').should('contain', 'Subscription cancelled')
      cy.get('[data-cy=access-until]').should('contain', 'Access until October 1, 2025')
    })
  })

  describe('Payment Approval (Teacher View)', () => {
    beforeEach(() => {
      cy.loginAsTeacher()
      cy.visit('/admin/payments')
    })

    it('should display pending payments for approval', () => {
      // Mock pending payments
      cy.intercept('GET', '/api/payments?status=pending', {
        data: [
          {
            id: 1,
            student_name: 'John Doe',
            amount: 2000,
            payment_method: 'ccp',
            payment_reference: 'CCP123456789',
            created_at: '2025-09-23T10:00:00Z',
            receipt_image: 'receipts/receipt1.jpg'
          }
        ]
      })
      
      cy.reload()
      
      cy.get('[data-cy=pending-payments]').should('be.visible')
      cy.get('[data-cy=payment-item]').should('contain', 'John Doe')
      cy.get('[data-cy=payment-amount]').should('contain', '2000 DA')
      cy.get('[data-cy=payment-method]').should('contain', 'CCP')
    })

    it('should allow payment approval', () => {
      cy.get('[data-cy=payment-item]').first().within(() => {
        cy.get('[data-cy=view-receipt]').click()
      })
      
      // Should show receipt modal
      cy.get('[data-cy=receipt-modal]').should('be.visible')
      cy.get('[data-cy=receipt-image]').should('be.visible')
      
      // Approve payment
      cy.get('[data-cy=approve-payment]').click()
      
      // Should show success message
      cy.get('[data-cy=approval-success]').should('contain', 'Payment approved')
      
      // Payment should be removed from pending list
      cy.get('[data-cy=payment-item]').should('not.exist')
    })

    it('should allow payment rejection', () => {
      cy.get('[data-cy=payment-item]').first().within(() => {
        cy.get('[data-cy=reject-payment]').click()
      })
      
      // Should show rejection modal
      cy.get('[data-cy=rejection-modal]').should('be.visible')
      cy.get('[data-cy=rejection-reason]').select('Invalid receipt')
      cy.get('[data-cy=rejection-notes]').type('Receipt image is not clear')
      
      cy.get('[data-cy=confirm-rejection]').click()
      
      // Should show rejection success
      cy.get('[data-cy=rejection-success]').should('contain', 'Payment rejected')
    })

    it('should filter payments by status and method', () => {
      // Filter by payment method
      cy.get('[data-cy=method-filter]').select('CCP')
      cy.get('[data-cy=apply-filters]').click()
      
      // Should show only CCP payments
      cy.get('[data-cy=payment-method]').each(($el) => {
        cy.wrap($el).should('contain', 'CCP')
      })
      
      // Filter by date range
      cy.get('[data-cy=date-from]').type('2025-09-01')
      cy.get('[data-cy=date-to]').type('2025-09-30')
      cy.get('[data-cy=apply-filters]').click()
      
      // Should filter results
      cy.get('[data-cy=filter-results]').should('be.visible')
    })

    it('should export payment reports', () => {
      cy.get('[data-cy=export-button]').click()
      
      // Should show export options
      cy.get('[data-cy=export-modal]').should('be.visible')
      cy.get('[data-cy=export-format]').select('Excel')
      cy.get('[data-cy=export-date-range]').click()
      
      cy.get('[data-cy=confirm-export]').click()
      
      // Should initiate download
      cy.get('[data-cy=export-success]').should('contain', 'Export started')
    })
  })

  describe('Payment Notifications', () => {
    beforeEach(() => {
      cy.loginAsStudent()
      cy.visit('/dashboard')
    })

    it('should show payment status notifications', () => {
      // Mock notification for approved payment
      cy.intercept('GET', '/api/notifications', {
        data: [
          {
            id: 1,
            type: 'payment_approved',
            message: 'Your payment has been approved and your subscription is now active',
            created_at: '2025-09-23T10:00:00Z',
            read_at: null
          }
        ]
      })
      
      cy.reload()
      
      cy.get('[data-cy=notifications-bell]').click()
      cy.get('[data-cy=notification-item]').should('contain', 'payment has been approved')
      cy.get('[data-cy=unread-indicator]').should('be.visible')
    })

    it('should handle payment rejection notifications', () => {
      cy.intercept('GET', '/api/notifications', {
        data: [
          {
            id: 1,
            type: 'payment_rejected',
            message: 'Your payment has been rejected. Reason: Invalid receipt',
            created_at: '2025-09-23T10:00:00Z',
            read_at: null
          }
        ]
      })
      
      cy.reload()
      
      cy.get('[data-cy=notifications-bell]').click()
      cy.get('[data-cy=notification-item]').should('contain', 'payment has been rejected')
      cy.get('[data-cy=retry-payment-link]').should('be.visible')
    })
  })
})