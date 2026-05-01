import axios from 'axios';

// ============================================================
// CONFIGURATION CLOUDINARY (Importée depuis le fichier de config)
// ============================================================

// URL de base Cloudinary (à synchroniser avec config/cloudinary.js)
const CLOUDINARY_CLOUD_NAME = 'dxample123';  // ← Remplacez par votre Cloud Name
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;

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

// Debug (peut être commenté en production)
if (isProduction) {
  console.log('🚀 Mode PRODUCTION');
  console.log('🔗 API:', API_URL);
  console.log('☁️ Images: Cloudinary');
} else {
  console.log('💻 Mode DÉVELOPPEMENT');
  console.log('🔗 API:', API_URL);
  console.log('🖼️ Media:', MEDIA_URL);
}

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
        console.error('❌ Token refresh failed');
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
// FONCTIONS UTILITAIRES POUR LES IMAGES
// ============================================================

/**
 * Obtient l'URL complète d'une image
 * Supporte : URLs Cloudinary, URLs backend, chemins relatifs
 * 
 * @param {string} imagePath - Chemin ou URL de l'image
 * @returns {string|null} - URL complète de l'image
 */
export const getImageUrl = (imagePath) => {
  // Si vide ou invalide
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
    return null;
  }

  // 1. Si c'est déjà une URL Cloudinary
  if (imagePath.includes('res.cloudinary.com')) {
    return imagePath;
  }

  // 2. Si c'est déjà une URL complète (http/https)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 3. Si c'est un public_id Cloudinary (identifiant sans extension de chemin)
  // Exemple: "marketplace/abc123" ou "abc123"
  if (!imagePath.startsWith('/') && !imagePath.includes('media/')) {
    // Vérifier si ça ressemble à un chemin Cloudinary
    if (imagePath.includes('/') || imagePath.length > 10) {
      return `${CLOUDINARY_BASE_URL}${imagePath}`;
    }
  }

  // 4. Si c'est une URL relative du backend Django (/media/...)
  if (imagePath.startsWith('/')) {
    return `${MEDIA_URL}${imagePath}`;
  }

  // 5. Fallback : chemin local
  return `${MEDIA_URL}/media/${imagePath}`;
};

/**
 * Obtient l'URL d'une image avec transformations Cloudinary
 * 
 * @param {string} imagePath - Chemin ou URL de l'image
 * @param {Object} options - Options de transformation
 * @param {number} options.width - Largeur souhaitée
 * @param {number} options.height - Hauteur souhaitée
 * @param {string} options.crop - Type de recadrage (fill, fit, scale, etc.)
 * @param {string} options.quality - Qualité (auto, best, good, etc.)
 * @returns {string|null} - URL transformée
 */
export const getImageUrlTransformed = (imagePath, options = {}) => {
  const baseUrl = getImageUrl(imagePath);
  if (!baseUrl) return null;

  // Si ce n'est pas une URL Cloudinary, retourner l'URL de base
  if (!baseUrl.includes('res.cloudinary.com')) {
    return baseUrl;
  }

  const { 
    width = 500, 
    height = 500, 
    crop = 'fill', 
    quality = 'auto',
    format = 'auto'
  } = options;

  // Insérer les transformations dans l'URL Cloudinary
  const parts = baseUrl.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${parts[1]}`;
  }

  return baseUrl;
};

// ============================================================
// FONCTIONS UTILITAIRES UTILISATEUR
// ============================================================

/**
 * Rafraîchit les informations utilisateur depuis l'API
 * @returns {Object|null} - Données utilisateur ou null
 */
export const refreshUser = async () => {
  try {
    const res = await api.get('me/');
    const userData = res.data;
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (err) {
    console.error('❌ Erreur rafraîchissement utilisateur:', err);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('access');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

/**
 * Récupère l'utilisateur stocké dans le localStorage
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Récupère le profil utilisateur
 * @returns {Object|null}
 */
export const getUserProfile = () => {
  const user = getStoredUser();
  return user?.profile || null;
};

/**
 * Vérifie si l'utilisateur est vendeur
 * @returns {boolean}
 */
export const isSeller = () => {
  const profile = getUserProfile();
  return profile?.is_seller || false;
};

/**
 * Vérifie si l'utilisateur est acheteur
 * @returns {boolean}
 */
export const isBuyer = () => {
  const profile = getUserProfile();
  return profile?.is_buyer || false;
};

// ============================================================
// FONCTIONS API RAPIDES (Optionnelles)
// ============================================================

/**
 * Récupère la liste des annonces
 */
export const getListings = async (params = {}) => {
  try {
    const res = await api.get('listings/', { params });
    return res.data;
  } catch (err) {
    console.error('❌ Erreur récupération annonces:', err);
    throw err;
  }
};

/**
 * Récupère une annonce par ID
 */
export const getListingById = async (id) => {
  try {
    const res = await api.get(`listings/${id}/`);
    return res.data;
  } catch (err) {
    console.error(`❌ Erreur annonce ${id}:`, err);
    throw err;
  }
};

/**
 * Récupère les catégories
 */
export const getCategories = async () => {
  try {
    const res = await api.get('categories/');
    return res.data;
  } catch (err) {
    console.error('❌ Erreur catégories:', err);
    throw err;
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logoutUser = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
  window.location.href = '/';
};

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default api;