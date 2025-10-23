import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
// Import existing components
import CasesList from '../sections/Cases/CasesList';
import CaseDetails from '../sections/Cases/CaseDetails';
import ContactMessages from '../sections/Messages/ContactMessages';
import UsersList from '../sections/Users/UsersList';
import UserDetails from '../sections/Users/UserDetails';
import AccountRequests from '../sections/Users/AccountRequests';
import Settings from '../sections/Settings/Settings';
import SpotlightPostsList from '../sections/Spotlight/SpotlightPostsList';
import SpotlightEditor from '../sections/Spotlight/SpotlightEditor';
import PoliceCaseDetail from '../sections/Cases/PoliceCaseDetail';

export default function ContentArea({ 
  activeSection, 
  permissions, 
  data, 
  loading, 
  error,
  user,
  onOpenCaseModal,
  onRefresh,
  onSectionChange,
  selectedCaseId 
}) {
  const [showSpotlightEditor, setShowSpotlightEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Watch for spotlight-create section and open modal
  useEffect(() => {
    if (activeSection === 'spotlight-create') {
      setShowSpotlightEditor(true);
      onSectionChange('spotlight-posts');
    }
  }, [activeSection, onSectionChange]);

  if (loading) {
    return (
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      </main>
    );
  }

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowSpotlightEditor(true);
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      console.log('Delete post:', postId);
      onRefresh(['spotlight']);
    }
  };

  const handleSubmitPost = async (postData) => {
    try {
      console.log('Submitting spotlight post:', postData);
      setShowSpotlightEditor(false);
      setEditingPost(null);
      onRefresh(['spotlight']);
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  };

  const handleViewUser = (userId) => {
    setSelectedUserId(userId);
    onSectionChange('user-details');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Cases</h3>
                <p className="text-2xl font-bold mt-2">{data.stats?.totalCases || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold mt-2">{data.stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
                <p className="text-2xl font-bold mt-2 text-amber-600">
                  {data.stats?.pendingRequests || 0}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Messages</h3>
                <p className="text-2xl font-bold mt-2">{data.stats?.unreadMessages || 0}</p>
              </div>
            </div>
          </div>
        );

      case 'cases-all':
      case 'cases-active':
        return (
          <CasesList
            cases={activeSection === 'cases-active' ? 
              data.cases?.filter(c => !c.is_disabled) : 
              data.cases
            }
            filter={activeSection.replace('cases-', '')}
            onRefresh={() => onRefresh(['cases'])}
          />
        );
      
      case 'police-case-detail':
        if (!selectedCaseId) {
          return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">Please select a case from the sidebar</p>
            </div>
          );
        }
        return (
          <PoliceCaseDetail
            caseId={selectedCaseId}
            permissions={permissions}
            onRefresh={() => onRefresh(['cases', 'messages', 'spotlight'])}
          />
        );


      case 'spotlight-posts':
        return (
          <SpotlightPostsList 
            posts={data.spotlightPosts || []}
            onRefresh={() => onRefresh(['spotlight'])}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            title="All Spotlight Posts"
            emptyMessage="No spotlight posts have been created yet."
            isAdmin={permissions.isAdmin()}
          />
        );

      case 'spotlight-scheduled':
        return (
          <SpotlightPostsList 
            posts={data.spotlightPosts?.filter(p => p.status === 'scheduled') || []}
            onRefresh={() => onRefresh(['spotlight'])}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            title="Scheduled Posts"
            emptyMessage="No scheduled posts."
            showScheduledTime={true}
            isAdmin={permissions.isAdmin()}
          />
        );

      case 'messages-all':
        return (
          <ContactMessages 
            onRefresh={() => onRefresh(['messages'])}
            filterType={null}
            caseId={!permissions.can('view_all_messages') && data.userCase?.id ? 
              data.userCase.id : undefined}
          />
        );


      case 'messages-tips':
        return (
          <ContactMessages 
            onRefresh={() => onRefresh(['messages'])}
            filterType="tip"
            caseId={!permissions.can('view_all_messages') && data.userCase?.id ? 
              data.userCase.id : undefined}
          />
        );

      case 'users-all':
        return (
          <UsersList 
            users={data.users || []}
            onViewUser={handleViewUser}
            onRefresh={() => onRefresh(['users'])}
            title="All Users"
          />
        );

      case 'users-requests':
        return (
          <AccountRequests 
            requests={data.pendingRequests || []}
            onRefresh={() => onRefresh(['users', 'pendingRequests'])}
          />
        );

      case 'user-details':
        return (
          <UserDetails 
            userId={selectedUserId}
            onBack={() => onSectionChange('users-all')}
          />
        );

      case 'analytics':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Analytics</h2>
            <p className="text-gray-500">Analytics dashboard coming soon...</p>
          </div>
        );

      case 'settings':
        return (
          <Settings 
            user={user}
            permissions={permissions}
            onSuccess={() => onRefresh(['settings', 'invitations'])}
          />
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p>Section: {activeSection}</p>
            <p className="text-gray-500">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <>
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Spotlight Editor Modal */}
      {showSpotlightEditor && (
        <SpotlightEditor
          onSubmit={handleSubmitPost}
          onCancel={() => {
            setShowSpotlightEditor(false);
            setEditingPost(null);
          }}
          initialData={editingPost}
          cases={data.cases || []}
        />
      )}
    </>
  );
}