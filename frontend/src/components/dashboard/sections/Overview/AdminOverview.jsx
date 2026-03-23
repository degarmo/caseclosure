/**
 * AdminOverview.jsx
 *
 * Rich admin overview page — platform-wide stats with charts & quick actions.
 *
 * Derives all data from the already-fetched `data` + `stats` props (no extra API
 * calls) so it renders instantly.  Charts use recharts (already in deps).
 *
 * Layout:
 *   1. KPI row — 6 metric cards
 *   2. Case status donut  +  Spotlight/content donut
 *   3. Message breakdown bar  +  User-type breakdown bar
 *   4. Quick-action panel  +  Recent cases list
 */

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  FolderOpenIcon,
  CheckCircleIcon,
  UsersIcon,
  EnvelopeIcon,
  LightBulbIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  NewspaperIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  indigo:  '#0f766e',
  purple:  '#0369a1',
  green:   '#22c55e',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#1d4ed8',
  gray:    '#e5e7eb',
  slate:   '#94a3b8',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, accent = 'indigo', action, onAction }) {
  const bg = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50  text-green-600',
    amber:  'bg-amber-50  text-amber-600',
    rose:   'bg-rose-50   text-rose-600',
    sky:    'bg-sky-50    text-sky-600',
  }[accent] || 'bg-gray-50 text-gray-600';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3
        ${action ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all' : ''}`}
      onClick={action ? () => onAction(action) : undefined}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Custom donut label showing percentage
function DonutLabel({ cx, cy, total, label }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.4em" className="text-2xl font-bold" fill="#111827" fontSize={22} fontWeight={700}>
        {total}
      </tspan>
      <tspan x={cx} dy="1.4em" fill="#9ca3af" fontSize={11}>
        {label}
      </tspan>
    </text>
  );
}

// Tooltip shared style
const tipStyle = { borderRadius: 8, fontSize: 12, border: '1px solid #e5e7eb' };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminOverview({ data, onSectionChange, theme }) {
  const s = data?.stats || {};
  const cases    = data?.cases    || [];
  const users    = data?.users    || [];
  const messages = data?.messages || [];
  const posts    = data?.spotlightPosts || [];

  // ── Derived data ────────────────────────────────────────────────────────────

  const caseStatusData = useMemo(() => [
    { name: 'Active',   value: s.activeCases  || 0, color: C.indigo },
    { name: 'Inactive', value: Math.max(0, (s.totalCases || 0) - (s.activeCases || 0)), color: C.gray },
  ], [s.activeCases, s.totalCases]);

  const spotlightData = useMemo(() => [
    { name: 'Published', value: s.totalSpotlightPosts || 0, color: C.purple },
    { name: 'Scheduled', value: s.scheduledPosts || 0,      color: C.amber  },
  ], [s.totalSpotlightPosts, s.scheduledPosts]);

  // Message breakdown: tips vs general, read vs unread
  const msgBreakdown = useMemo(() => {
    const tips    = messages.filter(m => m.message_type === 'tip' || m.type === 'tip');
    const general = messages.filter(m => m.message_type !== 'tip' && m.type !== 'tip');
    return [
      {
        category: 'Tips',
        Read:   tips.filter(m => m.read || m.is_read).length,
        Unread: tips.filter(m => !m.read && !m.is_read).length,
      },
      {
        category: 'General',
        Read:   general.filter(m => m.read || m.is_read).length,
        Unread: general.filter(m => !m.read && !m.is_read).length,
      },
    ];
  }, [messages]);

  // User types breakdown
  const userTypeData = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const t = u.account_type || 'user';
      const label = t === 'admin' ? 'Admin' : t === 'leo' ? 'Law Enforcement' : 'Family';
      map[label] = (map[label] || 0) + 1;
    });
    const colors = { Admin: C.indigo, 'Law Enforcement': C.rose, Family: C.green };
    return Object.entries(map).map(([name, value]) => ({ name, value, color: colors[name] || C.slate }));
  }, [users]);

  // Recent cases (last 5 by id descending)
  const recentCases = useMemo(
    () => [...cases].sort((a, b) => b.id - a.id).slice(0, 6),
    [cases]
  );

  // Action items
  const actionItems = useMemo(() => {
    const items = [];
    if (s.pendingRequests > 0)
      items.push({ label: `${s.pendingRequests} pending account request${s.pendingRequests > 1 ? 's' : ''}`, action: 'users-requests', accent: 'amber', icon: ClockIcon });
    if (s.newTips > 0)
      items.push({ label: `${s.newTips} unread tip${s.newTips > 1 ? 's' : ''}`, action: 'messages-tips', accent: 'rose', icon: LightBulbIcon });
    if (s.unreadMessages > 0)
      items.push({ label: `${s.unreadMessages} unread message${s.unreadMessages > 1 ? 's' : ''}`, action: 'messages-all', accent: 'sky', icon: EnvelopeIcon });
    return items;
  }, [s]);

  const caseTotal    = s.totalCases    || 0;
  const spotTotal    = (s.totalSpotlightPosts || 0) + (s.scheduledPosts || 0);
  const userTotal    = s.totalUsers    || 0;
  const msgTotal     = s.totalMessages || 0;

  return (
    <div className="space-y-6">

      <section
        className="overflow-hidden rounded-[30px] border px-6 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        style={{ background: theme?.heroGradient, borderColor: theme?.accentBorder }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em]" style={{ color: theme?.heroSubtext }}>Platform overview</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">Operational health at a glance</h2>
            <p className="mt-3 text-sm leading-6" style={{ color: theme?.heroSubtext }}>
              Track system workload, inbound activity, and approval queues without leaving the dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="Cases" value={caseTotal} theme={theme} />
            <HeroStat label="Users" value={userTotal} theme={theme} />
            <HeroStat label="Messages" value={msgTotal} theme={theme} />
            <HeroStat label="Posts" value={spotTotal} theme={theme} />
          </div>
        </div>
      </section>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard icon={FolderOpenIcon}   label="Total Cases"       value={s.totalCases      || 0} accent="indigo" />
        <KPICard icon={CheckCircleIcon}  label="Active Cases"      value={s.activeCases     || 0} accent="green"  />
        <KPICard icon={UsersIcon}        label="Total Users"       value={s.totalUsers      || 0} accent="purple" />
        <KPICard
          icon={EnvelopeIcon}
          label="Unread Messages"
          value={s.unreadMessages || 0}
          accent="sky"
          action="messages-all"
          onAction={onSectionChange}
        />
        <KPICard
          icon={LightBulbIcon}
          label="New Tips"
          value={s.newTips || 0}
          accent="rose"
          action="messages-tips"
          onAction={onSectionChange}
        />
        <KPICard
          icon={ClockIcon}
          label="Pending Requests"
          value={s.pendingRequests || 0}
          accent="amber"
          action="users-requests"
          onAction={onSectionChange}
        />
      </div>

      {/* ── Donut Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <SectionCard title="Case Status Breakdown" icon={FolderOpenIcon}>
          {caseTotal === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No cases yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {caseStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <DonutLabel cx="50%" cy="50%" total={caseTotal} label="total" />
                <Tooltip contentStyle={tipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Spotlight Content" icon={NewspaperIcon}>
          {spotTotal === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No spotlight posts yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={spotlightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {spotlightData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <DonutLabel cx="50%" cy="50%" total={spotTotal} label="posts" />
                <Tooltip contentStyle={tipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── Bar Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Message breakdown */}
        <SectionCard title="Message Breakdown" icon={EnvelopeIcon}>
          {msgTotal === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No messages received yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={msgBreakdown} barCategoryGap="40%" margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={tipStyle} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Bar dataKey="Read"   stackId="a" fill={C.indigo} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Unread" stackId="a" fill={C.rose}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* User types */}
        <SectionCard title="User Types" icon={UsersIcon}>
          {userTotal === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No users yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={userTypeData}
                layout="vertical"
                barCategoryGap="30%"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={120} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Users">
                  {userTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* ── Action Panel + Recent Cases ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick actions */}
        <SectionCard title="Action Items" icon={ExclamationTriangleIcon}>
          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircleIcon className="w-10 h-10 text-green-300 mb-2" />
              <p className="text-sm text-gray-500 font-medium">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending actions right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item, i) => {
                const accentBg = {
                  amber: 'bg-amber-50 border-amber-100',
                  rose:  'bg-rose-50  border-rose-100',
                  sky:   'bg-sky-50   border-sky-100',
                }[item.accent] || 'bg-gray-50 border-gray-100';
                const accentText = {
                  amber: 'text-amber-700',
                  rose:  'text-rose-700',
                  sky:   'text-sky-700',
                }[item.accent] || 'text-gray-700';
                const accentIcon = {
                  amber: 'text-amber-500',
                  rose:  'text-rose-500',
                  sky:   'text-sky-500',
                }[item.accent] || 'text-gray-500';
                return (
                  <button
                    key={i}
                    onClick={() => onSectionChange?.(item.action)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border ${accentBg} hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${accentIcon}`} />
                      <span className={`text-sm font-medium ${accentText}`}>{item.label}</span>
                    </div>
                    <ArrowRightIcon className={`w-3.5 h-3.5 ${accentIcon}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Summary stats at bottom */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800">{s.totalMessages || 0}</p>
              <p className="text-xs text-gray-400">Total messages</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{s.totalSpotlightPosts || 0}</p>
              <p className="text-xs text-gray-400">Posts published</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{s.scheduledPosts || 0}</p>
              <p className="text-xs text-gray-400">Posts scheduled</p>
            </div>
          </div>
        </SectionCard>

        {/* Recent cases */}
        <SectionCard title="Recent Cases" icon={FolderOpenIcon}>
          {recentCases.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No cases created yet.</p>
          ) : (
            <div className="space-y-2">
              {recentCases.map((c) => {
                const name = c.case_title ||
                  `${c.first_name || ''} ${c.last_name || ''}`.trim() ||
                  `Case #${c.id}`;
                const statusColor = c.is_disabled
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-green-100 text-green-700';
                const statusLabel = c.is_disabled ? 'Inactive' : 'Active';
                const created = c.created_at
                  ? new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : null;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => onSectionChange?.('cases-all')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <FolderOpenIcon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        {created && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <CalendarIcon className="w-3 h-3" /> {created}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
              {cases.length > 6 && (
                <button
                  onClick={() => onSectionChange?.('cases-all')}
                  className="w-full mt-1 text-xs text-indigo-500 hover:text-indigo-700 text-center py-2"
                >
                  View all {cases.length} cases →
                </button>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function HeroStat({ label, value, theme }) {
  return (
    <div className="rounded-2xl border px-4 py-3 backdrop-blur" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' }}>
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: theme?.heroSubtext }}>{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
