import React, { useEffect, useState } from "react";
import { ArrowRight, Heart, Search, MapPin, Clock, Eye, MessageCircle } from "lucide-react";

import { getAPIBaseURL } from "../../api/config";

const API_BASE = getAPIBaseURL().replace(/\/+$/, '');  // strip trailing slash

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
  return `${months}mo ago`;
}

const CASE_TYPE_LABELS = {
  missing: 'Missing Person',
  homicide: 'Homicide',
  unidentified: 'Unidentified',
  cold_case: 'Cold Case',
  other: 'Other',
};

export default function HeroSection() {
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/public-stats/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {});

    fetch(`${API_BASE}/featured-case/`)
      .then(r => r.ok && r.status !== 204 ? r.json() : null)
      .then(data => { if (data) setFeatured(data); })
      .catch(() => {});
  }, []);

  const handleSignupClick = () => {
    window.location.href = "/signup";
  };

  const handleAboutClick = () => {
    window.location.href = "/about";
  };

  // Resolve photo URL — server may return it directly, or we check template_data client-side
  const featuredPhotoUrl = featured ? (() => {
    if (featured.photo_url) return featured.photo_url;
    // Fallback: check template_data customizations (Cloudinary URL)
    const custs = featured.template_data?.customizations;
    if (custs) {
      return custs.hero_image
        || custs.victimImage
        || custs.hero?.victimImage
        || custs.hero?.backgroundImage
        || custs.victim?.image
        || custs.images?.primary
        || null;
    }
    return null;
  })() : null;

  // Build display name
  const displayName = featured
    ? `${featured.first_name}${featured.last_name ? ' ' + featured.last_name.charAt(0) + '.' : ''}`
    : null;

  // Build subtitle (e.g. "Missing since Jan 2023" or "Homicide · Dallas, TX")
  const subtitle = featured ? (() => {
    const parts = [];
    if (featured.case_type === 'missing' && featured.date_missing) {
      const d = new Date(featured.date_missing);
      parts.push(`Missing since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
    } else {
      parts.push(featured.case_type_display || CASE_TYPE_LABELS[featured.case_type] || 'Active Case');
    }
    const loc = [featured.city, featured.state].filter(Boolean).join(', ');
    if (loc) parts.push(loc);
    return parts.join(' · ');
  })() : null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-orange-100/20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="gradient-text">Every Story</span>
                <br />
                <span className="text-slate-800">Deserves Justice</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg">
                Create a dedicated space for your loved one's case. Connect with your community.
                Turn tips into breakthroughs. Never give up hope.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSignupClick}
                className="accent-gradient text-slate-800 hover:shadow-lg transition-all duration-300 rounded-full px-8 py-4 text-lg font-semibold inline-flex items-center justify-center group cursor-pointer"
              >
                Start a Case Page
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleAboutClick}
                className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-full px-8 py-4 text-lg inline-flex items-center justify-center transition-all duration-300 cursor-pointer"
              >
                Learn How It Works
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {stats ? stats.total_cases.toLocaleString() : '—'}
                </div>
                <div className="text-sm text-slate-500">
                  {stats?.total_cases === 1 ? 'Case Created' : 'Cases Created'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">
                  {stats ? stats.solved_cases.toLocaleString() : '—'}
                </div>
                <div className="text-sm text-slate-500">
                  {stats?.solved_cases === 1 ? 'Case Solved' : 'Cases Solved'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-slate-500">Community Support</div>
              </div>
            </div>
          </div>

          {/* ── Featured Case Card ────────────────────────────────────── */}
          <div className="relative">
            <div className="floating-card bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
              {featured ? (
                <a
                  href={featured.deployment_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block space-y-5 group"
                >
                  {/* Header: name + badge */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <Heart className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {featured.case_title || `${displayName}'s Story`}
                      </div>
                      <div className="text-sm text-slate-500 truncate">{subtitle}</div>
                    </div>
                  </div>

                  {/* Photo */}
                  {featuredPhotoUrl ? (
                    <img
                      src={featuredPhotoUrl}
                      alt={featured.first_name}
                      className="w-full h-64 object-cover object-top rounded-2xl group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(featured.visitor_count || 0).toLocaleString()} visitor{featured.visitor_count !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {(featured.tip_count || 0).toLocaleString()} tip{featured.tip_count !== 1 ? 's' : ''}
                    </span>
                    {(featured.city || featured.state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {[featured.city, featured.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    {featured.latest_tip_at ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Last tip: {timeAgo(featured.latest_tip_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">No tips yet — be the first</span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                      <span className="text-xs text-slate-400">Active investigation</span>
                    </div>
                  </div>

                  {/* Needs exposure label */}
                  <div className="text-center">
                    <span className="text-[10px] uppercase tracking-wider text-orange-500 font-semibold">
                      This case needs more exposure
                    </span>
                  </div>
                </a>
              ) : (
                /* Fallback while loading or if no featured case */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Featured Case</div>
                      <div className="text-sm text-slate-500">Helping families find answers</div>
                    </div>
                  </div>
                  <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Search className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Cases will appear here once published</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute -top-4 -right-4 w-24 h-24 accent-gradient rounded-full opacity-20 blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-slate-200 rounded-full opacity-30 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
