import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "./api";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Obtenir les tokens
      const tokenRes = await api.post("token/", { username, password });
      
      console.log("Tokens reçus:", tokenRes.data);
      
      localStorage.setItem("access", tokenRes.data.access);
      localStorage.setItem("refresh", tokenRes.data.refresh);
      
      // 2. Configurer l'en-tête Authorization pour la requête suivante
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenRes.data.access}`;
      
      // 3. Récupérer les infos utilisateur
      const userRes = await api.get("me/");
      
      console.log("Utilisateur reçu:", userRes.data);
      
      // 4. Stocker l'utilisateur COMPLET
      localStorage.setItem("user", JSON.stringify(userRes.data));
      
      // 5. Rediriger
      navigate("/");
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      console.error("Réponse:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white text-center">
          <h3 className="mb-0">🔐 Connexion</h3>
        </div>
        <div className="card-body p-4">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              <strong>⚠️</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Entrez votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-2 fw-bold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
          
          <hr className="my-4" />
          
          <p className="text-center mb-0">
            Pas encore de compte ? <Link to="/register" className="text-decoration-none fw-bold">Inscription</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;