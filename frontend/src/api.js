import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Intercepteur pour ajouter le token
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

// Dans api.js
export const refreshUser = async () => {
  try {
    const res = await api.get('me/');
    const userData = res.data;
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (err) {
    console.error('Erreur lors du rafraîchissement utilisateur:', err);
    return null;
  }
};
export default api;