from django.urls import path
from . import views

urlpatterns = [
    # POST /api/contact/inquiry - Submit contact inquiry from main site
    path('contact/inquiry', views.submit_inquiry, name='submit_inquiry'),
    
    # POST /api/contact/tip - Submit tip from victim memorial site
    path('contact/tip', views.submit_tip, name='submit_tip'),
    
    # GET /api/contact/messages - Get all messages (admin only)
    path('contact/messages', views.get_messages, name='get_messages'),
    
    # PATCH /api/contact/messages/<id> - Update message status (admin only)
    path('contact/messages/<str:message_id>', views.update_message_status, name='update_message_status'),
]