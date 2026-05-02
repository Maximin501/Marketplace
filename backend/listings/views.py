import json
import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Listing, Order, Profile
from .serializers import (
    CategorySerializer, ListingSerializer, 
    OrderSerializer, RegisterSerializer, 
    UserSerializer, ProfileUpdateSerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY


# ============================================================
# FONCTION UTILITAIRE - Nettoyage URL Cloudinary
# ============================================================
def clean_cloudinary_url(url):
    """Nettoie une URL Cloudinary pour éviter le double enveloppement"""
    if not url:
        return url
    
    # Si c'est déjà une URL Unsplash ou autre URL directe
    if 'unsplash.com' in url or 'images.unsplash.com' in url:
        return url
    
    # Si l'URL contient res.cloudinary.com en double
    if url.count('res.cloudinary.com') > 1:
        parts = url.split('/upload/')
        if len(parts) >= 2:
            # Garder uniquement la dernière partie après le dernier upload/
            last_part = parts[-1]
            # Si last_part contient encore une URL, extraire le chemin final
            if 'res.cloudinary.com' in last_part:
                sub_parts = last_part.split('/upload/')
                if len(sub_parts) >= 2:
                    last_part = sub_parts[-1]
            return f"https://res.cloudinary.com/dbf8mmbxp/image/upload/{last_part}"
    
    # Si l'URL commence déjà correctement
    if url.startswith('https://res.cloudinary.com/') and url.count('res.cloudinary.com') == 1:
        return url
    
    return url


# ============ CATEGORIES ============
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def category_list(request):
    if request.method == "GET":
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    if request.method == "POST":
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ LISTINGS ============
@api_view(['GET'])
@permission_classes([AllowAny])
def listing_list(request):
    listings = Listing.objects.filter(is_active=True).order_by('-created_at')
    serializer = ListingSerializer(listings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def listing_detail(request, id):
    listing = get_object_or_404(Listing, id=id, is_active=True)
    serializer = ListingSerializer(listing)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_listing(request):
    """Créer une annonce - Réservé aux vendeurs"""
    if not hasattr(request.user, 'profile') or not request.user.profile.is_seller:
        return Response(
            {'error': 'Seuls les vendeurs peuvent publier des annonces. Activez votre rôle vendeur dans votre profil.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Nettoyer l'URL Cloudinary si elle est fournie
    data = request.data.copy()
    if 'image_url' in data and data['image_url']:
        data['image_url'] = clean_cloudinary_url(data['image_url'])
    
    serializer = ListingSerializer(data=data)
    if serializer.is_valid():
        serializer.save(owner=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_listing(request, id):
    """Modifier une annonce - Réservé au propriétaire"""
    listing = get_object_or_404(Listing, id=id)
    
    if listing.owner != request.user:
        return Response(
            {'error': 'Vous ne pouvez modifier que vos propres annonces'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Nettoyer l'URL Cloudinary si elle est fournie
    data = request.data.copy()
    if 'image_url' in data and data['image_url']:
        data['image_url'] = clean_cloudinary_url(data['image_url'])
    
    serializer = ListingSerializer(listing, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_listing(request, id):
    """Supprimer une annonce - Réservé au propriétaire"""
    listing = get_object_or_404(Listing, id=id)
    
    if listing.owner != request.user:
        return Response(
            {'error': 'Vous ne pouvez supprimer que vos propres annonces'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    listing.delete()
    return Response({'message': 'Annonce supprimée avec succès'}, status=status.HTTP_200_OK)


# ============ USER AUTH ============
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Inscription avec gestion des fichiers (avatar, CIN)"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        return Response({
            'user': user_data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Inscription réussie !'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Récupérer les informations complètes de l'utilisateur connecté"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Mettre à jour le profil utilisateur (y compris les rôles)"""
    profile = request.user.profile
    serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Déconnexion - invalider le token"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ============ PAYMENT ============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request, id):
    """Créer un paiement - Réservé aux acheteurs"""
    listing = get_object_or_404(Listing, id=id, is_active=True)
    
    if listing.owner == request.user:
        return Response(
            {'error': 'Vous ne pouvez pas acheter votre propre produit'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not hasattr(request.user, 'profile') or not request.user.profile.is_buyer:
        return Response(
            {'error': 'Seuls les acheteurs peuvent passer des commandes. Activez votre rôle acheteur dans votre profil.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    order = Order.objects.create(
        buyer=request.user,
        listing=listing,
        status='pending'
    )
    
    if settings.STRIPE_SECRET_KEY == 'sk_test_placeholder':
        return Response({
            "url": f"https://marketplacemaximin.netlify.app/success?order_id={order.id}",
            "order_id": order.id,
            "demo": True
        })
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": listing.title,
                        "description": listing.description[:200],
                    },
                    "unit_amount": int(float(listing.price) * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            metadata={
                "order_id": order.id,
                "listing_id": listing.id,
                "buyer_id": request.user.id,
            },
            success_url="https://marketplacemaximin.netlify.app/success?order_id={}".format(order.id),
            cancel_url="https://marketplacemaximin.netlify.app/cancel",
        )
        
        order.stripe_session_id = session.id
        order.save()
        
        return Response({
            "url": session.url,
            "order_id": order.id,
            "session_id": session.id
        })
        
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Webhook pour confirmer les paiements Stripe"""
    payload = request.body
    
    try:
        event = json.loads(payload)
        
        if event.get('type') == 'checkout.session.completed':
            session = event.get('data', {}).get('object', {})
            order_id = session.get('metadata', {}).get('order_id')
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'paid'
                    order.save()
                    print(f"✅ Commande {order_id} marquée comme payée")
                except Order.DoesNotExist:
                    print(f"❌ Commande {order_id} non trouvée")
                
        return Response({'status': 'success'})
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ============ ORDERS ============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    """Récupérer les commandes de l'utilisateur - Réservé aux acheteurs"""
    if not hasattr(request.user, 'profile') or not request.user.profile.is_buyer:
        return Response(
            {'error': 'Vous devez être acheteur pour voir vos commandes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    orders = Order.objects.filter(buyer=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_sales(request):
    """Récupérer les ventes - Réservé aux vendeurs"""
    if not hasattr(request.user, 'profile') or not request.user.profile.is_seller:
        return Response(
            {'error': 'Seuls les vendeurs peuvent voir leurs ventes'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    orders = Order.objects.filter(listing__owner=request.user, status='paid').order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_listings(request):
    """Récupérer les annonces de l'utilisateur - Réservé aux vendeurs"""
    if not hasattr(request.user, 'profile') or not request.user.profile.is_seller:
        return Response(
            {'error': 'Seuls les vendeurs peuvent voir leurs annonces'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    listings = Listing.objects.filter(owner=request.user).order_by('-created_at')
    serializer = ListingSerializer(listings, many=True)
    return Response(serializer.data)


# ============ VENDORS ============
@api_view(['GET'])
@permission_classes([AllowAny])
def vendor_listings(request, vendor_id):
    """Récupérer toutes les annonces d'un vendeur spécifique"""
    try:
        vendor = User.objects.get(id=vendor_id, profile__is_seller=True)
    except User.DoesNotExist:
        return Response({'error': 'Vendeur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    listings = Listing.objects.filter(owner=vendor, is_active=True).order_by('-created_at')
    serializer = ListingSerializer(listings, many=True)
    return Response({
        'vendor': UserSerializer(vendor).data,
        'listings': serializer.data,
        'count': listings.count()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def vendor_detail(request, vendor_id):
    """Récupérer les détails d'un vendeur"""
    try:
        vendor = User.objects.get(id=vendor_id, profile__is_seller=True)
    except User.DoesNotExist:
        return Response({'error': 'Vendeur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    listings_count = Listing.objects.filter(owner=vendor, is_active=True).count()
    sales_count = Order.objects.filter(listing__owner=vendor, status='paid').count()
    
    return Response({
        'vendor': UserSerializer(vendor).data,
        'stats': {
            'listings_count': listings_count,
            'sales_count': sales_count,
            'rating': float(vendor.profile.seller_rating) if vendor.profile.seller_rating else 0
        }
    })


# ============ ADMIN ============
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_listing_status(request, id):
    """Admin: Activer/désactiver une annonce"""
    listing = get_object_or_404(Listing, id=id)
    is_active = request.data.get('is_active')
    
    if is_active is not None:
        listing.is_active = is_active
        listing.save()
        return Response({'status': 'updated', 'is_active': listing.is_active})
    
    return Response({'error': 'is_active field required'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Admin: Statistiques globales"""
    total_users = User.objects.count()
    total_sellers = Profile.objects.filter(is_seller=True).count()
    total_buyers = Profile.objects.filter(is_buyer=True).count()
    total_listings = Listing.objects.count()
    active_listings = Listing.objects.filter(is_active=True).count()
    total_orders = Order.objects.count()
    paid_orders = Order.objects.filter(status='paid').count()
    total_revenue = Order.objects.filter(status='paid').aggregate(
        total=models.Sum('listing__price')
    )['total'] or 0
    
    return Response({
        'users': {
            'total': total_users,
            'sellers': total_sellers,
            'buyers': total_buyers,
        },
        'listings': {
            'total': total_listings,
            'active': active_listings,
        },
        'orders': {
            'total': total_orders,
            'paid': paid_orders,
            'revenue': total_revenue,
        }
    })
