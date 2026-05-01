import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    is_seller: false,
    is_buyer: true,
    seller_store_name: "",
    seller_description: "",
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("me/");
      setUser(res.data);
      setForm({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        email: res.data.email || "",
        phone: res.data.profile?.phone || "",
        address: res.data.profile?.address || "",
        is_seller: res.data.profile?.is_seller || false,
        is_buyer: res.data.profile?.is_buyer || true,
        seller_store_name: res.data.profile?.seller_store_name || "",
        seller_description: res.data.profile?.seller_description || "",
      });
      if (res.data.profile?.avatar_url) {
        setAvatarPreview(`http://127.0.0.1:8000${res.data.profile.avatar_url}`);
      }
    } catch (err) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append("first_name", form.first_name);
    data.append("last_name", form.last_name);
    data.append("email", form.email);
    data.append("phone", form.phone);
    data.append("address", form.address);
    data.append("is_seller", form.is_seller);
    data.append("is_buyer", form.is_buyer);
    data.append("seller_store_name", form.seller_store_name);
    data.append("seller_description", form.seller_description);
    if (avatarFile) data.append("avatar", avatarFile);

    try {
      const res = await api.patch("profile/", data);
      localStorage.setItem("user", JSON.stringify(res.data));
      alert("✅ Profil mis à jour !");
      setEditing(false);
      fetchUser();
    } catch (err) {
      alert("❌ Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement...</div>;

  return (
    <div className="container mt-5" style={{ maxWidth: "700px" }}>
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">👤 Gérer mon profil</h3>
        </div>
        <div className="card-body">
          {!editing ? (
            <>
              <div className="text-center mb-3">
                {avatarPreview ? (
                  <img src={avatarPreview} className="rounded-circle" style={{ width: 120, height: 120, objectFit: "cover" }} />
                ) : (
                  <div className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center" style={{ width: 120, height: 120, fontSize: 48 }}>
                    {user?.full_name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <h4 className="text-center">{user?.full_name}</h4>
              <p className="text-center text-muted">@{user?.username}</p>
              <hr />
              <p><strong>📧 Email:</strong> {user?.email}</p>
              <p><strong>📞 Téléphone:</strong> {user?.profile?.phone || "Non renseigné"}</p>
              <p><strong>📍 Adresse:</strong> {user?.profile?.address || "Non renseignée"}</p>
              <p><strong>🏷️ Rôles:</strong> {user?.profile?.is_seller && user?.profile?.is_buyer ? "Vendeur & Acheteur" : user?.profile?.is_seller ? "Vendeur" : "Acheteur"}</p>
              
              {/* Informations boutique vendeur */}
              {user?.profile?.is_seller && (
                <>
                  <hr />
                  <h5>🏪 Ma boutique</h5>
                  <p><strong>Nom de la boutique:</strong> {user?.profile?.seller_store_name || "Non renseigné"}</p>
                  <p><strong>Description:</strong> {user?.profile?.seller_description || "Non renseignée"}</p>
                </>
              )}
              
              <button className="btn btn-primary mt-3 w-100" onClick={() => setEditing(true)}>✏️ Modifier mon profil</button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-center">
                {avatarPreview && <img src={avatarPreview} className="rounded-circle mb-2" style={{ width: 100, height: 100 }} />}
                <input type="file" className="form-control" accept="image/*" onChange={handleAvatarChange} />
                <small className="text-muted">Photo de profil</small>
              </div>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <input name="first_name" className="form-control" placeholder="Prénom" value={form.first_name} onChange={handleChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <input name="last_name" className="form-control" placeholder="Nom" value={form.last_name} onChange={handleChange} />
                </div>
              </div>
              
              <div className="mb-3">
                <input name="email" type="email" className="form-control" placeholder="Email" value={form.email} onChange={handleChange} required />
              </div>
              
              <div className="mb-3">
                <input name="phone" className="form-control" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
              </div>
              
              <div className="mb-3">
                <textarea name="address" className="form-control" rows="2" placeholder="Adresse" value={form.address} onChange={handleChange} />
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="is_buyer" name="is_buyer" checked={form.is_buyer} onChange={handleChange} />
                    <label className="form-check-label">🛍️ Acheteur</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="is_seller" name="is_seller" checked={form.is_seller} onChange={handleChange} />
                    <label className="form-check-label">🏪 Vendeur</label>
                  </div>
                </div>
              </div>
              
              {form.is_seller && (
                <>
                  <div className="mb-3">
                    <input name="seller_store_name" className="form-control" placeholder="Nom de la boutique" value={form.seller_store_name} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <textarea name="seller_description" className="form-control" rows="3" placeholder="Description de la boutique" value={form.seller_description} onChange={handleChange} />
                  </div>
                </>
              )}
              
              <button type="submit" className="btn btn-success w-100 mb-2" disabled={loading}>💾 Enregistrer</button>
              <button type="button" className="btn btn-secondary w-100" onClick={() => setEditing(false)}>❌ Annuler</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;