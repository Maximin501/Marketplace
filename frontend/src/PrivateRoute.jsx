import { Navigate } from "react-router-dom";

function PrivateRoute({ children, requireSeller = false, requireBuyer = false }) {
  const token = localStorage.getItem("access");
  const userString = localStorage.getItem("user");

  // Vérifier si l'utilisateur est connecté
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  // Si un rôle spécifique est requis, vérifier le profil
  if (requireSeller || requireBuyer) {
    try {
      const user = JSON.parse(userString);
      const profile = user.profile;

      // Vérifier le rôle vendeur
      if (requireSeller && (!profile || !profile.is_seller)) {
        return (
          <div className="container mt-5 text-center">
            <div className="alert alert-warning">
              <h3>⚠️ Accès réservé aux vendeurs</h3>
              <p>Vous devez être vendeur pour accéder à cette page.</p>
              <p>
                Activez votre rôle vendeur dans{" "}
                <a href="/profile" className="alert-link">votre profil</a>.
              </p>
              <a href="/" className="btn btn-primary mt-3">
                Retour à l'accueil
              </a>
            </div>
          </div>
        );
      }

      // Vérifier le rôle acheteur
      if (requireBuyer && (!profile || !profile.is_buyer)) {
        return (
          <div className="container mt-5 text-center">
            <div className="alert alert-warning">
              <h3>⚠️ Accès réservé aux acheteurs</h3>
              <p>Vous devez être acheteur pour accéder à cette page.</p>
              <p>
                Activez votre rôle acheteur dans{" "}
                <a href="/profile" className="alert-link">votre profil</a>.
              </p>
              <a href="/" className="btn btn-primary mt-3">
                Retour à l'accueil
              </a>
            </div>
          </div>
        );
      }
    } catch (err) {
      // Si les données utilisateur sont corrompues
      localStorage.removeItem("user");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return <Navigate to="/login" replace />;
    }
  }

  // L'utilisateur est authentifié et a les bons rôles
  return children;
}

export default PrivateRoute;