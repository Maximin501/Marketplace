import requests

API_URL = "https://marketplace-n63e.onrender.com/api"
USERNAME = "admin-maximin"
PASSWORD = "admin123"

# 1. Connexion
r = requests.post(f"{API_URL}/token/", json={"username": USERNAME, "password": PASSWORD})
token = r.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Activer le rôle vendeur
data = {
    "is_seller": True,
    "is_buyer": True,
    "seller_store_name": "Ma Boutique",
    "seller_description": "Vendeur officiel"
}

r = requests.patch(f"{API_URL}/profile/", headers=headers, json=data)
print(f"✅ Profil mis à jour: {r.status_code}")
print(r.json())