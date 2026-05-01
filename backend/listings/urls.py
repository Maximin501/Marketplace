from django.urls import path
from . import views

urlpatterns = [
    # ============ LISTINGS (publiques) ============
    path('listings/', views.listing_list, name='listing-list'),
    path('listings/<int:id>/', views.listing_detail, name='listing-detail'),
    
    # ============ LISTINGS (authentifiées) ============
    path('listings/create/', views.create_listing, name='create-listing'),
    path('listings/<int:id>/update/', views.update_listing, name='update-listing'),
    path('listings/<int:id>/delete/', views.delete_listing, name='delete-listing'),
    
    # ============ MES ANNONCES & COMMANDES ============
    path('my-listings/', views.my_listings, name='my-listings'),
    path('my-orders/', views.my_orders, name='my-orders'),
    path('my-sales/', views.my_sales, name='my-sales'),
    
    # ============ CATEGORIES ============
    path('categories/', views.category_list, name='category-list'),
    
    # ============ AUTHENTIFICATION ============
    path('register/', views.register, name='register'),
    path('me/', views.me, name='me'),
    path('profile/', views.update_profile, name='update-profile'),
    path('logout/', views.logout, name='logout'),
    
    # ============ PAIEMENT ============
    path('pay/<int:id>/', views.create_payment, name='create-payment'),
    path('stripe-webhook/', views.stripe_webhook, name='stripe-webhook'),
    
    # ============ VENDEURS ============
    path('vendors/<int:vendor_id>/', views.vendor_detail, name='vendor-detail'),
    path('vendors/<int:vendor_id>/listings/', views.vendor_listings, name='vendor-listings'),
    
    # ============ ADMIN ============
    path('admin/listings/<int:id>/status/', views.update_listing_status, name='update-status'),
    path('admin/stats/', views.admin_stats, name='admin-stats'),
]