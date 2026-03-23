import React, { useState, useEffect } from 'react';
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
  onSelectCase,
  theme
}) {
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const rootSection = activeSection.split('-')[0];
    setExpandedSections((prev) => (
      prev[rootSection] ? prev : { ...prev, [rootSection]: true }
    ));
  }, [activeSection]);

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
          show: permissions.can('create_cases') && 
                !permissions.isReadOnly() && 
                user?.account_type !== 'leo',  // Hide for LEO users
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
          show: !permissions.isReadOnly() && user?.account_type !== 'leo'  // Hide for LEO users
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
      show: permissions.can('view_analytics') || permissions.can('view_own_analytics')
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
  const primaryCaseCount = data?.cases?.length || 0;
  const userName = user?.first_name || user?.email?.split('@')[0] || 'User';
  const roleLabel = permissions.isAdmin() ? 'Administrator' :
    permissions.isPolice() ? 'Law Enforcement' : 'Family Workspace';

  return (
    <aside className={`${
      collapsed ? 'w-20' : 'w-[296px]'
    } hidden shrink-0 transition-all duration-300 md:flex md:flex-col`} style={{ background: theme.sidebarBackground, borderRight: `1px solid ${theme.sidebarBorder}` }}>
      <div className="h-20 px-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-amber-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20">
              CC
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: theme.sidebarMuted }}>CaseClosure</p>
              <span className="font-semibold text-white">
              {roleConfig?.brandText || 'CaseClosure'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="rounded-xl p-2 text-slate-300 transition"
          style={{ background: theme.sidebarPanelBackground, border: `1px solid ${theme.sidebarBorder}` }}
        >
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div
            className="rounded-3xl p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            style={{ background: theme.sidebarPanelBackground, border: `1px solid ${theme.sidebarBorder}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em]" style={{ color: theme.sidebarMuted }}>Workspace status</p>
                <p className="mt-2 text-lg font-semibold text-white">{userName}</p>
                <p className="text-sm" style={{ color: theme.sidebarMuted }}>{roleLabel}</p>
              </div>
              <div className="rounded-2xl px-2.5 py-1 text-xs font-medium" style={{ background: theme.accentSoft, color: theme.accentText }}>
                Online
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3" style={{ background: theme.sidebarSubtleBackground }}>
                <p className="text-xs" style={{ color: theme.sidebarMuted }}>Cases</p>
                <p className="mt-1 text-xl font-semibold text-white">{primaryCaseCount}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: theme.sidebarSubtleBackground }}>
                <p className="text-xs" style={{ color: theme.sidebarMuted }}>Attention</p>
                <p className="mt-1 text-xl font-semibold text-white">{totalNotifications}</p>
              </div>
            </div>
            {totalNotifications > 0 && (
              <div
                className="mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm"
                style={{ background: theme.accentSoft, color: theme.accentText, border: `1px solid ${theme.accentBorder}` }}
              >
                <BellIcon className="h-4 w-4 shrink-0" />
                <span>{totalNotifications} item{totalNotifications === 1 ? '' : 's'} waiting for review</span>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
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
            theme={theme}
          />
        ))}
      </nav>

      {/* Police Case Selector - Only show for police/detectives with case access */}
      {!collapsed && permissions.isPolice && permissions.canViewAllCases && (
        <div className="p-5" style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.sidebarMuted }}>
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
        <div className="p-5" style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <div className="flex items-center gap-3 rounded-3xl p-3" style={{ background: theme.sidebarPanelBackground, border: `1px solid ${theme.sidebarBorder}` }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 font-medium text-slate-950 shadow-lg shadow-sky-500/20">
              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.first_name || user?.email}
              </p>
              <p className="text-xs" style={{ color: theme.sidebarMuted }}>
                {roleLabel}
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
  activeSection,
  theme
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
        className={`w-full flex items-center justify-between rounded-2xl px-3 py-3 transition-all group relative ${
          isActive 
            ? 'text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-slate-300 hover:bg-white/8 hover:text-white'
        }`}
        style={isActive ? { background: theme.sidebarPanelBackground, border: `1px solid ${theme.accentBorder}` } : undefined}
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
            <span className="font-medium tracking-[0.01em]">{item.label}</span>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            {/* Only show badge if there's a count */}
            {item.badge && (
              <span className={`text-xs rounded-full font-medium ${
                item.alert
                  ? 'bg-red-500 text-white animate-pulse'
                  : ''
              }`}>
                {item.alert ? item.badge : (
                  <span
                    className="inline-block rounded-full px-2 py-0.5"
                    style={{ background: isActive ? theme.accent : theme.sidebarPanelBackground, color: isActive ? theme.accentStrongText : theme.sidebarText }}
                  >
                    {item.badge}
                  </span>
                )}
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
        <div className="ml-5 mt-2 space-y-1.5 border-l border-white/10 pl-4">
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
              className={`w-full flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-colors ${
                activeSection === subItem.id
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
              style={activeSection === subItem.id ? { background: theme.sidebarPanelBackground, border: `1px solid ${theme.accentBorder}` } : undefined}
            >
              <div className="flex items-center gap-3">
                {subItem.icon && <subItem.icon className="w-4 h-4" />}
                <span>{subItem.label}</span>
              </div>
              {/* Only show badge if there's a count */}
              {subItem.badge && (
                <span className={`text-xs rounded-full font-medium ${
                  subItem.alert
                    ? 'bg-red-500 text-white animate-pulse'
                    : ''
                }`}>
                  {subItem.alert ? subItem.badge : (
                    <span
                      className="inline-block rounded-full px-2 py-0.5"
                      style={{ background: activeSection === subItem.id ? theme.accent : theme.sidebarPanelBackground, color: activeSection === subItem.id ? theme.accentStrongText : theme.sidebarText }}
                    >
                      {subItem.badge}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
