from django.urls import path, include
from django.contrib import admin


urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('admin/', admin.site.urls),
]


