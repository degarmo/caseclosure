// Dynamic navigation configuration
import { 
  Activity, Folder, Plus, Users, MessageSquare, 
  Settings, Shield, Megaphone, List, Clock, UserPlus
} from 'lucide-react';

export function getNavigationItems(user, permissions, handlers) {
  const { setActiveSection, onOpenCaseModal, data } = handlers;
  const items = [];
  
  // Overview - available to all
  items.push({
    id: 'overview',
    label: 'Overview',
    icon: Activity,
    onClick: () => setActiveSection('overview')
  });
  
  // Cases section
  if (permissions.can('view_all_cases') || permissions.can('view_own_cases')) {
    const caseItems = {
      id: 'cases',
      label: permissions.can('view_all_cases') ? 'Cases' : 'My Cases',
      icon: Folder,
      expandable: true,
      badge: data?.stats?.totalCases || 0,
      subItems: []
    };
    
    if (permissions.can('create_cases') && !permissions.isReadOnly()) {
      caseItems.subItems.push({
        id: 'cases-create',
        label: 'Create Case',
        icon: Plus,
        onClick: onOpenCaseModal
      });
    }
    
    caseItems.subItems.push({
      id: 'cases-all',
      label: permissions.can('view_all_cases') ? 'All Cases' : 'My Cases',
      badge: data?.stats?.totalCases || 0,
      onClick: () => setActiveSection('cases-all')
    });
    
    if (permissions.can('view_all_cases')) {
      caseItems.subItems.push(
        {
          id: 'cases-active',
          label: 'Active Cases',
          badge: data?.stats?.activeCases || 0,
          onClick: () => setActiveSection('cases-active')
        },
        {
          id: 'cases-disabled',
          label: 'Disabled Cases',
          onClick: () => setActiveSection('cases-disabled')
        }
      );
    }
    
    items.push(caseItems);
  }
  
  // Spotlight section
  if (permissions.can('manage_spotlight') || permissions.can('create_spotlight')) {
    const spotlightItems = {
      id: 'spotlight',
      label: 'Spotlight',
      icon: Megaphone,
      expandable: true,
      badge: data?.stats?.totalSpotlightPosts || 0,
      subItems: []
    };
    
    if (permissions.can('create_spotlight') && !permissions.isReadOnly()) {
      spotlightItems.subItems.push({
        id: 'spotlight-create',
        label: 'Create Post',
        icon: Plus,
        onClick: () => setActiveSection('spotlight-create')
      });
    }
    
    spotlightItems.subItems.push(
      {
        id: 'spotlight-posts',
        label: 'Posts',
        icon: List,
        badge: data?.stats?.totalSpotlightPosts || 0,
        onClick: () => setActiveSection('spotlight-posts')
      },
      {
        id: 'spotlight-delayed',
        label: 'Scheduled Posts',
        icon: Clock,
        badge: data?.stats?.scheduledPosts || 0,
        onClick: () => setActiveSection('spotlight-delayed')
      }
    );
    
    items.push(spotlightItems);
  }
  
  // Messages section
  if (permissions.can('view_all_messages') || permissions.can('view_own_messages')) {
    items.push({
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      expandable: true,
      badge: data?.stats?.totalMessages || 0,
      subItems: [
        {
          id: 'messages-all',
          label: 'All Messages',
          onClick: () => setActiveSection('messages-all')
        },
        {
          id: 'messages-inquiries',
          label: 'Contact Inquiries',
          onClick: () => setActiveSection('messages-inquiries')
        },
        {
          id: 'messages-tips',
          label: 'Tips',
          onClick: () => setActiveSection('messages-tips')
        }
      ]
    });
  }
  
  // Users section - admin only
  if (permissions.can('manage_users')) {
    items.push({
      id: 'users',
      label: 'Users',
      icon: Users,
      expandable: true,
      badge: data?.stats?.totalUsers || 0,
      subItems: [
        {
          id: 'users-all',
          label: 'All Users',
          badge: data?.stats?.totalUsers || 0,
          onClick: () => setActiveSection('users-all')
        },
        {
          id: 'users-requests',
          label: 'Account Requests',
          icon: UserPlus,
          badge: data?.stats?.pendingRequests || 0,
          onClick: () => setActiveSection('users-requests')
        },
        {
          id: 'users-admins',
          label: 'Administrators',
          onClick: () => setActiveSection('users-admins')
        }
      ]
    });
  }
  
  // System section - admin only
  if (permissions.can('manage_settings')) {
    items.push({
      id: 'system',
      label: 'System',
      icon: Shield,
      expandable: true,
      subItems: [
        {
          id: 'system-settings',
          label: 'Site Settings',
          icon: Settings,
          onClick: () => setActiveSection('system-settings')
        }
      ]
    });
  }
  
  return items;
}