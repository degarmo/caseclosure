// components/DeploymentModal/DeploymentModal.jsx - Updated with custom subdomain functionality
import React, { useState, useEffect, useRef } from 'react';
import { 
  checkSubdomainAvailability, 
  deployCase, 
  updateDeployment,
  getCaseDeploymentStatus
} from '../services/deploymentAPI';

const DeploymentModal = ({ caseId, caseData, currentDeployment, onClose, onDeploymentComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [suggestedSubdomains, setSuggestedSubdomains] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [isUsingCustom, setIsUsingCustom] = useState(false);
  const pollIntervalRef = useRef(null);
  const checkTimeoutRef = useRef(null);

  // Check if this is an update scenario
  const isUpdating = currentDeployment?.deployment_status === 'deployed';

  useEffect(() => {
    if (isUpdating && currentDeployment?.subdomain) {
      // For updates, lock in the existing subdomain
      setSelectedSubdomain(currentDeployment.subdomain);
      setAvailabilityStatus({ available: true, message: 'Current subdomain' });
      setIsLoadingSuggestions(false);
    } else {
      // For new deployments, generate suggestions
      generateUniqueSubdomains();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const generateUniqueSubdomains = async () => {
    setIsLoadingSuggestions(true);
    const firstName = caseData.first_name?.toLowerCase() || '';
    const lastName = caseData.last_name?.toLowerCase() || '';
    
    // Generate potential subdomain combinations
    const potentialSubdomains = [];
    
    // Format 1: 4[firstname] (memorial format)
    if (firstName) {
      potentialSubdomains.push(`4${firstName}`);
    }
    
    // Format 2: Short version if name is long
    if (firstName.length > 6) {
      potentialSubdomains.push(`4${firstName.substring(0, 4)}`);
    }
    
    // Format 3: Full name combined
    if (firstName && lastName) {
      potentialSubdomains.push(`${firstName}${lastName}`);
    }
    
    // Format 4: First name + last initial
    if (firstName && lastName) {
      potentialSubdomains.push(`${firstName}${lastName.charAt(0)}`);
    }
    
    // Format 5: Memorial variants
    potentialSubdomains.push(`${firstName}mem`);
    potentialSubdomains.push(`remember${firstName}`);
    
    // Format 6: First initial + last name
    if (firstName && lastName) {
      potentialSubdomains.push(`${firstName.charAt(0)}${lastName}`);
    }
    
    // Check availability for each potential subdomain
    const availableSubdomains = [];
    for (const subdomain of potentialSubdomains) {
      if (subdomain && subdomain.length >= 3 && subdomain.length <= 50) {
        try {
          const response = await checkSubdomainAvailability(subdomain, caseId);
          if (response.available) {
            availableSubdomains.push({
              value: subdomain,
              label: getSubdomainLabel(subdomain, firstName, lastName)
            });
          }
          
          // Stop after finding 3 available subdomains
          if (availableSubdomains.length >= 3) {
            break;
          }
        } catch (error) {
          console.error('Error checking subdomain availability:', error);
        }
      }
    }
    
    // If we don't have 3 suggestions yet, add numbered variants
    let counter = 1;
    while (availableSubdomains.length < 3 && counter < 100) {
      const numberedSubdomain = `${firstName}${counter}`;
      try {
        const response = await checkSubdomainAvailability(numberedSubdomain, caseId);
        if (response.available) {
          availableSubdomains.push({
            value: numberedSubdomain,
            label: 'Alternative'
          });
        }
      } catch (error) {
        console.error('Error checking numbered subdomain:', error);
      }
      counter++;
    }
    
    setSuggestedSubdomains(availableSubdomains.slice(0, 3));
    setIsLoadingSuggestions(false);
  };

  const getSubdomainLabel = (subdomain, firstName, lastName) => {
    if (subdomain.startsWith('4')) {
      return 'Memorial';
    } else if (subdomain === `${firstName}${lastName}`) {
      return 'Full Name';
    } else if (subdomain.includes('mem') || subdomain.includes('remember')) {
      return 'Tribute';
    } else if (subdomain === `${firstName}${lastName?.charAt(0)}`) {
      return 'Name + Initial';
    } else if (subdomain === `${firstName?.charAt(0)}${lastName}`) {
      return 'Initial + Surname';
    } else {
      return 'Short Format';
    }
  };

  const checkAvailability = async (subdomain) => {
    if (!subdomain || subdomain.length < 3) {
      setAvailabilityStatus({ available: false, message: 'Minimum 3 characters required' });
      return;
    }

    if (subdomain.length > 50) {
      setAvailabilityStatus({ available: false, message: 'Maximum 50 characters allowed' });
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      setAvailabilityStatus({ 
        available: false, 
        message: 'Only lowercase letters, numbers, and hyphens allowed. Cannot start or end with hyphen.' 
      });
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityStatus(null);

    try {
      const response = await checkSubdomainAvailability(subdomain, caseId);
      setAvailabilityStatus(response);
    } catch (error) {
      setAvailabilityStatus({ 
        available: false, 
        message: 'Unable to check availability. Please try again.' 
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubdomainSelect = (subdomain) => {
    setSelectedSubdomain(subdomain);
    setCustomSubdomain('');
    setIsUsingCustom(false);
    setAvailabilityStatus({ available: true, message: 'Available' });
  };

  const handleCustomSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCustomSubdomain(value);
    setSelectedSubdomain(value);
    setIsUsingCustom(true);
    
    // Clear any previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    // Clear availability status while typing
    if (value.length < 3) {
      setAvailabilityStatus(null);
    }
    
    // Set new timeout for checking availability
    checkTimeoutRef.current = setTimeout(() => {
      if (value.length >= 3) {
        checkAvailability(value);
      } else if (value.length > 0) {
        setAvailabilityStatus({ available: false, message: 'Minimum 3 characters required' });
      } else {
        setAvailabilityStatus(null);
      }
    }, 500);
  };

  const handleDeploy = async () => {
    if (!selectedSubdomain || (!isUpdating && !availabilityStatus?.available)) {
      setError('Please select an available web address');
      return;
    }

    setIsDeploying(true);
    setError('');

    try {
      const deployData = {
        subdomain: selectedSubdomain,
        template_id: caseData.template_id,
        template_data: caseData.template_data
      };

      const result = isUpdating
        ? await updateDeployment(caseId, deployData)
        : await deployCase(caseId, deployData);

      setDeploymentResult(result);
      setStep(3);
      
      pollDeploymentStatus(result.deployment_id);
    } catch (error) {
      setError(error.message || 'An error occurred. Please try again.');
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = (deploymentId) => {
    let pollAttempts = 0;
    const maxPollAttempts = 60;
    
    const interval = setInterval(async () => {
      pollAttempts++;
      
      try {
        const status = await getCaseDeploymentStatus(caseId);
        
        if (status.deployment_status === 'deployed') {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          onDeploymentComplete();
        } else if (status.deployment_status === 'failed') {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          setError('Operation failed. Please try again.');
          setStep(2);
        } else if (pollAttempts >= maxPollAttempts) {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          setError('Operation is taking longer than expected. Please check back in a few minutes.');
          setStep(2);
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
        pollAttempts += 5;
        
        if (pollAttempts >= maxPollAttempts) {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          setError('Unable to check status. Please refresh the page.');
          setStep(2);
        }
      }
    }, 5000);

    pollIntervalRef.current = interval;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
                {isUpdating ? 'Update Memorial Site' : 'Deploy Memorial Site'}
              </h2>
              <p className="text-base text-gray-600 mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                {isUpdating 
                  ? `Update the memorial site for ${caseData.first_name}`
                  : `Create a lasting tribute for ${caseData.first_name}`}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none p-2"
              aria-label="Close"
            >
              X
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {step < 3 && !isUpdating && (
          <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center">
              <div className={`flex items-center px-4 py-2 rounded text-sm ${
                step === 1 ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                <span className="font-medium mr-2">Step 1:</span>
                <span>Web Address</span>
              </div>
              <div className="flex-1 mx-4 h-px bg-gray-300">
                <div className={`h-full bg-gray-800 transition-all ${
                  step > 1 ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`flex items-center px-4 py-2 rounded text-sm ${
                step === 2 ? 'bg-gray-800 text-white' : 'text-gray-500'
              }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                <span className="font-medium mr-2">Step 2:</span>
                <span>Deploy</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                  {isUpdating ? 'Current Web Address' : 'Select Web Address'}
                </h3>
                <p className="text-gray-600 mb-6" style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', lineHeight: '1.6' }}>
                  {isUpdating 
                    ? `The memorial site is currently deployed at the address below.`
                    : `Choose a unique web address for ${caseData.first_name}'s memorial site.`}
                </p>

                {/* Preview URL */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                    Memorial URL:
                  </p>
                  <div className="font-mono text-lg text-gray-900" style={{ letterSpacing: '0.02em' }}>
                    {selectedSubdomain || '[select-address]'}.caseclosure.org
                  </div>
                  {isUpdating && (
                    <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                      This address cannot be changed during updates.
                    </p>
                  )}
                  {!isUpdating && availabilityStatus && isUsingCustom && (
                    <p className={`text-sm mt-2 ${
                      availabilityStatus.available ? 'text-green-600' : 'text-red-600'
                    }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                      {isCheckingAvailability ? 'Checking availability...' : availabilityStatus.message}
                    </p>
                  )}
                </div>

                {/* Suggested Options - Only show for new deployments */}
                {!isUpdating && (
                  <>
                    <div className="space-y-3 mb-6">
                      <p className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>
                        Suggested Addresses:
                      </p>
                      {isLoadingSuggestions ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                          <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                            Finding available addresses...
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {suggestedSubdomains.map((suggestion) => (
                            <button
                              key={suggestion.value}
                              onClick={() => handleSubdomainSelect(suggestion.value)}
                              className={`w-full p-4 text-left border rounded-lg transition-all ${
                                selectedSubdomain === suggestion.value && !isUsingCustom
                                  ? 'border-gray-800 bg-gray-50'
                                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-mono text-gray-900" style={{ fontSize: '15px' }}>
                                    {suggestion.value}.caseclosure.org
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Arial, sans-serif' }}>
                                    {suggestion.label}
                                  </p>
                                </div>
                                {selectedSubdomain === suggestion.value && !isUsingCustom && (
                                  <span className="text-gray-800 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                                    Selected
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom Option - Now Enabled */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>
                        Custom Address:
                      </label>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={customSubdomain}
                            onChange={handleCustomSubdomainChange}
                            placeholder="enter-custom-address"
                            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                              isUsingCustom && availabilityStatus && !availabilityStatus.available
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : isUsingCustom && availabilityStatus && availabilityStatus.available
                                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                                : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                            } focus:outline-none focus:ring-2`}
                            style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
                            minLength={3}
                            maxLength={50}
                          />
                          {isCheckingAvailability && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            </div>
                          )}
                          {!isCheckingAvailability && isUsingCustom && availabilityStatus && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {availabilityStatus.available ? (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-600 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                          .caseclosure.org
                        </span>
                      </div>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Arial, sans-serif' }}>
                        Use lowercase letters, numbers, and hyphens. Must be 3-50 characters.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center py-12">
              <div>
                <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
                  {isUpdating ? 'Confirm Update' : 'Confirm Deployment'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', lineHeight: '1.6' }}>
                  {isUpdating 
                    ? 'Your memorial site will be updated at:'
                    : 'Your memorial site will be published at:'}
                </p>
                <p className="text-xl font-mono text-gray-900 mt-3" style={{ letterSpacing: '0.02em' }}>
                  {selectedSubdomain}.caseclosure.org
                </p>
              </div>

              {isDeploying && (
                <div className="flex flex-col items-center gap-4 mt-8">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                  <p className="text-gray-600" style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}>
                    {isUpdating ? 'Updating memorial site...' : 'Deploying memorial site...'}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: 'Arial, sans-serif' }}>
                    This typically takes 30-60 seconds
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-left max-w-md mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center py-12">
              <div>
                <h3 className="text-2xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.02em' }}>
                  {isUpdating ? 'Update Successful' : 'Deployment Successful'}
                </h3>
                <p className="text-gray-600 mb-6" style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px', lineHeight: '1.6' }}>
                  {isUpdating 
                    ? `The memorial site for ${caseData.first_name} has been updated.`
                    : `The memorial site for ${caseData.first_name} is now live.`}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                    Site URL:
                  </p>
                  <a 
                    href={`https://${selectedSubdomain}.caseclosure.org`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-mono text-blue-700 hover:text-blue-800 hover:underline"
                    style={{ letterSpacing: '0.02em' }}
                  >
                    https://{selectedSubdomain}.caseclosure.org
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {step === 1 && (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedSubdomain || (!isUpdating && !availabilityStatus?.available) || isCheckingAvailability}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    selectedSubdomain && (isUpdating || availabilityStatus?.available) && !isCheckingAvailability
                      ? 'bg-gray-800 text-white hover:bg-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
                >
                  {isUpdating ? 'Continue to Update' : 'Continue'}
                </button>
              </>
            )}
            
            {step === 2 && !isDeploying && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
                >
                  Back
                </button>
                <button
                  onClick={handleDeploy}
                  className="px-8 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-all"
                  style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
                >
                  {isUpdating ? 'Update Site' : 'Deploy Site'}
                </button>
              </>
            )}

            {step === 2 && isDeploying && (
              <div className="mx-auto text-gray-500 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                Please wait while the operation completes...
              </div>
            )}

            {step === 3 && (
              <button
                onClick={onClose}
                className="mx-auto px-8 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-all"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '15px' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;