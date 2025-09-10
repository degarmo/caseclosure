// @/components/CaseCreator/views/CustomizationView/components/SaveStatusIndicator.jsx

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Cloud,
  CloudOff,
  Loader2,
  WifiOff,
  AlertTriangle
} from 'lucide-react';

/**
 * Component to display save and sync status
 */
const SaveStatusIndicator = ({
  saveStatus,
  saveError,
  unsavedChanges,
  lastSaveTime,
  autoSaveStatus,
  deploymentStatus,
  isDeploying,
  connectionStatus = 'online', // 'online', 'offline', 'slow'
  className = ''
}) => {
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'success', 'error', 'warning', 'info'

  useEffect(() => {
    // Determine what status to show
    if (connectionStatus === 'offline') {
      setStatusMessage('Offline - changes saved locally');
      setStatusType('warning');
      setShowStatus(true);
    } else if (saveStatus === 'saving') {
      setStatusMessage('Saving...');
      setStatusType('info');
      setShowStatus(true);
    } else if (saveStatus === 'success') {
      setStatusMessage('Saved');
      setStatusType('success');
      setShowStatus(true);
      
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (saveStatus === 'error') {
      setStatusMessage(saveError || 'Save failed');
      setStatusType('error');
      setShowStatus(true);
    } else if (autoSaveStatus?.isAutoSaving) {
      setStatusMessage('Auto-saving...');
      setStatusType('info');
      setShowStatus(true);
    } else if (isDeploying) {
      setStatusMessage('Deploying...');
      setStatusType('info');
      setShowStatus(true);
    } else if (deploymentStatus === 'completed') {
      setStatusMessage('Deployed successfully');
      setStatusType('success');
      setShowStatus(true);
      
      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (deploymentStatus === 'failed') {
      setStatusMessage('Deployment failed');
      setStatusType('error');
      setShowStatus(true);
    } else if (unsavedChanges) {
      setStatusMessage('Unsaved changes');
      setStatusType('warning');
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [
    saveStatus,
    saveError,
    unsavedChanges,
    autoSaveStatus,
    deploymentStatus,
    isDeploying,
    connectionStatus
  ]);

  // Format time since last save
  const formatTimeSince = (date) => {
    if (!date) return null;
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Get icon based on status
  const getStatusIcon = () => {
    const iconClass = "w-4 h-4";
    
    if (connectionStatus === 'offline') {
      return <WifiOff className={iconClass} />;
    }
    
    switch (statusType) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'info':
        if (saveStatus === 'saving' || autoSaveStatus?.isAutoSaving || isDeploying) {
          return <Loader2 className={`${iconClass} animate-spin`} />;
        }
        return <Clock className={iconClass} />;
      default:
        return <Cloud className={iconClass} />;
    }
  };

  // Get status color classes
  const getStatusClasses = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-amber-100 text-amber-700';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (!showStatus) {
    // Show minimal indicator if there's a last save time
    if (lastSaveTime && !unsavedChanges) {
      return (
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
          <Cloud className="w-3 h-3" />
          <span>Saved {formatTimeSince(lastSaveTime)}</span>
        </div>
      );
    }
    
    // Show auto-save countdown if active
    if (autoSaveStatus?.nextAutoSaveTime && unsavedChanges) {
      const timeUntil = autoSaveStatus.formatTimeUntilSave?.() || '';
      return (
        <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
          <Clock className="w-3 h-3" />
          <span>Auto-save in {timeUntil}</span>
        </div>
      );
    }
    
    return null;
  }

  return (
    <div 
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
        transition-all duration-300 ease-in-out
        ${getStatusClasses()}
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {getStatusIcon()}
      <span className="font-medium">{statusMessage}</span>
      
      {/* Additional details */}
      {autoSaveStatus?.autoSaveCount > 0 && (
        <span className="text-xs opacity-75">
          ({autoSaveStatus.autoSaveCount} auto-saves)
        </span>
      )}
      
      {deploymentStatus === 'checking' && (
        <span className="text-xs opacity-75">
          Verifying deployment...
        </span>
      )}
    </div>
  );
};

export default SaveStatusIndicator;