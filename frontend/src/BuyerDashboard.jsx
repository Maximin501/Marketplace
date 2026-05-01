import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "./api";

function BuyerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Statistiques acheteur
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    totalSpent: 0
  });
  
  // Données
  const [recentOrders, setRecentOrders] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favoriteSellers, setFavoriteSellers] = useState([]);

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
    
    fetchBuyerData();
  }, []);

  const fetchBuyerData = async () => {
    try {
      // Récupérer les commandes
      const ordersRes = await api.get("my-orders/");
      const orders = ordersRes.data || [];
      
      // Calculer les statistiques
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const paidOrders = orders.filter(o => o.status === 'paid').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const totalSpent = orders
        .filter(o => o.status === 'paid')
        .reduce((sum, order) => sum + parseFloat(order.listing_price || 0), 0);
      
      setStats({
        totalOrders: orders.length,
        pendingOrders: pendingOrders,
        paidOrders: paidOrders,
        cancelledOrders: cancelledOrders,
        totalSpent: totalSpent
      });
      
      // Garder les 5 commandes les plus récentes
      setRecentOrders(orders.slice(0, 5));
      
      // Récupérer les derniers produits
      const listingsRes = await api.get("listings/");
      setLatestProducts((listingsRes.data || []).slice(0, 8));
      
      // Récupérer les catégories
      const catRes = await api.get("categories/");
      setCategories(catRes.data || []);
      
      // Extraire les vendeurs uniques des commandes
      const sellersMap = new Map();
      orders.forEach(order => {
        if (order.seller_name && !sellersMap.has(order.seller_name)) {
          sellersMap.set(order.seller_name, {
            name: order.seller_full_name || order.seller_name,
            username: order.seller_name,
            orderCount: 1
          });
        } else if (order.seller_name) {
          const seller = sellersMap.get(order.seller_name);
          seller.orderCount++;
        }
      });
      setFavoriteSellers(Array.from(sellersMap.values()).slice(0, 5));
      
    } catch (err) {
      console.error("Erreur chargement données acheteur:", err);
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

  // ========== DÉCONNEXION ==========
  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/");
      window.location.reload();
    }
  };

  // ========== FORMATAGE DATE ==========
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // ========== BADGE STATUT COMMANDE ==========
  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="badge bg-warning text-dark">⏳ En attente</span>,
      paid: <span className="badge bg-success">✅ Payé</span>,
      cancelled: <span className="badge bg-danger">❌ Annulé</span>,
    };
    return badges[status] || <span className="badge bg-secondary">{status}</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement de votre espace acheteur...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* ========== EN-TÊTE AVEC BOUTONS ========== */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-0">🛍️ Tableau de bord Acheteur</h2>
          <p className="text-muted mb-0">
            Bienvenue <strong>{user?.full_name || user?.username}</strong> - Découvrez et achetez des produits
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/" className="btn btn-primary btn-lg">
            🔍 Voir les produits
          </Link>
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
              <h5 className="card-title">📦 Total Commandes</h5>
              <h2 className="display-4">{stats.totalOrders}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">✅ Commandes Payées</h5>
              <h2 className="display-4">{stats.paidOrders}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-dark h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">⏳ En Attente</h5>
              <h2 className="display-4">{stats.pendingOrders}</h2>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card bg-info text-white h-100 shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">💰 Total Dépensé</h5>
              <h2 className="h4">{stats.totalSpent.toLocaleString()} Ar</h2>
            </div>
          </div>
        </div>
      </div>

      {/* ========== PROFIL ACHETEUR + ACTIONS RAPIDES ========== */}
      <div className="row mb-4">
        {/* Profil Acheteur */}
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">👤 Mon Profil Acheteur</h5>
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
                  <Link to="/" className="btn btn-primary w-100 py-3">
                    <span className="fs-5">🔍</span><br />
                    Voir et filtrer les produits
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/my-orders" className="btn btn-success w-100 py-3">
                    <span className="fs-5">📦</span><br />
                    Historique des commandes
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/profile" className="btn btn-info text-white w-100 py-3">
                    <span className="fs-5">👤</span><br />
                    Gérer mon profil
                  </Link>
                </div>
                <div className="col-md-6">
                  <Link to="/" className="btn btn-warning w-100 py-3">
                    <span className="fs-5">🏷️</span><br />
                    Parcourir les catégories
                  </Link>
                </div>
              </div>
              
              <hr />
              
              {/* Bouton déconnexion */}
              <button 
                onClick={handleLogout} 
                className="btn btn-outline-danger w-100"
              >
                🚪 Se déconnecter de mon compte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== DERNIERS PRODUITS ========== */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">🆕 Derniers produits disponibles</h5>
          <Link to="/" className="btn btn-outline-primary btn-sm">
            Voir tout →
          </Link>
        </div>
        <div className="card-body">
          {latestProducts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">Aucun produit disponible pour le moment</p>
            </div>
          ) : (
            <div className="row">
              {latestProducts.map((product) => (
                <div className="col-md-3 col-sm-6 mb-3" key={product.id}>
                  <div className="card h-100 shadow-sm">
                    <img 
                      src={product.image_url || "https://placehold.co/200x150?text=No+Image"} 
                      className="card-img-top" 
                      style={{ height: 120, objectFit: "cover" }} 
                      alt={product.title}
                    />
                    <div className="card-body p-2">
                      <h6 className="card-title small mb-1">{product.title}</h6>
                      <p className="text-primary fw-bold mb-1">
                        {product.price?.toLocaleString()} Ar
                      </p>
                      <p className="text-muted small mb-2">
                        📍 {product.city}
                      </p>
                      <Link 
                        to={`/product/${product.id}`} 
                        className="btn btn-outline-primary btn-sm w-100"
                      >
                        Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== COMMANDES RÉCENTES ========== */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">📦 Mes commandes récentes</h5>
          <Link to="/my-orders" className="btn btn-outline-primary btn-sm">
            Voir tout →
          </Link>
        </div>
        <div className="card-body">
          {recentOrders.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">Vous n'avez pas encore passé de commande</p>
              <Link to="/" className="btn btn-primary">
                🔍 Découvrir des produits
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Produit</th>
                    <th>Vendeur</th>
                    <th>Prix</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.listing_title}</strong>
                      </td>
                      <td>
                        <small>{order.seller_full_name || order.seller_name}</small>
                      </td>
                      <td>
                        <strong className="text-primary">
                          {parseFloat(order.listing_price).toLocaleString()} Ar
                        </strong>
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(order.created_at)}
                        </small>
                      </td>
                      <td>
                        <Link 
                          to={`/product/${order.listing}`}
                          className="btn btn-outline-primary btn-sm"
                          title="Voir le produit"
                        >
                          👁️
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========== CATÉGORIES ========== */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">📂 Explorer par catégories</h5>
        </div>
        <div className="card-body">
          {categories.length === 0 ? (
            <p className="text-muted text-center">Aucune catégorie disponible</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  to={`/?category=${category.id}`}
                  className="btn btn-outline-secondary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== VENDEURS FAVORIS ========== */}
      {favoriteSellers.length > 0 && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">⭐ Mes vendeurs</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Vendeur</th>
                    <th>Nombre de commandes</th>
                  </tr>
                </thead>
                <tbody>
                  {favoriteSellers.map((seller, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{seller.name}</strong>
                        <br />
                        <small className="text-muted">@{seller.username}</small>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {seller.orderCount} commande(s)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========== PIED DE PAGE AVEC DÉCONNEXION ========== */}
      <div className="text-center mt-4">
        <button 
          onClick={handleLogout} 
          className="btn btn-danger btn-lg"
        >
          🚪 Se déconnecter de mon compte acheteur
        </button>
      </div>
    </div>
  );
}

export default BuyerDashboard;