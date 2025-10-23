import React, { useState, useEffect } from 'react';
import api from '@/utils/axios';
import { 
  ShieldCheckIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function SiteSettings({ onRefresh }) {
  const [settings, setSettings] = useState({
    beta_mode_enabled: false,
    require_invite_code: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/auth/settings/site/');
      setSettings({
        beta_mode_enabled: response.data.invite_only_mode || response.data.beta_mode_enabled || false,
        require_invite_code: response.data.invite_only_mode || response.data.beta_mode_enabled || false
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      console.error('Full error response:', error.response);
      setSettings({
        beta_mode_enabled: true,
        require_invite_code: true
      });
      setMessage({
        type: 'error',
        text: 'Failed to load settings. You may not have admin access.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBetaMode = async () => {
    setSaving(true);
    try {
      const newValue = !settings.beta_mode_enabled;
      const response = await api.patch('/auth/settings/site/', {
        invite_only_mode: newValue
      });
      
      // Update state with the new values
      const updatedSettings = {
        beta_mode_enabled: response.data.invite_only_mode !== undefined ? response.data.invite_only_mode : newValue,
        require_invite_code: response.data.invite_only_mode !== undefined ? response.data.invite_only_mode : newValue
      };
      
      setSettings(updatedSettings);
      
      setMessage({
        type: 'success',
        text: `Beta mode ${newValue ? 'enabled' : 'disabled'}. ${
          newValue 
            ? 'New users will need to request accounts or use invite codes.' 
            : 'Open registration is now available.'
        }`
      });
      
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating settings:', error);
      console.error('Full error response:', error.response);
      
      let errorText = 'Failed to update settings';
      if (error.response?.status === 403) {
        errorText = 'You do not have permission to modify settings. Only administrators can change site settings.';
      } else if (error.response?.status === 401) {
        errorText = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.error) {
        errorText = error.response.data.error;
      }
      
      setMessage({
        type: 'error',
        text: errorText
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Site Settings</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Beta Mode Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <BeakerIcon className="w-6 h-6 text-indigo-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Beta Mode / Invite-Only Registration
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Control whether new users can freely sign up or need to request access.
              </p>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  When enabled:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Request Account page will be available at /request-account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Sign up page will require an invite code
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    Users without invite codes must request account approval
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Beta Mode:
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    settings.beta_mode_enabled
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {settings.beta_mode_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <button
                  onClick={handleToggleBetaMode}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.beta_mode_enabled
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:opacity-50`}
                >
                  {saving ? 'Updating...' : settings.beta_mode_enabled ? 'Disable Beta Mode' : 'Enable Beta Mode'}
                </button>
              </div>

              {settings.beta_mode_enabled && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Beta mode is active
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        New users must request access or have an invite code to sign up.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}