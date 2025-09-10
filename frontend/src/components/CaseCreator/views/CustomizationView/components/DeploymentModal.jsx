// @/components/CaseCreator/views/CustomizationView/components/DeploymentModal.jsx

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Globe,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Server
} from 'lucide-react';
import { DEPLOYMENT_STATUS } from '../utils/deploymentHelpers';

/**
 * Modal component for deployment status and feedback
 */
const DeploymentModal = ({
  isOpen,
  onClose,
  deploymentStatus,
  deploymentError,
  deploymentUrl,
  deploymentProgress = 0,
  estimatedTime,
  onRetry,
  onViewSite,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time during deployment
  useEffect(() => {
    let interval;
    
    if (deploymentStatus === DEPLOYMENT_STATUS.DEPLOYING || 
        deploymentStatus === DEPLOYMENT_STATUS.CHECKING) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deploymentStatus]);

  if (!isOpen) return null;

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (!deploymentUrl) return;
    
    try {
      await navigator.clipboard.writeText(deploymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case DEPLOYMENT_STATUS.COMPLETED:
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case DEPLOYMENT_STATUS.FAILED:
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case DEPLOYMENT_STATUS.DEPLOYING:
      case DEPLOYMENT_STATUS.CHECKING:
      case DEPLOYMENT_STATUS.PREPARING:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
      default:
        return <Globe className="w-12 h-12 text-gray-400" />;
    }
  };

  // Get status title
  const getStatusTitle = () => {
    switch (deploymentStatus) {
      case DEPLOYMENT_STATUS.COMPLETED:
        return 'Deployment Successful!';
      case DEPLOYMENT_STATUS.FAILED:
        return 'Deployment Failed';
      case DEPLOYMENT_STATUS.PREPARING:
        return 'Preparing Deployment...';
      case DEPLOYMENT_STATUS.DEPLOYING:
        return 'Deploying Your Website...';
      case DEPLOYMENT_STATUS.CHECKING:
        return 'Verifying Deployment...';
      case DEPLOYMENT_STATUS.CANCELLED:
        return 'Deployment Cancelled';
      default:
        return 'Deployment Status';
    }
  };

  // Get status message
  const getStatusMessage = () => {
    switch (deploymentStatus) {
      case DEPLOYMENT_STATUS.COMPLETED:
        return 'Your website has been successfully deployed and is now live!';
      case DEPLOYMENT_STATUS.FAILED:
        return deploymentError?.message || 'There was an error deploying your website. Please try again.';
      case DEPLOYMENT_STATUS.PREPARING:
        return 'Setting up your deployment configuration...';
      case DEPLOYMENT_STATUS.DEPLOYING:
        return 'Publishing your website to the cloud. This may take a few minutes.';
      case DEPLOYMENT_STATUS.CHECKING:
        return 'Running final checks to ensure everything is working correctly...';
      case DEPLOYMENT_STATUS.CANCELLED:
        return 'The deployment was cancelled.';
      default:
        return 'Waiting to start deployment...';
    }
  };

  const isLoading = [
    DEPLOYMENT_STATUS.PREPARING,
    DEPLOYMENT_STATUS.DEPLOYING,
    DEPLOYMENT_STATUS.CHECKING
  ].includes(deploymentStatus);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center p-4
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deployment-modal-title"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex justify-between items-start p-6 pb-0">
            <div className="flex-1">
              {/* Icon and Title */}
              <div className="flex flex-col items-center text-center mb-4">
                {getStatusIcon()}
                <h3 
                  id="deployment-modal-title"
                  className="text-lg font-semibold mt-4 text-gray-900"
                >
                  {getStatusTitle()}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {getStatusMessage()}
                </p>
              </div>
            </div>
            
            {/* Close button (only show when not loading) */}
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Progress Bar */}
            {isLoading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(deploymentProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${deploymentProgress}%` }}
                  />
                </div>
                
                {/* Time indicators */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Elapsed: {formatTime(elapsedTime)}
                  </span>
                  {estimatedTime && (
                    <span>
                      Est. remaining: {formatTime(Math.max(0, estimatedTime - elapsedTime))}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Deployment Steps */}
            {isLoading && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${
                    deploymentProgress >= 30 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {deploymentProgress >= 30 ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    <span>Preparing files and assets</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    deploymentProgress >= 60 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {deploymentProgress >= 60 ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : deploymentProgress >= 30 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>Uploading to server</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    deploymentProgress >= 90 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {deploymentProgress >= 90 ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : deploymentProgress >= 60 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>Configuring domain and SSL</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${
                    deploymentStatus === DEPLOYMENT_STATUS.COMPLETED ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {deploymentStatus === DEPLOYMENT_STATUS.COMPLETED ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : deploymentProgress >= 90 ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>Running health checks</span>
                  </div>
                </div>
              </div>
            )}

            {/* Success URL Display */}
            {deploymentStatus === DEPLOYMENT_STATUS.COMPLETED && deploymentUrl && (
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">
                    Your website is live at:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deploymentUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm text-gray-700"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    aria-label="Copy URL"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Details */}
            {deploymentStatus === DEPLOYMENT_STATUS.FAILED && deploymentError && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900 mb-1">
                      {deploymentError.title || 'Error Details'}
                    </div>
                    <div className="text-xs text-red-700">
                      {deploymentError.message}
                    </div>
                    {deploymentError.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-600 cursor-pointer">
                          More details
                        </summary>
                        <pre className="mt-2 text-xs text-red-600 overflow-auto">
                          {JSON.stringify(deploymentError.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {deploymentStatus === DEPLOYMENT_STATUS.COMPLETED && (
                <>
                  <button
                    onClick={onViewSite || (() => window.open(deploymentUrl, '_blank'))}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Website
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
              
              {deploymentStatus === DEPLOYMENT_STATUS.FAILED && (
                <>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Server className="w-4 h-4" />
                      Try Again
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
              
              {deploymentStatus === DEPLOYMENT_STATUS.CANCELLED && (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeploymentModal;