// src/pages/dashboard/components/UserDetails.jsx
import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Shield, 
  FileText, Clock, MapPin, Activity, Edit, Trash2,
  ToggleLeft, ToggleRight, Save, X, AlertCircle,
  CheckCircle, Eye, DollarSign, Globe, Building,
  Bell, Key, Flag, UserCheck, Hash
} from 'lucide-react';

export default function UserDetails({ userId, onBack }) {
  const [user, setUser] = useState(null);
  const [userCases, setUserCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [casesLoading, setCasesLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch user details
      const userRes = await api.get(`/auth/admin/users/${userId}/`);
      setUser(userRes.data);
      setFormData(userRes.data);
      console.log('User data loaded:', userRes.data);

      // Fetch user's cases separately
      fetchUserCases();
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
    }
    setLoading(false);
  };

  const fetchUserCases = async () => {
    setCasesLoading(true);
    try {
      const casesRes = await api.get(`/auth/admin/users/${userId}/cases/`);
      setUserCases(casesRes.data);
      console.log(`Loaded ${casesRes.data.length} cases for user ${userId}`);
    } catch (err) {
      console.log('Cases endpoint not available or no cases found:', err.message);
      setUserCases([]);
    }
    setCasesLoading(false);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    try {
      const res = await api.put(`/auth/admin/users/${userId}/`, formData);
      setUser(res.data);
      setFormData(res.data);
      setEditing(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.error || 'Failed to update user');
    }
  };

  const toggleUserStatus = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/auth/admin/users/${userId}/`, {
        is_active: !user.is_active
      });
      setUser(res.data);
      setFormData(res.data);
      setSuccess(`User ${res.data.is_active ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status');
    }
  };

  const deleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/auth/admin/users/${userId}/`);
      setSuccess('User deleted successfully');
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const resetPassword = async () => {
    if (!window.confirm('Reset password for this user? They will receive a temporary password.')) {
      return;
    }
    
    try {
      const res = await api.post(`/auth/admin/users/${userId}/`, {
        action: 'reset_password'
      });
      
      // Show password in a more user-friendly way
      const tempPassword = res.data.temp_password;
      
      // Create a temporary element to copy password to clipboard
      const textArea = document.createElement('textarea');
      textArea.value = tempPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      alert(`Temporary password: ${tempPassword}\n\nThis password has been copied to your clipboard.\nPlease share it with the user securely.`);
      
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">User not found</p>
          <button 
            onClick={onBack} 
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            ← Back to users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Users
          </button>
          <div className="flex items-center gap-3">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={resetPassword}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </button>
                <button
                  onClick={toggleUserStatus}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    user.is_active 
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {user.is_active ? (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={deleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(user);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
          </div>
        )}

        {/* User Header Info */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {user.first_name || 'Unknown'} {user.last_name || 'User'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              <span className="font-medium">ID:</span> {user.id} | 
              <span className="font-medium ml-2">Username:</span> {user.username || 'Not set'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user.is_superuser && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-medium">
                  Super Admin
                </span>
              )}
              {user.is_staff && !user.is_superuser && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-full font-medium">
                  Admin
                </span>
              )}
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                user.is_active 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium">
                {user.account_type || 'Standard User'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content for Edit Mode */}
      {editing && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="flex gap-1 p-1 overflow-x-auto">
              {['basic', 'contact', 'location', 'permissions', 'profile', 'preferences', 'verification'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                      : 'text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type || 'unverified'}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="unverified">Unverified User</option>
                    <option value="verified">Verified Family Member</option>
                    <option value="helper">Community Helper</option>
                    <option value="detective">Law Enforcement</option>
                    <option value="advocate">Victim Advocate</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.phone_verified || false}
                      onChange={(e) => setFormData({ ...formData, phone_verified: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Verified</span>
                  </label>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={formData.country || 'US'}
                    maxLength="2"
                    onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code || ''}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="10001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">System Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active || false}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Is Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_staff || false}
                        onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Is Staff</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_superuser || false}
                        onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Is Superuser</span>
                    </label>
                  </div>
                </div>
                
                {formData.profile && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Case Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.profile.can_create_cases || false}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            profile: { ...formData.profile, can_create_cases: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Can Create Cases</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Max Cases
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.profile?.max_cases || 1}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            profile: { ...formData.profile, max_cases: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Current Cases (Read-only)
                        </label>
                        <input
                          type="number"
                          value={formData.profile?.current_cases || 0}
                          readOnly
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && formData.profile && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={formData.profile.organization || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        profile: { ...formData.profile, organization: e.target.value }
                      })}
                      placeholder="Company or organization name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formData.profile.role || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        profile: { ...formData.profile, role: e.target.value }
                      })}
                      placeholder="e.g., Family, Detective, Advocate"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Profile Location
                  </label>
                  <input
                    type="text"
                    value={formData.profile.location || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, location: e.target.value }
                    })}
                    placeholder="City, State, Country"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.profile.bio || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, bio: e.target.value }
                    })}
                    rows="4"
                    placeholder="User's story, connection, or reason for joining"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && formData.profile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    value={formData.profile.preferred_contact || 'email'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, preferred_contact: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.profile.timezone || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, timezone: e.target.value }
                    })}
                    placeholder="e.g., America/New_York"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.profile.language || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      profile: { ...formData.profile, language: e.target.value }
                    })}
                    placeholder="e.g., English, Spanish"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Notification Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.profile.notifications_tips || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          profile: { ...formData.profile, notifications_tips: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Receive Tip Notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.profile.notifications_updates || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          profile: { ...formData.profile, notifications_updates: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Receive Update Notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === 'verification' && formData.profile && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Verification Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.profile.verified || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          profile: { ...formData.profile, verified: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Verified</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.profile.identity_verified || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          profile: { ...formData.profile, identity_verified: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Identity Verified</span>
                    </label>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-900 dark:text-red-200 mb-3">Security Flags</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.profile.is_flagged || false}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          profile: { ...formData.profile, is_flagged: e.target.checked }
                        })}
                        className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                      />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Account Flagged</span>
                    </label>
                    {formData.profile.is_flagged && (
                      <div>
                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          Flag Reason
                        </label>
                        <textarea
                          value={formData.profile.flag_reason || ''}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            profile: { ...formData.profile, flag_reason: e.target.value }
                          })}
                          rows="2"
                          placeholder="Reason for flagging this account"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Read-only view when not editing */}
      {!editing && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">User Information</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Info */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                Account Details
              </h4>
              <dl className="space-y-2">
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Email:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Phone:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{user.phone || 'Not provided'}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Account Type:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white capitalize">{user.account_type || 'Standard'}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Date Joined:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(user.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Last Login:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never'
                    }
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Total Cases:</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{user.case_count || 0}</dd>
                </div>
              </dl>
            </div>

            {/* Profile Info */}
            {user.profile && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                  Profile Details
                </h4>
                <dl className="space-y-2">
                  {user.profile.organization && (
                    <div className="flex justify-between py-1">
                      <dt className="text-sm text-slate-600 dark:text-slate-400">Organization:</dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-white">{user.profile.organization}</dd>
                    </div>
                  )}
                  {user.profile.role && (
                    <div className="flex justify-between py-1">
                      <dt className="text-sm text-slate-600 dark:text-slate-400">Role:</dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-white">{user.profile.role}</dd>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-slate-600 dark:text-slate-400">Verified:</dt>
                    <dd className="text-sm font-medium">
                      {user.profile.verified ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-slate-600 dark:text-slate-400">Can Create Cases:</dt>
                    <dd className="text-sm font-medium">
                      {user.profile.can_create_cases ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-slate-500">No</span>
                      )}
                    </dd>
                  </div>
                  {user.profile.max_cases > 0 && (
                    <div className="flex justify-between py-1">
                      <dt className="text-sm text-slate-600 dark:text-slate-400">Case Limit:</dt>
                      <dd className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.profile.current_cases || 0} / {user.profile.max_cases}
                      </dd>
                    </div>
                  )}
                  {user.profile.is_flagged && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                      <div className="flex items-start gap-2">
                        <Flag className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">Account Flagged</p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {user.profile.flag_reason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User's Cases Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            User's Cases
          </h3>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium">
            {user.case_count || 0} total
          </span>
        </div>
        
        {casesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : userCases && userCases.length > 0 ? (
          <div className="space-y-3">
            {userCases.map((case_, index) => (
              <div
                key={case_.id || index}
                className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:shadow-md transition-all cursor-pointer group"
                onClick={() => window.location.href = `/cases/${case_.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {case_.name || `Case #${case_.id}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {case_.victim_name || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {case_.incident_date 
                          ? new Date(case_.incident_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Date not set'
                        }
                      </span>
                      {case_.reward_amount > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${Number(case_.reward_amount).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {case_.is_disabled ? (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        Disabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                    <Eye className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No cases found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {user.profile?.can_create_cases 
                ? "This user hasn't created any cases yet."
                : "This user doesn't have permission to create cases."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}