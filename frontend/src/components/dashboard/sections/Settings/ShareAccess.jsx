// src/components/dashboard/sections/Settings/ShareAccess.jsx
import React, { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from '../../../../utils/axios';

export default function ShareAccess({ user, permissions, onSuccess }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    victimCase: '',
    subjectLine: 'User has shared access to victim\'s profile',
    body: 'You have been invited to view and manage case information. Please log in to access the case details.',
    userType: 'police'
  });

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Only show this component if user is NOT police/LEO
  if (permissions?.isPolice?.()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Share Access
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Law enforcement users cannot share access to cases.
        </p>
      </div>
    );
  }

  // Fetch user's cases on mount
  useEffect(() => {
    if (isExpanded) {
      fetchUserCases();
    }
  }, [user?.id, isExpanded]);

  const fetchUserCases = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/cases/`);
      
      // Handle both array and paginated responses
      const casesData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
      // Filter to only show cases owned by current user
      const userCases = casesData.filter(c => c.user === user?.id);
      console.log('User cases:', userCases);
      console.log('Case object keys:', userCases.length > 0 ? Object.keys(userCases[0]) : 'no cases');
      
      setCases(userCases);
      setError(null);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load your cases');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Valid email address is required');
      return;
    }
    if (!formData.victimCase) {
      setError('Please select a case');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setDebugInfo(null);

      const invitationData = {
        invitee_name: formData.fullName,
        invitee_email: formData.email,
        case_id: formData.victimCase,
        user_type: formData.userType,
        subject_line: formData.subjectLine,
        message_body: formData.body,
        invited_by: user?.id
      };

      console.log('Sending invitation data:', invitationData);

      const response = await axios.post('/case-invitations/', invitationData);

      console.log('Full API Response:', response);
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);

      // Store debug info for troubleshooting
      setDebugInfo({
        status: response.status,
        emailSent: response.data.email_sent,
        invitationId: response.data.id,
        responseKeys: Object.keys(response.data)
      });

      // Check if email_sent is explicitly false
      if (response.data.email_sent === false) {
        console.error('Email failed to send!', response.data);
        setError(`Invitation created but email failed: ${response.data.email_error || 'Unknown error'}`);
      } else {
        setSuccess(true);
      }

      setFormData({
        fullName: '',
        email: '',
        victimCase: '',
        subjectLine: 'User has shared access to victim\'s profile',
        body: 'You have been invited to view and manage case information. Please log in to access the case details.',
        userType: 'police'
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
        setDebugInfo(null);
      }, 5000);
    } catch (err) {
      console.error('Error sending invitation:', err);
      console.error('Error response:', err.response?.data);
      
      setDebugInfo({
        errorStatus: err.response?.status,
        errorData: err.response?.data,
        errorMessage: err.message
      });

      setError(
        err.response?.data?.detail || 
        err.response?.data?.error ||
        err.message ||
        'Failed to send invitation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="flex items-center">
          <UserPlusIcon className="w-6 h-6 text-indigo-600 mr-3" />
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Share Access
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Invite others to access your cases
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-6 h-6 text-indigo-600 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Invite law enforcement, investigators, or other authorized users to access your case information.
          </p>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Invitation sent successfully!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  An invitation email has been sent to the recipient.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Error
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  {error}
                </p>
                {debugInfo && (
                  <details className="mt-3 text-xs text-red-700 dark:text-red-300">
                    <summary className="cursor-pointer font-medium">Debug Info</summary>
                    <pre className="mt-2 bg-red-100 dark:bg-red-900/50 p-2 rounded overflow-auto">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="e.g., Detective John Smith"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                         transition"
                disabled={submitting}
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.smith@police.gov"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                         transition"
                disabled={submitting}
              />
            </div>

            {/* Victim/Case Selection */}
            <div>
              <label htmlFor="victimCase" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Victim (Select Case) *
              </label>
              {loading ? (
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Loading cases...
                </div>
              ) : cases.length === 0 ? (
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  No cases found
                </div>
              ) : (
                <select
                  id="victimCase"
                  name="victimCase"
                  value={formData.victimCase}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           dark:bg-gray-700 dark:text-white
                           transition"
                  disabled={submitting}
                >
                  <option value="">-- Select a case --</option>
                  {cases.map(caseItem => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* User Type Selection */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Access Type
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white
                         transition"
                disabled={submitting}
              >
                <option value="police">Law Enforcement</option>
                <option value="investigator">Private Investigator</option>
                <option value="advocate">Victim Advocate</option>
                <option value="family">Family Member</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Subject Line */}
            <div>
              <label htmlFor="subjectLine" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Email Subject Line
              </label>
              <input
                type="text"
                id="subjectLine"
                name="subjectLine"
                value={formData.subjectLine}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white
                         transition"
                disabled={submitting}
              />
            </div>

            {/* Message Body */}
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Email Message
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows="6"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white
                         transition"
                disabled={submitting}
              />
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Email Preview:</p>
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">To: {formData.email || 'recipient@example.com'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  Subject: {formData.subjectLine}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {formData.body}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 
                         disabled:bg-indigo-400 disabled:cursor-not-allowed
                         text-white font-medium rounded-lg transition"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}