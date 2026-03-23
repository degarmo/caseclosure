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
  onSelectCase
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
    } hidden shrink-0 border-r border-white/10 bg-slate-950/70 transition-all duration-300 md:flex md:flex-col`}>
      <div className="h-20 px-5 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-amber-300 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20">
              CC
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">CaseClosure</p>
              <span className="font-semibold text-white">
              {roleConfig?.brandText || 'CaseClosure'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
        >
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="border-b border-white/10 px-5 py-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace status</p>
                <p className="mt-2 text-lg font-semibold text-white">{userName}</p>
                <p className="text-sm text-slate-400">{roleLabel}</p>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                Online
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Cases</p>
                <p className="mt-1 text-xl font-semibold text-white">{primaryCaseCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Attention</p>
                <p className="mt-1 text-xl font-semibold text-white">{totalNotifications}</p>
              </div>
            </div>
            {totalNotifications > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
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
          />
        ))}
      </nav>

      {/* Police Case Selector - Only show for police/detectives with case access */}
      {!collapsed && permissions.isPolice && permissions.canViewAllCases && (
        <div className="p-5 border-t border-white/10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
        <div className="p-5 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-300 font-medium text-slate-950 shadow-lg shadow-sky-500/20">
              {user?.first_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.first_name || user?.email}
              </p>
              <p className="text-xs text-slate-400">
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
        className={`w-full flex items-center justify-between rounded-2xl px-3 py-3 transition-all group relative ${
          isActive 
            ? 'bg-gradient-to-r from-sky-400/15 via-white/10 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-sky-300/20' 
            : 'text-slate-300 hover:bg-white/8 hover:text-white'
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
            <span className="font-medium tracking-[0.01em]">{item.label}</span>
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
                    ? 'bg-white text-slate-900' 
                    : 'bg-white/10 text-slate-200'
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
                  ? 'bg-white/10 text-white ring-1 ring-white/10'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
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
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-slate-200'
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
