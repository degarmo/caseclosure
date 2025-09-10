// @/components/CaseCreator/views/CustomizationView/components/FloatingDeployButton.jsx

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Rocket, 
  Check, 
  AlertCircle,
  Loader2,
  ChevronUp,
  X
} from 'lucide-react';

/**
 * Floating deploy button with status and animations
 */
const FloatingDeployButton = ({
  onClick,
  isDeploying = false,
  deploymentStatus,
  show = true,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  expanded = false,
  lastDeployTime,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-20 right-8',
    'top-left': 'top-20 left-8'
  };

  // Trigger pulse animation on status change
  useEffect(() => {
    if (deploymentStatus === 'completed' || deploymentStatus === 'failed') {
      setPulseAnimation(true);
      const timer = setTimeout(() => setPulseAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [deploymentStatus]);

  if (!show) return null;

  // Get button color based on status
  const getButtonColor = () => {
    if (isDeploying) return 'from-blue-500 to-blue-600';
    if (deploymentStatus === 'completed') return 'from-green-500 to-green-600';
    if (deploymentStatus === 'failed') return 'from-red-500 to-red-600';
    return 'from-purple-500 to-blue-500';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isDeploying) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (deploymentStatus === 'completed') return <Check className="w-5 h-5" />;
    if (deploymentStatus === 'failed') return <AlertCircle className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  // Get status text
  const getStatusText = () => {
    if (isDeploying) return 'Deploying...';
    if (deploymentStatus === 'completed') return 'Deployed!';
    if (deploymentStatus === 'failed') return 'Deploy Failed';
    return 'Deploy Website';
  };

  // Format last deploy time
  const formatLastDeployTime = () => {
    if (!lastDeployTime) return null;
    
    const now = new Date();
    const deployTime = new Date(lastDeployTime);
    const diffMs = now - deployTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const lastDeployTimeFormatted = formatLastDeployTime();

  return (
    <div className={`fixed ${positionClasses[position]} z-30 ${className}`}>
      {/* Expanded Info Panel */}
      {isExpanded && (
        <div className="mb-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px] animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Deployment</h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            {lastDeployTimeFormatted && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last deploy:</span>
                <span className="font-medium text-gray-900">
                  {lastDeployTimeFormatted}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${
                deploymentStatus === 'completed' ? 'text-green-600' :
                deploymentStatus === 'failed' ? 'text-red-600' :
                'text-gray-900'
              }`}>
                {deploymentStatus || 'Ready'}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-gray-600">
                Click to deploy your website with all current customizations.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Button */}
      <div className="relative">
        {/* Pulse animation ring */}
        {pulseAnimation && (
          <div className="absolute inset-0 rounded-full animate-ping">
            <div className={`w-full h-full rounded-full bg-gradient-to-r ${getButtonColor()} opacity-75`} />
          </div>
        )}
        
        {/* Button */}
        <button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isDeploying}
          className={`
            relative
            flex items-center gap-2 
            px-6 py-3 
            bg-gradient-to-r ${getButtonColor()}
            text-white 
            rounded-full 
            shadow-lg hover:shadow-xl 
            transform transition-all duration-300
            ${isHovered && !isDeploying ? 'scale-105' : 'scale-100'}
            ${isDeploying ? 'cursor-wait' : 'cursor-pointer'}
            disabled:opacity-75
          `}
          aria-label={getStatusText()}
        >
          {/* Icon with animation */}
          <div className={`
            transition-transform duration-300
            ${isHovered && !isDeploying ? 'rotate-12' : ''}
          `}>
            {isHovered && !isDeploying && deploymentStatus !== 'completed' && deploymentStatus !== 'failed' ? (
              <Rocket className="w-5 h-5" />
            ) : (
              getStatusIcon()
            )}
          </div>
          
          {/* Text */}
          <span className="font-medium">
            {getStatusText()}
          </span>
          
          {/* Expand/Collapse toggle */}
          {!isExpanded && !isDeploying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Show deployment info"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </button>
        
        {/* Status badge */}
        {deploymentStatus === 'completed' && !pulseAnimation && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
        {deploymentStatus === 'failed' && !pulseAnimation && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>
      
      {/* Tooltip on hover */}
      {isHovered && !isExpanded && lastDeployTimeFormatted && !isDeploying && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          Last deployed {lastDeployTimeFormatted}
        </div>
      )}
    </div>
  );
};

export default FloatingDeployButton;