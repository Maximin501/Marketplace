import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import { uploadToCloudinary } from "./config/cloudinary";

function CreateListing() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    city: "",
    description: "",
    category_id: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("categories/");
        setCategories(res.data);
      } catch (err) {
        console.error("Erreur chargement catégories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Gérer la sélection d'image
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 10MB");
      return;
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Format d'image non supporté. Utilisez JPG, PNG, GIF ou WebP");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(""); // Effacer les erreurs précédentes
  };

  // Supprimer l'image sélectionnée
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let imageUrl = null;

      // 1. Uploader l'image vers Cloudinary si une image est sélectionnée
      if (imageFile) {
        setUploading(true);
        try {
          const result = await uploadToCloudinary(imageFile);
          imageUrl = result.url;
          console.log("✅ Image uploadée sur Cloudinary:", imageUrl);
          setSuccess("Image uploadée avec succès !");
        } catch (uploadError) {
          console.error("Erreur upload Cloudinary:", uploadError);
          setError("Erreur lors de l'upload de l'image. Veuillez réessayer.");
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // 2. Préparer les données pour l'API
      const data = new FormData();
      data.append("title", form.title);
      data.append("price", form.price);
      data.append("city", form.city);
      data.append("description", form.description);
      data.append("category_id", form.category_id);
      
      // Envoyer l'URL Cloudinary ou le fichier local
      if (imageUrl) {
        data.append("image_url", imageUrl);
      } else if (imageFile) {
        data.append("image", imageFile);
      }

      // 3. Créer l'annonce via l'API
      await api.post("listings/create/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Annonce créée avec succès !");
      navigate("/");
      
    } catch (err) {
      console.error("Erreur création annonce:", err);
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(', ');
        setError(errorMessages || "Erreur lors de la création de l'annonce");
      } else {
        setError("Erreur lors de la création de l'annonce. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: "650px" }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white text-center py-3">
          <h3 className="mb-0">📢 Publier une annonce</h3>
        </div>
        
        <div className="card-body p-4">
          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>⚠️</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>✅</strong> {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Titre */}
            <div className="mb-3">
              <label className="form-label fw-bold">Titre de l'annonce *</label>
              <input
                type="text"
                name="title"
                className="form-control form-control-lg"
                placeholder="Ex: iPhone 13 Pro Max - 256Go"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Prix et Ville */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Prix (Ar) *</label>
                <div className="input-group">
                  <input
                    type="number"
                    name="price"
                    className="form-control form-control-lg"
                    placeholder="Ex: 2500000"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    required
                  />
                  <span className="input-group-text">Ar</span>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Ville *</label>
                <input
                  type="text"
                  name="city"
                  className="form-control form-control-lg"
                  placeholder="Ex: Antananarivo"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Catégorie */}
            <div className="mb-3">
              <label className="form-label fw-bold">Catégorie *</label>
              <select
                name="category_id"
                className="form-select form-select-lg"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">📂 Choisir une catégorie...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '📁'} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label fw-bold">Description *</label>
              <textarea
                name="description"
                className="form-control"
                rows="5"
                placeholder="Décrivez votre produit en détail (état, caractéristiques, etc.)"
                value={form.description}
                onChange={handleChange}
                required
              />
              <small className="text-muted">
                {form.description.length} caractères
              </small>
            </div>

            {/* Upload Image */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                📷 Image du produit
                <small className="text-muted fw-normal"> (optionnel)</small>
              </label>
              
              {/* Zone d'upload */}
              <div 
                className="border border-2 rounded-3 p-4 text-center bg-light"
                style={{ 
                  borderStyle: 'dashed !important',
                  borderColor: imagePreview ? '#198754' : '#dee2e6',
                  cursor: 'pointer',
                  minHeight: '180px',
                  transition: 'all 0.3s ease'
                }}
              >
                <input
                  type="file"
                  className="d-none"
                  id="imageUpload"
                  onChange={handleFile}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={uploading}
                />

                {!imagePreview ? (
                  <label htmlFor="imageUpload" style={{ cursor: 'pointer' }} className="d-block">
                    <div className="text-muted">
                      <div style={{ fontSize: '48px' }}>📁</div>
                      <p className="mt-2 mb-1 fw-bold">Cliquez pour sélectionner une image</p>
                      <small>JPG, PNG, GIF ou WebP • Max 10MB</small>
                      <br />
                      <small className="text-primary">☁️ L'image sera stockée sur Cloudinary</small>
                    </div>
                  </label>
                ) : (
                  <div className="position-relative">
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      className="img-fluid rounded-3 shadow-sm"
                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      title="Supprimer l'image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Barre de progression upload */}
              {uploading && (
                <div className="mt-3">
                  <div className="progress" style={{ height: '25px' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                      role="progressbar"
                      style={{ width: '100%' }}
                    >
                      ⏳ Upload vers Cloudinary en cours...
                    </div>
                  </div>
                </div>
              )}

              {/* Info Cloudinary */}
              {imageFile && !uploading && (
                <div className="mt-2">
                  <small className="text-success">
                    ✅ Image prête • {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                  </small>
                  <br />
                  <small className="text-muted">
                    ☁️ Sera uploadée sur Cloudinary à la publication
                  </small>
                </div>
              )}
            </div>

            {/* Bouton Submit */}
            <button 
              type="submit" 
              className="btn btn-primary btn-lg w-100 py-3 fw-bold"
              disabled={loading || uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Upload de l'image...
                </>
              ) : loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Publication en cours...
                </>
              ) : (
                <>
                  📢 Publier l'annonce
                </>
              )}
            </button>

            {/* Bouton Annuler */}
            <button 
              type="button"
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={() => navigate(-1)}
              disabled={loading || uploading}
            >
              ❌ Annuler
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;