import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '@/api/config';
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
import AnalyticsDashboard from '../sections/Analytics/AnalyticsDashboard';
import AdminOverview from '../sections/Overview/AdminOverview';
import FamilyOverview from '../sections/Overview/FamilyOverview';

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
  selectedCaseId,
  theme
}) {
  const [showSpotlightEditor, setShowSpotlightEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Watch for spotlight-create section and open modal
  useEffect(() => {
    // Check if user is LEO
    const isLEO = user?.account_type === 'leo';
    
    // Prevent LEO from creating posts
    if (activeSection === 'spotlight-create' && !isLEO) {
      setShowSpotlightEditor(true);
      onSectionChange('spotlight-posts');
    } else if (activeSection === 'spotlight-create' && isLEO) {
      // LEO tried to create - redirect to posts list
      onSectionChange('spotlight-posts');
    }
  }, [activeSection, onSectionChange, user]);

  if (loading) {
    return (
      <main className="relative z-0 flex-1 overflow-y-auto bg-transparent px-5 py-6 md:px-8 md:py-8">
        <div className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/85 shadow-sm">
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 animate-spin text-sky-600" />
            <p className="mt-4 text-sm font-medium text-slate-700">Loading dashboard workspace</p>
          </div>
        </div>
      </main>
    );
  }

  const handleEditPost = (post) => {
    // Prevent LEO from editing
    if (user?.account_type === 'leo') {
      return;
    }
    setEditingPost(post);
    setShowSpotlightEditor(true);
  };

  const handleDeletePost = async (postId) => {
    // Prevent LEO from deleting
    if (user?.account_type === 'leo') {
      return;
    }
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/spotlight/${postId}/`);
        onRefresh(['spotlight']);
      } catch (error) {
        alert('Failed to delete post');
      }
    }
  };

  const handleSubmitPost = async (postData) => {
    try {
      
      // Extract plain text from HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = postData.content || '';
      const contentText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Prepare final data with required content_text field
      const finalData = {
        ...postData,
        content_text: contentText.trim(),
      };
      
      // Remove case if it's "main-website" or empty
      if (finalData.case === 'main-website' || !finalData.case) {
        delete finalData.case;
      }
      
      
      // Create or update post
      if (editingPost) {
        await api.patch(`/spotlight/${editingPost.id}/`, finalData);
      } else {
        await api.post('/spotlight/', finalData);
      }
      
      setShowSpotlightEditor(false);
      setEditingPost(null);
      onRefresh(['spotlight']);
      
    } catch (error) {
  
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          'Failed to save post';
      alert(errorMessage);
    }
  };

  const handleViewUser = (userId) => {
    setSelectedUserId(userId);
    onSectionChange('user-details');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        // Admin → rich chart overview
        if (permissions.isAdmin()) {
          return (
            <AdminOverview
              data={data}
              onSectionChange={onSectionChange}
              theme={theme}
            />
          );
        }

        // Family → warm analytics KPI overview
        if (user?.account_type !== 'leo') {
          const userCase   = data?.userCase;
          const caseSlug   = userCase?.subdomain || null;
          const caseName   = userCase
            ? (userCase.case_title || `${userCase.first_name || ''} ${userCase.last_name || ''}`.trim())
            : null;
          return (
            <FamilyOverview
              caseSlug={caseSlug}
              caseName={caseName}
              onSectionChange={onSectionChange}
            />
          );
        }

        // LEO — operational stat cards
        return (
          <div className="space-y-6">
            <section
              className="overflow-hidden rounded-[30px] border px-6 py-7 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] md:px-8"
              style={{ background: theme.heroGradient, borderColor: theme.accentBorder }}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.22em]" style={{ color: theme.heroSubtext }}>Operational snapshot</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                    Everything important is in one place.
                  </h2>
                  <p className="mt-3 text-sm leading-6" style={{ color: theme.heroSubtext }}>
                    Monitor case progress, inbound communication, and spotlight activity from a single view.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <OverviewBadge label="Cases" value={data.stats?.totalCases || 0} theme={theme} />
                  <OverviewBadge label="Active" value={data.stats?.activeCases || 0} theme={theme} />
                  <OverviewBadge label="Messages" value={data.stats?.unreadMessages || 0} theme={theme} />
                  <OverviewBadge label="Posts" value={data.stats?.totalSpotlightPosts || 0} theme={theme} />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Total Cases</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{data.stats?.totalCases || 0}</p>
                <p className="mt-2 text-sm text-slate-500">All cases currently accessible in your workspace.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Active Cases</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-600">{data.stats?.activeCases || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Cases that remain active and available for current work.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Unread Messages</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{data.stats?.unreadMessages || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Communication awaiting review or follow-up.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-medium text-slate-500">Spotlight Posts</h3>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{data.stats?.totalSpotlightPosts || 0}</p>
                <p className="mt-2 text-sm text-slate-500">Published updates currently visible to the public.</p>
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
            user={user}
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
            user={user}
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
          <AnalyticsDashboard
            user={user}
            permissions={permissions}
            data={data}
          />
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
      <main className="flex-1 overflow-y-auto bg-transparent px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl space-y-5">
          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Some dashboard data could not be refreshed. Existing content is still available.
            </div>
          )}
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
          // Admin: show all cases dropdown
          // User: pass their caseId only
          cases={permissions.isAdmin() ? (data.cases || []) : []}
          caseId={!permissions.isAdmin() && data.userCase?.id ? data.userCase.id : null}
          caseName={!permissions.isAdmin() && data.userCase ? 
            (data.userCase.case_title || `${data.userCase.first_name} ${data.userCase.last_name}`) : 
            null
          }
        />
      )}
    </>
  );
}

function OverviewBadge({ label, value, theme }) {
  return (
    <div className="rounded-2xl border px-4 py-3 backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' }}>
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: theme.heroSubtext }}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
