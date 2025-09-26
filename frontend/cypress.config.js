import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    
    // Configuration pour les rapports
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
      timestamp: 'mmddyyyy_HHMMss'
    },
    
    // Timeouts optimisés
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Configuration vidéo/screenshots pour CI
    videoUploadOnPasses: false,
    videoCompression: 32,
    trashAssetsBeforeRuns: true,
    
    env: {
      API_URL: 'http://127.0.0.1:8000/api',
      BACKEND_URL: 'http://127.0.0.1:8000'
    },

    setupNodeEvents(on, config) {
      // Logs de debug en CI
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        
        table(message) {
          console.table(message)
          return null
        }
      })
      
      // Configuration dynamique selon l'environnement
      if (config.env.CI) {
        config.video = true
        config.screenshotOnRunFailure = true
        config.trashAssetsBeforeRuns = true
      }
      
      return config
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
})