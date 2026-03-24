/**
 * MLStatusWidget.jsx
 *
 * Tiny panel for the admin analytics view that shows whether the ML
 * pipeline is healthy: detection system loaded, models trained, Celery
 * workers online, database stats.
 *
 * Data comes from GET /api/tracker/ml/status/
 */

import React, { useEffect, useState } from 'react';
import api from '../../../../api/config';

const STATUS_COLORS = {
  ok:   'text-green-400',
  warn: 'text-yellow-400',
  err:  'text-red-400',
};

function Pill({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        ok ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
      }`}
    >
      <span>{ok ? '●' : '○'}</span>
      {label}
    </span>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-xs font-mono font-semibold ${color || 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function MLStatusWidget() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/tracker/ml/status/');
      setStatus(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to load ML status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/60 to-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-white font-semibold text-sm">ML Pipeline Status</h3>
        </div>
        <button
          onClick={refresh}
          className="text-slate-400 hover:text-white text-xs transition-colors"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <p className="text-slate-400 text-xs text-center py-4 animate-pulse">Loading…</p>
        )}
        {error && (
          <p className="text-red-400 text-xs text-center py-4">{error}</p>
        )}
        {!loading && !error && status && (
          <div className="space-y-4">

            {/* Pills row */}
            <div className="flex flex-wrap gap-2">
              <Pill ok={status.detection_system_loaded}  label="Detection System" />
              <Pill
                ok={Object.values(status.ml_models || {}).some(m => m.exists)}
                label="Trained Models"
              />
              <Pill ok={status.celery?.broker_reachable}  label="Celery / Redis" />
            </div>

            {/* ML Models */}
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                Model Files
              </p>
              {Object.entries(status.ml_models || {}).map(([name, info]) => (
                <Row
                  key={name}
                  label={name.replace(/_/g, ' ')}
                  value={info.exists ? `✓  ${info.size_kb} KB` : '✗  not trained'}
                  color={info.exists ? STATUS_COLORS.ok : STATUS_COLORS.err}
                />
              ))}
            </div>

            {/* Training info */}
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                Training
              </p>
              {status.training?.trained_at ? (
                <Row
                  label="Last trained"
                  value={new Date(status.training.trained_at).toLocaleString()}
                />
              ) : (
                <p className="text-yellow-400 text-xs">
                  {status.training?.message || 'Not yet trained'}
                </p>
              )}
              {status.training?.total_labels !== undefined && (
                <Row label="Total labels" value={status.training.total_labels} />
              )}
              {status.training?.label_counts && Object.entries(status.training.label_counts).map(
                ([lbl, cnt]) => (
                  <Row key={lbl} label={`  └ ${lbl}`} value={cnt} />
                )
              )}
              {(status.training?.total_labels ?? 0) < 5 && (
                <p className="text-yellow-300 text-[10px] mt-1">
                  ⚠ Need ≥ 5 labels to train supervised classifiers.<br />
                  Label suspects in the Suspects panel or Django Admin.
                </p>
              )}
            </div>

            {/* Celery */}
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                Celery Workers
              </p>
              {status.celery?.broker_reachable ? (
                <>
                  <Row label="Workers online" value={status.celery.workers_online} />
                  <Row label="Active tasks"   value={status.celery.active_tasks} />
                  <Row label="Queued tasks"   value={status.celery.reserved_tasks} />
                  {(status.celery.worker_names || []).map(w => (
                    <Row key={w} label={`  └ ${w}`} value="online" color={STATUS_COLORS.ok} />
                  ))}
                </>
              ) : (
                <p className="text-red-400 text-xs">
                  Workers offline — set REDIS_URL and deploy Celery workers.
                </p>
              )}
            </div>

            {/* DB stats */}
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                Database
              </p>
              <Row label="Total events"      value={(status.database?.total_events || 0).toLocaleString()} />
              <Row label="ML-analyzed"       value={(status.database?.ml_analyzed_events || 0).toLocaleString()} />
              <Row label="Suspicious events" value={(status.database?.suspicious_events || 0).toLocaleString()} />
              <Row label="Honeypot hits"     value={status.database?.honeypot_hits || 0}
                   color={(status.database?.honeypot_hits || 0) > 0 ? STATUS_COLORS.err : undefined} />
            </div>

            {/* Train button hint */}
            <div className="bg-slate-700/50 rounded-lg p-3 text-[10px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">To retrain models:</p>
              <code className="font-mono text-violet-300">
                python manage.py train_ml
              </code>
              <p className="mt-1">
                Run this from your backend shell after labeling suspects. Add{' '}
                <code className="text-violet-300">--dry-run</code> to preview.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
