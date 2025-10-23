// Updates for UsersList.jsx

// Add this enhanced UsersList with proper error handling and data fetching:

import React, { useState, useEffect } from 'react';
import api from '@/utils/axios';  // Make sure this path is correct
import { 
  Users, User, Mail, Phone, Calendar, Shield, Eye, 
  Edit, Trash2, Search, Filter, RefreshCw, CheckCircle,
  XCircle, Clock, UserCheck, UserX, ChevronRight, FileText
} from 'lucide-react';

export default function UsersList({ 
  users = [], 
  onViewUser, 
  onRefresh, 
  title = 'All Users' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [localUsers, setLocalUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If no users passed as props, fetch them directly
    if (users.length === 0 && title === 'All Users') {
      fetchUsers();
    } else {
      setLocalUsers(users);
    }
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/auth/admin/users/');
      setLocalUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await fetchUsers();
    }
  };

  const filteredUsers = localUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.id?.toString().includes(searchLower);

    const matchesRole = filterRole === 'all' ||
      (filterRole === 'admin' && (user.is_staff || user.is_superuser)) ||
      (filterRole === 'user' && !user.is_staff && !user.is_superuser);

    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      case 'email':
        return (a.email || '').localeCompare(b.email || '');
      case 'cases':
        return (b.case_count || 0) - (a.case_count || 0);
      default: // created
        return new Date(b.date_joined || 0) - new Date(a.date_joined || 0);
    }
  });

  const getUserStatusBadge = (user) => {
    if (user.is_superuser) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium">Super Admin</span>;
    }
    if (user.is_staff) {
      return <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-full font-medium">Admin</span>;
    }
    if (user.is_active === false) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Inactive</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">Active User</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              Total: {filteredUsers.length} users
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all flex items-center gap-2 font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="user">Users Only</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
          >
            <option value="created">Sort by Joined</option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="cases">Sort by Cases</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="p-6">
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onViewUser && onViewUser(user.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.first_name?.[0] || user.email?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {user.first_name || 'Unknown'} {user.last_name || ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        User ID: {user.id}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      {user.email}
                    </span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {user.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">
                      Joined {formatDate(user.date_joined)}
                    </span>
                  </div>

                  {user.case_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {user.case_count} case{user.case_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  {getUserStatusBadge(user)}
                  {user.last_login && (
                    <span className="text-xs text-slate-500">
                      Last: {formatDate(user.last_login)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No users found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}