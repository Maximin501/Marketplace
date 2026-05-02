from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncDate
import datetime
import csv
from django.http import HttpResponse

from .models import (
    Category, Listing, Profile, Order, 
    VisitorLog, DailyVisitorStats
)


# ============================================================
# CONFIGURATION GÉNÉRALE DE L'ADMIN
# ============================================================
admin.site.site_header = "Administration Marketplace"
admin.site.site_title = "Marketplace Admin"
admin.site.index_title = "Tableau de bord"


# ============================================================
# ADMIN CATEGORY
# ============================================================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'icon_display', 'listings_count', 'created_at')
    list_display_links = ('id', 'name')
    search_fields = ('name', 'description')
    prepopulated_fields = {}  # Si vous voulez un slug
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Informations', {
            'fields': ('name', 'description', 'icon')
        }),
        ('Dates', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def icon_display(self, obj):
        return obj.icon or '📂'
    icon_display.short_description = "Icône"
    
    def listings_count(self, obj):
        return obj.listings_count
    listings_count.short_description = "Nombre d'annonces"
    listings_count.admin_order_field = 'listings_count'


# ============================================================
# ADMIN LISTING
# ============================================================
@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'image_preview', 'title', 'price_display', 
        'city', 'category', 'owner_name', 'is_active', 
        'views_count', 'orders_count', 'created_at'
    )
    list_filter = (
        'is_active', 'category', 'city', 'created_at'
    )
    search_fields = (
        'title', 'description', 'city', 
        'owner__username', 'owner__first_name', 'owner__last_name'
    )
    readonly_fields = (
        'created_at', 'updated_at', 'views_count', 
        'image_preview_admin'
    )
    list_editable = ('is_active',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    
    fieldsets = (
        ('Informations Générales', {
            'fields': (
                'title', 'description', 'price', 'city'
            )
        }),
        ('Catégorie et Propriétaire', {
            'fields': ('category', 'owner')
        }),
        ('Image', {
            'fields': ('image', 'image_url_externe')
        }),
        ('Statut et Statistiques', {
            'fields': (
                'is_active', 'views_count'
            )
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """Aperçu de l'image dans la liste"""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" />',
                obj.image.url
            )
        return format_html(
            '<div style="width: 50px; height: 50px; background: #e9ecef; border-radius: 5px; display: flex; align-items: center; justify-content: center;">📷</div>'
        )
    image_preview.short_description = "Image"
    
    def image_preview_admin(self, obj):
        """Aperçu de l'image dans le formulaire"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px; border-radius: 10px;" />',
                obj.image.url
            )
        return "Aucune image"
    image_preview_admin.short_description = "Aperçu"
    
    def price_display(self, obj):
        """Affiche le prix formaté"""
        return f"{obj.price:,.0f} Ar"
    price_display.short_description = "Prix"
    price_display.admin_order_field = 'price'
    
    def owner_name(self, obj):
        """Affiche le nom du propriétaire"""
        return obj.owner_full_name
    owner_name.short_description = "Propriétaire"
    owner_name.admin_order_field = 'owner__username'
    
    def orders_count(self, obj):
        """Nombre de commandes"""
        count = obj.orders_count
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{}</span>', count
            )
        return "0"
    orders_count.short_description = "Commandes"
    
    # Actions personnalisées
    actions = [
        'activate_listings', 
        'deactivate_listings',
        'export_as_csv',
        'reset_views'
    ]
    
    def activate_listings(self, request, queryset):
        """Active les annonces sélectionnées"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} annonce(s) activée(s).")
    activate_listings.short_description = "✅ Activer les annonces"
    
    def deactivate_listings(self, request, queryset):
        """Désactive les annonces sélectionnées"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} annonce(s) désactivée(s).")
    deactivate_listings.short_description = "🔴 Désactiver les annonces"
    
    def export_as_csv(self, request, queryset):
        """Exporte les annonces en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="listings.csv"'
        response.write('\ufeff')  # BOM pour Excel UTF-8
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Titre', 'Prix (Ar)', 'Ville', 'Catégorie', 
            'Propriétaire', 'Actif', 'Vues', 'Commandes', 'Date création'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.id,
                obj.title,
                obj.price,
                obj.city,
                obj.category.name,
                obj.owner_full_name,
                'Oui' if obj.is_active else 'Non',
                obj.views_count,
                obj.orders_count,
                obj.created_at.strftime('%d/%m/%Y %H:%M'),
            ])
        
        return response
    export_as_csv.short_description = "📥 Exporter en CSV"
    
    def reset_views(self, request, queryset):
        """Réinitialise le compteur de vues"""
        updated = queryset.update(views_count=0)
        self.message_user(request, f"Compteur de vues réinitialisé pour {updated} annonce(s).")
    reset_views.short_description = "🔄 Réinitialiser les vues"


# ============================================================
# ADMIN PROFILE
# ============================================================
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'avatar_preview', 'user_type_display', 
        'phone', 'city_display', 'seller_store_name', 'cin_complete',
        'created_at'
    )
    list_filter = (
        'is_seller', 'is_buyer', 'created_at'
    )
    search_fields = (
        'user__username', 'user__email', 'user__first_name', 
        'user__last_name', 'phone', 'cin_number',
        'seller_store_name', 'address'
    )
    readonly_fields = ('created_at', 'updated_at', 'avatar_preview_admin', 'cin_photo_preview')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user', ('is_seller', 'is_buyer'))
        }),
        ('Informations Personnelles', {
            'fields': ('phone', 'address')
        }),
        ('Photo de Profil', {
            'fields': ('avatar', 'avatar_preview_admin')
        }),
        ('Carte d\'Identité Nationale', {
            'fields': (
                'cin_number', 'cin_issue_date', 
                'cin_issue_place', 'cin_photo', 'cin_photo_preview'
            )
        }),
        ('Boutique (Vendeur)', {
            'fields': (
                'seller_store_name', 'seller_description', 'seller_rating'
            ),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def avatar_preview(self, obj):
        """Aperçu avatar dans la liste"""
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 50%;" />',
                obj.avatar.url
            )
        return format_html(
            '<div style="width: 35px; height: 35px; background: #6c757d; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px;">{}</div>',
            obj.user.username[0].upper()
        )
    avatar_preview.short_description = "Avatar"
    
    def avatar_preview_admin(self, obj):
        """Aperçu avatar dans le formulaire"""
        if obj.avatar:
            return format_html(
                '<img src="{}" style="max-width: 150px; max-height: 150px; border-radius: 50%;" />',
                obj.avatar.url
            )
        return "Aucune photo"
    avatar_preview_admin.short_description = "Aperçu"
    
    def cin_photo_preview(self, obj):
        """Aperçu photo CIN dans le formulaire"""
        if obj.cin_photo:
            return format_html(
                '<img src="{}" style="max-width: 300px; border: 1px solid #ddd; border-radius: 5px;" />',
                obj.cin_photo.url
            )
        return "Aucune photo CIN"
    cin_photo_preview.short_description = "Aperçu CIN"
    
    def user_type_display(self, obj):
        """Affiche le type d'utilisateur avec couleur"""
        if obj.is_seller and obj.is_buyer:
            return format_html(
                '<span style="color: #9C27B0;">🏪🛍️ Les deux</span>'
            )
        elif obj.is_seller:
            return format_html(
                '<span style="color: #4CAF50;">🏪 Vendeur</span>'
            )
        return format_html(
            '<span style="color: #2196F3;">🛍️ Acheteur</span>'
        )
    user_type_display.short_description = "Type"
    user_type_display.admin_order_field = 'is_seller'
    
    def city_display(self, obj):
        """Extrait la ville de l'adresse"""
        if obj.address:
            return obj.address.split(',')[0].strip()[:50]
        return "-"
    city_display.short_description = "Ville"
    
    def cin_complete(self, obj):
        """Indique si le CIN est complet"""
        if obj.is_cin_complete():
            return format_html('<span style="color: green;">✅ Complet</span>')
        elif obj.cin_number:
            return format_html('<span style="color: orange;">⚠️ Partiel</span>')
        return format_html('<span style="color: red;">❌ Non renseigné</span>')
    cin_complete.short_description = "CIN"
    
    actions = ['activate_seller', 'deactivate_seller', 'export_as_csv']
    
    def activate_seller(self, request, queryset):
        """Active le rôle vendeur"""
        updated = queryset.update(is_seller=True)
        self.message_user(request, f"{updated} profil(s) vendeur activé(s).")
    activate_seller.short_description = "✅ Activer rôle vendeur"
    
    def deactivate_seller(self, request, queryset):
        """Désactive le rôle vendeur"""
        updated = queryset.update(is_seller=False)
        self.message_user(request, f"{updated} profil(s) vendeur désactivé(s).")
    deactivate_seller.short_description = "🔴 Désactiver rôle vendeur"
    
    def export_as_csv(self, request, queryset):
        """Exporte les profils en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="profiles.csv"'
        response.write('\ufeff')
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Username', 'Nom complet', 'Email', 'Téléphone',
            'Type', 'Boutique', 'CIN', 'Date inscription'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.id,
                obj.user.username,
                obj.full_name,
                obj.user.email,
                obj.phone,
                obj.user_type,
                obj.seller_store_name,
                'Oui' if obj.is_cin_complete() else 'Non',
                obj.created_at.strftime('%d/%m/%Y'),
            ])
        
        return response
    export_as_csv.short_description = "📥 Exporter en CSV"


# ============================================================
# ADMIN ORDER
# ============================================================
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'listing_title', 'buyer_name', 'seller_name',
        'amount_display', 'status_badge', 'created_at', 'paid_at'
    )
    list_filter = (
        'status', 'created_at', 'paid_at'
    )
    search_fields = (
        'buyer__username', 'listing__title', 
        'listing__owner__username', 'stripe_session_id'
    )
    readonly_fields = (
        'created_at', 'updated_at', 
        'stripe_session_id', 'stripe_payment_intent_id'
    )
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informations Commande', {
            'fields': ('buyer', 'listing', 'amount', 'status')
        }),
        ('Paiement Stripe', {
            'fields': ('stripe_session_id', 'stripe_payment_intent_id'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'paid_at')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    def listing_title(self, obj):
        return obj.listing.title
    listing_title.short_description = "Annonce"
    listing_title.admin_order_field = 'listing__title'
    
    def buyer_name(self, obj):
        return obj.buyer.username
    buyer_name.short_description = "Acheteur"
    buyer_name.admin_order_field = 'buyer__username'
    
    def seller_name(self, obj):
        return obj.listing.owner.username
    seller_name.short_description = "Vendeur"
    
    def amount_display(self, obj):
        return f"{obj.amount:,.0f} Ar"
    amount_display.short_description = "Montant"
    amount_display.admin_order_field = 'amount'
    
    def status_badge(self, obj):
        """Affiche le statut avec une couleur"""
        colors = {
            'pending': ('orange', '⏳ En attente'),
            'paid': ('green', '✅ Payé'),
            'cancelled': ('red', '❌ Annulé'),
            'refunded': ('purple', '↩️ Remboursé'),
        }
        color, label = colors.get(obj.status, ('gray', obj.status))
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, label
        )
    status_badge.short_description = "Statut"
    status_badge.admin_order_field = 'status'
    
    actions = ['mark_as_paid', 'mark_as_cancelled', 'export_as_csv']
    
    def mark_as_paid(self, request, queryset):
        """Marque les commandes comme payées"""
        for order in queryset:
            order.mark_as_paid()
        self.message_user(request, f"{queryset.count()} commande(s) marquée(s) comme payée(s).")
    mark_as_paid.short_description = "✅ Marquer comme payé"
    
    def mark_as_cancelled(self, request, queryset):
        """Marque les commandes comme annulées"""
        for order in queryset:
            order.mark_as_cancelled()
        self.message_user(request, f"{queryset.count()} commande(s) annulée(s).")
    mark_as_cancelled.short_description = "❌ Marquer comme annulé"
    
    def export_as_csv(self, request, queryset):
        """Exporte les commandes en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'
        response.write('\ufeff')
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Annonce', 'Acheteur', 'Vendeur', 'Montant',
            'Statut', 'Date commande', 'Date paiement'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.id,
                obj.listing.title,
                obj.buyer.username,
                obj.seller.username,
                obj.amount,
                obj.get_status_display(),
                obj.created_at.strftime('%d/%m/%Y %H:%M'),
                obj.paid_at.strftime('%d/%m/%Y %H:%M') if obj.paid_at else '-',
            ])
        
        return response
    export_as_csv.short_description = "📥 Exporter en CSV"


# ============================================================
# ADMIN VISITOR LOG (Suivi des visiteurs)
# ============================================================
@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user_display', 'ip_address', 'location_display', 
        'url_truncated', 'method_badge', 'visit_time', 
        'duration_display', 'status_display'
    )
    list_filter = (
        'is_authenticated', 'country', 'city', 'device_type',
        'http_method', 'visit_time', 'is_ajax'
    )
    search_fields = (
        'ip_address', 'country', 'city', 'region',
        'url_visited', 'user_agent',
        'user__username', 'user__email', 'user__first_name'
    )
    readonly_fields = [
        'user', 'session_key', 'ip_address', 'user_agent',
        'device_type', 'browser', 'os',
        'country', 'country_code', 'city', 'region', 
        'postal_code', 'latitude', 'longitude', 'timezone',
        'url_visited', 'referer', 'http_method', 'status_code',
        'visit_time', 'visit_duration', 'is_authenticated', 'is_ajax'
    ]
    date_hierarchy = 'visit_time'
    list_per_page = 50
    list_select_related = ('user',)
    
    fieldsets = (
        ('👤 Informations Visiteur', {
            'fields': (
                ('user', 'is_authenticated'),
                ('ip_address', 'session_key'),
                'user_agent',
                ('device_type', 'browser', 'os'),
            )
        }),
        ('📍 Localisation', {
            'fields': (
                ('country', 'country_code'),
                ('city', 'region', 'postal_code'),
                ('latitude', 'longitude'),
                'timezone',
            )
        }),
        ('📄 Page Visitée', {
            'fields': (
                'url_visited',
                'referer',
                ('http_method', 'status_code', 'is_ajax'),
            )
        }),
        ('🕐 Horodatage', {
            'fields': (
                'visit_time',
                'visit_duration',
            )
        }),
    )
    
    def user_display(self, obj):
        """Affiche l'utilisateur avec avatar"""
        if obj.user:
            if hasattr(obj.user, 'profile') and obj.user.profile.avatar:
                return format_html(
                    '<img src="{}" style="width: 25px; height: 25px; border-radius: 50%; margin-right: 5px; vertical-align: middle;" />{}',
                    obj.user.profile.avatar.url,
                    obj.user.username
                )
            return obj.user.username
        return format_html('<span style="color: gray;">Anonyme</span>')
    user_display.short_description = "Utilisateur"
    user_display.admin_order_field = 'user__username'
    
    def location_display(self, obj):
        """Affiche la localisation avec drapeau"""
        flags = {
            'France': '🇫🇷', 'Madagascar': '🇲🇬', 
            'États-Unis': '🇺🇸', 'Canada': '🇨🇦',
            'Belgique': '🇧🇪', 'Suisse': '🇨🇭',
            'Local': '🏠', '': '🌍'
        }
        flag = flags.get(obj.country, '🌍')
        return f"{flag} {obj.location_display}"
    location_display.short_description = "Localisation"
    
    def url_truncated(self, obj):
        """Tronque l'URL pour l'affichage"""
        url = obj.url_visited
        return url[:70] + '...' if len(url) > 70 else url
    url_truncated.short_description = "URL visitée"
    
    def method_badge(self, obj):
        """Affiche la méthode HTTP avec couleur"""
        colors = {
            'GET': '#4CAF50',
            'POST': '#2196F3',
            'PUT': '#FF9800',
            'PATCH': '#9C27B0',
            'DELETE': '#f44336',
        }
        color = colors.get(obj.http_method, '#757575')
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">{}</span>',
            color, obj.http_method or '-'
        )
    method_badge.short_description = "Méthode"
    method_badge.admin_order_field = 'http_method'
    
    def duration_display(self, obj):
        """Affiche la durée formatée"""
        return obj.visit_duration_display
    duration_display.short_description = "Durée"
    
    def status_display(self, obj):
        """Affiche le statut en ligne/hors ligne"""
        if obj.is_online:
            return format_html(
                '<span style="color: #4CAF50;">● En ligne</span>'
            )
        return format_html(
            '<span style="color: #9e9e9e;">● Hors ligne</span>'
        )
    status_display.short_description = "Statut"
    
    # Actions personnalisées
    actions = [
        'export_visitors_csv', 
        'clear_old_logs',
        'show_online_visitors'
    ]
    
    def export_visitors_csv(self, request, queryset):
        """Exporte les visiteurs en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="visitors.csv"'
        response.write('\ufeff')
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Utilisateur', 'IP', 'Pays', 'Ville', 'Région',
            'URL', 'Méthode', 'Date', 'Heure', 'Durée', 'Navigateur', 'OS'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.id,
                obj.user.username if obj.user else 'Anonyme',
                obj.ip_address,
                obj.country,
                obj.city,
                obj.region,
                obj.url_visited,
                obj.http_method,
                obj.visit_time.strftime('%d/%m/%Y'),
                obj.visit_time.strftime('%H:%M:%S'),
                obj.visit_duration_display,
                obj.browser,
                obj.os,
            ])
        
        return response
    export_visitors_csv.short_description = "📥 Exporter en CSV"
    
    def clear_old_logs(self, request, queryset):
        """Supprime les logs de plus de 30 jours"""
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        deleted, _ = VisitorLog.objects.filter(
            visit_time__lt=thirty_days_ago
        ).delete()
        self.message_user(request, f"✅ {deleted} anciens logs supprimés.")
    clear_old_logs.short_description = "🗑️ Supprimer les logs de +30 jours"
    
    def show_online_visitors(self, request, queryset):
        """Affiche les visiteurs en ligne"""
        five_minutes_ago = timezone.now() - datetime.timedelta(minutes=5)
        online = VisitorLog.objects.filter(visit_time__gte=five_minutes_ago)
        self.message_user(
            request, 
            f"🟢 {online.count()} visiteur(s) en ligne actuellement."
        )
    show_online_visitors.short_description = "🟢 Voir les visiteurs en ligne"


# ============================================================
# ADMIN DAILY VISITOR STATS
# ============================================================
@admin.register(DailyVisitorStats)
class DailyVisitorStatsAdmin(admin.ModelAdmin):
    list_display = (
        'date', 'total_visits', 'unique_visitors', 
        'authenticated_visitors', 'anonymous_visitors',
        'conversion_rate_display', 'avg_duration_display'
    )
    list_filter = ('date',)
    date_hierarchy = 'date'
    readonly_fields = [
        'date', 'total_visits', 'unique_visitors',
        'authenticated_visitors', 'anonymous_visitors',
        'total_page_views', 'average_duration',
        'countries_data', 'top_pages', 'browsers_data',
        'created_at'
    ]
    
    fieldsets = (
        ('📊 Résumé Quotidien', {
            'fields': (
                'date',
                ('total_visits', 'unique_visitors'),
                ('authenticated_visitors', 'anonymous_visitors'),
                ('total_page_views', 'average_duration'),
            )
        }),
        ('🌍 Visites par Pays', {
            'fields': ('countries_data',),
            'classes': ('collapse',)
        }),
        ('📄 Pages Populaires', {
            'fields': ('top_pages',),
            'classes': ('collapse',)
        }),
        ('🌐 Navigateurs', {
            'fields': ('browsers_data',),
            'classes': ('collapse',)
        }),
        ('📅 Métadonnées', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def conversion_rate_display(self, obj):
        """Affiche le taux de conversion"""
        rate = obj.conversion_rate
        color = 'green' if rate > 50 else 'orange' if rate > 20 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, rate
        )
    conversion_rate_display.short_description = "Conversion"
    
    def avg_duration_display(self, obj):
        """Affiche la durée moyenne"""
        if obj.average_duration:
            total_seconds = int(obj.average_duration.total_seconds())
            if total_seconds < 60:
                return f"{total_seconds}s"
            return f"{total_seconds // 60}m {total_seconds % 60}s"
        return "-"
    avg_duration_display.short_description = "Durée moyenne"
    
    actions = ['export_stats_csv']
    
    def export_stats_csv(self, request, queryset):
        """Exporte les statistiques en CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="stats.csv"'
        response.write('\ufeff')
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'Date', 'Total Visites', 'Visiteurs Uniques',
            'Authentifiés', 'Anonymes', 'Pages Vues', 
            'Durée Moyenne', 'Taux Conversion'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.date.strftime('%d/%m/%Y'),
                obj.total_visits,
                obj.unique_visitors,
                obj.authenticated_visitors,
                obj.anonymous_visitors,
                obj.total_page_views,
                obj.avg_duration_display,
                f"{obj.conversion_rate}%",
            ])
        
        return response
    export_stats_csv.short_description = "📥 Exporter en CSV"
