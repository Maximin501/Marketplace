import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function CreateListing() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    city: "",
    description: "",
    category_id: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("categories/");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
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
    if (form.image) {
      data.append("image", form.image);
    }

    try {
      await api.post("listings/create/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Annonce créée avec succès !");
      navigate("/");
    } catch (err) {
      setError("Erreur lors de la création de l'annonce");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Publier une annonce</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Titre *"
            className="form-control mb-3"
            onChange={handleChange}
            required
          />

          <input
            name="price"
            type="number"
            placeholder="Prix (Ar) *"
            className="form-control mb-3"
            onChange={handleChange}
            required
          />

          <input
            name="city"
            placeholder="Ville *"
            className="form-control mb-3"
            onChange={handleChange}
            required
          />

          <select
            name="category_id"
            className="form-select mb-3"
            onChange={handleChange}
            required
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            placeholder="Description *"
            className="form-control mb-3"
            rows="5"
            onChange={handleChange}
            required
          />

          <input
            type="file"
            className="form-control mb-3"
            onChange={handleFile}
            accept="image/*"
          />

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Publication..." : "Publier l'annonce"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateListing;