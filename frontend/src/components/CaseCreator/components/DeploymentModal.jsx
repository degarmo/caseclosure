// src/components/CaseCreator/components/DeploymentModal.jsx

import React, { useState } from 'react';
import { X, Globe, Rocket, AlertCircle, Loader2 } from 'lucide-react';

/**
 * DeploymentModal Component
 * Modal for configuring domain and deploying the website
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close modal handler
 * @param {function} onDeploy - Deploy handler
 * @param {boolean} loading - Whether deployment is in progress
 * @param {Object} caseData - Case data (for generating subdomain suggestion)
 */
const DeploymentModal = ({ 
  isOpen, 
  onClose, 
  onDeploy, 
  loading,
  caseData 
}) => {
  const [domainType, setDomainType] = useState('subdomain');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [error, setError] = useState('');
  
  // Generate subdomain suggestion from case data
  React.useEffect(() => {
    if (caseData?.first_name && caseData?.last_name && !subdomain) {
      const suggested = `${caseData.first_name}${caseData.last_name}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      setSubdomain(suggested);
    }
  }, [caseData, subdomain]);
  
  if (!isOpen) return null;
  
  const handleDeploy = () => {
    setError('');
    
    // Validate domain configuration
    if (domainType === 'subdomain') {
      if (!subdomain) {
        setError('Please enter a subdomain');
        return;
      }
      if (subdomain.length < 3) {
        setError('Subdomain must be at least 3 characters');
        return;
      }
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return;
      }
    } else {
      if (!customDomain) {
        setError('Please enter a custom domain');
        return;
      }
      if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(customDomain.toLowerCase())) {
        setError('Please enter a valid domain (e.g., example.com)');
        return;
      }
    }
    
    // Call deploy with domain configuration
    const domainConfig = {
      subdomain: domainType === 'subdomain' ? subdomain : '',
      custom_domain: domainType === 'custom' ? customDomain : ''
    };
    
    onDeploy(domainConfig);
  };
  
  const sanitizeSubdomain = (value) => {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Deploy Your Website
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Domain Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Choose your domain type
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="subdomain"
                    checked={domainType === 'subdomain'}
                    onChange={(e) => setDomainType(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium">Free Subdomain</div>
                    <div className="text-xs text-gray-500">yourcase.caseclosure.org</div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="custom"
                    checked={domainType === 'custom'}
                    onChange={(e) => setDomainType(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium">Custom Domain</div>
                    <div className="text-xs text-gray-500">Use your own domain</div>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Domain Input */}
            {domainType === 'subdomain' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subdomain
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(sanitizeSubdomain(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="yourcase"
                  />
                  <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                    .caseclosure.org
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Letters, numbers, and hyphens only
                </p>
              </div>
            )}
            
            {domainType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Domain
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="yourdomain.com"
                />
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium mb-1">DNS Configuration Required</p>
                      <p>After deployment, you'll need to point your domain's DNS to our servers. We'll provide instructions.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Deploy Website
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal;