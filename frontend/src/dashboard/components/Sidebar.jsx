// src/pages/dashboard/components/Sidebar.jsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Fingerprint, LogOut, Plus } from 'lucide-react';

export default function Sidebar({ 
  navItems, 
  collapsed, 
  onToggle, 
  user, 
  onLogout,
  isAdmin = false 
}) {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('overview');

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleItemClick = (item, subItem = null) => {
    const sectionId = subItem ? subItem.id : item.id;
    setActiveSection(sectionId);
    
    if (subItem?.onClick) {
      subItem.onClick();
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <aside className={`fixed left-0 top-0 h-full ${collapsed ? 'w-20' : 'w-72'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 shadow-xl flex flex-col`}>
      {/* Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'Admin' : 'Command'}
              </h1>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Control Panel' : 'Intelligence Platform'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <div key={item.id}>
            {/* Main Item */}
            <button
              onClick={() => {
                if (item.expandable) {
                  toggleSection(item.id);
                } else {
                  handleItemClick(item);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                activeSection === item.id || (item.expandable && activeSection.startsWith(item.id))
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </div>
              {!collapsed && (
                <div className="flex items-center gap-2">
                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      activeSection === item.id || (item.expandable && activeSection.startsWith(item.id))
                        ? 'bg-white/20 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.expandable && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      expandedSections[item.id] ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>
              )}
            </button>

            {/* Sub Items */}
            {item.expandable && expandedSections[item.id] && !collapsed && (
              <div className="ml-4 mt-2 space-y-1">
                {/* Header Action (e.g., Create Case) */}
                {item.headerAction && (
                  <button
                    onClick={item.headerAction.onClick}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-600 dark:text-purple-400 transition-all"
                  >
                    <item.headerAction.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.headerAction.label}</span>
                  </button>
                )}

                {/* Sub Items List */}
                {item.subItems?.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => handleItemClick(item, subItem)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                      activeSection === subItem.id
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {subItem.icon && <subItem.icon className="w-4 h-4" />}
                      <span className="text-sm font-medium">{subItem.label}</span>
                    </div>
                    {subItem.badge > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        subItem.badge > 0 && subItem.id.includes('request')
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {subItem.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.first_name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'Administrator' : 'Investigator'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}