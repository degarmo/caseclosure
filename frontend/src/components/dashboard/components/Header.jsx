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
  onSectionChange,
  onThemeChange,
  theme,
  themeId,
  themeOptions = []
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const themeMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemes(false);
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

  const activePillStyle = { background: theme.accent, color: theme.accentStrongText };
  const inactivePillStyle = { background: theme.pillBackground, color: theme.pillText };
  const controlStyle = { background: theme.inputBackground, border: `1px solid ${theme.inputBorder}` };

  return (
    <header
      className="relative z-40 px-5 py-3 backdrop-blur md:px-8"
      style={{ borderBottom: `1px solid ${theme.shellBorder}`, background: theme.shellBackground }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentSoft, color: theme.accentText }}
            >
              {sectionMeta?.eyebrow || 'Workspace'}
            </span>
            {formattedLastUpdated && (
              <span className="text-sm text-slate-500">
                Updated {formattedLastUpdated}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
            {sectionMeta?.title || roleConfig?.title || 'Dashboard'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
            {sectionMeta?.description || roleConfig?.subtitle || 'Welcome back'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => onSectionChange?.('overview')}
              className="rounded-full px-3 py-1 text-sm font-medium transition"
              style={activeSection === 'overview' ? activePillStyle : inactivePillStyle}
            >
              Overview
            </button>
            <button
              onClick={() => onSectionChange?.('cases-all')}
              className="rounded-full px-3 py-1 text-sm font-medium transition"
              style={activeSection.startsWith('cases') || activeSection === 'police-case-detail' ? activePillStyle : inactivePillStyle}
            >
              Cases
            </button>
            <button
              onClick={() => onSectionChange?.('messages-all')}
              className="rounded-full px-3 py-1 text-sm font-medium transition"
              style={activeSection.startsWith('messages') ? activePillStyle : inactivePillStyle}
            >
              Messages
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 xl:min-w-[500px]">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, users, posts, or activity"
                className="w-full rounded-2xl px-10 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:ring-4 focus:ring-slate-200"
                style={controlStyle}
              />
            </div>
          </form>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative" ref={themeMenuRef}>
                <button
                  onClick={() => setShowThemes(!showThemes)}
                  className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition"
                  style={controlStyle}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  Theme
                </button>
                {showThemes && (
                  <div
                    className="absolute left-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-slate-900/10"
                    style={{ borderColor: theme.inputBorder }}
                  >
                    <div className="border-b px-5 py-4" style={{ borderColor: theme.inputBorder }}>
                      <h3 className="font-semibold text-slate-900">Color Schemes</h3>
                      <p className="mt-1 text-sm text-slate-500">Choose the dashboard palette that feels best to you.</p>
                    </div>
                    <div className="grid gap-2 p-3">
                      {themeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            onThemeChange?.(option.id);
                            setShowThemes(false);
                          }}
                          className="flex items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                          style={option.id === themeId ? { background: option.accentSoft, border: `1px solid ${option.accentBorder}` } : { border: '1px solid transparent' }}
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{option.label}</p>
                            <p className="text-xs text-slate-500">{option.id === themeId ? 'Current selection' : 'Apply this scheme'}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {option.preview.map((color) => (
                              <span
                                key={color}
                                className="h-5 w-5 rounded-full border border-white shadow-sm"
                                style={{ background: color }}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition"
                style={controlStyle}
                title="Refresh data"
              >
                <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <div className="relative" ref={notificationMenuRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative rounded-2xl p-2.5 text-slate-700 shadow-sm transition"
                  style={controlStyle}
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
                  <div
                    className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-slate-900/10"
                    style={{ borderColor: theme.inputBorder }}
                  >
                    <div className="border-b px-5 py-4" style={{ borderColor: theme.inputBorder }}>
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
                            className="block w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50"
                            style={!notif.read ? { background: theme.accentSoft } : undefined}
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
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left shadow-sm transition"
                style={controlStyle}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-medium text-white">
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
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-slate-900/10"
                  style={{ borderColor: theme.inputBorder }}
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: theme.inputBorder }}>
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

                  <div className="border-t py-1" style={{ borderColor: theme.inputBorder }}>
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
