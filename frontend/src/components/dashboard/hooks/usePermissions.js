export function usePermissions(user) {
  const permissions = {
    // Role checks
    isAdmin: () => user?.is_superuser || user?.is_staff || user?.is_admin,
    isPolice: () => user?.role === 'police' || user?.account_type === 'detective' || user?.account_type === 'leo' || user?.account_type === 'law_enforcement',
    isUser: () => !permissions.isAdmin() && !permissions.isPolice(),
    isReadOnly: () => permissions.isPolice(),

    getRole: () => {
      if (permissions.isAdmin()) return 'admin';
      if (permissions.isPolice()) return 'police';
      return 'user';
    },

    // Feature permissions
    can: (action) => {
      const rolePermissions = {
        admin: [
          'view_all_cases', 'edit_cases', 'delete_cases', 'create_cases',
          'manage_users', 'approve_users', 'manage_settings',
          'view_all_messages', 'view_all_tips', 'manage_spotlight',
          'edit_all_spotlight', 'view_analytics', 'view_own_analytics', 'access_admin_panel'
        ],
        user: [
          'view_own_cases', 'edit_own_cases', 'create_cases',
          'view_own_messages', 'create_spotlight', 'edit_own_spotlight',
          'delete_own_spotlight', 'view_own_tips', 'view_own_analytics'
        ],
        police: [
          'view_assigned_cases', 'view_case_tips', 'view_analytics',
          'view_own_analytics', 'view_assigned_messages'
        ]
      };

      const userRole = permissions.getRole();
      return rolePermissions[userRole]?.includes(action) || false;
    },

    // Section access
    canAccess: (section) => {
      const sectionPermissions = {
        'overview': true,
        'cases-all': permissions.can('view_all_cases') || permissions.can('view_own_cases') || permissions.can('view_assigned_cases'),
        'cases-active': permissions.can('view_all_cases') || permissions.can('view_own_cases') || permissions.can('view_assigned_cases'),
        'spotlight-posts': true,
        'spotlight-scheduled': permissions.can('view_all_cases'),
        'spotlight-create': permissions.can('create_spotlight'),
        'messages-all': permissions.can('view_all_messages') || permissions.can('view_own_messages') || permissions.can('view_assigned_messages'),
        'messages-tips': permissions.can('view_all_tips') || permissions.can('view_own_tips') || permissions.can('view_case_tips'),
        'users-all': permissions.can('manage_users'),
        'users-requests': permissions.can('approve_users'),
        'user-details': permissions.can('manage_users'),
        'settings': true,
        'analytics': permissions.can('view_analytics') || permissions.can('view_own_analytics')
      };

      return sectionPermissions[section] !== false;
    },

    shouldShowSection: (section) => permissions.canAccess(section),

    shouldShowBadge: (badgeType) => {
      const badgePermissions = {
        'pendingRequests': permissions.isAdmin(),
        'unreadMessages': !permissions.isReadOnly(),
        'newTips': !permissions.isReadOnly()
      };
      return badgePermissions[badgeType] || false;
    }
  };

  return permissions;
}
