import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    is_seller: false,
    is_buyer: true,
    seller_store_name: "",
    seller_description: "",
    cin_number: "",
    cin_issue_date: "",
    cin_issue_place: "",
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [cinPhotoFile, setCinPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cinPhotoPreview, setCinPhotoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      console.log("Avatar sélectionné:", file.name); // Debug
    }
  };

  const handleCinPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCinPhotoFile(file);
      setCinPhotoPreview(URL.createObjectURL(file));
      console.log("CIN Photo sélectionnée:", file.name); // Debug
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const data = new FormData();
    
    // Ajouter tous les champs texte
    Object.keys(form).forEach(key => {
      if (form[key] !== null && form[key] !== "") {
        data.append(key, form[key]);
        console.log(`Ajouté: ${key} = ${form[key]}`); // Debug
      }
    });
    
    // Ajouter les fichiers (IMPORTANT: utiliser le même nom que dans le sérializer)
    if (avatarFile) {
      data.append("avatar", avatarFile);
      console.log("Fichier avatar ajouté"); // Debug
    }
    if (cinPhotoFile) {
      data.append("cin_photo", cinPhotoFile);
      console.log("Fichier cin_photo ajouté"); // Debug
    }

    // Debug: Afficher le contenu de FormData
    for (let pair of data.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const res = await api.post("register/", data, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
      });
      
      console.log("Réponse:", res.data); // Debug
      
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      alert(`Inscription réussie ! Bienvenue ${form.username}`);
      navigate("/");
    } catch (err) {
      console.error("Erreur complète:", err); // Debug
      if (err.response?.data) {
        console.error("Erreur détaillée:", err.response.data);
        setErrors(err.response.data);
      } else {
        setErrors({ general: "Erreur lors de l'inscription" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: "700px" }}>
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white">
          <h3 className="text-center mb-0">📝 Inscription</h3>
        </div>
        
        <div className="card-body">
          {errors.general && <div className="alert alert-danger">{errors.general}</div>}
          {errors.non_field_errors && <div className="alert alert-danger">{errors.non_field_errors}</div>}

          <form onSubmit={handleSubmit}>
            {/* Informations de base */}
            <h5 className="mb-3">👤 Informations personnelles</h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nom d'utilisateur *</label>
                <input
                  name="username"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  required
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Email *</label>
                <input
                  name="email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Mot de passe *</label>
                <input
                  name="password"
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Confirmer mot de passe *</label>
                <input
                  name="confirm_password"
                  type="password"
                  className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  required
                />
                {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Prénom</label>
                <input name="first_name" className="form-control" onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Nom</label>
                <input name="last_name" className="form-control" onChange={handleChange} />
              </div>
            </div>

            {/* Photo de profil */}
            <div className="mb-3">
              <label className="form-label">🖼️ Photo de profil (optionnel)</label>
              <input 
                type="file" 
                className="form-control" 
                accept="image/jpeg,image/png,image/jpg,image/gif" 
                onChange={handleAvatarChange} 
              />
              {avatarPreview && (
                <div className="mt-2 text-center">
                  <img 
                    src={avatarPreview} 
                    alt="Aperçu" 
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%" }} 
                  />
                  <p className="text-muted small mt-1">Aperçu de votre photo</p>
                </div>
              )}
            </div>

            {/* Contact */}
            <h5 className="mb-3 mt-4">📞 Contact</h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Téléphone</label>
                <input name="phone" className="form-control" onChange={handleChange} placeholder="+261 32 00 000 00" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Adresse</label>
                <input name="address" className="form-control" onChange={handleChange} />
              </div>
            </div>

            {/* Informations CIN */}
            <h5 className="mb-3 mt-4">🪪 Carte d'Identité Nationale (CIN)</h5>
            <p className="text-muted small mb-3">Ces informations sont nécessaires pour la vérification d'identité</p>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Numéro CIN</label>
                <input name="cin_number" className="form-control" onChange={handleChange} placeholder="Ex: 123456789" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Lieu de délivrance</label>
                <input name="cin_issue_place" className="form-control" onChange={handleChange} placeholder="Ex: Antananarivo" />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Date de délivrance</label>
                <input name="cin_issue_date" type="date" className="form-control" onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Photo du CIN (recto - optionnel)</label>
                <input 
                  type="file" 
                  className="form-control" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handleCinPhotoChange} 
                />
                {cinPhotoPreview && (
                  <div className="mt-2">
                    <img src={cinPhotoPreview} alt="Aperçu CIN" style={{ width: 150, height: "auto", border: "1px solid #ddd" }} />
                    <p className="text-muted small mt-1">Aperçu de votre CIN</p>
                  </div>
                )}
              </div>
            </div>

            {/* Type de compte */}
            <h5 className="mb-3 mt-4">🏷️ Type de compte</h5>
            
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_buyer"
                    name="is_buyer"
                    checked={form.is_buyer}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_buyer">
                    🛍️ Acheteur
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_seller"
                    name="is_seller"
                    checked={form.is_seller}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="is_seller">
                    🏪 Vendeur
                  </label>
                </div>
              </div>
            </div>

            {errors.roles && <div className="alert alert-warning">{errors.roles}</div>}

            {/* Champs vendeur */}
            {form.is_seller && (
              <div className="card bg-light mt-3">
                <div className="card-body">
                  <h5 className="mb-3">🏪 Informations vendeur</h5>
                  <div className="mb-3">
                    <label className="form-label">Nom de la boutique</label>
                    <input name="seller_store_name" className="form-control" onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="seller_description" className="form-control" rows="3" onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 mt-4 py-2" disabled={loading}>
              {loading ? "Inscription en cours..." : "✅ S'inscrire"}
            </button>
          </form>

          <hr className="my-4" />
          <p className="text-center mb-0">
            Déjà inscrit ? <Link to="/login">🔐 Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;