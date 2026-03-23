import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowPathIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';

export default function Header({ 
  user, 
  onLogout, 
  onRefresh, 
  roleConfig, 
  activeSection,
  notifications = [],
  onSearch,
  onProfileSettings,
  sectionMeta,
  lastUpdated,
  onSectionChange
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <header className="border-b border-slate-200/80 bg-white/85 px-5 py-5 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
              {sectionMeta?.eyebrow || 'Workspace'}
            </span>
            {formattedLastUpdated && (
              <span className="text-sm text-slate-500">
                Updated {formattedLastUpdated}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            {sectionMeta?.title || roleConfig?.title || 'Dashboard'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {sectionMeta?.description || roleConfig?.subtitle || 'Welcome back'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onSectionChange?.('overview')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeSection === 'overview'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSectionChange?.('cases-all')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeSection.startsWith('cases') || activeSection === 'police-case-detail'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cases
            </button>
            <button
              onClick={() => onSectionChange?.('messages-all')}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeSection.startsWith('messages')
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Messages
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:min-w-[420px]">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, users, posts, or activity"
                className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </form>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                title="Refresh data"
              >
                <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <div className="relative" ref={notificationMenuRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  title="Notifications"
                >
                  {unreadCount > 0 ? (
                    <BellSolid className="h-5 w-5 text-amber-500" />
                  ) : (
                    <BellIcon className="h-5 w-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setShowNotifications(false);
                              if (notif.action) onSectionChange?.(notif.action);
                            }}
                            className={`block w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                              !notif.read ? 'bg-sky-50/60' : ''
                            }`}
                          >
                            <p className="text-sm font-medium text-slate-900">{notif.message}</p>
                            <p className="mt-1 text-xs text-slate-500">{notif.time}</p>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <BellIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p>No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-medium text-white">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.first_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user?.is_staff ? 'Admin' : user?.role || 'User'}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {user?.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {user?.is_staff ? 'Administrator' : 
                       user?.role === 'police' ? 'Law Enforcement' : 'User Account'}
                    </p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onProfileSettings) onProfileSettings();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <UserCircleIcon className="h-4 w-4" />
                      Profile Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
                    >
                      <ShieldCheckIcon className="h-4 w-4" />
                      Security
                    </button>
                  </div>
                  
                  <div className="border-t border-slate-200 py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
