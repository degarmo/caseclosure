import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissions } from './hooks/usePermissions';
import { useDashboardData } from './hooks/useDashboardData';
import { getRoleConfig } from './config/roleConfigs';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContentArea from './components/ContentArea';
import { RealtimeProvider } from './providers/RealtimeProvider';
import { DASHBOARD_THEMES, DEFAULT_DASHBOARD_THEME, getDashboardTheme } from './config/themes';

const SECTION_META = {
  overview: {
    eyebrow: 'Command center',
    title: 'Operational overview',
    description: 'A live snapshot of cases, communications, and workload across the platform.'
  },
  'cases-all': {
    eyebrow: 'Casework',
    title: 'All cases',
    description: 'Review open and historical cases without leaving the dashboard.'
  },
  'cases-active': {
    eyebrow: 'Casework',
    title: 'Active cases',
    description: 'Focus on currently active investigations and memorial activity.'
  },
  'police-case-detail': {
    eyebrow: 'Assigned case',
    title: 'Case intelligence',
    description: 'Monitor the selected case, related signals, and incoming activity.'
  },
  'spotlight-posts': {
    eyebrow: 'Publishing',
    title: 'Spotlight posts',
    description: 'Manage public-facing updates and supporting communications.'
  },
  'spotlight-scheduled': {
    eyebrow: 'Publishing',
    title: 'Scheduled spotlight',
    description: 'Review queued posts and confirm upcoming release timing.'
  },
  'messages-all': {
    eyebrow: 'Inbox',
    title: 'All messages',
    description: 'Triage inbound communication, responses, and follow-up items.'
  },
  'messages-tips': {
    eyebrow: 'Inbox',
    title: 'Tips queue',
    description: 'Prioritize actionable tips and route them into case review.'
  },
  'users-all': {
    eyebrow: 'Administration',
    title: 'User directory',
    description: 'Manage account access, roles, and platform participation.'
  },
  'users-requests': {
    eyebrow: 'Administration',
    title: 'Pending requests',
    description: 'Approve or reject incoming account requests with full context.'
  },
  'user-details': {
    eyebrow: 'Administration',
    title: 'User profile',
    description: 'Inspect account details, permissions, and recent activity.'
  },
  analytics: {
    eyebrow: 'Reporting',
    title: 'Analytics',
    description: 'Track traffic, engagement, and suspicious activity trends.'
  },
  settings: {
    eyebrow: 'Preferences',
    title: 'Settings',
    description: 'Control account, site, and access configuration.'
  }
};

export default function Dashboard({ user, onLogout, onOpenCaseModal, onOpenProfileSettings }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [selectedCaseId, setSelectedCaseId] = useState(null); // NEW: Track selected case for police
  const [themeId, setThemeId] = useState(() => localStorage.getItem('dashboard_theme') || DEFAULT_DASHBOARD_THEME);
  
  // Get permissions and role configuration
  const permissions = usePermissions(user);
  const roleConfig = useMemo(() => getRoleConfig(permissions.getRole()), [user]);
  
  // Fetch dashboard data with auto-refresh
  const { 
    data, 
    loading, 
    error, 
    refresh,
    subscribe,
    unsubscribe
  } = useDashboardData(user, permissions, {
    autoRefresh: true,
    refreshInterval
  });

  // Handle section change
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    // Store in localStorage for persistence
    localStorage.setItem('dashboard_active_section', sectionId);
  }, []);

  // Handle case selection for police users
  const handleSelectCase = useCallback((caseId) => {
    setSelectedCaseId(caseId);
    // Optionally auto-navigate to case detail view
    setActiveSection('police-case-detail');
  }, []);

  // Restore last active section
  useEffect(() => {
    const savedSection = localStorage.getItem('dashboard_active_section');
    if (savedSection && permissions.canAccess(savedSection)) {
      setActiveSection(savedSection);
    }
  }, [permissions]);

  const sectionMeta = SECTION_META[activeSection] || {
    eyebrow: roleConfig?.brandText || 'Workspace',
    title: roleConfig?.title || 'Dashboard',
    description: roleConfig?.subtitle || 'Manage activity and operations from a single workspace.'
  };
  const theme = useMemo(() => getDashboardTheme(themeId), [themeId]);

  const handleThemeChange = useCallback((nextThemeId) => {
    setThemeId(nextThemeId);
    localStorage.setItem('dashboard_theme', nextThemeId);
  }, []);

  // Clean layout with fixed sidebar and scrollable content
  return (
    <RealtimeProvider refreshInterval={refreshInterval}>
      <div className="h-screen overflow-hidden text-slate-100" style={{ background: theme.pageBackground }}>
        <div className="flex h-full" style={{ backgroundImage: theme.pageOverlay }}>
          <Sidebar
            user={user}
            permissions={permissions}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            data={data}
            roleConfig={roleConfig}
            onOpenCaseModal={onOpenCaseModal}
            selectedCaseId={selectedCaseId}
            onSelectCase={handleSelectCase}
            theme={theme}
          />

          <div className="flex-1 overflow-hidden px-3 py-3 md:px-4 md:py-4">
            <div
              className="flex h-full flex-col overflow-visible rounded-[28px] backdrop-blur-xl ring-1 ring-slate-900/5"
              style={{
                background: theme.shellBackground,
                border: `1px solid ${theme.shellBorder}`,
                boxShadow: theme.panelShadow,
              }}
            >
              <Header
                user={user}
                onLogout={onLogout}
                onRefresh={refresh}
                roleConfig={roleConfig}
                activeSection={activeSection}
                notifications={data.notifications}
                sectionMeta={sectionMeta}
                lastUpdated={data.lastUpdated}
                onSectionChange={handleSectionChange}
                onProfileSettings={onOpenProfileSettings}
                onThemeChange={handleThemeChange}
                theme={theme}
                themeId={themeId}
                themeOptions={DASHBOARD_THEMES}
              />

              <ContentArea
                activeSection={activeSection}
                permissions={permissions}
                data={data}
                loading={loading}
                error={error}
                onRefresh={refresh}
                user={user}
                onOpenCaseModal={onOpenCaseModal}
                onSectionChange={handleSectionChange}
                selectedCaseId={selectedCaseId}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}
