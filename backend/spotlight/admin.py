from django.contrib import admin
from .models import SpotlightPost, SpotlightMedia, SpotlightLike, SpotlightComment

@admin.register(SpotlightPost)
class SpotlightPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'status', 'created_at', 'published_at']
    list_filter = ['status', 'created_at', 'published_at']
    search_fields = ['title', 'content_text', 'author__username']  # <- Add the closing bracket
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

@admin.register(SpotlightMedia)
class SpotlightMediaAdmin(admin.ModelAdmin):
    list_display = ['post', 'media_type', 'order', 'uploaded_at']
    list_filter = ['media_type', 'uploaded_at']

@admin.register(SpotlightLike)
class SpotlightLikeAdmin(admin.ModelAdmin):
    list_display = ['post', 'user', 'created_at']
    list_filter = ['created_at']

@admin.register(SpotlightComment)
class SpotlightCommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author', 'created_at', 'is_edited']
    list_filter = ['created_at', 'is_edited']
    search_fields = ['content', 'author__username']