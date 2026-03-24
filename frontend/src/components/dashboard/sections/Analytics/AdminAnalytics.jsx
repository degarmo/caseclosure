/**
 * AdminAnalytics.jsx — Admin view
 *
 * Full platform visibility. Uses the complete dashboard_overview response:
 *   widgets.visitor_metrics   → active_now, today, week_total, month_total, hourly_trend
 *   widgets.suspicious_activity → severity_breakdown, top_suspicious_users, recent_activities
 *   widgets.geographic_map    → countries[], cities[], suspicious_locations[]
 *   widgets.activity_timeline → timeline[], hourly_breakdown{}
 *   widgets.engagement_metrics → metrics{}, top_pages[], quality_score
 *   widgets.alerts_panel      → alerts[], priority_breakdown, total_unresolved
 *   widgets.device_breakdown  → device_types[], browsers[], operating_systems[]
 *   widgets.referrer_sources  → top_referrers[]
 */

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/api/config';
import { analyticsAPI, adminTrackingAPI } from '@/api/analyticsAPI';
import IdentityAnomalies from './IdentityAnomalies';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ShieldCheckIcon, ExclamationTriangleIcon, UsersIcon, FolderIcon,
  FlagIcon, ArrowPathIcon, BoltIcon, ChevronRightIcon,
  GlobeAltIcon, DevicePhoneMobileIcon, ArrowTrendingUpIcon,
  ClockIcon, EyeIcon, SignalSlashIcon
} from '@heroicons/react/24/outline';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_STYLE = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
};

const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

function Stat({ label, value, sub, icon: Icon, color = 'indigo' }) {
  const ring = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    slate:  'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${ring[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Card({ title, icon: Icon, children, action, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return <p className="text-sm text-gray-400 py-6 text-center">{msg}</p>;
}

// ─── Hourly sparkline (24-bar chart from hourly_trend array) ─────────────────
function HourlySparkline({ data }) {
  if (!data?.length) return null;
  const formatted = data.map((v, i) => ({ h: `${i}h`, v }));
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={formatted} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey="v" fill="#a5b4fc" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminAnalytics({ user, data: dashboardData }) {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Load cases list on mount
  useEffect(() => {
    api.get('/cases/')
      .then(r => setCases(r.data?.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, []);

  // Load full overview when case selected
  const loadOverview = useCallback(async (c) => {
    const slug = c.subdomain || c.slug || String(c.id);
    setSelectedCase(c);
    setLoadingOverview(true);
    setOverview(null);
    try {
      const r = await analyticsAPI.getDashboard(slug);
      setOverview(r.data);
    } catch { /* show empty states */ }
    finally { setLoadingOverview(false); }
  }, []);

  // ── derive widgets ──
  const vm   = overview?.widgets?.visitor_metrics;
  const sa   = overview?.widgets?.suspicious_activity;
  const geo  = overview?.widgets?.geographic_map;
  const tl   = overview?.widgets?.activity_timeline;
  const eng  = overview?.widgets?.engagement_metrics;
  const alrt = overview?.widgets?.alerts_panel;
  const dev  = overview?.widgets?.device_breakdown;
  const ref  = overview?.widgets?.referrer_sources;

  // hourly timeline chart from hourly_breakdown object → array
  const hourlyChart = tl?.hourly_breakdown
    ? Object.entries(tl.hourly_breakdown)
        .map(([h, d]) => ({ hour: `${h}:00`, total: d.events, suspicious: d.suspicious }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  // severity chart
  const severityChart = alrt?.priority_breakdown
    ? Object.entries(alrt.priority_breakdown)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), count: v }))
    : [];

  // device pie
  const devicePie = dev?.device_types
    ? [...dev.device_types].slice(0, 5).map(d => ({ name: d.device_type || 'Unknown', value: d.count }))
    : [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-xl p-6 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="w-5 h-5 text-indigo-300" />
            <h2 className="text-xl font-bold">Platform Analytics</h2>
          </div>
          <p className="text-slate-300 text-sm">Full-depth tracking data — select a case below to drill in</p>
        </div>
      </div>

      {/* ── Case selector ── */}
      <Card title="Select a case" icon={FolderIcon}>
        {loadingCases ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <ArrowPathIcon className="w-4 h-4 animate-spin" /> Loading cases…
          </div>
        ) : cases.length === 0 ? (
          <Empty msg="No cases found." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {cases.map(c => {
              const name = c.case_title ||
                `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
                c.slug || `Case ${c.id}`;
              const isSelected = selectedCase?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => isSelected ? setSelectedCase(null) : loadOverview(c)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRightIcon className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'rotate-90 text-indigo-500' : 'text-gray-400'}`} />
                    <span className="truncate">{name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-5">{c.subdomain || c.slug || ''}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Loading state ── */}
      {loadingOverview && (
        <div className="flex items-center justify-center py-16">
          <ArrowPathIcon className="w-7 h-7 animate-spin text-indigo-400" />
        </div>
      )}

      {/* ── Dashboard data (only when a case is selected and loaded) ── */}
      {overview && !loadingOverview && (
        <>
          {/* Critical alert banner */}
          {alrt?.requires_immediate_action && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {alrt.priority_breakdown?.critical || 0} critical alert{alrt.priority_breakdown?.critical !== 1 ? 's' : ''} require immediate attention
                </p>
                <p className="text-xs text-red-600 mt-0.5">See the Alerts panel below</p>
              </div>
            </div>
          )}

          {/* ── Visitor stats row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={UsersIcon}           label="Active right now"   value={vm?.active_now ?? 0}                      color="indigo" />
            <Stat icon={ArrowTrendingUpIcon} label="Today's visitors"    value={vm?.today ?? 0}
              sub={vm?.change_percentage != null ? `${vm.change_direction === 'up' ? '+' : ''}${vm.change_percentage}% vs yesterday` : undefined}
              color="green" />
            <Stat icon={EyeIcon}             label="This week"          value={vm?.week_total ?? 0}                      color="slate" />
            <Stat icon={FlagIcon}            label="Unresolved alerts"  value={alrt?.total_unresolved ?? 0}
              sub={alrt?.requires_immediate_action ? 'Action required' : 'All clear'}
              color={alrt?.requires_immediate_action ? 'red' : 'slate'} />
          </div>

          {/* ── Hourly activity & Alert severity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Hourly activity (last 24 h)" icon={ClockIcon}>
              {hourlyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total"      name="All visits"   fill="#c7d2fe" radius={[2,2,0,0]} />
                    <Bar dataKey="suspicious" name="Suspicious"   fill="#ef4444" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty msg="No hourly data yet." />}
              <p className="text-xs text-gray-400 mt-2">Red = suspicious. 2–5 AM window highlighted by investigators as high-risk.</p>
            </Card>

            <Card title="Alert severity breakdown" icon={ExclamationTriangleIcon}>
              {severityChart.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={severityChart} dataKey="count" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                        {severityChart.map((_, i) => <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#3b82f6'][i] || '#6b7280'} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {Object.entries(alrt?.priority_breakdown || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded ${PRIORITY_STYLE[k] || 'bg-gray-100 text-gray-600'}`}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <Empty msg="No alerts for this case." />}
            </Card>
          </div>

          {/* ── Suspicious activity ── */}
          <Card title="Suspicious activity (last 7 days)" icon={SignalSlashIcon}
            action={<span className="text-xs text-gray-400">{sa?.total_7d ?? 0} total</span>}>
            {sa?.recent_activities?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {['Fingerprint','Type','Severity','Confidence','IP','Time'].map(h => (
                        <th key={h} className="pb-2 pr-4 text-xs font-medium text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sa.recent_activities.slice(0, 15).map((a, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 pr-4"><code className="text-xs text-gray-500 font-mono">{a.fingerprint}</code></td>
                        <td className="py-2.5 pr-4 text-gray-600">{a.type?.replace(/_/g,' ')}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            a.severity >= 4 ? 'bg-red-100 text-red-700'
                              : a.severity === 3 ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>{a.severity}/5</span>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">
                          {a.confidence != null ? `${Math.round(a.confidence * 100)}%` : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">{a.ip_address || '—'}</td>
                        <td className="py-2.5 text-gray-400 text-xs">{a.time_ago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty msg="No suspicious activity recorded yet." />}
          </Card>

          {/* ── Alerts panel ── */}
          <Card title="Open alerts" icon={BoltIcon}
            action={<span className="text-xs text-gray-400">{alrt?.total_unresolved ?? 0} unresolved</span>}>
            {alrt?.alerts?.length > 0 ? (
              <div className="space-y-2">
                {alrt.alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                    a.priority === 'critical' ? 'bg-red-50 border-red-100'
                      : a.priority === 'high' ? 'bg-orange-50 border-orange-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}>
                    <ExclamationTriangleIcon className={`w-4 h-4 mt-0.5 shrink-0 ${
                      a.priority === 'critical' ? 'text-red-500'
                        : a.priority === 'high' ? 'text-orange-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_STYLE[a.priority] || 'bg-gray-100 text-gray-500'}`}>
                          {a.priority}
                        </span>
                      </div>
                      {a.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.message}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{a.time_ago}</span>
                  </div>
                ))}
              </div>
            ) : <Empty msg="No open alerts." />}
          </Card>

          {/* ── Geographic & Device breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Visitors by country" icon={GlobeAltIcon}>
              {geo?.countries?.length > 0 ? (
                <div className="space-y-2">
                  {geo.countries.slice(0, 8).map((c, i) => {
                    const max = geo.countries[0]?.visitors || 1;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-1.5 text-gray-700">
                            {c.code}
                            {c.risk_level === 'high' && <span className="text-xs text-red-500">⚠ suspicious</span>}
                          </span>
                          <span className="text-gray-400">{c.visitors?.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div
                            className={`h-1.5 rounded-full ${c.risk_level === 'high' ? 'bg-red-400' : 'bg-indigo-400'}`}
                            style={{ width: `${Math.round((c.visitors / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <Empty msg="No geographic data yet." />}
            </Card>

            <Card title="Device breakdown" icon={DevicePhoneMobileIcon}>
              {devicePie.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={150}>
                    <PieChart>
                      <Pie data={devicePie} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                        {devicePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {devicePie.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600 truncate">{d.name || 'Unknown'}</span>
                        <span className="text-gray-400 ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <Empty msg="No device data yet." />}
            </Card>
          </div>

          {/* ── Engagement & Top pages ── */}
          <Card title="Engagement metrics" icon={ArrowTrendingUpIcon}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Avg. session', value: eng?.metrics?.avg_session_duration != null ? `${Math.round(eng.metrics.avg_session_duration / 60)}m` : '—' },
                { label: 'Pages/session', value: eng?.metrics?.avg_pages_per_session != null ? eng.metrics.avg_pages_per_session.toFixed(1) : '—' },
                { label: 'Bounce rate', value: eng?.metrics?.bounce_rate != null ? `${Math.round(eng.metrics.bounce_rate)}%` : '—' },
                { label: 'Quality score', value: eng?.quality_score != null ? `${eng.quality_score}/100` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {eng?.top_pages?.length > 0 && (
              <>
                <p className="text-xs font-medium text-gray-500 mb-2">Top pages</p>
                <div className="space-y-2">
                  {eng.top_pages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-xs">{p.page_url || `Page ${i + 1}`}</span>
                      <span className="text-gray-400 shrink-0 ml-2">{p.views?.toLocaleString()} views</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── Referrer sources ── */}
          {ref?.top_referrers?.length > 0 && (
            <Card title="Traffic sources" icon={ArrowTrendingUpIcon}>
              <div className="space-y-2">
                {ref.top_referrers.slice(0, 8).map((r, i) => {
                  const max = ref.top_referrers[0]?.visits || 1;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{r.domain}</span>
                        <span className="text-gray-400">{r.visits?.toLocaleString()} visits</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${Math.round((r.visits / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── Identity Anomalies ── */}
          <IdentityAnomalies caseSlug={selectedCase} />

          <div className="flex justify-end">
            <button onClick={() => loadOverview(selectedCase)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowPathIcon className="w-4 h-4" /> Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
