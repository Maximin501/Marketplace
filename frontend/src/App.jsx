import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import Footer from "./Footer";

function App() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // ========== CHARGEMENT INITIAL DE L'UTILISATEUR ==========
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access");
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUserProfile(userData.profile);
      } catch (err) {
        console.error("Erreur parsing user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      }
    }
  }, []);

  // ========== RÉCUPÉRATION DES ANNONCES ET CATÉGORIES ==========
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [listRes, catRes] = await Promise.all([
          api.get("listings/"),
          api.get("categories/"),
        ]);

        setListings(listRes.data || []);
        setFilteredListings(listRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("API ERROR:", err);
        if (err.response?.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
        } else {
          setError("Erreur lors du chargement des données. Veuillez réessayer.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ========== FILTRAGE DES ANNONCES ==========
  useEffect(() => {
    let results = [...listings];

    // Filtre par recherche (titre, ville, catégorie, description)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      results = results.filter((item) =>
        `${item.title} ${item.city} ${item.category?.name || ''} ${item.description || ''}`
          .toLowerCase()
          .includes(searchLower)
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== "all") {
      results = results.filter(
        (item) => item.category?.id === Number(selectedCategory)
      );
    }

    // Filtre par prix minimum
    if (minPrice) {
      results = results.filter((item) => item.price >= Number(minPrice));
    }

    // Filtre par prix maximum
    if (maxPrice) {
      results = results.filter((item) => item.price <= Number(maxPrice));
    }

    setFilteredListings(results);
  }, [search, listings, selectedCategory, minPrice, maxPrice]);

  // ========== DÉCONNEXION ==========
  const handleLogout = () => {
    // Supprimer toutes les données de session
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    
    // Réinitialiser l'état
    setUser(null);
    setUserProfile(null);
    
    // Rediriger vers l'accueil
    window.location.href = "/";
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
    } else if (userProfile?.is_buyer) {
      return "🛍️ Acheteur";
    }
    return "";
  };

  // ========== RENDU PRINCIPAL ==========
  return (
    <>
      {/* ========== BARRE DE NAVIGATION ========== */}
      <nav className="navbar navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand fs-3 fw-bold">
            🛒 Marketplace
          </Link>

          <div className="d-flex align-items-center">
            {!user ? (
              /* ========== BOUTONS NON CONNECTÉ ========== */
              <>
                <Link to="/login" className="btn btn-light me-2">
                  🔐 Connexion
                </Link>
                <Link to="/register" className="btn btn-warning">
                  📝 Inscription
                </Link>
              </>
            ) : (
              /* ========== MENU UTILISATEUR CONNECTÉ ========== */
              <div className="dropdown">
                <button 
                  className="btn btn-light dropdown-toggle d-flex align-items-center gap-2" 
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  id="userDropdown"
                >
                  {getAvatarUrl() ? (
                    <img 
                      src={getAvatarUrl()} 
                      className="rounded-circle" 
                      style={{ width: 32, height: 32, objectFit: "cover" }} 
                      alt="Avatar"
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" 
                      style={{ width: 32, height: 32, fontSize: 14 }}
                    >
                      {getInitials()}
                    </div>
                  )}
                  <span className="d-none d-md-inline">
                    {user?.full_name || user?.username}
                  </span>
                </button>
                
                {/* ========== MENU DÉROULANT ========== */}
                <ul 
                  className="dropdown-menu dropdown-menu-end shadow" 
                  style={{ minWidth: "300px", maxHeight: "80vh", overflowY: "auto" }}
                  aria-labelledby="userDropdown"
                >
                  
                  {/* ========================================== */}
                  {/* SECTION COMMUNE (Visible par tous les utilisateurs connectés) */}
                  {/* ========================================== */}
                  <li className="dropdown-header text-secondary">
                    👤 MON COMPTE
                  </li>
                  <li>
                    <Link to="/profile" className="dropdown-item">
                      ⚙️ Gérer mon profil (photo, infos)
                    </Link>
                  </li>
                  
                  {/* ========================================== */}
                  {/* SECTION ACHETEUR */}
                  {/* ========================================== */}
                  {userProfile?.is_buyer && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li className="dropdown-header text-primary">
                        🛍️ ESPACE ACHETEUR
                      </li>
                      
                      {/* LIEN VERS LE DASHBOARD ACHETEUR */}
                      <li>
                        <Link to="/buyer-dashboard" className="dropdown-item fw-bold">
                          📊 Tableau de bord acheteur
                        </Link>
                      </li>
                      
                      <li><hr className="dropdown-divider" /></li>
                      
                      <li>
                        <Link to="/" className="dropdown-item">
                          🔍 Voir et filtrer les produits
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-orders" className="dropdown-item">
                          📦 Voir mon historique de commandes
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {/* ========================================== */}
                  {/* SECTION VENDEUR */}
                  {/* ========================================== */}
                  {userProfile?.is_seller && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li className="dropdown-header text-success">
                        🏪 ESPACE VENDEUR
                      </li>
                      
                      {/* LIEN VERS LE DASHBOARD VENDEUR */}
                      <li>
                        <Link to="/seller-dashboard" className="dropdown-item fw-bold">
                          📊 Tableau de bord vendeur
                        </Link>
                      </li>
                      
                      <li><hr className="dropdown-divider" /></li>
                      
                      {/* Gestion des annonces */}
                      <li>
                        <Link to="/create" className="dropdown-item text-success fw-bold">
                          ➕ Publier une nouvelle annonce
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-listings" className="dropdown-item">
                          📋 Voir mes annonces
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-listings" className="dropdown-item">
                          ✏️ Modifier mes annonces
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-listings" className="dropdown-item">
                          🗑️ Supprimer mes annonces
                        </Link>
                      </li>
                      
                      <li><hr className="dropdown-divider" /></li>
                      
                      {/* Gestion boutique et ventes */}
                      <li>
                        <Link to="/profile" className="dropdown-item">
                          🏪 Gérer ma boutique (nom, description)
                        </Link>
                      </li>
                      <li>
                        <Link to="/my-sales" className="dropdown-item">
                          💰 Voir mon chiffre d'affaires
                        </Link>
                      </li>
                    </>
                  )}
                  
                  {/* ========================================== */}
                  {/* BOUTON DÉCONNEXION (Toujours visible si connecté) */}
                  {/* ========================================== */}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item text-danger fw-bold"
                    >
                      🚪 Se déconnecter
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="container mt-4">
        
        {/* ========== BANNIÈRE DE BIENVENUE AVEC ACTIONS RAPIDES ========== */}
        {user && (
          <div className="alert alert-success mb-4 shadow-sm">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
              {/* Avatar et infos utilisateur */}
              <div className="d-flex align-items-center gap-3 flex-grow-1">
                {getAvatarUrl() ? (
                  <img 
                    src={getAvatarUrl()} 
                    className="rounded-circle" 
                    style={{ width: 50, height: 50, objectFit: "cover" }} 
                    alt="Avatar"
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0" 
                    style={{ width: 50, height: 50, fontSize: 20 }}
                  >
                    {getInitials()}
                  </div>
                )}
                <div>
                  <strong className="fs-5">
                    Bienvenue {user?.full_name || user?.username} !
                  </strong>
                  <br />
                  <small className="text-muted">
                    {getUserRoleBadge()}
                  </small>
                </div>
              </div>
            </div>
            
            {/* BOUTONS D'ACTION RAPIDE POUR LE VENDEUR */}
            {userProfile?.is_seller && (
              <div className="row mt-3 g-2">
                <div className="col-12 col-md-3">
                  <Link to="/seller-dashboard" className="btn btn-outline-success w-100">
                    📊 Tableau de bord
                  </Link>
                </div>
                <div className="col-12 col-md-3">
                  <Link to="/create" className="btn btn-success w-100">
                    ➕ Publier une annonce
                  </Link>
                </div>
                <div className="col-12 col-md-3">
                  <Link to="/my-listings" className="btn btn-primary w-100">
                    📋 Voir mes annonces
                  </Link>
                </div>
                <div className="col-12 col-md-3">
                  <Link to="/my-sales" className="btn btn-info text-white w-100">
                    💰 Chiffre d'affaires
                  </Link>
                </div>
              </div>
            )}
            
            {/* BOUTONS D'ACTION RAPIDE POUR L'ACHETEUR */}
            {userProfile?.is_buyer && (
              <div className="row mt-3 g-2">
                <div className="col-12 col-md-4">
                  <Link to="/buyer-dashboard" className="btn btn-outline-primary w-100">
                    📊 Tableau de bord
                  </Link>
                </div>
                <div className="col-12 col-md-4">
                  <Link to="/" className="btn btn-primary w-100">
                    🔍 Voir les produits
                  </Link>
                </div>
                <div className="col-12 col-md-4">
                  <Link to="/my-orders" className="btn btn-info text-white w-100">
                    📦 Historique des commandes
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== TITRE DE LA PAGE ========== */}
        <h2 className="text-center mb-4">
          🏷️ Produits disponibles ({filteredListings.length})
        </h2>

        {/* ========== MESSAGE D'ERREUR ========== */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>⚠️</strong> {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* ========== BARRE DE FILTRES ========== */}
        <div className="card mb-4 p-3 shadow-sm">
          <div className="row g-2">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">🔍</span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Rechercher un produit..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">📂 Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input 
                type="number" 
                className="form-control" 
                placeholder="Prix min (Ar)" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
                min="0"
              />
            </div>
            <div className="col-md-2">
              <input 
                type="number" 
                className="form-control" 
                placeholder="Prix max (Ar)" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
                min="0"
              />
            </div>
            <div className="col-md-1">
              <button 
                className="btn btn-outline-secondary w-100" 
                onClick={() => { 
                  setMinPrice(""); 
                  setMaxPrice(""); 
                  setSearch(""); 
                  setSelectedCategory("all"); 
                }}
                title="Réinitialiser les filtres"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* ========== AFFICHAGE DES ANNONCES ========== */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-2">Chargement des annonces...</p>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="row">
            {filteredListings.map((product) => (
              <div className="col-md-4 col-lg-3 mb-4" key={product.id}>
                <div className="card h-100 shadow-sm">
                  {/* Image du produit */}
                  <img 
                    src={product.image_url || "https://placehold.co/300x200?text=No+Image"} 
                    className="card-img-top" 
                    style={{ height: 200, objectFit: "cover" }} 
                    alt={product.title}
                    onError={(e) => {
                      e.target.src = "https://placehold.co/300x200?text=No+Image";
                    }}
                  />
                  
                  {/* Contenu de la carte */}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{product.title}</h5>
                    
                    {/* Badge catégorie */}
                    {product.category?.name && (
                      <span className="badge bg-secondary mb-2 align-self-start">
                        {product.category.name}
                      </span>
                    )}
                    
                    {/* Prix */}
                    <p className="text-primary fw-bold fs-4 mb-1">
                      {product.price?.toLocaleString()} Ar
                    </p>
                    
                    {/* Ville */}
                    <p className="text-muted mb-1">
                      📍 {product.city}
                    </p>
                    
                    {/* Vendeur */}
                    <p className="text-muted small mb-3">
                      👤 {product.owner_full_name || product.owner_name}
                    </p>
                    
                    {/* Bouton voir détails */}
                    <Link 
                      to={`/product/${product.id}`} 
                      className="btn btn-outline-primary mt-auto w-100"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-muted fs-5 mb-3">
              😕 Aucun produit ne correspond à vos critères
            </p>
            <button 
              className="btn btn-outline-primary"
              onClick={() => { 
                setMinPrice(""); 
                setMaxPrice(""); 
                setSearch(""); 
                setSelectedCategory("all"); 
              }}
            >
              🔄 Réinitialiser les filtres
            </button>
          </div>
        )}
        <Footer />
      </div>
    </>
  );
}

export default App;