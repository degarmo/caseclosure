// @/components/CaseCreator/views/CustomizationView/components/QuickInfoPanel.jsx

import React from 'react';
import { 
  Info, 
  User, 
  Calendar, 
  Image, 
  DollarSign, 
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

/**
 * Quick info panel showing case data summary
 */
const QuickInfoPanel = ({ 
  caseData, 
  templateInfo,
  customizationProgress,
  onRefreshData,
  show = true,
  position = 'bottom-left', // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
  className = '' 
}) => {
  if (!show) return null;

  // Position classes
  const positionClasses = {
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
    'top-left': 'top-20 left-8',
    'top-right': 'top-20 right-8'
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const requiredFields = [
      'first_name',
      'last_name',
      'case_type',
      'primary_photo',
      'date_of_birth',
      'description'
    ];
    
    const completedFields = requiredFields.filter(field => 
      caseData?.[field] && caseData[field] !== ''
    );
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Get status icon
  const getStatusIcon = (value) => {
    if (value) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    return <XCircle className="w-3 h-3 text-gray-400" />;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} z-30 
        bg-white rounded-lg shadow-lg 
        max-w-xs w-72
        ${className}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Info className="w-4 h-4" />
            Case Information
          </h4>
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Completion Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Profile Completion</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                completionPercentage === 100 
                  ? 'bg-green-500' 
                  : completionPercentage >= 60 
                    ? 'bg-blue-500' 
                    : 'bg-amber-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <User className="w-3 h-3" />
              Name:
            </span>
            <span className="font-medium text-gray-900">
              {caseData?.first_name && caseData?.last_name 
                ? `${caseData.first_name} ${caseData.last_name}`
                : <span className="text-gray-400">Not set</span>
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <AlertCircle className="w-3 h-3" />
              Case Type:
            </span>
            <span className="font-medium text-gray-900">
              {caseData?.crime_type || caseData?.case_type || 
                <span className="text-gray-400">Not set</span>
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-3 h-3" />
              Date of Birth:
            </span>
            <span className="font-medium text-gray-900">
              {caseData?.date_of_birth 
                ? formatDate(caseData.date_of_birth)
                : <span className="text-gray-400">Not set</span>
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Image className="w-3 h-3" />
              Primary Photo:
            </span>
            {getStatusIcon(caseData?.primary_photo)}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <DollarSign className="w-3 h-3" />
              Reward:
            </span>
            <span className="font-medium text-gray-900">
              {caseData?.reward_amount 
                ? `$${parseInt(caseData.reward_amount).toLocaleString()}`
                : <span className="text-gray-400">Not set</span>
              }
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Globe className="w-3 h-3" />
              Subdomain:
            </span>
            <span className="font-medium text-gray-900">
              {caseData?.subdomain || 
                <span className="text-gray-400">Not set</span>
              }
            </span>
          </div>
        </div>

        {/* Template Info */}
        {templateInfo && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Template:</span>
                <span className="font-medium text-gray-900">
                  {templateInfo.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pages:</span>
                <span className="font-medium text-gray-900">
                  {templateInfo.pageCount} available
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Customization Progress */}
        {customizationProgress && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Customizations:</span>
                <span className="font-medium text-gray-900">
                  {customizationProgress.saved ? 'Saved' : 'Unsaved changes'}
                </span>
              </div>
              {customizationProgress.lastSave && (
                <div className="flex justify-between">
                  <span>Last saved:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(customizationProgress.lastSave).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Missing Required Fields */}
        {completionPercentage < 100 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs">
              <div className="text-amber-600 font-medium mb-1">
                Missing Information:
              </div>
              <ul className="space-y-0.5 text-gray-600">
                {!caseData?.first_name && <li>• First name</li>}
                {!caseData?.last_name && <li>• Last name</li>}
                {!caseData?.case_type && !caseData?.crime_type && <li>• Case type</li>}
                {!caseData?.primary_photo && <li>• Primary photo</li>}
                {!caseData?.date_of_birth && <li>• Date of birth</li>}
                {!caseData?.description && <li>• Description</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickInfoPanel;