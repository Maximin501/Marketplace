import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from listings.models import Category, Listing
from django.contrib.auth.models import User
from django.core.files import File
from urllib.request import urlretrieve
import tempfile

# 1. Créer les catégories si elles n'existent pas
categories_data = [
    {'name': 'Électronique'},
    {'name': 'Maison'},
    {'name': 'Mode'},
    {'name': 'Sports'},
]

categories = {}
for cat_data in categories_data:
    category, created = Category.objects.get_or_create(name=cat_data['name'])
    categories[cat_data['name']] = category
    if created:
        print(f"✅ Catégorie créée: {category.name}")
    else:
        print(f"📁 Catégorie existante: {category.name}")

# 2. Récupérer ou créer un utilisateur test
user, created = User.objects.get_or_create(
    username='vendeur_demo',
    defaults={
        'email': 'demo@marketplace.com',
        'first_name': 'Jean',
        'last_name': 'Demo',
        'is_active': True
    }
)
if created:
    user.set_password('demo123456')
    user.save()
    print(f"👤 Utilisateur créé: {user.username} (mot de passe: demo123456)")
else:
    print(f"👤 Utilisateur existant: {user.username}")

# 3. Fonction pour télécharger et sauvegarder une image
def download_image(url, filename):
    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        urlretrieve(url, temp_path)
        return temp_path
    except Exception as e:
        print(f"⚠️ Erreur téléchargement {filename}: {e}")
        return None

# 4. Données des annonces
listings_data = [
    {
        'title': 'iPhone 14 Pro - 256GB',
        'price': 4500000,
        'city': 'Antananarivo',
        'description': 'iPhone 14 Pro comme neuf, acheté il y a 3 mois. Couleur Noir Sidéral, 256GB de stockage. Batterie à 98%, vendu avec boîte d\'origine et chargeur. Parfait état, pas de rayures.',
        'category': 'Électronique',
        'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
        'image_name': 'iphone14.jpg',
        'is_active': True
    },
    {
        'title': 'MacBook Air M2',
        'price': 8500000,
        'city': 'Antananarivo',
        'description': 'MacBook Air M2 13" 8GB RAM 256GB SSD. Garantie encore valable 1 an. Très peu utilisé, comme neuf. Couleur Argent. Livré avec chargeur et boîte.',
        'category': 'Électronique',
        'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
        'image_name': 'macbook.jpg',
        'is_active': True
    },
    {
        'title': 'Chaise de bureau ergonomique',
        'price': 850000,
        'city': 'Toamasina',
        'description': 'Chaise de bureau haut de gamme, réglable en hauteur, dossier inclinable avec support lombaire. Tissu respirant, roulettes silencieuses. Parfait pour télétravail.',
        'category': 'Maison',
        'image_url': 'https://images.unsplash.com/photo-1505843490538-5132c6c7d0e1?w=600',
        'image_name': 'chair.jpg',
        'is_active': True
    },
    {
        'title': 'Apple Watch Series 8',
        'price': 1200000,
        'city': 'Antananarivo',
        'description': 'Apple Watch Series 8 GPS 45mm. Aluminium couleur Minuit. Capteur de température, suivi du cycle, détection de collision. Bracelet sport inclus.',
        'category': 'Électronique',
        'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
        'image_name': 'applewatch.jpg',
        'is_active': True
    },
    {
        'title': 'Casque Sony WH-1000XM5',
        'price': 650000,
        'city': 'Mahajanga',
        'description': 'Casque Bluetooth Sony WH-1000XM5, réduction de bruit active exceptionnelle. Autonomie 30h, recharge rapide. Comme neuf, utilisé 2 fois seulement.',
        'category': 'Électronique',
        'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'image_name': 'headset.jpg',
        'is_active': True
    }
]

# 5. Ajouter les annonces
for data in listings_data:
    category = categories[data['category']]
    
    # Vérifier si l'annonce existe déjà (par titre)
    listing, created = Listing.objects.get_or_create(
        title=data['title'],
        owner=user,
        defaults={
            'price': data['price'],
            'city': data['city'],
            'description': data['description'],
            'category': category,
            'is_active': data['is_active']
        }
    )
    
    # Ajouter l'image si l'annonce vient d'être créée
    if created:
        # Télécharger l'image
        temp_path = download_image(data['image_url'], data['image_name'])
        if temp_path:
            with open(temp_path, 'rb') as f:
                listing.image.save(data['image_name'], File(f), save=True)
            os.remove(temp_path)
            print(f"✅ Annonce ajoutée avec image: {listing.title}")
        else:
            listing.save()
            print(f"⚠️ Annonce ajoutée sans image: {listing.title}")
    else:
        print(f"📦 Annonce existante: {listing.title}")

print("\n✨ Import terminé ! ✨")
print(f"📊 Statisques:")
print(f"   - Catégories: {Category.objects.count()}")
print(f"   - Annonces: {Listing.objects.count()}")
print(f"   - Annonces actives: {Listing.objects.filter(is_active=True).count()}")