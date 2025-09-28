# 🚀 Guide d'Utilisation - Tests E2E et CI/CD

Ce guide explique comment utiliser l'infrastructure complète de tests E2E avec Cypress et GitHub Actions pour le projet **Alouaoui School**.

## 📋 Table des Matières

1. [🔧 Configuration Initiale](#-configuration-initiale)
2. [🧪 Exécution des Tests Locaux](#-exécution-des-tests-locaux)
3. [☁️ GitHub Actions CI/CD](#️-github-actions-cicd)
4. [📊 Rapports et Artefacts](#-rapports-et-artefacts)
5. [🔍 Debugging et Dépannage](#-debugging-et-dépannage)
6. [⚡ Optimisations et Bonnes Pratiques](#-optimisations-et-bonnes-pratiques)

---

## 🔧 Configuration Initiale

### Prérequis Système

**Backend (Laravel 11):**
```bash
- PHP 8.2+
- Composer 2.0+
- MySQL/SQLite
- Extensions PHP: mbstring, dom, fileinfo, mysql
```

**Frontend (React):**
```bash
- Node.js 18+
- npm 9+
```

**Outils de Test:**
```bash
- Cypress 13+
- Chrome/Firefox browsers
```

### Installation Rapide

```bash
# 1. Clone du projet
git clone https://github.com/inodev-web/alouaoui-school.git
cd alouaoui-school

# 2. Backend Laravel
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# 3. Frontend React
cd ../frontend
npm install
npx cypress install

# 4. Vérification installation
npm run dev        # Terminal 1 (Frontend)
cd ../backend && php artisan serve  # Terminal 2 (Backend)
```

---

## 🧪 Exécution des Tests Locaux

### Option 1: Script Automatisé (Recommandé)

**Linux/macOS:**
```bash
# Tous les tests
./scripts/run-e2e-tests.sh

# Tests spécifiques
./scripts/run-e2e-tests.sh auth chrome
./scripts/run-e2e-tests.sh critical firefox
./scripts/run-e2e-tests.sh dashboard

# Aide
./scripts/run-e2e-tests.sh --help
```

**Windows:**
```batch
REM Tous les tests
scripts\run-e2e-tests.bat

REM Tests spécifiques
scripts\run-e2e-tests.bat auth chrome
scripts\run-e2e-tests.bat critical firefox

REM Aide
scripts\run-e2e-tests.bat --help
```

### Option 2: Exécution Manuelle

```bash
# 1. Démarrer le backend
cd backend
php artisan serve --port=8000 &

# 2. Démarrer le frontend
cd frontend
npm run dev &

# 3. Exécuter les tests Cypress
npm run cypress:open    # Mode interactif
npm run cypress:run     # Mode headless

# 4. Tests spécifiques
npx cypress run --spec "cypress/e2e/login.cy.js"
npx cypress run --spec "cypress/e2e/events.cy.js" --browser firefox
```

### Suites de Tests Disponibles

| Suite | Description | Fichiers inclus |
|-------|-------------|-----------------|
| `all` | Tous les tests | `*.cy.js` |
| `auth` | Authentification | `login.cy.js`, `forgot-password.cy.js` |
| `dashboard` | Tableaux de bord | `student-dashboard.cy.js` |
| `events` | Gestion événements | `events.cy.js` |
| `profile` | Gestion profil | `profile.cy.js` |
| `chapters` | Apprentissage | `chapters.cy.js` |
| `critical` | Tests critiques | `login.cy.js`, `events.cy.js` |

---

## ☁️ GitHub Actions CI/CD

### 🔄 Workflows Disponibles

#### 1. **Pipeline Principal** (`.github/workflows/e2e-tests.yml`)

**Déclencheurs:**
- Push sur `main`, `develop`
- Pull Request vers `main`
- Exécution manuelle avec paramètres

**Jobs:**
1. **Setup & Validation** - Configuration et détection des changements
2. **Backend Tests** - Tests unitaires Laravel + démarrage serveur
3. **E2E Tests Matrix** - Tests Cypress en parallèle (multiple browsers)
4. **Report Results** - Fusion des rapports et génération des artefacts
5. **Deploy** - Déploiement automatique si tous les tests passent

**Utilisation:**

```bash
# Déclenchement automatique
git push origin main

# Exécution manuelle depuis GitHub
# Actions > E2E Tests > Run workflow
# - Choisir la suite de tests
# - Choisir le navigateur
# - Cliquer "Run workflow"
```

#### 2. **Tests Rapides** (`.github/workflows/quick-e2e.yml`)

**Déclencheurs:**
- Push sur branches `develop`, `feature/*`
- Pull Requests

**Caractéristiques:**
- Tests critiques seulement (`login`, `events`)
- Exécution rapide (< 5 minutes)
- Feedback immédiat pour les développeurs

### 📊 Configuration des Secrets GitHub

Ajoutez ces secrets dans votre repository GitHub:

```
Settings > Secrets and variables > Actions > New repository secret
```

| Secret | Description | Requis |
|--------|-------------|---------|
| `CYPRESS_RECORD_KEY` | Clé pour Cypress Dashboard | Optionnel |
| `DATABASE_URL` | URL de la base de données de test | Optionnel |

### 🎯 Matrice de Tests

Le pipeline exécute automatiquement les tests sur:
- **Navigateurs:** Chrome, Firefox
- **Environnements:** Ubuntu Latest
- **Versions Node.js:** 20
- **Versions PHP:** 8.2

---

## 📊 Rapports et Artefacts

### Types de Rapports Générés

#### 1. **Rapports HTML Interactifs**
```
frontend/cypress/reports/merged-report.html
```
- Vue d'ensemble des résultats
- Détails par test
- Durées d'exécution
- Screenshots des échecs

#### 2. **Rapports JSON**
```json
{
  "stats": {
    "tests": 42,
    "passes": 40,
    "failures": 2,
    "duration": 120000
  },
  "results": [...],
  "failures": [...]
}
```

#### 3. **Artefacts Visuels**
- **Vidéos:** Enregistrement complet de chaque test
- **Screenshots:** Captures d'écran des échecs
- **Logs:** Logs détaillés frontend/backend

### Accès aux Rapports

**Local:**
```bash
# Ouvrir le rapport dans le navigateur
open frontend/cypress/reports/merged-report.html  # macOS
xdg-open frontend/cypress/reports/merged-report.html  # Linux
start frontend\cypress\reports\merged-report.html  # Windows
```

**GitHub Actions:**
1. Aller dans l'onglet **Actions**
2. Cliquer sur le workflow terminé
3. Télécharger les artefacts:
   - `📊-final-test-reports`
   - `cypress-videos-*`
   - `cypress-screenshots-*`

### Exemple de Rapport de Summary

```markdown
## 🧪 E2E Tests - Comprehensive Results Report

**Workflow:** E2E Tests - Cypress CI/CD Pipeline
**Run ID:** 1234567890
**Branch:** main
**Commit:** abc123def456
**Date:** 2025-01-25 14:30:00 UTC

## 📊 Test Statistics

| Metric | Value |
|--------|-------|
| **Total Tests** | 89 |
| **Passed** | ✅ 87 |
| **Failed** | ❌ 2 |
| **Skipped** | ⏭️ 0 |
| **Duration** | 245000ms |
| **Success Rate** | 98% |
```

---

## 🔍 Debugging et Dépannage

### Problèmes Courants

#### 1. **Tests qui Échouent Localement**

```bash
# Vérifier les services
curl http://localhost:5173        # Frontend
curl http://127.0.0.1:8000/api/health  # Backend

# Logs détaillés
npm run cypress:open  # Mode debug visuel

# Vérifier la base de données
cd backend
php artisan migrate:fresh --seed --env=testing
```

#### 2. **Timeouts dans les Tests**

```javascript
// Augmenter les timeouts dans cypress.config.js
{
  defaultCommandTimeout: 15000,    // Par défaut: 10s
  requestTimeout: 15000,          // Par défaut: 10s
  responseTimeout: 45000          // Par défaut: 30s
}
```

#### 3. **Problèmes de Mock API**

```javascript
// Vérifier les interceptors dans les tests
cy.intercept('GET', '**/api/events', { fixture: 'events.json' }).as('getEvents');
cy.wait('@getEvents');  // Attendre explicitement
```

#### 4. **Erreurs en CI/CD GitHub Actions**

```yaml
# Ajouter plus de logs dans le workflow
- name: Debug services
  run: |
    echo "Backend status:" && curl -s http://localhost:8000/api/health || echo "Backend not responding"
    echo "Frontend status:" && curl -s -I http://localhost:5173 || echo "Frontend not responding"
    netstat -tlnp | grep -E ':(8000|5173)'
```

### Logs et Debugging

#### Logs Backend Laravel
```bash
# En local
tail -f backend/storage/logs/laravel.log

# En CI (via artefacts)
# Télécharger: backend-logs artifact
```

#### Logs Frontend React
```bash
# Console du navigateur dans Cypress
cy.window().then((win) => {
  console.log(win.console);
});

# Logs personnalisés
cy.task('log', 'Message de debug');
```

#### Cypress Debug Commands
```javascript
// Dans les tests
cy.debug();          // Pause pour inspection
cy.screenshot();     // Capture manuelle
cy.wait(2000);       // Pause temporelle
```

---

## ⚡ Optimisations et Bonnes Pratiques

### Performance des Tests

#### 1. **Parallélisation**
```bash
# Exécution parallèle locale
npm run cypress:run -- --parallel --record --key YOUR_RECORD_KEY

# En CI - utilise la matrice automatiquement
```

#### 2. **Cache et Optimisations**
```yaml
# Dans GitHub Actions
- uses: actions/cache@v3
  with:
    path: |
      frontend/node_modules
      ~/.cache/Cypress
    key: npm-cypress-${{ hashFiles('frontend/package-lock.json') }}
```

#### 3. **Tests Sélectifs**
```bash
# Tester seulement les changements
git diff --name-only main...HEAD | grep -E '\.(js|jsx)$'

# Tests par tag
npx cypress run --env grepTags=@smoke
```

### Maintenance des Tests

#### 1. **Données de Test Stables**
```javascript
// Utiliser des fixtures plutôt que des données dynamiques
cy.fixture('student-profile.json').then((profile) => {
  // Test avec données contrôlées
});
```

#### 2. **Sélecteurs Robustes**
```javascript
// ✅ Bon - data-testid
cy.get('[data-testid="login-button"]');

// ❌ À éviter - classes CSS
cy.get('.btn-primary');
```

#### 3. **Attentes Explicites**
```javascript
// ✅ Attendre explicitement
cy.get('[data-testid="loading"]').should('not.exist');
cy.get('[data-testid="content"]').should('be.visible');

// ❌ Attentes implicites
cy.wait(3000);
```

### Monitoring et Métriques

#### 1. **Dashboard Cypress**
```bash
# Enregistrer les tests sur Cypress Dashboard
npx cypress run --record --key YOUR_KEY
```

#### 2. **Métriques CI/CD**
- Temps d'exécution par test
- Taux de réussite par suite
- Tendances sur le temps

#### 3. **Alertes Automatiques**
```yaml
# Dans GitHub Actions - notification Slack/Teams
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: 'E2E Tests failed on ${{ github.ref }}'
```

---

## 🎯 Exemples d'Usage Avancés

### Test de Régression Automatique

```javascript
// cypress/e2e/regression.cy.js
describe('Regression Tests', () => {
  const criticalPaths = [
    '/login',
    '/student/dashboard', 
    '/student/chapters',
    '/admin/events'
  ];

  criticalPaths.forEach((path) => {
    it(`should load ${path} without errors`, () => {
      cy.visit(path);
      cy.get('body').should('be.visible');
      cy.get('[data-testid="error"]').should('not.exist');
    });
  });
});
```

### Test de Performance

```javascript
// cypress/e2e/performance.cy.js
describe('Performance Tests', () => {
  it('should load dashboard in under 3 seconds', () => {
    cy.loginAsStudent();
    
    const start = Date.now();
    cy.visit('/student/dashboard');
    cy.get('[data-testid="dashboard-loaded"]').should('be.visible');
    
    cy.then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3000);
    });
  });
});
```

### Test Multi-Device

```javascript
// cypress/e2e/responsive.cy.js
describe('Responsive Design Tests', () => {
  const devices = [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  devices.forEach((device) => {
    it(`should work on ${device.name}`, () => {
      cy.viewport(device.width, device.height);
      cy.visit('/student/dashboard');
      cy.get('[data-testid="responsive-nav"]').should('be.visible');
    });
  });
});
```

---

## 📞 Support et Contribution

### Contacts
- **Développeur Principal:** Prof. Alouaoui
- **Repository:** [alouaoui-school](https://github.com/inodev-web/alouaoui-school)
- **Documentation:** Ce guide + README.md

### Contribution aux Tests
1. Fork du repository
2. Création de nouveaux tests dans `frontend/cypress/e2e/`
3. Ajout de fixtures appropriées dans `frontend/cypress/fixtures/`
4. Test local avec `./scripts/run-e2e-tests.sh`
5. Pull Request avec description détaillée

### Mise à Jour de Ce Guide
Ce guide doit être maintenu à jour avec les évolutions du projet. Toute modification significative des tests ou de l'infrastructure CI/CD doit être documentée ici.

---

**🎉 Votre infrastructure de tests E2E est maintenant complètement opérationnelle !**