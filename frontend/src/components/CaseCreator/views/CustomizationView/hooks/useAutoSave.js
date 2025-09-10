// @/components/CaseCreator/views/CustomizationView/hooks/useAutoSave.js
// FIXED VERSION - Prevents infinite loops with proper dependency management

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Auto-save hook with infinite loop prevention
 * @param {Function} saveFunction - Function to call for saving
 * @param {Object} data - Data to save
 * @param {Object} options - Configuration options
 */
export const useAutoSave = (saveFunction, data, options = {}) => {
  const {
    enabled = true,
    delay = 30000, // 30 seconds default
    immediate = false, // Save immediately on first change
    debounceDelay = 2000, // Wait 2 seconds after last change
    maxRetries = 3,
    onSuccess = null,
    onError = null,
    validateBeforeSave = null,
    ignorePaths = [], // Paths in data to ignore for change detection
  } = options;

  // State
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(null);
  const [autoSaveCount, setAutoSaveCount] = useState(0);
  const [autoSaveError, setAutoSaveError] = useState(null);
  const [nextAutoSaveTime, setNextAutoSaveTime] = useState(null);
  const [timeUntilNextSave, setTimeUntilNextSave] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs to prevent infinite loops
  const dataRef = useRef(data);
  const lastSavedDataRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const saveInProgressRef = useRef(false);

  // Create a stable reference to the save function
  const saveFunctionRef = useRef(saveFunction);
  saveFunctionRef.current = saveFunction;

  /**
   * Deep compare objects, ignoring specified paths and functions
   */
  const hasDataChanged = useCallback((oldData, newData) => {
    // If either is null/undefined, simple comparison
    if (!oldData || !newData) {
      return oldData !== newData;
    }

    // Convert to JSON strings for comparison, excluding functions
    try {
      const cleanData = (obj, paths = []) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          // Skip ignored paths
          if (paths.some(path => path === key || path.startsWith(`${key}.`))) {
            continue;
          }
          // Skip functions and undefined values
          if (typeof value === 'function' || value === undefined) {
            continue;
          }
          // Recursively clean nested objects
          if (value && typeof value === 'object') {
            cleaned[key] = cleanData(value, paths.map(p => {
              if (p.startsWith(`${key}.`)) {
                return p.substring(key.length + 1);
              }
              return null;
            }).filter(Boolean));
          } else {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };

      const oldCleaned = cleanData(oldData, ignorePaths);
      const newCleaned = cleanData(newData, ignorePaths);
      
      const oldStr = JSON.stringify(oldCleaned, Object.keys(oldCleaned).sort());
      const newStr = JSON.stringify(newCleaned, Object.keys(newCleaned).sort());
      
      return oldStr !== newStr;
    } catch (error) {
      console.error('[useAutoSave] Error comparing data:', error);
      // If comparison fails, assume data has changed to be safe
      return true;
    }
  }, [ignorePaths]);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async () => {
    // Prevent concurrent saves
    if (saveInProgressRef.current || !isMountedRef.current) {
      console.log('[useAutoSave] Skipping save - already in progress or unmounted');
      return false;
    }

    // Check if data has actually changed
    if (!hasDataChanged(lastSavedDataRef.current, dataRef.current)) {
      console.log('[useAutoSave] Skipping save - no changes detected');
      setHasUnsavedChanges(false);
      return false;
    }

    // Validate before saving if validator provided
    if (validateBeforeSave) {
      const validation = validateBeforeSave(dataRef.current);
      if (validation && !validation.valid) {
        console.log('[useAutoSave] Skipping save - validation failed:', validation.errors);
        setAutoSaveError('Validation failed: ' + validation.errors.join(', '));
        return false;
      }
    }

    saveInProgressRef.current = true;
    setIsAutoSaving(true);
    setAutoSaveError(null);

    try {
      console.log('[useAutoSave] Saving data...');
      
      // Call the save function with current data
      await saveFunctionRef.current(dataRef.current);
      
      // Update state on successful save
      if (isMountedRef.current) {
        lastSavedDataRef.current = JSON.parse(JSON.stringify(dataRef.current));
        setLastAutoSaveTime(new Date());
        setAutoSaveCount(prev => prev + 1);
        setHasUnsavedChanges(false);
        retryCountRef.current = 0;
        
        console.log('[useAutoSave] Save successful');
        
        if (onSuccess) {
          onSuccess(dataRef.current);
        }
      }
      
      return true;
    } catch (error) {
      console.error('[useAutoSave] Save failed:', error);
      
      if (isMountedRef.current) {
        setAutoSaveError(error.message || 'Save failed');
        
        // Retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`[useAutoSave] Retrying save (${retryCountRef.current}/${maxRetries})...`);
          
          // Exponential backoff for retries
          setTimeout(() => {
            if (isMountedRef.current) {
              performSave();
            }
          }, Math.min(1000 * Math.pow(2, retryCountRef.current), 10000));
        } else {
          console.error('[useAutoSave] Max retries reached, giving up');
          if (onError) {
            onError(error);
          }
        }
      }
      
      return false;
    } finally {
      saveInProgressRef.current = false;
      if (isMountedRef.current) {
        setIsAutoSaving(false);
      }
    }
  }, [hasDataChanged, validateBeforeSave, onSuccess, onError, maxRetries]);

  /**
   * Schedule the next auto-save
   */
  const scheduleNextSave = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!enabled || isPaused || !isMountedRef.current) {
      return;
    }

    const saveTime = Date.now() + delay;
    setNextAutoSaveTime(new Date(saveTime));

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        const remaining = Math.max(0, saveTime - Date.now());
        setTimeUntilNextSave(remaining);
        
        if (remaining === 0) {
          clearInterval(countdownIntervalRef.current);
        }
      }
    }, 1000);

    // Schedule the actual save
    saveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && !isPaused) {
        performSave().then(saved => {
          if (saved && isMountedRef.current) {
            scheduleNextSave();
          }
        });
      }
    }, delay);
  }, [enabled, isPaused, delay, performSave]);

  /**
   * Handle data changes with debouncing
   */
  useEffect(() => {
    dataRef.current = data;
    
    // Check if data has changed
    if (hasDataChanged(lastSavedDataRef.current, data)) {
      setHasUnsavedChanges(true);
      
      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // If immediate save is enabled and this is the first change
      if (immediate && lastSavedDataRef.current === null && !saveInProgressRef.current) {
        performSave().then(saved => {
          if (saved) {
            scheduleNextSave();
          }
        });
      } else if (enabled && !isPaused) {
        // Debounce changes
        debounceTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !saveInProgressRef.current) {
            performSave().then(saved => {
              if (saved) {
                scheduleNextSave();
              }
            });
          }
        }, debounceDelay);
      }
    }
  }, [data, hasDataChanged, performSave, scheduleNextSave, enabled, isPaused, immediate, debounceDelay]);

  /**
   * Initialize auto-save when enabled
   */
  useEffect(() => {
    if (enabled && !isPaused) {
      scheduleNextSave();
    }
    
    return () => {
      // Cleanup on unmount or when disabled
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [enabled, isPaused, scheduleNextSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Clear all timeouts and intervals
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  /**
   * Manual trigger for auto-save
   */
  const triggerAutoSave = useCallback(async () => {
    console.log('[useAutoSave] Manual save triggered');
    const saved = await performSave();
    if (saved) {
      scheduleNextSave();
    }
    return saved;
  }, [performSave, scheduleNextSave]);

  /**
   * Pause auto-save
   */
  const pauseAutoSave = useCallback(() => {
    console.log('[useAutoSave] Pausing auto-save');
    setIsPaused(true);
    
    // Clear scheduled saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    setNextAutoSaveTime(null);
    setTimeUntilNextSave(null);
  }, []);

  /**
   * Resume auto-save
   */
  const resumeAutoSave = useCallback(() => {
    console.log('[useAutoSave] Resuming auto-save');
    setIsPaused(false);
    scheduleNextSave();
  }, [scheduleNextSave]);

  /**
   * Reset auto-save state
   */
  const resetAutoSave = useCallback(() => {
    console.log('[useAutoSave] Resetting auto-save');
    lastSavedDataRef.current = null;
    setLastAutoSaveTime(null);
    setAutoSaveCount(0);
    setAutoSaveError(null);
    setHasUnsavedChanges(false);
    retryCountRef.current = 0;
    
    if (enabled && !isPaused) {
      scheduleNextSave();
    }
  }, [enabled, isPaused, scheduleNextSave]);

  /**
   * Format time until next save for display
   */
  const formatTimeUntilSave = useCallback(() => {
    if (!enabled) return 'Auto-save disabled';
    if (isPaused) return 'Auto-save paused';
    if (isAutoSaving) return 'Saving...';
    if (!timeUntilNextSave) return '';
    
    const seconds = Math.ceil(timeUntilNextSave / 1000);
    if (seconds <= 0) return 'Saving soon...';
    
    if (seconds < 60) {
      return `Next save in ${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `Next save in ${minutes}m`;
    }
    
    return `Next save in ${minutes}m ${remainingSeconds}s`;
  }, [enabled, isPaused, isAutoSaving, timeUntilNextSave]);

  return {
    // State
    isAutoSaving,
    lastAutoSaveTime,
    autoSaveCount,
    autoSaveError,
    nextAutoSaveTime,
    timeUntilNextSave,
    hasUnsavedChanges,
    isPaused,
    
    // Actions
    triggerAutoSave,
    pauseAutoSave,
    resumeAutoSave,
    resetAutoSave,
    
    // Utilities
    formatTimeUntilSave,
    isEnabled: enabled && !isPaused,
  };
};