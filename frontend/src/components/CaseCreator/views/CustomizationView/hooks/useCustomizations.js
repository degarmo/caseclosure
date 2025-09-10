// @/components/CaseCreator/views/CustomizationView/hooks/useCustomizations.js

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  createInitialCustomizations,
  updateCustomization,
  hasUnsavedChanges,
  validateCustomizations,
  formatCustomizationsForAPI,
  diffCustomizations,
  getCustomizationValue,
  mergeCustomizations
} from '../utils/customizationHelpers';
import { getDefaultCustomizations } from '../constants/templateRegistry';

/**
 * Custom hook for managing customizations state and operations
 * @param {Object} initialData - Initial customizations data
 * @param {string} templateId - Template ID
 * @param {Function} onAutoSave - Optional auto-save callback
 * @returns {Object} Customization state and handlers
 */
export const useCustomizations = (initialData, templateId = 'beacon', onAutoSave = null) => {
  // Initialize customizations with proper structure
  const [customizations, setCustomizations] = useState(() => {
    if (initialData?.customizations) {
      // Merge with template defaults to ensure all fields exist
      const templateDefaults = getDefaultCustomizations(templateId);
      return mergeCustomizations(initialData, templateDefaults);
    }
    return createInitialCustomizations(initialData, templateId);
  });

  // Track saved state for comparison
  const [lastSavedCustomizations, setLastSavedCustomizations] = useState(() => 
    JSON.parse(JSON.stringify(customizations))
  );

  // Track unsaved changes
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Track validation state
  const [validationState, setValidationState] = useState(() => 
    validateCustomizations(customizations)
  );

  // History for undo/redo
  const [history, setHistory] = useState([customizations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistorySize = 50;

  // Auto-save timer
  const autoSaveTimerRef = useRef(null);

  // Update unsaved changes when customizations change
  useEffect(() => {
    const hasChanges = hasUnsavedChanges(customizations, lastSavedCustomizations);
    setUnsavedChanges(hasChanges);

    // Validate on change
    const validation = validateCustomizations(customizations);
    setValidationState(validation);

    // Trigger auto-save if enabled
    if (hasChanges && onAutoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        onAutoSave(customizations);
        setLastSavedCustomizations(JSON.parse(JSON.stringify(customizations)));
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [customizations, lastSavedCustomizations, onAutoSave]);

  // Handle customization change with history
  const handleCustomizationChange = useCallback((path, value) => {
    console.log('Customization change:', path, '=', value);

    setCustomizations(prev => {
      const updated = updateCustomization(prev, path, value);
      
      // Add to history (trim future if we're not at the end)
      setHistory(currentHistory => {
        const newHistory = currentHistory.slice(0, historyIndex + 1);
        newHistory.push(updated);
        
        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }
        
        return newHistory;
      });
      
      setHistoryIndex(current => Math.min(current + 1, maxHistorySize - 1));
      
      return updated;
    });
  }, [historyIndex]);

  // Batch update multiple customizations
  const batchUpdate = useCallback((updates) => {
    setCustomizations(prev => {
      let updated = { ...prev };
      
      for (const { path, value } of updates) {
        updated = updateCustomization(updated, path, value);
      }
      
      // Add to history
      setHistory(currentHistory => {
        const newHistory = [...currentHistory.slice(0, historyIndex + 1), updated];
        return newHistory.slice(-maxHistorySize);
      });
      
      setHistoryIndex(current => Math.min(current + 1, maxHistorySize - 1));
      
      return updated;
    });
  }, [historyIndex]);

  // Get specific customization value
  const getValue = useCallback((path, defaultValue) => {
    return getCustomizationValue(customizations, path, defaultValue);
  }, [customizations]);

  // Undo operation
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCustomizations(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo operation
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCustomizations(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Check if undo/redo available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultCustomizations(templateId);
    setCustomizations(defaults);
    
    // Add to history
    setHistory(currentHistory => {
      const newHistory = [...currentHistory.slice(0, historyIndex + 1), defaults];
      return newHistory.slice(-maxHistorySize);
    });
    setHistoryIndex(current => Math.min(current + 1, maxHistorySize - 1));
  }, [templateId, historyIndex]);

  // Reset to template defaults for specific page
  const resetPageToDefaults = useCallback((pageName) => {
    const defaults = getDefaultCustomizations(templateId);
    
    setCustomizations(prev => {
      const updated = { ...prev };
      if (defaults.customizations.pages[pageName]) {
        updated.customizations.pages[pageName] = {
          ...defaults.customizations.pages[pageName]
        };
      }
      updated.metadata.last_edited = new Date().toISOString();
      return updated;
    });
  }, [templateId]);

  // Import customizations from JSON
  const importCustomizations = useCallback((jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      const validation = validateCustomizations(imported);
      
      if (validation.valid) {
        setCustomizations(imported);
        return { success: true };
      } else {
        return { 
          success: false, 
          errors: validation.errors 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: ['Invalid JSON format'] 
      };
    }
  }, []);

  // Export customizations as JSON
  const exportCustomizations = useCallback(() => {
    return JSON.stringify(customizations, null, 2);
  }, [customizations]);

  // Mark as saved (update last saved state)
  const markAsSaved = useCallback(() => {
    setLastSavedCustomizations(JSON.parse(JSON.stringify(customizations)));
    setUnsavedChanges(false);
  }, [customizations]);

  // Get changes since last save
  const getChanges = useCallback(() => {
    return diffCustomizations(lastSavedCustomizations, customizations);
  }, [customizations, lastSavedCustomizations]);

  // Format for API submission
  const getFormattedForAPI = useCallback(() => {
    return formatCustomizationsForAPI(customizations);
  }, [customizations]);

  // Load new template defaults
  const loadTemplate = useCallback((newTemplateId) => {
    const defaults = getDefaultCustomizations(newTemplateId);
    
    // Preserve any existing customizations that are compatible
    const merged = mergeCustomizations(customizations, defaults);
    setCustomizations(merged);
    
    // Add to history
    setHistory(currentHistory => {
      const newHistory = [...currentHistory.slice(0, historyIndex + 1), merged];
      return newHistory.slice(-maxHistorySize);
    });
    setHistoryIndex(current => Math.min(current + 1, maxHistorySize - 1));
  }, [customizations, historyIndex]);

  // Preview mode helpers
  const [previewMode, setPreviewMode] = useState(false);
  const [tempCustomizations, setTempCustomizations] = useState(null);

  const enterPreviewMode = useCallback(() => {
    setTempCustomizations(customizations);
    setPreviewMode(true);
  }, [customizations]);

  const exitPreviewMode = useCallback((save = false) => {
    if (!save && tempCustomizations) {
      setCustomizations(tempCustomizations);
    }
    setTempCustomizations(null);
    setPreviewMode(false);
  }, [tempCustomizations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    customizations,
    unsavedChanges,
    validationState,
    canUndo,
    canRedo,
    previewMode,
    
    // Handlers
    handleCustomizationChange,
    batchUpdate,
    getValue,
    undo,
    redo,
    resetToDefaults,
    resetPageToDefaults,
    importCustomizations,
    exportCustomizations,
    markAsSaved,
    getChanges,
    getFormattedForAPI,
    loadTemplate,
    enterPreviewMode,
    exitPreviewMode,
    
    // Direct setters (for special cases)
    setCustomizations
  };
};