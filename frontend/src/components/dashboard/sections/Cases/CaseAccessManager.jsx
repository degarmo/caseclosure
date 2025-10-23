// src/components/dashboard/sections/Cases/CaseAccessManager.jsx
import React, { useState, useEffect } from 'react';
import {
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from '../../../../utils/axios';

export default function CaseAccessManager({ caseId, caseName, permissions, onRefresh }) {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  useEffect(() => {
    fetchAccessList();
  }, [caseId]);

  const fetchAccessList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/cases/${caseId}/access_list/`);
      setAccessList(response.data.access_list || []);
    } catch (err) {
      console.error('Error fetching access list:', err);
      setError('Failed to load access list');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (userId, userEmail) => {
    setRevoking(userId);
    try {
      const response = await axios.post(`/cases/${caseId}/revoke_access/`, {
        user_id: userId
      });

      setSuccess(`Access revoked for ${userEmail}`);
      setConfirmRevoke(null);
      
      // Refresh the list
      fetchAccessList();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error revoking access:', err);
      setError(err.response?.data?.error || 'Failed to revoke access');
    } finally {
      setRevoking(null);
    }
  };

  const getAccountTypeLabel = (accountType) => {
    const labels = {
      'detective': 'Law Enforcement',
      'verified': 'Verified Family',
      'advocate': 'Victim Advocate',
      'helper': 'Community Helper',
      'unverified': 'Unverified',
      'admin': 'Administrator'
    };
    return labels[accountType] || accountType;
  };

  const getAccessLevelLabel = (accessLevel) => {
    const labels = {
      'viewer': 'View Only',
      'tips_only': 'Tips Only',
      'leo': 'Law Enforcement',
      'private_investigator': 'Private Investigator',
      'advocate': 'Advocate',
      'collaborator': 'Family Collaborator'
    };
    return labels[accessLevel] || accessLevel;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manage Access
        </h2>
        <button
          onClick={fetchAccessList}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Access List Table */}
      {accessList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No one has access to this case yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Account Type
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Access Level
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Added
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Last Accessed
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {accessList.map(access => (
                <tr
                  key={access.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {access.first_name} {access.last_name}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {access.email}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded">
                      {getAccountTypeLabel(access.account_type)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm font-medium rounded">
                      {getAccessLevelLabel(access.access_level)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(access.invited_at)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {access.last_accessed ? formatDate(access.last_accessed) : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {confirmRevoke === access.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleRevokeAccess(access.user_id, access.email)
                          }
                          disabled={revoking === access.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm rounded transition"
                        >
                          {revoking === access.id ? 'Revoking...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(null)}
                          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white text-sm rounded transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRevoke(access.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                        title="Revoke access"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total users with access: <span className="font-semibold">{accessList.length}</span>
        </p>
      </div>
    </div>
  );
}