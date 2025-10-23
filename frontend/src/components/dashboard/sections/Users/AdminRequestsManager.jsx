// src/components/AdminRequestsManager.jsx
import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { 
  Users, 
  Check, 
  X, 
  Mail, 
  Clock, 
  Building,
  MapPin,
  Link,
  Copy,
  RefreshCw,
  Settings,
  Shield,
  Phone,
  User,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch based on filter
      let endpoint = '/auth/admin/account-requests/';
      if (filter !== 'pending') {
        // You might need to update your backend to support filtering
        endpoint = `/auth/admin/account-requests/?status=${filter}`;
      }
      
      const response = await api.get(endpoint);
      setRequests(response.data);
    } catch (err) {
      setError('Failed to load requests');
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request? An invite code will be generated and emailed to the user.')) {
      return;
    }

    setProcessingId(requestId);
    setError('');
    setMessage('');
    
    try {
      const response = await api.post('/auth/admin/account-requests/', {
        request_id: requestId,
        action: 'approve'
      });
      
      const inviteCode = response.data.invite_code;
      const emailSent = response.data.email_sent;
      
      // Copy to clipboard
      if (inviteCode) {
        navigator.clipboard.writeText(inviteCode);
        setCopiedCode(inviteCode);
        setTimeout(() => setCopiedCode(''), 3000);
      }
      
      setMessage(
        `Request approved! Invite code: ${inviteCode}${
          emailSent ? ' (Email sent successfully)' : ' (Email failed - code copied to clipboard)'
        }`
      );
      
      // Refresh the list
      fetchRequests();
      setExpandedRequest(null);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Failed to approve request: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    if (reason === null) {
      return; // User cancelled
    }

    setProcessingId(requestId);
    setError('');
    setMessage('');
    
    try {
      await api.post('/auth/admin/account-requests/', {
        request_id: requestId,
        action: 'reject',
        reason: reason || 'No reason provided'
      });
      
      setMessage('Request rejected successfully');
      fetchRequests();
      setExpandedRequest(null);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to reject request');
      console.error(err);
    }
    setProcessingId(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RequestCard = ({ request }) => {
    const isExpanded = expandedRequest?.id === request.id;
    const isProcessing = processingId === request.id;
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mb-4">
        {/* Header - Always Visible */}
        <div 
          className="p-6 cursor-pointer"
          onClick={() => setExpandedRequest(isExpanded ? null : request)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status?.toUpperCase()}
                </span>
                {request.relation && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {request.relation}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {request.email}
                </span>
                {request.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {request.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(request.submitted_at)}
                </span>
              </div>
              
              {request.organization && (
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                  <Building className="w-4 h-4" />
                  {request.organization}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(request.id);
                    }}
                    disabled={isProcessing}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Approve Request"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(request.id);
                    }}
                    disabled={isProcessing}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Reject Request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* Preview of description */}
          {!isExpanded && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {request.description}
            </p>
          )}
        </div>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Full Name</h4>
                  <p className="text-gray-900">{request.name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Email Address</h4>
                  <p className="text-gray-900 flex items-center gap-2">
                    {request.email}
                    <button
                      onClick={() => copyToClipboard(request.email)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Phone Number</h4>
                  <p className="text-gray-900">{request.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Location</h4>
                  <p className="text-gray-900 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {request.location || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Relation to Case</h4>
                  <p className="text-gray-900">{request.relation || 'Not specified'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Organization</h4>
                  <p className="text-gray-900">{request.organization || 'None'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Submitted</h4>
                  <p className="text-gray-900">{formatDate(request.submitted_at)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Status</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status?.toUpperCase()}
                    </span>
                    {request.invite_code && (
                      <span className="text-sm text-gray-600">
                        Code: <code className="bg-gray-200 px-2 py-1 rounded">{request.invite_code}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Full Description */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description / Reason for Request</h4>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
              </div>
            </div>
            
            {/* Supporting Links */}
            {request.supporting_links && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Supporting Links</h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  {request.supporting_links.split('\n').filter(link => link.trim()).map((link, i) => (
                    <a 
                      key={i}
                      href={link.trim()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline mb-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {link.trim()}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Buttons for Pending Requests */}
            {request.status === 'pending' && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve & Send Invite
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Reject Request
                </button>
              </div>
            )}
            
            {/* Approval/Rejection Info */}
            {request.status !== 'pending' && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> {request.status === 'approved' ? 'Approved' : 'Rejected'}
                  {request.reviewed_at && ` on ${formatDate(request.reviewed_at)}`}
                  {request.reviewed_by && ` by ${request.reviewed_by}`}
                </p>
                {request.rejection_reason && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Reason:</strong> {request.rejection_reason}
                  </p>
                )}
                {request.invite_code && (
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Invite Code:</strong> 
                    <code className="bg-white px-2 py-1 ml-2 rounded border border-gray-300">
                      {request.invite_code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(request.invite_code)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4 inline" />
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Requests</h2>
        <p className="text-gray-600">Review and manage user account requests</p>
      </div>

      {/* Status Messages */}
      {message && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-green-800">{message}</p>
            {copiedCode && (
              <p className="text-sm text-green-600 mt-1">Code copied to clipboard: {copiedCode}</p>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'rejected' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
        
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No {filter !== 'all' ? filter : ''} requests found</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Showing {requests.length} {filter !== 'all' ? filter : ''} request{requests.length !== 1 ? 's' : ''}
          </p>
          {requests.map(request => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}