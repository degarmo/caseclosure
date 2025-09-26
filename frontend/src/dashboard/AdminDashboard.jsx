// src/pages/dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import StatsGrid from './components/StatsGrid';
import ActivityFeed from './components/ActivityFeed';
import CasesList from './components/CasesList';
import UsersList from './components/UsersList';
import UserDetails from './components/UserDetails';
import AccountRequests from './components/AccountRequests';
import SiteSettings from './components/SiteSettings';
import SpotlightEditor from '@/components/spotlight/SpotlightEditor';
import SpotlightPostsList from '@/components/spotlight/SpotlightPostsList';
import api from '@/utils/axios';
import { 
  Plus, Shield, Users, FileText, UserPlus, Settings, 
  Activity, RefreshCw, Filter, BarChart3, Database,
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Folder, UserCheck, AlertCircle, Eye, Archive, 
  ExternalLink, List, Send, Megaphone
} from 'lucide-react';

export default function AdminDashboard({ user, onLogout, onOpenCaseModal }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    totalUsers: 0,
    pendingRequests: 0,
    totalTips: 0,
    suspiciousActivity: 0,
    totalSpotlightPosts: 0,
    scheduledPosts: 0
  });
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSpotlightEditor, setShowSpotlightEditor] = useState(false);
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [delayedPosts, setDelayedPosts] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCases(),
        fetchUsers(),
        fetchAccountRequests(),
        fetchActivityFeed(),
        fetchStats(),
        fetchSpotlightData()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases/');
      setCases(response.data);
      setStats(prev => ({
        ...prev,
        totalCases: response.data.length,
        activeCases: response.data.filter(c => !c.is_disabled && c.status === 'active').length
      }));
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/admin/users/');
      const userData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setUsers(userData);
      setStats(prev => ({
        ...prev,
        totalUsers: userData.length
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAccountRequests = async () => {
    try {
      const response = await api.get('/auth/admin/account-requests/?status=pending');
      setPendingRequests(response.data);
      setStats(prev => ({
        ...prev,
        pendingRequests: response.data.length
      }));
    } catch (error) {
      console.error('Error fetching account requests:', error);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const response = await api.get('/activity/feed/');
      const activities = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setActivityFeed(activities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      setActivityFeed([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      setStats(prev => ({
        ...prev,
        totalTips: response.data.tips || 0,
        suspiciousActivity: response.data.suspicious || 0
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSpotlightData = async () => {
    try {
      // Fixed: removed extra /api/
      const response = await api.get('/spotlight/');
      const allPosts = response.data || [];
      
      const now = new Date();
      const published = allPosts.filter(post => 
        post.status === 'published' || post.status === 'draft'
      );
      const delayed = allPosts.filter(post => 
        post.status === 'scheduled' && new Date(post.scheduled_for) > now
      );
      
      setSpotlightPosts(published);
      setDelayedPosts(delayed);
      
      setStats(prev => ({
        ...prev,
        totalSpotlightPosts: published.length,
        scheduledPosts: delayed.length
      }));
    } catch (error) {
      console.error('Error fetching spotlight stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateCase = () => {
    if (onOpenCaseModal) {
      onOpenCaseModal();
    } else {
      console.error('onOpenCaseModal not provided to AdminDashboard');
    }
  };

  const handleCreateSpotlightPost = async (formData) => {
    try {
      // Fixed: removed extra /api/
      const response = await api.post('/spotlight/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchSpotlightData();
      setShowSpotlightEditor(false);
    } catch (error) {
      console.error('Error creating spotlight post:', error);
    }
  };

  const handleViewUser = (userId) => {
    setSelectedUser(userId);
    setActiveSection('user-details');
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
      onClick: () => setActiveSection('overview')
    },
    {
      id: 'cases',
      label: 'Cases',
      icon: Folder,
      expandable: true,
      badge: stats.totalCases,
      subItems: [
        {
          id: 'cases-create',
          label: 'Create Case',
          icon: Plus,
          onClick: handleCreateCase
        },
        {
          id: 'cases-all',
          label: 'All Cases',
          badge: stats.totalCases,
          onClick: () => setActiveSection('cases-all')
        },
        {
          id: 'cases-active',
          label: 'Active Cases',
          badge: stats.activeCases,
          onClick: () => setActiveSection('cases-active')
        },
        {
          id: 'cases-disabled',
          label: 'Disabled Cases',
          onClick: () => setActiveSection('cases-disabled')
        }
      ]
    },
    {
      id: 'spotlight',
      label: 'Spotlight',
      icon: Megaphone,
      expandable: true,
      badge: stats.totalSpotlightPosts + stats.scheduledPosts,
      subItems: [
        {
          id: 'spotlight-create',
          label: 'Create Post',
          icon: Plus,
          onClick: () => setShowSpotlightEditor(true)
        },
        {
          id: 'spotlight-posts',
          label: 'Posts',
          icon: List,
          badge: stats.totalSpotlightPosts,
          onClick: () => setActiveSection('spotlight-posts')
        },
        {
          id: 'spotlight-delayed',
          label: 'Delayed Posts',
          icon: Clock,
          badge: stats.scheduledPosts,
          onClick: () => setActiveSection('spotlight-delayed')
        }
      ]
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      expandable: true,
      badge: stats.totalUsers,
      subItems: [
        {
          id: 'users-all',
          label: 'All Users',
          badge: stats.totalUsers,
          onClick: () => setActiveSection('users-all')
        },
        {
          id: 'users-requests',
          label: 'Account Requests',
          icon: UserPlus,
          badge: stats.pendingRequests,
          onClick: () => setActiveSection('users-requests')
        },
        {
          id: 'users-admins',
          label: 'Administrators',
          onClick: () => setActiveSection('users-admins')
        }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => window.location.href = '/admin/analytics'
    },
    {
      id: 'system',
      label: 'System',
      icon: Database,
      expandable: true,
      subItems: [
        {
          id: 'system-settings',
          label: 'Site Settings',
          icon: Settings,
          onClick: () => setActiveSection('system-settings')
        },
        {
          id: 'system-activity',
          label: 'Activity Logs',
          onClick: () => setActiveSection('system-activity')
        },
        {
          id: 'system-security',
          label: 'Security',
          icon: Shield,
          onClick: () => setActiveSection('system-security')
        }
      ]
    }
  ];

  const adminStats = [
    {
      label: 'Total Cases',
      value: stats.totalCases,
      icon: Folder,
      trend: '+12%',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Active Cases',
      value: stats.activeCases,
      icon: CheckCircle,
      trend: '+8%',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      trend: '+15%',
      color: 'from-purple-500 to-pink-600'
    },
    {
      label: 'Spotlight Posts',
      value: stats.totalSpotlightPosts,
      icon: Megaphone,
      trend: '+25%',
      color: 'from-orange-500 to-pink-600'
    },
    {
      label: 'Pending Requests',
      value: stats.pendingRequests,
      icon: UserPlus,
      urgent: stats.pendingRequests > 0,
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Suspicious Activity',
      value: stats.suspiciousActivity,
      icon: AlertTriangle,
      urgent: stats.suspiciousActivity > 5,
      color: 'from-red-500 to-rose-600'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <StatsGrid stats={adminStats} isAdmin={true} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <ActivityFeed activities={activityFeed} isAdmin={true} />
              </div>
              <div className="space-y-6">
                {/* Spotlight Quick Access */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Spotlight
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Posts</span>
                      <span className="font-medium text-slate-900 dark:text-white">{stats.totalSpotlightPosts}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Scheduled</span>
                      <span className="font-medium text-slate-900 dark:text-white">{stats.scheduledPosts}</span>
                    </div>
                    <button
                      onClick={() => window.open('/spotlight', '_blank')}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Public Feed
                    </button>
                  </div>
                </div>

                {/* Pending Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pending Actions</h3>
                  <div className="space-y-3">
                    {stats.pendingRequests > 0 && (
                      <button
                        onClick={() => setActiveSection('users-requests')}
                        className="w-full text-left p-3 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <UserPlus className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                Account Requests
                              </p>
                              <p className="text-xs text-slate-500">
                                {stats.pendingRequests} pending approval
                              </p>
                            </div>
                          </div>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                      </button>
                    )}
                    {stats.suspiciousActivity > 5 && (
                      <button
                        onClick={() => setActiveSection('system-security')}
                        className="w-full text-left p-3 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                Security Alert
                              </p>
                              <p className="text-xs text-slate-500">
                                {stats.suspiciousActivity} suspicious activities
                              </p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-red-600" />
                        </div>
                      </button>
                    )}
                    {stats.pendingRequests === 0 && stats.suspiciousActivity <= 5 && (
                      <p className="text-slate-500 text-sm text-center py-4">
                        No pending actions required
                      </p>
                    )}
                  </div>
                </div>

                {/* System Health */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">API Status</span>
                      <span className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-medium text-emerald-600">Operational</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Response Time</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">124ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Uptime</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">99.98%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleCreateCase}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Case
                    </button>
                    <button
                      onClick={() => setActiveSection('users-requests')}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Review Account Requests
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'spotlight-posts':
        return (
          <SpotlightPostsList 
            posts={spotlightPosts}
            onRefresh={fetchSpotlightData}
            title="All Spotlight Posts"
            emptyMessage="No spotlight posts have been created yet."
            isAdmin={true}
          />
        );

      case 'spotlight-delayed':
        return (
          <SpotlightPostsList 
            posts={delayedPosts}
            onRefresh={fetchSpotlightData}
            title="Delayed Posts"
            emptyMessage="No scheduled posts."
            showScheduledTime={true}
            isAdmin={true}
          />
        );

      case 'cases-all':
        return <CasesList cases={cases} filter="all" onRefresh={fetchCases} />;

      case 'cases-active':
        return <CasesList 
          cases={cases.filter(c => !c.is_disabled && c.status === 'active')} 
          filter="active" 
          onRefresh={fetchCases} 
        />;

      case 'cases-disabled':
        return <CasesList 
          cases={cases.filter(c => c.is_disabled)} 
          filter="disabled" 
          onRefresh={fetchCases} 
        />;

      case 'users-all':
        return <UsersList 
          users={users} 
          onViewUser={handleViewUser} 
          onRefresh={fetchUsers} 
        />;

      case 'users-requests':
        return <AccountRequests 
          requests={pendingRequests} 
          onRefresh={fetchAccountRequests} 
        />;

      case 'users-admins':
        return <UsersList 
          users={users.filter(u => u.is_staff || u.is_superuser)} 
          onViewUser={handleViewUser} 
          onRefresh={fetchUsers}
          title="Administrators" 
        />;

      case 'user-details':
        return <UserDetails 
          userId={selectedUser} 
          onBack={() => setActiveSection('users-all')} 
        />;

      case 'system-activity':
        return <ActivityFeed 
          activities={activityFeed} 
          isAdmin={true} 
          fullPage={true} 
        />;

      case 'system-settings':
        return <SiteSettings onRefresh={fetchAllData} />;

      case 'system-security':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Security Center</h2>
            <p className="text-slate-600 dark:text-slate-400">Security monitoring and controls coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      navItems={navItems}
      notifications={[]}
      title="Admin Dashboard"
      subtitle="System administration and monitoring"
      isAdmin={true}
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow hover:shadow-md transition-all flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh All'}
          </button>
          
          {(activeSection.includes('cases') || activeSection.includes('users')) && (
            <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4" /> Filters
            </button>
          )}
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow px-1 py-1 flex">
            {['24h', '7d', '30d', 'All'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
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

      {/* Render Dynamic Content */}
      {renderContent()}

      {/* Spotlight Editor Modal */}
      {showSpotlightEditor && (
        <SpotlightEditor
          onSubmit={handleCreateSpotlightPost}
          onCancel={() => setShowSpotlightEditor(false)}
          caseName="Admin Post"
        />
      )}
    </DashboardLayout>
  );
}