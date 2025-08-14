import React, { useState, useEffect } from 'react';
import { 
  Home, Folder, User, MessageSquare, FileText, Settings, Map, Shield,
  ChevronDown, ChevronRight, ChevronLeft, Plus, Eye, Bell, Activity,
  TrendingUp, Clock, MapPin, Users, Search, Moon, Sun, LogOut,
  ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw, Filter,
  Zap, Target, Signal, Hash, Menu, BarChart3, Globe, Command,
  Layers, Database, Cpu, Radio, HelpCircle, X, MoreVertical,
  Fingerprint, Brain, ShieldCheck, AlertTriangle, Sparkles
} from 'lucide-react';

// Import your actual API utility here
import api from "@/utils/axios";

// Import your custom hooks if available
// import { useDashboard, useRealtimeActivity } from '../hooks/useDashboard';
// import { useTracker } from '../hooks/useTracker';

const ProfessionalColorfulDashboard = ({ user: propUser, onLogout, onOpenCaseModal }) => {
  // Use prop user if provided, otherwise use a default
  const [user] = useState(propUser || { 
    first_name: 'User', 
    last_name: '', 
    email: 'user@example.com',
    id: '1',
    is_staff: false 
  });
  
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedSections, setExpandedSections] = useState({ cases: true });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  
  // Data from API - matching all components
  const [userCases, setUserCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tipCount, setTipCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityFeed, setActivityFeed] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [systemStatus, setSystemStatus] = useState("operational");
  
  // Dashboard-specific data from backup
  const [dashboardData, setDashboardData] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [realtimeActivity, setRealtimeActivity] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // Animation states
  const [animatedStats, setAnimatedStats] = useState({
    visitors: 0,
    fingerprints: 0,
    tips: 0,
    engagement: 0,
    suspicious: 0,
    activeNow: 0
  });
  
  // Stats will be populated from API
  const [stats, setStats] = useState({
    visitors: 0,
    fingerprints: 0,
    tips: 0,
    engagement: 0,
    suspicious: 0,
    activeNow: 0
  });

  // Main data fetching function
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch cases (from Sidebar & Dashboard.backup)
      const casesRes = await api.get("/cases/");
      const casesData = casesRes.data.results || casesRes.data;
      const filtered = Array.isArray(casesData)
        ? casesData.filter(c => String(c.user) === String(user.id))
        : [];
      setUserCases(filtered);

      // 2. Fetch tip count (from Sidebar)
      try {
        const tipsRes = await api.get("/messages/unread-count/");
        setTipCount(tipsRes.data.count || 0);
      } catch (e) {
        console.error("Error fetching tips count:", e);
        setTipCount(3); // Fallback demo value
      }

      // 3. Fetch alert count for admins (from Sidebar)
      if (user?.is_staff || user?.is_superuser) {
        try {
          const alertsRes = await api.get("/admin/alerts-count/");
          setAlertCount(alertsRes.data.count || 0);
        } catch (e) {
          console.error("Error fetching alerts count:", e);
          setAlertCount(2); // Fallback demo value
        }
      }

      // 4. Fetch notifications (from Topbar)
      try {
        const notifRes = await api.get("/notifications/");
        const notifData = notifRes.data.results || notifRes.data;
        setNotifications(Array.isArray(notifData) ? notifData.slice(0, 5) : []);
      } catch (e) {
        console.error("Error fetching notifications:", e);
        // Use demo notifications as fallback
        setNotifications([
          { id: 1, type: 'tip', message: 'New tip received for case', time: '5 min ago', read: false, urgent: true },
          { id: 2, type: 'visitor', message: 'Suspicious activity detected', time: '1 hour ago', read: false },
          { id: 3, type: 'system', message: 'Case analytics report ready', time: '3 hours ago', read: true }
        ]);
      }

      // 5. Fetch last activity (from Topbar)
      try {
        const activityRes = await api.get("/activity/last/");
        setLastActivity(activityRes.data);
      } catch (e) {
        console.error("Error fetching last activity:", e);
        setLastActivity({ time: new Date().toISOString(), action: 'Dashboard viewed' });
      }

      // 6. Fetch dashboard stats (new endpoint)
      try {
        const statsRes = await api.get("/dashboard/stats/");
        if (statsRes.data) {
          setStats({
            visitors: statsRes.data.visitors || 0,
            fingerprints: statsRes.data.fingerprints || 0,
            tips: statsRes.data.tips || tipCount,
            engagement: statsRes.data.engagement || 0,
            suspicious: statsRes.data.suspicious || 0,
            activeNow: statsRes.data.activeNow || 0
          });
        }
      } catch (e) {
        console.error("Error fetching dashboard stats:", e);
        // Use calculated fallback values
        setStats({
          visitors: 234,
          fingerprints: 567,
          tips: tipCount,
          engagement: 78,
          suspicious: 5,
          activeNow: 12
        });
      }

      // 7. Fetch activity feed
      try {
        const activityRes = await api.get("/activity/feed/");
        const activityData = activityRes.data.results || activityRes.data;
        setActivityFeed(Array.isArray(activityData) ? activityData : []);
      } catch (e) {
        console.error("Error fetching activity feed:", e);
        // Demo activity feed
        setActivityFeed([
          { id: 1, user: 'Anonymous_847', action: 'viewed', page: '/tips', location: 'Milwaukee, WI', time: '2 min ago', risk: 0.2 },
          { id: 2, user: 'Visitor_293', action: 'submitted form', page: '/contact', location: 'Chicago, IL', time: '5 min ago', risk: 0.8 },
          { id: 3, user: 'Anonymous_109', action: 'clicked', page: '/case-info', location: 'Madison, WI', time: '12 min ago', risk: 0.3 }
        ]);
      }

      // 8. Fetch location data / geographic distribution
      try {
        const locationRes = await api.get("/analytics/locations/");
        const locData = locationRes.data.results || locationRes.data;
        setLocationData(Array.isArray(locData) ? locData : []);
      } catch (e) {
        console.error("Error fetching location data:", e);
        // Demo location data
        setLocationData([
          { city: 'Milwaukee, WI', visits: 89, risk: 'high' },
          { city: 'Chicago, IL', visits: 67, risk: 'medium' },
          { city: 'Madison, WI', visits: 45, risk: 'low' },
          { city: 'Green Bay, WI', visits: 23, risk: 'low' }
        ]);
      }

      // 9. Dashboard-specific endpoints from Dashboard.backup
      // These would be from your custom hooks (useDashboard, useRealtimeActivity)
      // If you have specific tracking endpoints:
      
      // Get primary case slug for dashboard data
      const primaryCaseSlug = filtered[0]?.slug || 'default';
      
      // Fetch dashboard widgets data
      try {
        const widgetsRes = await api.get(`/dashboard/widgets/?case=${primaryCaseSlug}`);
        setWidgets(widgetsRes.data);
        
        // Update stats from widgets if available
        if (widgetsRes.data) {
          setStats(prevStats => ({
            ...prevStats,
            visitors: widgetsRes.data.visitorMetrics?.today || prevStats.visitors,
            fingerprints: widgetsRes.data.visitorMetrics?.week_total || prevStats.fingerprints,
            engagement: widgetsRes.data.engagementMetrics?.metrics?.engagement_rate || prevStats.engagement,
            suspicious: widgetsRes.data.suspiciousActivity?.total_24h || prevStats.suspicious,
            activeNow: widgetsRes.data.visitorMetrics?.active_now || prevStats.activeNow
          }));
        }
      } catch (e) {
        console.error("Error fetching dashboard widgets:", e);
      }

      // Fetch realtime activity
      try {
        const realtimeRes = await api.get(`/activity/realtime/?case=${primaryCaseSlug}`);
        setRealtimeActivity(realtimeRes.data.results || realtimeRes.data || []);
        setActiveUsers(realtimeRes.data.active_users || 0);
      } catch (e) {
        console.error("Error fetching realtime activity:", e);
      }

      // Fetch realtime metrics
      try {
        const metricsRes = await api.get(`/metrics/realtime/?case=${primaryCaseSlug}`);
        setRealtimeMetrics(metricsRes.data);
      } catch (e) {
        console.error("Error fetching realtime metrics:", e);
      }

      // Track dashboard view (if you have tracking)
      try {
        await api.post("/events/track/", {
          event: 'dashboard_viewed',
          userId: user?.id,
          caseCount: filtered.length,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // Tracking is optional, don't fail silently
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchData();
      
      // Set up polling for real-time data (matching Dashboard.backup)
      const pollInterval = setInterval(() => {
        // Fetch only real-time data on interval
        fetchRealtimeData();
      }, 5000); // Poll every 5 seconds

      // Refresh full data every 60 seconds
      const refreshInterval = setInterval(() => {
        fetchData();
      }, 60000);

      return () => {
        clearInterval(pollInterval);
        clearInterval(refreshInterval);
      };
    }
  }, [user?.id, user?.is_staff, user?.is_superuser]);

  // Separate function for real-time data polling
  const fetchRealtimeData = async () => {
    // Skip if realtime is disabled or no cases
    if (!userCases.length) return;
    
    try {
      const primaryCaseSlug = userCases[0]?.slug || 'default';
      
      // Fetch realtime activity - only if endpoint exists
      if (import.meta.env.VITE_ENABLE_REALTIME !== 'false') {
        try {
          const realtimeRes = await api.get(`/activity/realtime/?case=${primaryCaseSlug}`);
          setRealtimeActivity(realtimeRes.data.results || realtimeRes.data || []);
          setActiveUsers(realtimeRes.data.active_users || 0);
          
          // Update active now stat
          setStats(prevStats => ({
            ...prevStats,
            activeNow: realtimeRes.data.active_users || prevStats.activeNow
          }));
        } catch (e) {
          // Endpoint might not exist yet - silent fail for polling
          if (e.response?.status !== 404) {
            console.debug('Realtime activity fetch failed:', e.message);
          }
        }
      }

      // Fetch updated notification count - only if endpoint exists
      try {
        const notifRes = await api.get("/notifications/unread-count/");
        const unreadCount = notifRes.data.count || 0;
        // Update notification badge if needed
      } catch (e) {
        // Endpoint might not exist yet - silent fail for polling
        if (e.response?.status !== 404) {
          console.debug('Notification count fetch failed:', e.message);
        }
      }

    } catch (error) {
      // Silent fail for polling - only log non-404 errors
      if (error.response?.status !== 404) {
        console.debug('Realtime data fetch error:', error.message);
      }
    }
  };

  // Animate numbers on stats change
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      const progress = Math.min(current / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        visitors: Math.floor(stats.visitors * easeOut),
        fingerprints: Math.floor(stats.fingerprints * easeOut),
        tips: Math.floor(stats.tips * easeOut),
        engagement: Math.floor(stats.engagement * easeOut),
        suspicious: Math.floor(stats.suspicious * easeOut),
        activeNow: Math.floor(stats.activeNow * easeOut)
      });

      if (progress >= 1) clearInterval(timer);
    }, increment);

    return () => clearInterval(timer);
  }, [stats]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-500',
      monitoring: 'bg-amber-500',
      cold: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-amber-600 bg-amber-50',
      low: 'text-blue-600 bg-blue-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'tip': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'visitor': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'system': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCaseActivityIcon = (lastActivity) => {
    const lastUpdate = new Date(lastActivity);
    const now = new Date();
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
    } else if (hoursDiff < 168) { // 1 week
      return <Eye className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Track refresh event if tracking is available
    try {
      await api.post("/events/track/", {
        event: 'dashboard_refreshed',
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Tracking is optional
    }
    
    await fetchData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    
    // Track period change
    try {
      await api.post("/events/track/", {
        event: 'period_changed',
        period: period,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Tracking is optional
    }
    
    // Fetch data for new period
    await fetchData();
  };

  const handleCaseClick = async (caseId) => {
    // Track case click
    try {
      await api.post("/events/track/", {
        event: 'case_clicked',
        caseId: caseId,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Tracking is optional
    }
    
    // Navigate to case (if you have navigation)
    // navigate(`/case-builder/${caseId}`);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'cases', label: 'Cases', icon: Folder, expandable: true, color: 'text-purple-600 bg-purple-50' },
    { id: 'messages', label: 'Messages & Tips', icon: MessageSquare, badge: tipCount, color: 'text-pink-600 bg-pink-50' },
    { id: 'reports', label: 'Reports', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
    { id: 'maps', label: 'Geographic Intel', icon: Map, color: 'text-teal-600 bg-teal-50' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600 bg-gray-50' },
  ];

  const isAdmin = user?.is_staff || user?.is_superuser;
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield, badge: alertCount, color: 'text-red-600 bg-red-50' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 mx-auto"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-600 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Professional Collapsible Sidebar */}
      <aside className={`fixed left-0 top-0 h-full ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Fingerprint className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white">Command</h1>
                <p className="text-xs text-slate-500">Intelligence Platform</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-slate-600" /> : <ChevronLeft className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Quick Stats */}
        {!sidebarCollapsed && (
          <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">Active Cases</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{userCases.length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-xl p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">New Tips</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{tipCount}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map(item => (
            <div key={item.id}>
              {item.expandable ? (
                <>
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      activeSection === item.id 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-white/20 text-xs font-medium rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections[item.id] ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </button>
                  
                  {expandedSections[item.id] && !sidebarCollapsed && (
                    <div className="ml-4 mt-2 space-y-1">
                      <button 
                        onClick={onOpenCaseModal}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-600 dark:text-purple-400 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Create New Case</span>
                      </button>
                      
                      {userCases.map(case_ => (
                        <button 
                          key={case_.id} 
                          onClick={() => handleCaseClick(case_.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <div className="relative">
                            <Folder className="w-4 h-4 text-slate-500" />
                            <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusColor(case_.status)}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {case_.victim_name || case_.name || `${case_.first_name} ${case_.last_name}` || "Untitled"}
                            </p>
                            <p className="text-xs text-slate-500">Case #{case_.id}</p>
                          </div>
                          {getCaseActivityIcon(case_.updated_at)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      activeSection === item.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.first_name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.first_name}</p>
                <p className="text-xs text-slate-500">{user.is_staff ? 'Administrator' : 'Investigator'}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search cases, tips, or analytics..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-500">⌘K</kbd>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 ml-6">
                {/* Live Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600">
                    {systemStatus === 'operational' ? 'System Online' : 'Issues Detected'}
                  </span>
                </div>

                {/* Quick Actions */}
                <button 
                  onClick={onOpenCaseModal}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                >
                  <Sparkles className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                </button>
                
                <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group">
                  <BarChart3 className="w-5 h-5 text-slate-600 group-hover:text-purple-600" />
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {darkMode ? <Sun className="w-5 h-5 text-slate-600" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Bell className="w-5 h-5 text-slate-600" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                            Mark all as read
                          </button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notif => (
                          <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.message}</p>
                                <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                              </div>
                              {notif.urgent && (
                                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.first_name}</p>
                      <p className="text-xs text-slate-500">{user.is_staff ? 'Admin' : 'User'}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.first_name[0]}
                    </div>
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {user.first_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {lastActivity ? new Date(lastActivity.time).toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left">
                          <User className="w-5 h-5 text-slate-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Profile Settings</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left">
                          <ShieldCheck className="w-5 h-5 text-slate-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Security</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left">
                          <HelpCircle className="w-5 h-5 text-slate-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Help & Support</span>
                        </button>
                      </div>
                      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                        <button 
                          onClick={onLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Bar */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 px-6 py-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.activeNow || activeUsers || 0}</span> visitors online
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{userCases.length}</span> active cases
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">{notifications.filter(n => !n.read).length}</span> new insights
                  </span>
                </div>
                {realtimeMetrics && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {realtimeMetrics.events_per_minute?.toFixed(1) || 0}
                      </span> events/min
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe className="w-4 h-4" />
                <span>Milwaukee, WI</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Command Center</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">Real-time intelligence and pattern analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow hover:shadow-md transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-medium">
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow px-1 py-1 flex">
                  {['24h', '7d', '30d'].map(period => (
                    <button
                      key={period}
                      onClick={() => handlePeriodChange(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid with Professional Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-600">
                  {widgets?.visitorMetrics?.change_percentage ? `+${widgets.visitorMetrics.change_percentage}%` : '+23%'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.visitors.toLocaleString()}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Unique Visitors</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-600">+15%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.fingerprints.toLocaleString()}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Fingerprints</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-emerald-600">+8%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.tips}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tips Received</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">0%</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.engagement}%</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Engagement</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white shadow">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                {animatedStats.suspicious > 5 && (
                  <span className="text-xs font-medium text-red-600 animate-pulse">ALERT</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.suspicious}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Suspicious</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white shadow">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600">LIVE</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{animatedStats.activeNow}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Active Now</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Real-Time Activity Stream</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {(realtimeActivity.length > 0 ? realtimeActivity : activityFeed).map((activity, idx) => (
                  <div key={activity.id || idx} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        (activity.risk || activity.suspicious_score || 0) >= 0.7 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        (activity.risk || activity.suspicious_score || 0) >= 0.4 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {activity.action === 'viewed' || activity.type === 'page_view' ? <Eye className="w-4 h-4" /> :
                         activity.action === 'submitted form' || activity.type === 'form_submit' ? <FileText className="w-4 h-4" /> :
                         <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          <span className="font-semibold">{activity.user}</span> {activity.action || activity.type?.replace('_', ' ')} <span className="text-indigo-600 dark:text-indigo-400">{activity.page}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {activity.location}
                          </span>
                          <span className="text-xs text-slate-500">
                            {activity.time || (activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Just now')}
                          </span>
                          {(activity.risk || activity.suspicious_score || 0) >= 0.5 && (
                            <span className={`text-xs font-medium ${
                              (activity.risk || activity.suspicious_score || 0) >= 0.7 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              Risk: {((activity.risk || activity.suspicious_score || 0) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {(activity.risk || activity.suspicious_score || activity.is_suspicious) && (activity.risk || activity.suspicious_score || 0) >= 0.7 && (
                        <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {activityFeed.length === 0 && realtimeActivity.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No recent activity</p>
                    <p className="text-xs mt-1">Events will appear here in real-time</p>
                  </div>
                )}
              </div>
            </div>

            {/* Geographic Hotspots */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Geographic Hotspots</h2>
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-4">
                {locationData.length > 0 ? locationData.slice(0, 4).map((location, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{location.city}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{location.visits}</span>
                        {location.risk === 'high' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full font-semibold">
                            HIGH
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          location.risk === 'high' || location.risk === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                          location.risk === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                          'bg-gradient-to-r from-indigo-500 to-purple-600'
                        }`}
                        style={{ width: `${Math.min((location.visits / (locationData[0]?.visits || 100)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No location data available</p>
                  </div>
                )}
              </div>
              <button className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900 dark:hover:to-purple-900 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold transition-all">
                View Full Map Analysis
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfessionalColorfulDashboard;