import { useState, useEffect } from "react";
import api from "./api";

function MySales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await api.get("my-sales/");
      setSales(res.data);
      const total = res.data.reduce((sum, sale) => sum + parseFloat(sale.listing_price || 0), 0);
      setTotalRevenue(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4">💰 Chiffre d'affaires</h2>
      
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h5>Total ventes</h5>
              <h2>{sales.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h5>Chiffre d'affaires</h5>
              <h2>{totalRevenue.toLocaleString()} Ar</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h5>Commandes payées</h5>
              <h2>{sales.filter(s => s.status === 'paid').length}</h2>
            </div>
          </div>
        </div>
      </div>
      
      {sales.length === 0 ? (
        <div className="alert alert-info">Aucune vente pour le moment</div>
      ) : (
        <table className="table table-hover">
          <thead className="table-dark">
            <tr><th>Produit</th><th>Acheteur</th><th>Prix</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.listing_title}</td>
                <td>{sale.buyer_full_name || sale.buyer_name}</td>
                <td>{parseFloat(sale.listing_price).toLocaleString()} Ar</td>
                <td>{sale.status === 'paid' ? '✅ Payé' : '⏳ En attente'}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MySales;