from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# from .models import CustomUser 

# class CustomUserAdmin(UserAdmin):
#     model = CustomUser
#     list_display = ('username', 'email', 'last_active', 'avatar')  # Champs à afficher
#     search_fields = ('username', 'email')  # Permet de rechercher par ces champs
#     list_filter = ('last_active',)  # Filtres pour la recherche
#     fieldsets = UserAdmin.fieldsets + (
#         (None, {'fields': ('avatar', 'friends', 'last_active')}),
#     )
#     add_fieldsets = UserAdmin.add_fieldsets + (
#         (None, {'fields': ( 'avatar')}),
#     )

# admin.site.register(CustomUser, CustomUserAdmin)