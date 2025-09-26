import axios from 'axios';

// Configuration de base d'Axios pour l'API Laravel
const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 10000, // 10 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Intercepteur pour les requêtes - ajouter le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ajouter le Device UUID si disponible
    const deviceUUID = localStorage.getItem('device_uuid');
    if (deviceUUID) {
      config.headers['X-Device-UUID'] = deviceUUID;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses - gestion des erreurs globales
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('device_uuid');
      
      // Redirection vers la page de connexion (peut être gérée par le router)
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Gestion du conflit de device (single device session)
    if (error.response?.status === 409 && error.response?.data?.error_code === 'DEVICE_CONFLICT') {
      // Afficher un message à l'utilisateur
      console.warn('Session détectée sur un autre appareil:', error.response.data.message);
      
      // Supprimer les données locales
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      // Redirection vers login avec message
      window.location.href = '/login?reason=device_conflict';
      return Promise.reject(error);
    }

    // Gestion des erreurs de validation (422)
    if (error.response?.status === 422) {
      console.log('Erreurs de validation:', error.response.data.errors);
    }

    // Gestion des erreurs serveur (500)
    if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour l'authentification
export const auth = {
  // Définir le token d'authentification
  setToken: (token) => {
    localStorage.setItem('auth_token', token);
  },

  // Récupérer le token d'authentification
  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  // Supprimer le token d'authentification
  removeToken: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('device_uuid');
  },

  // Définir le Device UUID
  setDeviceUUID: (uuid) => {
    localStorage.setItem('device_uuid', uuid);
  },

  // Récupérer le Device UUID
  getDeviceUUID: () => {
    return localStorage.getItem('device_uuid');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Stocker les données utilisateur
  setUserData: (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
  },

  // Récupérer les données utilisateur
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

// Endpoints API organisés par module
export const endpoints = {
  // Authentification
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    profile: '/auth/profile',
    updateProfile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Dashboard
  dashboard: {
    admin: '/dashboard/admin',
    student: '/dashboard/student',
    public: '/dashboard/public',
  },

  // Événements
  events: {
    slider: '/events/slider',
    list: '/events',
    create: '/events',
    show: (id) => `/events/${id}`,
    update: (id) => `/events/${id}`,
    delete: (id) => `/events/${id}`,
    checkAccess: (id) => `/events/${id}/check-access`,
    toggleStatus: (id) => `/events/${id}/toggle-status`,
    reorder: '/events/reorder',
  },

  // Cours (si nécessaire)
  courses: {
    list: '/courses',
    show: (id) => `/courses/${id}`,
  },

  // Témoignages
  testimonials: {
    list: '/testimonials',
    admin: '/testimonials/admin',
    create: '/testimonials',
    show: (id) => `/testimonials/${id}`,
    update: (id) => `/testimonials/${id}`,
    delete: (id) => `/testimonials/${id}`,
    toggleStatus: (id) => `/testimonials/${id}/toggle-status`,
    reorder: '/testimonials/reorder',
  },

  // Abonnements
  subscriptions: {
    list: '/subscriptions',
    create: '/subscriptions',
    show: (id) => `/subscriptions/${id}`,
  },

  // Paiements
  payments: {
    list: '/payments',
    create: '/payments',
    show: (id) => `/payments/${id}`,
  },

  // Admin check-in
  admin: {
    scanQr: '/admin/checkin/scan-qr',
    sessionAttendance: '/admin/checkin/session-attendance',
    attendanceStats: '/admin/checkin/attendance-stats',
    studentHistory: (studentId) => `/admin/checkin/student/${studentId}/history`,
    manualCheckin: '/admin/checkin/manual-checkin',
  }
};

// Fonction helper pour créer des requêtes avec gestion d'erreur
export const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      ...config
    });
    return response.data;
  } catch (error) {
    // Log l'erreur pour le debugging
    console.error(`API Error [${method.toUpperCase()} ${url}]:`, error.response?.data || error.message);
    throw error;
  }
};

// Méthodes raccourcies pour les opérations courantes
export const api = {
  get: (url, config) => apiRequest('get', url, null, config),
  post: (url, data, config) => apiRequest('post', url, data, config),
  put: (url, data, config) => apiRequest('put', url, data, config),
  patch: (url, data, config) => apiRequest('patch', url, data, config),
  delete: (url, config) => apiRequest('delete', url, null, config),
};

export default axiosInstance;
