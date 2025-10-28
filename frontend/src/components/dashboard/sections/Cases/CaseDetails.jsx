// src/dashboard/components/CaseDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import { 
  ArrowLeft, Save, Eye, Globe, Edit, Trash2, Upload, 
  User, Calendar, MapPin, Phone, Mail, DollarSign, 
  FileText, AlertCircle, CheckCircle, Clock, Loader
} from 'lucide-react';

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Check if user is LEO
  const isLEO = user?.account_type === 'leo';

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/cases/${caseId}/`);
      setCaseData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading case:', err);
      setError('Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch(`/cases/${caseId}/`, caseData);
      setSuccessMessage('Case saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving case:', err);
      setError('Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCaseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/cases/${caseId}/`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting case:', err);
      setError('Failed to delete case');
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'physical', label: 'Physical Description', icon: User },
    { id: 'incident', label: 'Incident Details', icon: MapPin },
    { id: 'investigation', label: 'Investigation', icon: FileText },
    { id: 'reward', label: 'Reward', icon: DollarSign },
    { id: 'deployment', label: 'Deployment', icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {caseData?.case_title || 'Case Details'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Case ID: {caseData?.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isLEO && (
                <>
                  <button
                    onClick={() => navigate(`/editor/${caseId}`)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Customize Template
                  </button>
                </>
              )}
              
              {caseData?.deployment_url && (
                <a
                  href={caseData.deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Live
                </a>
              )}

              {!isLEO && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 sticky top-24">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              {activeTab === 'basic' && <BasicInfoTab caseData={caseData} onChange={handleInputChange} isReadOnly={isLEO} />}
              {activeTab === 'physical' && <PhysicalDescriptionTab caseData={caseData} onChange={handleInputChange} isReadOnly={isLEO} />}
              {activeTab === 'incident' && <IncidentDetailsTab caseData={caseData} onChange={handleInputChange} isReadOnly={isLEO} />}
              {activeTab === 'investigation' && <InvestigationTab caseData={caseData} onChange={handleInputChange} isReadOnly={isLEO} />}
              {activeTab === 'reward' && <RewardTab caseData={caseData} onChange={handleInputChange} isReadOnly={isLEO} />}
              {activeTab === 'deployment' && <DeploymentTab caseData={caseData} caseId={caseId} onRefresh={loadCaseData} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Components
function BasicInfoTab({ caseData, onChange, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          🔒 Read-only mode: You have view access to this case but cannot make changes.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Case Title"
          value={caseData?.case_title || ''}
          onChange={(value) => onChange('case_title', value)}
          required
          disabled={isReadOnly}
        />

        <FormField
          label="Case Type"
          type="select"
          value={caseData?.case_type || 'missing'}
          onChange={(value) => onChange('case_type', value)}
          disabled={isReadOnly}
          options={[
            { value: 'missing', label: 'Missing Person' },
            { value: 'homicide', label: 'Homicide' },
            { value: 'unidentified', label: 'Unidentified' },
            { value: 'cold_case', label: 'Cold Case' },
            { value: 'other', label: 'Other' }
          ]}
        />

        <FormField
          label="First Name"
          value={caseData?.first_name || ''}
          onChange={(value) => onChange('first_name', value)}
          required
          disabled={isReadOnly}
        />

        <FormField
          label="Middle Name"
          value={caseData?.middle_name || ''}
          onChange={(value) => onChange('middle_name', value)}
          disabled={isReadOnly}
        />

        <FormField
          label="Last Name"
          value={caseData?.last_name || ''}
          onChange={(value) => onChange('last_name', value)}
          required
          disabled={isReadOnly}
        />

        <FormField
          label="Nickname"
          value={caseData?.nickname || ''}
          onChange={(value) => onChange('nickname', value)}
          disabled={isReadOnly}
        />

        <FormField
          label="Date of Birth"
          type="date"
          value={caseData?.date_of_birth || ''}
          onChange={(value) => onChange('date_of_birth', value)}
          disabled={isReadOnly}
        />

        <FormField
          label="Date of Death"
          type="date"
          value={caseData?.date_of_death || ''}
          onChange={(value) => onChange('date_of_death', value)}
          disabled={isReadOnly}
        />

        <FormField
          label="Date Missing"
          type="date"
          value={caseData?.date_missing || ''}
          onChange={(value) => onChange('date_missing', value)}
          disabled={isReadOnly}
        />

        <FormField
          label="Case Number"
          value={caseData?.case_number || ''}
          onChange={(value) => onChange('case_number', value)}
          disabled={isReadOnly}
        />
      </div>

      <FormField
        label="Case Description"
        type="textarea"
        value={caseData?.description || ''}
        onChange={(value) => onChange('description', value)}
        rows={6}
        disabled={isReadOnly}
      />
    </div>
  );
}

function PhysicalDescriptionTab({ caseData, onChange, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Physical Description</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Age"
          type="number"
          value={caseData?.age || ''}
          onChange={(value) => onChange('age', value)}
        />

        <FormField
          label="Sex"
          type="select"
          value={caseData?.sex || ''}
          onChange={(value) => onChange('sex', value)}
          options={[
            { value: '', label: 'Select...' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' }
          ]}
        />

        <FormField
          label="Height (Feet)"
          type="number"
          value={caseData?.height_feet || ''}
          onChange={(value) => onChange('height_feet', value)}
        />

        <FormField
          label="Height (Inches)"
          type="number"
          value={caseData?.height_inches || ''}
          onChange={(value) => onChange('height_inches', value)}
        />

        <FormField
          label="Weight (lbs)"
          type="number"
          value={caseData?.weight || ''}
          onChange={(value) => onChange('weight', value)}
        />

        <FormField
          label="Race"
          value={caseData?.race || ''}
          onChange={(value) => onChange('race', value)}
        />

        <FormField
          label="Hair Color"
          value={caseData?.hair_color || ''}
          onChange={(value) => onChange('hair_color', value)}
        />

        <FormField
          label="Eye Color"
          value={caseData?.eye_color || ''}
          onChange={(value) => onChange('eye_color', value)}
        />
      </div>

      <FormField
        label="Distinguishing Features"
        type="textarea"
        value={caseData?.distinguishing_features || ''}
        onChange={(value) => onChange('distinguishing_features', value)}
        placeholder="Scars, tattoos, birthmarks, etc."
        rows={4}
      />
    </div>
  );
}

function IncidentDetailsTab({ caseData, onChange, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Incident Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Incident Date"
          type="date"
          value={caseData?.incident_date || ''}
          onChange={(value) => onChange('incident_date', value)}
        />

        <FormField
          label="Incident Location"
          value={caseData?.incident_location || ''}
          onChange={(value) => onChange('incident_location', value)}
        />

        <FormField
          label="Last Seen Date"
          type="date"
          value={caseData?.last_seen_date || ''}
          onChange={(value) => onChange('last_seen_date', value)}
        />

        <FormField
          label="Last Seen Time"
          type="time"
          value={caseData?.last_seen_time || ''}
          onChange={(value) => onChange('last_seen_time', value)}
        />

        <FormField
          label="Last Seen Location"
          value={caseData?.last_seen_location || ''}
          onChange={(value) => onChange('last_seen_location', value)}
          className="md:col-span-2"
        />
      </div>

      <FormField
        label="Last Seen Wearing"
        type="textarea"
        value={caseData?.last_seen_wearing || ''}
        onChange={(value) => onChange('last_seen_wearing', value)}
        rows={3}
      />

      <FormField
        label="Last Seen With"
        type="textarea"
        value={caseData?.last_seen_with || ''}
        onChange={(value) => onChange('last_seen_with', value)}
        rows={3}
      />

      <FormField
        label="Planned Activities"
        type="textarea"
        value={caseData?.planned_activities || ''}
        onChange={(value) => onChange('planned_activities', value)}
        rows={3}
      />

      <FormField
        label="Transportation Details"
        type="textarea"
        value={caseData?.transportation_details || ''}
        onChange={(value) => onChange('transportation_details', value)}
        rows={3}
      />
    </div>
  );
}

function InvestigationTab({ caseData, onChange, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Investigation Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Investigating Agency"
          value={caseData?.investigating_agency || ''}
          onChange={(value) => onChange('investigating_agency', value)}
          className="md:col-span-2"
        />

        <FormField
          label="Detective Name"
          value={caseData?.detective_name || ''}
          onChange={(value) => onChange('detective_name', value)}
        />

        <FormField
          label="Detective Phone"
          type="tel"
          value={caseData?.detective_phone || ''}
          onChange={(value) => onChange('detective_phone', value)}
        />

        <FormField
          label="Detective Email"
          type="email"
          value={caseData?.detective_email || ''}
          onChange={(value) => onChange('detective_email', value)}
          className="md:col-span-2"
        />
      </div>
    </div>
  );
}

function RewardTab({ caseData, onChange, isReadOnly = false }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reward Information</h2>
      
      <FormField
        label="Reward Amount"
        type="number"
        value={caseData?.reward_amount || ''}
        onChange={(value) => onChange('reward_amount', value)}
        placeholder="0.00"
        prefix="$"
      />

      <FormField
        label="Reward Details"
        type="textarea"
        value={caseData?.reward_details || ''}
        onChange={(value) => onChange('reward_details', value)}
        rows={6}
        placeholder="Describe who is offering the reward, any conditions, and how to claim it..."
      />
    </div>
  );
}

function DeploymentTab({ caseData, caseId, onRefresh }) {
  const [deploying, setDeploying] = useState(false);
  const navigate = useNavigate();

  const handleDeploy = async () => {
    if (!caseData?.subdomain) {
      alert('Please set a subdomain first');
      return;
    }

    try {
      setDeploying(true);
      const response = await api.post(`/cases/${caseId}/deploy/`, {
        subdomain: caseData.subdomain
      });
      
      if (response.data.success) {
        alert(`Successfully deployed to ${response.data.url}`);
        onRefresh();
      }
    } catch (err) {
      console.error('Deploy error:', err);
      alert(err.response?.data?.error || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const getStatusBadge = () => {
    const status = caseData?.deployment_status;
    const statusConfig = {
      'deployed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Deployed', icon: CheckCircle },
      'deploying': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Deploying...', icon: Clock },
      'failed': { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed', icon: AlertCircle },
      'not_deployed': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Not Deployed', icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.not_deployed;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} ${config.text} font-medium`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deployment</h2>
        {getStatusBadge()}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Website URL</h3>
        {caseData?.deployment_url ? (
          <div className="flex items-center gap-3">
            <a
              href={caseData.deployment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {caseData.deployment_url}
            </a>
            <button
              onClick={() => window.open(caseData.deployment_url, '_blank')}
              className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-blue-700 dark:text-blue-300 text-sm">Not deployed yet</p>
        )}
      </div>

      <div className="space-y-4">
        <FormField
          label="Subdomain"
          value={caseData?.subdomain || ''}
          onChange={() => {}}
          disabled
          suffix=".caseclosure.org"
          helpText="Subdomain cannot be changed after creation"
        />

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Public Access</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {caseData?.is_public ? 'Website is publicly accessible' : 'Website is private'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-lg font-medium ${
            caseData?.is_public 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {caseData?.is_public ? 'Public' : 'Private'}
          </span>
        </div>

        {caseData?.last_deployed_at && (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Last deployed: {new Date(caseData.last_deployed_at).toLocaleString()}
          </div>
        )}

        {caseData?.deployment_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900 font-medium mb-1">Deployment Error</p>
            <p className="text-red-700 text-sm">{caseData.deployment_error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleDeploy}
            disabled={deploying || caseData?.deployment_status === 'deploying'}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            {deploying ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                {caseData?.deployment_status === 'deployed' ? 'Redeploy' : 'Deploy Now'}
              </>
            )}
          </button>

          <button
            onClick={() => navigate(`/editor/${caseId}`)}
            className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 font-medium"
          >
            <Edit className="w-5 h-5" />
            Customize
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Form Field Component
function FormField({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  required = false,
  disabled = false,
  options = [],
  placeholder = '',
  rows = 4,
  prefix = '',
  suffix = '',
  helpText = '',
  className = ''
}) {
  const baseInputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {prefix}
          </span>
        )}
        
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={baseInputClass}
          />
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClass}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClass} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-32' : ''}`}
          />
        )}
        
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
      
      {helpText && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helpText}</p>
      )}
    </div>
  );
}