from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
import secrets

from .models import Case, CaseAccess, LEOInvite
from accounts.models import CustomUser

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_leo(request, case_id):
    """Case owner invites law enforcement officer or private investigator"""
    try:
        case = Case.objects.get(id=case_id, user=request.user)
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)
    
    data = request.data
    invite_type = data.get('invite_type', 'leo')  # 'leo' or 'private_investigator'
    
    # Create invite using LEOInvite model
    invite = LEOInvite.objects.create(
        case=case,
        officer_name=data['officer_name'],
        officer_email=data['email'],
        department=data['department'],
        badge_number=data.get('badge_number', ''),
        access_config={
            'access_level': invite_type,
            'can_view_tips': data.get('can_view_tips', True),
            'can_view_tracking': data.get('can_view_tracking', invite_type == 'leo'),
            'can_view_personal_info': data.get('can_view_personal_info', False),
            'can_export_data': data.get('can_export_data', invite_type == 'leo'),
            'can_contact_family': data.get('can_contact_family', True),
            'modules': data.get('modules', ['cases', 'tips']),
        },
        created_by=request.user,
        expires_at=timezone.now() + timedelta(days=30)
    )
    
    # Send invitation email
    invite_url = f"https://caseclosure.org/accept-invite/{invite.invite_code}"
    
    email_body = f"""
    {invite.officer_name},
    
    You have been invited to access case information for:
    {case.get_display_name()} - {case.case_title}
    
    To accept this invitation and create your account, visit:
    {invite_url}
    
    This invitation expires in 30 days.
    
    Access permissions granted:
    - View Tips: {'Yes' if invite.access_config.get('can_view_tips') else 'No'}
    - View Tracking Data: {'Yes' if invite.access_config.get('can_view_tracking') else 'No'}
    - Export Data: {'Yes' if invite.access_config.get('can_export_data') else 'No'}
    - Contact Family: {'Yes' if invite.access_config.get('can_contact_family') else 'No'}
    
    Department: {invite.department}
    {'Badge #: ' + invite.badge_number if invite.badge_number else ''}
    """
    
    send_mail(
        subject=f"Case Access Invitation - {case.case_title}",
        message=email_body,
        from_email='noreply@caseclosure.org',
        recipient_list=[invite.officer_email],
        fail_silently=False,
    )
    
    return Response({
        'success': True,
        'invite_code': invite.invite_code,
        'message': f'Invitation sent to {invite.officer_email}'
    })


@api_view(['POST'])
def accept_leo_invite(request):
    """Law enforcement or PI accepts invite"""
    invite_code = request.data.get('invite_code')
    
    try:
        invite = LEOInvite.objects.get(
            invite_code=invite_code,
            used=False
        )
        
        if not invite.is_valid():
            return Response({'error': 'Invitation has expired'}, status=400)
            
    except LEOInvite.DoesNotExist:
        return Response({'error': 'Invalid invitation code'}, status=400)
    
    # Create or get user account
    user, created = CustomUser.objects.get_or_create(
        email=invite.officer_email,
        defaults={
            'first_name': invite.officer_name.split()[0] if invite.officer_name else '',
            'last_name': ' '.join(invite.officer_name.split()[1:]) if len(invite.officer_name.split()) > 1 else '',
            'account_type': 'detective' if invite.access_config.get('access_level') == 'leo' else 'verified',
        }
    )
    
    if created:
        # Set password if new user
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password required for new account'}, status=400)
        user.set_password(password)
        user.save()
    
    # Create CaseAccess record
    access, created = CaseAccess.objects.get_or_create(
        case=invite.case,
        user=user,
        defaults={
            'access_level': invite.access_config.get('access_level', 'leo'),
            'can_view_tips': invite.access_config.get('can_view_tips', True),
            'can_view_tracking': invite.access_config.get('can_view_tracking', False),
            'can_view_personal_info': invite.access_config.get('can_view_personal_info', False),
            'can_view_evidence': invite.access_config.get('can_view_evidence', True),
            'can_export_data': invite.access_config.get('can_export_data', False),
            'can_contact_family': invite.access_config.get('can_contact_family', True),
            'invited_by': invite.created_by,
            'invitation_message': f"Department: {invite.department}, Badge: {invite.badge_number}",
            'accepted': True,
            'accepted_at': timezone.now(),
        }
    )
    
    if not created:
        # Update existing access
        access.accepted = True
        access.accepted_at = timezone.now()
        access.save()
    
    # Mark invite as used
    invite.used = True
    invite.used_at = timezone.now()
    invite.used_by = user
    invite.save()
    
    return Response({
        'success': True,
        'message': 'Access granted successfully',
        'case_id': str(invite.case.id),
        'redirect': '/dashboard'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_leos(request, case_id):
    """Get list of LEOs/PIs with access to a case"""
    try:
        case = Case.objects.get(id=case_id)
        
        # Check permissions
        if case.user != request.user and not request.user.is_staff:
            # Check if user has appropriate access
            user_access = CaseAccess.objects.filter(
                case=case,
                user=request.user,
                accepted=True
            ).first()
            
            if not user_access:
                return Response({'error': 'Permission denied'}, status=403)
        
        # Get all active access records
        accesses = CaseAccess.objects.filter(
            case=case,
            accepted=True
        ).select_related('user', 'invited_by')
        
        access_list = []
        for access in accesses:
            access_list.append({
                'id': str(access.id),
                'user': {
                    'name': f"{access.user.first_name} {access.user.last_name}",
                    'email': access.user.email,
                },
                'access_level': access.access_level,
                'permissions': {
                    'can_view_tips': access.can_view_tips,
                    'can_view_tracking': access.can_view_tracking,
                    'can_view_personal_info': access.can_view_personal_info,
                    'can_export_data': access.can_export_data,
                    'can_contact_family': access.can_contact_family,
                },
                'invited_by': access.invited_by.email if access.invited_by else None,
                'accepted_at': access.accepted_at,
                'last_accessed': access.last_accessed,
                'access_count': access.access_count,
            })
        
        return Response({
            'accesses': access_list,
            'count': len(access_list)
        })
        
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def revoke_access(request, case_id, access_id):
    """Revoke LEO/PI access to a case"""
    try:
        case = Case.objects.get(id=case_id, user=request.user)
        access = CaseAccess.objects.get(id=access_id, case=case)
        
        # Log the revocation
        access.log_action('access_revoked', request)
        
        # Delete the access record
        access.delete()
        
        return Response({'success': True, 'message': 'Access revoked'})
        
    except Case.DoesNotExist:
        return Response({'error': 'Case not found'}, status=404)
    except CaseAccess.DoesNotExist:
        return Response({'error': 'Access record not found'}, status=404)