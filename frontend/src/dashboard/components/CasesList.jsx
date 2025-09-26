// src/pages/dashboard/components/CasesList.jsx
import React, { useState } from 'react';
import api from '@/api/axios';
import { 
  Folder, Eye, Edit, Trash2, ToggleLeft, ToggleRight, 
  Calendar, DollarSign, MapPin, User, Search, Filter,
  Plus, RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';

export default function CasesList({ cases = [], filter = 'all', onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [selectedCases, setSelectedCases] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredCases = cases.filter(case_ => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      case_.name?.toLowerCase().includes(searchLower) ||
      case_.victim_name?.toLowerCase().includes(searchLower) ||
      case_.id.toString().includes(searchLower);

    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.victim_name || a.name || '').localeCompare(b.victim_name || b.name || '');
      case 'date':
        return new Date(b.incident_date || 0) - new Date(a.incident_date || 0);
      case 'reward':
        return (b.reward_amount || 0) - (a.reward_amount || 0);
      default: // created
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
  });

  const toggleCaseStatus = async (caseId, isDisabled) => {
    setLoading(true);
    try {
      await api.patch(`/cases/${caseId}/`, { is_disabled: !isDisabled });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error toggling case status:', error);
      alert('Failed to update case status');
    }
    setLoading(false);
  };

  const deleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to permanently delete this case? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`/cases/${caseId}/`);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting case:', error);
      alert('Failed to delete case');
    }
    setLoading(false);
  };

  const handleBulkAction = async (action) => {
    if (selectedCases.length === 0) {
      alert('Please select cases first');
      return;
    }

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedCases.length} case(s)?`
      : `Are you sure you want to ${action} ${selectedCases.length} case(s)?`;

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const promises = selectedCases.map(caseId => {
        if (action === 'delete') {
          return api.delete(`/cases/${caseId}/`);
        } else if (action === 'enable') {
          return api.patch(`/cases/${caseId}/`, { is_disabled: false });
        } else if (action === 'disable') {
          return api.patch(`/cases/${caseId}/`, { is_disabled: true });
        }
      });

      await Promise.all(promises);
      setSelectedCases([]);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Some operations failed');
    }
    setLoading(false);
  };

  const getStatusBadge = (case_) => {
    if (case_.is_disabled) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Disabled</span>;
    } else if (case_.status === 'solved') {
      return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">Solved</span>;
    } else if (case_.status === 'active') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">Active</span>;
    } else {
      return <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">Started</span>;
    }
  };

  const filterTitle = filter === 'all' ? 'All Cases' : 
                     filter === 'active' ? 'Active Cases' :
                     filter === 'disabled' ? 'Disabled Cases' : 'Cases';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{filterTitle}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/cases/new'}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Case
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all flex items-center gap-2 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by case name, victim, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="created">Sort by Created</option>
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Incident Date</option>
            <option value="reward">Sort by Reward</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedCases.length > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {selectedCases.length} case(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('enable')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Enable
              </button>
              <button
                onClick={() => handleBulkAction('disable')}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
              >
                Disable
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedCases([])}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCases(filteredCases.map(c => c.id));
                    } else {
                      setSelectedCases([]);
                    }
                  }}
                  checked={selectedCases.length === filteredCases.length && filteredCases.length > 0}
                />
              </th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Case</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Victim</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Incident Date</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Location</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Reward</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
              <th className="p-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredCases.length > 0 ? filteredCases.map(case_ => (
              <tr key={case_.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                case_.is_disabled ? 'opacity-60' : ''
              }`}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(case_.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCases([...selectedCases, case_.id]);
                      } else {
                        setSelectedCases(selectedCases.filter(id => id !== case_.id));
                      }
                    }}
                  />
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {case_.name || `Case #${case_.id}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: {case_.id} • {case_.crime_type || 'Unknown'}
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {case_.victim_name || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {case_.incident_date ? new Date(case_.incident_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {case_.location || case_.city || 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {case_.reward_amount ? `$${case_.reward_amount.toLocaleString()}` : 'None'}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {getStatusBadge(case_)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.location.href = `/cases/${case_.id}`}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => window.location.href = `/cases/${case_.id}/edit`}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => toggleCaseStatus(case_.id, case_.is_disabled)}
                      disabled={loading}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title={case_.is_disabled ? 'Enable' : 'Disable'}
                    >
                      {case_.is_disabled ? (
                        <ToggleLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteCase(case_.id)}
                      disabled={loading}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">
                  <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No cases found</p>
                  <button
                    onClick={() => window.location.href = '/cases/new'}
                    className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Create your first case
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}