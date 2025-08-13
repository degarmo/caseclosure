/**
 * Dashboard Hook
 * Location: frontend/src/hooks/useDashboard.js
 * 
 * Custom React hook for managing dashboard data and real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/dashboard/dashboardService';

/**
 * Main dashboard hook for fetching and managing dashboard data
 */
export const useDashboard = (caseSlug, options = {}) => {
  const {
    enableRealtime = true,
    pollingInterval = 5000,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  // State
  const [dashboardData, setDashboardData] = useState(null);
  const [widgets, setWidgets] = useState({
    visitorMetrics: null,
    suspiciousActivity: null,
    geographicMap: null,
    activityTimeline: null,
    engagementMetrics: null,
    alerts: null,
  });
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs for cleanup
  const isMounted = useRef(true);
  const refreshTimerRef = useRef(null);

  /**
   * Fetch complete dashboard data
   */
  const fetchDashboard = useCallback(async (forceRefresh = false) => {
    if (!caseSlug) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.fetchDashboard(caseSlug, forceRefresh);
      
      if (isMounted.current) {
        setDashboardData(data);
        setLastUpdated(new Date());
        
        // Update widgets if included in response
        if (data.widgets) {
          setWidgets(data.widgets);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        console.error('Dashboard fetch error:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [caseSlug]);

  /**
   * Fetch individual widget data
   */
  const fetchWidget = useCallback(async (widgetName) => {
    if (!caseSlug) return;

    try {
      let data;
      
      switch (widgetName) {
        case 'visitorMetrics':
          data = await dashboardService.fetchVisitorMetrics(caseSlug);
          break;
        case 'suspiciousActivity':
          data = await dashboardService.fetchSuspiciousActivity(caseSlug);
          break;
        case 'geographicMap':
          data = await dashboardService.fetchGeographicMap(caseSlug);
          break;
        case 'activityTimeline':
          data = await dashboardService.fetchActivityTimeline(caseSlug);
          break;
        case 'engagementMetrics':
          data = await dashboardService.fetchEngagementMetrics(caseSlug);
          break;
        case 'alerts':
          data = await dashboardService.fetchAlerts(caseSlug);
          break;
        default:
          throw new Error(`Unknown widget: ${widgetName}`);
      }
      
      if (isMounted.current) {
        setWidgets(prev => ({
          ...prev,
          [widgetName]: data
        }));
      }
      
      return data;
    } catch (err) {
      console.error(`Error fetching ${widgetName}:`, err);
      throw err;
    }
  }, [caseSlug]);

  /**
   * Fetch all widgets in parallel
   */
  const fetchAllWidgets = useCallback(async () => {
    if (!caseSlug) return;

    try {
      const allWidgets = await dashboardService.fetchAllWidgets(caseSlug);
      
      if (isMounted.current) {
        setWidgets(allWidgets);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching widgets:', err);
      setError(err.message);
    }
  }, [caseSlug]);

  /**
   * Handle real-time metrics updates
   */
  const handleRealtimeUpdate = useCallback((metrics) => {
    if (isMounted.current) {
      setRealtimeMetrics(metrics);
      
      // Update relevant widgets with real-time data
      if (metrics.active_users !== undefined) {
        setWidgets(prev => ({
          ...prev,
          visitorMetrics: prev.visitorMetrics ? {
            ...prev.visitorMetrics,
            active_now: metrics.active_users
          } : prev.visitorMetrics
        }));
      }
    }
  }, []);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  /**
   * Initialize dashboard
   */
  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchDashboard();
    
    // Set up auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchDashboard(false);
      }, refreshInterval);
    }
    
    // Cleanup
    return () => {
      isMounted.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [caseSlug, fetchDashboard, autoRefresh, refreshInterval]);

  /**
   * Set up real-time polling
   */
  useEffect(() => {
    if (!caseSlug || !enableRealtime) return;

    // Start polling for real-time updates
    dashboardService.startRealtimePolling(
      caseSlug,
      handleRealtimeUpdate,
      pollingInterval
    );

    // Cleanup
    return () => {
      dashboardService.stopRealtimePolling(caseSlug);
    };
  }, [caseSlug, enableRealtime, pollingInterval, handleRealtimeUpdate]);

  return {
    // Data
    dashboardData,
    widgets,
    realtimeMetrics,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh,
    fetchWidget,
    fetchAllWidgets,
  };
};

/**
 * Hook for individual widget data
 */
export const useWidget = (caseSlug, widgetName, options = {}) => {
  const { autoFetch = true, refreshInterval = 30000 } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async () => {
    if (!caseSlug || !widgetName) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let result;
      switch (widgetName) {
        case 'visitorMetrics':
          result = await dashboardService.fetchVisitorMetrics(caseSlug);
          break;
        case 'suspiciousActivity':
          result = await dashboardService.fetchSuspiciousActivity(caseSlug);
          break;
        case 'geographicMap':
          result = await dashboardService.fetchGeographicMap(caseSlug);
          break;
        case 'activityTimeline':
          result = await dashboardService.fetchActivityTimeline(caseSlug);
          break;
        case 'engagementMetrics':
          result = await dashboardService.fetchEngagementMetrics(caseSlug);
          break;
        case 'alerts':
          result = await dashboardService.fetchAlerts(caseSlug);
          break;
        default:
          throw new Error(`Unknown widget: ${widgetName}`);
      }
      
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${widgetName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [caseSlug, widgetName]);
  
  useEffect(() => {
    if (autoFetch) {
      fetchData();
      
      // Set up refresh interval if specified
      if (refreshInterval > 0) {
        const interval = setInterval(fetchData, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [autoFetch, fetchData, refreshInterval]);
  
  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
};

/**
 * Hook for real-time activity stream
 */
export const useRealtimeActivity = (caseSlug, options = {}) => {
  const { pollingInterval = 3000 } = options;
  
  const [activity, setActivity] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!caseSlug) return;
    
    let isMounted = true;
    let intervalId;
    
    const fetchActivity = async () => {
      try {
        const data = await dashboardService.fetchRealtimeActivity(caseSlug);
        
        if (isMounted) {
          setActivity(data.stream || []);
          setActiveUsers(data.active_users || 0);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchActivity();
    
    // Set up polling
    intervalId = setInterval(fetchActivity, pollingInterval);
    
    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [caseSlug, pollingInterval]);
  
  return {
    activity,
    activeUsers,
    loading,
    error,
  };
};