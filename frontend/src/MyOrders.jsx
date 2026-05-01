import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "./api";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("my-orders/");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge bg-warning">⏳ En attente</span>,
      paid: <span className="badge bg-success">✅ Payé</span>,
      cancelled: <span className="badge bg-danger">❌ Annulé</span>,
    };
    return badges[status] || <span className="badge bg-secondary">{status}</span>;
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">📦 Historique de mes commandes</h2>
      
      {orders.length === 0 ? (
        <div className="alert alert-info">
          Vous n'avez pas encore passé de commande.
          <Link to="/" className="alert-link"> Découvrir les produits</Link>
        </div>
      ) : (
        <div className="row">
          {orders.map((order) => (
            <div className="col-md-6 mb-4" key={order.id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h5>{order.listing_title}</h5>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-muted">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-muted">Vendeur: {order.seller_full_name || order.seller_name}</p>
                  <p className="fw-bold fs-4 text-primary">{parseFloat(order.listing_price).toLocaleString()} Ar</p>
                  <Link to={`/product/${order.listing}`} className="btn btn-outline-primary">Voir le produit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;