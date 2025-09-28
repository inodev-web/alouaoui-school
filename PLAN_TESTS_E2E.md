# 🧪 Plan de Tests E2E - Alouaoui School
## Architecture des Tests End-to-End

### 📋 **Configuration des Tests**

#### Stack technologique recommandée :
- **Cypress** (tests E2E principaux)
- **Jest + React Testing Library** (tests unitaires composants)
- **MSW (Mock Service Worker)** (mock des API calls)

---

## 🎯 **Scénarios de Tests E2E**

### 1. 🔐 **Parcours Authentification**

#### Test 1.1: Connexion utilisateur
```javascript
describe('Authentification - Connexion', () => {
  it('doit permettre à un utilisateur de se connecter', () => {
    // 1. Visiter la page de connexion
    cy.visit('/login')
    
    // 2. Remplir le formulaire
    cy.get('[data-testid="email-input"]').type('student@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    
    // 3. Soumettre le formulaire
    cy.get('[data-testid="login-button"]').click()
    
    // 4. Vérifier la redirection vers le dashboard
    cy.url().should('include', '/student')
    
    // 5. Vérifier la présence du token
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.exist
    })
  })
})
```

#### Test 1.2: Mot de passe oublié
```javascript
describe('Authentification - Mot de passe oublié', () => {
  it('doit permettre de réinitialiser le mot de passe', () => {
    // Mock de l'API forgot-password
    cy.intercept('POST', '/api/auth/forgot-password', {
      statusCode: 200,
      body: { message: 'Email envoyé avec succès' }
    }).as('forgotPassword')
    
    // 1. Visiter la page forgot password
    cy.visit('/forgot-password')
    
    // 2. Entrer l'email
    cy.get('[data-testid="email-input"]').type('student@example.com')
    
    // 3. Soumettre
    cy.get('[data-testid="submit-button"]').click()
    
    // 4. Vérifier l'appel API
    cy.wait('@forgotPassword')
    
    // 5. Vérifier le message de succès
    cy.get('[data-testid="success-message"]').should('be.visible')
  })
})
```

### 2. 📊 **Parcours Dashboard**

#### Test 2.1: Dashboard Admin
```javascript
describe('Dashboard Admin', () => {
  beforeEach(() => {
    // Setup: Authentification admin
    cy.loginAsAdmin()
  })
  
  it('doit afficher les statistiques admin', () => {
    // Mock des données dashboard
    cy.intercept('GET', '/api/dashboard/admin', { 
      fixture: 'admin-dashboard.json' 
    }).as('adminDashboard')
    
    // 1. Visiter le dashboard admin
    cy.visit('/admin')
    
    // 2. Vérifier le chargement des données
    cy.wait('@adminDashboard')
    
    // 3. Vérifier l'affichage des KPIs
    cy.get('[data-testid="students-count"]').should('be.visible')
    cy.get('[data-testid="revenue-total"]').should('be.visible')
    cy.get('[data-testid="courses-count"]').should('be.visible')
    
    // 4. Vérifier les graphiques
    cy.get('[data-testid="overview-chart"]').should('be.visible')
  })
})
```

#### Test 2.2: Dashboard Étudiant
```javascript
describe('Dashboard Étudiant', () => {
  beforeEach(() => {
    cy.loginAsStudent()
  })
  
  it('doit afficher le dashboard étudiant', () => {
    // Mock des données dashboard étudiant
    cy.intercept('GET', '/api/dashboard/student', { 
      fixture: 'student-dashboard.json' 
    }).as('studentDashboard')
    
    // 1. Visiter le dashboard étudiant
    cy.visit('/student')
    
    // 2. Vérifier le chargement
    cy.wait('@studentDashboard')
    
    // 3. Vérifier les éléments du dashboard
    cy.get('[data-testid="subscription-status"]').should('be.visible')
    cy.get('[data-testid="progress-stats"]').should('be.visible')
    cy.get('[data-testid="recent-activity"]').should('be.visible')
  })
})
```

### 3. 🎯 **Parcours Événements**

#### Test 3.1: Slider événements (public)
```javascript
describe('Événements - Slider public', () => {
  it('doit afficher les événements sur la page d\'accueil', () => {
    // Mock des événements slider
    cy.intercept('GET', '/api/events/slider', { 
      fixture: 'events-slider.json' 
    }).as('eventsSlider')
    
    // 1. Visiter la page d'accueil
    cy.visit('/')
    
    // 2. Vérifier le chargement du slider
    cy.wait('@eventsSlider')
    
    // 3. Vérifier l'affichage des événements
    cy.get('[data-testid="events-slider"]').should('be.visible')
    cy.get('[data-testid="event-slide"]').should('have.length.greaterThan', 0)
  })
})
```

#### Test 3.2: Gestion événements (admin)
```javascript
describe('Événements - Gestion admin', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
  })
  
  it('doit permettre de créer un événement', () => {
    // Mock de création d'événement
    cy.intercept('POST', '/api/events', {
      statusCode: 201,
      body: { id: 1, title: 'Nouvel événement' }
    }).as('createEvent')
    
    // 1. Aller sur la page événements
    cy.visit('/admin/events')
    
    // 2. Cliquer sur créer
    cy.get('[data-testid="create-event-button"]').click()
    
    // 3. Remplir le formulaire
    cy.get('[data-testid="event-title"]').type('Test Event')
    cy.get('[data-testid="event-description"]').type('Description test')
    
    // 4. Soumettre
    cy.get('[data-testid="submit-event"]').click()
    
    // 5. Vérifier la création
    cy.wait('@createEvent')
    cy.get('[data-testid="success-message"]').should('be.visible')
  })
})
```

### 4. 👤 **Parcours Profil**

#### Test 4.1: Consultation profil
```javascript
describe('Profil utilisateur', () => {
  beforeEach(() => {
    cy.loginAsStudent()
  })
  
  it('doit afficher le profil utilisateur', () => {
    // Mock des données profil
    cy.intercept('GET', '/api/auth/profile', { 
      fixture: 'user-profile.json' 
    }).as('userProfile')
    
    // 1. Aller sur le profil
    cy.visit('/student/profile')
    
    // 2. Vérifier le chargement
    cy.wait('@userProfile')
    
    // 3. Vérifier l'affichage des informations
    cy.get('[data-testid="user-name"]').should('be.visible')
    cy.get('[data-testid="user-email"]').should('be.visible')
  })
})
```

### 5. 📚 **Parcours Chapitres/Cours**

#### Test 5.1: Liste des chapitres
```javascript
describe('Chapitres - Liste étudiant', () => {
  beforeEach(() => {
    cy.loginAsStudent()
  })
  
  it('doit afficher la liste des chapitres', () => {
    // Mock des chapitres
    cy.intercept('GET', '/api/chapters', { 
      fixture: 'chapters-list.json' 
    }).as('chaptersList')
    
    // 1. Visiter la page chapitres
    cy.visit('/student/chapters')
    
    // 2. Vérifier le chargement
    cy.wait('@chaptersList')
    
    // 3. Vérifier l'affichage
    cy.get('[data-testid="chapters-grid"]').should('be.visible')
    cy.get('[data-testid="chapter-card"]').should('have.length.greaterThan', 0)
  })
})
```

---

## 🛠 **Configuration Technique**

### Structure des fichiers de test :
```
frontend/
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.cy.js
│   │   │   ├── forgot-password.cy.js
│   │   │   └── logout.cy.js
│   │   ├── dashboard/
│   │   │   ├── admin-dashboard.cy.js
│   │   │   └── student-dashboard.cy.js
│   │   ├── events/
│   │   │   ├── public-slider.cy.js
│   │   │   └── admin-management.cy.js
│   │   ├── profile/
│   │   │   └── user-profile.cy.js
│   │   └── chapters/
│   │       └── chapters-list.cy.js
│   ├── fixtures/
│   │   ├── admin-dashboard.json
│   │   ├── student-dashboard.json
│   │   ├── events-slider.json
│   │   ├── user-profile.json
│   │   └── chapters-list.json
│   └── support/
│       ├── commands.js
│       └── e2e.js
```

### Commandes personnalisées Cypress :
```javascript
// cypress/support/commands.js
Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'admin-token-123')
    win.localStorage.setItem('user_data', JSON.stringify({
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }))
  })
})

Cypress.Commands.add('loginAsStudent', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'student-token-123')
    win.localStorage.setItem('user_data', JSON.stringify({
      id: 2,
      name: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }))
  })
})
```

---

## 📊 **Métriques de Tests**

### Objectifs de couverture :
- **Pages critiques** : 100% (Auth, Dashboard, Profil)
- **Parcours utilisateur** : 95%
- **Interactions API** : 90%
- **Responsive design** : 85%

### KPIs à suivre :
- ✅ Temps d'exécution des tests < 5min
- ✅ Taux de réussite > 98%
- ✅ Détection des régressions < 24h
- ✅ Couverture fonctionnelle > 90%