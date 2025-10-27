from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
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
@permission_classes([IsAuthenticated])  # Changed from IsAdminUser
def get_messages(request):
    """Get contact messages with filters - filtered by user permissions"""
    
    user = request.user
    message_type = request.query_params.get('type')
    case_id = request.query_params.get('case_id')
    message_status = request.query_params.get('status')
    page = int(request.query_params.get('page', 1))
    limit = int(request.query_params.get('limit', 20))
    
    # Determine which cases the user can see messages for
    accessible_case_ids = []
    
    if user.is_superuser or user.is_staff:
        # Admins see all messages
        accessible_case_ids = None  # None = no filter
    else:
        # Get cases user owns
        owned_cases = Case.objects.filter(user=user).values_list('id', flat=True)
        accessible_case_ids = list(owned_cases)
        
        # Add cases user has CaseAccess to
        try:
            from cases.models import CaseAccess
            access_case_ids = CaseAccess.objects.filter(
                user=user,
                accepted=True,
                can_view_tips=True  # Only if they have permission to view tips
            ).values_list('case_id', flat=True)
            accessible_case_ids.extend(access_case_ids)
            accessible_case_ids = list(set(accessible_case_ids))  # Remove duplicates
        except Exception as e:
            pass
    
    messages = []
    
    # Get inquiries (only admins see general inquiries)
    if (not message_type or message_type == 'inquiry') and (user.is_superuser or user.is_staff):
        inquiries = ContactInquiry.objects.all()
        if message_status:
            inquiries = inquiries.filter(status=message_status)
        
        for inquiry in inquiries:
            messages.append({
                **ContactInquirySerializer(inquiry).data,
                'type': 'inquiry'
            })
    
    # Get tips - filtered by accessible cases
    if not message_type or message_type == 'tip':
        tips = Tip.objects.all()
        
        # Filter by accessible cases
        if accessible_case_ids is not None:  # Not admin
            tips = tips.filter(case_id__in=accessible_case_ids)
        
        # Apply additional filters
        if message_status:
            tips = tips.filter(status=message_status)
        if case_id:
            # Additional case_id filter (must be in accessible cases)
            if accessible_case_ids is None or int(case_id) in accessible_case_ids:
                tips = tips.filter(case_id=case_id)
            else:
                tips = tips.none()  # User doesn't have access to this case
        
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
@permission_classes([IsAuthenticated])  # Changed from IsAdminUser
def update_message_status(request, message_id):
    """Update message status - filtered by user permissions"""
    
    user = request.user
    new_status = request.data.get('status')
    
    valid_statuses = ['new', 'reviewed', 'responded', 'archived']
    if new_status not in valid_statuses:
        return Response({
            'success': False,
            'message': 'Invalid status value'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Determine which cases the user can manage
    can_manage_all = user.is_superuser or user.is_staff
    accessible_case_ids = []
    
    if not can_manage_all:
        # Get cases user owns
        owned_cases = Case.objects.filter(user=user).values_list('id', flat=True)
        accessible_case_ids = list(owned_cases)
        
        # Add cases user has CaseAccess to with appropriate permissions
        try:
            from cases.models import CaseAccess
            access_case_ids = CaseAccess.objects.filter(
                user=user,
                accepted=True,
                can_view_tips=True  # Must have tip viewing permission
            ).values_list('case_id', flat=True)
            accessible_case_ids.extend(access_case_ids)
            accessible_case_ids = list(set(accessible_case_ids))
        except Exception as e:
            pass
    
    # Try to find in inquiries first (admin only)
    if can_manage_all:
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
    
    # Try tips - check if user has access to the case
    try:
        tip = Tip.objects.get(id=message_id)
        
        # Check if user has permission to update this tip
        if can_manage_all or tip.case_id in accessible_case_ids:
            tip.status = new_status
            tip.save()
            return Response({
                'success': True,
                'message': 'Status updated successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'You do not have permission to update this message'
            }, status=status.HTTP_403_FORBIDDEN)
    except Tip.DoesNotExist:
        pass
    
    return Response({
        'success': False,
        'message': 'Message not found'
    }, status=status.HTTP_404_NOT_FOUND)