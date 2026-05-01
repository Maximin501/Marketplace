from rest_framework import serializers
from .models import Listing, Category, Order, Profile
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    cin_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'is_seller', 'is_buyer', 'phone', 'address', 
            'avatar', 'avatar_url', 'cin_number', 'cin_issue_date', 
            'cin_issue_place', 'cin_photo', 'cin_photo_url', 
            'seller_store_name', 'seller_description', 'seller_rating', 
            'created_at'
        ]
    
    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None
    
    def get_cin_photo_url(self, obj):
        if obj.cin_photo:
            return obj.cin_photo.url
        return None


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Sérializer pour la mise à jour du profil"""
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    
    class Meta:
        model = Profile
        fields = [
            'phone', 'address', 'avatar', 'is_seller', 'is_buyer',
            'cin_number', 'cin_issue_date', 'cin_issue_place', 'cin_photo',
            'seller_store_name', 'seller_description', 'first_name', 'last_name', 'email'
        ]
    
    def update(self, instance, validated_data):
        # Mettre à jour les champs User
        user_data = validated_data.pop('user', {})
        user = instance.user
        
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()
        
        # Mettre à jour les champs Profile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'profile'
        ]
    
    def get_full_name(self, obj):
        if obj.first_name or obj.last_name:
            return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username


class ListingSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True
    )
    image_url = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    owner_full_name = serializers.SerializerMethodField()
    owner_profile = ProfileSerializer(source='owner.profile', read_only=True)
    
    class Meta:
        model = Listing
        fields = [
            "id", "title", "price", "city", "description", 
            "image", "image_url", "created_at", "updated_at",
            "owner", "owner_name", "owner_full_name", "owner_profile",
            "category", "category_id", "is_active"
        ]
        read_only_fields = ["owner", "created_at", "updated_at"]
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def get_owner_full_name(self, obj):
        if obj.owner.first_name or obj.owner.last_name:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return obj.owner.username


class OrderSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_price = serializers.DecimalField(source='listing.price', read_only=True, max_digits=10, decimal_places=2)
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    buyer_full_name = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='listing.owner.username', read_only=True)
    seller_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'buyer_name', 'buyer_full_name', 
            'listing', 'listing_title', 'listing_price', 
            'seller_name', 'seller_full_name', 'status', 'created_at'
        ]
        read_only_fields = ['buyer', 'created_at']
    
    def get_buyer_full_name(self, obj):
        if obj.buyer.first_name or obj.buyer.last_name:
            return f"{obj.buyer.first_name} {obj.buyer.last_name}".strip()
        return obj.buyer.username
    
    def get_seller_full_name(self, obj):
        seller = obj.listing.owner
        if seller.first_name or seller.last_name:
            return f"{seller.first_name} {seller.last_name}".strip()
        return seller.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    
    # Champs profil
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    is_seller = serializers.BooleanField(required=False, default=False)
    is_buyer = serializers.BooleanField(required=False, default=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    
    # Champs CIN
    cin_number = serializers.CharField(required=False, allow_blank=True)
    cin_issue_date = serializers.DateField(required=False, allow_null=True)
    cin_issue_place = serializers.CharField(required=False, allow_blank=True)
    cin_photo = serializers.ImageField(required=False, allow_null=True)
    
    # Champs vendeur
    seller_store_name = serializers.CharField(required=False, allow_blank=True)
    seller_description = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password', 
            'first_name', 'last_name', 'phone', 'address', 
            'is_seller', 'is_buyer', 'avatar',
            'cin_number', 'cin_issue_date', 'cin_issue_place', 'cin_photo',
            'seller_store_name', 'seller_description'
        ]
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas"})
        
        if not data.get('is_seller') and not data.get('is_buyer'):
            raise serializers.ValidationError({"roles": "Vous devez sélectionner au moins un rôle"})
        
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Ce nom d'utilisateur existe déjà"})
        
        if data.get('email') and User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Cet email est déjà utilisé"})
        
        return data
    
    def create(self, validated_data):
        # Extraire les champs du profil
        phone = validated_data.pop('phone', '')
        address = validated_data.pop('address', '')
        is_seller = validated_data.pop('is_seller', False)
        is_buyer = validated_data.pop('is_buyer', True)
        avatar = validated_data.pop('avatar', None)
        
        # Extraire les champs CIN
        cin_number = validated_data.pop('cin_number', '')
        cin_issue_date = validated_data.pop('cin_issue_date', None)
        cin_issue_place = validated_data.pop('cin_issue_place', '')
        cin_photo = validated_data.pop('cin_photo', None)
        
        # Extraire les champs vendeur
        seller_store_name = validated_data.pop('seller_store_name', '')
        seller_description = validated_data.pop('seller_description', '')
        
        # Supprimer confirm_password
        validated_data.pop('confirm_password')
        
        # Créer l'utilisateur
        user = User.objects.create_user(**validated_data)
        
        # Créer le profil
        Profile.objects.create(
            user=user,
            phone=phone,
            address=address,
            is_seller=is_seller,
            is_buyer=is_buyer,
            avatar=avatar,
            cin_number=cin_number,
            cin_issue_date=cin_issue_date,
            cin_issue_place=cin_issue_place,
            cin_photo=cin_photo,
            seller_store_name=seller_store_name if is_seller else '',
            seller_description=seller_description if is_seller else ''
        )
        
        return user