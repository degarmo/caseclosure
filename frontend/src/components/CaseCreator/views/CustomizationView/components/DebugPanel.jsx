// @/components/CaseCreator/views/CustomizationView/components/DebugPanel.jsx

import React, { useState } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check,
  Download,
  RefreshCw,
  Bug
} from 'lucide-react';

/**
 * Debug panel component for development
 */
const DebugPanel = ({ 
  show, 
  onClose, 
  customizations, 
  caseData,
  validationState,
  lastSaveTime,
  changes,
  templateInfo,
  className = '' 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    customizations: true,
    caseData: false,
    validation: false,
    changes: false,
    performance: false
  });
  
  const [copiedSection, setCopiedSection] = useState(null);

  if (!show) return null;

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Copy to clipboard
  const copyToClipboard = async (data, section) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export as JSON file
  const exportAsJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Calculate data sizes
  const customizationsSize = JSON.stringify(customizations).length;
  const caseDataSize = JSON.stringify(caseData).length;

  return (
    <div 
      className={`
        fixed bottom-20 left-8 z-40 
        bg-gray-900 text-gray-100 
        rounded-lg shadow-2xl 
        max-w-lg w-96
        font-mono text-xs
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-yellow-400" />
          <h4 className="text-yellow-400 font-bold">Debug Panel</h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close debug panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* Customizations Section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('customizations')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.customizations ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
              <span className="text-green-400">Customizations</span>
              <span className="text-gray-500">({formatSize(customizationsSize)})</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(customizations, 'customizations');
                }}
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Copy customizations"
              >
                {copiedSection === 'customizations' ? 
                  <Check className="w-3 h-3 text-green-400" /> : 
                  <Copy className="w-3 h-3" />
                }
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportAsJSON(customizations, 'customizations');
                }}
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Export customizations"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </button>
          
          {expandedSections.customizations && (
            <pre className="p-3 overflow-auto max-h-60 bg-black text-gray-300 text-xs">
              {JSON.stringify(customizations, null, 2)}
            </pre>
          )}
        </div>

        {/* Case Data Section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('caseData')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.caseData ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
              <span className="text-blue-400">Case Data</span>
              <span className="text-gray-500">({formatSize(caseDataSize)})</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(caseData, 'caseData');
                }}
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Copy case data"
              >
                {copiedSection === 'caseData' ? 
                  <Check className="w-3 h-3 text-green-400" /> : 
                  <Copy className="w-3 h-3" />
                }
              </button>
            </div>
          </button>
          
          {expandedSections.caseData && (
            <pre className="p-3 overflow-auto max-h-60 bg-black text-gray-300 text-xs">
              {JSON.stringify({
                first_name: caseData?.first_name,
                last_name: caseData?.last_name,
                case_type: caseData?.case_type,
                crime_type: caseData?.crime_type,
                primary_photo: caseData?.primary_photo ? 'uploaded' : 'none',
                reward_amount: caseData?.reward_amount,
                subdomain: caseData?.subdomain,
                custom_domain: caseData?.custom_domain
              }, null, 2)}
            </pre>
          )}
        </div>

        {/* Validation Section */}
        {validationState && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('validation')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedSections.validation ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                <span className={validationState.valid ? 'text-green-400' : 'text-red-400'}>
                  Validation
                </span>
                <span className="text-gray-500">
                  ({validationState.valid ? 'Valid' : `${validationState.errors?.length || 0} errors`})
                </span>
              </div>
            </button>
            
            {expandedSections.validation && (
              <div className="p-3 bg-black">
                {validationState.errors?.length > 0 && (
                  <div className="mb-2">
                    <div className="text-red-400 mb-1">Errors:</div>
                    {validationState.errors.map((error, i) => (
                      <div key={i} className="text-red-300 ml-2">• {error}</div>
                    ))}
                  </div>
                )}
                {validationState.warnings?.length > 0 && (
                  <div>
                    <div className="text-yellow-400 mb-1">Warnings:</div>
                    {validationState.warnings.map((warning, i) => (
                      <div key={i} className="text-yellow-300 ml-2">• {warning}</div>
                    ))}
                  </div>
                )}
                {validationState.valid && !validationState.warnings?.length && (
                  <div className="text-green-400">✓ All validations passed</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Changes Section */}
        {changes && changes.length > 0 && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection('changes')}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedSections.changes ? 
                  <ChevronDown className="w-3 h-3" /> : 
                  <ChevronRight className="w-3 h-3" />
                }
                <span className="text-purple-400">Recent Changes</span>
                <span className="text-gray-500">({changes.length})</span>
              </div>
            </button>
            
            {expandedSections.changes && (
              <div className="p-3 bg-black max-h-40 overflow-auto">
                {changes.map((change, i) => (
                  <div key={i} className="mb-2 text-xs">
                    <div className="text-purple-300">{change.path}:</div>
                    <div className="ml-2 text-gray-400">
                      <span className="text-red-400">- {JSON.stringify(change.oldValue)}</span>
                      <br />
                      <span className="text-green-400">+ {JSON.stringify(change.newValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Performance Section */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleSection('performance')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.performance ? 
                <ChevronDown className="w-3 h-3" /> : 
                <ChevronRight className="w-3 h-3" />
              }
              <span className="text-cyan-400">Performance</span>
            </div>
          </button>
          
          {expandedSections.performance && (
            <div className="p-3 bg-black">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Template:</span>
                  <span className="text-cyan-300">{templateInfo?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pages:</span>
                  <span className="text-cyan-300">{templateInfo?.pageCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Save:</span>
                  <span className="text-cyan-300">
                    {lastSaveTime ? new Date(lastSaveTime).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Size:</span>
                  <span className="text-cyan-300">
                    {formatSize(customizationsSize + caseDataSize)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Press ESC to close
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          aria-label="Reload page"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload</span>
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;