import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api";

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    price: "",
    city: "",
    description: "",
    category_id: "",
    image: null,
    is_active: true,
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [listingRes, catRes] = await Promise.all([
        api.get(`listings/${id}/`),
        api.get("categories/"),
      ]);
      
      const listing = listingRes.data;
      setForm({
        title: listing.title,
        price: listing.price,
        city: listing.city,
        description: listing.description,
        category_id: listing.category?.id || "",
        is_active: listing.is_active,
        image: null,
      });
      setCurrentImage(listing.image_url);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const data = new FormData();
    data.append("title", form.title);
    data.append("price", form.price);
    data.append("city", form.city);
    data.append("description", form.description);
    data.append("category_id", form.category_id);
    data.append("is_active", form.is_active);
    if (form.image) data.append("image", form.image);

    try {
      await api.patch(`listings/${id}/update/`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✅ Annonce modifiée avec succès !");
      navigate("/my-listings");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await api.patch(`listings/${id}/update/`, { is_active: !form.is_active });
      setForm({ ...form, is_active: !form.is_active });
      alert(form.is_active ? "✅ Annonce désactivée" : "✅ Annonce activée");
    } catch (err) {
      alert("Erreur lors de la modification");
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <div className="alert alert-danger m-5">{error}</div>;

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">✏️ Modifier l'annonce</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Titre *</label>
              <input
                name="title"
                className="form-control"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Prix (Ar) *</label>
                <input
                  name="price"
                  type="number"
                  className="form-control"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ville *</label>
                <input
                  name="city"
                  className="form-control"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Catégorie *</label>
              <select
                name="category_id"
                className="form-select"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Choisir une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-control"
                rows="5"
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>
            
            {/* Image actuelle */}
            {currentImage && (
              <div className="mb-3 text-center">
                <label className="form-label">Image actuelle</label>
                <img
                  src={`http://127.0.0.1:8000${currentImage}`}
                  className="img-fluid rounded"
                  style={{ maxHeight: 150 }}
                  alt="Current"
                />
              </div>
            )}
            
            <div className="mb-3">
              <label className="form-label">Nouvelle image (optionnel)</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            
            <div className="mb-3 form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_active">
                {form.is_active ? "🟢 Annonce active (visible)" : "🔴 Annonce inactive (cachée)"}
              </label>
            </div>
            
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success flex-grow-1" disabled={loading}>
                {loading ? "Modification..." : "💾 Enregistrer les modifications"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/my-listings")}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditListing;