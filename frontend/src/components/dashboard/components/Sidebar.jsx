import React, { useState } from 'react';
import { 
  HomeIcon,
  FolderIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  ClockIcon,
  UserPlusIcon,
  FolderOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  BellIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FolderIcon as FolderSolid,
  UsersIcon as UsersSolid,
} from '@heroicons/react/24/solid';
import PoliceCaseSelector from '../sections/Cases/PoliceCaseSelector';

export default function Sidebar({ 
  user, 
  permissions, 
  activeSection, 
  onSectionChange, 
  collapsed, 
  onToggleCollapse,
  data,
  roleConfig,
  onOpenCaseModal,
  selectedCaseId,
  onSelectCase
}) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Calculate notification counts
  const newTips = data?.stats?.newTips || 0;
  const unreadMessages = data?.stats?.unreadMessages || 0;
  const pendingRequests = data?.stats?.pendingRequests || 0;

  // Build navigation items based on permissions
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: HomeIcon,
      solidIcon: HomeSolid,
      show: true
    },
    {
      id: 'cases',
      label: permissions.can('view_all_cases') ? 'Cases' : 'My Cases',
      icon: FolderIcon,
      solidIcon: FolderSolid,
      show: permissions.can('view_all_cases') || permissions.can('view_own_cases'),
      expandable: true,
      subItems: [
        {
          id: 'cases-create',
          label: 'Create Case',
          icon: PlusIcon,
          show: permissions.can('create_cases') && !permissions.isReadOnly(),
          action: onOpenCaseModal
        },
        {
          id: 'cases-all',
          label: 'All Cases',
          icon: FolderOpenIcon,
          show: true
        },
        {
          id: 'cases-active',
          label: 'Active Cases',
          icon: SparklesIcon,
          show: permissions.can('view_all_cases')
        }
      ].filter(item => item.show)
    },
    {
      id: 'spotlight',
      label: 'Spotlight',
      icon: MegaphoneIcon,
      show: true,
      expandable: true,
      subItems: [
        {
          id: 'spotlight-create',
          label: 'Create Post',
          icon: PlusIcon,
          show: !permissions.isReadOnly()
        },
        {
          id: 'spotlight-posts',
          label: 'All Posts',
          show: true
        },
        {
          id: 'spotlight-scheduled',
          label: 'Scheduled',
          icon: ClockIcon,
          show: true
        }
      ].filter(item => item.show)
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: ChatBubbleLeftRightIcon,
      badge: unreadMessages > 0 ? unreadMessages : null,
      alert: unreadMessages > 0,
      show: true,
      expandable: true,
      subItems: [
        {
          id: 'messages-all',
          label: 'All Messages',
          badge: unreadMessages > 0 ? unreadMessages : null,
          show: true
        },
        {
          id: 'messages-tips',
          label: 'Tips',
          icon: ChatBubbleBottomCenterTextIcon,
          badge: newTips > 0 ? newTips : null,
          alert: newTips > 0,
          show: true
        }
      ]
    },
    {
      id: 'users',
      label: 'Users',
      icon: UsersIcon,
      solidIcon: UsersSolid,
      badge: pendingRequests > 0 ? pendingRequests : null,
      alert: pendingRequests > 0,
      show: permissions.can('manage_users'),
      expandable: true,
      subItems: [
        {
          id: 'users-all',
          label: 'All Users',
          show: true
        },
        {
          id: 'users-requests',
          label: 'Account Requests',
          icon: UserPlusIcon,
          badge: pendingRequests > 0 ? pendingRequests : null,
          alert: pendingRequests > 0,
          show: true
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      show: permissions.can('view_analytics')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      show: true
    }
  ].filter(item => item.show);

  // Count total notifications
  const totalNotifications = newTips + unreadMessages + pendingRequests;

  return (
    <aside className={`${
      collapsed ? 'w-16' : 'w-64'
    } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}>
      {/* Logo/Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              CC
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              {roleConfig?.brandText || 'CaseClosure'}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Notification Alert Bar - Only show if there are notifications */}
      {totalNotifications > 0 && !collapsed && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {totalNotifications} new {totalNotifications === 1 ? 'item' : 'items'} to review
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeSection === item.id || activeSection.startsWith(`${item.id}-`)}
            isExpanded={expandedSections[item.id]}
            collapsed={collapsed}
            onToggle={() => toggleSection(item.id)}
            onClick={() => {
              if (item.action) {
                item.action();
              } else if (!item.expandable) {
                onSectionChange(item.id);
              }
            }}
            onSubItemClick={(subId) => onSectionChange(subId)}
            activeSection={activeSection}
          />
        ))}
      </nav>

      {/* Police Case Selector - Only show for police/detectives with case access */}
      {!collapsed && permissions.isPolice && permissions.canViewAllCases && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Cases You Can Access
          </h3>
          <PoliceCaseSelector 
            selectedCaseId={selectedCaseId}
            onSelectCase={onSelectCase}
            permissions={permissions}
          />
        </div>
      )}

      {/* User Profile Section */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {permissions.isAdmin() ? 'Administrator' :
                 permissions.isPolice() ? 'Law Enforcement' : 'User'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function NavItem({ 
  item, 
  isActive, 
  isExpanded, 
  collapsed, 
  onToggle, 
  onClick, 
  onSubItemClick,
  activeSection 
}) {
  // Use solid icon when active, outline otherwise
  const Icon = isActive && item.solidIcon ? item.solidIcon : item.icon;
  
  return (
    <div>
      <button
        onClick={() => {
          if (item.expandable) {
            onToggle();
          } else {
            onClick();
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group relative ${
          isActive 
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon className="w-5 h-5 flex-shrink-0" />
            {/* Alert dot for items with notifications */}
            {item.alert && collapsed && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          {!collapsed && (
            <span className="font-medium">{item.label}</span>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            {/* Only show badge if there's a count */}
            {item.badge && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                item.alert
                  ? 'bg-red-500 text-white animate-pulse'
                  : isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {item.badge}
              </span>
            )}
            {item.expandable && (
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} />
            )}
          </div>
        )}
      </button>

      {/* Sub Items */}
      {!collapsed && item.expandable && isExpanded && item.subItems && (
        <div className="ml-5 mt-1 space-y-1">
          {item.subItems.map(subItem => (
            <button
              key={subItem.id}
              onClick={() => {
                if (subItem.action) {
                  subItem.action();
                } else {
                  onSubItemClick(subItem.id);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                activeSection === subItem.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {subItem.icon && <subItem.icon className="w-4 h-4" />}
                <span>{subItem.label}</span>
              </div>
              {/* Only show badge if there's a count */}
              {subItem.badge && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  subItem.alert
                    ? 'bg-red-500 text-white animate-pulse'
                    : activeSection === subItem.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {subItem.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}