import axios from 'axios';

// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================
const CLOUDINARY_CLOUD_NAME = 'dmlxi5xrf';  // ← Remplacez par VOTRE Cloud Name réel
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;

// ============================================================
// DÉTECTION DE L'ENVIRONNEMENT
// ============================================================
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// ============================================================
// URLS DE L'API
// ============================================================
const RENDER_URL = 'https://marketplace-n63e.onrender.com';

const API_URL = isProduction 
  ? `${RENDER_URL}/api/` 
  : 'http://127.0.0.1:8000/api/';

export const MEDIA_URL = isProduction 
  ? RENDER_URL 
  : 'http://127.0.0.1:8000';

console.log('🌍 Mode:', isProduction ? 'PRODUCTION' : 'DEV');
console.log('🔗 API:', API_URL);

// ============================================================
// CRÉATION DE L'INSTANCE AXIOS
// ============================================================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 secondes (Render peut être lent au démarrage)
});

// ============================================================
// INTERCEPTEUR DE REQUÊTE (JWT)
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// FONCTIONS IMAGES
// ============================================================
export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/')) return `${MEDIA_URL}${imagePath}`;
  return `${MEDIA_URL}/media/${imagePath}`;
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
export const refreshUser = async () => {
  try {
    const res = await api.get('me/');
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    console.error('Erreur refresh user:', err);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!(localStorage.getItem('access') && localStorage.getItem('user'));
};

export const logoutUser = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  window.location.href = '/';
};

export default api;