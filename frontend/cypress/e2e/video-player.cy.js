describe('Video Player Integration', () => {
  beforeEach(() => {
    cy.clearTestData()
    // Create test users and content
    cy.createTestUser({
      name: 'Premium Student',
      email: 'premium@example.com',
      role: 'student',
      year_of_study: '2AM'
    })
    cy.createTestUser({
      name: 'Free Student',
      email: 'free@example.com',
      role: 'student',
      year_of_study: '2AM'
    })
  })

  describe('HLS.js Video Player', () => {
    beforeEach(() => {
      // Login as premium student with active subscription
      cy.login('premium@example.com', 'password123')
      
      // Mock active subscription
      cy.intercept('GET', '/api/subscriptions/current', {
        subscription: {
          id: 1,
          status: 'active',
          type: 'monthly',
          end_date: '2025-10-23'
        }
      })
      
      // Mock video content
      cy.intercept('GET', '/api/videos/*/stream', {
        hls_url: '/videos/test-video/playlist.m3u8',
        video: {
          id: 1,
          title: 'Test Video Lesson',
          description: 'This is a test video for HLS streaming',
          duration: 1800 // 30 minutes
        }
      })
      
      cy.visit('/chapters/1/videos/1')
    })

    it('should load and initialize HLS.js player', () => {
      // Check if video element is present
      cy.get('[data-cy=video-player]').should('be.visible')
      
      // Check if HLS.js is loaded
      cy.window().should('have.property', 'Hls')
      
      // Wait for video to load
      cy.waitForVideoLoad()
      
      // Check video metadata
      cy.get('[data-cy=video-title]').should('contain', 'Test Video Lesson')
      cy.get('[data-cy=video-description]').should('contain', 'test video for HLS streaming')
    })

    it('should display video controls', () => {
      cy.waitForVideoLoad()
      
      // Check basic video controls
      cy.get('[data-cy=play-button]').should('be.visible')
      cy.get('[data-cy=progress-bar]').should('be.visible')
      cy.get('[data-cy=volume-control]').should('be.visible')
      cy.get('[data-cy=fullscreen-button]').should('be.visible')
      
      // Check custom controls
      cy.get('[data-cy=speed-control]').should('be.visible')
      cy.get('[data-cy=quality-selector]').should('be.visible')
    })

    it('should support playback controls', () => {
      cy.waitForVideoLoad()
      
      // Test play/pause
      cy.get('[data-cy=play-button]').click()
      cy.get('video').should('have.prop', 'paused', false)
      
      cy.get('[data-cy=pause-button]').click()
      cy.get('video').should('have.prop', 'paused', true)
      
      // Test seeking
      cy.get('[data-cy=progress-bar]').click('center')
      cy.get('video').should(($video) => {
        expect($video[0].currentTime).to.be.greaterThan(0)
      })
      
      // Test volume control
      cy.get('[data-cy=volume-slider]').invoke('val', 50).trigger('input')
      cy.get('video').should('have.prop', 'volume', 0.5)
    })

    it('should support playback speed control', () => {
      cy.waitForVideoLoad()
      
      // Test speed control
      cy.get('[data-cy=speed-control]').click()
      cy.get('[data-cy=speed-option-1.5]').click()
      
      cy.get('video').should('have.prop', 'playbackRate', 1.5)
      cy.get('[data-cy=speed-indicator]').should('contain', '1.5x')
    })

    it('should support quality selection', () => {
      cy.waitForVideoLoad()
      
      // Test quality selection
      cy.get('[data-cy=quality-selector]').click()
      cy.get('[data-cy=quality-option]').should('have.length.greaterThan', 1)
      
      // Select different quality
      cy.get('[data-cy=quality-option-720p]').click()
      cy.get('[data-cy=current-quality]').should('contain', '720p')
    })

    it('should support fullscreen mode', () => {
      cy.waitForVideoLoad()
      
      // Enter fullscreen
      cy.get('[data-cy=fullscreen-button]').click()
      
      // Check if video player is in fullscreen
      cy.get('[data-cy=video-container]').should('have.class', 'fullscreen')
      
      // Exit fullscreen (simulate escape key)
      cy.get('body').type('{esc}')
      cy.get('[data-cy=video-container]').should('not.have.class', 'fullscreen')
    })

    it('should handle video buffering and loading states', () => {
      // Mock slow loading
      cy.intercept('GET', '/videos/test-video/playlist.m3u8', {
        delay: 2000,
        body: '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n'
      })
      
      cy.visit('/chapters/1/videos/1')
      
      // Should show loading indicator
      cy.get('[data-cy=video-loading]').should('be.visible')
      cy.get('[data-cy=loading-progress]').should('be.visible')
      
      // Wait for loading to complete
      cy.get('[data-cy=video-loading]', { timeout: 5000 }).should('not.exist')
      cy.get('[data-cy=video-player]').should('be.visible')
    })

    it('should display progress and time information', () => {
      cy.waitForVideoLoad()
      
      // Play video for a bit
      cy.get('[data-cy=play-button]').click()
      cy.wait(2000)
      
      // Check time display
      cy.get('[data-cy=current-time]').should('not.contain', '00:00')
      cy.get('[data-cy=total-duration]').should('contain', '30:00')
      
      // Check progress bar
      cy.get('[data-cy=progress-bar]').should('have.attr', 'value').and('not.equal', '0')
    })

    it('should handle keyboard shortcuts', () => {
      cy.waitForVideoLoad()
      
      // Focus on video player
      cy.get('[data-cy=video-player]').click()
      
      // Test spacebar for play/pause
      cy.get('body').type(' ')
      cy.get('video').should('have.prop', 'paused', false)
      
      cy.get('body').type(' ')
      cy.get('video').should('have.prop', 'paused', true)
      
      // Test arrow keys for seeking
      cy.get('body').type('{rightarrow}')
      cy.get('video').should(($video) => {
        expect($video[0].currentTime).to.be.greaterThan(0)
      })
      
      // Test volume keys
      cy.get('body').type('{uparrow}')
      cy.get('video').should(($video) => {
        expect($video[0].volume).to.be.greaterThan(0.5)
      })
    })
  })

  describe('Video Access Control', () => {
    it('should allow access to free videos without subscription', () => {
      cy.login('free@example.com', 'password123')
      
      // Mock free video
      cy.intercept('GET', '/api/chapters/1', {
        chapter: {
          id: 1,
          title: 'Free Chapter',
          is_free: true,
          videos: [
            { id: 1, title: 'Free Video', is_free: true }
          ]
        }
      })
      
      cy.visit('/chapters/1/videos/1')
      
      // Should load video player
      cy.get('[data-cy=video-player]').should('be.visible')
      cy.get('[data-cy=free-content-badge]').should('contain', 'Free Content')
    })

    it('should block premium videos without subscription', () => {
      cy.login('free@example.com', 'password123')
      
      // Mock premium video
      cy.intercept('GET', '/api/chapters/1/videos/1', {
        statusCode: 403,
        body: {
          message: 'Active subscription required'
        }
      })
      
      cy.visit('/chapters/1/videos/1')
      
      // Should show subscription required message
      cy.get('[data-cy=subscription-required]').should('be.visible')
      cy.get('[data-cy=upgrade-prompt]').should('contain', 'subscription required')
      cy.get('[data-cy=subscribe-button]').should('be.visible')
    })

    it('should show video preview for premium content', () => {
      cy.login('free@example.com', 'password123')
      
      // Mock video with preview
      cy.intercept('GET', '/api/chapters/1/videos/1/preview', {
        preview_url: '/videos/test-video/preview.m3u8',
        preview_duration: 60 // 1 minute preview
      })
      
      cy.visit('/chapters/1/videos/1')
      
      // Should show preview player
      cy.get('[data-cy=preview-player]').should('be.visible')
      cy.get('[data-cy=preview-badge]').should('contain', '1 minute preview')
      cy.get('[data-cy=unlock-full-video]').should('be.visible')
    })
  })

  describe('Video Error Handling', () => {
    beforeEach(() => {
      cy.login('premium@example.com', 'password123')
    })

    it('should handle video loading errors', () => {
      // Mock video loading error
      cy.intercept('GET', '/api/videos/*/stream', {
        statusCode: 500,
        body: { message: 'Video temporarily unavailable' }
      })
      
      cy.visit('/chapters/1/videos/1')
      
      // Should show error message
      cy.get('[data-cy=video-error]').should('be.visible')
      cy.get('[data-cy=error-message]').should('contain', 'temporarily unavailable')
      cy.get('[data-cy=retry-button]').should('be.visible')
    })

    it('should handle network errors gracefully', () => {
      cy.waitForVideoLoad()
      
      // Simulate network error during playback
      cy.intercept('GET', '/videos/**/*.ts', {
        statusCode: 504,
        body: 'Gateway timeout'
      })
      
      cy.get('[data-cy=play-button]').click()
      
      // Should show buffering or error state
      cy.get('[data-cy=video-buffering]', { timeout: 5000 }).should('be.visible')
      cy.get('[data-cy=network-error]').should('contain', 'Connection problem')
    })

    it('should provide video troubleshooting options', () => {
      cy.visit('/chapters/1/videos/1')
      
      // Simulate persistent loading issues
      cy.get('[data-cy=video-options]').click()
      cy.get('[data-cy=troubleshooting-link]').click()
      
      // Should show troubleshooting modal
      cy.get('[data-cy=troubleshooting-modal]').should('be.visible')
      cy.get('[data-cy=clear-cache-button]').should('be.visible')
      cy.get('[data-cy=report-issue-button]').should('be.visible')
      cy.get('[data-cy=contact-support-link]').should('be.visible')
    })
  })

  describe('Video Analytics and Progress', () => {
    beforeEach(() => {
      cy.login('premium@example.com', 'password123')
      cy.visit('/chapters/1/videos/1')
      cy.waitForVideoLoad()
    })

    it('should track video watch progress', () => {
      // Mock progress tracking
      cy.intercept('POST', '/api/videos/*/progress', { statusCode: 200 })
      
      // Play video for a while
      cy.get('[data-cy=play-button]').click()
      cy.wait(3000)
      
      // Progress should be tracked
      cy.get('@trackProgress.all').should('have.length.greaterThan', 0)
      
      // Check progress indicator
      cy.get('[data-cy=progress-percentage]').should('not.contain', '0%')
    })

    it('should resume from last watched position', () => {
      // Mock saved progress
      cy.intercept('GET', '/api/videos/*/progress', {
        progress: {
          current_time: 600, // 10 minutes
          percentage: 33.33
        }
      })
      
      cy.reload()
      cy.waitForVideoLoad()
      
      // Should show resume option
      cy.get('[data-cy=resume-prompt]').should('be.visible')
      cy.get('[data-cy=resume-button]').should('contain', 'Resume from 10:00')
      
      // Resume playback
      cy.get('[data-cy=resume-button]').click()
      
      // Should start from saved position
      cy.get('video').should(($video) => {
        expect($video[0].currentTime).to.be.closeTo(600, 5)
      })
    })

    it('should mark video as completed', () => {
      // Mock video completion
      cy.intercept('POST', '/api/videos/*/complete', { statusCode: 200 })
      
      // Simulate watching to near end
      cy.get('video').then(($video) => {
        $video[0].currentTime = $video[0].duration - 10 // 10 seconds before end
      })
      
      cy.get('[data-cy=play-button]').click()
      cy.wait(15000) // Wait for completion
      
      // Should show completion message
      cy.get('[data-cy=completion-modal]').should('be.visible')
      cy.get('[data-cy=completion-message]').should('contain', 'Video completed')
      cy.get('[data-cy=next-video-button]').should('be.visible')
    })

    it('should suggest related videos', () => {
      // Mock related videos
      cy.intercept('GET', '/api/videos/*/related', {
        videos: [
          { id: 2, title: 'Next Lesson', chapter: 'Chapter 1' },
          { id: 3, title: 'Related Topic', chapter: 'Chapter 2' }
        ]
      })
      
      cy.get('[data-cy=related-videos-panel]').should('be.visible')
      cy.get('[data-cy=related-video]').should('have.length', 2)
      cy.get('[data-cy=related-video-title]').first().should('contain', 'Next Lesson')
    })
  })

  describe('Video Notes and Bookmarks', () => {
    beforeEach(() => {
      cy.login('premium@example.com', 'password123')
      cy.visit('/chapters/1/videos/1')
      cy.waitForVideoLoad()
    })

    it('should allow adding video bookmarks', () => {
      // Play video and add bookmark
      cy.get('[data-cy=play-button]').click()
      cy.wait(3000)
      
      cy.get('[data-cy=add-bookmark-button]').click()
      
      // Should show bookmark form
      cy.get('[data-cy=bookmark-modal]').should('be.visible')
      cy.get('[data-cy=bookmark-title]').type('Important concept')
      cy.get('[data-cy=bookmark-notes]').type('Remember this for exam')
      
      cy.get('[data-cy=save-bookmark]').click()
      
      // Should show bookmark in timeline
      cy.get('[data-cy=video-bookmark]').should('be.visible')
      cy.get('[data-cy=bookmark-title]').should('contain', 'Important concept')
    })

    it('should allow jumping to bookmarks', () => {
      // Mock existing bookmark
      cy.intercept('GET', '/api/videos/*/bookmarks', {
        bookmarks: [
          {
            id: 1,
            time: 120, // 2 minutes
            title: 'Key Point',
            notes: 'Important concept'
          }
        ]
      })
      
      cy.reload()
      cy.waitForVideoLoad()
      
      // Should show bookmark marker
      cy.get('[data-cy=video-bookmark]').should('be.visible')
      
      // Click bookmark to jump
      cy.get('[data-cy=video-bookmark]').click()
      
      // Should jump to bookmark time
      cy.get('video').should(($video) => {
        expect($video[0].currentTime).to.be.closeTo(120, 2)
      })
    })

    it('should show notes panel', () => {
      cy.get('[data-cy=notes-toggle]').click()
      
      // Should show notes panel
      cy.get('[data-cy=notes-panel]').should('be.visible')
      cy.get('[data-cy=add-note-button]').should('be.visible')
      
      // Add a note
      cy.get('[data-cy=add-note-button]').click()
      cy.get('[data-cy=note-content]').type('This explains the formula well')
      cy.get('[data-cy=save-note]').click()
      
      // Should appear in notes list
      cy.get('[data-cy=note-item]').should('contain', 'explains the formula')
    })
  })
})