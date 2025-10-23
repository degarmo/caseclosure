// Role-based configuration
export function getRoleConfig(userRole) {
  const configs = {
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'System administration and monitoring',
      defaultSection: 'overview',
      theme: 'admin',
      sidebarItems: [
        { id: 'overview', label: 'Overview', icon: 'chart-bar', section: 'overview' },
        { id: 'cases', label: 'Cases', icon: 'folder', section: 'cases-all' },
        { id: 'spotlight', label: 'Spotlight', icon: 'star', 
          children: [
            { id: 'spotlight-posts', label: 'All Posts', section: 'spotlight-posts' },
            { id: 'spotlight-scheduled', label: 'Scheduled', section: 'spotlight-scheduled' },
            { id: 'spotlight-create', label: 'Create Post', section: 'spotlight-create' }
          ]
        },
        { id: 'messages', label: 'Messages', icon: 'envelope', section: 'messages-all' },
        { id: 'users', label: 'Users', icon: 'users', 
          children: [
            { id: 'users-all', label: 'All Users', section: 'users-all' },
            { id: 'users-requests', label: 'Pending Requests', section: 'users-requests', badge: 'pendingRequests' }
          ]
        },
        { id: 'analytics', label: 'Analytics', icon: 'chart-line', section: 'analytics' },
        { id: 'settings', label: 'Settings', icon: 'cog', section: 'settings' }
      ]
    },
    user: {
      title: 'Memorial Dashboard',
      subtitle: 'Manage your memorial and case information',
      defaultSection: 'overview',
      theme: 'user',
      sidebarItems: [
        { id: 'overview', label: 'Overview', icon: 'chart-bar', section: 'overview' },
        { id: 'cases', label: 'My Cases', icon: 'folder', section: 'cases-all' },
        { id: 'spotlight', label: 'Spotlight', icon: 'star', 
          children: [
            { id: 'spotlight-posts', label: 'My Posts', section: 'spotlight-posts' },
            { id: 'spotlight-create', label: 'Create Post', section: 'spotlight-create' }
          ]
        },
        { id: 'messages', label: 'Messages', icon: 'envelope', section: 'messages-all', badge: 'unreadMessages' },
        { id: 'settings', label: 'Account', icon: 'cog', section: 'settings' }
      ]
    },
    police: {
      title: 'Law Enforcement Portal',
      subtitle: 'Case information and tip management',
      defaultSection: 'cases-all',
      theme: 'police',
      sidebarItems: [
        { id: 'cases', label: 'Assigned Cases', icon: 'folder', section: 'cases-all' },
        { id: 'messages', label: 'Tips & Messages', icon: 'envelope', section: 'messages-tips', badge: 'unreadMessages' },
        { id: 'analytics', label: 'Reports', icon: 'chart-line', section: 'analytics' },
        { id: 'settings', label: 'Account', icon: 'cog', section: 'settings' }
      ]
    }
  };
  
  return configs[userRole] || configs.user;
}