import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axios';
import { useDashboard, useRealtimeActivity } from '../hooks/useDashboard';
import { useTracker } from '../hooks/useTracker';
import { BiFingerprint } from 'react-icons/bi';
import { 
  FiActivity, FiEye, FiUsers, FiTrendingUp, 
  FiAlertCircle, FiMapPin, FiClock, FiMessageCircle,
  FiChevronRight, FiExternalLink, FiFilter,
  FiBarChart2, FiPieChart, FiShield, FiSearch,
  FiRefreshCw, FiWifi, FiGlobe, FiUserCheck, FiLock, FiKey
} from 'react-icons/fi';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const { trackEvent } = useTracker();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeCase, setActiveCase] = useState(null);
  const [userCases, setUserCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get the first case slug for dashboard data (or use a default)
  const primaryCaseSlug = userCases[0]?.slug || 'default';
  
  // Use the dashboard hook for real-time tracking data
  const {
    dashboardData,
    widgets,
    realtimeMetrics,
    loading: dashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard
  } = useDashboard(primaryCaseSlug, {
    enableRealtime: true,
    pollingInterval: 5000,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // Use real-time activity hook
  const {
    activity: realtimeActivity,
    activeUsers,
    loading: activityLoading
  } = useRealtimeActivity(primaryCaseSlug, {
    pollingInterval: 3000
  });

  // Enhanced stats with tracking data
  const [stats, setStats] = useState({
    visitors: 0,
    tips: 0,
    engagement: 0,
    suspicious: 0,
    fingerprints: 0,
    activeNow: 0
  });

  const [animatedValues, setAnimatedValues] = useState({
    visitors: 0,
    tips: 0,
    engagement: 0,
    suspicious: 0,
    fingerprints: 0,
    activeNow: 0
  });

  // Fetch user's cases and initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cases
        const casesResponse = await api.get('/cases/');
        const casesData = casesResponse.data.results || casesResponse.data;
        const filtered = Array.isArray(casesData)
          ? casesData.filter(c => String(c.user) === String(user?.id))
          : [];
        setUserCases(filtered);

        // Track dashboard view
        trackEvent('dashboard_viewed', {
          userId: user?.id,
          caseCount: filtered.length
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setUserCases([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, trackEvent]);

  // Update stats when dashboard data changes
  useEffect(() => {
    if (widgets) {
      setStats({
        visitors: widgets.visitorMetrics?.today || 0,
        tips: dashboardData?.stats?.active_tips || 0,
        engagement: widgets.engagementMetrics?.metrics?.engagement_rate || 0,
        suspicious: widgets.suspiciousActivity?.total_24h || 0,
        fingerprints: widgets.visitorMetrics?.week_total || 0,
        activeNow: widgets.visitorMetrics?.active_now || activeUsers || 0
      });
    }
  }, [widgets, dashboardData, activeUsers]);

  // Animate numbers
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      const progress = Math.min(current / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedValues({
        visitors: Math.floor(stats.visitors * easeOut),
        tips: Math.floor(stats.tips * easeOut),
        engagement: Math.floor(stats.engagement * easeOut),
        suspicious: Math.floor(stats.suspicious * easeOut),
        fingerprints: Math.floor(stats.fingerprints * easeOut),
        activeNow: Math.floor(stats.activeNow * easeOut)
      });

      if (progress >= 1) clearInterval(timer);
    }, increment);

    return () => clearInterval(timer);
  }, [stats]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    trackEvent('dashboard_refreshed');
    await refreshDashboard();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Transform tracking data for charts
  const visitorData = widgets?.visitorMetrics?.hourly_trend ? 
    widgets.visitorMetrics.hourly_trend.map((count, hour) => ({
      time: `${hour}:00`,
      unique: count,
      returning: Math.floor(count * 0.3),
      suspicious: widgets.suspiciousActivity?.recent_activities?.filter(a => 
        new Date(a.time_ago).getHours() === hour
      ).length || 0
    })) : [];

  const geoData = widgets?.suspiciousActivity?.top_suspicious_users?.map(user => ({
    location: user.ip_address || 'Unknown',
    visits: user.activity_count,
    risk: user.max_severity >= 4 ? 'critical' : 
          user.max_severity >= 3 ? 'high' : 
          user.max_severity >= 2 ? 'medium' : 'low'
  })) || [];

  const deviceData = Object.entries(widgets?.engagementMetrics?.metrics?.interaction_types || {})
    .slice(0, 4)
    .map(([type, count], idx) => ({
      name: type.replace('_', ' '),
      value: count,
      color: ['#6366F1', '#8B5CF6', '#10B981', '#EF4444'][idx]
    }));

  // Enhanced stat card with gradient backgrounds
  const StatCard = ({ icon: Icon, label, value, change, color = 'indigo', alert = false, subtitle, live = false }) => (
    <div className={`relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${alert ? 'ring-2 ring-red-500/20' : ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-${color}-600/10`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl text-white shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
          {alert && (
            <span className="flex items-center text-red-500 text-xs font-semibold animate-pulse">
              <FiAlertCircle className="mr-1" />
              ALERT
            </span>
          )}
          {live && (
            <span className="flex items-center text-green-500 text-xs font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              LIVE
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {change !== undefined && (
          <div className={`mt-3 flex items-center text-xs font-semibold ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}% from yesterday
          </div>
        )}
      </div>
    </div>
  );

  const handleCaseClick = (caseId) => {
    trackEvent('case_clicked', { caseId });
    navigate(`/case-builder/${caseId}`);
  };

  if (loading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-6">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
              <FiFingerprint className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Command Center
              </h1>
              <p className="text-gray-600 mt-1">Real-time intelligence and pattern analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className={`px-4 py-2 bg-white rounded-xl shadow hover:shadow-md transition-all flex items-center gap-2 text-sm font-medium ${refreshing ? 'animate-spin' : ''}`}
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> 
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="px-4 py-2 bg-white rounded-xl shadow hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-medium">
              <FiFilter /> Filters
            </button>
            <div className="bg-white rounded-xl shadow px-1 py-1 flex">
              {['24h', '7d', '30d', '90d'].map(period => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    trackEvent('period_changed', { period });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Live Status Bar */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FiWifi className="text-green-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{animatedValues.activeNow}</span> active now
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiGlobe className="text-blue-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{widgets?.geographic_distribution?.countries?.length || 0}</span> countries
            </span>
          </div>
          {realtimeMetrics && (
            <div className="flex items-center gap-2">
              <FiActivity className="text-purple-500" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{realtimeMetrics.events_per_minute?.toFixed(1) || 0}</span> events/min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard 
          icon={FiEye} 
          label="Unique Visitors" 
          value={animatedValues.visitors} 
          change={widgets?.visitorMetrics?.change_percentage}
          subtitle="Today"
          color="blue" 
        />
        <StatCard 
          icon={FiFingerprint} 
          label="Fingerprints" 
          value={animatedValues.fingerprints} 
          subtitle="This week"
          color="indigo" 
        />
        <StatCard 
          icon={FiMessageCircle} 
          label="Tips Received" 
          value={animatedValues.tips} 
          change={34} 
          color="purple" 
        />
        <StatCard 
          icon={FiActivity} 
          label="Engagement" 
          value={`${Math.round(animatedValues.engagement)}%`} 
          change={-5} 
          color="green" 
        />
        <StatCard 
          icon={FiShield} 
          label="Suspicious" 
          value={animatedValues.suspicious} 
          change={0} 
          color="red" 
          alert={animatedValues.suspicious > 5} 
        />
        <StatCard 
          icon={FiUsers} 
          label="Active Now" 
          value={animatedValues.activeNow} 
          color="emerald"
          live={true}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Enhanced Visitor Flow Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Visitor Activity Timeline</h2>
              <p className="text-sm text-gray-500 mt-1">24-hour activity pattern</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-gray-600">Unique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="text-gray-600">Returning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-gray-600">Suspicious</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={visitorData}>
              <defs>
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReturning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
              <YAxis stroke="#9CA3AF" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="unique" stroke="#6366F1" fillOpacity={1} fill="url(#colorUnique)" strokeWidth={2} />
              <Area type="monotone" dataKey="returning" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorReturning)" strokeWidth={2} />
              <Line type="monotone" dataKey="suspicious" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Geographic Hotspots */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Geographic Hotspots</h2>
              <p className="text-sm text-gray-500 mt-1">Top suspicious locations</p>
            </div>
            <FiMapPin className="text-indigo-600" />
          </div>
          <div className="space-y-3">
            {geoData.slice(0, 5).map((location, idx) => (
              <div key={idx} className="relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {location.location}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{location.visits}</span>
                    {location.risk === 'critical' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                        CRITICAL
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      location.risk === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      location.risk === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      location.risk === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                      'bg-gradient-to-r from-indigo-500 to-indigo-600'
                    }`}
                    style={{ width: `${Math.min((location.visits / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              trackEvent('view_map_clicked');
              navigate('/maps');
            }}
            className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-600 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            View Full Map Analysis <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Real-Time Activity Stream */}
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Real-Time Activity Stream</h2>
            <p className="text-sm text-gray-500 mt-1">Live tracking feed from all cases</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600 font-medium">LIVE</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {realtimeActivity.length > 0 ? (
            realtimeActivity.map((event, idx) => (
              <div key={event.id || idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-gray-50 ${
                event.is_suspicious ? 'bg-red-50 border border-red-100' : 'bg-gray-50'
              }`}>
                <div className={`p-2 rounded-lg ${
                  event.is_suspicious ? 'bg-red-100 text-red-600' :
                  event.type === 'page_view' ? 'bg-blue-100 text-blue-600' :
                  event.type === 'click' ? 'bg-green-100 text-green-600' :
                  event.type === 'form_submit' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {event.is_suspicious ? <FiAlertCircle className="w-4 h-4" /> :
                   event.type === 'page_view' ? <FiEye className="w-4 h-4" /> :
                   event.type === 'click' ? <FiActivity className="w-4 h-4" /> :
                   <FiTrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{event.user}</span>
                    {' '}{event.type.replace('_', ' ')} on {event.page}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{event.location}</span>
                    <span className="text-xs text-gray-500">{event.device}</span>
                    <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    {event.suspicious_score > 0 && (
                      <span className="text-xs font-medium text-red-600">
                        Risk: {(event.suspicious_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                {event.is_suspicious && (
                  <button 
                    onClick={() => {
                      trackEvent('review_suspicious_clicked', { eventId: event.id });
                      navigate('/suspicious/' + event.id);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Review
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiActivity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">Events will appear here in real-time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}