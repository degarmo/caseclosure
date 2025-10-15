"""
Core URL Configuration for CaseClosure Backend
"""
from django.urls import path, include
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.conf.urls.static import static

def api_root(request):
    """API root endpoint with basic info"""
    return JsonResponse({
        "message": "CaseClosure API Server Running",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/",
            "cases": "/api/cases/",
            "case-spotlight": "/api/case-spotlight/",  # ✅ ADDED: New case-specific spotlight
            "images": "/api/images/upload/",
            "tracker": "/api/tracker/",
            "spotlight": "/api/spotlight/",  # OLD: Main site spotlight (still exists)
            "dashboard": "/api/dashboard/",
            "admin": "/admin/",
        }
    })

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API Root
    path('', lambda request: HttpResponse("CaseClosure API Server Running.")),
    path('api/', api_root),
    
    # API Endpoints - Consolidated to avoid duplication
    path('api/auth/', include('accounts.urls')),  # Authentication endpoints
    path('api/', include('cases.urls')),  # Cases endpoints (includes case-spotlight!)
    path('api/tracker/', include('tracker.urls')), # Tracker endpoints
    path('api/dashboard/', include('dashboard.urls')),
    path('api/', include('spotlight.urls')),  # OLD: Main site spotlight
    path('api/', include('contact.urls')),
    
    # Django-allauth URLs for Google OAuth
    path('accounts/', include('allauth.urls')),
    
    # Google OAuth redirect endpoints (handled by accounts app)
    path('auth/google/login/', include([
        path('', lambda request: HttpResponse(status=302, headers={'Location': '/accounts/google/login/'})),
    ])),
    
    # DRF Browsable API auth (optional, useful for development)
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar (optional)
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# Custom error handlers (optional)
handler404 = 'core.views.custom_404'
handler500 = 'core.views.custom_500'
handler403 = 'core.views.custom_403'
handler400 = 'core.views.custom_400'