import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../test-api.js';
import { api, endpoints } from '../services/axios.config.js';

const ApiTestComponent = () => {
  const [apiStatus, setApiStatus] = useState('testing');
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    runApiTests();
  }, []);

  const runApiTests = async () => {
    setApiStatus('testing');
    setError(null);
    const testResults = {};

    try {
      // Test 1: Stats publiques
      console.log('🧪 Test 1: Stats publiques');
      const publicStats = await api.get(endpoints.dashboard.public);
      testResults.publicStats = { status: 'success', data: publicStats };

      // Test 2: Events slider
      console.log('🧪 Test 2: Events slider');
      const eventsSlider = await api.get(endpoints.events.slider);
      testResults.eventsSlider = { status: 'success', data: eventsSlider };

      // Test 3: Vérifier structure des endpoints
      testResults.endpointsStructure = {
        status: 'success',
        data: {
          authEndpoints: Object.keys(endpoints.auth),
          dashboardEndpoints: Object.keys(endpoints.dashboard),
          eventsEndpoints: Object.keys(endpoints.events)
        }
      };

      setResults(testResults);
      setApiStatus('success');

    } catch (err) {
      console.error('Erreur lors des tests API:', err);
      setError({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setApiStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'testing': return 'orange';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'testing': return '🔄 Test en cours...';
      case 'success': return '✅ API connectée';
      case 'error': return '❌ Erreur API';
      default: return '⏸️ En attente';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: `2px solid ${getStatusColor()}`, 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🧪 Test de Connectivité API Backend</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Status: </strong>
        <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
          {getStatusText()}
        </span>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Backend URL: </strong>
        <code>http://127.0.0.1:8000/api</code>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>Erreur:</strong>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4>📊 Résultats des Tests:</h4>
          {Object.entries(results).map(([test, result]) => (
            <div key={test} style={{ marginBottom: '10px' }}>
              <strong>{test}: </strong>
              <span style={{ 
                color: result.status === 'success' ? 'green' : 'red',
                fontWeight: 'bold'
              }}>
                {result.status === 'success' ? '✅ OK' : '❌ ECHEC'}
              </span>
              
              {result.status === 'success' && (
                <details style={{ marginTop: '5px', marginLeft: '20px' }}>
                  <summary>Voir les données</summary>
                  <pre style={{ 
                    backgroundColor: '#e8f5e8', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={runApiTests}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Relancer les Tests
        </button>
      </div>

      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        backgroundColor: '#fff3cd',
        padding: '8px',
        borderRadius: '4px'
      }}>
        <strong>📝 Note:</strong> Ce composant est temporaire pour vérifier la connectivité. 
        Supprimez-le une fois que tout fonctionne correctement.
      </div>
    </div>
  );
};

export default ApiTestComponent;