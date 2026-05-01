import { Link } from "react-router-dom";

function Cancel() {
  return (
    <div className="container mt-5 text-center">
      <div className="alert alert-warning">
        <h2>❌ Paiement annulé</h2>
        <p>Votre paiement a été annulé.</p>
        <p>Vous pouvez réessayer si vous le souhaitez.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default Cancel;