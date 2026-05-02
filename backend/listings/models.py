from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ============================================================
# MODÈLE PROFILE
# ============================================================
class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    
    is_seller = models.BooleanField(default=False, verbose_name="Est vendeur")
    is_buyer = models.BooleanField(default=True, verbose_name="Est acheteur")
    
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.TextField(blank=True, null=True, verbose_name="Adresse")
    avatar = models.ImageField(upload_to="profiles/", blank=True, null=True, verbose_name="Photo de profil")
    
    cin_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Numéro CIN")
    cin_issue_date = models.DateField(blank=True, null=True, verbose_name="Date de délivrance CIN")
    cin_issue_place = models.CharField(max_length=100, blank=True, null=True, verbose_name="Lieu de délivrance CIN")
    cin_photo = models.ImageField(upload_to="cin/", blank=True, null=True, verbose_name="Photo CIN (recto)")
    
    seller_store_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Nom de la boutique")
    seller_description = models.TextField(blank=True, null=True, verbose_name="Description de la boutique")
    seller_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name="Note du vendeur")
    
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Date d'inscription")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {'Vendeur' if self.is_seller else 'Acheteur'}"
    
    @property
    def full_name(self):
        if self.user.first_name or self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        return self.user.username
    
    @property
    def user_type(self):
        if self.is_seller and self.is_buyer:
            return "Vendeur & Acheteur"
        elif self.is_seller:
            return "Vendeur"
        elif self.is_buyer:
            return "Acheteur"
        return "Non défini"
    
    def is_cin_complete(self):
        return all([self.cin_number, self.cin_issue_date, self.cin_issue_place])
    
    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None
    
    @property
    def cin_photo_url(self):
        if self.cin_photo:
            return self.cin_photo.url
        return None


# ============================================================
# MODÈLE CATEGORY
# ============================================================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nom de la catégorie")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    icon = models.CharField(max_length=50, blank=True, null=True, verbose_name="Icône (emoji)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ['name']

    def __str__(self):
        return self.name
    
    @property
    def listings_count(self):
        return self.listings.filter(is_active=True).count()


# ============================================================
# MODÈLE LISTING (CORRIGÉ - sans doublon)
# ============================================================
class Listing(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name="Propriétaire"
    )
    title = models.CharField(max_length=255, verbose_name="Titre")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix (Ar)")
    city = models.CharField(max_length=100, verbose_name="Ville")
    description = models.TextField(verbose_name="Description")
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name="Catégorie"
    )
    image = models.ImageField(
        upload_to="listings/", 
        blank=True, 
        null=True,
        verbose_name="Image (upload)"
    )
    image_url_externe = models.URLField(
        max_length=500,
        blank=True, 
        null=True,
        verbose_name="URL Image Externe"
    )
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    views_count = models.IntegerField(default=0, verbose_name="Nombre de vues")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")

    class Meta:
        verbose_name = "Annonce"
        verbose_name_plural = "Annonces"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['category']),
            models.Index(fields=['city']),
            models.Index(fields=['price']),
        ]

    def __str__(self):
        return self.title
    
    @property
    def image_url(self):
        """Retourne la bonne URL d'image (externe prioritaire)"""
        if self.image_url_externe:
            return self.image_url_externe
        if self.image:
            url = self.image.url
            # Corriger le double enveloppement Cloudinary
            if url and url.count('res.cloudinary.com') > 1:
                parts = url.split('/upload/')
                if len(parts) >= 2:
                    return f"https://res.cloudinary.com/dbf8mmbxp/image/upload/{parts[-1]}"
            return url
        return None
    
    @property
    def owner_full_name(self):
        if self.owner.first_name or self.owner.last_name:
            return f"{self.owner.first_name} {self.owner.last_name}".strip()
        return self.owner.username
    
    @property
    def orders_count(self):
        return self.orders.count()
    
    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])


# ============================================================
# MODÈLE ORDER
# ============================================================
class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("paid", "Payé"),
        ("cancelled", "Annulé"),
        ("refunded", "Remboursé"),
    ]

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders", verbose_name="Acheteur")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="orders", verbose_name="Annonce")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", verbose_name="Statut")
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="ID Session Stripe")
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="ID Paiement Stripe")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de commande")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name="Date de paiement")

    class Meta:
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['buyer']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.buyer.username} → {self.listing.title}"
    
    @property
    def seller(self):
        return self.listing.owner
    
    def mark_as_paid(self):
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.save()
    
    def mark_as_cancelled(self):
        self.status = 'cancelled'
        self.save()


# ============================================================
# MODÈLE VISITOR LOG
# ============================================================
class VisitorLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Utilisateur")
    session_key = models.CharField(max_length=100, blank=True, null=True, verbose_name="Clé de session")
    
    ip_address = models.GenericIPAddressField(verbose_name="Adresse IP")
    user_agent = models.TextField(blank=True, null=True, verbose_name="Navigateur")
    device_type = models.CharField(max_length=50, blank=True, null=True, verbose_name="Type d'appareil")
    browser = models.CharField(max_length=100, blank=True, null=True, verbose_name="Navigateur")
    os = models.CharField(max_length=100, blank=True, null=True, verbose_name="Système d'exploitation")
    
    country = models.CharField(max_length=100, blank=True, null=True, verbose_name="Pays")
    country_code = models.CharField(max_length=5, blank=True, null=True, verbose_name="Code pays")
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name="Ville")
    region = models.CharField(max_length=100, blank=True, null=True, verbose_name="Région")
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="Code postal")
    latitude = models.FloatField(blank=True, null=True, verbose_name="Latitude")
    longitude = models.FloatField(blank=True, null=True, verbose_name="Longitude")
    timezone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Fuseau horaire")
    
    url_visited = models.URLField(max_length=500, verbose_name="URL visitée")
    referer = models.URLField(max_length=500, blank=True, null=True, verbose_name="Référent")
    http_method = models.CharField(max_length=10, blank=True, null=True, verbose_name="Méthode HTTP")
    status_code = models.IntegerField(blank=True, null=True, verbose_name="Code statut HTTP")
    
    visit_time = models.DateTimeField(auto_now_add=True, verbose_name="Heure de visite")
    visit_duration = models.DurationField(blank=True, null=True, verbose_name="Durée de la visite")
    
    is_authenticated = models.BooleanField(default=False, verbose_name="Est authentifié")
    is_ajax = models.BooleanField(default=False, verbose_name="Requête AJAX")

    class Meta:
        verbose_name = "Visiteur"
        verbose_name_plural = "Visiteurs"
        ordering = ['-visit_time']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['visit_time']),
            models.Index(fields=['country']),
            models.Index(fields=['user']),
            models.Index(fields=['is_authenticated']),
        ]

    def __str__(self):
        user_info = self.user.username if self.user else "Anonyme"
        return f"{user_info} - {self.ip_address} - {self.visit_time.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def location_display(self):
        parts = []
        if self.city: parts.append(self.city)
        if self.region: parts.append(self.region)
        if self.country: parts.append(self.country)
        return ", ".join(parts) if parts else "Inconnue"
    
    @property
    def is_online(self):
        return (timezone.now() - self.visit_time).total_seconds() < 300
    
    @property
    def visit_duration_display(self):
        if self.visit_duration:
            total_seconds = int(self.visit_duration.total_seconds())
            if total_seconds < 60: return f"{total_seconds}s"
            elif total_seconds < 3600: return f"{total_seconds // 60}m {total_seconds % 60}s"
            else:
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return f"{hours}h {minutes}m"
        return "-"


# ============================================================
# MODÈLE DAILY VISITOR STATS
# ============================================================
class DailyVisitorStats(models.Model):
    date = models.DateField(unique=True, verbose_name="Date")
    total_visits = models.IntegerField(default=0, verbose_name="Total visites")
    unique_visitors = models.IntegerField(default=0, verbose_name="Visiteurs uniques")
    authenticated_visitors = models.IntegerField(default=0, verbose_name="Visiteurs authentifiés")
    anonymous_visitors = models.IntegerField(default=0, verbose_name="Visiteurs anonymes")
    total_page_views = models.IntegerField(default=0, verbose_name="Pages vues")
    average_duration = models.DurationField(blank=True, null=True, verbose_name="Durée moyenne")
    countries_data = models.JSONField(default=dict, blank=True, verbose_name="Données par pays")
    top_pages = models.JSONField(default=list, blank=True, verbose_name="Pages populaires")
    browsers_data = models.JSONField(default=dict, blank=True, verbose_name="Navigateurs")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    class Meta:
        verbose_name = "Statistique journalière"
        verbose_name_plural = "Statistiques journalières"
        ordering = ['-date']

    def __str__(self):
        return f"Stats du {self.date.strftime('%d/%m/%Y')}"
    
    @property
    def conversion_rate(self):
        if self.total_visits > 0:
            return round((self.authenticated_visitors / self.total_visits) * 100, 2)
        return 0
