import os
import django
import requests
from io import BytesIO
from django.core.files.images import ImageFile

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from listings.models import Category, Listing
from django.utils import timezone

# URLs d'images gratuites (Unsplash)
IMAGE_URLS = {
    'iPhone 13 Pro Max': 'https://images.unsplash.com/photo-1632661679559-71b8c5b8f5c4?w=600',
    'Robe élégante': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    'Canapé moderne': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    'Vélo de course': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600',
    'Ballon de football': 'https://images.unsplash.com/photo-1614633832901-f1c0a6c3a0c6?w=600',
}

def download_image(url):
    """Télécharge une image depuis une URL"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return BytesIO(response.content)
    except Exception as e:
        print(f"Erreur téléchargement image: {e}")
    return None

def create_test_data():
    print("📊 Création des données de test...")
    
    # 1. Créer les catégories
    categories_data = [
        {'name': 'Électronique', 'icon': '📱', 'description': 'Smartphones, ordinateurs, tablettes'},
        {'name': 'Mode & Vêtements', 'icon': '👕', 'description': 'Vêtements, chaussures, accessoires'},
        {'name': 'Maison & Jardin', 'icon': '🏠', 'description': 'Meubles, décoration, outillage'},
        {'name': 'Véhicules', 'icon': '🚗', 'description': 'Voitures, motos, vélos'},
        {'name': 'Sports & Loisirs', 'icon': '⚽', 'description': 'Équipement sportif, jeux'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'icon': cat_data['icon'],
                'description': cat_data['description']
            }
        )
        categories[cat_data['name']] = category
        status = "✅ Créée" if created else "⏭️ Existante"
        print(f"  {status}: Catégorie '{category.name}'")
    
    # 2. Créer ou récupérer l'utilisateur vendeur
    seller, created = User.objects.get_or_create(
        username='vendeur_test',
        defaults={
            'email': 'vendeur@example.com',
            'first_name': 'Jean',
            'last_name': 'Dupont'
        }
    )
    if created:
        seller.set_password('test1234')
        seller.save()
        # Activer le profil vendeur
        seller.profile.is_seller = True
        seller.profile.seller_store_name = "Boutique Test"
        seller.profile.seller_description = "Boutique de démonstration"
        seller.profile.phone = "+261 34 00 000 00"
        seller.profile.address = "Antananarivo, Madagascar"
        seller.profile.save()
        print(f"  ✅ Vendeur créé: {seller.username} (mot de passe: test1234)")
    else:
        print(f"  ⏭️ Vendeur existant: {seller.username}")
    
    # 3. Créer les annonces
    listings_data = [
        {
            'title': 'iPhone 13 Pro Max - 256Go',
            'price': 2500000,
            'city': 'Antananarivo',
            'description': 'iPhone 13 Pro Max en excellent état. 256Go de stockage, couleur graphite. Accessoires inclus : chargeur, câble, coque de protection.',
            'category': 'Électronique',
        },
        {
            'title': 'Robe de soirée élégante',
            'price': 85000,
            'city': 'Toamasina',
            'description': 'Magnifique robe de soirée rouge, taille M. Portée une seule fois. Parfaite pour les occasions spéciales.',
            'category': 'Mode & Vêtements',
        },
        {
            'title': 'Canapé 3 places moderne',
            'price': 1200000,
            'city': 'Antananarivo',
            'description': 'Canapé 3 places en tissu gris. Très confortable, état neuf. Dimensions : 220cm x 90cm x 85cm.',
            'category': 'Maison & Jardin',
        },
        {
            'title': 'Vélo de course Giant TCR',
            'price': 1800000,
            'city': 'Antsirabe',
            'description': 'Vélo de course Giant TCR Advanced 2. Cadre carbone, groupe Shimano 105. Parfait pour les cyclistes passionnés.',
            'category': 'Véhicules',
        },
        {
            'title': 'Ballon de football officiel FIFA',
            'price': 45000,
            'city': 'Mahajanga',
            'description': 'Ballon de football officiel taille 5. Homologué FIFA. Idéal pour les matchs et les entraînements.',
            'category': 'Sports & Loisirs',
        },
    ]
    
    for listing_data in listings_data:
        # Vérifier si l'annonce existe déjà
        existing = Listing.objects.filter(
            title=listing_data['title'],
            owner=seller
        ).first()
        
        if existing:
            print(f"  ⏭️ Annonce existante: {listing_data['title']}")
            continue
        
        # Créer l'annonce
        listing = Listing.objects.create(
            owner=seller,
            title=listing_data['title'],
            price=listing_data['price'],
            city=listing_data['city'],
            description=listing_data['description'],
            category=categories[listing_data['category']],
            is_active=True,
            views_count=0,
        )
        
        # Télécharger et attacher l'image
        image_url = IMAGE_URLS.get(listing_data['title'])
        if image_url:
            image_data = download_image(image_url)
            if image_data:
                filename = f"{listing_data['title'].lower().replace(' ', '_')[:30]}.jpg"
                listing.image.save(filename, ImageFile(image_data))
                print(f"  ✅ Créée avec image: {listing.title} - {listing.price:,.0f} Ar")
            else:
                print(f"  ⚠️ Créée sans image: {listing.title} - {listing.price:,.0f} Ar")
        else:
            print(f"  ⚠️ Créée sans image: {listing.title} - {listing.price:,.0f} Ar")
    
    print("\n✅ Données de test créées avec succès !")
    print(f"\n📋 Récapitulatif :")
    print(f"   - {Category.objects.count()} catégories")
    print(f"   - {Listing.objects.count()} annonces")
    print(f"   - Vendeur: {seller.username} / test1234")

if __name__ == '__main__':
    # Installer requests si nécessaire
    try:
        import requests
    except ImportError:
        print("Installation de requests...")
        os.system('pip install requests')
        import requests
    
    create_test_data()