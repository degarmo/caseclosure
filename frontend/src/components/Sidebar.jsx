import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  HiHome, HiFolder, HiUser, HiChatBubbleLeftRight, 
  HiDocumentText, HiCog, HiMap, HiShieldCheck,
  HiChevronDown, HiChevronRight, HiPlus, HiListBullet,
  HiSparkles, HiEye, HiDocumentPlus, HiPencilSquare,
  HiBell, HiInbox, HiChartBar, HiGlobeAlt,
  HiExclamationTriangle, HiLightBulb, HiFingerPrint
} from "react-icons/hi2";
import { 
  RiDashboardFill, RiFolderOpenFill, RiUserSettingsFill,
  RiMessage3Fill, RiFileTextFill, RiSettings4Fill,
  RiMapPinFill, RiShieldStarFill, RiAddCircleFill
} from "react-icons/ri";
import api from "@/utils/axios";
import CaseCreationModal from "@/pages/CaseBuilder/CaseCreationModal";
import CaseDetailsModal from "@/pages/CaseBuilder/CaseDetailsModal";

const menu = [
  { 
    section: "Dashboard", 
    icon: <RiDashboardFill className="w-6 h-6" />, 
    activeIcon: <HiSparkles className="w-6 h-6" />,
    to: "/dashboard",
    description: "Intelligence Overview"
  },
  { 
    section: "Cases", 
    icon: <RiFolderOpenFill className="w-6 h-6" />,
    activeIcon: <HiFolder className="w-6 h-6" />,
    description: "Manage Your Cases"
  },
  {
    section: "Account",
    icon: <RiUserSettingsFill className="w-6 h-6" />,
    activeIcon: <HiUser className="w-6 h-6" />,
    description: "Profile & Settings",
    children: [
      { 
        label: "User Settings", 
        to: "/settings/user",
        icon: <HiCog className="w-5 h-5" />
      }
    ]
  },
  {
    section: "Messages/Tips",
    icon: <RiMessage3Fill className="w-6 h-6" />,
    activeIcon: <HiChatBubbleLeftRight className="w-6 h-6" />,
    description: "Tips & Communications",
    children: [
      { 
        label: "Inbox", 
        to: "/messages/inbox",
        icon: <HiInbox className="w-5 h-5" />,
        badge: "new"
      },
      { 
        label: "Tip Settings", 
        to: "/messages/settings",
        icon: <HiBell className="w-5 h-5" />
      }
    ]
  },
  {
    section: "Reports",
    icon: <RiFileTextFill className="w-6 h-6" />,
    activeIcon: <HiDocumentText className="w-6 h-6" />,
    description: "Analytics & Insights",
    children: [
      { 
        label: "Current Reports", 
        to: "/reports/current",
        icon: <HiChartBar className="w-5 h-5" />
      },
      { 
        label: "Create Report", 
        to: "/reports/create",
        icon: <HiDocumentPlus className="w-5 h-5" />
      }
    ]
  },
  { 
    section: "Dashboard Settings", 
    icon: <RiSettings4Fill className="w-6 h-6" />,
    activeIcon: <HiCog className="w-6 h-6" />,
    to: "/dashboard/settings",
    description: "Configure Dashboard"
  },
  {
    section: "Maps",
    icon: <RiMapPinFill className="w-6 h-6" />,
    activeIcon: <HiMap className="w-6 h-6" />,
    description: "Geographic Intelligence",
    children: [
      { 
        label: "Map View", 
        to: "/maps",
        icon: <HiGlobeAlt className="w-5 h-5" />
      },
      { 
        label: "Map Settings", 
        to: "/maps/settings",
        icon: <HiCog className="w-5 h-5" />
      }
    ]
  },
];

const adminMenu = [
  {
    section: "Admin Panel",
    icon: <RiShieldStarFill className="w-6 h-6" />,
    activeIcon: <HiShieldCheck className="w-6 h-6" />,
    description: "Administrative Tools",
    isAdmin: true,
    children: [
      { 
        label: "All Cases", 
        icon: <HiListBullet className="w-5 h-5" />, 
        to: "/cases/list" 
      },
      { 
        label: "User Management", 
        icon: <HiUser className="w-5 h-5" />, 
        to: "/admin/users" 
      },
      { 
        label: "Security Alerts", 
        icon: <HiExclamationTriangle className="w-5 h-5" />, 
        to: "/admin/security",
        badge: "alert"
      }
    ]
  }
];

export default function Sidebar({ 
  user, 
  showCaseModal = false, 
  onOpenCaseModal, 
  onCloseCaseModal 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const [caseOpen, setCaseOpen] = useState({});
  const [userCases, setUserCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipCount, setTipCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  
  // Case details modal state (local to sidebar)
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cases
        const casesRes = await api.get("/cases/");
        const data = casesRes.data.results || casesRes.data;
        const filtered = Array.isArray(data)
          ? data.filter(c => String(c.user) === String(user.id))
          : [];
        setUserCases(filtered);

        // Try to fetch tip count
        try {
          const tipsRes = await api.get("/messages/unread-count/");
          setTipCount(tipsRes.data.count || 0);
        } catch (e) {
          // Endpoint might not exist yet
          setTipCount(3); // Demo value
        }

        // Try to fetch alert count for admins
        if (user?.is_staff || user?.is_superuser) {
          try {
            const alertsRes = await api.get("/admin/alerts-count/");
            setAlertCount(alertsRes.data.count || 0);
          } catch (e) {
            setAlertCount(2); // Demo value
          }
        }

      } catch (error) {
        console.error("Error fetching sidebar data:", error);
        setUserCases([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, user?.is_staff, user?.is_superuser]);

  const isAdmin = user?.is_staff || user?.is_superuser;
  const fullMenu = isAdmin ? [...menu, ...adminMenu] : menu;

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  const getCaseStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'monitoring': return 'bg-yellow-500';
      case 'cold': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCaseActivityIcon = (lastActivity) => {
    // If activity within last 24 hours
    const lastUpdate = new Date(lastActivity);
    const now = new Date();
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return <HiExclamationTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
    } else if (hoursDiff < 168) { // 1 week
      return <HiEye className="w-4 h-4 text-yellow-500" />;
    }
    return null;
  };

  const handleCaseModalComplete = (caseData) => {
    console.log("Case creation completed:", caseData);
    onCloseCaseModal?.();
    
    // Refresh cases list
    const fetchCases = async () => {
      try {
        const casesRes = await api.get("/cases/");
        const data = casesRes.data.results || casesRes.data;
        const filtered = Array.isArray(data)
          ? data.filter(c => String(c.user) === String(user.id))
          : [];
        setUserCases(filtered);
      } catch (error) {
        console.error("Error refreshing cases:", error);
      }
    };
    
    fetchCases();
    
    // Navigate to case builder with the new case
    if (caseData.id) {
      navigate(`/case-builder/${caseData.id}`);
    }
  };

  // Add handler for showing case details
  const handleShowCaseDetails = (caseId) => {
    setSelectedCaseId(caseId);
    setShowCaseDetailsModal(true);
  };

  const handleCaseClick = (caseId) => {
    navigate(`/case-builder/${caseId}`);
  };

  return (
    <>
      <aside className="w-80 min-h-screen bg-gradient-to-b from-white to-gray-50 border-r-2 border-gray-100 shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                {user?.first_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Welcome back,
              </h2>
              <p className="text-lg opacity-90">
                {user?.first_name ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) : "Investigator"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 flex-1">
              <p className="text-xs opacity-75">Active Cases</p>
              <p className="text-lg font-bold">{userCases.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 flex-1">
              <p className="text-xs opacity-75">New Tips</p>
              <p className="text-lg font-bold">{tipCount}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {fullMenu.map((item, idx) => (
            <div key={idx} className="mb-2">
              {item.section === "Cases" ? (
                <>
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [idx]: !o[idx] }))}
                    className={`flex w-full items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 transition-all duration-200 group ${
                      open[idx] ? 'bg-blue-50' : ''
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-transform duration-200 ${open[idx] ? 'text-blue-600 scale-110' : ''}`}>
                        {open[idx] ? item.activeIcon || item.icon : item.icon}
                      </div>
                      <div className="text-left">
                        <span className="text-base font-semibold block">{item.section}</span>
                        <span className="text-xs text-gray-500">{item.description}</span>
                      </div>
                    </div>
                    <HiChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        open[idx] ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {open[idx] && (
                    <div className="mt-2 ml-4 space-y-1">
                      <button
                        onClick={onOpenCaseModal}
                        className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-green-50 text-sm font-medium transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-green-400 w-full text-left group"
                      >
                        <RiAddCircleFill className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="text-gray-700 group-hover:text-green-700">Create New Case</span>
                        <HiLightBulb className="w-4 h-4 text-yellow-500 ml-auto" />
                      </button>
                      
                      {/* User's Cases */}
                      {loading ? (
                        <div className="py-3 px-4 text-sm text-gray-500">
                          Loading cases...
                        </div>
                      ) : userCases.length > 0 ? (
                        userCases.map((c) => (
                          <div key={c.id} className="mb-1">
                            <button
                              onClick={() => setCaseOpen(o => ({ ...o, [c.id]: !o[c.id] }))}
                              className={`flex w-full items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200 ${
                                caseOpen[c.id] ? 'bg-gray-50' : ''
                              }`}
                              type="button"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <HiFolder className="w-5 h-5 text-gray-600" />
                                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getCaseStatusColor(c.status)}`} />
                                </div>
                                <div className="text-left flex-1">
                                  <span className="text-sm font-semibold text-gray-800 block">
                                    {c.victim_name || c.name || `${c.first_name} ${c.last_name}` || "Untitled"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Case #{c.id}
                                  </span>
                                </div>
                                {getCaseActivityIcon(c.updated_at)}
                              </div>
                              <HiChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  caseOpen[c.id] ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                            {caseOpen[c.id] && (
                              <div className="ml-8 mt-1 space-y-1">
                                <Link
                                  to={`/builder/${c.id}`}
                                  className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-100 text-xs font-medium transition-all duration-200 ${
                                    isActive(`/builder/${c.id}`) ? "bg-blue-100 text-blue-700" : "text-gray-600"
                                  }`}
                                >
                                  <HiPencilSquare className="w-4 h-4" />
                                  Template Builder
                                </Link>
                                {/* Updated Case Details button to show modal instead of navigating */}
                                <button
                                  onClick={() => handleShowCaseDetails(c.id)}
                                  className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-blue-100 text-xs font-medium transition-all duration-200 text-gray-600 w-full text-left"
                                >
                                  <HiDocumentText className="w-4 h-4" />
                                  Case Details
                                </button>
                                <Link
                                  to={`/case-analytics/${c.id}`}
                                  className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-purple-100 text-xs font-medium transition-all duration-200 ${
                                    isActive(`/case-analytics/${c.id}`) ? "bg-purple-100 text-purple-700" : "text-gray-600"
                                  }`}
                                >
                                  <HiFingerPrint className="w-4 h-4" />
                                  Analytics
                                </Link>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-3 px-4 text-sm text-gray-500 text-center">
                          No cases yet
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : item.to ? (
                <Link
                  to={item.to}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 group ${
                    isActive(item.to) ? "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 ${isActive(item.to) ? 'text-blue-600 scale-110' : 'text-gray-600'}`}>
                      {isActive(item.to) ? item.activeIcon || item.icon : item.icon}
                    </div>
                    <div className="text-left">
                      <span className={`text-base font-semibold block ${isActive(item.to) ? 'text-blue-700' : 'text-gray-700'}`}>
                        {item.section}
                      </span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                  </div>
                  {item.isAdmin && (
                    <HiShieldCheck className="w-4 h-4 text-purple-500" />
                  )}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [idx]: !o[idx] }))}
                    className={`flex w-full items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 transition-all duration-200 group ${
                      open[idx] ? 'bg-blue-50' : ''
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-transform duration-200 ${open[idx] ? 'text-blue-600 scale-110' : ''}`}>
                        {open[idx] ? item.activeIcon || item.icon : item.icon}
                      </div>
                      <div className="text-left">
                        <span className="text-base font-semibold block">{item.section}</span>
                        <span className="text-xs text-gray-500">{item.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.section === "Messages/Tips" && tipCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {tipCount}
                        </span>
                      )}
                      {item.isAdmin && alertCount > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                          {alertCount}
                        </span>
                      )}
                      <HiChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          open[idx] ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </div>
                  </button>
                  {item.children && open[idx] && (
                    <div className="mt-2 ml-12 space-y-1">
                      {item.children.map((child, childIdx) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`flex items-center justify-between py-2 px-4 rounded-lg hover:bg-blue-50 text-sm font-medium transition-all duration-200 ${
                            isActive(child.to) ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700" : "text-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {child.icon}
                            <span>{child.label}</span>
                          </div>
                          {child.badge === 'new' && tipCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {tipCount}
                            </span>
                          )}
                          {child.badge === 'alert' && alertCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {alertCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3 mb-3">
            <HiLightBulb className="w-5 h-5 text-yellow-500" />
            <p className="text-sm font-medium text-gray-700">Pro Tip</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Check your case analytics regularly to identify visitor patterns and potential leads.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              "Illuminating paths to justice, one case at a time."
            </p>
          </div>
        </div>
      </aside>

      {/* Case Creation Modal - controlled by App.jsx */}
      <CaseCreationModal 
        isOpen={showCaseModal}
        onClose={onCloseCaseModal}
        onComplete={handleCaseModalComplete}
      />

      {/* Case Details Modal - local to sidebar */}
      <CaseDetailsModal
        isOpen={showCaseDetailsModal}
        onClose={() => setShowCaseDetailsModal(false)}
        caseId={selectedCaseId}
      />
    </>
  );
}