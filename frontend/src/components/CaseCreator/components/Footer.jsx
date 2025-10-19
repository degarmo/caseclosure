// src/components/CaseCreator/components/Footer.jsx

import React from 'react';
import { 
  Save, ChevronRight, Eye, Rocket, Loader2, Check, ChevronLeft, Edit
} from 'lucide-react';

/**
 * Footer Component
 * Footer with save and navigation actions
 * 
 * @param {string} activeView - Current active view
 * @param {boolean} saving - Whether save is in progress
 * @param {boolean} loading - Whether deploy is in progress
 * @param {string} caseId - Case ID if saved
 * @param {Object} selectedTemplate - Selected template
 * @param {function} onSave - Save callback
 * @param {function} onNavigate - Navigation callback
 * @param {function} onDeploy - Deploy callback
 * @param {function} validateSection - Validation function
 * @param {boolean} isEditMode - Whether in edit mode
 */
const Footer = ({ 
  activeView,
  saving,
  loading,
  caseId,
  selectedTemplate,
  onSave,
  onNavigate,
  onDeploy,
  validateSection,
  isEditMode = false
}) => {

  
  const handleNavigation = (direction) => {
    const views = ['form', 'template', 'customize', 'preview'];
    const currentIndex = views.indexOf(activeView);
    
    if (direction === 'next') {
      if (currentIndex < views.length - 1) {
        if (activeView === 'form') {
          // In edit mode, validate and navigate to template (which will redirect to editor)
          if (validateSection()) {
            onNavigate('template');
          }
        } else if (activeView === 'template' && selectedTemplate) {
          onNavigate('customize');
        } else if (activeView === 'customize') {
          onNavigate(views[currentIndex + 1]);
        }
      }
    } else if (direction === 'back' && currentIndex > 0) {
      onNavigate(views[currentIndex - 1]);
    }
  };
  
  const handleCustomizeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof onNavigate === 'function') {
      onNavigate('customize');
    } else {
      console.error('onNavigate is not a function:', onNavigate);
    }
  };
  
  const renderActions = () => {
    // Edit mode - only show form view actions
    if (isEditMode) {
      if (activeView === 'form') {
        return (
          <button
            type='button'
            onClick={() => handleNavigation('next')}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update Website
                <Edit className="w-4 h-4" />
              </>
            )}
          </button>
        );
      }
      // Don't show other views in edit mode
      return null;
    }
    
    // Create mode - existing logic
    switch (activeView) {
      case 'form':
        return (
          <button
            type='button'
            onClick={() => handleNavigation('next')}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium flex items-center gap-2"
          >
            Continue to Template
            <ChevronRight className="w-4 h-4" />
          </button>
        );
        
      case 'template':
        return (
          <button
            type="button"
            onClick={handleCustomizeClick}
            disabled={!selectedTemplate || saving}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Customize Template
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        );
        
      case 'customize':
        return (
          <button
            type="button"
            onClick={() => handleNavigation('next')}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium flex items-center gap-2"
          >
            Preview Website
            <Eye className="w-4 h-4" />
          </button>
        );
        
      case 'preview':
        return (
          <button
            type='button'
            onClick={onDeploy}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Deploy Website
              </>
            )}
          </button>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-200 px-6 py-4 bg-white">
      <div className="flex items-center justify-between">
        {/* Left side - Save button and status */}
        <div className="flex items-center gap-2">
          <button
            type='button'
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Save Changes' : 'Save'}</span>
              </>
            )}
          </button>
          
          {caseId && !saving && (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">
                {isEditMode ? 'Changes Saved' : 'Saved'}
              </span>
            </>
          )}
          
          {isEditMode && caseId && (
            <span className="text-sm text-gray-500 ml-2">
              Editing Case ID: {caseId}
            </span>
          )}
        </div>
        
        {/* Right side - Navigation */}
        <div className="flex items-center gap-3">
          {activeView !== 'form' && !isEditMode && (
            <button
              type='button'
              onClick={() => handleNavigation('back')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          
          {renderActions()}
        </div>
      </div>
    </div>
  );
};

export default Footer;