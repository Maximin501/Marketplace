import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

function Success() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    // Optionnel: confirmer la commande auprès du backend
    console.log("Commande confirmée:", orderId);
  }, [orderId]);

  return (
    <div className="container mt-5 text-center">
      <div className="alert alert-success">
        <h2>✅ Paiement réussi !</h2>
        <p>Votre commande a bien été enregistrée.</p>
        <p>Vous recevrez un email de confirmation.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Retour à l'accueil
        </Link>
        <Link to="/my-orders" className="btn btn-outline-primary mt-3 ms-2">
          Voir mes commandes
        </Link>
      </div>
    </div>
  );
}

export default Success;