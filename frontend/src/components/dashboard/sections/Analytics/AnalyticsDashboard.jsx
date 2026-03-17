/**
 * AnalyticsDashboard.jsx
 * Role-aware analytics entry point.
 *
 * - Admin → AdminAnalytics (platform-wide, all cases, all data)
 * - Police/LEO → LEOAnalytics (suspicious activity, behavioral patterns, alerts)
 * - Family (user) → FamilyAnalytics (warm visitor stats, their case only)
 */

import React from 'react';
import AdminAnalytics from './AdminAnalytics';
import LEOAnalytics from './LEOAnalytics';
import FamilyAnalytics from './FamilyAnalytics';

export default function AnalyticsDashboard({ user, permissions, data }) {
  const role = permissions.getRole();

  // Derive the user's case slug for family/LEO views
  // userCase comes from the dashboard data hook (their primary case)
  const userCase = data?.userCase;
  const caseSlug = userCase?.subdomain || userCase?.slug || null;
  const caseName = userCase
    ? (userCase.case_title || `${userCase.first_name || ''} ${userCase.last_name || ''}`.trim())
    : null;

  if (role === 'admin') {
    return <AdminAnalytics user={user} data={data} />;
  }

  if (role === 'police') {
    // Police users may have an assigned case via data.userCase or selectedCaseId
    return (
      <LEOAnalytics
        caseSlug={caseSlug}
        caseName={caseName}
      />
    );
  }

  // Default: family/user
  return (
    <FamilyAnalytics
      caseSlug={caseSlug}
      caseName={caseName}
    />
  );
}
