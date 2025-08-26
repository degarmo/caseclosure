// src/components/CaseCreator/hooks/useCaseAPI.js

import { useState, useCallback } from 'react';
import { saveCase as saveCaseAPI, deployCaseWebsite } from '../services/caseAPI';
import { parseAPIError } from '../utils';

/**
 * Custom hook for managing API operations
 */
export const useCaseAPI = () => {
  const [caseId, setCaseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Save case (create or update)
  const saveCase = useCallback(async (caseData, selectedTemplate, customizations, validateFn) => {
    // Validate before saving
    if (validateFn && !validateFn()) {
      return null;
    }
    
    setSaving(true);
    setApiError('');
    
    try {
      const result = await saveCaseAPI({
        caseId,
        caseData,
        selectedTemplate,
        customizations
      });
      
      // Set case ID if this was a create operation
      if (result.id && !caseId) {
        setCaseId(result.id);
      }
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      return result;
    } catch (error) {
      const errorMessage = parseAPIError(error);
      setApiError(errorMessage);
      return null;
    } finally {
      setSaving(false);
    }
  }, [caseId]);
  
  // Quick save without navigation
  const handleQuickSave = useCallback(async (caseData, selectedTemplate, customizations, validateFn) => {
    const result = await saveCase(caseData, selectedTemplate, customizations, validateFn);
    if (result) {
      setApiError('');
      return true;
    }
    return false;
  }, [saveCase]);
  
  // Deploy website
  const deployWebsite = useCallback(async (caseData, selectedTemplate, customizations, validateFn) => {
    setLoading(true);
    setApiError('');
    
    try {
      // Save first
      const savedCase = await saveCase(caseData, selectedTemplate, customizations, validateFn);
      if (!savedCase) {
        setLoading(false);
        return null;
      }
      
      // Deploy if we have a case ID
      if (savedCase.id || caseId) {
        await deployCaseWebsite(savedCase.id || caseId);
      }
      
      return savedCase;
    } catch (error) {
      const errorMessage = parseAPIError(error);
      setApiError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [caseId, saveCase]);
  
  // Clear error
  const clearError = useCallback(() => {
    setApiError('');
  }, []);
  
  // Reset API state
  const resetAPIState = useCallback(() => {
    setCaseId(null);
    setSaving(false);
    setLoading(false);
    setApiError('');
    setSaveSuccess(false);
  }, []);
  
  return {
    caseId,
    saving,
    loading,
    apiError,
    saveSuccess,
    saveCase,
    handleQuickSave,
    deployWebsite,
    clearError,
    resetAPIState
  };
};