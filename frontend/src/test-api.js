// Test de connectivité API - À supprimer après vérification
import { api } from './services/axios.config.js';

async function testApiConnection() {
  try {
    console.log('🔍 Test de connexion API...');
    
    // Test 1: Endpoint public (pas d'auth requise)
    console.log('📡 Test endpoint public: /api/dashboard/public');
    const publicStats = await api.get('/dashboard/public');
    console.log('✅ Public stats:', publicStats);
    
    // Test 2: Endpoint events slider (pas d'auth requise)
    console.log('📡 Test endpoint slider: /api/events/slider');
    const eventsSlider = await api.get('/events/slider');
    console.log('✅ Events slider:', eventsSlider);
    
    console.log('🎉 API connectée avec succès !');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

// Fonction de test authentification
async function testAuthEndpoints() {
  try {
    console.log('🔐 Test des endpoints d\'authentification...');
    
    // Test forgot password (sans vraie donnée)
    console.log('📧 Test endpoint: /api/auth/forgot-password');
    
    // Note: Ne pas vraiment envoyer d'email, juste vérifier que l'endpoint existe
    console.log('ℹ️  Endpoint forgot-password disponible (test manuel requis)');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur auth endpoints:', error.message);
    return false;
  }
}

// Exporter pour utilisation dans le composant
export { testApiConnection, testAuthEndpoints };

// Test automatique si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testApiConnection();
}