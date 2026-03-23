import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissions } from './hooks/usePermissions';
import { useDashboardData } from './hooks/useDashboardData';
import { getRoleConfig } from './config/roleConfigs';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContentArea from './components/ContentArea';
import { RealtimeProvider } from './providers/RealtimeProvider';

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

  // Clean layout with fixed sidebar and scrollable content
  return (
    <RealtimeProvider refreshInterval={refreshInterval}>
      <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="flex h-full bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_22%),linear-gradient(180deg,_#08111f_0%,_#0f172a_48%,_#e8edf3_48%,_#f4f7fb_100%)]">
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
          />

          <div className="flex-1 overflow-hidden px-3 py-3 md:px-4 md:py-4">
            <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl ring-1 ring-slate-900/5">
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
              />
            </div>
          </div>
        </div>
      </div>
    </RealtimeProvider>
  );
}
