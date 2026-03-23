/**
 * FamilyOverview.jsx
 * Dashboard overview for family/user role.
 *
 * Shows the 4 headline KPIs that matter most:
 *   1. Total visits + this week momentum
 *   2. Top traffic source (how people are finding the page)
 *   3. Top state (geographic reach)
 *   4. Avg time on page (engagement quality)
 *
 * Pulls from the family-safe endpoint only — no suspicious/forensic data.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '@/api/analyticsAPI';
import {
  UsersIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  ClockIcon,
  HeartIcon,
  ArrowPathIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

// ─── Source icon mapping ─────────────────────────────────────────────────────
const SOURCE_LABELS = {
  social:  'Social Media',
  search:  'Search Engines',
  direct:  'Direct / Shared Link',
  other:   'Other',
};

const SOURCE_COLORS = {
  social: 'text-indigo-600 bg-indigo-50',
  search: 'text-emerald-600 bg-emerald-50',
  direct: 'text-sky-600   bg-sky-50',
  other:  'text-slate-500  bg-slate-100',
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, badge, accent = 'indigo', onClick }) {
  const iconColors = {
    indigo:  'bg-indigo-50  text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky:     'bg-sky-50     text-sky-600',
    amber:   'bg-amber-50   text-amber-600',
  };
  return (
    <div
      className={`rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            badge.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Reach banner ────────────────────────────────────────────────────────────
function ReachBanner({ stateCount, caseName }) {
  if (!stateCount) return null;
  return (
    <div className="rounded-[24px] bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
      <div className="flex items-center gap-3">
        <HeartIcon className="w-6 h-6 shrink-0 opacity-80" />
        <div>
          <p className="font-semibold">
            {caseName ? `${caseName}'s story` : 'This story'} has reached{' '}
            <span className="underline decoration-dotted">{stateCount} {stateCount === 1 ? 'state' : 'states'}</span>
          </p>
          <p className="text-indigo-100 text-sm mt-0.5">
            Real people are reading, sharing, and caring. Every visit matters.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function FamilyOverview({ caseSlug, caseName, onSectionChange }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    try {
      const r = await analyticsAPI.getFamilyAnalytics(caseSlug, 30);
      setData(r.data);
    } catch {
      // fail silently — show empty states
    } finally {
      setLoading(false);
    }
  }, [caseSlug]);

  useEffect(() => { load(); }, [load]);

  // ── No case yet ──
  if (!caseSlug) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <HeartIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
        <p className="text-slate-500 text-sm font-medium">
          Create a case to start seeing how many people are paying attention.
        </p>
      </div>
    );
  }

  const kpi       = data?.kpi       ?? {};
  const topState  = data?.top_state  ?? null;
  const topSource = data?.top_source ?? null;
  const stateCount = data?.top_states?.length ?? 0;

  // Format week-change badge
  const weekBadge = kpi.week_change_pct != null
    ? `${kpi.week_change_pct >= 0 ? '+' : ''}${kpi.week_change_pct}% vs last week`
    : null;

  // Source label
  const sourceLabel = topSource
    ? SOURCE_LABELS[topSource.key] ?? topSource.name
    : null;
  const sourceSub = topSource?.pct
    ? `${topSource.pct}% of all visitors`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="w-7 h-7 animate-spin text-indigo-300" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Reach banner */}
      <ReachBanner stateCount={stateCount} caseName={caseName} />

      {/* 4 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <KPICard
          icon={UsersIcon}
          accent="indigo"
          label="Total visitors"
          value={kpi.total_visits?.toLocaleString() ?? '—'}
          sub={`${kpi.this_week?.toLocaleString() ?? '—'} this week`}
          badge={weekBadge}
          onClick={onSectionChange ? () => onSectionChange('analytics') : undefined}
        />

        <KPICard
          icon={ShareIcon}
          accent="sky"
          label="Top traffic source"
          value={sourceLabel ?? '—'}
          sub={sourceSub}
        />

        <KPICard
          icon={MapPinIcon}
          accent="emerald"
          label="Top state"
          value={topState?.state ?? '—'}
          sub={topState ? `${topState.visitors?.toLocaleString()} visitors` : 'Not enough data yet'}
        />

        <KPICard
          icon={ClockIcon}
          accent="amber"
          label="Avg. time on page"
          value={kpi.avg_time_formatted ?? '—'}
          sub="People are reading, not just bouncing"
        />
      </div>

      {/* Nudge toward full analytics */}
      {onSectionChange && (
        <div className="flex justify-end">
          <button
            onClick={() => onSectionChange('analytics')}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ArrowTrendingUpIcon className="w-4 h-4" />
            View full analytics
          </button>
        </div>
      )}
    </div>
  );
}
