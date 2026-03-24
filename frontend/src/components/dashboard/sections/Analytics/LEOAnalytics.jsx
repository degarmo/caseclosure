/**
 * LEOAnalytics.jsx — Law Enforcement Officer view
 *
 * Dialed back from Admin: shows only investigation-relevant data.
 * No engagement metrics, no referrer sources.
 * Focused on: suspicious activity, alerts, timeline, device breakdown, geographic anomalies.
 *
 * Uses the same dashboard_overview response:
 *   widgets.suspicious_activity  → severity_breakdown, recent_activities, top_suspicious_users
 *   widgets.alerts_panel         → alerts[], priority_breakdown, requires_immediate_action
 *   widgets.activity_timeline    → hourly_breakdown (chart), timeline (recent events)
 *   widgets.geographic_map       → suspicious_locations[], countries (risk_level)
 *   widgets.visitor_metrics      → active_now, today (context only, no trend)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI, adminTrackingAPI } from '@/api/analyticsAPI';
import IdentityAnomalies from './IdentityAnomalies';
import SuspectPanel from './SuspectPanel';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShieldExclamationIcon, ExclamationTriangleIcon, FlagIcon,
  ArrowPathIcon, ClockIcon, GlobeAltIcon, SignalSlashIcon,
  ArrowDownTrayIcon, EyeIcon, DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_CHIP = {
  5: 'bg-red-200 text-red-900 font-bold',
  4: 'bg-red-100 text-red-700',
  3: 'bg-orange-100 text-orange-700',
  2: 'bg-yellow-100 text-yellow-700',
  1: 'bg-blue-100 text-blue-700',
};

const PRIORITY_CHIP = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-blue-100 text-blue-700',
};

const DEV_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];

function Chip({ label, style }) {
  return <span className={`text-xs px-2 py-0.5 rounded ${style}`}>{label}</span>;
}

function Card({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LEOAnalytics({ caseSlug, caseName }) {
  const [overview, setOverview]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [flagging, setFlagging]   = useState(null);

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    setOverview(null);
    try {
      const r = await analyticsAPI.getDashboard(caseSlug);
      setOverview(r.data);
    } catch { /* empty states handle it */ }
    finally { setLoading(false); }
  }, [caseSlug]);

  useEffect(() => { load(); }, [load]);

  async function flagVisitor(fingerprint) {
    if (!fingerprint) return;
    setFlagging(fingerprint);
    try {
      await adminTrackingAPI.flagUser(fingerprint);
      await load();
    } catch { alert('Could not flag visitor. Try again.'); }
    finally { setFlagging(null); }
  }

  function exportCSV() {
    analyticsAPI.exportData(caseSlug, { format: 'csv' })
      .then(r => {
        const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
        Object.assign(document.createElement('a'), { href: url, download: `${caseSlug}-intel.csv` }).click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Export failed.'));
  }

  if (!caseSlug) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-500 text-sm">
        No case assigned. Contact your administrator to be assigned to a case.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <ArrowPathIcon className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Widgets ──
  const vm   = overview?.widgets?.visitor_metrics;
  const sa   = overview?.widgets?.suspicious_activity;
  const tl   = overview?.widgets?.activity_timeline;
  const alrt = overview?.widgets?.alerts_panel;
  const geo  = overview?.widgets?.geographic_map;
  const dev  = overview?.widgets?.device_breakdown;

  // Hourly chart — only show 24 h
  const hourlyChart = tl?.hourly_breakdown
    ? Object.entries(tl.hourly_breakdown)
        .map(([h, d]) => ({ hour: `${h}:00`, total: d.events, suspicious: d.suspicious }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  // Suspicious countries only
  const flaggedCountries = geo?.countries?.filter(c => c.risk_level === 'high') || [];

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-slate-800 rounded-xl p-6 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldExclamationIcon className="w-5 h-5 text-slate-300" />
            <h2 className="text-xl font-bold">Investigation Intelligence</h2>
          </div>
          <p className="text-slate-300 text-sm">
            {caseName || caseSlug} — suspicious activity, patterns, and active alerts
          </p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 transition-colors px-3 py-2 rounded-lg text-sm text-white">
          <ArrowDownTrayIcon className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* ── Critical banner ── */}
      {alrt?.requires_immediate_action && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {alrt.priority_breakdown?.critical || 0} critical alert(s) require immediate attention
            </p>
            <p className="text-xs text-red-600 mt-0.5">Review the Alerts panel below</p>
          </div>
        </div>
      )}

      {/* ── 4 stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: EyeIcon,          label: 'Active on site now',    value: vm?.active_now ?? 0,           color: 'text-slate-600  bg-slate-50' },
          { icon: SignalSlashIcon,  label: 'Suspicious (24 h)',     value: sa?.total_24h ?? 0,            color: 'text-orange-600 bg-orange-50' },
          { icon: FlagIcon,         label: 'Critical / High today', value: (sa?.severity_breakdown?.critical ?? 0) + (sa?.severity_breakdown?.high ?? 0), color: 'text-red-600    bg-red-50' },
          { icon: ClockIcon,        label: 'Open alerts',           value: alrt?.total_unresolved ?? 0,   color: 'text-amber-600  bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Activity timeline (hourly chart) ── */}
      <Card title="Activity by hour (last 24 h)" icon={ClockIcon}>
        {hourlyChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total"      name="All visits"   fill="#cbd5e1" radius={[2,2,0,0]} />
              <Bar dataKey="suspicious" name="Suspicious"   fill="#ef4444" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty msg="No timeline data yet." />}
        <p className="text-xs text-gray-400 mt-2">
          Red = suspicious events. Visits between 2–5 AM are automatically flagged as unusual-hour activity.
        </p>
      </Card>

      {/* ── Suspicious sessions ── */}
      <Card title="Suspicious sessions (last 7 days)" icon={FlagIcon}
        action={<span className="text-xs text-gray-400">{sa?.total_7d ?? 0} total</span>}>
        {sa?.recent_activities?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Device ID','Activity','Sev.','Confidence','IP Address','Seen'].map(h => (
                    <th key={h} className="pb-2 pr-4 text-xs font-medium text-gray-400">{h}</th>
                  ))}
                  <th className="pb-2 text-xs font-medium text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sa.recent_activities.map((a, i) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-3 pr-4">
                      <code className="text-xs font-mono text-gray-500">{a.fingerprint}</code>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{a.type?.replace(/_/g, ' ')}</td>
                    <td className="py-3 pr-4">
                      <Chip label={`${a.severity}/5`} style={SEVERITY_CHIP[a.severity] || 'bg-gray-100 text-gray-600'} />
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {a.confidence != null ? `${Math.round(a.confidence * 100)}%` : '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{a.ip_address || '—'}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{a.time_ago}</td>
                    <td className="py-3">
                      <button
                        onClick={() => flagVisitor(a.fingerprint)}
                        disabled={flagging === a.fingerprint}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        <FlagIcon className="w-3.5 h-3.5" />
                        {flagging === a.fingerprint ? '…' : 'Flag'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty msg="No suspicious sessions detected for this case." />}
      </Card>

      {/* ── Active alerts ── */}
      <Card title="Active alerts" icon={ExclamationTriangleIcon}
        action={<span className="text-xs text-gray-400">{alrt?.total_unresolved ?? 0} unresolved</span>}>
        {alrt?.alerts?.length > 0 ? (
          <div className="space-y-2.5">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <Chip label={a.priority} style={PRIORITY_CHIP[a.priority] || 'bg-gray-100 text-gray-600'} />
                    {!a.acknowledged && <Chip label="Unread" style="bg-indigo-100 text-indigo-700" />}
                  </div>
                  {a.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.message}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{a.time_ago}</span>
              </div>
            ))}
          </div>
        ) : <Empty msg="No active alerts. The system is monitoring this case." />}
      </Card>

      {/* ── Device breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device types */}
        <Card title="Device types" icon={DevicePhoneMobileIcon}>
          {dev?.device_types?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={130}>
                <PieChart>
                  <Pie data={dev.device_types.slice(0, 5)} dataKey="count" cx="50%" cy="50%" outerRadius={55}>
                    {dev.device_types.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={DEV_COLORS[i % DEV_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1 min-w-0">
                {dev.device_types.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: DEV_COLORS[i % DEV_COLORS.length] }} />
                    <span className="text-gray-600 truncate">{d.device_type || 'Unknown'}</span>
                    <span className="text-gray-400 ml-auto shrink-0">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty msg="No device data yet." />}
        </Card>

        {/* Browsers */}
        <Card title="Browsers" icon={DevicePhoneMobileIcon}>
          {dev?.browsers?.length > 0 ? (
            <div className="space-y-2.5">
              {dev.browsers.slice(0, 5).map((b, i) => {
                const max = dev.browsers[0]?.count || 1;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{b.browser || 'Unknown'}</span>
                      <span className="text-gray-400">{b.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-indigo-400 rounded-full"
                        style={{ width: `${Math.round((b.count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <Empty msg="No browser data yet." />}
        </Card>

        {/* Operating systems */}
        <Card title="Operating systems" icon={DevicePhoneMobileIcon}>
          {dev?.operating_systems?.length > 0 ? (
            <div className="space-y-2.5">
              {dev.operating_systems.slice(0, 5).map((o, i) => {
                const max = dev.operating_systems[0]?.count || 1;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{o.os || 'Unknown'}</span>
                      <span className="text-gray-400">{o.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-slate-400 rounded-full"
                        style={{ width: `${Math.round((o.count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <Empty msg="No OS data yet." />}
          <p className="text-xs text-gray-400 mt-3">
            OS fingerprinting can help correlate sessions across visits.
          </p>
        </Card>
      </div>

      {/* ── Flagged geographic locations ── */}
      {flaggedCountries.length > 0 && (
        <Card title="High-risk locations" icon={GlobeAltIcon}>
          <div className="space-y-2">
            {flaggedCountries.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                <span className="text-sm font-medium text-red-800">{c.code}</span>
                <div className="flex items-center gap-3 text-xs text-red-600">
                  <span>{c.visitors?.toLocaleString()} visitors</span>
                  <span>{c.suspicious} suspicious</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Locations are flagged when suspicious sessions exceed 5% of total visits from that region.
          </p>
        </Card>
      )}

      {/* ── Suspect Intelligence Panel ── */}
      <SuspectPanel caseSlug={caseSlug} />

      {/* ── Identity Anomalies ── */}
      <IdentityAnomalies caseSlug={caseSlug} />

      <div className="flex justify-end">
        <button onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-slate-600 transition-colors">
          <ArrowPathIcon className="w-4 h-4" /> Refresh
        </button>
      </div>
    </div>
  );
}
