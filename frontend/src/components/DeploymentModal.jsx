// components/DeploymentModal/DeploymentModal.jsx - Fixed version
import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, SparklesIcon, GlobeAltIcon, CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { 
  checkSubdomainAvailability, 
  deployCase, 
  updateDeployment,
  getCaseDeploymentStatus  // Added missing import
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
  const pollIntervalRef = useRef(null);  // Added ref to track interval

  useEffect(() => {
    generateSubdomainSuggestions();
    if (currentDeployment?.subdomain) {
      setSelectedSubdomain(currentDeployment.subdomain);
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const generateSubdomainSuggestions = () => {
    const firstName = caseData.first_name?.toLowerCase() || '';
    const lastName = caseData.last_name?.toLowerCase() || '';
    const fullName = `${firstName}-${lastName}`;
    
    const suggestions = [
      { value: fullName, label: 'Classic', icon: '✨' },
      { value: `${firstName}${lastName}`, label: 'Simple', icon: '💫' },
      { value: `remember-${firstName}`, label: 'Memorial', icon: '🕊️' },
      { value: `${firstName}-memorial`, label: 'Tribute', icon: '🌹' },
      { value: `honor-${firstName}`, label: 'Honor', icon: '⭐' }
    ].filter(s => s.value && s.value.length >= 3 && s.value.length <= 50);

    setSuggestedSubdomains(suggestions.slice(0, 5));
  };

  const checkAvailability = async (subdomain) => {
    if (!subdomain || subdomain.length < 3) {
      setAvailabilityStatus({ available: false, message: 'Please use at least 3 characters' });
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
        message: 'Oops! Could not check availability' 
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubdomainSelect = (subdomain) => {
    setSelectedSubdomain(subdomain);
    setCustomSubdomain('');
    checkAvailability(subdomain);
  };

  const handleCustomSubdomainChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCustomSubdomain(value);
    setSelectedSubdomain(value);
    
    clearTimeout(window.subdomainTimeout);
    window.subdomainTimeout = setTimeout(() => {
      if (value.length >= 3) {
        checkAvailability(value);
      }
    }, 500);
  };

  const handleDeploy = async () => {
    if (!selectedSubdomain || !availabilityStatus?.available) {
      setError('Please choose an available web address');
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

      const result = currentDeployment?.deployment_status === 'deployed' 
        ? await updateDeployment(caseId, deployData)
        : await deployCase(caseId, deployData);

      setDeploymentResult(result);
      setStep(3);
      
      pollDeploymentStatus(result.deployment_id);
    } catch (error) {
      setError(error.message || 'Something went wrong. Let\'s try again!');
      setIsDeploying(false);
    }
  };

  const pollDeploymentStatus = (deploymentId) => {
    let pollAttempts = 0;
    const maxPollAttempts = 60; // 60 * 5 seconds = 5 minutes
    
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
          setError('Deployment ran into an issue. Let\'s try again!');
          setStep(2); // Stay on step 2 to show error
        } else if (pollAttempts >= maxPollAttempts) {
          // Handle timeout - deployment taking too long
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          setError('Deployment is taking longer than expected. Please check back in a few minutes or contact support.');
          setStep(2); // Stay on step 2 to show error
        }
        // Continue polling if still deploying and under max attempts
      } catch (error) {
        console.error('Error polling deployment status:', error);
        pollAttempts += 5; // Count errors more heavily
        
        if (pollAttempts >= maxPollAttempts) {
          clearInterval(interval);
          pollIntervalRef.current = null;
          setIsDeploying(false);
          setError('Unable to check deployment status. Please refresh the page.');
          setStep(2); // Stay on step 2 to show error
        }
      }
    }, 5000);

    // Store interval ID for cleanup
    pollIntervalRef.current = interval;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <RocketLaunchIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentDeployment?.deployment_status === 'deployed' ? 
                    'Update Your Memorial' : 
                    'Launch Your Memorial Site'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Share {caseData.first_name}'s story with the world
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/60 rounded-lg transition-all"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        {step < 3 && (
          <div className="px-6 py-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                step === 1 ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
              }`}>
                <span className="font-medium">1</span>
                <span>Choose Address</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200">
                <div className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all ${
                  step > 1 ? 'w-full' : 'w-0'
                }`} />
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                step === 2 ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
              }`}>
                <span className="font-medium">2</span>
                <span>Launch</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Pick a memorable web address
                </h3>
                <p className="text-gray-600 mb-6">
                  This is how people will find and remember {caseData.first_name}'s memorial site.
                </p>

                {/* Preview URL */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Your memorial will be at:</p>
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-lg text-gray-800">
                      {selectedSubdomain || '[choose-name]'}.caseclosure.org
                    </span>
                  </div>
                </div>

                {/* Suggested Options */}
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-gray-700">Suggested names for you:</p>
                  <div className="grid gap-2">
                    {suggestedSubdomains.map((suggestion) => (
                      <button
                        key={suggestion.value}
                        onClick={() => handleSubdomainSelect(suggestion.value)}
                        className={`p-4 text-left border-2 rounded-xl transition-all ${
                          selectedSubdomain === suggestion.value
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{suggestion.icon}</span>
                            <div>
                              <p className="font-mono text-gray-800">
                                {suggestion.value}.caseclosure.org
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{suggestion.label}</p>
                            </div>
                          </div>
                          {selectedSubdomain === suggestion.value && (
                            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Or create your own:
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={customSubdomain}
                      onChange={handleCustomSubdomainChange}
                      placeholder="your-custom-name"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                      minLength={3}
                      maxLength={50}
                    />
                    <span className="text-gray-500 text-sm">.caseclosure.org</span>
                  </div>
                  
                  {isCheckingAvailability && (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Checking...
                    </p>
                  )}
                  {availabilityStatus && (
                    <p className={`text-sm flex items-center gap-2 ${
                      availabilityStatus.available ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {availabilityStatus.available ? '✅' : '⚠️'}
                      {availabilityStatus.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center py-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                <RocketLaunchIcon className="w-16 h-16 text-blue-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Ready to launch?
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your memorial will be live at:
                </p>
                <p className="text-xl font-mono text-blue-600 mt-2">
                  {selectedSubdomain}.caseclosure.org
                </p>
              </div>

              {isDeploying && (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="text-gray-600">Creating your memorial site...</p>
                  <p className="text-sm text-gray-500">This usually takes about 30 seconds</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Taking too long? Refresh the page
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-left max-w-md mx-auto">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center py-12">
              <div className="inline-flex p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                <SparklesIcon className="w-16 h-16 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Your memorial is live! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  {caseData.first_name}'s story is now available for everyone to see and share.
                </p>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                  <a 
                    href={`https://${selectedSubdomain}.caseclosure.org`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-mono text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    https://{selectedSubdomain}.caseclosure.org
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            {step === 1 && (
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedSubdomain || !availabilityStatus?.available}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    selectedSubdomain && availabilityStatus?.available
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue →
                </button>
              </>
            )}
            
            {step === 2 && !isDeploying && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleDeploy}
                  className="px-8 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Launch Site 🚀
                </button>
              </>
            )}

            {step === 2 && isDeploying && (
              <div className="mx-auto text-gray-500 text-sm">
                Please wait while we deploy your site...
              </div>
            )}

            {step === 3 && (
              <button
                onClick={onClose}
                className="mx-auto px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;