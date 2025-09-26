import React, { useState, useEffect } from 'react';
import api from '@/utils/axios';
import { 
  Settings, Shield, UserPlus, Globe, AlertCircle, 
  Save, RefreshCw, Lock, Unlock, Users, Mail,
  CheckCircle, XCircle, Info
} from 'lucide-react';

export default function SiteSettings({ onRefresh }) {
  const [settings, setSettings] = useState({
    registration_mode: 'invite_only',
    beta_message: '',
    enable_google_auth: false,
    enable_case_creation: true,
    enable_public_pages: true,
    max_users: 0,
    user_count: 0,
    maintenance_mode: false,
    maintenance_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/admin/settings/');
      setSettings(response.data);
      setOriginalSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load site settings');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await api.patch('/auth/admin/settings/', settings);
      setMessage('Settings saved successfully!');
      setOriginalSettings(settings);
      setHasChanges(false);
      if (onRefresh) onRefresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    }
    setSaving(false);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getRegistrationModeInfo = (mode) => {
    switch(mode) {
      case 'open':
        return {
          icon: <Unlock className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Anyone can register for an account'
        };
      case 'invite_only':
        return {
          icon: <UserPlus className="w-5 h-5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          description: 'Registration requires an invite code'
        };
      case 'closed':
        return {
          icon: <Lock className="w-5 h-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Registration is completely disabled'
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          description: 'Unknown mode'
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  const modeInfo = getRegistrationModeInfo(settings.registration_mode);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage registration, authentication, and site features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Registration Settings
          </h3>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${modeInfo.bgColor}`}>
                  <span className={modeInfo.color}>{modeInfo.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Current Mode: {settings.registration_mode.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {modeInfo.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.user_count}
                  {settings.max_users > 0 && (
                    <span className="text-sm font-normal text-slate-500">
                      /{settings.max_users}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Registration Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['open', 'invite_only', 'closed'].map(mode => {
                  const info = getRegistrationModeInfo(mode);
                  return (
                    <button
                      key={mode}
                      onClick={() => updateSetting('registration_mode', mode)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.registration_mode === mode
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className={`${info.color} mb-2`}>{info.icon}</div>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {mode.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Registration Message
              </label>
              <textarea
                value={settings.beta_message}
                onChange={(e) => updateSetting('beta_message', e.target.value)}
                placeholder="Message shown to users when registration is closed or invite-only"
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Max Users (0 = unlimited)
              </label>
              <input
                type="number"
                value={settings.max_users}
                onChange={(e) => updateSetting('max_users', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Feature Settings
          </h3>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
            {[
              { key: 'enable_google_auth', label: 'Enable Google Authentication', icon: <Mail className="w-4 h-4" /> },
              { key: 'enable_case_creation', label: 'Enable Case Creation', icon: <Users className="w-4 h-4" /> },
              { key: 'enable_public_pages', label: 'Enable Public Pages', icon: <Globe className="w-4 h-4" /> }
            ].map(feature => (
              <label key={feature.key} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-slate-400">{feature.icon}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{feature.label}</span>
                </div>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={settings[feature.key]}
                    onChange={(e) => updateSetting(feature.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Maintenance Mode
          </h3>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-4">
            <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${settings.maintenance_mode ? 'text-red-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Enable Maintenance Mode</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Show maintenance message to all non-admin users
                  </p>
                </div>
              </div>
              <div className="relative inline-block w-12 h-6">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </div>
            </label>
            
            {settings.maintenance_mode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                  placeholder="Message shown during maintenance"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}