from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.core.paginator import Paginator
from django.db.models import Q
import uuid

from .models import ContactInquiry, Tip
from .serializers import ContactInquirySerializer, TipSerializer
from cases.models import Case


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_inquiry(request):
    """Submit contact inquiry from main site"""
    
    serializer = ContactInquirySerializer(data=request.data)
    
    if serializer.is_valid():
        inquiry = serializer.save()
        
        # TODO: Send email notification to admin
        
        return Response({
            'success': True,
            'message': 'Inquiry submitted successfully',
            'inquiry_id': inquiry.id
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Validation error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_tip(request):
    """Submit tip from victim memorial site"""
    
    # Validate case exists
    case_id = request.data.get('case_id')
    if not case_id:
        return Response({
            'success': False,
            'message': 'case_id is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        case = Case.objects.get(id=case_id)
    except Case.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Case not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = TipSerializer(data=request.data)
    
    if serializer.is_valid():
        tip = serializer.save()
        
        # TODO: Send email notification to case owner and admin
        
        return Response({
            'success': True,
            'message': 'Tip submitted successfully',
            'tip_id': tip.id
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Validation error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_messages(request):
    """Get all contact messages with filters (admin only)"""
    
    message_type = request.query_params.get('type')
    case_id = request.query_params.get('case_id')
    message_status = request.query_params.get('status')
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    
    messages = []
    
    # Get inquiries
    if not message_type or message_type == 'inquiry':
        inquiries = ContactInquiry.objects.all()
        if message_status:
            inquiries = inquiries.filter(status=message_status)
        
        for inquiry in inquiries:
            messages.append({
                **ContactInquirySerializer(inquiry).data,
                'type': 'inquiry'
            })
    
    # Get tips
    if not message_type or message_type == 'tip':
        tips = Tip.objects.all()
        if message_status:
            tips = tips.filter(status=message_status)
        if case_id:
            tips = tips.filter(case_id=case_id)
        
        for tip in tips:
            messages.append({
                **TipSerializer(tip).data,
                'type': 'tip'
            })
    
    # Sort by submitted_at
    messages.sort(key=lambda x: x['submitted_at'], reverse=True)
    
    # Paginate
    paginator = Paginator(messages, limit)
    page_obj = paginator.get_page(page)
    
    return Response({
        'success': True,
        'data': list(page_obj),
        'pagination': {
            'page': page,
            'limit': limit,
            'total': paginator.count,
            'pages': paginator.num_pages
        }
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_message_status(request, message_id):
    """Update message status (admin only)"""
    
    new_status = request.data.get('status')
    
    valid_statuses = ['new', 'reviewed', 'responded', 'archived']
    if new_status not in valid_statuses:
        return Response({
            'success': False,
            'message': 'Invalid status value'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to find in inquiries first
    try:
        inquiry = ContactInquiry.objects.get(id=message_id)
        inquiry.status = new_status
        inquiry.save()
        return Response({
            'success': True,
            'message': 'Status updated successfully'
        }, status=status.HTTP_200_OK)
    except ContactInquiry.DoesNotExist:
        pass
    
    # Try tips
    try:
        tip = Tip.objects.get(id=message_id)
        tip.status = new_status
        tip.save()
        return Response({
            'success': True,
            'message': 'Status updated successfully'
        }, status=status.HTTP_200_OK)
    except Tip.DoesNotExist:
        pass
    
    return Response({
        'success': False,
        'message': 'Message not found'
    }, status=status.HTTP_404_NOT_FOUND)