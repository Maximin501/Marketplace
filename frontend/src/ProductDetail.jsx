import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`listings/${id}/`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
        setError("Produit non trouvé");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const res = await api.post(`pay/${id}/`);
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Erreur lors du paiement");
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;
  if (!product) return null;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <img
            src={
              product.image_url
                ? `http://127.0.0.1:8000${product.image_url}`
                : "https://placehold.co/600x400?text=No+Image"
            }
            className="img-fluid rounded shadow"
            alt={product.title}
          />
        </div>
        
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2>{product.title}</h2>
              <p className="text-muted">
                Catégorie: {product.category?.name || "Non catégorisé"}
              </p>
              <p className="text-primary fw-bold fs-1">
                {parseFloat(product.price).toLocaleString()} Ar
              </p>
              <p className="text-secondary">📍 {product.city}</p>
              <h5>Description</h5>
              <p className="text-muted">{product.description}</p>
              
              <hr />
              
              <button
                className="btn btn-success w-100 py-2"
                onClick={handleBuy}
              >
                Acheter maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;