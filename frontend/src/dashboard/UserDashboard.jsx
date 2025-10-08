// src/pages/dashboard/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import StatsGrid from './components/StatsGrid';
import SpotlightEditor from '@/components/spotlight/SpotlightEditor';
import SpotlightPostsList from '@/components/spotlight/SpotlightPostsList';
import ContactMessages from './components/ContactMessages';
import api from '@/utils/axios';
import { 
  Plus, FileText, Eye, Edit, Clock, CheckCircle,
  AlertCircle, Calendar, MapPin, DollarSign, Globe,
  RefreshCw, Settings, User, MessageSquare, TrendingUp,
  Shield, Activity, Archive, List, Megaphone, Folder,
  ToggleLeft, ToggleRight, ExternalLink
} from 'lucide-react';

export default function UserDashboard({ user, onLogout, onOpenCaseModal }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [userCase, setUserCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSpotlightEditor, setShowSpotlightEditor] = useState(false);
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [delayedPosts, setDelayedPosts] = useState([]);
  const [stats, setStats] = useState({
    hasCase: false,
    caseViews: 0,
    tipCount: 0,
    lastUpdated: null,
    isPublished: false,
    totalSpotlightPosts: 0,
    scheduledPosts: 0
  });
  const [tips, setTips] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchSpotlightData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const casesResponse = await api.get('/cases/my_cases/');
      
      if (casesResponse.data && casesResponse.data.length > 0) {
        const caseData = casesResponse.data[0];
        setUserCase(caseData);
        setStats(prev => ({
          ...prev,
          hasCase: true,
          caseViews: caseData.view_count || 0,
          tipCount: caseData.tip_count || 0,
          lastUpdated: caseData.updated_at,
          isPublished: caseData.is_public || false
        }));

        try {
          const tipsResponse = await api.get(`/cases/${caseData.id}/tips/`);
          setTips(tipsResponse.data || []);
        } catch (error) {
          setTips([]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      try {
        const allCasesResponse = await api.get('/cases/');
        const userCases = allCasesResponse.data.filter(c => 
          String(c.user) === String(user.id) || 
          String(c.created_by) === String(user.id)
        );
        if (userCases.length > 0) {
          setUserCase(userCases[0]);
          setStats(prev => ({
            ...prev,
            hasCase: true,
            caseViews: userCases[0].view_count || 0,
            tipCount: userCases[0].tip_count || 0,
            lastUpdated: userCases[0].updated_at,
            isPublished: userCases[0].is_public || false
          }));
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    }
    setLoading(false);
  };

  const fetchSpotlightData = async () => {
    try {
      const postsResponse = await api.get(`/spotlight/?author=${user.id}`);
      const allPosts = postsResponse.data || [];
      
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
      console.error('Error fetching spotlight data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchSpotlightData()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateSpotlightPost = async (formData) => {
    try {
      const response = await api.post('/spotlight/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchSpotlightData();
      setShowSpotlightEditor(false);
    } catch (error) {
      console.error('Error creating spotlight post:', error);
    }
  };

  const handleCreateCase = () => {
    if (onOpenCaseModal) {
      onOpenCaseModal();
    }
  };

  const handleEditCase = () => {
    if (userCase?.id) {
      // Detect environment
      const isDev = window.location.hostname === 'localhost' || 
                    window.location.port === '5173';
      const baseUrl = isDev 
        ? 'http://caseclosure.org:5173' 
        : 'https://caseclosure.org';
      
      window.location.href = `${baseUrl}/editor/${userCase.id}`;
    }
  };

  const handleViewCase = () => {
    if (userCase?.subdomain) {
      window.open(`https://${userCase.subdomain}.caseclosure.com`, '_blank');
    } else if (userCase?.id) {
      window.open(`/memorial/${userCase.id}`, '_blank');
    }
  };

  const toggleCaseStatus = async () => {
    if (!userCase) return;
    
    try {
      await api.patch(`/cases/${userCase.id}/`, { 
        is_public: !userCase.is_public 
      });
      await fetchUserData();
    } catch (error) {
      console.error('Error toggling case status:', error);
      alert('Failed to update case status');
    }
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
      label: 'My Cases',
      icon: Folder,
      expandable: true,
      badge: stats.hasCase ? 1 : 0,
      subItems: stats.hasCase ? [
        {
          id: 'cases-view',
          label: 'View My Case',
          icon: FileText,
          onClick: () => setActiveSection('cases-view')
        },
        {
          id: 'cases-edit',
          label: 'Edit in Editor',
          icon: Edit,
          onClick: handleEditCase
        }
      ] : [
        {
          id: 'cases-create',
          label: 'Create Case',
          icon: Plus,
          onClick: handleCreateCase
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
      id: 'tips',
      label: 'Tips & Messages',
      icon: MessageSquare,
      badge: stats.tipCount > 0 ? stats.tipCount : null,
      onClick: () => setActiveSection('tips')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => window.location.href = '/settings/user'
    }
  ];

  const userStats = userCase ? [
    {
      label: 'Website Status',
      value: stats.isPublished ? 'Published' : 'Draft',
      icon: stats.isPublished ? CheckCircle : Clock,
      color: stats.isPublished ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-orange-600'
    },
    {
      label: 'Page Views',
      value: stats.caseViews,
      icon: Eye,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Spotlight Posts',
      value: stats.totalSpotlightPosts,
      icon: Megaphone,
      color: 'from-orange-500 to-pink-600'
    },
    {
      label: 'Tips Received',
      value: stats.tipCount,
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-600',
      urgent: stats.tipCount > 0
    }
  ] : [];

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

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return userCase ? (
          <>
            <StatsGrid stats={userStats} isAdmin={false} />
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Case Overview - Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Case Information Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Memorial Information</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      userCase.is_public 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {userCase.is_public ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {userCase.first_name} {userCase.last_name}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Case Type</p>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {userCase.case_type || userCase.crime_type || 'Not specified'}
                      </p>
                    </div>

                    {userCase.incident_date && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Incident Date</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {new Date(userCase.incident_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {userCase.incident_location && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {userCase.incident_location}
                        </p>
                      </div>
                    )}

                    {userCase.reward_amount && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Reward Amount</p>
                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {userCase.reward_amount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {userCase.subdomain && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Website URL</p>
                        <a 
                          href={`https://${userCase.subdomain}.caseclosure.com`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Globe className="w-4 h-4" />
                          {userCase.subdomain}.caseclosure.com
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleEditCase}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Memorial & Website
                    </button>
                    
                    {userCase.is_public && (
                      <button
                        onClick={handleViewCase}
                        className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Live Website
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Tips */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Tips</h3>
                  {tips.length > 0 ? (
                    <div className="space-y-3">
                      {tips.slice(0, 5).map((tip, index) => (
                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm text-slate-700 dark:text-slate-300">{tip.tip_content || tip.message}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(tip.submitted_at || tip.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveSection('tips')}
                        className="w-full mt-3 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View All Tips →
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No tips received yet</p>
                      <p className="text-sm mt-1">Tips will appear here when submitted through your memorial website</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Getting Started Checklist */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Setup Progress</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Case Created</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Basic information added</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {userCase.victim_photo ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Add Photo</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Upload a memorial photo</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {userCase.template_id ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Choose Template</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Select website design</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {userCase.is_public ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Publish Website</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Make memorial public</p>
                      </div>
                    </div>
                  </div>

                  {!userCase.is_public && (
                    <button
                      onClick={handleEditCase}
                      className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      Complete Setup
                    </button>
                  )}
                </div>

                {/* Quick Tips */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                    Tips for Success
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Share your memorial page on social media to increase visibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Update information regularly to keep the case active</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Respond to tips promptly and share with law enforcement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Create case prompt
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-2xl mx-auto p-8">
              <div className="mb-6">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Create Your Memorial Page
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Honor your loved one's memory and help bring them justice by creating a dedicated memorial website. 
                Share their story, collect tips, and keep their case active in the public eye.
              </p>

              <button
                onClick={handleCreateCase}
                className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-lg flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-6 h-6" />
                Create Memorial Page
              </button>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">Easy Setup</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Simple step-by-step process to create your memorial
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <Globe className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">Custom Website</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Professional memorial site with your own URL
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <Shield className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">Secure Tips</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Anonymous tip submission system for information
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'cases-view':
        return userCase ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Case</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEditCase}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit in Editor
                  </button>
                  {userCase.is_public && (
                    <button
                      onClick={handleViewCase}
                      className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all flex items-center gap-2 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Live
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div className="p-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                        {userCase.first_name} {userCase.last_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Case ID: {userCase.id} • {userCase.case_type || userCase.crime_type || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userCase.is_public 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {userCase.is_public ? 'Published' : 'Draft'}
                      </span>
                      <button
                        onClick={toggleCaseStatus}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={userCase.is_public ? 'Unpublish' : 'Publish'}
                      >
                        {userCase.is_public ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCase.incident_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Incident Date</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {new Date(userCase.incident_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {userCase.incident_location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Location</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {userCase.incident_location}
                          </p>
                        </div>
                      </div>
                    )}

                    {userCase.reward_amount && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Reward Amount</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            ${userCase.reward_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Page Views</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {userCase.view_count || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Tips Received</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {userCase.tip_count || 0}
                        </p>
                      </div>
                    </div>

                    {userCase.subdomain && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Website URL</p>
                          <a 
                            href={`https://${userCase.subdomain}.caseclosure.com`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {userCase.subdomain}.caseclosure.com
                          </a>
                        </div>
                      </div>
                    )}

                    {userCase.updated_at && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Last Updated</p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {new Date(userCase.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                      onClick={handleEditCase}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Memorial & Website
                    </button>
                    
                    {userCase.is_public && (
                      <button
                        onClick={handleViewCase}
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 font-medium"
                      >
                        <ExternalLink className="w-5 h-5" />
                        View Live Website
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center py-12 text-slate-500">
              <Folder className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No case created yet</p>
              <p className="text-sm">Create your first memorial page to get started</p>
              <button
                onClick={handleCreateCase}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Memorial Page
              </button>
            </div>
          </div>
        );

      case 'spotlight-posts':
        return (
          <SpotlightPostsList 
            posts={spotlightPosts}
            onRefresh={fetchSpotlightData}
            title="My Spotlight Posts"
            emptyMessage="You haven't created any spotlight posts yet."
          />
        );

      case 'spotlight-delayed':
        return (
          <SpotlightPostsList 
            posts={delayedPosts}
            onRefresh={fetchSpotlightData}
            title="Delayed Posts"
            emptyMessage="No scheduled posts. Create a post and schedule it for later!"
            showScheduledTime={true}
          />
        );

      case 'tips':
        return userCase ? (
          <ContactMessages 
            onRefresh={handleRefresh} 
            filterType="tip"
            caseId={userCase.id}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No memorial page created yet</p>
              <p className="text-sm">Create a memorial page to start receiving tips</p>
              <button
                onClick={handleCreateCase}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Memorial Page
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      navItems={navItems}
      notifications={[]}
      title="Memorial Dashboard"
      subtitle={userCase ? `Managing memorial for ${userCase.first_name || userCase.victim_name}` : 'Create your memorial page'}
      isAdmin={false}
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
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Render Dynamic Content */}
      {renderContent()}

      {/* Spotlight Editor Modal */}
      {showSpotlightEditor && (
        <SpotlightEditor
          onSubmit={handleCreateSpotlightPost}
          onCancel={() => setShowSpotlightEditor(false)}
          caseName={userCase?.first_name}
        />
      )}
    </DashboardLayout>
  );
}