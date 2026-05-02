renvoie moi la version mis à jour de: import axios from 'axios';

// ============================================================
// CONFIGURATION CLOUDINARY
// ============================================================
const CLOUDINARY_CLOUD_NAME = 'dbf8mmbxp';  // ← Remplacez par VOTRE Cloud Name réel
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
  if (!imagePath || imagePath === 'null') return null;
  
  // Si c'est déjà une URL Cloudinary ou autre URL complète
  if (imagePath.startsWith('http')) return imagePath;
  
  // Si c'est une URL relative du backend
  if (imagePath.startsWith('/')) return `https://marketplace-n63e.onrender.com${imagePath}`;
  
  return `https://marketplace-n63e.onrender.com/media/${imagePath}`;
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
