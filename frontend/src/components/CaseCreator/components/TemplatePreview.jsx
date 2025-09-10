// @/components/CaseCreator/views/CustomizationView/components/TemplatePreview.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const TemplatePreview = ({
  CurrentPageComponent,
  caseData,
  customizations,
  isEditMode,
  previewScale = 1,
  onCustomizationChange,
  showGrid = false,
  showRulers = false,
  devicePreset = 'desktop',
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const previewRef = useRef(null);
  const imageErrorCountRef = useRef(0);

  // Global error handler for the preview container
  const handleGlobalError = useCallback((event) => {
    // Prevent image errors from bubbling up
    if (event.target && event.target.tagName === 'IMG') {
      event.stopPropagation();
      event.preventDefault();
      
      // Replace failed image with placeholder
      if (event.target.onerror) {
        event.target.onerror = null;
      }
      
      // Set placeholder based on image size
      const width = event.target.width || 400;
      const height = event.target.height || 300;
      event.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"%3E%3Crect width="${width}" height="${height}" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImage Unavailable%3C/text%3E%3C/svg%3E`;
      
      // Track image errors but don't treat as component errors
      imageErrorCountRef.current += 1;
      console.log(`Image load failed (${imageErrorCountRef.current} total), replaced with placeholder`);
      
      return false; // Prevent default error handling
    }
    
    // For non-image errors, handle as component error
    console.error('Template preview component error:', event);
    setHasError(true);
    setErrorMessage(event.message || 'An error occurred in the preview');
    
    if (onError && event.target?.tagName !== 'IMG') {
      onError(event);
    }
  }, [onError]);

  // Set up error handling
  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    // Capture all errors in preview container
    const handleError = (e) => {
      e.stopPropagation();
      handleGlobalError(e);
      return false;
    };

    // Add error listener with capture to catch errors early
    container.addEventListener('error', handleError, true);
    
    return () => {
      if (container) {
        container.removeEventListener('error', handleError, true);
      }
    };
  }, [handleGlobalError]);

  // Reset error state when component changes
  useEffect(() => {
    setHasError(false);
    setErrorMessage('');
    imageErrorCountRef.current = 0;
  }, [CurrentPageComponent]);

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

  // Render error state for component errors (not image errors)
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
              imageErrorCountRef.current = 0;
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

  // Check if component exists
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

  // Wrap the component with error boundary props
  const componentProps = {
    caseData: caseData || {},
    customizations: customizations || {},
    isEditing: isEditMode,
    onCustomizationChange: onCustomizationChange,
    // Add image error handler to props
    onImageError: (e) => {
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3EImage Unavailable%3C/text%3E%3C/svg%3E';
      }
    }
  };

  return (
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

      {/* Device frame for mobile/tablet */}
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
                <CurrentPageComponent {...componentProps} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full width for desktop */}
      {devicePreset === 'desktop' && (
        <div className="w-full" style={scaleStyle}>
          <CurrentPageComponent {...componentProps} />
        </div>
      )}

      {/* Edit mode overlay indicator */}
      {isEditMode && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm">
          Click on elements with + icons to edit
        </div>
      )}

      {/* Image error counter (development only) */}
      {process.env.NODE_ENV === 'development' && imageErrorCountRef.current > 0 && (
        <div className="fixed top-20 right-4 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg shadow-md z-50 text-xs">
          {imageErrorCountRef.current} image(s) failed to load
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;