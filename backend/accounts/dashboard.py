# accounts/dashboard.py
from django.utils import timezone
from datetime import timedelta
from cases.models import Case, CaseAccess, LEOInvite
from .models import CustomUser, AccountRequest

class DashboardConfig:
    """Dashboard configuration based on user role and permissions"""
    
    def __init__(self, user):
        self.user = user
        self._case_access = None
        self._load_case_access()
    
    def _load_case_access(self):
        """Load any case access permissions for the user"""
        try:
            # Get all case access records for this user
            self._case_access_list = CaseAccess.objects.filter(
                user=self.user,
                accepted=True
            )
            self._case_access = self._case_access_list.first()
        except:
            self._case_access_list = []
            self._case_access = None
    
    def get_role(self):
        """Determine user's primary role with all role types"""
        # Super admin (highest priority)
        if self.user.is_superuser:
            return 'super_admin'
        
        # Staff/Admin
        if self.user.is_staff:
            return 'admin'
        
        # Check account_type field for specific roles
        if hasattr(self.user, 'account_type'):
            if self.user.account_type == 'detective':
                return 'police'  # Using 'police' to match your original
            elif self.user.account_type == 'advocate':
                return 'advocate'
            elif self.user.account_type == 'verified':
                return 'family'
        
        # Check for LEO/PI access via CaseAccess
        if self._case_access:
            if self._case_access.access_level == 'leo':
                return 'leo'
            elif self._case_access.access_level == 'private_investigator':
                return 'private_investigator'
            elif self._case_access.access_level == 'investigator':
                return 'leo'  # Map old 'investigator' to 'leo'
        
        # Check if case owner
        if Case.objects.filter(user=self.user, archived=False).exists():
            return 'case_owner'
        
        return 'basic'
    
    def get_permissions(self):
        """Get user permissions - comprehensive list"""
        role = self.get_role()
        
        # Full permissions structure
        permissions = {
            'canCreateCases': False,
            'canDeleteCases': False,
            'canEditCases': False,
            'canEditAllCases': False,
            'canManageUsers': False,
            'canViewAllCases': False,
            'canViewAnalytics': False,
            'canViewAllAnalytics': False,
            'canViewFullTracking': False,
            'canViewTracking': False,
            'canManageSystem': False,
            'canModerateContent': False,
            'canViewAllTips': False,
            'canViewAllMessages': False,
            'canCreateSpotlight': False,
            'canExportData': False,
            'canInviteLEO': False,
            'canInvitePI': False,
            'canContactFamily': False,
            'canViewPersonalInfo': False,
            'canArchiveCases': False,
            'canAccessBilling': False,
            'readOnly': False,
        }
        
        if role == 'super_admin':
            # Super admin gets everything
            permissions = {key: True for key in permissions}
            permissions['readOnly'] = False
            
        elif role == 'admin':
            # Admin gets most permissions
            permissions.update({
                'canCreateCases': True,
                'canDeleteCases': True,
                'canEditCases': True,
                'canEditAllCases': True,
                'canManageUsers': True,
                'canViewAllCases': True,
                'canViewAnalytics': True,
                'canViewAllAnalytics': True,
                'canViewFullTracking': True,
                'canViewTracking': True,
                'canModerateContent': True,
                'canViewAllTips': True,
                'canViewAllMessages': True,
                'canCreateSpotlight': True,
                'canExportData': True,
                'canInviteLEO': True,
                'canAccessBilling': True,
                'readOnly': False,
            })
            
        elif role == 'police' or role == 'leo':
            # Police/LEO permissions
            permissions.update({
                'canViewAllCases': True,
                'canViewAnalytics': True,
                'canViewAllTips': True,
                'canViewTracking': True,
                'canExportData': True,
                'readOnly': True,  # LEOs have read-only access
            })
            
            # Check specific CaseAccess permissions
            if self._case_access:
                permissions.update({
                    'canViewPersonalInfo': self._case_access.can_view_personal_info,
                    'canContactFamily': self._case_access.can_contact_family,
                    'canExportData': self._case_access.can_export_data,
                    'canViewTracking': self._case_access.can_view_tracking,
                })
                
        elif role == 'private_investigator':
            permissions.update({
                'canViewTracking': False,  # No tracking for PIs
                'canExportData': False,     # No export for PIs
                'readOnly': True,
            })
            
        elif role in ['case_owner', 'family']:
            permissions.update({
                'canCreateSpotlight': True,
                'canViewTracking': True,
                'canEditCases': True,       # Own cases only
                'canArchiveCases': True,     # Own cases only
                'canViewAnalytics': True,    # Own cases only
                'canExportData': True,       # Own case data
                'canInviteLEO': True,
                'canInvitePI': True,
                'readOnly': False,
            })
            
            # Check if they can create more cases
            if self._can_create_more_cases():
                permissions['canCreateCases'] = True
                
        elif role == 'advocate':
            permissions.update({
                'canViewTracking': False,
                'canCreateSpotlight': False,
                'readOnly': True,
            })
        
        return permissions
    
    def _can_create_more_cases(self):
        """Check if user can create more cases"""
        try:
            # Check subscription status if it exists
            if hasattr(self.user, 'subscription_status'):
                if self.user.subscription_status in ['expired', 'cancelled']:
                    return False
            
            # Check case limit
            current_cases = Case.objects.filter(
                user=self.user, 
                archived=False
            ).count()
            
            max_cases = getattr(self.user, 'max_cases', 1)
            return current_cases < max_cases
        except:
            # If no limits found, check if they have any cases
            return not Case.objects.filter(user=self.user).exists()
    
    def get_modules(self):
        """Get accessible modules - comprehensive list"""
        role = self.get_role()
        modules = ['overview']  # Everyone gets overview
        
        try:
            # Super Admin modules
            if role == 'super_admin':
                modules.extend(['cases', 'spotlight', 'users', 'tracking', 'analytics', 'tips', 'system', 'billing'])
                
            # Admin modules
            elif role == 'admin':
                modules.extend(['cases', 'spotlight', 'users', 'tracking', 'analytics', 'tips', 'content_moderation'])
                
            # Case owner modules
            elif role == 'case_owner':
                modules.extend(['cases', 'spotlight', 'tips', 'tracking', 'analytics', 'invite_access', 'settings'])
                
            # Family member modules
            elif role == 'family':
                modules.extend(['cases', 'spotlight', 'tips', 'analytics', 'settings'])
                
            # Police/LEO modules
            elif role in ['police', 'leo']:
                modules.extend(['cases', 'tips', 'tracking', 'analytics'])
                
                # Check for specific case access
                if self._case_access:
                    if self._case_access.can_view_tracking:
                        if 'tracking' not in modules:
                            modules.append('tracking')
                    # Add team module if they can see other LEOs
                    if hasattr(self._case_access, 'permissions'):
                        if self._case_access.permissions.get('view_other_leos', False):
                            modules.append('team')
                            
            # Private Investigator modules
            elif role == 'private_investigator':
                modules.extend(['cases', 'tips'])  # Limited access
                
            # Advocate modules
            elif role == 'advocate':
                modules.extend(['cases', 'tips'])
            
            # Remove duplicates while preserving order
            seen = set()
            unique_modules = []
            for module in modules:
                if module not in seen:
                    seen.add(module)
                    unique_modules.append(module)
            
            return unique_modules
            
        except Exception as e:
            print(f"Error in get_modules: {e}")
            return ['overview']
    
    def get_accessible_cases(self):
        """Get cases user can access"""
        role = self.get_role()
        
        if role in ['super_admin', 'admin']:
            return Case.objects.filter(archived=False)
            
        elif role in ['case_owner', 'family']:
            return Case.objects.filter(user=self.user, archived=False)
            
        elif role in ['police', 'leo', 'private_investigator']:
            # Get cases through CaseAccess
            case_ids = CaseAccess.objects.filter(
                user=self.user,
                accepted=True
            ).values_list('case', flat=True)
            return Case.objects.filter(id__in=case_ids, archived=False)
            
        else:
            return Case.objects.none()
    
    def get_stats(self):
        """Get comprehensive statistics based on role"""
        role = self.get_role()
        stats = {}
        
        try:
            if role in ['super_admin', 'admin']:
                stats.update({
                    'totalCases': Case.objects.count(),
                    'activeCases': Case.objects.filter(is_public=True, is_disabled=False, archived=False).count(),
                    'totalUsers': CustomUser.objects.count(),
                    'pendingRequests': AccountRequest.objects.filter(status='pending').count(),
                })
                
                # Add subscription stats if available
                if hasattr(CustomUser, 'subscription_status'):
                    stats['activeSubscriptions'] = CustomUser.objects.filter(
                        subscription_status='active'
                    ).count()
                    
            elif role in ['case_owner', 'family']:
                user_cases = Case.objects.filter(user=self.user, archived=False)
                stats.update({
                    'myCases': user_cases.count(),
                    'publicCases': user_cases.filter(is_public=True).count(),
                    'draftCases': user_cases.filter(is_public=False).count(),
                })
                
                # Add LEO invitation stats
                if user_cases.exists():
                    stats['activeLEOs'] = CaseAccess.objects.filter(
                        case__in=user_cases,
                        access_level__in=['leo', 'investigator'],
                        accepted=True
                    ).count()
                
                # Add trial days if available
                if hasattr(self.user, 'days_left_in_trial'):
                    stats['trialDaysLeft'] = self.user.days_left_in_trial()
                    
            elif role in ['police', 'leo']:
                accessible_cases = self.get_accessible_cases()
                stats.update({
                    'accessibleCases': accessible_cases.count(),
                    'totalCases': Case.objects.count(),
                })
                
                # Add last accessed info
                if self._case_access:
                    stats['lastAccessed'] = self._case_access.last_accessed
                    
            elif role == 'private_investigator':
                accessible_cases = self.get_accessible_cases()
                stats['assignedCases'] = accessible_cases.count()
                
        except Exception as e:
            print(f"Error in get_stats: {e}")
        
        return stats
    
    def get_invite_defaults(self):
        """Get default permissions when inviting LEO/PI"""
        return {
            'leo': {
                'can_view_tips': True,
                'can_view_tracking': True,
                'can_view_personal_info': False,
                'can_view_evidence': True,
                'can_export_data': True,
                'can_contact_family': True,
            },
            'private_investigator': {
                'can_view_tips': True,
                'can_view_tracking': False,  # No tracking for PIs
                'can_view_personal_info': False,
                'can_view_evidence': True,
                'can_export_data': False,  # No export for PIs
                'can_contact_family': True,
            }
        }
    
    def get_config(self):
        """Get complete configuration"""
        role = self.get_role()
        
        return {
            'user': {
                'id': self.user.id,
                'email': self.user.email,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'name': f"{self.user.first_name} {self.user.last_name}",
                'account_type': getattr(self.user, 'account_type', None),
                'role': role,
                'verified': getattr(self.user, 'identity_verified', False),
                'subscription': getattr(self.user, 'subscription_status', None),
            },
            'role': role,
            'permissions': self.get_permissions(),
            'modules': self.get_modules(),
            'stats': self.get_stats(),
            'theme': self._get_theme(role),
            'defaultModule': 'overview',
            'inviteDefaults': self.get_invite_defaults() if role in ['case_owner', 'admin', 'super_admin'] else {},
            'accessibleCases': self._get_accessible_cases_list(),
        }
    
    def _get_theme(self, role):
        """Get theme color based on role"""
        themes = {
            'super_admin': 'indigo',
            'admin': 'purple',
            'case_owner': 'blue',
            'family': 'emerald',
            'police': 'slate',
            'leo': 'slate',
            'private_investigator': 'gray',
            'advocate': 'teal',
            'basic': 'gray'
        }
        return themes.get(role, 'gray')
    
    def _get_accessible_cases_list(self):
        """Get list of accessible cases for display"""
        cases = self.get_accessible_cases()[:10]
        return [
            {
                'id': str(case.id),
                'title': case.case_title,
                'victim_name': case.get_display_name(),
                'is_public': case.is_public,
                'can_edit': self.user == case.user,
            }
            for case in cases
        ]