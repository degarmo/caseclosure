// @/components/CaseCreator/views/CustomizationView/hooks/usePreviewMode.js

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for managing preview mode and scale
 * @param {Object} options - Preview options
 * @returns {Object} Preview state and handlers
 */
export const usePreviewMode = (options = {}) => {
  const {
    defaultScale = 1,
    defaultMode = 'edit', // 'edit' or 'preview'
    onModeChange = null,
    onScaleChange = null,
    enableKeyboardShortcuts = true
  } = options;

  // Preview state
  const [isEditMode, setIsEditMode] = useState(defaultMode === 'edit');
  const [previewScale, setPreviewScale] = useState(defaultScale);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [highlightEditableAreas, setHighlightEditableAreas] = useState(true);

  // Refs for DOM manipulation
  const previewContainerRef = useRef(null);
  const scaleTimeoutRef = useRef(null);

  // Device presets
  const devicePresets = {
    desktop: {
      width: 1440,
      height: 900,
      scale: 1,
      label: 'Desktop (1440px)'
    },
    laptop: {
      width: 1366,
      height: 768,
      scale: 0.95,
      label: 'Laptop (1366px)'
    },
    tablet: {
      width: 768,
      height: 1024,
      scale: 0.75,
      label: 'Tablet (768px)'
    },
    mobile: {
      width: 375,
      height: 812,
      scale: 0.5,
      label: 'Mobile (375px)'
    }
  };

  // Zoom presets
  const zoomPresets = [
    { value: 0.25, label: '25%' },
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2, label: '200%' }
  ];

  // Toggle between edit and preview mode
  const toggleMode = useCallback(() => {
    setIsEditMode(prev => {
      const newMode = !prev;
      if (onModeChange) {
        onModeChange(newMode ? 'edit' : 'preview');
      }
      return newMode;
    });
  }, [onModeChange]);

  // Set specific mode
  const setMode = useCallback((mode) => {
    const isEdit = mode === 'edit';
    setIsEditMode(isEdit);
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [onModeChange]);

  // Update preview scale with smooth transition
  const updateScale = useCallback((newScale) => {
    // Clamp scale between 0.1 and 3
    const clampedScale = Math.max(0.1, Math.min(3, newScale));
    
    setPreviewScale(clampedScale);
    
    if (onScaleChange) {
      // Debounce the callback
      if (scaleTimeoutRef.current) {
        clearTimeout(scaleTimeoutRef.current);
      }
      scaleTimeoutRef.current = setTimeout(() => {
        onScaleChange(clampedScale);
      }, 100);
    }
  }, [onScaleChange]);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    updateScale(previewScale * 1.1);
  }, [previewScale, updateScale]);

  const zoomOut = useCallback(() => {
    updateScale(previewScale * 0.9);
  }, [previewScale, updateScale]);

  const resetZoom = useCallback(() => {
    updateScale(1);
  }, [updateScale]);

  const fitToScreen = useCallback(() => {
    if (!previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const contentWidth = devicePresets[previewDevice].width;
    const contentHeight = devicePresets[previewDevice].height;
    
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    
    // Use the smaller scale to ensure content fits
    const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
    
    updateScale(fitScale);
  }, [previewDevice, updateScale]);

  // Change preview device
  const changeDevice = useCallback((device) => {
    if (devicePresets[device]) {
      setPreviewDevice(device);
      
      // Auto-adjust scale for device
      if (device !== 'desktop') {
        updateScale(devicePresets[device].scale);
      }
    }
  }, [updateScale]);

  // Toggle helpers
  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const toggleRulers = useCallback(() => {
    setShowRulers(prev => !prev);
  }, []);

  const toggleHighlightEditableAreas = useCallback(() => {
    setHighlightEditableAreas(prev => !prev);
  }, []);

  // Get preview container styles
  const getPreviewStyles = useCallback(() => {
    const device = devicePresets[previewDevice];
    
    return {
      container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'auto',
        background: showGrid 
          ? 'repeating-linear-gradient(0deg, #f0f0f0 0px, transparent 1px, transparent 39px, #f0f0f0 40px), repeating-linear-gradient(90deg, #f0f0f0 0px, transparent 1px, transparent 39px, #f0f0f0 40px)'
          : 'transparent',
        position: 'relative'
      },
      wrapper: {
        transform: `scale(${previewScale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.3s ease',
        width: device.width,
        minHeight: device.height,
        background: 'white',
        boxShadow: !isEditMode ? '0 10px 40px rgba(0,0,0,0.1)' : 'none',
        position: 'relative'
      },
      overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: isEditMode ? 'none' : 'auto',
        zIndex: isEditMode ? -1 : 1
      }
    };
  }, [previewDevice, previewScale, isEditMode, showGrid]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyPress = (e) => {
      // Check if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd/Ctrl + E: Toggle edit mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        toggleMode();
      }
      
      // Cmd/Ctrl + 0: Reset zoom
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
      
      // Cmd/Ctrl + Plus: Zoom in
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
      }
      
      // Cmd/Ctrl + Minus: Zoom out  
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      
      // Cmd/Ctrl + Shift + F: Fit to screen
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        fitToScreen();
      }
      
      // G: Toggle grid
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        toggleGrid();
      }
      
      // R: Toggle rulers
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        toggleRulers();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    enableKeyboardShortcuts,
    toggleMode,
    resetZoom,
    zoomIn,
    zoomOut,
    fitToScreen,
    toggleGrid,
    toggleRulers
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scaleTimeoutRef.current) {
        clearTimeout(scaleTimeoutRef.current);
      }
    };
  }, []);

  // Get current device info
  const currentDevice = devicePresets[previewDevice];

  // Check if current scale is default
  const isDefaultScale = Math.abs(previewScale - 1) < 0.01;

  return {
    // State
    isEditMode,
    previewScale,
    previewDevice,
    currentDevice,
    showGrid,
    showRulers,
    highlightEditableAreas,
    isDefaultScale,
    
    // Presets
    devicePresets,
    zoomPresets,
    
    // Mode controls
    toggleMode,
    setMode,
    enterEditMode: () => setMode('edit'),
    enterPreviewMode: () => setMode('preview'),
    
    // Scale controls
    updateScale,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    
    // Device controls
    changeDevice,
    
    // Helper toggles
    toggleGrid,
    toggleRulers,
    toggleHighlightEditableAreas,
    
    // Utilities
    getPreviewStyles,
    previewContainerRef
  };
};