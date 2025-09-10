// @/components/CaseCreator/views/CustomizationView/hooks/useSaveHandler.js

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  saveCustomizations, 
  deployCaseWebsite,
  checkDeploymentStatus,
  updateCase 
} from '@/components/CaseCreator/services/caseAPI';
import {
  DEPLOYMENT_STATUS,
  SAVE_STATUS,
  formatDeploymentConfig,
  formatDeploymentError,
  retryDeployment,
  checkDeploymentHealth,
  createRollbackPoint,
  validateSubdomain,
  validateCustomDomain,
  isDeploymentNeeded
} from '../utils/deploymentHelpers';
import { validateForDeployment } from '../utils/validationHelpers';

/**
 * Custom hook for handling save and deployment operations
 * @param {string} caseId - Case ID
 * @param {Object} customizations - Current customizations
 * @param {Object} caseData - Case data
 * @param {Object} options - Additional options
 * @returns {Object} Save and deployment handlers
 */
export const useSaveHandler = (caseId, customizations, caseData, options = {}) => {
  const {
    onSaveSuccess = null,
    onSaveError = null,
    onDeploySuccess = null,
    onDeployError = null,
    autoRetry = true,
    maxRetries = 3
  } = options;

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(SAVE_STATUS.IDLE);
  const [saveError, setSaveError] = useState(null);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(DEPLOYMENT_STATUS.IDLE);
  const [deploymentError, setDeploymentError] = useState(null);
  const [deploymentUrl, setDeploymentUrl] = useState(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  // Refs for cleanup
  const saveTimeoutRef = useRef(null);
  const deploymentCheckIntervalRef = useRef(null);
  const rollbackPointRef = useRef(null);

  // Clear save status after delay
  const clearSaveStatus = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus(SAVE_STATUS.IDLE);
      setSaveError(null);
    }, 5000);
  }, []);

  // Save customizations
  const handleSave = useCallback(async (options = {}) => {
    const { 
      silent = false,
      skipValidation = false 
    } = options;

    // Prevent multiple simultaneous saves
    if (isSaving) {
      console.log('Save already in progress');
      return { success: false, error: 'Save already in progress' };
    }

    setIsSaving(true);
    setSaveStatus(SAVE_STATUS.SAVING);
    setSaveError(null);

    try {
      // Validate before saving unless skipped
      if (!skipValidation) {
        const validation = validateForDeployment({
          caseData,
          customizations
        });

        if (!validation.valid && validation.errors.length > 0) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      console.log('Saving customizations:', customizations);

      // Save customizations
      let response;
      if (caseId) {
        response = await saveCustomizations(caseId, customizations);
        
        // Also update case data if changed
        if (caseData) {
          await updateCase(caseId, caseData, null, customizations);
        }
      } else {
        throw new Error('Case ID is required for saving');
      }

      // Update state
      setSaveStatus(SAVE_STATUS.SUCCESS);
      setLastSaveTime(new Date());
      
      if (!silent) {
        clearSaveStatus();
      }

      // Call success callback
      if (onSaveSuccess) {
        onSaveSuccess(response);
      }

      console.log('Save successful:', response);
      return { success: true, data: response };

    } catch (error) {
      console.error('Save failed:', error);
      
      setSaveStatus(SAVE_STATUS.ERROR);
      setSaveError(error.message || 'Failed to save customizations');
      
      if (!silent) {
        clearSaveStatus();
      }

      // Call error callback
      if (onSaveError) {
        onSaveError(error);
      }

      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  }, [caseId, customizations, caseData, onSaveSuccess, onSaveError, clearSaveStatus]);

  // Auto-save handler
  const handleAutoSave = useCallback(async () => {
    return handleSave({ silent: true });
  }, [handleSave]);

  // Deploy website
  const handleDeploy = useCallback(async (options = {}) => {
    const {
      skipSave = false,
      force = false
    } = options;

    // Check if deployment is needed
    if (!force && !isDeploymentNeeded({ customizations, caseData }, null)) {
      console.log('No changes to deploy');
      return { success: false, error: 'No changes to deploy' };
    }

    setIsDeploying(true);
    setDeploymentStatus(DEPLOYMENT_STATUS.PREPARING);
    setDeploymentError(null);
    setDeploymentProgress(10);

    try {
      // Create rollback point
      rollbackPointRef.current = createRollbackPoint({
        customizations,
        caseData
      });

      // Save before deploying unless skipped
      if (!skipSave) {
        setDeploymentStatus(DEPLOYMENT_STATUS.PREPARING);
        const saveResult = await handleSave({ silent: true });
        if (!saveResult.success) {
          throw new Error('Failed to save before deployment');
        }
      }
      setDeploymentProgress(30);

      // Validate deployment configuration
      const validation = validateForDeployment({
        caseData,
        customizations
      });

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate subdomain
      if (!caseData.subdomain) {
        throw new Error('Subdomain is required for deployment');
      }

      const subdomainValidation = validateSubdomain(caseData.subdomain);
      if (!subdomainValidation.valid) {
        throw new Error(subdomainValidation.errors.join(', '));
      }

      // Validate custom domain if provided
      if (caseData.custom_domain) {
        const domainValidation = validateCustomDomain(caseData.custom_domain);
        if (!domainValidation.valid) {
          throw new Error(domainValidation.errors.join(', '));
        }
      }

      setDeploymentStatus(DEPLOYMENT_STATUS.DEPLOYING);
      setDeploymentProgress(50);

      // Prepare deployment config
      const deploymentConfig = formatDeploymentConfig(caseData, customizations);
      
      console.log('Deploying with config:', deploymentConfig);

      // Deploy with retry logic if enabled
      let deployResult;
      if (autoRetry) {
        deployResult = await retryDeployment(
          () => deployCaseWebsite(caseId, deploymentConfig),
          maxRetries
        );
      } else {
        deployResult = await deployCaseWebsite(caseId, deploymentConfig);
      }

      setDeploymentProgress(70);
      setDeploymentStatus(DEPLOYMENT_STATUS.CHECKING);

      // Start checking deployment status
      const checkInterval = 5000; // 5 seconds
      let checkCount = 0;
      const maxChecks = 60; // 5 minutes max

      deploymentCheckIntervalRef.current = setInterval(async () => {
        checkCount++;
        
        try {
          const status = await checkDeploymentStatus(caseId);
          
          // Update progress
          const progress = Math.min(70 + (checkCount * 0.5), 95);
          setDeploymentProgress(progress);

          if (status.status === 'completed') {
            // Clear interval
            clearInterval(deploymentCheckIntervalRef.current);
            
            // Verify deployment health
            const deployUrl = status.url || `https://${caseData.subdomain}.findthem.com`;
            const healthCheck = await checkDeploymentHealth(deployUrl);
            
            if (healthCheck.healthy) {
              setDeploymentStatus(DEPLOYMENT_STATUS.COMPLETED);
              setDeploymentUrl(deployUrl);
              setDeploymentProgress(100);
              
              // Call success callback
              if (onDeploySuccess) {
                onDeploySuccess({ url: deployUrl, status });
              }
            } else {
              throw new Error('Deployment health check failed');
            }
          } else if (status.status === 'failed' || checkCount >= maxChecks) {
            clearInterval(deploymentCheckIntervalRef.current);
            throw new Error(status.error || 'Deployment timeout');
          }
        } catch (error) {
          clearInterval(deploymentCheckIntervalRef.current);
          throw error;
        }
      }, checkInterval);

      return { 
        success: true, 
        url: deployResult.url,
        deploymentId: deployResult.id 
      };

    } catch (error) {
      console.error('Deployment failed:', error);
      
      const formattedError = formatDeploymentError(error);
      setDeploymentStatus(DEPLOYMENT_STATUS.FAILED);
      setDeploymentError(formattedError);
      setDeploymentProgress(0);

      // Clear any running intervals
      if (deploymentCheckIntervalRef.current) {
        clearInterval(deploymentCheckIntervalRef.current);
      }

      // Call error callback
      if (onDeployError) {
        onDeployError(formattedError);
      }

      return { 
        success: false, 
        error: formattedError 
      };
    } finally {
      setIsDeploying(false);
    }
  }, [
    caseId, 
    customizations, 
    caseData, 
    handleSave, 
    autoRetry, 
    maxRetries,
    onDeploySuccess,
    onDeployError
  ]);

  // Cancel deployment
  const cancelDeployment = useCallback(() => {
    if (deploymentCheckIntervalRef.current) {
      clearInterval(deploymentCheckIntervalRef.current);
    }
    
    setIsDeploying(false);
    setDeploymentStatus(DEPLOYMENT_STATUS.CANCELLED);
    setDeploymentProgress(0);
  }, []);

  // Rollback to previous state
  const rollback = useCallback(() => {
    if (rollbackPointRef.current) {
      return rollbackPointRef.current;
    }
    return null;
  }, []);

  // Reset all states
  const reset = useCallback(() => {
    setIsSaving(false);
    setSaveStatus(SAVE_STATUS.IDLE);
    setSaveError(null);
    setIsDeploying(false);
    setDeploymentStatus(DEPLOYMENT_STATUS.IDLE);
    setDeploymentError(null);
    setDeploymentProgress(0);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (deploymentCheckIntervalRef.current) {
      clearInterval(deploymentCheckIntervalRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (deploymentCheckIntervalRef.current) {
        clearInterval(deploymentCheckIntervalRef.current);
      }
    };
  }, []);

  return {
    // Save state
    isSaving,
    saveStatus,
    saveError,
    lastSaveTime,
    
    // Deployment state
    isDeploying,
    deploymentStatus,
    deploymentError,
    deploymentUrl,
    deploymentProgress,
    
    // Handlers
    handleSave,
    handleAutoSave,
    handleDeploy,
    cancelDeployment,
    rollback,
    reset,
    
    // Utilities
    isDeploymentNeeded: () => isDeploymentNeeded({ customizations, caseData }, null)
  };
};