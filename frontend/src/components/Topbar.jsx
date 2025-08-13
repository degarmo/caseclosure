import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/utils/axios";
import {
  HiUser, HiArrowRightOnRectangle, HiBell, HiMagnifyingGlass,
  HiCog8Tooth, HiQuestionMarkCircle, HiShieldCheck,
  HiExclamationTriangle, HiEye, HiClock, HiSparkles,
  HiChartBar, HiLightBulb, HiFingerPrint, HiGlobeAlt,
  HiCommandLine, HiMoon, HiSun, HiBolt, HiBeaker
} from "react-icons/hi2";
import {
  RiBellFill, RiSearchLine, RiUserFill, RiSettings4Fill,
  RiShieldStarFill, RiAlertFill, RiLightbulbFlashFill,
  RiDashboardFill, RiEyeFill, RiTimeFill, RiGlobalLine
} from "react-icons/ri";

export default function Topbar({ user, onLogout, onOpenCaseModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [systemStatus, setSystemStatus] = useState("operational");
  const [darkMode, setDarkMode] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch notifications
        try {
          const notifRes = await api.get("/notifications/");
          const data = notifRes.data.results || notifRes.data;
          setNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
          setAlertCount(Array.isArray(data) ? data.filter(n => !n.read).length : 0);
        } catch (e) {
          // Use demo notifications if endpoint doesn't exist
          setNotifications([
            { id: 1, type: 'tip', message: 'New tip received for Sarah Mitchell case', time: '5 min ago', read: false, urgent: true },
            { id: 2, type: 'visitor', message: 'Suspicious activity detected from Milwaukee', time: '1 hour ago', read: false },
            { id: 3, type: 'system', message: 'Case analytics report ready', time: '3 hours ago', read: true }
          ]);
          setAlertCount(2);
        }

        // Fetch last activity
        try {
          const activityRes = await api.get("/activity/last/");
          setLastActivity(activityRes.data);
        } catch (e) {
          setLastActivity({ time: new Date().toISOString(), action: 'Dashboard viewed' });
        }

      } catch (error) {
        console.error("Error fetching topbar data:", error);
      }
    };

    fetchData();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Intelligence Dashboard';
    if (path.includes('/case-builder')) return 'Case Builder';
    if (path.includes('/messages')) return 'Messages & Tips';
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/maps')) return 'Geographic Intelligence';
    if (path.includes('/settings')) return 'Settings';
    return 'Case Closure Platform';
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'tip': return <RiBellFill className="w-4 h-4 text-purple-500" />;
      case 'visitor': return <HiExclamationTriangle className="w-4 h-4 text-red-500" />;
      case 'system': return <HiCog8Tooth className="w-4 h-4 text-blue-500" />;
      case 'success': return <HiShieldCheck className="w-4 h-4 text-green-500" />;
      default: return <HiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  const isAdmin = user?.is_staff || user?.is_superuser;

  return (
    <>
      <header className="w-full bg-white border-b-2 border-gray-100 shadow-sm relative z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Branding & Page Title */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HiFingerPrint className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {getPageTitle()}
                  </h1>
                  <p className="text-xs text-gray-500">Illuminating paths to justice</p>
                </div>
              </div>

              {/* System Status Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  systemStatus === 'operational' ? 'bg-green-500' : 
                  systemStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs font-medium text-gray-600">
                  System {systemStatus === 'operational' ? 'Online' : 'Issues'}
                </span>
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cases, tips, or analytics..."
                  className="w-full px-5 py-2.5 pl-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                />
                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-3">
              {/* Quick Actions */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={onOpenCaseModal}
                  className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors group relative"
                  title="Create New Case"
                >
                  <HiSparkles className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                </button>
                
                <button
                  onClick={() => navigate('/reports/create')}
                  className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors group relative"
                  title="Generate Report"
                >
                  <HiChartBar className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => navigate('/cases/list')}
                    className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors group relative"
                    title="Admin Console"
                  >
                    <HiCommandLine className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                  </button>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                title="Toggle Theme"
              >
                {darkMode ? 
                  <HiSun className="w-5 h-5 text-yellow-500" /> : 
                  <HiMoon className="w-5 h-5 text-gray-600" />
                }
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RiBellFill className="w-5 h-5 text-gray-600" />
                  {alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Mark all as read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${
                              !notif.read ? 'bg-blue-50/30' : ''
                            }`}
                            onClick={() => {
                              navigate(notif.link || '/notifications');
                              setShowNotifications(false);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notif.time}
                                </p>
                              </div>
                              {notif.urgent && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <HiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotifications(false);
                        }}
                        className="w-full py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.first_name ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) : "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isAdmin ? 'Administrator' : 'Investigator'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                        {user?.first_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <RiShieldStarFill className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                          {user?.first_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                              <RiShieldStarFill className="w-3 h-3" />
                              Admin Access
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/settings/user');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <HiUser className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Profile Settings</p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/settings/security');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <HiShieldCheck className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Security</p>
                          <p className="text-xs text-gray-500">2FA and passwords</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/help');
                          setShowProfile(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <HiQuestionMarkCircle className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Help & Support</p>
                          <p className="text-xs text-gray-500">Get assistance</p>
                        </div>
                      </button>
                    </div>

                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <div className="mb-3 px-3 py-2 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Last activity</p>
                        <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <HiClock className="w-3 h-3" />
                          {lastActivity ? new Date(lastActivity.time).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <HiArrowRightOnRectangle className="w-5 h-5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>
        </div>

        {/* Activity Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <HiEye className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">127</span> visitors online
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HiBolt className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">8</span> active cases
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RiLightbulbFlashFill className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">3</span> new insights
                </span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
              <HiGlobeAlt className="w-4 h-4" />
              <span>Milwaukee, WI</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for dropdowns */}
      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </>
  );
}