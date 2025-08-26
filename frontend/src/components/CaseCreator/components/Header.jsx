// src/components/CaseCreator/components/Header.jsx

import React, { useCallback } from 'react';
import { X, User, Layout, Edit3, Eye } from 'lucide-react';
import NavigationTabs from './NavigationTabs';

// Define tabs directly to avoid circular import
const VIEW_TABS = [
  { id: 'form', label: 'Information', iconName: 'User' },
  { id: 'template', label: 'Template', iconName: 'Layout' },
  { id: 'customize', label: 'Customize', iconName: 'Edit3' },
  { id: 'preview', label: 'Preview', iconName: 'Eye' }
];

/**
 * Header Component
 * Main header for the case creator with title and navigation
 * 
 * @param {Object} caseData - Current case data
 * @param {string} activeView - Currently active view
 * @param {function} onViewChange - Callback when view changes
 * @param {function} onClose - Callback to close the case creator
 * @param {function} validateSection - Function to validate current section
 * @param {Object} selectedTemplate - Currently selected template
 */
const Header = ({ 
  caseData, 
  activeView, 
  onViewChange, 
  onClose,
  validateSection,
  selectedTemplate
}) => {
  
  // Determine if navigation to a specific tab is allowed
  const canNavigate = useCallback((tabId) => {
    switch (tabId) {
      case 'form':
        return true;
      case 'template':
        // Don't validate during render, just check if basic data exists
        return !!(caseData.first_name && caseData.last_name && caseData.crime_type);
      case 'customize':
        return selectedTemplate !== null;
      case 'preview':
        return selectedTemplate !== null;
      default:
        return false;
    }
  }, [caseData.first_name, caseData.last_name, caseData.crime_type, selectedTemplate]);
  
  const getCaseTitle = () => {
    if (caseData.first_name && caseData.last_name) {
      return `Case: ${caseData.first_name} ${caseData.last_name}`;
    }
    return 'Create New Case';
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {getCaseTitle()}
          </h1>
          
          <NavigationTabs
            tabs={VIEW_TABS}
            activeTab={activeView}
            onTabChange={onViewChange}
            canNavigate={canNavigate}
          />
        </div>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Close case creator"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default Header;