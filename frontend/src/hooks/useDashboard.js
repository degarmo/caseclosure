// File: src/dashboard/hooks/useDashboard.js
// Main dashboard context hook for managing configuration and state

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';
import { useAuth } from '../../hooks/useAuth';

const DashboardContext = createContext({});

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard configuration
  useEffect(() => {
    const loadDashboardConfig = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch config and stats in parallel
        const [configResponse, statsResponse] = await Promise.all([
          dashboardAPI.getConfig(),
          dashboardAPI.getStats()
        ]);

        setConfig(configResponse.data);
        setStats(statsResponse.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardConfig();
  }, [user, refreshKey]);

  // Fetch module-specific data
  const fetchModuleData = async (moduleName, params = {}) => {
    try {
      const response = await dashboardAPI.getModuleData(moduleName, params);
      return response.data;
    } catch (err) {
      console.error(`Error fetching ${moduleName} data:`, err);
      throw err;
    }
  };

  // Refresh dashboard data
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Update local stats (optimistic updates)
  const updateStats = (updates) => {
    setStats(prev => ({
      ...prev,
      ...updates
    }));
  };

  const value = {
    config,
    stats,
    loading,
    error,
    fetchModuleData,
    refreshDashboard,
    updateStats,
    permissions: config?.permissions || {},
    role: config?.role,
    user: config?.user,
    modules: config?.modules || [],
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};