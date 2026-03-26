import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || '';

const CASE_STATUS_STYLES = {
  active:    'accent-gradient text-slate-800 font-semibold',
  solved:    'bg-green-500 hover:bg-green-600 text-white',
  cold_case: 'bg-blue-500 hover:bg-blue-600 text-white',
  closed:    'bg-slate-500 hover:bg-slate-600 text-white',
};

const CASE_STATUS_LABELS = {
  active: 'Active',
  solved: 'Solved',
  cold_case: 'Cold Case',
  closed: 'Closed',
};

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const SLOTS = 3; // Always show 3 card slots

function ComingSoonCard() {
  return (
    <Card className="floating-card bg-white/60 backdrop-blur-sm border border-dashed border-slate-300 shadow-sm overflow-hidden">
      <div className="relative">
        <div className="w-full h-64 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="h-5 w-40 bg-slate-100 rounded mb-2" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex items-center pt-2">
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function FeaturedCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/recent-cases/`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCases(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold gradient-text mb-4">
            Recent Cases
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Every case matters. Every family deserves answers. See how our community
            is making a difference.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {Array.from({ length: SLOTS }).map((_, i) => {
            const c = cases[i];

            if (loading) {
              // Skeleton pulse
              return (
                <Card key={i} className="floating-card bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-64 bg-slate-200" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-5 w-40 bg-slate-200 rounded" />
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </CardContent>
                </Card>
              );
            }

            if (!c) return <ComingSoonCard key={i} />;

            const statusLabel = CASE_STATUS_LABELS[c.case_status] || 'Active';
            const statusStyle = CASE_STATUS_STYLES[c.case_status] || CASE_STATUS_STYLES.active;
            const location = [c.city, c.state].filter(Boolean).join(', ');

            return (
              <a
                key={c.id}
                href={c.deployment_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="floating-card bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden h-full transition-shadow group-hover:shadow-xl">
                  <div className="relative">
                    {c.photo_url ? (
                      <img
                        src={c.photo_url}
                        alt={c.first_name}
                        className="w-full h-64 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-5xl font-bold text-slate-300">
                          {(c.first_name || '?').charAt(0)}{(c.last_name || '').charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className={statusStyle}>
                        {statusLabel}
                      </Badge>
                    </div>
                    {c.reward_amount && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                          Reward: ${Number(c.reward_amount).toLocaleString()}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {c.first_name} {c.last_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {location}
                          </div>
                        )}
                        {c.created_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {timeAgo(c.created_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {(c.tip_count || 0)} tip{c.tip_count !== 1 ? 's' : ''} received
                        </span>
                      </div>
                      {c.case_status === 'solved' && (
                        <span className="text-sm font-medium text-green-600">Case Closed ✓</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
