/**
 * FamilyAnalytics.jsx — Full analytics deep-dive for family/user role.
 *
 * Layout:
 *   - Date range selector (7d / 30d / 90d)
 *   - Visits over time  → LineChart (primary chart)
 *   - Traffic sources   → PieChart  (how people found the page)
 *   - Top states        → BarChart  (geographic reach)
 *   - Avg time + pages  → simple cards
 *
 * Uses the family-safe endpoint only (/api/tracker/family-analytics/<slug>/).
 * Zero forensic language, zero suspicious/risk data.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { analyticsAPI } from '@/api/analyticsAPI';
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  UsersIcon, ArrowTrendingUpIcon, HeartIcon,
  MapPinIcon, ClockIcon, ShareIcon,
  ArrowPathIcon, GlobeAltIcon,
} from '@heroicons/react/24/outline';

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
  social:  '#818cf8',  // indigo-400
  search:  '#34d399',  // emerald-400
  direct:  '#60a5fa',  // blue-400
  other:   '#94a3b8',  // slate-400
  line:    '#6366f1',  // indigo-500
  bar:     '#a5b4fc',  // indigo-300
};

const SOURCE_COLORS = ['#818cf8', '#34d399', '#60a5fa', '#94a3b8'];

// ─── Date range options ───────────────────────────────────────────────────────
const RANGES = [
  { label: '7 days',   days: 7   },
  { label: '30 days',  days: 30  },
  { label: '90 days',  days: 90  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5 ml-6">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="flex flex-col items-center py-10 text-center text-slate-400">
      <HeartIcon className="w-8 h-8 mb-2 opacity-20" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}

function StatPill({ label, value, accent = 'indigo' }) {
  const colors = {
    indigo:  'bg-indigo-50  text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky:     'bg-sky-50     text-sky-700',
    amber:   'bg-amber-50   text-amber-700',
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${colors[accent]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

// Custom tooltip for line chart
function VisitTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-indigo-600">{payload[0].value?.toLocaleString()} visitors</p>
    </div>
  );
}

// Custom tooltip for pie chart
function SourceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{d.name}</p>
      <p className="text-slate-500">{d.value?.toLocaleString()} visits · {d.payload?.pct}%</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FamilyAnalytics({ caseSlug, caseName }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [days,    setDays]    = useState(30);

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    setData(null);
    try {
      const r = await analyticsAPI.getFamilyAnalytics(caseSlug, days);
      setData(r.data);
    } catch {
      // show empty states
    } finally {
      setLoading(false);
    }
  }, [caseSlug, days]);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ──
  const kpi            = data?.kpi            ?? {};
  const visitsOverTime = data?.visits_over_time ?? [];
  const trafficSources = data?.traffic_sources  ?? [];
  const topStates      = data?.top_states       ?? [];

  // Format x-axis dates nicely (MM/DD)
  const timelineData = useMemo(() =>
    visitsOverTime.map(v => ({
      ...v,
      label: new Date(v.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })),
  [visitsOverTime]);

  // Week change badge
  const weekBadge = kpi.week_change_pct != null
    ? `${kpi.week_change_pct >= 0 ? '+' : ''}${kpi.week_change_pct}% vs previous week`
    : null;

  // ── No case ──
  if (!caseSlug) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <HeartIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
        <p className="text-slate-500 text-sm">
          No case yet. Create a case to start seeing visitor analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {caseName ? `People supporting ${caseName}` : 'Visitor Analytics'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real people are visiting, reading, and spreading the word.
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm self-start">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                days === r.days
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={load}
            className="ml-1 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          accent="indigo"
          label="Total visitors (all time)"
          value={kpi.total_visits?.toLocaleString() ?? '—'}
        />
        <StatPill
          accent="sky"
          label={`Visitors this week${weekBadge ? ` · ${weekBadge}` : ''}`}
          value={kpi.this_week?.toLocaleString() ?? '—'}
        />
        <StatPill
          accent="emerald"
          label="States reached"
          value={topStates.length > 0 ? topStates.length : '—'}
        />
        <StatPill
          accent="amber"
          label="Avg. time on page"
          value={kpi.avg_time_formatted ?? '—'}
        />
      </div>

      {/* ── Visits over time (primary chart) ── */}
      <Card
        title="Visitors over time"
        icon={ArrowTrendingUpIcon}
        subtitle={`Daily unique visitors for the last ${days} days`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-indigo-200" />
          </div>
        ) : timelineData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval={Math.floor(timelineData.length / 7)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<VisitTooltip />} />
              <Line
                type="monotone"
                dataKey="visits"
                stroke={COLORS.line}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: COLORS.line }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty msg="Visitor data will appear here once people start visiting your page." />
        )}
      </Card>

      {/* ── Sources + States side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Traffic sources pie */}
        <Card
          title="How people found this page"
          icon={ShareIcon}
          subtitle="Where visitors came from before arriving here"
        >
          {trafficSources.some(s => s.value > 0) ? (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {trafficSources.map((_, i) => (
                      <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<SourceTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="w-full space-y-2">
                {trafficSources.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                      />
                      <span className="text-slate-700">{s.name}</span>
                    </div>
                    <span className="text-slate-400 text-xs">{s.pct}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center">
                "Direct / Shared Link" means someone followed a link or typed the URL directly.
              </p>
            </div>
          ) : (
            <Empty msg="Traffic source data will appear as visitors come to your page." />
          )}
        </Card>

        {/* Top states bar chart */}
        <Card
          title="Where visitors are from"
          icon={MapPinIcon}
          subtitle="Top states following this case"
        >
          {topStates.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topStates}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="state"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v) => [v.toLocaleString(), 'Visitors']}
                />
                <Bar dataKey="visitors" fill={COLORS.bar} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty msg="Geographic data will appear as visitors come to your page." />
          )}
        </Card>

      </div>

      {/* ── Encouraging footer ── */}
      <div className="rounded-[24px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5 flex items-start gap-3">
        <HeartIcon className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-800">
            Every visit is someone who cares
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            Sharing the page on social media is the single most effective way to reach new visitors
            — especially in states you haven't reached yet. Each share can unlock a new audience.
          </p>
        </div>
      </div>

    </div>
  );
}
