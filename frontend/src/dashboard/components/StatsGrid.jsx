// src/pages/dashboard/components/StatsGrid.jsx
import React, { useEffect, useState } from 'react';
import { 
  Eye, Fingerprint, MessageSquare, Activity, AlertTriangle, 
  Users, TrendingUp, TrendingDown, Minus 
} from 'lucide-react';

export default function StatsGrid({ stats, isAdmin = false }) {
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    // Animate number changes
    const duration = 1500;
    const steps = 60;
    const increment = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      const progress = Math.min(current / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      if (isAdmin) {
        // Admin stats animation
        const newValues = {};
        stats.forEach(stat => {
          newValues[stat.label] = Math.floor((stat.value || 0) * easeOut);
        });
        setAnimatedValues(newValues);
      } else {
        // User stats animation
        setAnimatedValues({
          visitors: Math.floor((stats.visitors || 0) * easeOut),
          fingerprints: Math.floor((stats.fingerprints || 0) * easeOut),
          tips: Math.floor((stats.tips || 0) * easeOut),
          engagement: Math.floor((stats.engagement || 0) * easeOut),
          suspicious: Math.floor((stats.suspicious || 0) * easeOut),
          activeNow: Math.floor((stats.activeNow || 0) * easeOut)
        });
      }

      if (progress >= 1) clearInterval(timer);
    }, increment);

    return () => clearInterval(timer);
  }, [stats, isAdmin]);

  // Admin Stats Grid
  if (isAdmin && Array.isArray(stats)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.trend && (
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  stat.trend.startsWith('+') ? 'text-emerald-600' :
                  stat.trend.startsWith('-') ? 'text-red-600' :
                  'text-slate-500'
                }`}>
                  {stat.trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> :
                   stat.trend.startsWith('-') ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                  {stat.trend}
                </span>
              )}
              {stat.urgent && (
                <span className="text-xs font-medium text-red-600 animate-pulse">ALERT</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {animatedValues[stat.label]?.toLocaleString() || 0}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    );
  }

  // User Stats Grid (default)
  const userStats = [
    {
      label: 'Unique Visitors',
      value: animatedValues.visitors || 0,
      icon: Eye,
      trend: '+23%',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Fingerprints',
      value: animatedValues.fingerprints || 0,
      icon: Fingerprint,
      trend: '+15%',
      color: 'from-purple-500 to-pink-600'
    },
    {
      label: 'Tips Received',
      value: animatedValues.tips || 0,
      icon: MessageSquare,
      trend: '+8%',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'Engagement',
      value: `${animatedValues.engagement || 0}%`,
      icon: Activity,
      trend: '0%',
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Suspicious',
      value: animatedValues.suspicious || 0,
      icon: AlertTriangle,
      alert: (animatedValues.suspicious || 0) > 5,
      color: 'from-red-500 to-rose-600'
    },
    {
      label: 'Active Now',
      value: animatedValues.activeNow || 0,
      icon: Users,
      live: true,
      color: 'from-teal-500 to-cyan-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {userStats.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow`}>
              <stat.icon className="w-5 h-5" />
            </div>
            {stat.trend && (
              <span className={`text-xs font-medium ${
                stat.trend.startsWith('+') ? 'text-emerald-600' :
                stat.trend === '0%' ? 'text-slate-500' :
                'text-red-600'
              }`}>
                {stat.trend}
              </span>
            )}
            {stat.alert && (
              <span className="text-xs font-medium text-red-600 animate-pulse">ALERT</span>
            )}
            {stat.live && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-600">LIVE</span>
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}