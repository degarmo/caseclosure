from django.urls import path, include
from django.contrib import admin
from django.http import HttpResponse

urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('admin/', admin.site.urls),
    path('api/', include('sites.urls')),
    path('', lambda request: HttpResponse("CaseClosure API Server Running.")),
]


