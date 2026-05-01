import geoip2.database
import os
from django.conf import settings
from django.utils import timezone
from django.contrib.sessions.models import Session
from .models import VisitorLog, DailyVisitorStats
import datetime

# Chemin vers la base de données GeoIP
GEOIP_DATABASE_PATH = os.path.join(settings.BASE_DIR, 'geoip', 'GeoLite2-City.mmdb')

class VisitorTrackingMiddleware:
    """Middleware pour suivre les visiteurs"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.geoip_reader = None
        
        # Initialiser GeoIP si le fichier existe
        if os.path.exists(GEOIP_DATABASE_PATH):
            try:
                self.geoip_reader = geoip2.database.Reader(GEOIP_DATABASE_PATH)
            except Exception as e:
                print(f"Erreur GeoIP: {e}")
    
    def __call__(self, request):
        # Enregistrer l'heure de début
        start_time = timezone.now()
        
        # Traiter la requête
        response = self.get_response(request)
        
        # Ne pas suivre les requêtes vers l'admin, static, media
        if not request.path.startswith('/admin/') and \
           not request.path.startswith('/static/') and \
           not request.path.startswith('/media/'):
            
            # Enregistrer la visite dans un thread séparé ou directement
            self.log_visit(request, start_time)
        
        return response
    
    def log_visit(self, request, start_time):
        """Enregistre la visite"""
        try:
            # Obtenir l'adresse IP
            ip_address = self.get_client_ip(request)
            
            # Obtenir la localisation
            location = self.get_location(ip_address)
            
            # Calculer la durée de la visite
            duration = timezone.now() - start_time
            
            # Obtenir l'utilisateur
            user = request.user if request.user.is_authenticated else None
            
            # Obtenir la session
            session_key = request.session.session_key
            
            # Créer le log
            VisitorLog.objects.create(
                user=user,
                session_key=session_key,
                ip_address=ip_address,
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                country=location.get('country', ''),
                city=location.get('city', ''),
                region=location.get('region', ''),
                latitude=location.get('latitude'),
                longitude=location.get('longitude'),
                url_visited=request.build_absolute_uri(),
                referer=request.META.get('HTTP_REFERER', ''),
                http_method=request.method,
                visit_time=start_time,
                visit_duration=duration,
                is_authenticated=request.user.is_authenticated,
            )
            
            # Mettre à jour les statistiques quotidiennes
            self.update_daily_stats()
            
        except Exception as e:
            print(f"Erreur logging visiteur: {e}")
    
    def get_client_ip(self, request):
        """Obtient l'adresse IP réelle du client"""
        # Vérifier les en-têtes communs pour les proxies
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('HTTP_X_REAL_IP', request.META.get('REMOTE_ADDR', '0.0.0.0'))
        return ip
    
    def get_location(self, ip_address):
        """Obtient la localisation à partir de l'adresse IP"""
        location = {
            'country': '',
            'city': '',
            'region': '',
            'latitude': None,
            'longitude': None,
        }
        
        # Ignorer les IP locales
        if ip_address in ('127.0.0.1', 'localhost', '::1'):
            location['country'] = 'Local'
            location['city'] = 'Development'
            return location
        
        # Utiliser GeoIP si disponible
        if self.geoip_reader:
            try:
                response = self.geoip_reader.city(ip_address)
                location['country'] = response.country.name or ''
                location['city'] = response.city.name or ''
                location['region'] = response.subdivisions.most_specific.name if response.subdivisions else ''
                location['latitude'] = response.location.latitude
                location['longitude'] = response.location.longitude
            except Exception as e:
                print(f"Erreur GeoIP pour {ip_address}: {e}")
        
        return location
    
    def update_daily_stats(self):
        """Met à jour les statistiques quotidiennes"""
        today = timezone.now().date()
        
        try:
            stats, created = DailyVisitorStats.objects.get_or_create(date=today)
            
            # Calculer les stats
            today_visits = VisitorLog.objects.filter(visit_time__date=today)
            
            stats.total_visits = today_visits.count()
            stats.unique_visitors = today_visits.values('ip_address').distinct().count()
            stats.authenticated_visitors = today_visits.filter(is_authenticated=True).count()
            stats.anonymous_visitors = today_visits.filter(is_authenticated=False).count()
            
            # Stats par pays
            countries = {}
            for visit in today_visits.values('country').annotate(count=models.Count('id')):
                if visit['country']:
                    countries[visit['country']] = visit['count']
            stats.countries_data = countries
            
            # Pages populaires
            top_pages = list(
                today_visits.values('url_visited')
                .annotate(count=models.Count('id'))
                .order_by('-count')[:10]
            )
            stats.top_pages = top_pages
            
            stats.save()
            
        except Exception as e:
            print(f"Erreur stats: {e}")
    
    def __del__(self):
        """Fermer le reader GeoIP"""
        if self.geoip_reader:
            self.geoip_reader.close()