import requests
import json

# ============================================================
# CONFIGURATION
# ============================================================
API_URL = "https://marketplace-n63e.onrender.com/api"
USERNAME = "admin-maximin"  # ← Votre username
PASSWORD = "admin123"  # ← Votre mot de passe

# ============================================================
# 1. CONNEXION
# ============================================================
print("🔐 Connexion...")
r = requests.post(f"{API_URL}/token/", json={
    "username": USERNAME,
    "password": PASSWORD
})

if r.status_code != 200:
    print(f"❌ Erreur connexion: {r.text}")
    exit()

token = r.json()["access"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Connecté !")

# ============================================================
# 2. RÉCUPÉRER LES CATÉGORIES
# ============================================================
r = requests.get(f"{API_URL}/categories/")
categories = {cat["name"]: cat["id"] for cat in r.json()}
print(f"📂 Catégories: {list(categories.keys())}")

# ============================================================
# 3. CRÉER 5 ANNONCES AVEC IMAGES
# ============================================================
listings = [
    {
        "title": "iPhone 15 Pro Max - 256Go",
        "price": 4500000,
        "city": "Antananarivo",
        "description": "iPhone 15 Pro Max neuf, 256Go, couleur titane naturel. Avec garantie Apple. Accessoires inclus : câble USB-C, adaptateur.",
        "category": "Électronique",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600"
    },
    {
        "title": "Nike Air Jordan 1 Retro",
        "price": 350000,
        "city": "Antsirabe",
        "description": "Nike Air Jordan 1 Retro High OG. Pointure 42. État neuf, jamais portées. Couleur Chicago Bulls.",
        "category": "Mode & Vêtements",
        "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600"
    },
    {
        "title": "Table basse design scandinave",
        "price": 280000,
        "city": "Toamasina",
        "description": "Table basse en bois massif style scandinave. Dimensions : 120x60x45cm. Très bon état.",
        "category": "Maison & Jardin",
        "image_url": "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600"
    },
    {
        "title": "Toyota Corolla Cross 2024",
        "price": 85000000,
        "city": "Antananarivo",
        "description": "Toyota Corolla Cross 2024, 15000km. État neuf. Climatisation, caméra de recul, GPS intégré.",
        "category": "Véhicules",
        "image_url": "https://images.unsplash.com/photo-1621996815303-b7b0f0c9c6e3?w=600"
    },
    {
        "title": "VTT Rockrider ST530",
        "price": 750000,
        "city": "Mahajanga",
        "description": "VTT Rockrider ST530 Decathlon. 27.5 pouces, 18 vitesses. Parfait pour les sentiers. État impeccable.",
        "category": "Sports & Loisirs",
        "image_url": "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600"
    },
]

print("\n📢 Création des annonces...")

for listing in listings:
    # Trouver l'ID de la catégorie
    category_name = listing.pop("category")
    if category_name not in categories:
        print(f"⚠️ Catégorie '{category_name}' non trouvée, annonce ignorée")
        continue
    
    listing["category_id"] = categories[category_name]
    
    # Créer l'annonce
    r = requests.post(
        f"{API_URL}/listings/create/",
        headers=headers,
        json=listing
    )
    
    if r.status_code == 201:
        print(f"✅ {listing['title']} - {listing['price']:,} Ar")
    else:
        print(f"❌ {listing['title']}: {r.text}")

print(f"\n🎉 Terminé ! Total annonces: {requests.get(f'{API_URL}/listings/').json()['count']}")