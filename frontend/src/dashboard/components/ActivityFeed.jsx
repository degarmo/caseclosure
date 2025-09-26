// src/pages/dashboard/components/ActivityFeed.jsx
import React, { useState } from 'react';
import { 
  Eye, FileText, MessageSquare, MapPin, Activity, 
  AlertTriangle, User, Shield, Clock, Filter,
  ChevronRight, ExternalLink
} from 'lucide-react';

export default function ActivityFeed({ 
  activities = [], 
  isAdmin = false, 
  fullPage = false 
}) {
  const [filter, setFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState({});

  const getActivityIcon = (activity) => {
    const type = activity.type || activity.action;
    switch (type) {
      case 'page_view':
      case 'viewed':
        return <Eye className="w-4 h-4" />;
      case 'form_submit':
      case 'submitted form':
        return <FileText className="w-4 h-4" />;
      case 'tip_submitted':
        return <MessageSquare className="w-4 h-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4" />;
      case 'user_action':
        return <User className="w-4 h-4" />;
      case 'security_alert':
        return <Shield className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskColor = (activity) => {
    const risk = activity.risk || activity.suspicious_score || 0;
    if (risk >= 0.7) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (risk >= 0.4) return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'suspicious') return (activity.risk || activity.suspicious_score || 0) >= 0.4;
    if (filter === 'tips') return activity.type === 'tip_submitted';
    return true;
  });

  if (fullPage) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              System Activity Log
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  LIVE MONITORING
                </span>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
              >
                <option value="all">All Activity</option>
                <option value="suspicious">Suspicious Only</option>
                <option value="tips">Tips Only</option>
              </select>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
          {filteredActivities.map((activity, idx) => (
            <ActivityItem 
              key={activity.id || idx} 
              activity={activity} 
              isAdmin={isAdmin}
              expanded={expandedItems[activity.id || idx]}
              onToggle={() => {
                setExpandedItems(prev => ({
                  ...prev,
                  [activity.id || idx]: !prev[activity.id || idx]
                }));
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Real-Time Activity Stream
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">LIVE</span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {filteredActivities.length > 0 ? (
          filteredActivities.slice(0, 10).map((activity, idx) => (
            <ActivityItem 
              key={activity.id || idx} 
              activity={activity} 
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="p-8 text-center text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Events will appear here in real-time</p>
          </div>
        )}
      </div>
      {activities.length > 10 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <button className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All Activity →
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity, isAdmin, expanded, onToggle }) {
  const getActivityIcon = (activity) => {
    const type = activity.type || activity.action;
    switch (type) {
      case 'page_view':
      case 'viewed':
        return <Eye className="w-4 h-4" />;
      case 'form_submit':
      case 'submitted form':
        return <FileText className="w-4 h-4" />;
      case 'tip_submitted':
        return <MessageSquare className="w-4 h-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getRiskColor = (activity) => {
    const risk = activity.risk || activity.suspicious_score || 0;
    if (risk >= 0.7) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (risk >= 0.4) return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
        onToggle ? 'cursor-pointer' : ''
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getRiskColor(activity)}`}>
          {getActivityIcon(activity)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {isAdmin && activity.case_id && (
              <span className="font-normal text-slate-500 mr-2">
                Case #{activity.case_id}:
              </span>
            )}
            <span className="font-semibold">
              {activity.user || activity.visitor_id || 'Anonymous'}
            </span>
            {' '}
            {activity.action || activity.type?.replace('_', ' ') || 'interacted'}
            {activity.page && (
              <>
                {' '}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {activity.page}
                </span>
              </>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {activity.location && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {activity.location}
              </span>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(activity.timestamp || activity.time)}
            </span>
            {isAdmin && activity.ip_address && (
              <span className="text-xs text-slate-500">
                IP: {activity.ip_address}
              </span>
            )}
          </div>
          
          {/* Expanded Details for Admin */}
          {expanded && isAdmin && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Fingerprint:</span>
                  <span className="ml-2 font-mono">{activity.fingerprint || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Session:</span>
                  <span className="ml-2 font-mono">{activity.session_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Browser:</span>
                  <span className="ml-2">{activity.browser || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Device:</span>
                  <span className="ml-2">{activity.device || 'Unknown'}</span>
                </div>
              </div>
              {activity.metadata && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <pre className="text-xs text-slate-600 dark:text-slate-400">
                    {JSON.stringify(activity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
        {onToggle && (
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
            expanded ? 'rotate-90' : ''
          }`} />
        )}
      </div>
    </div>
  );
}