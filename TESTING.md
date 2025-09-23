# Alouaoui School Testing Suite

This document provides comprehensive testing instructions for both backend PHPUnit tests and frontend Cypress tests.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Testing (PHPUnit)](#backend-testing-phpunit)
3. [Frontend Testing (Cypress)](#frontend-testing-cypress)
4. [Test Coverage](#test-coverage)
5. [CI/CD Integration](#cicd-integration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Backend Requirements
- PHP 8.1+
- Composer
- SQLite or MySQL database
- Redis (for middleware tests)

### Frontend Requirements
- Node.js 16+
- npm or yarn
- Modern web browser (Chrome, Firefox, Edge)

## Backend Testing (PHPUnit)

### Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   composer install
   ```

3. **Setup test environment:**
   ```bash
   cp .env.example .env.testing
   ```

4. **Configure test database in `.env.testing`:**
   ```env
   DB_CONNECTION=sqlite
   DB_DATABASE=:memory:
   
   # For Redis tests
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   
   # Queue configuration
   QUEUE_CONNECTION=sync
   ```

5. **Generate application key:**
   ```bash
   php artisan key:generate --env=testing
   ```

### Running Tests

#### All Tests
```bash
php artisan test
```

#### Specific Test Files
```bash
# Authentication tests
php artisan test tests/Feature/AuthTest.php

# Subscription tests
php artisan test tests/Feature/SubscriptionTest.php

# Video access tests
php artisan test tests/Feature/VideoTest.php

# Payment tests
php artisan test tests/Feature/PaymentTest.php
```

#### Specific Test Methods
```bash
# Test user registration
php artisan test --filter test_user_can_register

# Test video upload
php artisan test --filter test_alouaoui_can_upload_video

# Test subscription approval
php artisan test --filter test_approve_subscription
```

#### Test Coverage
```bash
# Generate coverage report (requires Xdebug)
php artisan test --coverage-html coverage-report
```

#### Parallel Testing
```bash
# Run tests in parallel (faster execution)
php artisan test --parallel
```

### Test Categories

#### 1. Authentication Tests (`AuthTest.php`)
- User registration validation
- Login/logout functionality
- Password reset workflow
- Profile management
- Device management
- QR token generation
- Single device enforcement

#### 2. Subscription Tests (`SubscriptionTest.php`)
- Subscription creation
- Payment processing
- Approval/rejection workflow
- Access control middleware
- Subscription expiration
- Notification system

#### 3. Video Tests (`VideoTest.php`)
- Video upload (Alouaoui only)
- Video transcoding jobs
- Access control by subscription
- Free vs. premium content
- Video CRUD operations
- Search and pagination
- HLS streaming URLs

#### 4. Payment Tests (`PaymentTest.php`)
- Payment creation
- Approval workflow
- Webhook processing
- Payment history
- Filtering and reports
- Notification system

### Mock Data and Fixtures

Tests use Laravel factories and seeders:

```bash
# Create test users
User::factory()->student()->create()
User::factory()->teacher()->alouaoui()->create()

# Create test subscriptions
Subscription::factory()->active()->create()
Subscription::factory()->expired()->create()

# Create test videos
Video::factory()->completed()->create()
Video::factory()->processing()->create()
```

## Frontend Testing (Cypress)

### Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Cypress:**
   ```bash
   npm install cypress --save-dev
   ```

### Configuration

The `cypress.config.js` file contains:
- Base URL configuration
- API endpoint configuration
- Viewport settings
- Test timeouts
- Video recording settings

### Running Tests

#### Interactive Mode (Cypress Test Runner)
```bash
# Open Cypress Test Runner
npm run cy:open
```

#### Headless Mode
```bash
# Run all tests
npm run cy:run

# Run specific test file
npm run test:auth
npm run test:checkout
npm run test:video
npm run test:scanner

# Run on different browsers
npm run cy:run:chrome
npm run cy:run:firefox
npm run cy:run:edge
```

#### Device Testing
```bash
# Mobile viewport
npm run test:mobile

# Tablet viewport
npm run test:tablet
```

### Test Categories

#### 1. Authentication Tests (`auth.cy.js`)
- User registration flow
- Login/logout functionality
- Form validation
- Session management
- Profile updates
- QR code generation
- Password reset

Example test:
```javascript
describe('User Login', () => {
  it('should allow valid user login', () => {
    cy.visit('/login')
    cy.get('[data-cy=email-input]').type('student@example.com')
    cy.get('[data-cy=password-input]').type('password123')
    cy.get('[data-cy=login-button]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-name]').should('be.visible')
  })
})
```

#### 2. Checkout and Payment Tests (`checkout.cy.js`)
- Subscription plan selection
- Payment method integration
- CCP payment workflow
- Edahabia payment gateway
- Payment approval (teacher view)
- Subscription management
- Payment notifications

#### 3. Video Player Tests (`video-player.cy.js`)
- HLS.js player initialization
- Video controls (play, pause, seek)
- Quality selection
- Speed control
- Fullscreen mode
- Access control enforcement
- Progress tracking
- Bookmark functionality

#### 4. QR Scanner Tests (`qr-scanner.cy.js`)
- Camera initialization
- QR code detection
- Student verification
- Attendance tracking
- Location validation
- Security measures
- Mobile optimization

### Custom Commands

The test suite includes custom Cypress commands in `cypress/support/commands.js`:

```javascript
// Login helpers
cy.loginAsStudent()
cy.loginAsTeacher()

// Test data management
cy.createTestUser()
cy.clearTestData()

// Video testing
cy.waitForVideoLoad()

// File uploads
cy.uploadFile('[data-cy=file-input]', 'test-file.jpg')
```

### Test Data Attributes

All interactive elements should have `data-cy` attributes for reliable testing:

```html
<!-- Good -->
<button data-cy="login-button">Login</button>
<input data-cy="email-input" type="email">

<!-- Avoid -->
<button id="btn-login">Login</button>
<input class="email-field" type="email">
```

## Test Coverage

### Backend Coverage Goals
- **Unit Tests**: 90%+ code coverage
- **Feature Tests**: Cover all API endpoints
- **Integration Tests**: Test middleware and jobs

### Frontend Coverage Goals
- **E2E Tests**: Cover all user workflows
- **Component Tests**: Critical UI components
- **API Integration**: All frontend-backend interactions

### Generating Reports

#### Backend
```bash
# PHPUnit coverage report
php artisan test --coverage-html reports/backend

# Open report
open reports/backend/index.html
```

#### Frontend
```bash
# Cypress coverage (with cypress-code-coverage plugin)
npm run cy:run
open coverage/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
      - name: Install dependencies
        run: composer install
      - name: Run tests
        run: php artisan test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run Cypress tests
        run: npm run cy:run
```

### Docker Testing Environment

```dockerfile
# Dockerfile.testing
FROM cypress/browsers:latest

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
CMD ["npm", "run", "cy:run"]
```

## Troubleshooting

### Common Backend Issues

#### 1. Database Connection Errors
```bash
# Check database configuration
php artisan config:cache
php artisan migrate --env=testing
```

#### 2. Redis Connection Issues
```bash
# Start Redis server
redis-server
# Or use array driver for testing
REDIS_CLIENT=predis
```

#### 3. Queue Job Failures
```bash
# Use sync driver for testing
QUEUE_CONNECTION=sync
```

### Common Frontend Issues

#### 1. Cypress Installation Problems
```bash
# Clear Cypress cache
npx cypress cache clear
npx cypress install
```

#### 2. Browser Launch Issues
```bash
# Install system dependencies (Linux)
sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

#### 3. Test Flakiness
- Use `cy.wait()` judiciously
- Implement proper data-cy attributes
- Mock external API calls
- Use `cy.intercept()` for API mocking

#### 4. Video Element Testing
```javascript
// Wait for video to be ready
cy.get('video').should('have.prop', 'readyState', 4) // HAVE_ENOUGH_DATA
```

#### 5. Camera/Media Device Testing
```javascript
// Mock camera access
cy.window().then((win) => {
  cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves(mockStream)
})
```

### Performance Optimization

#### Backend
- Use database transactions for test isolation
- Implement parallel test execution
- Cache configuration and routes

#### Frontend
- Use `cy.intercept()` to mock API calls
- Minimize actual HTTP requests
- Use fixtures for test data
- Implement proper waiting strategies

### Best Practices

#### Backend Testing
1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear test method names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Services**: Don't depend on external APIs
5. **Test Edge Cases**: Cover error scenarios

#### Frontend Testing
1. **User-Centric**: Test from user's perspective
2. **Reliable Selectors**: Use data-cy attributes
3. **Avoid Brittle Tests**: Don't depend on exact text content
4. **Test Real Interactions**: Avoid shortcuts in user flows
5. **Cross-Browser Testing**: Test on multiple browsers

### Debugging Tests

#### Backend
```bash
# Run with verbose output
php artisan test --verbose

# Debug specific test
php artisan test --filter test_name --stop-on-failure
```

#### Frontend
```bash
# Run with browser visible
npm run cy:run:headed

# Debug mode
npm run cy:open
# Then use browser dev tools
```

## Continuous Improvement

### Monitoring Test Health
- Track test execution time
- Monitor flaky tests
- Maintain test documentation
- Regular test review sessions

### Adding New Tests
1. **Identify Test Scenarios**: What needs testing?
2. **Write Test Cases**: Start with happy path
3. **Add Edge Cases**: Error conditions and boundary cases
4. **Review and Refactor**: Keep tests maintainable
5. **Document**: Update test documentation

This comprehensive testing suite ensures the reliability and quality of the Alouaoui School platform across all user interactions and system functionality.