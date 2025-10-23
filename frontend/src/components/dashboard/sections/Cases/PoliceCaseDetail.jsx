// src/components/dashboard/sections/Cases/PoliceCaseDetail.jsx
import React, { useState, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from '../../../../utils/axios';

export default function PoliceCaseDetail({ caseId, permissions, onRefresh }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tips, setTips] = useState([]);
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [downloadingMetrics, setDownloadingMetrics] = useState(false);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch case details
      const caseResponse = await axios.get(`/cases/${caseId}/`);
      setCaseData(caseResponse.data);

      // Fetch tips for this case
      try {
        const tipsResponse = await axios.get(`/messages/?case_id=${caseId}&message_type=tip`);
        setTips(Array.isArray(tipsResponse.data) ? tipsResponse.data : tipsResponse.data.results || []);
      } catch (err) {
        console.error('Error fetching tips:', err);
        setTips([]);
      }

      // Fetch spotlight posts for this case
      try {
        const postsResponse = await axios.get(`/spotlight-posts/?case_id=${caseId}&status=published`);
        setSpotlightPosts(Array.isArray(postsResponse.data) ? postsResponse.data : postsResponse.data.results || []);
      } catch (err) {
        console.error('Error fetching spotlight posts:', err);
        setSpotlightPosts([]);
      }
    } catch (err) {
      console.error('Error fetching case details:', err);
      setError('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const downloadMetrics = async () => {
    try {
      setDownloadingMetrics(true);
      // Generate CSV with case metrics
      const csv = generateMetricsCSV();
      
      // Trigger download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `${caseData.case_title || 'case'}-metrics.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error('Error downloading metrics:', err);
      alert('Failed to download metrics');
    } finally {
      setDownloadingMetrics(false);
    }
  };

  const generateMetricsCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Case Title', caseData.case_title || ''],
      ['Victim Name', `${caseData.first_name} ${caseData.last_name}` || ''],
      ['Case Type', caseData.case_type || ''],
      ['Crime Type', caseData.crime_type || ''],
      ['Status', caseData.deployment_status || ''],
      ['Created Date', new Date(caseData.created_at).toLocaleDateString() || ''],
      ['Tips Received', tips.length],
      ['Spotlight Posts', spotlightPosts.length],
      ['Last Updated', new Date(caseData.updated_at).toLocaleDateString() || '']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Case</h3>
            <p className="text-red-800 dark:text-red-200 mt-1">{error || 'Case not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {caseData.case_title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {caseData.case_type} • {caseData.crime_type}
            </p>
          </div>
          <button
            onClick={downloadMetrics}
            disabled={downloadingMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {downloadingMetrics ? 'Downloading...' : 'Download Metrics'}
          </button>
        </div>

        {/* Badge - Read Only */}
        <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
          Read-Only Access
        </div>
      </div>

      {/* Victim Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Victim Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo */}
          {caseData.primary_photo_url && (
            <div className="md:col-span-2">
              <img
                src={caseData.primary_photo_url}
                alt={`${caseData.first_name} ${caseData.last_name}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {caseData.first_name} {caseData.middle_name} {caseData.last_name}
              </p>
            </div>

            {caseData.date_of_birth && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(caseData.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            )}

            {caseData.age && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                <p className="text-gray-900 dark:text-white">{caseData.age} years old</p>
              </div>
            )}
          </div>

          {/* Physical Description */}
          <div className="space-y-4">
            {caseData.height_feet && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Height</p>
                <p className="text-gray-900 dark:text-white">
                  {caseData.height_feet}'{caseData.height_inches || 0}"
                </p>
              </div>
            )}

            {caseData.weight && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                <p className="text-gray-900 dark:text-white">{caseData.weight} lbs</p>
              </div>
            )}

            {caseData.hair_color && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hair Color</p>
                <p className="text-gray-900 dark:text-white">{caseData.hair_color}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Case Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Case Details</h2>

        <div className="space-y-4">
          {caseData.description && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseData.case_number && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Case Number</p>
                <p className="text-gray-900 dark:text-white">{caseData.case_number}</p>
              </div>
            )}

            {caseData.incident_date && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Incident Date</p>
                <p className="text-gray-900 dark:text-white">
                  {new Date(caseData.incident_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {caseData.full_incident_location && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" /> Incident Location
                </p>
                <p className="text-gray-900 dark:text-white">{caseData.full_incident_location}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investigation Contact Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Investigation Contact</h2>

        <div className="space-y-4">
          {caseData.detective_name && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> Detective
              </p>
              <p className="text-gray-900 dark:text-white">{caseData.detective_name}</p>
            </div>
          )}

          {caseData.detective_phone && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <PhoneIcon className="w-4 h-4" /> Phone
              </p>
              <p className="text-gray-900 dark:text-white">{caseData.detective_phone}</p>
            </div>
          )}

          {caseData.detective_email && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <EnvelopeIcon className="w-4 h-4" /> Email
              </p>
              <p className="text-gray-900 dark:text-white">{caseData.detective_email}</p>
            </div>
          )}

          {caseData.investigating_agency && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agency</p>
              <p className="text-gray-900 dark:text-white">{caseData.investigating_agency}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tips Received</h2>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{tips.length} tips</p>
        {tips.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            View tips in the Messages section
          </p>
        )}
      </div>

      {/* Spotlight Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          Spotlight Posts
        </h2>

        {spotlightPosts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No spotlight posts yet</p>
        ) : (
          <div className="space-y-4">
            {spotlightPosts.map(post => (
              <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {post.excerpt || post.content?.substring(0, 200)}...
                </p>
                {post.published_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Published: {new Date(post.published_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}