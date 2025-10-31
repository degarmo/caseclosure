import React, { useState, useEffect } from 'react';
import api from '@/utils/axios';
import { MessageSquare, Shield, AlertCircle, CheckCircle, Clock, Archive, Eye, Filter, Search } from 'lucide-react';

export default function ContactMessages({ onRefresh, filterType, caseId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', search: '' });
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = {};
        if (filterType) params.type = filterType;
        if (caseId) params.case_id = caseId;
        if (filter.type) params.type = filter.type;
        if (filter.status) params.status = filter.status;
      
      const response = await api.get('/contact/messages', { params });
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  const updateStatus = async (messageId, newStatus) => {
    try {
      await api.patch(`/contact/messages/${messageId}`, { status: newStatus });
      fetchMessages();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    return type === 'inquiry' ? <MessageSquare className="w-5 h-5" /> : <Shield className="w-5 h-5" />;
  };

  if (loading) {
    return <div className="text-center py-12">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Messages</h2>
        <button
          onClick={fetchMessages}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="inquiry">Inquiries</option>
              <option value="tip">Tips</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="responded">Responded</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No messages found</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(message.type)}
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {message.type === 'inquiry' ? message.subject : `Tip - ${message.urgency}`}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {message.type === 'inquiry' 
                        ? `${message.name} (${message.email})`
                        : message.is_anonymous 
                          ? 'Anonymous Submission'
                          : `${message.submitter_name || 'Unknown'}`
                      }
                    </p>
                  </div>
                </div>
                {getStatusBadge(message.status)}
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {message.type === 'inquiry' ? message.message : message.tip_content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-500">
                  {new Date(message.submitted_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  {message.status === 'new' && (
                    <button
                      onClick={() => updateStatus(message.id, 'reviewed')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  {(message.status === 'new' || message.status === 'reviewed') && (
                    <button
                      onClick={() => updateStatus(message.id, 'responded')}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200"
                    >
                      Mark Responded
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(message.id, 'archived')}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}