import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Trouver l'utilisateur
user = User.objects.get(username='admin-maximin')

# Activer le rôle vendeur
profile = user.profile
profile.is_seller = True
profile.is_buyer = True
profile.seller_store_name = "Ma Boutique"
profile.seller_description = "Vendeur officiel"
profile.save()

print(f"✅ Profil mis à jour pour {user.username}")
print(f"   - Vendeur: {profile.is_seller}")
print(f"   - Acheteur: {profile.is_buyer}")
print(f"   - Boutique: {profile.seller_store_name}")