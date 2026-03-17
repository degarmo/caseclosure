/**
 * FamilyAnalytics.jsx — Family / End-User view
 *
 * The most dialed-back view. Zero forensic language.
 * Framed entirely around "people are paying attention to your loved one."
 *
 * Only shows:
 *   widgets.visitor_metrics   → today, week_total, active_now, hourly_trend (sparkline)
 *   widgets.engagement_metrics → top_pages, avg_session_duration, quality_score
 *   widgets.geographic_map    → countries (count only, no risk flags)
 *   widgets.referrer_sources  → top_referrers (where people found the page)
 *
 * Deliberately hides: suspicious_activity, alerts, fingerprints, IP addresses,
 * VPN/Tor data, severity scores — none of that is shown here.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '@/api/analyticsAPI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  UsersIcon, ArrowTrendingUpIcon, HeartIcon, EyeIcon,
  GlobeAltIcon, ArrowPathIcon, BookOpenIcon, ShareIcon
} from '@heroicons/react/24/outline';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, sub, accent = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
    rose:   'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[accent]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-6">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="flex flex-col items-center py-8 text-center text-gray-400">
      <HeartIcon className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}

function ProgressBar({ label, value, max, sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-400">{sub || value?.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FamilyAnalytics({ caseSlug, caseName }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading]   = useState(false);

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    setOverview(null);
    try {
      const r = await analyticsAPI.getDashboard(caseSlug);
      setOverview(r.data);
    } catch { /* empty states */ }
    finally { setLoading(false); }
  }, [caseSlug]);

  useEffect(() => { load(); }, [load]);

  if (!caseSlug) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
        <HeartIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
        <p className="text-gray-500 text-sm">No case yet. Create a case to start seeing visitor activity.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <ArrowPathIcon className="w-7 h-7 animate-spin text-indigo-300" />
      </div>
    );
  }

  // ── Extract only the widgets we want to show ──
  const vm  = overview?.widgets?.visitor_metrics;
  const eng = overview?.widgets?.engagement_metrics;
  const geo = overview?.widgets?.geographic_map;
  const ref = overview?.widgets?.referrer_sources;

  // Hourly sparkline from hourly_trend (array of 24 numbers, index = hour)
  const sparkline = vm?.hourly_trend
    ? vm.hourly_trend.map((v, i) => ({ h: `${i}h`, visitors: v }))
    : [];
  const peakHour = vm?.peak_hour != null ? `${vm.peak_hour}:00` : null;

  // Top pages — use page_url but strip the domain prefix for readability
  const topPages = eng?.top_pages?.map(p => ({
    ...p,
    label: (() => {
      try {
        const url = new URL(p.page_url);
        return url.pathname === '/' ? 'Home' : url.pathname.replace(/^\//, '').replace(/\//g, ' › ');
      } catch {
        return p.page_url || 'Unknown page';
      }
    })()
  })) || [];

  // Countries — just name + count, no risk labels
  const countries = geo?.countries?.slice(0, 8) || [];

  // Referrers
  const referrers = ref?.top_referrers?.slice(0, 6) || [];

  // Avg reading time in minutes
  const avgMin = eng?.metrics?.avg_session_duration
    ? Math.max(1, Math.round(eng.metrics.avg_session_duration / 60))
    : null;

  // Change label
  const changeLabel = vm?.change_percentage != null
    ? `${vm.change_direction === 'up' ? '+' : ''}${vm.change_percentage}% vs yesterday`
    : null;

  return (
    <div className="space-y-6">

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">
          {caseName ? `People supporting ${caseName}` : 'Your Community'}
        </h2>
        <p className="text-indigo-100 text-sm mt-1">
          Real people are visiting this page, reading the story, and helping spread the word.
        </p>
      </div>

      {/* ── 4 key stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={UsersIcon}
          label="On the site right now"
          value={vm?.active_now ?? 0}
          accent="indigo"
        />
        <Stat
          icon={ArrowTrendingUpIcon}
          label="Visited today"
          value={vm?.today?.toLocaleString() ?? '—'}
          sub={changeLabel}
          accent="purple"
        />
        <Stat
          icon={EyeIcon}
          label="This week"
          value={vm?.week_total?.toLocaleString() ?? '—'}
          sub="Unique visitors"
          accent="green"
        />
        <Stat
          icon={BookOpenIcon}
          label="Avg. time reading"
          value={avgMin != null ? `${avgMin} min` : '—'}
          sub="Per visit"
          accent="rose"
        />
      </div>

      {/* ── Hourly activity sparkline ── */}
      <Card
        title="When people visit"
        icon={ArrowTrendingUpIcon}
        subtitle={peakHour ? `Most visits happen around ${peakHour}` : undefined}
      >
        {sparkline.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#9ca3af' }} interval={3} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' }}
                formatter={(v) => [v, 'Visitors']}
                labelFormatter={(h) => h}
              />
              <Bar dataKey="visitors" fill="#a5b4fc" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty msg="Visitor timing will appear once people start coming to your page." />}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── What people are reading ── */}
        <Card title="What people are reading" icon={BookOpenIcon}
          subtitle="The pages visitors spend the most time on">
          {topPages.length > 0 ? (
            <div className="space-y-3">
              {topPages.map((p, i) => (
                <ProgressBar
                  key={i}
                  label={p.label}
                  value={p.views}
                  max={topPages[0]?.views || 1}
                  sub={`${p.views?.toLocaleString()} views`}
                />
              ))}
            </div>
          ) : <Empty msg="Page views will show here once your site gets visitors." />}
        </Card>

        {/* ── Where visitors are from ── */}
        <Card title="Where visitors are from" icon={GlobeAltIcon}
          subtitle="Countries where people are following this case">
          {countries.length > 0 ? (
            <div className="space-y-3">
              {countries.map((c, i) => (
                <ProgressBar
                  key={i}
                  label={c.code || 'Unknown'}
                  value={c.visitors}
                  max={countries[0]?.visitors || 1}
                  sub={`${c.visitors?.toLocaleString()} visitors`}
                />
              ))}
            </div>
          ) : <Empty msg="Location data will appear as visitors come to your page." />}
        </Card>

      </div>

      {/* ── How people found the page ── */}
      {referrers.length > 0 && (
        <Card title="How people found this page" icon={ShareIcon}
          subtitle="Where visitors came from before arriving here">
          <div className="space-y-3">
            {referrers.map((r, i) => {
              // Make domain label friendly
              const label = r.domain === 'direct' ? 'Direct link / bookmarked'
                : r.domain === 'unknown' ? 'Unknown source'
                : r.domain.replace(/^www\./, '');
              return (
                <ProgressBar
                  key={i}
                  label={label}
                  value={r.visits}
                  max={referrers[0]?.visits || 1}
                  sub={`${r.visits?.toLocaleString()} visits`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            "Direct link" means someone typed your URL or followed a shared link directly.
          </p>
        </Card>
      )}

      {/* ── Encouraging footer message ── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-3">
        <HeartIcon className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-indigo-800">People are paying attention</p>
          <p className="text-xs text-indigo-600 mt-1">
            Every visit means someone cared enough to look. Sharing the page on social media
            is the single most effective way to reach new visitors.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>
    </div>
  );
}
