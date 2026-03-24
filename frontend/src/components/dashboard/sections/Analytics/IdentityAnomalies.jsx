/**
 * IdentityAnomalies.jsx — Identity & Network Anomaly Detection
 *
 * Displays two suspicious patterns:
 *   1. same_fp_multi_ip  — one device fingerprint seen from multiple IPs (VPN rotation)
 *   2. same_ip_multi_fp  — one IP with multiple device fingerprints (browser/cookie switching)
 *
 * Used in LEOAnalytics and AdminAnalytics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '@/api/analyticsAPI';
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CHIP = {
  critical: 'bg-red-100 text-red-800 border border-red-300',
  high:     'bg-orange-100 text-orange-700 border border-orange-300',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-300',
  low:      'bg-blue-100 text-blue-700 border border-blue-300',
};

const RISK_ROW_BG = {
  critical: 'border-l-4 border-red-500 bg-red-50',
  high:     'border-l-4 border-orange-400 bg-orange-50',
  medium:   'border-l-4 border-yellow-400 bg-yellow-50',
  low:      'border-l-4 border-blue-300 bg-white',
};

function RiskChip({ level }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RISK_CHIP[level] || RISK_CHIP.low}`}>
      {level?.toUpperCase()}
    </span>
  );
}

function SummaryBar({ summary }) {
  if (!summary) return null;
  const items = [
    { label: 'Anomalous Fingerprints', value: summary.anomalous_fingerprints, color: 'text-slate-700' },
    { label: 'Critical',               value: summary.critical,               color: 'text-red-700 font-bold' },
    { label: 'High Risk',              value: summary.high,                   color: 'text-orange-600 font-semibold' },
    { label: 'Shared IPs',             value: summary.shared_ips,             color: 'text-yellow-700' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {items.map(({ label, value, color }) => (
        <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
          <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

function FpMultiIpRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg mb-2 ${RISK_ROW_BG[item.risk_level] || 'bg-white border'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between p-3 text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <FingerPrintIcon className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {item.fingerprint_hash}
              </code>
              <RiskChip level={item.risk_level} />
              {item.is_tor  && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">TOR</span>}
              {item.is_vpn  && <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-300">VPN</span>}
              {item.is_proxy && <span className="text-xs px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-300">PROXY</span>}
            </div>
            <p className="text-xs text-gray-600 mt-1">{item.explanation}</p>
          </div>
        </div>
        <div className="shrink-0 ml-3 text-right">
          <div className="text-sm font-semibold text-slate-700">{item.distinct_ips} IPs</div>
          <div className="text-xs text-gray-400">{item.total_events} events</div>
        </div>
      </button>

      {open && item.ip_details?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="border-t border-gray-200 pt-2 space-y-1">
            {item.ip_details.map((ip, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="w-3 h-3 text-gray-400" />
                  <code className="font-mono text-slate-600">{ip.ip_address}</code>
                  {ip.ip_region && <span className="text-gray-500">({ip.ip_region})</span>}
                  {ip.is_tor   && <span className="px-1 bg-purple-100 text-purple-700 rounded text-xs">Tor</span>}
                  {ip.is_vpn   && <span className="px-1 bg-indigo-100 text-indigo-600 rounded text-xs">VPN</span>}
                  {ip.is_proxy && <span className="px-1 bg-pink-100 text-pink-600 rounded text-xs">Proxy</span>}
                </div>
                <span className="text-gray-400">{ip.hits} hits</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
            <span>First: {item.first_seen ? new Date(item.first_seen).toLocaleDateString() : '—'}</span>
            <span>Last: {item.last_seen  ? new Date(item.last_seen).toLocaleDateString()  : '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function IpMultiFpRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg mb-2 ${RISK_ROW_BG[item.risk_level] || 'bg-white border'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between p-3 text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <SignalIcon className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {item.ip_address}
              </code>
              <RiskChip level={item.risk_level} />
            </div>
            <p className="text-xs text-gray-600 mt-1">{item.explanation}</p>
          </div>
        </div>
        <div className="shrink-0 ml-3 text-right">
          <div className="text-sm font-semibold text-slate-700">{item.distinct_fps} devices</div>
          <div className="text-xs text-gray-400">{item.total_events} events</div>
        </div>
      </button>

      {open && item.fp_details?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="border-t border-gray-200 pt-2 space-y-1">
            {item.fp_details.map((fp, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <FingerPrintIcon className="w-3 h-3 text-gray-400" />
                  <code className="font-mono text-slate-600">{fp.fingerprint_hash}</code>
                  {fp.ip_region && <span className="text-gray-500">({fp.ip_region})</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{fp.hits} hits</span>
                  {fp.last_seen && (
                    <span>{new Date(fp.last_seen).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
            <span>First: {item.first_seen ? new Date(item.first_seen).toLocaleDateString() : '—'}</span>
            <span>Last: {item.last_seen  ? new Date(item.last_seen).toLocaleDateString()  : '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function IdentityAnomalies({ caseSlug }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('fp'); // 'fp' | 'ip'

  const load = useCallback(async () => {
    if (!caseSlug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsAPI.getIdentityAnomalies(caseSlug);
      setData(res.data);
    } catch (e) {
      setError('Failed to load anomaly data.');
    } finally {
      setLoading(false);
    }
  }, [caseSlug]);

  useEffect(() => { load(); }, [load]);

  const fpList = data?.same_fp_multi_ip ?? [];
  const ipList = data?.same_ip_multi_fp ?? [];
  const hasCritical = (data?.summary?.critical ?? 0) > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldExclamationIcon className={`w-5 h-5 ${hasCritical ? 'text-red-500' : 'text-slate-500'}`} />
          <h3 className="text-sm font-semibold text-gray-800">Identity Anomalies</h3>
          {hasCritical && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">
              Critical
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
          <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {/* Content */}
      {data && !loading && (
        <>
          <SummaryBar summary={data.summary} />

          {/* Tab switcher */}
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('fp')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'fp'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FingerPrintIcon className="w-3.5 h-3.5" />
                VPN / IP Rotation
                {fpList.length > 0 && (
                  <span className="bg-slate-200 text-slate-700 rounded-full px-1.5 text-xs">
                    {fpList.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setTab('ip')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === 'ip'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <SignalIcon className="w-3.5 h-3.5" />
                Shared IP / Multi-Device
                {ipList.length > 0 && (
                  <span className="bg-slate-200 text-slate-700 rounded-full px-1.5 text-xs">
                    {ipList.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* Tab: VPN / IP rotation */}
          {tab === 'fp' && (
            <>
              {fpList.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  No fingerprints seen from multiple IPs.
                </p>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    One device fingerprint detected from multiple IP addresses — may indicate VPN rotation,
                    proxy hopping, or deliberate identity concealment. Click a row to expand IP details.
                  </p>
                  {fpList.map((item, i) => (
                    <FpMultiIpRow key={i} item={item} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab: Shared IP / Multi-device */}
          {tab === 'ip' && (
            <>
              {ipList.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  No IPs seen with multiple device fingerprints.
                </p>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    One IP address associated with multiple device fingerprints — may indicate a shared
                    network, household, library, or deliberate browser/cookie switching. Click to expand.
                  </p>
                  {ipList.map((item, i) => (
                    <IpMultiFpRow key={i} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Empty state — no anomalies at all */}
      {data && !loading && fpList.length === 0 && ipList.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No identity anomalies detected yet.
        </p>
      )}
    </div>
  );
}
