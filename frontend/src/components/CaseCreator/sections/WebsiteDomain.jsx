// src/components/CaseCreator/sections/WebsiteDomain.jsx

import React from 'react';
import { Globe } from 'lucide-react';
import SectionWrapper from '../components/SectionWrapper';
import InputField from '../components/InputField';
import { DOMAIN_PREFERENCES } from '../constants';
import { sanitizeSubdomain } from '../utils';

/**
 * WebsiteDomain Section Component
 * Handles website domain configuration
 * 
 * @param {Object} caseData - Current case data
 * @param {Object} errors - Field validation errors
 * @param {function} onChange - Handler for field changes
 */
const WebsiteDomain = ({ 
  caseData, 
  errors, 
  onChange 
}) => {
  
  const handleSubdomainChange = (value) => {
    const sanitized = sanitizeSubdomain(value);
    onChange('subdomain', sanitized);
  };
  
  return (
    <SectionWrapper 
      title="Website Domain" 
      icon={<Globe className="w-5 h-5" />}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={DOMAIN_PREFERENCES.SUBDOMAIN}
              checked={caseData.domain_preference === DOMAIN_PREFERENCES.SUBDOMAIN}
              onChange={(e) => onChange('domain_preference', e.target.value)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Use CaseClosure subdomain</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value={DOMAIN_PREFERENCES.CUSTOM}
              checked={caseData.domain_preference === DOMAIN_PREFERENCES.CUSTOM}
              onChange={(e) => onChange('domain_preference', e.target.value)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Use custom domain</span>
          </label>
        </div>
        
        {caseData.domain_preference === DOMAIN_PREFERENCES.SUBDOMAIN && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={caseData.subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-l-md text-sm ${
                  errors.subdomain ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="yourcase"
              />
              <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                .caseclosure.org
              </span>
            </div>
            {errors.subdomain && (
              <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
            )}
          </div>
        )}
        
        {caseData.domain_preference === DOMAIN_PREFERENCES.CUSTOM && (
          <div>
            <InputField
              label="Custom Domain"
              value={caseData.custom_domain}
              onChange={(value) => onChange('custom_domain', value)}
              placeholder="yourdomain.com"
              error={errors.custom_domain}
              helpText="You'll need to configure DNS settings after deployment"
            />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};

export default WebsiteDomain;