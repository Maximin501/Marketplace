import axios from 'axios';

// ============================================================
// DÉTECTION DE L'ENVIRONNEMENT
// ============================================================

// Détection automatique : production ou développement
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// ============================================================
// URLS DE L'API (AVEC VOTRE URL RENDER RÉELLE)
// ============================================================

// Votre URL Render
const RENDER_URL = 'https://marketplace-n63e.onrender.com';

const PRODUCTION_API_URL = `${RENDER_URL}/api/`;
const DEVELOPMENT_API_URL = 'http://127.0.0.1:8000/api/';

const PRODUCTION_MEDIA_URL = RENDER_URL;
const DEVELOPMENT_MEDIA_URL = 'http://127.0.0.1:8000';

// Choix automatique selon l'environnement
const API_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;
export const MEDIA_URL = isProduction ? PRODUCTION_MEDIA_URL : DEVELOPMENT_MEDIA_URL;

// Debug (à enlever en production si vous voulez)
console.log('🌍 Environnement:', isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT');
console.log('🔗 API URL:', API_URL);
console.log('🖼️ Media URL:', MEDIA_URL);

// ============================================================
// CRÉATION DE L'INSTANCE AXIOS
// ============================================================

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// ============================================================
// INTERCEPTEUR DE REQUÊTE (Ajout du token JWT)
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// INTERCEPTEUR DE RÉPONSE (Refresh token automatique)
// ============================================================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà essayé
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('access', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Obtient l'URL complète d'une image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
    return null;
  }

  // Déjà une URL complète
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // URL relative
  if (imagePath.startsWith('/')) {
    return `${MEDIA_URL}${imagePath}`;
  }

  // Juste un nom de fichier
  return `${MEDIA_URL}/media/${imagePath}`;
};

/**
 * Rafraîchit les informations utilisateur
 */
export const refreshUser = async () => {
  try {
    const res = await api.get('me/');
    const userData = res.data;
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (err) {
    console.error('Erreur rafraîchissement utilisateur:', err);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('access');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export default api;
