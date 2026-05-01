import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Composants principaux
import App from "./App";
import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import ProductDetail from "./ProductDetail";

// Composants Vendeur
import SellerDashboard from "./SellerDashboard";
import CreateListing from "./CreateListing";
import EditListing from "./EditListing";
import MyListings from "./MyListings";
import MySales from "./MySales";

// Composants Acheteur
import BuyerDashboard from "./BuyerDashboard";
import MyOrders from "./MyOrders";

// Composants de paiement
import Success from "./Success";
import Cancel from "./Cancel";

// Sécurité
import PrivateRoute from "./PrivateRoute";

// Styles personnalisés
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ========================================== */}
        {/* ROUTES PUBLIQUES (Accessibles sans connexion) */}
        {/* ========================================== */}
        
        {/* Page d'accueil avec liste des produits */}
        <Route path="/" element={<App />} />
        
        {/* Détails d'un produit */}
        <Route path="/product/:id" element={<ProductDetail />} />
        
        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Pages de retour de paiement Stripe */}
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        
        {/* ========================================== */}
        {/* ROUTES PROTÉGÉES (Nécessitent une connexion) */}
        {/* ========================================== */}
        
        {/* Profil utilisateur (commun aux deux rôles) */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        
        {/* ========== ROUTES VENDEUR ========== */}
        
        {/* Tableau de bord vendeur */}
        <Route 
          path="/seller-dashboard" 
          element={
            <PrivateRoute requireSeller={true}>
              <SellerDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Créer une annonce */}
        <Route 
          path="/create" 
          element={
            <PrivateRoute requireSeller={true}>
              <CreateListing />
            </PrivateRoute>
          } 
        />
        
        {/* Modifier une annonce */}
        <Route 
          path="/edit-listing/:id" 
          element={
            <PrivateRoute requireSeller={true}>
              <EditListing />
            </PrivateRoute>
          } 
        />
        
        {/* Voir ses annonces */}
        <Route 
          path="/my-listings" 
          element={
            <PrivateRoute requireSeller={true}>
              <MyListings />
            </PrivateRoute>
          } 
        />
        
        {/* Voir son chiffre d'affaires */}
        <Route 
          path="/my-sales" 
          element={
            <PrivateRoute requireSeller={true}>
              <MySales />
            </PrivateRoute>
          } 
        />
        
        {/* ========== ROUTES ACHETEUR ========== */}
        
        {/* Tableau de bord acheteur */}
        <Route 
          path="/buyer-dashboard" 
          element={
            <PrivateRoute requireBuyer={true}>
              <BuyerDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Historique des commandes */}
        <Route 
          path="/my-orders" 
          element={
            <PrivateRoute requireBuyer={true}>
              <MyOrders />
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);