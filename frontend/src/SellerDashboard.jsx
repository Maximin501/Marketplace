import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";

function SellerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalSales: 0,
    revenue: 0
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Charger les infos utilisateur
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUserProfile(userData.profile);
      } catch (err) {
        console.error("Erreur parsing user:", err);
      }
    }
    
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      // Récupérer les annonces du vendeur
      const listingsRes = await api.get("my-listings/");
      const listings = listingsRes.data || [];
      
      // Récupérer les ventes
      const salesRes = await api.get("my-sales/");
      const sales = salesRes.data || [];
      
      // Calculer les statistiques
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.listing_price || 0), 0);
      const activeListings = listings.filter(l => l.is_active).length;
      
      setStats({
        totalListings: listings.length,
        activeListings: activeListings,
        totalSales: sales.length,
        revenue: totalRevenue
      });
      
      // Garder les 5 annonces les plus récentes
      setRecentListings(listings.slice(0, 5));
      
    } catch (err) {
      console.error("Erreur chargement données vendeur:", err);
    } finally {
      setLoading(false);
    }
  };

  // ========== FONCTIONS UTILITAIRES ==========
  const getAvatarUrl = () => {
    if (userProfile?.avatar_url) {
      return `http://127.0.0.1:8000${userProfile.avatar_url}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.full_name && user.full_name !== user.username) {
      return user.full_name.charAt(0).toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || "?";
  };

  const getUserRoleBadge = () => {
    if (userProfile?.is_seller && userProfile?.is_buyer) {
      return "🏪 Vendeur & 🛍️ Acheteur";
    } else if (userProfile?.is_seller) {
      return "🏪 Vendeur";
    }
    return "";
  };

  // ========== DÉCONNEXION ==========
  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      // Supprimer toutes les données de session
      localStorage.removeItem("user");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      
      // Rediriger vers la page d'accueil
      navigate("/");
      window.location.reload(); // Pour rafraîchir complètement l'état
    }
  };

  // ========== GESTION DES ANNONCES ==========
  const handleDeleteListing = async (id, title) => {
    if (window.confirm(`Supprimer définitivement l'annonce "${title}" ?`)) {
      try {
        await api.delete(`listings/${id}/delete/`);
        fetchSellerData(); // Rafraîchir les données
        alert("✅ Annonce supprimée avec succès");
      } catch (err) {
        alert("❌ Erreur lors de la suppression");
      }
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`listings/${id}/update/`, { is_active: !isActive });
      fetchSellerData();
      alert(isActive ? "✅ Annonce désactivée" : "✅ Annonce activée");
    } catch (err) {
      alert("❌ Erreur lors de la modification");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement de votre espace vendeur...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* ========== EN-TÊTE AVEC BOUTONS PUBLIER ET DÉCONNEXION ========== */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-0">🏪 Tableau de bord Vendeur</h2>
          <p className="text-muted mb-0">
            Bienvenue <strong>{user?.full_name || user?.username}</strong> - Gérez vos annonces et suivez vos performances
          </p>
          <small className="text-muted">
            {getUserRoleBadge()}
          </small>
        </div>
        <div className="d-flex gap-2">
          <Link to="/create" className="btn btn-success btn-lg">
            ➕ Publier une annonce
          </Link>
          {/* BOUTON DÉCONNEXION DANS L'EN-TÊTE */}
          <button 
            onClick={handleLogout} 
            className="btn btn-outline-danger btn-lg"
            title="Se déconnecter"
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* ========== CARTES STATISTIQUES ========== */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">📋 Total Annonces</h5>
              <h2 className="display-4">{stats.totalListings}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">✅ Actives</h5>
              <h2 className="display-4">{stats.activeListings}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">💰 Ventes</h5>
              <h2 className="display-4">{stats.totalSales}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-dark h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">💵 Chiffre d'affaires</h5>
              <h2 className="h4">{stats.revenue.toLocaleString()} Ar</h2>
            </div>
          </div>
        </div>
      </div>

      {/* ========== PROFIL VENDEUR + ACTIONS RAPIDES ========== */}
      <div className="row mb-4">
        {/* Profil Vendeur */}
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">👤 Mon Profil Vendeur</h5>
              {/* BOUTON DÉCONNEXION DANS LA CARTE PROFIL */}
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger btn-sm"
                title="Se déconnecter"
              >
                🚪
              </button>
            </div>
            <div className="card-body text-center">
              {getAvatarUrl() ? (
                <img 
                  src={getAvatarUrl()} 
                  className="rounded-circle mb-3" 
                  style={{ width: 100, height: 100, objectFit: "cover" }} 
                  alt="Avatar"
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto mb-3" 
                  style={{ width: 100, height: 100, fontSize: 40 }}
                >
                  {getInitials()}
                </div>
              )}
              <h5>{user?.full_name || user?.username}</h5>
              <p className="text-muted">@{user?.username}</p>
              
              {user?.email && (
                <p className="mb-1">
                  <strong>📧 Email:</strong> {user.email}
                </p>
              )}
              
              {userProfile?.seller_store_name && (
                <p className="mb-1">
                  <strong>🏪 Boutique:</strong> {userProfile.seller_store_name}
                </p>
              )}
              
              {userProfile?.phone && (
                <p className="mb-1">
                  <strong>📞 Téléphone:</strong> {userProfile.phone}
                </p>
              )}
              
              {userProfile?.address && (
                <p className="mb-1">
                  <strong>📍 Adresse:</strong> {userProfile.address}
                </p>
              )}
              
              <Link to="/profile" className="btn btn-outline-primary btn-sm mt-2">
                ⚙️ Modifier mon profil
              </Link>
              
              {/* BOUTON DÉCONNEXION DANS LE PROFIL */}
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger btn-sm mt-2 w-100"
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        </div>
        
        {/* Actions Rapides */}
        <div className="col-md-8 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">⚡ Actions Rapides</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <Link to="/create" className="btn btn-success w-100 py-3">
                    <span className="fs-5">➕</span><br />
                    Publier une annonce
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/my-listings" className="btn btn-primary w-100 py-3">
                    <span className="fs-5">📋</span><br />
                    Voir mes annonces
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/my-sales" className="btn btn-info text-white w-100 py-3">
                    <span className="fs-5">💰</span><br />
                    Voir mon chiffre d'affaires
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/profile" className="btn btn-secondary w-100 py-3">
                    <span className="fs-5">🏪</span><br />
                    Gérer ma boutique
                  </Link>
                </div>
              </div>
              
              <hr />
              
              {/* BOUTON DÉCONNEXION DANS ACTIONS RAPIDES */}
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger w-100 py-2"
              >
                🚪 Se déconnecter de mon compte vendeur
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== ANNONCES RÉCENTES ========== */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📋 Mes annonces récentes</h5>
          <div className="d-flex gap-2">
            <Link to="/my-listings" className="btn btn-outline-primary btn-sm">
              Voir tout →
            </Link>
            {/* BOUTON DÉCONNEXION DANS L'EN-TÊTE DU TABLEAU */}
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-danger btn-sm"
              title="Se déconnecter"
            >
              🚪
            </button>
          </div>
        </div>
        <div className="card-body">
          {recentListings.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">Vous n'avez pas encore publié d'annonce</p>
              <Link to="/create" className="btn btn-success">
                ➕ Publier ma première annonce
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((listing) => (
                    <tr key={listing.id}>
                      <td>
                        <img 
                          src={listing.image_url || "https://placehold.co/50x50"} 
                          alt={listing.title}
                          style={{ width: 50, height: 50, objectFit: "cover" }}
                          className="rounded"
                        />
                      </td>
                      <td>
                        <strong>{listing.title}</strong>
                        <br />
                        <small className="text-muted">📍 {listing.city}</small>
                      </td>
                      <td>
                        <strong className="text-primary">
                          {listing.price.toLocaleString()} Ar
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${listing.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {listing.is_active ? '✅ Actif' : '🔴 Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {/* Bouton Modifier */}
                          <Link 
                            to={`/edit-listing/${listing.id}`}
                            className="btn btn-outline-primary"
                            title="Modifier l'annonce"
                          >
                            ✏️
                          </Link>
                          
                          {/* Bouton Activer/Désactiver */}
                          <button
                            className={`btn ${listing.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleActive(listing.id, listing.is_active)}
                            title={listing.is_active ? "Désactiver l'annonce" : "Activer l'annonce"}
                          >
                            {listing.is_active ? '👁️' : '🔒'}
                          </button>
                          
                          {/* Bouton Supprimer */}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteListing(listing.id, listing.title)}
                            title="Supprimer l'annonce"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* ========== PIED DE PAGE AVEC DÉCONNEXION ========== */}
      <div className="text-center mt-4">
        <button 
          onClick={handleLogout} 
          className="btn btn-danger btn-lg px-5"
        >
          🚪 Se déconnecter de mon compte vendeur
        </button>
        <p className="text-muted mt-2">
          <small>Vous serez redirigé vers la page d'accueil</small>
        </p>
      </div>
    </div>
  );
}

export default SellerDashboard;