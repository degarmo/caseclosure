import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/axios';

export function useDashboardData(user, permissions, options = {}) {
  const {
    refreshInterval = 30000, // 30 seconds default
    enableRealtime = true
  } = options;

  const [data, setData] = useState({
    cases: [],
    users: [],
    messages: [],
    spotlightPosts: [],
    pendingRequests: [],
    stats: {},
    notifications: [],
    userCase: null,
    lastUpdated: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const previousStats = useRef({});

  // Check for new items
  const checkForNewItems = (newStats, oldStats) => {
    const changes = {
      newMessages: (newStats.unreadMessages || 0) > (oldStats.unreadMessages || 0),
      newTips: (newStats.newTips || 0) > (oldStats.newTips || 0),
      newRequests: (newStats.pendingRequests || 0) > (oldStats.pendingRequests || 0)
    };
    
    return changes;
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const results = {
        cases: [],
        users: [],
        messages: [],
        spotlightPosts: [],
        pendingRequests: [],
        stats: {},
        notifications: [],
        userCase: null
      };
      
      const promises = [];
      
      // Fetch cases
      if (permissions.can('view_all_cases')) {
        promises.push(
          api.get('/cases/')
            .then(res => {
              results.cases = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            })
            .catch(err => {
              console.error('Error fetching cases:', err);
              results.cases = [];
            })
        );
      } else if (permissions.can('view_own_cases')) {
        promises.push(
          api.get('/cases/my_cases/')
            .then(res => {
              results.cases = res.data || [];
              results.userCase = res.data?.[0] || null;
            })
            .catch(err => {
              console.error('Error fetching user cases:', err);
              results.cases = [];
            })
        );
      }

      // Fetch messages
      if (permissions.can('view_all_messages')) {
        promises.push(
          api.get('/contact/messages')
            .then(res => {
              results.messages = res.data?.data || res.data || [];
            })
            .catch(err => {
              console.error('Error fetching messages:', err);
              results.messages = [];
            })
        );
      }

      // Fetch account requests
      if (permissions.can('approve_users')) {
        promises.push(
          api.get('/auth/admin/account-requests/?status=pending')
            .then(res => {
              results.pendingRequests = res.data || [];
            })
            .catch(err => {
              console.error('Error fetching account requests:', err);
              results.pendingRequests = [];
            })
        );
      }

      // Fetch users
      if (permissions.can('manage_users')) {
        promises.push(
          api.get('/auth/admin/users/')
            .then(res => {
              results.users = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            })
            .catch(err => {
              console.error('Error fetching users:', err);
              results.users = [];
            })
        );
      }

      // Fetch spotlight posts - filter by current user if not admin or LEO
      const spotlightParams = {};
      
      // DEBUG: Log user and permissions info
      console.log('Dashboard spotlight fetch - User:', user?.username, 'account_type:', user?.account_type);
      console.log('Dashboard spotlight fetch - isAdmin:', permissions.isAdmin());
      console.log('Dashboard spotlight fetch - Role:', permissions.getRole?.());
      
      // Check if user should see all posts (admin or LEO)
      const userRole = permissions.getRole ? permissions.getRole() : null;
      const isLEOorAdmin = permissions.isAdmin() || 
                          userRole === 'leo' || 
                          userRole === 'police' || 
                          userRole === 'detective' ||
                          user?.account_type === 'leo';
      
      console.log('Dashboard spotlight fetch - isLEOorAdmin:', isLEOorAdmin);
      
      if (user && !isLEOorAdmin) {
        // Regular users only see their own posts
        spotlightParams.author = user.username;
        console.log('Dashboard spotlight fetch - Adding author filter:', user.username);
      } else {
        console.log('Dashboard spotlight fetch - NO author filter (admin or LEO)');
      }
      
      promises.push(
        api.get('/spotlight/', { params: spotlightParams })
          .then(res => {
            results.spotlightPosts = res.data || [];
          })
          .catch(err => {
            console.error('Error fetching spotlight posts:', err);
            results.spotlightPosts = [];
          })
      );
      
      // Wait for all fetches to complete
      await Promise.all(promises);
      
      // Calculate stats
      const newStats = {
        totalCases: results.cases?.length || 0,
        activeCases: results.cases?.filter(c => !c.is_disabled)?.length || 0,
        totalUsers: results.users?.length || 0,
        pendingRequests: results.pendingRequests?.length || 0,
        totalMessages: results.messages?.length || 0,
        unreadMessages: results.messages?.filter(m => !m.read)?.length || 0,
        newTips: results.messages?.filter(m => m.type === 'tip' && !m.read)?.length || 0,
        totalSpotlightPosts: results.spotlightPosts?.filter(p => p.status !== 'scheduled')?.length || 0,
        scheduledPosts: results.spotlightPosts?.filter(p => p.status === 'scheduled')?.length || 0
      };
      
      // Check for new items on silent refresh
      if (silent && previousStats.current) {
        checkForNewItems(newStats, previousStats.current);
      }
      
      results.stats = newStats;
      previousStats.current = newStats;
      
      // Build notifications for admin
      results.notifications = [];
      if (permissions.isAdmin()) {
        if (newStats.unreadMessages > 0) {
          results.notifications.push({
            id: 'new-messages',
            type: 'message',
            message: `${newStats.unreadMessages} new message${newStats.unreadMessages > 1 ? 's' : ''}`,
            time: new Date().toLocaleTimeString(),
            read: false,
            action: 'messages-all'
          });
        }

        if (newStats.newTips > 0) {
          results.notifications.push({
            id: 'new-tips',
            type: 'tip',
            message: `${newStats.newTips} new tip${newStats.newTips > 1 ? 's' : ''} received`,
            time: new Date().toLocaleTimeString(),
            read: false,
            priority: 'high',
            action: 'messages-tips'
          });
        }

        if (newStats.pendingRequests > 0) {
          results.notifications.push({
            id: 'pending-requests',
            type: 'user',
            message: `${newStats.pendingRequests} account request${newStats.pendingRequests > 1 ? 's' : ''} pending`,
            time: new Date().toLocaleTimeString(),
            read: false,
            priority: 'medium',
            action: 'users-requests'
          });
        }
      }
      
      results.lastUpdated = new Date();
      setData(results);
      setError(null);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id, user?.username, permissions.getRole()]); // Include username in deps

  // Initial load - run once
  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      fetchData();
    }
    
    return () => {
      mounted = false;
    };
  }, []); // Empty deps for initial load only

  // Set up auto-refresh with proper cleanup
  useEffect(() => {
    // Only set interval for admins with realtime enabled
    if (!enableRealtime || !permissions.isAdmin() || refreshInterval <= 0) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up new interval for silent refresh
    intervalRef.current = setInterval(() => {
      fetchData(true); // Silent refresh
    }, refreshInterval);
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enableRealtime, permissions.isAdmin(), refreshInterval, fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated: data.lastUpdated
  };
}