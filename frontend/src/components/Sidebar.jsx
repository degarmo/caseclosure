import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome, FiUser, FiSettings, FiMap, FiMessageCircle, FiFileText, FiChevronDown, FiFolder, FiPlusCircle, FiList, FiShield
} from "react-icons/fi";

// Standard sections for all users
const menu = [
  {
    section: "Dashboard",
    icon: <FiHome />,
    to: "/dashboard",
  },
  {
    section: "Cases",
    icon: <FiFolder />,
    children: [
      { label: "Create Case", icon: <FiPlusCircle />, to: "/case-builder" }
      // "Case List" is admin-only (see below)
    ]
  },
  {
    section: "Account",
    icon: <FiUser />,
    children: [
      { label: "User Settings", to: "/settings/user" }
    ]
  },
  {
    section: "Messages/Tips",
    icon: <FiMessageCircle />,
    children: [
      { label: "Inbox", to: "/messages/inbox" },
      { label: "Tip Settings", to: "/messages/settings" }
    ]
  },
  {
    section: "Reports",
    icon: <FiFileText />,
    children: [
      { label: "Current Reports", to: "/reports/current" },
      { label: "Create Report", to: "/reports/create" }
    ]
  },
  {
    section: "Dashboard Settings",
    icon: <FiSettings />,
    to: "/dashboard/settings",
  },
  {
    section: "Maps",
    icon: <FiMap />,
    children: [
      { label: "Map View", to: "/maps" },
      { label: "Map Settings", to: "/maps/settings" }
    ]
  },
];

// Admin-only section(s)
const adminMenu = [
  {
    section: "Admin",
    icon: <FiShield />,
    children: [
      { label: "Case List", icon: <FiList />, to: "/cases/list" }
      // Add more admin-only items here in the future!
    ]
  }
];

export default function Sidebar({ user }) {
  console.log("Sidebar user:", user);
  const location = useLocation();
  const [open, setOpen] = useState({});

  // Determine admin status based on Django user fields
  const isAdmin = user?.is_staff || user?.is_superuser;
  const fullMenu = isAdmin ? [...menu, ...adminMenu] : menu;

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  return (
    <aside className="w-60 min-h-screen bg-white border-r shadow-lg flex flex-col">
      <div className="p-6 flex items-center gap-2 font-bold text-lg">
        <span className="bg-blue-600 text-white rounded-full px-3 py-2">
          {user?.first_name?.[0]?.toUpperCase() || "?"}
        </span>
        <span>
          Welcome, {user?.first_name ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1) : "User"}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {fullMenu.map((item, idx) => (
          <div key={idx} className="mb-1">
            {item.to ? (
              <Link
                to={item.to}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 ${
                  isActive(item.to) ? "bg-blue-100 font-bold" : ""
                }`}
              >
                {item.icon}
                {item.section}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setOpen((o) => ({ ...o, [idx]: !o[idx] }))}
                  className="flex w-full items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 focus:outline-none"
                  type="button"
                >
                  {item.icon}
                  {item.section}
                  <FiChevronDown
                    className={`ml-auto transition-transform ${
                      open[idx] ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {item.children && open[idx] && (
                  <div className="pl-10">
                    {item.children.map((child, childIdx) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-blue-50 text-sm ${
                          isActive(child.to) ? "bg-blue-100 font-bold" : ""
                        }`}
                      >
                        {child.icon}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-400">
        Building justice, one story at a time.
      </div>
    </aside>
  );
}
