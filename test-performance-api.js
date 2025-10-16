/**
 * 📊 Tests de Performance API - Phase 8.1 (Corrigé)
 * 
 * Mesure les performances RÉELLES des endpoints API :
 * - Temps de réponse API
 * - Taille des payloads
 * - Performance backend (eager loading, cache)
 * 
 * Utilisation: node test-performance-api.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:8000/api';
const CREDENTIALS = {
  phone: '0555123456',
  password: 'password'
};

// Résultats
const results = {
  timestamp: new Date().toISOString(),
  endpoints: {},
  summary: {
    totalTests: 0,
    avgResponseTime: 0,
    totalPayloadSize: 0
  }
};

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

function logMetric(label, value, unit = '') {
  console.log(`  ${colors.cyan}${label}:${colors.reset} ${colors.green}${value}${unit}${colors.reset}`);
}

// Mesurer performance d'un endpoint
async function testEndpoint(name, method, url, data = null, headers = {}) {
  logSection(`📡 Test API: ${name}`);
  
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    // Calculer taille payload
    const payloadSize = JSON.stringify(response.data).length;
    const payloadKB = (payloadSize / 1024).toFixed(2);
    
    // Analyser structure de la réponse
    const dataCount = Array.isArray(response.data?.data) 
      ? response.data.data.length 
      : (response.data?.data ? 1 : 0);
    
    logMetric('✅ Status', response.status);
    logMetric('⏱️  Temps de réponse', responseTime, 'ms');
    logMetric('📏 Taille payload', payloadKB, ' KB');
    logMetric('📦 Items retournés', dataCount || 'N/A');
    
    // Vérifier eager loading (présence de relations)
    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      const hasRelations = Object.keys(firstItem).filter(key => 
        typeof firstItem[key] === 'object' && firstItem[key] !== null
      );
      
      if (hasRelations.length > 0) {
        logMetric('🔗 Relations chargées', hasRelations.join(', '));
        log('  ✅ Eager loading actif', 'green');
      } else {
        log('  ⚠️  Pas de relations détectées', 'yellow');
      }
    }
    
    results.endpoints[name] = {
      method,
      url,
      status: response.status,
      responseTime,
      payloadSize,
      payloadKB: parseFloat(payloadKB),
      dataCount,
      success: true
    };
    
    return { success: true, responseTime, payloadKB };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    log(`❌ Erreur: ${error.response?.status || error.message}`, 'red');
    
    if (error.response?.data) {
      console.log('  Détails:', error.response.data);
    }
    
    results.endpoints[name] = {
      method,
      url,
      status: error.response?.status || 'ERROR',
      responseTime,
      error: error.response?.data?.message || error.message,
      success: false
    };
    
    return { success: false, responseTime, error: error.message };
  }
}

// Tests principaux
async function runAPIPerformanceTests() {
  log('\n🚀 Tests de Performance API Backend', 'bright');
  log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`, 'cyan');
  log(`🌐 API URL: ${API_URL}\n`, 'cyan');
  
  let token = '';
  let deviceUuid = '';
  
  try {
    // ==================== AUTHENTICATION ====================
    logSection('🔐 Phase 1: Authentication');
    
    // Login
    deviceUuid = `test-device-${Date.now()}`;
    const loginResult = await testEndpoint(
      'Login',
      'POST',
      '/login',
      {
        phone: CREDENTIALS.phone,
        password: CREDENTIALS.password,
        device_uuid: deviceUuid
      }
    );
    
    if (!loginResult.success) {
      throw new Error('Login failed - cannot continue tests');
    }
    
    // Extraire token (simuler extraction du localStorage)
    const loginResponse = await axios.post(`${API_URL}/login`, {
      phone: CREDENTIALS.phone,
      password: CREDENTIALS.password,
      device_uuid: deviceUuid
    });
    
    token = loginResponse.data.token;
    log(`  🔑 Token reçu: ${token.substring(0, 20)}...`, 'cyan');
    
    // Headers authentifiés pour les prochaines requêtes
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'X-Device-UUID': deviceUuid
    };
    
    // ==================== DASHBOARD ENDPOINTS ====================
    logSection('📊 Phase 2: Dashboard Endpoints');
    
    await testEndpoint(
      'Dashboard Cards (Daily)',
      'GET',
      '/dashboard/data/cards?period=daily',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Dashboard Cards (Weekly)',
      'GET',
      '/dashboard/data/cards?period=weekly',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Dashboard Cards (Monthly)',
      'GET',
      '/dashboard/data/cards?period=monthly',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Top Teachers',
      'GET',
      '/dashboard/data/top-teachers',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Revenue Series',
      'GET',
      '/dashboard/data/revenue-series',
      null,
      authHeaders
    );
    
    // ==================== SESSIONS ENDPOINTS ====================
    logSection('📚 Phase 3: Sessions CRUD');
    
    await testEndpoint(
      'Sessions List (Page 1)',
      'GET',
      '/sessions?page=1',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Sessions with Filters',
      'GET',
      '/sessions?year_target=1AS&status=completed',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Sessions Search',
      'GET',
      '/sessions?search=math',
      null,
      authHeaders
    );
    
    // ==================== STUDENTS ENDPOINTS ====================
    logSection('👥 Phase 4: Students/Users CRUD');
    
    await testEndpoint(
      'Students List (50 per page)',
      'GET',
      '/users?role=student&per_page=50',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Students with Year Filter',
      'GET',
      '/users?role=student&year_of_study=1AS',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Students Search',
      'GET',
      '/users?role=student&search=anes',
      null,
      authHeaders
    );
    
    // ==================== TEACHERS ENDPOINTS ====================
    logSection('👨‍🏫 Phase 5: Teachers');
    
    await testEndpoint(
      'Teachers List',
      'GET',
      '/teachers',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Active Teachers',
      'GET',
      '/teachers/active',
      null,
      authHeaders
    );
    
    // ==================== CHECK-IN ENDPOINTS ====================
    logSection('✅ Phase 6: Check-in');
    
    await testEndpoint(
      'Today Stats',
      'GET',
      '/admin/checkin/attendance-stats',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Today Sessions',
      'GET',
      '/admin/checkin/today-sessions',
      null,
      authHeaders
    );
    
    // ==================== AUTRES ENDPOINTS ====================
    logSection('🔧 Phase 7: Autres Endpoints');
    
    await testEndpoint(
      'Branches List',
      'GET',
      '/branches',
      null,
      authHeaders
    );
    
    await testEndpoint(
      'Subscriptions Active',
      'GET',
      '/subscriptions/active',
      null,
      authHeaders
    );
    
    // ==================== RÉSUMÉ ====================
    logSection('📊 RÉSUMÉ GLOBAL');
    
    const successfulTests = Object.values(results.endpoints).filter(t => t.success);
    const failedTests = Object.values(results.endpoints).filter(t => !t.success);
    
    results.summary.totalTests = Object.keys(results.endpoints).length;
    results.summary.successfulTests = successfulTests.length;
    results.summary.failedTests = failedTests.length;
    
    if (successfulTests.length > 0) {
      const responseTimes = successfulTests.map(t => t.responseTime);
      const payloadSizes = successfulTests.map(t => t.payloadKB);
      
      results.summary.avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );
      results.summary.minResponseTime = Math.min(...responseTimes);
      results.summary.maxResponseTime = Math.max(...responseTimes);
      
      results.summary.totalPayloadKB = payloadSizes.reduce((a, b) => a + b, 0).toFixed(2);
      results.summary.avgPayloadKB = (payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length).toFixed(2);
    }
    
    console.log('\n📈 Statistiques Globales:');
    console.log('─'.repeat(70));
    logMetric('Total tests', results.summary.totalTests);
    logMetric('✅ Réussis', results.summary.successfulTests);
    logMetric('❌ Échoués', results.summary.failedTests);
    logMetric('⏱️  Temps moyen', results.summary.avgResponseTime, 'ms');
    logMetric('⚡ Temps minimum', results.summary.minResponseTime, 'ms');
    logMetric('🐌 Temps maximum', results.summary.maxResponseTime, 'ms');
    logMetric('📏 Payload total', results.summary.totalPayloadKB, ' KB');
    logMetric('📦 Payload moyen', results.summary.avgPayloadKB, ' KB');
    
    console.log('\n🎯 Performance par Catégorie:');
    console.log('─'.repeat(70));
    
    // Grouper par phase
    const phases = {
      'Dashboard': ['Dashboard Cards', 'Top Teachers', 'Revenue Series'],
      'Sessions': ['Sessions List', 'Sessions with Filters', 'Sessions Search'],
      'Students': ['Students List', 'Students with Year', 'Students Search'],
      'Teachers': ['Teachers List', 'Active Teachers'],
      'Check-in': ['Today Stats', 'Today Sessions']
    };
    
    Object.entries(phases).forEach(([phase, endpoints]) => {
      const phaseTests = Object.entries(results.endpoints)
        .filter(([name]) => endpoints.some(e => name.includes(e)))
        .map(([, data]) => data)
        .filter(t => t.success);
      
      if (phaseTests.length > 0) {
        const avgTime = Math.round(
          phaseTests.reduce((sum, t) => sum + t.responseTime, 0) / phaseTests.length
        );
        console.log(`\n${phase}:`);
        logMetric('  Temps moyen', avgTime, 'ms');
        logMetric('  Tests réussis', `${phaseTests.length}/${endpoints.length}`);
      }
    });
    
    // Identifier endpoints lents (> 500ms)
    const slowEndpoints = successfulTests.filter(t => t.responseTime > 500);
    
    if (slowEndpoints.length > 0) {
      console.log('\n⚠️  Endpoints Lents (> 500ms):');
      console.log('─'.repeat(70));
      slowEndpoints.forEach(endpoint => {
        const name = Object.keys(results.endpoints).find(
          key => results.endpoints[key] === endpoint
        );
        console.log(`  ${name}: ${endpoint.responseTime}ms`);
      });
    }
    
    // Sauvegarder JSON
    const jsonPath = path.join(__dirname, 'RESULTATS_PERFORMANCE_API.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    log(`\n💾 Rapport JSON: ${jsonPath}`, 'green');
    
    // Générer Markdown
    generateMarkdownReport();
    
  } catch (error) {
    log(`\n❌ Erreur fatale: ${error.message}`, 'red');
    console.error(error);
  }
  
  log('\n✅ Tests terminés!\n', 'bright');
}

// Générer rapport Markdown
function generateMarkdownReport() {
  const markdown = `# 📊 Résultats Tests Performance API
**Date:** ${new Date(results.timestamp).toLocaleString('fr-FR')}  
**Type:** Tests API Backend Directs

---

## 📈 Résumé Global

| Métrique | Valeur |
|----------|--------|
| **Total tests** | ${results.summary.totalTests} |
| **✅ Réussis** | ${results.summary.successfulTests} |
| **❌ Échoués** | ${results.summary.failedTests} |
| **⏱️ Temps moyen** | ${results.summary.avgResponseTime}ms |
| **⚡ Temps minimum** | ${results.summary.minResponseTime}ms |
| **🐌 Temps maximum** | ${results.summary.maxResponseTime}ms |
| **📏 Payload total** | ${results.summary.totalPayloadKB} KB |
| **📦 Payload moyen** | ${results.summary.avgPayloadKB} KB |

---

## 📊 Détails par Endpoint

${Object.entries(results.endpoints).map(([name, data]) => {
  if (!data.success) {
    return `### ❌ ${name}\n- **Status:** ${data.status}\n- **Erreur:** ${data.error}\n- **URL:** \`${data.method} ${data.url}\`\n`;
  }
  
  return `### ✅ ${name}
- **Temps de réponse:** ${data.responseTime}ms
- **Payload:** ${data.payloadKB} KB
- **Items:** ${data.dataCount || 'N/A'}
- **URL:** \`${data.method} ${data.url}\`
`;
}).join('\n')}

---

## 🎯 Objectifs de Performance

| Objectif | Cible | Réel | Status |
|----------|-------|------|--------|
| Temps moyen < 500ms | < 500ms | ${results.summary.avgResponseTime}ms | ${results.summary.avgResponseTime < 500 ? '✅' : '❌'} |
| Temps max < 1000ms | < 1000ms | ${results.summary.maxResponseTime}ms | ${results.summary.maxResponseTime < 1000 ? '✅' : '❌'} |
| Payload moyen < 100KB | < 100KB | ${results.summary.avgPayloadKB}KB | ${parseFloat(results.summary.avgPayloadKB) < 100 ? '✅' : '❌'} |
| Taux de succès > 95% | > 95% | ${((results.summary.successfulTests / results.summary.totalTests) * 100).toFixed(2)}% | ${(results.summary.successfulTests / results.summary.totalTests) > 0.95 ? '✅' : '❌'} |

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}  
**Outil:** Axios API Performance Tests
`;

  const mdPath = path.join(__dirname, 'RESULTATS_PERFORMANCE_API.md');
  fs.writeFileSync(mdPath, markdown);
  log(`📄 Rapport Markdown: ${mdPath}`, 'green');
}

// Lancer tests
runAPIPerformanceTests().catch(console.error);
