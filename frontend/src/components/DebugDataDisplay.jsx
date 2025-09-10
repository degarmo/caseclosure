// @/components/DebugDataDisplay.jsx
// Component to display the actual data being passed to templates

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const DebugDataDisplay = ({ caseData, customizations, show = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Extract key information
  const keyInfo = {
    'Case ID': caseData?.id,
    'Case Type': caseData?.case_type || caseData?.crime_type,
    'Name': `${caseData?.first_name} ${caseData?.last_name}`,
    'Has Photos': caseData?.photos?.length > 0 ? `Yes (${caseData.photos.length})` : 'No',
    'Primary Photo URL': caseData?.primary_photo_url || 'None',
    'Victim Photo URL': caseData?.victim_photo_url || 'None',
    'Template ID': caseData?.template_id,
    'Reward Amount': caseData?.reward_amount,
    'Detective Name': caseData?.detective_name,
    'Detective Phone': caseData?.detective_phone,
    'Agency': caseData?.investigating_agency,
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
        >
          <span className="text-sm font-mono">Debug Data</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        
        {isExpanded && (
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {/* Key Information */}
            <div>
              <h3 className="text-xs font-bold mb-2 text-green-400">Key Information:</h3>
              <div className="bg-gray-800 rounded p-2 text-xs font-mono space-y-1">
                {Object.entries(keyInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className={value ? 'text-white' : 'text-red-400'}>
                      {value || 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Case Data */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-blue-400">Case Data:</h3>
                <button
                  onClick={() => copyToClipboard(caseData, 'caseData')}
                  className="text-xs hover:text-blue-400 transition-colors"
                >
                  {copiedField === 'caseData' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <pre className="bg-gray-800 rounded p-2 text-xs overflow-x-auto">
                {JSON.stringify(caseData, null, 2).slice(0, 500)}...
              </pre>
            </div>

            {/* Customizations */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-yellow-400">Customizations:</h3>
                <button
                  onClick={() => copyToClipboard(customizations, 'customizations')}
                  className="text-xs hover:text-yellow-400 transition-colors"
                >
                  {copiedField === 'customizations' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <pre className="bg-gray-800 rounded p-2 text-xs overflow-x-auto">
                {JSON.stringify(customizations, null, 2).slice(0, 300)}...
              </pre>
            </div>

            {/* Photo Debug */}
            {caseData?.photos && caseData.photos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold mb-1 text-purple-400">Photos:</h3>
                <div className="bg-gray-800 rounded p-2 text-xs space-y-1">
                  {caseData.photos.map((photo, index) => (
                    <div key={index} className="text-gray-300">
                      Photo {index + 1}: {photo.image_url || photo.image || 'No URL'}
                      {photo.is_primary && <span className="text-green-400 ml-2">(Primary)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugDataDisplay;