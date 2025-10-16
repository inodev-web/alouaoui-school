/**
 * 📊 Tests de Performance Automatisés - Phase 8.1
 * 
 * Mesure automatiquement :
 * - Temps de chargement Dashboard, Sessions, Students
 * - Nombre de requêtes réseau
 * - Cache hits (304)
 * - Debouncing des filtres
 * - Screenshots before/after
 * 
 * Prérequis: npm install puppeteer
 * Utilisation: node test-performance-devtools.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000/api';
const CREDENTIALS = {
  phone: '0555123456',
  password: '123456789'
};

// Résultats
const results = {
  timestamp: new Date().toISOString(),
  dashboard: {},
  sessions: {},
  students: {},
  cache: {},
  debouncing: {},
  screenshots: []
};

// Couleurs pour console
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
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logMetric(label, value, unit = '') {
  console.log(`  ${colors.cyan}${label}:${colors.reset} ${colors.green}${value}${unit}${colors.reset}`);
}

// Créer dossier screenshots
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Fonction pour mesurer performance d'une page
async function measurePagePerformance(page, pageName, url) {
  logSection(`📊 Test Performance: ${pageName}`);
  
  const requests = [];
  const apiRequests = [];
  
  // Intercepter toutes les requêtes
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
    
    if (request.url().startsWith(API_URL)) {
      apiRequests.push(request.url());
    }
  });
  
  const responses = [];
  const cacheHits = [];
  
  // Intercepter toutes les réponses
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      fromCache: response.fromCache(),
      fromServiceWorker: response.fromServiceWorker()
    });
    
    if (response.status() === 304 || response.fromCache()) {
      cacheHits.push(response.url());
    }
  });
  
  // Mesurer temps de chargement
  const startTime = Date.now();
  
  await page.goto(url, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  const loadTime = Date.now() - startTime;
  
  // Attendre que le contenu soit chargé
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mesurer métriques de performance
  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
    };
  });
  
  // Screenshot
  const screenshotPath = path.join(screenshotsDir, `${pageName.toLowerCase().replace(/ /g, '-')}-loaded.png`);
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  results.screenshots.push(screenshotPath);
  
  // Afficher résultats
  logMetric('⏱️  Temps de chargement total', loadTime, 'ms');
  logMetric('📦 Nombre total de requêtes', requests.length);
  logMetric('🌐 Requêtes API', apiRequests.length);
  logMetric('💾 Cache hits (304/from cache)', cacheHits.length);
  logMetric('🎨 First Paint', Math.round(metrics.firstPaint), 'ms');
  logMetric('📄 First Contentful Paint', Math.round(metrics.firstContentfulPaint), 'ms');
  logMetric('⚡ DOM Interactive', Math.round(metrics.domInteractive), 'ms');
  
  // Vérifier cache localStorage
  const cacheInfo = await page.evaluate(() => {
    const cacheKeys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
    return {
      keys: cacheKeys,
      count: cacheKeys.length,
      sizes: cacheKeys.map(k => ({
        key: k,
        size: localStorage.getItem(k)?.length || 0
      }))
    };
  });
  
  if (cacheInfo.count > 0) {
    logMetric('📦 Cache localStorage actifs', cacheInfo.count);
    cacheInfo.keys.forEach(key => {
      const sizeKB = (cacheInfo.sizes.find(s => s.key === key)?.size || 0) / 1024;
      console.log(`     - ${key}: ${sizeKB.toFixed(2)} KB`);
    });
  }
  
  return {
    pageName,
    loadTime,
    totalRequests: requests.length,
    apiRequests: apiRequests.length,
    cacheHits: cacheHits.length,
    cacheHitRate: ((cacheHits.length / requests.length) * 100).toFixed(2),
    metrics,
    screenshot: screenshotPath,
    apiRequestsList: apiRequests.slice(0, 10) // Premier 10 pour log
  };
}

// Test debouncing sur recherche
async function testDebouncing(page) {
  logSection('🔍 Test Debouncing - Search Filter');
  
  const requests = [];
  
  // Intercepter requêtes API
  page.on('request', request => {
    if (request.url().includes('/api/sessions') && request.url().includes('search=')) {
      requests.push({
        url: request.url(),
        timestamp: Date.now()
      });
    }
  });
  
  // Naviguer vers Sessions
  await page.goto(`${BASE_URL}/sessions`, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Trouver input de recherche
  const searchInput = await page.$('input[type="text"][placeholder*="Rechercher"], input[type="search"]');
  
  if (!searchInput) {
    log('⚠️  Input de recherche non trouvé', 'yellow');
    return { success: false };
  }
  
  // Taper lentement "math"
  const searchTerm = 'mathematics';
  const typingStart = Date.now();
  
  for (const char of searchTerm) {
    await searchInput.type(char);
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms entre chaque lettre
  }
  
  const typingEnd = Date.now();
  
  // Attendre 500ms après dernière frappe (debounce = 300ms)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Analyser résultats
  const requestCount = requests.length;
  const typingDuration = typingEnd - typingStart;
  
  logMetric('⌨️  Caractères tapés', searchTerm.length);
  logMetric('⏱️  Durée de frappe', typingDuration, 'ms');
  logMetric('📡 Requêtes API déclenchées', requestCount);
  
  if (requestCount === 0) {
    log('❌ Aucune requête déclenchée - possiblement pas de debounce', 'red');
  } else if (requestCount === 1) {
    log('✅ Debouncing fonctionne parfaitement (1 seule requête)', 'green');
  } else {
    log(`⚠️  ${requestCount} requêtes déclenchées - debouncing partiel ou désactivé`, 'yellow');
  }
  
  // Screenshot
  const screenshotPath = path.join(screenshotsDir, 'debouncing-search-test.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  results.screenshots.push(screenshotPath);
  
  return {
    success: true,
    searchTerm,
    requestCount,
    typingDuration,
    debouncingWorks: requestCount <= 1,
    screenshot: screenshotPath
  };
}

// Test cache hit sur rechargement
async function testCacheHit(page, url, pageName) {
  logSection(`💾 Test Cache Hit: ${pageName}`);
  
  // Première visite (cold load)
  log('🔵 Cold Load (première visite)...', 'blue');
  const coldLoadStart = Date.now();
  
  const coldRequests = [];
  page.on('request', req => coldRequests.push(req.url()));
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const coldLoadTime = Date.now() - coldLoadStart;
  const coldApiRequests = coldRequests.filter(r => r.startsWith(API_URL)).length;
  
  logMetric('⏱️  Temps cold load', coldLoadTime, 'ms');
  logMetric('📡 Requêtes API', coldApiRequests);
  
  // Screenshot cold load
  const coldScreenshot = path.join(screenshotsDir, `${pageName.toLowerCase().replace(/ /g, '-')}-cold-load.png`);
  await page.screenshot({ path: coldScreenshot, fullPage: true });
  results.screenshots.push(coldScreenshot);
  
  // Deuxième visite (cache hit)
  log('🟢 Cache Hit (deuxième visite)...', 'green');
  
  const cacheRequests = [];
  const cacheHits = [];
  
  page.removeAllListeners('request');
  page.removeAllListeners('response');
  
  page.on('request', req => cacheRequests.push(req.url()));
  page.on('response', res => {
    if (res.status() === 304 || res.fromCache()) {
      cacheHits.push(res.url());
    }
  });
  
  const cacheLoadStart = Date.now();
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const cacheLoadTime = Date.now() - cacheLoadStart;
  const cacheApiRequests = cacheRequests.filter(r => r.startsWith(API_URL)).length;
  
  logMetric('⏱️  Temps cache hit', cacheLoadTime, 'ms');
  logMetric('📡 Requêtes API', cacheApiRequests);
  logMetric('💾 Cache hits détectés', cacheHits.length);
  
  // Screenshot cache hit
  const cacheScreenshot = path.join(screenshotsDir, `${pageName.toLowerCase().replace(/ /g, '-')}-cache-hit.png`);
  await page.screenshot({ path: cacheScreenshot, fullPage: true });
  results.screenshots.push(cacheScreenshot);
  
  // Calculer amélioration
  const improvement = ((coldLoadTime - cacheLoadTime) / coldLoadTime * 100).toFixed(2);
  
  log(`\n🎯 Amélioration avec cache: ${improvement}%`, 'bright');
  
  return {
    pageName,
    coldLoad: {
      time: coldLoadTime,
      apiRequests: coldApiRequests,
      screenshot: coldScreenshot
    },
    cacheHit: {
      time: cacheLoadTime,
      apiRequests: cacheApiRequests,
      cacheHits: cacheHits.length,
      screenshot: cacheScreenshot
    },
    improvement: parseFloat(improvement)
  };
}

// Fonction principale
async function runPerformanceTests() {
  log('\n🚀 Démarrage des Tests de Performance Automatisés', 'bright');
  log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`, 'cyan');
  log(`🌐 Base URL: ${BASE_URL}`, 'cyan');
  log(`📡 API URL: ${API_URL}\n`, 'cyan');
  
  const browser = await puppeteer.launch({
    headless: false, // Mode visible pour debug
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Activer cache
  await page.setCacheEnabled(true);
  
  try {
    // LOGIN
    logSection('🔐 Connexion Admin');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    await page.type('input[name="phone"]', CREDENTIALS.phone);
    await page.type('input[name="password"]', CREDENTIALS.password);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    log('✅ Connexion réussie', 'green');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // TEST 1: Dashboard Performance
    const dashboardResults = await measurePagePerformance(
      page,
      'Dashboard',
      `${BASE_URL}/dashboard`
    );
    results.dashboard = dashboardResults;
    
    // TEST 2: Dashboard Cache Hit
    const dashboardCache = await testCacheHit(page, `${BASE_URL}/dashboard`, 'Dashboard');
    results.cache.dashboard = dashboardCache;
    
    // TEST 3: Sessions Performance
    const sessionsResults = await measurePagePerformance(
      page,
      'Sessions',
      `${BASE_URL}/sessions`
    );
    results.sessions = sessionsResults;
    
    // TEST 4: Sessions Cache Hit
    const sessionsCache = await testCacheHit(page, `${BASE_URL}/sessions`, 'Sessions');
    results.cache.sessions = sessionsCache;
    
    // TEST 5: Debouncing Test
    const debouncingResults = await testDebouncing(page);
    results.debouncing = debouncingResults;
    
    // TEST 6: Students Performance
    const studentsResults = await measurePagePerformance(
      page,
      'Students',
      `${BASE_URL}/users`
    );
    results.students = studentsResults;
    
    // TEST 7: Students Cache Hit
    const studentsCache = await testCacheHit(page, `${BASE_URL}/users`, 'Students');
    results.cache.students = studentsCache;
    
    // RÉSUMÉ FINAL
    logSection('📊 RÉSUMÉ GLOBAL DES PERFORMANCES');
    
    console.log('\n📄 PAGES');
    console.log('─'.repeat(60));
    
    [results.dashboard, results.sessions, results.students].forEach(result => {
      console.log(`\n${result.pageName}:`);
      logMetric('  Temps chargement', result.loadTime, 'ms');
      logMetric('  Requêtes totales', result.totalRequests);
      logMetric('  Requêtes API', result.apiRequests);
      logMetric('  Cache hit rate', result.cacheHitRate, '%');
      logMetric('  FCP', Math.round(result.metrics.firstContentfulPaint), 'ms');
    });
    
    console.log('\n💾 CACHE PERFORMANCE');
    console.log('─'.repeat(60));
    
    Object.values(results.cache).forEach(cache => {
      console.log(`\n${cache.pageName}:`);
      logMetric('  Cold Load', cache.coldLoad.time, 'ms');
      logMetric('  Cache Hit', cache.cacheHit.time, 'ms');
      logMetric('  Amélioration', cache.improvement, '%');
      logMetric('  Cache hits détectés', cache.cacheHit.cacheHits);
    });
    
    console.log('\n🔍 DEBOUNCING');
    console.log('─'.repeat(60));
    logMetric('Requêtes déclenchées', results.debouncing.requestCount);
    logMetric('Status', results.debouncing.debouncingWorks ? '✅ Actif' : '❌ Inactif');
    
    console.log('\n📸 SCREENSHOTS');
    console.log('─'.repeat(60));
    results.screenshots.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });
    
    // Sauvegarder résultats JSON
    const reportPath = path.join(__dirname, 'RESULTATS_PERFORMANCE_DEVTOOLS.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`\n💾 Rapport JSON sauvegardé: ${reportPath}`, 'green');
    
    // Générer rapport Markdown
    generateMarkdownReport(results);
    
  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await browser.close();
    log('\n✅ Tests terminés!', 'bright');
  }
}

// Générer rapport Markdown
function generateMarkdownReport(results) {
  const reportPath = path.join(__dirname, 'RESULTATS_PERFORMANCE_DEVTOOLS.md');
  
  const markdown = `# 📊 Résultats Tests Performance DevTools
**Date:** ${new Date(results.timestamp).toLocaleString('fr-FR')}  
**Testeur:** Tests Automatisés (Puppeteer)

---

## Dashboard

### Performance Initiale
- ⏱️ Temps total: **${results.dashboard.loadTime}ms**
- 📦 Nombre requêtes: **${results.dashboard.totalRequests}**
- 🌐 Requêtes API: **${results.dashboard.apiRequests}**
- 📏 FCP: **${Math.round(results.dashboard.metrics.firstContentfulPaint)}ms**

### Cache Performance
- ⏱️ Cold Load: **${results.cache.dashboard.coldLoad.time}ms**
- ⏱️ Cache Hit: **${results.cache.dashboard.cacheHit.time}ms**
- 💾 Cache hits: **${results.cache.dashboard.cacheHit.cacheHits}**
- 🎯 Amélioration: **${results.cache.dashboard.improvement}%**

### Screenshots
- Cold Load: \`${path.basename(results.cache.dashboard.coldLoad.screenshot)}\`
- Cache Hit: \`${path.basename(results.cache.dashboard.cacheHit.screenshot)}\`

---

## Sessions

### Performance Initiale
- ⏱️ Temps total: **${results.sessions.loadTime}ms**
- 📦 Nombre requêtes: **${results.sessions.totalRequests}**
- 🌐 Requêtes API: **${results.sessions.apiRequests}**
- 📏 FCP: **${Math.round(results.sessions.metrics.firstContentfulPaint)}ms**

### Cache Performance
- ⏱️ Cold Load: **${results.cache.sessions.coldLoad.time}ms**
- ⏱️ Cache Hit: **${results.cache.sessions.cacheHit.time}ms**
- 💾 Cache hits: **${results.cache.sessions.cacheHit.cacheHits}**
- 🎯 Amélioration: **${results.cache.sessions.improvement}%**

### Debouncing
- ⌨️ Recherche testée: "${results.debouncing.searchTerm}"
- 📡 Requêtes déclenchées: **${results.debouncing.requestCount}**
- ✅ Status: **${results.debouncing.debouncingWorks ? 'Actif' : 'Inactif'}**

### Screenshots
- Cold Load: \`${path.basename(results.cache.sessions.coldLoad.screenshot)}\`
- Cache Hit: \`${path.basename(results.cache.sessions.cacheHit.screenshot)}\`
- Debouncing: \`${path.basename(results.debouncing.screenshot)}\`

---

## Students

### Performance Initiale
- ⏱️ Temps total: **${results.students.loadTime}ms**
- 📦 Nombre requêtes: **${results.students.totalRequests}**
- 🌐 Requêtes API: **${results.students.apiRequests}**
- 📏 FCP: **${Math.round(results.students.metrics.firstContentfulPaint)}ms**

### Cache Performance
- ⏱️ Cold Load: **${results.cache.students.coldLoad.time}ms**
- ⏱️ Cache Hit: **${results.cache.students.cacheHit.time}ms**
- 💾 Cache hits: **${results.cache.students.cacheHit.cacheHits}**
- 🎯 Amélioration: **${results.cache.students.improvement}%**

### Screenshots
- Cold Load: \`${path.basename(results.cache.students.coldLoad.screenshot)}\`
- Cache Hit: \`${path.basename(results.cache.students.cacheHit.screenshot)}\`

---

## 🎯 Validation Finale

${results.dashboard.loadTime < 1000 ? '- [x]' : '- [ ]'} ✅ Dashboard cold load < 1000ms
${results.cache.dashboard.cacheHit.time < 500 ? '- [x]' : '- [ ]'} ✅ Dashboard cache hit < 500ms
${parseFloat(results.dashboard.cacheHitRate) > 50 ? '- [x]' : '- [ ]'} ✅ Cache hit rate > 50%
${results.debouncing.debouncingWorks ? '- [x]' : '- [ ]'} ✅ Debouncing fonctionne
${results.sessions.apiRequests < 10 ? '- [x]' : '- [ ]'} ✅ Sessions API requests < 10
${results.students.loadTime < 2000 ? '- [x]' : '- [ ]'} ✅ Students load time < 2000ms

---

## 📸 Tous les Screenshots

${results.screenshots.map((s, i) => `${i + 1}. \`${path.basename(s)}\``).join('\n')}

---

**Rapport généré automatiquement le:** ${new Date().toLocaleString('fr-FR')}  
**Outil:** Puppeteer Performance Tests
`;

  fs.writeFileSync(reportPath, markdown);
  log(`📄 Rapport Markdown généré: ${reportPath}`, 'green');
}

// Lancer les tests
runPerformanceTests().catch(console.error);
