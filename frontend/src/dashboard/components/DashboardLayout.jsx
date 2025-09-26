// src/pages/dashboard/components/DashboardLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import {
  Bell, Search, Moon, Sun, Radio, Globe, User,
  LogOut, Settings, HelpCircle, ShieldCheck, ChevronDown
} from 'lucide-react';

export default function DashboardLayout({ 
  children, 
  user, 
  onLogout, 
  navItems, 
  notifications = [],
  title,
  subtitle,
  isAdmin = false 
}) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'alert': '🚨',
      'tip': '💡',
      'visitor': '👁️',
      'system': '⚙️',
      'account_request': '👤'
    };
    return icons[type] || '📌';
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={onLogout}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <div className={`${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cases, users, tips, or analytics..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-500">
                    ⌘K
                  </kbd>
                </form>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3 ml-6">
                {/* Live Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600">
                    System Online
                  </span>
                </div>

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
                        {notifications.length > 0 ? notifications.map(notif => (
                          <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 text-lg">{getNotificationIcon(notif.type)}</div>
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
                        )) : (
                          <div className="p-8 text-center text-slate-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isAdmin ? 'Administrator' : 'User'}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.first_name[0]}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                  </button>

                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {user.first_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => window.location.href = '/settings/profile'}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                        >
                          <User className="w-5 h-5 text-slate-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Profile Settings</span>
                        </button>
                        <button 
                          onClick={() => window.location.href = '/settings/security'}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                        >
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
                          onClick={() => {
                            setShowProfile(false);
                            onLogout();
                          }}
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
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <span className="text-slate-600 dark:text-slate-400">{subtitle}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Globe className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Click outside handlers */}
      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </div>
  );
}
