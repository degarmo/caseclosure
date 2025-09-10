// components/DeployButton/DeployButton.jsx
import React, { useState, useEffect } from 'react';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';
import DeploymentModal from '../DeploymentModal/DeploymentModal';
import { getCaseDeploymentStatus } from '../../services/deploymentAPI';

const DeployButton = ({ caseId, caseData }) => {
  const [showModal, setShowModal] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeploymentStatus();
  }, [caseId]);

  const fetchDeploymentStatus = async () => {
    try {
      const status = await getCaseDeploymentStatus(caseId);
      setDeploymentStatus(status);
    } catch (error) {
      console.error('Error fetching deployment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonColor = () => {
    switch (deploymentStatus?.deployment_status) {
      case 'deployed':
        return 'bg-green-600 hover:bg-green-700';
      case 'deploying':
      case 'updating':
        return 'bg-yellow-600 hover:bg-yellow-700 animate-pulse';
      case 'failed':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const getButtonText = () => {
    switch (deploymentStatus?.deployment_status) {
      case 'deployed':
        return 'Update Site';
      case 'deploying':
        return 'Deploying...';
      case 'updating':
        return 'Updating...';
      case 'failed':
        return 'Retry Deploy';
      default:
        return 'Deploy';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading || ['deploying', 'updating'].includes(deploymentStatus?.deployment_status)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 text-white rounded-full shadow-lg transition-all ${getButtonColor()} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <RocketLaunchIcon className="w-5 h-5" />
        <span className="font-medium">{getButtonText()}</span>
      </button>

      {showModal && (
        <DeploymentModal
          caseId={caseId}
          caseData={caseData}
          currentDeployment={deploymentStatus}
          onClose={() => setShowModal(false)}
          onDeploymentComplete={() => {
            fetchDeploymentStatus();
            setShowModal(false);
          }}
        />
      )}
    </>
  );
};

export default DeployButton;