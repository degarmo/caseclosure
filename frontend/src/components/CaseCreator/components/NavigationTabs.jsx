// src/components/CaseCreator/components/NavigationTabs.jsx

import React from 'react';
import { User, Layout, Edit3, Eye } from 'lucide-react';

const iconMap = {
  User,
  Layout,
  Edit3,
  Eye
};

/**
 * NavigationTabs Component
 * Handles tab navigation for the case creator
 * 
 * @param {Array} tabs - Array of tab configurations
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onTabChange - Callback when tab is clicked
 * @param {function} canNavigate - Function to check if navigation is allowed
 */
const NavigationTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  canNavigate = () => true 
}) => {
  
  const handleTabClick = (tabId) => {
    if (canNavigate(tabId)) {
      onTabChange(tabId);
    }
  };

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => {
        const IconComponent = iconMap[tab.iconName];
        const isActive = activeTab === tab.id;
        const isDisabled = !canNavigate || !canNavigate(tab.id);
        
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && handleTabClick(tab.id)}
            disabled={isDisabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm
              ${isActive 
                ? 'bg-gray-900 text-white' 
                : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span className="font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default NavigationTabs;