/**
 * SuspectPanel.jsx — Law Enforcement Suspect Intelligence Panel
 *
 * Displays visitors ranked by a behavioural suspicion score.
 * Honeypot-triggered visitors are always pinned to the top with a critical badge.
 *
 * Backend: GET /api/tracker/dashboard/<caseSlug>/suspects/
 *          GET /api/tracker/dashboard/<caseSlug>/suspects/export/  → CSV
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '@/api/analyticsAPI';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FlagIcon,
  SignalSlashIcon,
  GlobeAltIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

// ─── Risk styling ─────────────────────────────────────────────────────────────

const RISK_STYLE = {
  critical: {
    badge:  'bg-red-100 text-red-800 border border-red-300 font-bold',
    row:    'bg-red-50 border-l-4 border-red-500',
    bar:    'bg-red-500',
    icon:   'text-red-500',
    pulse:  true,
  },
  high: {
    badge:  'bg-orange-100 text-orange-800 border border-orange-200 font-semibold',
    row:    'bg-orange-50 border-l-4 border-orange-400',
    bar:    'bg-orange-400',
    icon:   'text-orange-500',
    pulse:  false,
  },
  medium: {
    badge:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
    row:    'bg-yellow-50 border-l-4 border-yellow-400',
    bar:    'bg-yellow-400',
    icon:   'text-yellow-500',
    pulse:  false,
  },
  low: {
    badge:  'bg-blue-100 text-blue-700 border border-blue-200',
    row:    'bg-white border-l-4 border-blue-300',
    bar:    'bg-blue-400',
    icon:   'text-blue-500',
    pulse:  false,
  },
};

const SIGNAL_ICON = {
  honeypot_triggered:  '🪤',
  tor_detected:        '🧅',
  vpn_detected:        '🔒',
  multiple_ips:        '📡',
  unusual_hour:        '🌙',
  high_visit_count:    '👁️',
  return_visitor:      '🔄',
  suspicious_patterns: '⚠️',
  high_severity:       '🚨',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ risk }) {
  const s = RISK_STYLE[risk] || RISK_STYLE.low;
  return (
    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${s.badge}`}>
      {s.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
      {risk.toUpperCase()}
    </span>
  );
}

function ScoreBar({ score, risk }) {
  const s = RISK_STYLE[risk] || RISK_STYLE.low;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all ${s.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-600 w-6 text-right">{score}</span>
    </div>
  );
}

function HoneypotBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow">
      🪤 HONEYPOT HIT
    </span>
  );
}

function SignalPill({ signal }) {
  const emoji = SIGNAL_ICON[signal.type] || '⚠️';
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
      <span>{emoji}</span>
      <span>{signal.label}</span>
    </span>
  );
}

// ─── Expanded row detail ──────────────────────────────────────────────────────

function SuspectDetail({ suspect }) {
  return (
    <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Signals */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Detection signals</p>
        <div className="flex flex-wrap gap-1.5">
          {suspect.signals.map((sig, i) => (
            <SignalPill key={i} signal={sig} />
          ))}
        </div>
      </div>

      {/* Network */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
          <GlobeAltIcon className="w-3.5 h-3.5" /> Network
        </p>
        <dl className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <dt className="text-gray-400">Latest IP</dt>
            <dd className="font-mono">{suspect.latest_ip || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Country</dt>
            <dd>{suspect.latest_country || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">City</dt>
            <dd>{suspect.latest_city || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Unique IPs used</dt>
            <dd className="font-semibold">{suspect.unique_ips}</dd>
          </div>
        </dl>
      </div>

      {/* Device / Timeline */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
          <DevicePhoneMobileIcon className="w-3.5 h-3.5" /> Device / Timeline
        </p>
        <dl className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <dt className="text-gray-400">Browser</dt>
            <dd>{suspect.browser || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">OS</dt>
            <dd>{suspect.os || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Device</dt>
            <dd>{suspect.device_type || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">First seen</dt>
            <dd>{suspect.first_seen ? new Date(suspect.first_seen).toLocaleDateString() : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-400">Last seen</dt>
            <dd>{suspect.last_seen_ago}</dd>
          </div>
        </dl>
      </div>

      {/* Fingerprint */}
      <div className="sm:col-span-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Device fingerprint:{' '}
          <code className="font-mono text-gray-600 text-xs">{suspect.fingerprint}</code>
        </p>
        {suspect.honeypot_triggered && (
          <p className="text-xs text-red-600 mt-1 font-semibold">
            ⚠ This visitor triggered a hidden trap link. This is a strong indicator of insider knowledge
            about the case. Flag immediately for law enforcement follow-up.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SuspectPanel({ caseSlug }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    try {
      const r = await analyticsAPI.getSuspects(caseSlug);
      setData(r.data);
    } catch (err) {
      console.error('[SuspectPanel] fetch failed:', err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [caseSlug]);

  useEffect(() => { load(); }, [load]);

  function toggle(fp) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(fp) ? next.delete(fp) : next.add(fp);
      return next;
    });
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const r = await analyticsAPI.exportSuspects(caseSlug);
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      Object.assign(document.createElement('a'), {
        href: url,
        download: `suspects-${caseSlug}.csv`,
      }).click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed — try again.');
    } finally {
      setExporting(false);
    }
  }

  if (!caseSlug) return null;

  const suspects = data?.suspects || [];
  const honeyHits = data?.honeypot_count || 0;
  const criticalCount = data?.critical_count || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-slate-900 to-red-900 px-6 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldExclamationIcon className="w-5 h-5 text-red-300" />
            <h3 className="text-base font-bold text-white">Suspect Intelligence Panel</h3>
            {criticalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs">
            Visitors ranked by behavioural suspicion score · Honeypot hits auto-elevated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCSV}
            disabled={exporting || suspects.length === 0}
            className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── Honeypot alert banner ── */}
      {honeyHits > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">
              🪤 {honeyHits} visitor{honeyHits !== 1 ? 's' : ''} triggered the hidden honeypot
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              These individuals clicked a link invisible to normal users — strong indicator of
              insider knowledge or active investigation of the case. Recommend immediate LEO review.
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Scoring visitors…</span>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && suspects.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <SignalSlashIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No suspicious visitors detected yet</p>
          <p className="text-xs mt-1">Scores update as visitors interact with the case page.</p>
        </div>
      )}

      {/* ── Suspect list ── */}
      {!loading && suspects.length > 0 && (
        <div className="divide-y divide-gray-100">

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Fingerprint</div>
            <div className="col-span-2">Risk / Score</div>
            <div className="col-span-2">Visits / IPs</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Last seen</div>
          </div>

          {suspects.map((s, i) => {
            const style = RISK_STYLE[s.risk] || RISK_STYLE.low;
            const open  = expanded.has(s.fingerprint);
            return (
              <div key={s.fingerprint}>
                <button
                  className={`w-full text-left px-4 py-3 hover:brightness-95 transition-all ${style.row}`}
                  onClick={() => toggle(s.fingerprint)}
                >
                  <div className="grid grid-cols-12 items-center gap-2">

                    {/* Rank */}
                    <div className="col-span-1 flex items-center gap-1">
                      {open
                        ? <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="text-xs text-gray-400">{i + 1}</span>
                    </div>

                    {/* Fingerprint + honeypot badge */}
                    <div className="col-span-3 min-w-0">
                      <code className="text-xs font-mono text-gray-700 block truncate">
                        {s.fingerprint_short}
                      </code>
                      {s.honeypot_triggered && (
                        <div className="mt-1">
                          <HoneypotBadge />
                        </div>
                      )}
                    </div>

                    {/* Risk + score */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <RiskBadge risk={s.risk} />
                      <ScoreBar score={s.score} risk={s.risk} />
                    </div>

                    {/* Visits / IPs */}
                    <div className="col-span-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-gray-400" />
                        {s.visit_count} visit{s.visit_count !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                        <GlobeAltIcon className="w-3 h-3" />
                        {s.unique_ips} IP{s.unique_ips !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-2 text-xs text-gray-600 truncate">
                      {s.latest_city
                        ? `${s.latest_city}, ${s.latest_country}`
                        : s.latest_country || '—'}
                    </div>

                    {/* Last seen */}
                    <div className="col-span-2 text-xs text-gray-400">
                      {s.last_seen_ago}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {open && <SuspectDetail suspect={s} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer note ── */}
      {suspects.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {suspects.length} highest-scoring visitor{suspects.length !== 1 ? 's' : ''}.
            Scores reset when new tracking data arrives. Click any row to expand.
          </p>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
          >
            <FlagIcon className="w-3.5 h-3.5" />
            Export for case file
          </button>
        </div>
      )}
    </div>
  );
}
