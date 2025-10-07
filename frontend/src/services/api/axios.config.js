import axios from 'axios';

// Créer une instance axios avec la configuration de base
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Intercepteur pour ajouter le token d'authentification aux requêtes
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // Ajouter le Device UUID si disponible
        const deviceUUID = localStorage.getItem('device_uuid');
        if (deviceUUID) {
            config.headers['X-Device-UUID'] = deviceUUID;
        }
        
        // Debug logging for auth requests
        if (config.url.includes('/auth/')) {
            console.log('📤 API Request:', {
                url: config.url,
                method: config.method,
                hasToken: !!token,
                deviceUUID: deviceUUID
            });
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
    (response) => {
        // Debug logging for auth responses
        if (response.config.url.includes('/auth/')) {
            console.log('📥 API Response:', {
                url: response.config.url,
                status: response.status,
                data: response.data
            });
        }
        return response;
    },
    async (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.status === 401) {
            console.log('🚫 401 Error - Clearing auth and redirecting to login');
            // Si le token est invalide ou expiré, déconnectez l'utilisateur
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('device_uuid');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;