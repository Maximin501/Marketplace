// Configuration Cloudinary
// Remplacez par VOS identifiants

export const CLOUDINARY_CLOUD_NAME = 'dbf8mmbxp';  // ← Votre Cloud Name
export const CLOUDINARY_UPLOAD_PRESET = 'marketplace_unsigned';  // ← Votre preset

// URL de base pour les images
export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;

/**
 * Upload une image vers Cloudinary
 * @param {File} file - Le fichier image à uploader
 * @returns {Promise<Object>} - Les données de l'image uploadée
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    const data = await response.json();

    if (data.secure_url) {
      return {
        url: data.secure_url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
      };
    }
    throw new Error('Upload failed');
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Obtient l'URL d'une image Cloudinary avec transformations
 * @param {string} publicId - L'identifiant public de l'image
 * @param {Object} options - Options de transformation
 * @returns {string} - L'URL complète de l'image
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  const { width = 500, height = 500, crop = 'fill', quality = 'auto' } = options;
  return `${CLOUDINARY_BASE_URL}w_${width},h_${height},c_${crop},q_${quality}/${publicId}`;
};