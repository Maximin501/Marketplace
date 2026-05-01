import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-white mt-5" style={{ 
      background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 50%, #1565c0 100%)",
      borderTop: "4px solid #0d6efd"
    }}>
      <div className="container py-5">
        <div className="row">
          {/* ========== COLONNE 1 : À PROPOS ========== */}
          <div className="col-lg-4 mb-4 mb-lg-0">
            <h5 className="text-uppercase mb-3 fw-bold text-white">
              <span className="text-warning">🛒</span> Marketplace
            </h5>
            <p className="small text-white-50">
              Plateforme de vente en ligne permettant aux vendeurs de publier 
              leurs annonces et aux acheteurs de trouver les meilleurs produits.
            </p>
            <div className="mt-3">
              <p className="small mb-1 text-white-50">
                <strong className="text-white">📧 Email :</strong>{" "}
                <a href="mailto:vitasoam@gmail.com" className="text-white text-decoration-none hover-link">
                  vitasoam@gmail.com
                </a>
              </p>
              <p className="small mb-1 text-white-50">
                <strong className="text-white">📱 WhatsApp :</strong>{" "}
                <a 
                  href="https://wa.me/261341646096" 
                  className="text-white text-decoration-none hover-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +261 34 16 460 96
                </a>
              </p>
            </div>
          </div>

          {/* ========== COLONNE 2 : LIENS RAPIDES ========== */}
          <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
            <h6 className="text-uppercase mb-3 fw-bold text-white">Liens Rapides</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-white-50 text-decoration-none hover-link">
                  🏠 Accueil
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/login" className="text-white-50 text-decoration-none hover-link">
                  🔐 Connexion
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className="text-white-50 text-decoration-none hover-link">
                  📝 Inscription
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="text-white-50 text-decoration-none hover-link">
                  👤 Profil
                </Link>
              </li>
            </ul>
          </div>

          {/* ========== COLONNE 3 : FONCTIONNALITÉS ========== */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="text-uppercase mb-3 fw-bold text-white">Fonctionnalités</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <span className="text-white-50">🛍️ Acheter des produits</span>
              </li>
              <li className="mb-2">
                <span className="text-white-50">🏪 Vendre des articles</span>
              </li>
              <li className="mb-2">
                <span className="text-white-50">💳 Paiement sécurisé</span>
              </li>
              <li className="mb-2">
                <span className="text-white-50">📊 Tableau de bord</span>
              </li>
              <li className="mb-2">
                <span className="text-white-50">⭐ Avis et évaluations</span>
              </li>
            </ul>
          </div>

          {/* ========== COLONNE 4 : CONTACT & RÉSEAUX ========== */}
          <div className="col-lg-3">
            <h6 className="text-uppercase mb-3 fw-bold text-white">
              👨‍💻 Développeur
            </h6>
            
            {/* Nom du développeur */}
            <div className="mb-3">
              <p className="text-white mb-1 fw-bold fs-5">
                VITASOA Mahefa Maximin
              </p>
              <p className="text-white-50 small mb-0">
                Développeur Full Stack
              </p>
            </div>

            {/* Réseaux sociaux */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {/* Portfolio */}
              <a
                href="https://mahefamaximinvitasoa.netlify.app/portfolio-frontend/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light btn-sm"
                title="Portfolio"
                style={{ transition: "all 0.3s ease" }}
              >
                🌐 Portfolio
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/mahefa-maximin-vitasoa-30184222a/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light btn-sm"
                title="LinkedIn"
                style={{ transition: "all 0.3s ease" }}
              >
                💼 LinkedIn
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/Maximin501"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light btn-sm"
                title="GitHub"
                style={{ transition: "all 0.3s ease" }}
              >
                💻 GitHub
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/MaximinMahefa/?locale=fr_FR"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light btn-sm"
                title="Facebook"
                style={{ transition: "all 0.3s ease" }}
              >
                📘 Facebook
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/261341646096"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light btn-sm"
                title="WhatsApp"
                style={{ transition: "all 0.3s ease" }}
              >
                💬 WhatsApp
              </a>

              {/* Email */}
              <a
                href="mailto:vitasoam@gmail.com"
                className="btn btn-light btn-sm"
                title="Email"
                style={{ transition: "all 0.3s ease" }}
              >
                ✉️ Email
              </a>
            </div>

            {/* Contact direct */}
            <div className="mt-3">
              <a 
                href="https://wa.me/261341646096" 
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm w-100 shadow"
                style={{ 
                  transition: "all 0.3s ease",
                  backgroundColor: "#25d366",
                  borderColor: "#25d366"
                }}
              >
                💬 Me contacter sur WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ========== SÉPARATEUR ========== */}
        <hr className="my-4" style={{ borderColor: "rgba(255,255,255,0.2)" }} />

        {/* ========== COPYRIGHT ========== */}
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
            <p className="small mb-0 text-white-50">
              © {currentYear} Marketplace - Tous droits réservés
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="small mb-0 text-white-50">
              Développé avec ❤️ par{" "}
              <a 
                href="https://mahefamaximinvitasoa.netlify.app/portfolio-frontend/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white fw-bold text-decoration-none hover-link"
              >
                Mahefa Maximin VITASOA
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ========== STYLES CSS INTÉGRÉS ========== */}
      <style jsx="true">{`
        footer .hover-link {
          transition: all 0.3s ease;
          position: relative;
        }
        
        footer .hover-link:hover {
          color: #ffc107 !important;
          text-decoration: underline !important;
        }
        
        footer .btn-light {
          color: #1a73e8;
          font-weight: 500;
          border: 2px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.95);
        }
        
        footer .btn-light:hover {
          background: #ffffff;
          border-color: #ffffff;
          color: #0d47a1;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        
        footer .btn-success:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(37, 211, 102, 0.5);
          background-color: #1ed760;
          border-color: #1ed760;
        }
        
        footer a {
          transition: all 0.3s ease;
        }
      `}</style>
    </footer>
  );
}

export default Footer;