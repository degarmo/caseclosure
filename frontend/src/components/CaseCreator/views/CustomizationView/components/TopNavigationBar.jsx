// @/components/CaseCreator/views/CustomizationView/components/TopNavigationBar.jsx

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Bug,
  RefreshCw,
  Eye,
  Edit3,
  Monitor
} from 'lucide-react';
import PageSelector from './PageSelector';
import ActionButtons from './ActionButtons';
import SaveStatusIndicator from './SaveStatusIndicator';

/**
 * Edit Mode Toggle Component
 */
const EditModeToggle = ({ isEditMode, onToggle }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onToggle(true)}
        className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
          isEditMode 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
        aria-pressed={isEditMode}
      >
        <Edit3 className="w-4 h-4" />
        Edit
      </button>
      <button
        onClick={() => onToggle(false)}
        className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
          !isEditMode 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
        aria-pressed={!isEditMode}
      >
        <Eye className="w-4 h-4" />
        Preview
      </button>
    </div>
  );
};

/**
 * Top navigation bar component with all controls
 */
const TopNavigationBar = ({
  // Navigation
  onPrevious,
  onContinue,
  
  // Page controls
  currentPage,
  availablePages,
  onPageChange,
  
  // Mode controls
  isEditMode,
  onEditModeToggle,
  previewScale,
  onScaleChange,
  zoomPresets,
  
  // Status indicators
  dataRefreshNeeded,
  saveStatus,
  unsavedChanges,
  isSaving,
  deploymentStatus,
  isDeploying,
  autoSaveStatus,
  
  // Actions
  onSave,
  onPreview,
  onDeploy,
  onRefreshData,
  
  // Debug
  showDebug,
  onDebugToggle,
  
  // Additional props
  className = '',
  showBackButton = true,
  showContinueButton = true
}) => {
  return (
    <div className={`sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section: Navigation & Page Controls */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <>
                <button
                  onClick={onPrevious}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                
                <div className="h-6 w-px bg-gray-300" aria-hidden="true" />
              </>
            )}
            
            {availablePages && onPageChange && (
              <PageSelector
                currentPage={currentPage}
                availablePages={availablePages}
                onChange={onPageChange}
              />
            )}
            
            {/* Debug Toggle */}
            {onDebugToggle && (
              <button
                onClick={onDebugToggle}
                className={`
                  p-1.5 rounded transition-colors
                  ${showDebug 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
                title="Toggle debug panel"
                aria-label="Toggle debug panel"
                aria-pressed={showDebug}
              >
                <Bug className="w-4 h-4" />
              </button>
            )}
            
            {/* Data Refresh Button */}
            {dataRefreshNeeded && onRefreshData && (
              <button
                onClick={onRefreshData}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                aria-label="Refresh form data"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Form data updated
              </button>
            )}
          </div>
          
          {/* Center Section: Edit/Preview Toggle */}
          <div className="flex items-center gap-4">
            <EditModeToggle
              isEditMode={isEditMode}
              onToggle={onEditModeToggle}
            />
            
            {/* Zoom Control in Preview Mode */}
            {!isEditMode && zoomPresets && (
              <select
                value={previewScale}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Preview scale"
              >
                {zoomPresets.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Right Section: Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            <SaveStatusIndicator
              saveStatus={saveStatus}
              unsavedChanges={unsavedChanges}
              autoSaveStatus={autoSaveStatus}
              deploymentStatus={deploymentStatus}
              isDeploying={isDeploying}
            />
            
            {/* Action Buttons */}
            <ActionButtons
              onPreview={onPreview}
              onSave={onSave}
              onContinue={onContinue}
              isSaving={isSaving}
              unsavedChanges={unsavedChanges}
              showContinueButton={showContinueButton}
            />
          </div>
        </div>
      </div>
      
      {/* Auto-save progress bar */}
      {autoSaveStatus?.isAutoSaving && (
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: '100%' }}
          >
            <div className="h-full bg-white/30 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TopNavigationBar;