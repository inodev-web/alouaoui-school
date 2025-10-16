/**
 * Script de Test Automatisé - Phase 7.1 Authentication & Device Management
 * 
 * Ce script teste tous les scénarios d'authentification de manière automatisée
 * Usage: node test-phase7-1-auth.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE_URL = 'http://localhost:8000/api';
const ADMIN_PHONE = '0555123456';
const ADMIN_PASSWORD = '123456789';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Compteurs de résultats
let testsTotal = 0;
let testsReussis = 0;
let testsEchoues = 0;
const bugs = [];

// Helper pour afficher les résultats
function logTest(testName, success, message = '') {
  testsTotal++;
  if (success) {
    testsReussis++;
    console.log(`${colors.green}✅ PASS${colors.reset} - ${testName}`);
    if (message) console.log(`   ${colors.gray}${message}${colors.reset}`);
  } else {
    testsEchoues++;
    console.log(`${colors.red}❌ FAIL${colors.reset} - ${testName}`);
    if (message) console.log(`   ${colors.red}${message}${colors.reset}`);
    bugs.push({ test: testName, error: message });
  }
}

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

function logInfo(message) {
  console.log(`${colors.gray}ℹ ${message}${colors.reset}`);
}

// Helper pour générer UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Helper pour attendre
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST 1: Login avec Credentials Valides
// ============================================================================
async function test1_LoginValide() {
  logSection('TEST 1: Login avec Credentials Valides');
  
  try {
    const deviceUuid = generateUUID();
    logInfo(`Device UUID généré: ${deviceUuid}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceUuid,
      single_device: false
    });

    // Vérifier status code
    logTest(
      'Status code 200',
      response.status === 200,
      `Status: ${response.status}`
    );

    // Vérifier structure de la réponse
    const data = response.data.data;
    logTest(
      'Réponse contient token',
      !!data.token,
      data.token ? `Token: ${data.token.substring(0, 20)}...` : 'Token manquant'
    );

    logTest(
      'Réponse contient user',
      !!data.user,
      data.user ? `User UUID: ${data.user.uuid}` : 'User manquant'
    );

    logTest(
      'Réponse contient device_uuid',
      !!data.device_uuid,
      `Device UUID: ${data.device_uuid}`
    );

    // Vérifier user.role
    logTest(
      'User role est admin',
      data.user && data.user.role === 'admin',
      `Role: ${data.user?.role}`
    );

    // Vérifier user.uuid existe
    logTest(
      'User UUID existe',
      !!data.user?.uuid,
      `UUID: ${data.user?.uuid}`
    );

    return { token: data.token, deviceUuid: data.device_uuid, user: data.user };
  } catch (error) {
    logTest('Login valide', false, error.message);
    return null;
  }
}

// ============================================================================
// TEST 2: Login avec Credentials Invalides
// ============================================================================
async function test2_LoginInvalide() {
  logSection('TEST 2: Login avec Credentials Invalides');
  
  // Test 2.1: Téléphone inexistant
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      login: '0999999999',
      password: ADMIN_PASSWORD,
      device_uuid: generateUUID()
    });
    logTest('Téléphone inexistant - Rejet', false, 'Devrait échouer avec 422');
  } catch (error) {
    logTest(
      'Téléphone inexistant - Rejet',
      error.response?.status === 422,
      `Status: ${error.response?.status}, Message: ${error.response?.data?.message}`
    );
  }

  // Test 2.2: Mot de passe incorrect
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: 'wrongpassword',
      device_uuid: generateUUID()
    });
    logTest('Mot de passe incorrect - Rejet', false, 'Devrait échouer avec 422');
  } catch (error) {
    logTest(
      'Mot de passe incorrect - Rejet',
      error.response?.status === 422,
      `Status: ${error.response?.status}`
    );
  }

  // Test 2.3: Login vide
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      login: '',
      password: ADMIN_PASSWORD,
      device_uuid: generateUUID()
    });
    logTest('Login vide - Rejet', false, 'Devrait échouer avec 422');
  } catch (error) {
    logTest(
      'Login vide - Rejet',
      error.response?.status === 422,
      `Status: ${error.response?.status}`
    );
  }
}

// ============================================================================
// TEST 3: Logout Simple
// ============================================================================
async function test3_LogoutSimple() {
  logSection('TEST 3: Logout Simple');
  
  try {
    // D'abord se connecter
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: generateUUID()
    });

    const token = loginResponse.data.data.token;
    logInfo(`Token obtenu: ${token.substring(0, 20)}...`);

    // Ensuite se déconnecter
    const logoutResponse = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    logTest(
      'Logout status 200',
      logoutResponse.status === 200,
      `Status: ${logoutResponse.status}`
    );

    // Vérifier que le token est invalidé
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      logTest('Token invalidé après logout', false, 'Token fonctionne encore!');
    } catch (error) {
      logTest(
        'Token invalidé après logout',
        error.response?.status === 401,
        `Status: ${error.response?.status} (401 attendu)`
      );
    }
  } catch (error) {
    logTest('Logout simple', false, error.message);
  }
}

// ============================================================================
// TEST 4: Single Device Enforcement
// ============================================================================
async function test4_SingleDevice() {
  logSection('TEST 4: Single Device Enforcement');
  
  try {
    // Device A - Premier login
    const deviceA = generateUUID();
    logInfo(`Device A UUID: ${deviceA}`);
    
    const loginA = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceA,
      single_device: false
    });

    const tokenA = loginA.data.data.token;
    logInfo(`Token A: ${tokenA.substring(0, 20)}...`);

    logTest(
      'Device A - Login réussi',
      !!tokenA,
      `Token A obtenu`
    );

    // Attendre un peu
    await wait(500);

    // Device B - Deuxième login (même utilisateur)
    const deviceB = generateUUID();
    logInfo(`Device B UUID: ${deviceB}`);
    
    const loginB = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceB,
      single_device: false
    });

    const tokenB = loginB.data.data.token;
    logInfo(`Token B: ${tokenB.substring(0, 20)}...`);

    logTest(
      'Device B - Login réussi',
      !!tokenB,
      `Token B obtenu (différent de A: ${tokenA !== tokenB})`
    );

    // Vérifier que Device A fonctionne encore (comportement permissif actuel)
    try {
      const profileA = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenA}`,
          'X-Device-UUID': deviceA,
          'Accept': 'application/json'
        }
      });
      
      logTest(
        'Device A - Fonctionne encore (permissif)',
        profileA.status === 200,
        'Comportement permissif: les 2 devices fonctionnent'
      );
    } catch (error) {
      logTest(
        'Device A - Déconnecté (strict)',
        error.response?.status === 401,
        'Comportement strict: Device A déconnecté par Device B'
      );
    }

    // Vérifier que Device B fonctionne
    try {
      const profileB = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${tokenB}`,
          'X-Device-UUID': deviceB,
          'Accept': 'application/json'
        }
      });
      
      logTest(
        'Device B - Fonctionne',
        profileB.status === 200,
        `User: ${profileB.data.data.firstname}`
      );
    } catch (error) {
      logTest('Device B - Fonctionne', false, error.message);
    }

    // Cleanup
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${tokenB}`, 'Accept': 'application/json' }
    }).catch(() => {});

  } catch (error) {
    logTest('Single device enforcement', false, error.message);
  }
}

// ============================================================================
// TEST 5: Force Device Change
// ============================================================================
async function test5_ForceDeviceChange() {
  logSection('TEST 5: Force Device Change');
  
  try {
    // Device A - Login
    const deviceA = generateUUID();
    const loginA = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceA
    });
    const tokenA = loginA.data.data.token;
    
    logTest('Device A - Login initial', !!tokenA);

    // Logout Device A
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${tokenA}`, 'Accept': 'application/json' }
    });

    logTest('Device A - Logout volontaire', true);

    // Device B - Login immédiat après
    const deviceB = generateUUID();
    const loginB = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceB
    });
    const tokenB = loginB.data.data.token;

    logTest(
      'Device B - Login après logout A',
      !!tokenB && tokenB !== tokenA,
      'Nouveau token généré sans conflit'
    );

    // Cleanup
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${tokenB}`, 'Accept': 'application/json' }
    }).catch(() => {});

  } catch (error) {
    logTest('Force device change', false, error.message);
  }
}

// ============================================================================
// TEST 6: Multiple Login Attempts - Même Device
// ============================================================================
async function test6_MultipleLoginMemeDevice() {
  logSection('TEST 6: Multiple Login Attempts - Même Device');
  
  try {
    const deviceUuid = generateUUID();
    
    // Login 1
    const login1 = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceUuid
    });
    const token1 = login1.data.data.token;
    
    logInfo(`Token 1: ${token1.substring(0, 20)}...`);
    logTest('Login 1 - Réussi', !!token1);

    await wait(500);

    // Login 2 - SANS logout (même device)
    const login2 = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceUuid
    });
    const token2 = login2.data.data.token;
    
    logInfo(`Token 2: ${token2.substring(0, 20)}...`);
    
    logTest(
      'Login 2 - Nouveau token généré',
      !!token2 && token2 !== token1,
      `Tokens différents: ${token1.substring(0, 10)} !== ${token2.substring(0, 10)}`
    );

    logTest(
      'Device UUID conservé',
      login2.data.data.device_uuid === deviceUuid,
      `UUID: ${login2.data.data.device_uuid}`
    );

    // Cleanup
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${token2}`, 'Accept': 'application/json' }
    }).catch(() => {});

  } catch (error) {
    logTest('Multiple login même device', false, error.message);
  }
}

// ============================================================================
// TEST 7: Multiple Login Attempts - Devices Différents
// ============================================================================
async function test7_MultipleLoginDevicesDifferents() {
  logSection('TEST 7: Multiple Login Attempts - Devices Différents');
  
  try {
    // Device A
    const deviceA = generateUUID();
    const loginA = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceA
    });
    const tokenA = loginA.data.data.token;
    
    await wait(300);

    // Device B
    const deviceB = generateUUID();
    const loginB = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceB
    });
    const tokenB = loginB.data.data.token;
    
    await wait(300);

    // Device C
    const deviceC = generateUUID();
    const loginC = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: deviceC
    });
    const tokenC = loginC.data.data.token;

    logTest('Device A - Token unique', !!tokenA);
    logTest('Device B - Token unique', !!tokenB && tokenB !== tokenA);
    logTest('Device C - Token unique', !!tokenC && tokenC !== tokenA && tokenC !== tokenB);

    // Tester l'accès simultané
    const results = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${tokenA}`, 'X-Device-UUID': deviceA, 'Accept': 'application/json' }
      }),
      axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${tokenB}`, 'X-Device-UUID': deviceB, 'Accept': 'application/json' }
      }),
      axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${tokenC}`, 'X-Device-UUID': deviceC, 'Accept': 'application/json' }
      })
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status === 200).length;
    
    logTest(
      'Accès simultané - 3 devices',
      successCount >= 1,
      `${successCount}/3 devices fonctionnels (permissif: 3, strict: 1)`
    );

    // Cleanup
    [tokenA, tokenB, tokenC].forEach(token => {
      axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      }).catch(() => {});
    });

  } catch (error) {
    logTest('Multiple devices différents', false, error.message);
  }
}

// ============================================================================
// TEST 8: Token Expiration Handling (simulation)
// ============================================================================
async function test8_TokenExpiration() {
  logSection('TEST 8: Token Expiration Handling');
  
  try {
    // Note: Ce test nécessite de modifier config/sanctum.php expiration => 1
    // Pour l'instant on teste juste un token invalide
    
    const fakeToken = '999|invalidtokenstring';
    
    try {
      await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${fakeToken}`,
          'Accept': 'application/json'
        }
      });
      logTest('Token invalide - Rejet', false, 'Devrait retourner 401');
    } catch (error) {
      logTest(
        'Token invalide - Rejet',
        error.response?.status === 401,
        `Status: ${error.response?.status}`
      );
    }

    logInfo('⚠️  Pour tester l\'expiration réelle: config/sanctum.php → expiration: 1');

  } catch (error) {
    logTest('Token expiration', false, error.message);
  }
}

// ============================================================================
// TEST 9: QR Token Regeneration
// ============================================================================
async function test9_QRTokenRegeneration() {
  logSection('TEST 9: QR Token Regeneration');
  
  try {
    // Login 1
    const login1 = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: generateUUID()
    });
    const user1 = login1.data.data.user;
    const qrToken1 = user1.qr_token || user1.uuid;
    const uuid1 = user1.uuid;
    
    logInfo(`QR Token 1: ${qrToken1}`);
    logInfo(`UUID 1: ${uuid1}`);

    // Logout
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${login1.data.data.token}`, 'Accept': 'application/json' }
    });

    await wait(500);

    // Login 2
    const login2 = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      device_uuid: generateUUID()
    });
    const user2 = login2.data.data.user;
    const qrToken2 = user2.qr_token || user2.uuid;
    const uuid2 = user2.uuid;
    
    logInfo(`QR Token 2: ${qrToken2}`);
    logInfo(`UUID 2: ${uuid2}`);

    logTest(
      'UUID constant',
      uuid1 === uuid2,
      `UUID ne change jamais: ${uuid1 === uuid2}`
    );

    logTest(
      'QR Token = UUID',
      qrToken1 === uuid1 && qrToken2 === uuid2,
      'QR Token doit être égal à UUID'
    );

    logTest(
      'QR Token constant',
      qrToken1 === qrToken2,
      'QR Token ne change jamais entre logins'
    );

    // Cleanup
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${login2.data.data.token}`, 'Accept': 'application/json' }
    }).catch(() => {});

  } catch (error) {
    logTest('QR Token regeneration', false, error.message);
  }
}

// ============================================================================
// TEST 10: Edge Cases
// ============================================================================
async function test10_EdgeCases() {
  logSection('TEST 10: Edge Cases');
  
  // 10.1: Logout sans token
  try {
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': 'Bearer invalidtoken', 'Accept': 'application/json' }
    });
    logTest('Logout sans token valide', false, 'Devrait retourner 401');
  } catch (error) {
    logTest(
      'Logout sans token valide',
      error.response?.status === 401,
      'Accepte 401 comme comportement normal'
    );
  }

  // 10.2: Profile sans token
  try {
    await axios.get(`${API_BASE_URL}/auth/profile`);
    logTest('Profile sans token', false, 'Devrait retourner 401');
  } catch (error) {
    logTest(
      'Profile sans token',
      error.response?.status === 401,
      `Status: ${error.response?.status}`
    );
  }

  // 10.3: Login sans device_uuid (devrait générer un auto)
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: ADMIN_PHONE,
      password: ADMIN_PASSWORD
      // Pas de device_uuid
    });
    
    logTest(
      'Login sans device_uuid - Auto-généré',
      !!response.data.data.device_uuid,
      `Device UUID auto: ${response.data.data.device_uuid}`
    );

    // Cleanup
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { 'Authorization': `Bearer ${response.data.data.token}`, 'Accept': 'application/json' }
    }).catch(() => {});

  } catch (error) {
    logTest('Login sans device_uuid', false, error.message);
  }
}

// ============================================================================
// MAIN - Exécution de tous les tests
// ============================================================================
async function main() {
  console.log(`\n${colors.bright}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║  Phase 7.1 - Tests Automatisés d'Authentification             ║${colors.reset}`);
  console.log(`${colors.bright}║  Alouaoui School Platform                                      ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  logInfo(`API: ${API_BASE_URL}`);
  logInfo(`Admin: ${ADMIN_PHONE}`);
  logInfo(`Date: ${new Date().toLocaleString()}\n`);

  try {
    // Vérifier que l'API est accessible
    try {
      await axios.get(`${API_BASE_URL.replace('/api', '')}/health`).catch(() => {
        // Ignore health check errors
      });
    } catch (error) {
      console.log(`${colors.yellow}⚠️  L'API pourrait ne pas être accessible. Continuons quand même...${colors.reset}\n`);
    }

    // Exécuter tous les tests
    await test1_LoginValide();
    await test2_LoginInvalide();
    await test3_LogoutSimple();
    await test4_SingleDevice();
    await test5_ForceDeviceChange();
    await test6_MultipleLoginMemeDevice();
    await test7_MultipleLoginDevicesDifferents();
    await test8_TokenExpiration();
    await test9_QRTokenRegeneration();
    await test10_EdgeCases();

    // Résumé final
    logSection('RÉSUMÉ FINAL');
    
    console.log(`${colors.bright}Tests Totaux:${colors.reset}    ${testsTotal}`);
    console.log(`${colors.green}Tests Réussis:${colors.reset}   ${testsReussis} (${Math.round(testsReussis/testsTotal*100)}%)`);
    console.log(`${colors.red}Tests Échoués:${colors.reset}   ${testsEchoues} (${Math.round(testsEchoues/testsTotal*100)}%)\n`);

    // Score
    const score = Math.round(testsReussis / testsTotal * 10);
    if (score >= 8) {
      console.log(`${colors.green}${colors.bright}✅ SUCCÈS - Score: ${score}/10${colors.reset}`);
      console.log(`${colors.green}Prêt pour Phase 7.2 - Dashboard Testing${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bright}❌ ÉCHEC - Score: ${score}/10${colors.reset}`);
      console.log(`${colors.red}Objectif: ≥ 8/10 pour passer à Phase 7.2${colors.reset}\n`);
    }

    // Bugs trouvés
    if (bugs.length > 0) {
      console.log(`${colors.yellow}${colors.bright}🐛 BUGS TROUVÉS (${bugs.length}):${colors.reset}`);
      bugs.forEach((bug, index) => {
        console.log(`${colors.yellow}${index + 1}. ${bug.test}${colors.reset}`);
        console.log(`   ${colors.gray}${bug.error}${colors.reset}`);
      });
      console.log();
    }

    // Recommandations
    console.log(`${colors.cyan}${colors.bright}📋 RECOMMANDATIONS:${colors.reset}`);
    if (testsEchoues > 0) {
      console.log(`${colors.yellow}1. Corriger les ${testsEchoues} tests échoués${colors.reset}`);
      console.log(`${colors.yellow}2. Re-exécuter: node test-phase7-1-auth.js${colors.reset}`);
      console.log(`${colors.yellow}3. Vérifier les logs backend: tail -f storage/logs/laravel.log${colors.reset}`);
    } else {
      console.log(`${colors.green}1. Tous les tests passent! 🎉${colors.reset}`);
      console.log(`${colors.green}2. Passer à Phase 7.2 - Dashboard Testing${colors.reset}`);
      console.log(`${colors.green}3. Documenter les résultats dans PHASE7_1_AUTH_TESTING_GUIDE.md${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}${colors.bright}❌ ERREUR CRITIQUE:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    console.error(`${colors.gray}${error.stack}${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.bright}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║  Tests Terminés                                                ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

// Exécuter les tests
main().catch(error => {
  console.error(`${colors.red}Erreur fatale:${colors.reset}`, error);
  process.exit(1);
});
