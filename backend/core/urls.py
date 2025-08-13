from django.urls import path, include, include
from django.contrib import admin
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('admin/', admin.site.urls),
    path('', lambda request: HttpResponse("CaseClosure API Server Running.")),
    path('api/', include('accounts.urls')),
    path('api/', include('cases.urls')),
    path('api/', include('tracker.urls')),
    path('api/accounts/', include('accounts.urls')),
]

static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
