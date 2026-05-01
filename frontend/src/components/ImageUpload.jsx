import { useState, useRef } from 'react';
import { uploadToCloudinary } from '../config/cloudinary';

/**
 * Composant d'upload d'image vers Cloudinary
 * 
 * @param {Object} props
 * @param {Function} props.onImageUpload - Fonction appelée après upload réussi (reçoit { url, public_id, width, height })
 * @param {string} props.currentImage - URL de l'image actuelle (pour l'édition)
 * @param {string} props.label - Texte du label
 * @param {boolean} props.required - Si l'image est obligatoire
 * @param {number} props.maxSize - Taille max en MB (défaut: 10)
 * @param {string} props.className - Classes CSS additionnelles
 */
function ImageUpload({ 
  onImageUpload, 
  currentImage = null, 
  label = "📷 Image du produit",
  required = false,
  maxSize = 10,
  className = ""
}) {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Types de fichiers acceptés
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const acceptedExtensions = '.jpg, .jpeg, .png, .gif, .webp';

  /**
   * Vérifie si le fichier est valide
   */
  const validateFile = (file) => {
    // Vérifier le type
    if (!acceptedTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.');
      return false;
    }

    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(`L'image ne doit pas dépasser ${maxSize}MB.`);
      return false;
    }

    return true;
  };

  /**
   * Gère la sélection de fichier
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /**
   * Gère le drag & drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  /**
   * Traite le fichier sélectionné
   */
  const processFile = async (file) => {
    setError('');
    setSuccess('');

    if (!validateFile(file)) {
      return;
    }

    // Créer une prévisualisation locale
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setFileInfo({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2),
      type: file.type.split('/')[1].toUpperCase(),
    });

    // Upload vers Cloudinary
    await handleUpload(file);
  };

  /**
   * Upload le fichier vers Cloudinary
   */
  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(10);

    try {
      // Simulation de progression (Cloudinary ne fournit pas de vrai progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload vers Cloudinary
      const result = await uploadToCloudinary(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setSuccess('✅ Image uploadée avec succès !');
      
      // Appeler le callback parent
      if (onImageUpload) {
        onImageUpload(result);
      }

      // Nettoyer après 2 secondes
      setTimeout(() => {
        setProgress(0);
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Erreur upload:', err);
      setError('❌ Erreur lors de l\'upload. Veuillez réessayer.');
      setProgress(0);
      // Ne pas effacer la prévisualisation en cas d'erreur
    } finally {
      setUploading(false);
    }
  };

  /**
   * Supprime l'image sélectionnée
   */
  const handleRemove = () => {
    setPreview(null);
    setFileInfo(null);
    setError('');
    setSuccess('');
    setProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onImageUpload) {
      onImageUpload(null);
    }
  };

  /**
   * Réessayer l'upload
   */
  const handleRetry = () => {
    if (fileInputRef.current?.files?.[0]) {
      handleUpload(fileInputRef.current.files[0]);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="form-label fw-bold">
          {label}
          {required && <span className="text-danger"> *</span>}
          <small className="text-muted fw-normal ms-2">
            (optionnel - ☁️ Cloudinary)
          </small>
        </label>
      )}

      {/* Zone d'upload avec Drag & Drop */}
      <div
        className={`
          border border-2 rounded-3 p-4 text-center
          ${dragOver ? 'border-primary bg-primary bg-opacity-10' : ''}
          ${preview ? 'border-success' : 'border-dashed'}
          ${error ? 'border-danger' : ''}
        `}
        style={{
          borderStyle: preview ? 'solid' : 'dashed',
          cursor: uploading ? 'wait' : 'pointer',
          minHeight: '200px',
          transition: 'all 0.3s ease',
          backgroundColor: dragOver ? 'rgba(13, 110, 253, 0.05)' : '#f8f9fa',
          position: 'relative',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          onChange={handleFileSelect}
          accept={acceptedExtensions}
          disabled={uploading}
        />

        {!preview ? (
          /* Zone vide - État initial */
          <div className="text-muted">
            <div style={{ fontSize: '64px' }}>📁</div>
            <p className="mt-3 mb-1 fs-5 fw-bold">
              Glissez-déposez votre image ici
            </p>
            <p className="mb-1">ou</p>
            <p className="text-primary fw-bold mb-2">
              Cliquez pour parcourir
            </p>
            <small className="d-block text-muted">
              Formats acceptés : JPG, PNG, GIF, WebP
            </small>
            <small className="d-block text-muted">
              Taille maximale : {maxSize}MB
            </small>
          </div>
        ) : (
          /* Image uploadée - Prévisualisation */
          <div className="position-relative">
            <img
              src={preview}
              alt="Aperçu"
              className="img-fluid rounded-3 shadow"
              style={{
                maxHeight: '350px',
                objectFit: 'contain',
                width: '100%',
              }}
            />

            {/* Overlay avec actions */}
            <div
              className="position-absolute top-0 end-0 m-2 d-flex gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bouton changer */}
              {!uploading && (
                <button
                  type="button"
                  className="btn btn-light btn-sm rounded-circle shadow"
                  onClick={() => fileInputRef.current?.click()}
                  title="Changer l'image"
                >
                  🔄
                </button>
              )}

              {/* Bouton supprimer */}
              {!uploading && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm rounded-circle shadow"
                  onClick={handleRemove}
                  title="Supprimer l'image"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Informations du fichier */}
            {fileInfo && (
              <div className="mt-2 text-start">
                <small className="text-muted">
                  📄 {fileInfo.name} • {fileInfo.size} MB • {fileInfo.type}
                </small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {uploading && (
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">
              ⏳ Upload vers Cloudinary...
            </small>
            <small className="text-muted">{progress}%</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-success"
              role="progressbar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-2">
          <div className="alert alert-danger alert-dismissible fade show py-2 px-3 mb-0" role="alert">
            <small>{error}</small>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setError('')}
            ></button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm ms-2"
              onClick={handleRetry}
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-2">
          <div className="alert alert-success py-2 px-3 mb-0 fade show" role="alert">
            <small>{success}</small>
          </div>
        </div>
      )}

      {/* Aide */}
      <small className="text-muted d-block mt-1">
        💡 Conseil : Utilisez une image de bonne qualité pour attirer plus d'acheteurs
      </small>
    </div>
  );
}

export default ImageUpload;