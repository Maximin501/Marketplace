import axios from 'axios';

// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================
const CLOUDINARY_CLOUD_NAME = 'dbf8mmbxp';
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
  timeout: 60000,
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
// FONCTIONS IMAGES (CORRIGÉ)
// ============================================================
export const getImageUrl = (imagePath) => {
  // Si vide ou null
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
    return null;
  }
  
  // 1. Si c'est déjà une URL Cloudinary
  if (imagePath.includes('res.cloudinary.com')) {
    return imagePath;
  }
  
  // 2. Si c'est une autre URL complète (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 3. Si c'est un chemin relatif du backend
  if (imagePath.startsWith('/')) {
    return `${MEDIA_URL}${imagePath}`;
  }
  
  // 4. Fallback : ajouter /media/
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
