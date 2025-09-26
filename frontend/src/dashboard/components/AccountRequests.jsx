// src/pages/dashboard/components/AccountRequests.jsx
import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { 
  Users, Check, X, Mail, Clock, Building, MapPin, 
  Copy, RefreshCw, Phone, User, FileText, ExternalLink,
  ChevronDown, ChevronUp, Calendar, AlertCircle, CheckCircle,
  UserPlus, Filter, Search, Eye, MessageSquare
} from 'lucide-react';

export default function AccountRequests({ requests = [], onRefresh }) {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If requests are passed as props, use them for pending
    // Otherwise fetch all requests based on filter
    if (filter !== 'pending' || requests.length === 0) {
      fetchRequests();
    } else {
      setAllRequests(requests);
    }
  }, [filter, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'all' 
        ? '/auth/admin/account-requests/' 
        : `/auth/admin/account-requests/?status=${filter}`;
      
      const response = await api.get(endpoint);
      setAllRequests(response.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
    }
    setLoading(false);
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this request and send invite code?')) return;

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
      
      if (inviteCode) {
        navigator.clipboard.writeText(inviteCode);
        setCopiedCode(inviteCode);
        setTimeout(() => setCopiedCode(''), 3000);
      }
      
      setMessage(
        `Request approved! Invite code: ${inviteCode}${
          emailSent ? ' (Email sent)' : ' (Code copied to clipboard)'
        }`
      );
      
      fetchRequests();
      if (onRefresh) onRefresh();
      setExpandedRequest(null);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Failed to approve request');
      console.error(err);
    }
    setProcessingId(null);
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    setProcessingId(requestId);
    setError('');
    setMessage('');
    
    try {
      await api.post('/auth/admin/account-requests/', {
        request_id: requestId,
        action: 'reject',
        reason: reason || 'No reason provided'
      });
      
      setMessage('Request rejected');
      fetchRequests();
      if (onRefresh) onRefresh();
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

  const filteredRequests = allRequests.filter(request => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      request.name?.toLowerCase().includes(search) ||
      request.email?.toLowerCase().includes(search) ||
      request.organization?.toLowerCase().includes(search) ||
      request.location?.toLowerCase().includes(search)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Account Requests</h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and manage user account requests
            </p>
          </div>
          <button
            onClick={() => {
              fetchRequests();
              if (onRefresh) onRefresh();
            }}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all flex items-center gap-2 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 dark:text-green-200">{message}</p>
              {copiedCode && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Code copied: {copiedCode}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === status
                    ? `${
                        status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {status}
                {status === 'pending' && filteredRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/50 dark:bg-black/30 rounded-full text-xs">
                    {filteredRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, org..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-lg">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No {filter !== 'all' ? filter : ''} requests found
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </p>
            {filteredRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                isExpanded={expandedRequest?.id === request.id}
                onToggle={() => setExpandedRequest(
                  expandedRequest?.id === request.id ? null : request
                )}
                onApprove={() => handleApprove(request.id)}
                onReject={() => handleReject(request.id)}
                isProcessing={processingId === request.id}
                onCopyCode={copyToClipboard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ 
  request, 
  isExpanded, 
  onToggle, 
  onApprove, 
  onReject, 
  isProcessing,
  onCopyCode 
}) {
  const getRelationIcon = (relation) => {
    switch (relation) {
      case 'Family Member':
        return <User className="w-4 h-4" />;
      case 'Law Enforcement':
        return <Building className="w-4 h-4" />;
      case 'Media':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-md transition-all">
      {/* Header - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {request.first_name} {request.last_name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {request.status?.toUpperCase()}
              </span>
              {request.relation && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center gap-1">
                  {getRelationIcon(request.relation)}
                  {request.relation}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                {new Date(request.submitted_at).toLocaleDateString()}
              </span>
            </div>

            {request.organization && (
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <Building className="w-4 h-4" />
                {request.organization}
              </div>
            )}

            {!isExpanded && request.description && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {request.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {request.status === 'pending' && !isExpanded && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onApprove}
                  disabled={isProcessing}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  title="Approve Request"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={onReject}
                  disabled={isProcessing}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</h4>
                <p className="text-gray-900 dark:text-white">
                  {request.first_name} {request.last_name}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</h4>
                <p className="text-gray-900 dark:text-white flex items-center gap-2">
                  {request.email}
                  <button
                    onClick={() => onCopyCode(request.email)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</h4>
                <p className="text-gray-900 dark:text-white">{request.phone || 'Not provided'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</h4>
                <p className="text-gray-900 dark:text-white flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {request.location || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Relation to Case</h4>
                <p className="text-gray-900 dark:text-white">{request.relation || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Organization</h4>
                <p className="text-gray-900 dark:text-white">{request.organization || 'None'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Submitted</h4>
                <p className="text-gray-900 dark:text-white">
                  {new Date(request.submitted_at).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {request.status?.toUpperCase()}
                  </span>
                  {request.invite_code && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Code: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{request.invite_code}</code>
                      <button
                        onClick={() => onCopyCode(request.invite_code)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Copy code"
                      >
                        <Copy className="w-3 h-3 inline" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description / Reason for Request
            </h4>
            <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{request.description}</p>
            </div>
          </div>

          {/* Supporting Links */}
          {request.supporting_links && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Supporting Links</h4>
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
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

          {/* Action Buttons */}
          {request.status === 'pending' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve & Send Invite
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Reject Request
              </button>
            </div>
          )}

          {/* Status Info */}
          {request.status !== 'pending' && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-900 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Status:</strong> {request.status === 'approved' ? 'Approved' : 'Rejected'}
                {request.reviewed_at && ` on ${new Date(request.reviewed_at).toLocaleString()}`}
                {request.reviewed_by && ` by ${request.reviewed_by}`}
              </p>
              {request.rejection_reason && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  <strong>Reason:</strong> {request.rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}