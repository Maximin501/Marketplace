import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "./api";

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await api.get("my-listings/");
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, isActive) => {
    try {
      await api.patch(`listings/${id}/update/`, { is_active: !isActive });
      fetchListings();
      alert(`✅ Annonce ${!isActive ? "activée" : "désactivée"}`);
    } catch (err) {
      alert("❌ Erreur");
    }
  };

  const deleteListing = async (id) => {
    if (window.confirm("Supprimer définitivement cette annonce ?")) {
      try {
        await api.delete(`listings/${id}/delete/`);
        fetchListings();
        alert("✅ Annonce supprimée");
      } catch (err) {
        alert("❌ Erreur");
      }
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏪 Mes annonces</h2>
        <Link to="/create" className="btn btn-success">➕ Publier</Link>
      </div>
      
      {listings.length === 0 ? (
        <div className="alert alert-info">Vous n'avez pas encore d'annonce. <Link to="/create">Publier</Link></div>
      ) : (
        <div className="row">
          {listings.map((listing) => (
            <div className="col-md-4 mb-4" key={listing.id}>
              <div className="card h-100 shadow-sm">
                <img src={listing.image_url || "https://placehold.co/300x200"} className="card-img-top" style={{ height: 150, objectFit: "cover" }} />
                <div className="card-body">
                  <h5>{listing.title}</h5>
                  <p className="text-primary fw-bold">{listing.price.toLocaleString()} Ar</p>
                  <p className="text-muted">📍 {listing.city}</p>
                  <span className={`badge ${listing.is_active ? 'bg-success' : 'bg-secondary'} mb-2`}>
                    {listing.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="btn-group w-100">
                    <Link to={`/edit-listing/${listing.id}`} className="btn btn-outline-primary btn-sm">✏️ Modifier</Link>
                    <button onClick={() => updateStatus(listing.id, listing.is_active)} className={`btn ${listing.is_active ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm`}>
                      {listing.is_active ? '🔒 Désactiver' : '🔓 Activer'}
                    </button>
                    <button onClick={() => deleteListing(listing.id)} className="btn btn-outline-danger btn-sm">🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;