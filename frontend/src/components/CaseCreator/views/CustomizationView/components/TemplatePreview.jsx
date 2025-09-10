// @/components/CaseCreator/views/CustomizationView/components/TemplatePreview.jsx
// Fixed version that prevents unnecessary unmounting

import React, { useEffect, useRef, useState, memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Memoize the entire component to prevent re-renders
const TemplatePreview = memo(({
  CurrentPageComponent,
  caseData,
  customizations,
  isEditMode,
  previewScale = 1,
  onCustomizationChange,
  onEditSection,
  onError,
  showGrid = false,
  showRulers = false,
  devicePreset = 'desktop'
}) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const previewRef = useRef(null);
  const mountedRef = useRef(true);

  // Track mount/unmount - should only happen once
  useEffect(() => {
    console.log('TemplatePreview mounted');
    mountedRef.current = true;
    
    return () => {
      console.log('TemplatePreview unmounting');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  // Handle errors
  const handleError = (event) => {
    // Ignore image errors
    if (event.target && event.target.tagName === 'IMG') {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    
    console.error('Template preview error:', event);
    if (mountedRef.current) {
      setHasError(true);
      setErrorMessage(event.message || 'An error occurred in the preview');
    }
    
    if (onError) {
      onError(event);
    }
  };

  // Set up error handling
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    container.addEventListener('error', handleError, true);
    return () => {
      if (container) {
        container.removeEventListener('error', handleError, true);
      }
    };
  }, []); // Empty dependency array

  // Calculate device dimensions
  const getDeviceDimensions = () => {
    switch (devicePreset) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getDeviceDimensions();
  const scaleStyle = devicePreset === 'desktop' 
    ? { transform: `scale(${previewScale})`, transformOrigin: 'top left' }
    : {};

  // Error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Preview Error</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No component state
  if (!CurrentPageComponent) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Template Selected</h3>
          <p className="text-gray-600">Please select a template page to preview</p>
        </div>
      </div>
    );
  }

  // Main render - wrap in a stable div to prevent unmounting
  return (
    <div className="template-preview-stable-wrapper">
      <div className="relative bg-gray-100 min-h-screen" ref={previewRef}>
        {/* Grid overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0px, transparent 1px, transparent 20px, #e5e7eb 21px), repeating-linear-gradient(90deg, #e5e7eb 0px, transparent 1px, transparent 20px, #e5e7eb 21px)',
              opacity: 0.3
            }}
          />
        )}

        {/* Rulers */}
        {showRulers && (
          <>
            <div className="absolute top-0 left-0 right-0 h-6 bg-white border-b border-gray-300 z-20" />
            <div className="absolute top-0 left-0 bottom-0 w-6 bg-white border-r border-gray-300 z-20" />
          </>
        )}

        {/* Component render */}
        <div className="template-component-container">
          {devicePreset !== 'desktop' && (
            <div className="flex justify-center p-8">
              <div 
                className="bg-white rounded-lg shadow-2xl overflow-hidden"
                style={{
                  width: dimensions.width,
                  height: dimensions.height,
                  maxWidth: '100%'
                }}
              >
                <div className="h-full overflow-auto">
                  <div style={scaleStyle}>
                    <CurrentPageComponent 
                      caseData={caseData}
                      customizations={customizations}
                      isEditing={isEditMode}
                      onCustomizationChange={onCustomizationChange}
                      onEditSection={onEditSection}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {devicePreset === 'desktop' && (
            <div className="w-full" style={scaleStyle}>
              <CurrentPageComponent 
                caseData={caseData}
                customizations={customizations}
                isEditing={isEditMode}
                onCustomizationChange={onCustomizationChange}
                onEditSection={onEditSection}
              />
            </div>
          )}
        </div>

        {/* Edit mode overlay indicator */}
        {isEditMode && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm">
            Click on elements with + icons to edit
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Only re-render if these specific props change meaningfully
  return (
    prevProps.CurrentPageComponent === nextProps.CurrentPageComponent &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.previewScale === nextProps.previewScale &&
    prevProps.showGrid === nextProps.showGrid &&
    prevProps.showRulers === nextProps.showRulers &&
    prevProps.devicePreset === nextProps.devicePreset &&
    // Deep compare only if objects actually changed
    JSON.stringify(prevProps.caseData) === JSON.stringify(nextProps.caseData) &&
    JSON.stringify(prevProps.customizations) === JSON.stringify(nextProps.customizations)
  );
});

TemplatePreview.displayName = 'TemplatePreview';

export default TemplatePreview;