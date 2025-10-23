import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePermissions } from './hooks/usePermissions';
import { useDashboardData } from './hooks/useDashboardData';
import { getRoleConfig } from './config/roleConfigs';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ContentArea from './components/ContentArea';
import { RealtimeProvider } from './providers/RealtimeProvider';
import { HomeIcon, FolderIcon, UsersIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid } from '@heroicons/react/24/solid';

export default function Dashboard({ user, onLogout, onOpenCaseModal }) {
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

  // Clean layout with fixed sidebar and scrollable content
  return (
    <RealtimeProvider refreshInterval={refreshInterval}>
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Sidebar - Fixed left panel */}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Fixed top */}
          <Header
            user={user}
            onLogout={onLogout}
            onRefresh={refresh}
            roleConfig={roleConfig}
            activeSection={activeSection}
            onSettingsClick={() => handleSectionChange('settings')}
            notifications={data.notifications}
          />

          {/* Content Area - Scrollable */}
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
    </RealtimeProvider>
  );
}