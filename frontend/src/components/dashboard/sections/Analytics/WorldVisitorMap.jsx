/**
 * WorldVisitorMap.jsx
 *
 * Interactive world map showing visitor locations.
 * - Map view: SVG choropleth (countries filled by visit intensity, red tint for suspicious)
 * - List view: sortable table with visit counts, suspicious flags, and a heat bar
 *
 * No API key required.  Uses world-atlas topojson from jsDelivr CDN.
 * Decodes topojson and projects coordinates entirely in-browser.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ISO numeric → ISO alpha-2 lookup  (covers all 249 UN-recognized territories)
// ─────────────────────────────────────────────────────────────────────────────
const NUM_TO_A2 = {
  4:'AF',8:'AL',12:'DZ',24:'AO',32:'AR',36:'AU',40:'AT',50:'BD',56:'BE',
  64:'BT',68:'BO',76:'BR',100:'BG',104:'MM',116:'KH',120:'CM',124:'CA',
  140:'CF',144:'LK',152:'CL',156:'CN',170:'CO',178:'CG',180:'CD',188:'CR',
  191:'HR',192:'CU',203:'CZ',208:'DK',214:'DO',218:'EC',818:'EG',231:'ET',
  246:'FI',250:'FR',266:'GA',276:'DE',288:'GH',300:'GR',320:'GT',324:'GN',
  332:'HT',340:'HN',348:'HU',356:'IN',360:'ID',364:'IR',368:'IQ',372:'IE',
  376:'IL',380:'IT',388:'JM',392:'JP',400:'JO',398:'KZ',404:'KE',
  408:'KP',410:'KR',414:'KW',418:'LA',422:'LB',430:'LR',434:'LY',
  442:'LU',484:'MX',496:'MN',504:'MA',508:'MZ',516:'NA',524:'NP',
  528:'NL',554:'NZ',558:'NI',562:'NE',566:'NG',578:'NO',586:'PK',
  591:'PA',598:'PG',600:'PY',604:'PE',608:'PH',616:'PL',620:'PT',
  630:'PR',642:'RO',643:'RU',646:'RW',682:'SA',686:'SN',694:'SL',
  706:'SO',710:'ZA',724:'ES',729:'SD',752:'SE',756:'CH',760:'SY',
  762:'TJ',764:'TH',768:'TG',780:'TT',788:'TN',792:'TR',800:'UG',
  804:'UA',784:'AE',826:'GB',840:'US',858:'UY',860:'UZ',862:'VE',
  704:'VN',887:'YE',894:'ZM',716:'ZW',32:'AR',51:'AM',31:'AZ',
  112:'BY',70:'BA',232:'ER',233:'EE',268:'GE',417:'KG',428:'LV',
  440:'LT',807:'MK',498:'MD',499:'ME',643:'RU',688:'RS',703:'SK',
  705:'SI',792:'TR',860:'UZ',887:'YE',
  // Additional entries
  44:'BS',48:'BH',52:'BB',84:'BZ',90:'SB',96:'BN',162:'CX',174:'KM',
  175:'YT',184:'CK',196:'CY',204:'BJ',212:'DM',222:'SV',226:'GQ',
  238:'FK',242:'FJ',270:'GM',292:'GI',296:'KI',308:'GD',312:'GP',
  316:'GU',328:'GY',334:'HM',336:'VA',344:'HK',352:'IS',
  384:'CI',438:'LI',450:'MG',454:'MW',458:'MY',462:'MV',466:'ML',
  470:'MT',474:'MQ',478:'MR',480:'MU',492:'MC',500:'MS',512:'OM',
  520:'NR',531:'CW',533:'AW',534:'SX',535:'BQ',540:'NC',548:'VU',
  570:'NU',574:'NF',580:'MP',581:'UM',583:'FM',584:'MH',585:'PW',
  612:'PN',624:'GW',626:'TL',634:'QA',638:'RE',654:'SH',659:'KN',
  660:'AI',662:'LC',666:'PM',670:'VC',674:'SM',678:'ST',690:'SC',
  702:'SG',732:'EH',740:'SR',744:'SJ',748:'SZ',776:'TO',795:'TM',
  796:'TC',798:'TV',831:'GG',832:'JE',833:'IM',850:'VI',876:'WF',
  882:'WS',
};

// Country name fallback (for tooltip when not in visitor data)
const COUNTRY_NAMES = {
  US:'United States',GB:'United Kingdom',DE:'Germany',FR:'France',CA:'Canada',
  AU:'Australia',JP:'Japan',CN:'China',IN:'India',BR:'Brazil',RU:'Russia',
  MX:'Mexico',IT:'Italy',ES:'Spain',KR:'South Korea',NL:'Netherlands',
  SE:'Sweden',NO:'Norway',FI:'Finland',DK:'Denmark',PL:'Poland',TR:'Turkey',
  ZA:'South Africa',NG:'Nigeria',EG:'Egypt',AR:'Argentina',CO:'Colombia',
  CL:'Chile',PE:'Peru',VE:'Venezuela',PH:'Philippines',ID:'Indonesia',
  TH:'Thailand',VN:'Vietnam',MY:'Malaysia',PK:'Pakistan',BD:'Bangladesh',
  IR:'Iran',IQ:'Iraq',SA:'Saudi Arabia',AE:'UAE',IL:'Israel',UA:'Ukraine',
  RO:'Romania',CZ:'Czech Republic',HU:'Hungary',PT:'Portugal',GR:'Greece',
  BE:'Belgium',CH:'Switzerland',AT:'Austria',
};

// ─────────────────────────────────────────────────────────────────────────────
// Minimal topojson decoder (no external library needed)
// ─────────────────────────────────────────────────────────────────────────────
function decodeTopo(topo) {
  const { scale, translate } = topo.transform;
  const rawArcs = topo.arcs;

  // Delta-decode each arc into lng/lat pairs
  const arcs = rawArcs.map(arc => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
  });

  function arcCoords(i) {
    const ring = arcs[i < 0 ? ~i : i];
    return i < 0 ? [...ring].reverse() : ring;
  }

  function geomToPaths(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') {
      return [geom.arcs.map(ring => ring.flatMap(arcCoords))];
    }
    if (geom.type === 'MultiPolygon') {
      return geom.arcs.map(poly => poly.map(ring => ring.flatMap(arcCoords)));
    }
    return [];
  }

  return topo.objects.countries.geometries.map(g => ({
    id: String(g.id),
    numericId: g.id,
    alpha2: NUM_TO_A2[g.id] || null,
    polygons: geomToPaths(g),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Equirectangular projection  (lng → x, lat → y)
// ─────────────────────────────────────────────────────────────────────────────
function project([lng, lat], W, H) {
  return [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];
}

function ringToPath(ring, W, H) {
  return ring.map((pt, i) => {
    const [x, y] = project(pt, W, H);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + 'Z';
}

function polygonsToD(polygons, W, H) {
  return polygons
    .map(poly => poly.map(ring => ringToPath(ring, W, H)).join(' '))
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Color scale
// ─────────────────────────────────────────────────────────────────────────────
function fillColor(visitors, suspicious, hovered) {
  if (hovered) return '#f59e0b'; // amber on hover
  if (!visitors) return '#e2e8f0'; // no data — slate-200
  const v = visitors.visitors || 0;
  if (suspicious > 0 && v > 0) {
    // Red tones for suspicious
    if (suspicious >= 3) return '#ef4444';
    return '#f97316';
  }
  // Blue scale
  if (v >= 50)  return '#1e40af';
  if (v >= 20)  return '#2563eb';
  if (v >= 10)  return '#3b82f6';
  if (v >= 5)   return '#60a5fa';
  if (v >= 2)   return '#93c5fd';
  return '#bfdbfe';
}

// ─────────────────────────────────────────────────────────────────────────────
// Country flag emoji from ISO-2 code
// ─────────────────────────────────────────────────────────────────────────────
function flagEmoji(code) {
  if (!code || code.length !== 2) return '🌐';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset) +
         String.fromCodePoint(code.charCodeAt(1) + offset);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const MAP_W = 960;
const MAP_H = 480;

export default function WorldVisitorMap({ geoData }) {
  const [topoCountries, setTopoCountries] = useState(null);
  const [loadError, setLoadError]         = useState(null);
  const [view, setView]                   = useState('map');    // 'map' | 'list'
  const [hovered, setHovered]             = useState(null);     // alpha2 code
  const [tooltip, setTooltip]             = useState(null);     // { x, y, data }
  const [sortBy, setSortBy]               = useState('visitors');
  const svgRef = useRef(null);

  // Load topojson from CDN once
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(topo => setTopoCountries(decodeTopo(topo)))
      .catch(() => setLoadError('Could not load world map data.'));
  }, []);

  // Build visitor lookup from backend data
  const visitorMap = {};
  (geoData?.countries || []).forEach(c => {
    visitorMap[c.code] = c;
  });

  // Merged list for the list view (only countries with visitors)
  const listRows = (geoData?.countries || [])
    .map(c => ({
      code: c.code,
      name: COUNTRY_NAMES[c.code] || c.code,
      visitors: c.visitors || 0,
      events: c.events || 0,
      suspicious: c.suspicious || 0,
      risk: c.risk_level || 'low',
    }))
    .sort((a, b) =>
      sortBy === 'suspicious'
        ? b.suspicious - a.suspicious || b.visitors - a.visitors
        : b.visitors - a.visitors
    );

  const maxVisitors = listRows[0]?.visitors || 1;

  // Tooltip handler
  const handleMouseMove = useCallback((e, country) => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    setTooltip({
      x: e.clientX - svgRect.left + 12,
      y: e.clientY - svgRect.top - 10,
      data: country,
    });
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <h3 className="text-white font-semibold text-sm">Visitor Locations</h3>
          {listRows.length > 0 && (
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {listRows.length} {listRows.length === 1 ? 'country' : 'countries'}
            </span>
          )}
        </div>
        {/* Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'map'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺 Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* ── MAP VIEW ───────────────────────────────────────────────────────── */}
      {view === 'map' && (
        <div className="relative" style={{ background: '#0f172a' }}>
          {loadError ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              {loadError}
            </div>
          ) : !topoCountries ? (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm animate-pulse">
              Loading map…
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="w-full"
                style={{ display: 'block', maxHeight: 420 }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              >
                {/* Ocean background */}
                <rect width={MAP_W} height={MAP_H} fill="#1e293b" />

                {/* Countries */}
                {topoCountries.map(country => {
                  const a2 = country.alpha2;
                  const vis = a2 ? visitorMap[a2] : null;
                  const susp = vis?.suspicious || 0;
                  const isHovered = hovered === a2;
                  const d = polygonsToD(country.polygons, MAP_W, MAP_H);
                  if (!d) return null;

                  return (
                    <path
                      key={country.id}
                      d={d}
                      fill={fillColor(vis, susp, isHovered)}
                      stroke="#334155"
                      strokeWidth="0.4"
                      style={{ cursor: vis ? 'pointer' : 'default', transition: 'fill 0.15s' }}
                      onMouseEnter={() => setHovered(a2)}
                      onMouseMove={e => handleMouseMove(e, {
                        code: a2,
                        name: (vis?.name) || COUNTRY_NAMES[a2] || a2 || 'Unknown',
                        visitors: vis?.visitors || 0,
                        events: vis?.events || 0,
                        suspicious: susp,
                        risk: vis?.risk_level || 'none',
                      })}
                      onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                    />
                  );
                })}

                {/* City dots */}
                {(geoData?.cities || []).filter(c => c.lat && c.lng).map((city, i) => {
                  const [cx, cy] = project([city.lng, city.lat], MAP_W, MAP_H);
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={Math.max(2, Math.min(6, 1 + city.visitors * 0.5))}
                      fill={city.suspicious > 0 ? '#ef4444' : '#facc15'}
                      opacity={0.85}
                      stroke="#0f172a"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>

              {/* Tooltip */}
              {tooltip?.data?.visitors > 0 && (
                <div
                  className="pointer-events-none absolute z-10 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl"
                  style={{ left: tooltip.x, top: tooltip.y, minWidth: 160 }}
                >
                  <div className="font-semibold text-white mb-1">
                    {flagEmoji(tooltip.data.code)} {tooltip.data.name}
                  </div>
                  <div className="text-slate-300">{tooltip.data.visitors.toLocaleString()} unique visitor{tooltip.data.visitors !== 1 ? 's' : ''}</div>
                  <div className="text-slate-400">{tooltip.data.events.toLocaleString()} total events</div>
                  {tooltip.data.suspicious > 0 && (
                    <div className="text-red-400 font-semibold mt-1">
                      ⚠ {tooltip.data.suspicious} suspicious
                    </div>
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-3 left-4 flex items-center gap-3 text-[10px] text-slate-400">
                {[
                  { color: '#bfdbfe', label: '1–4' },
                  { color: '#60a5fa', label: '5–9' },
                  { color: '#2563eb', label: '10–19' },
                  { color: '#1e40af', label: '20+' },
                  { color: '#f97316', label: 'Suspicious' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
                    {label}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  City
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="p-4">
          {listRows.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No geographic data yet.</p>
          ) : (
            <>
              {/* Sort controls */}
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                <span>Sort by:</span>
                <button
                  onClick={() => setSortBy('visitors')}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    sortBy === 'visitors'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  Visits
                </button>
                <button
                  onClick={() => setSortBy('suspicious')}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    sortBy === 'suspicious'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  Suspicious
                </button>
              </div>

              {/* Table */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {listRows.map((row, i) => (
                  <div
                    key={row.code}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-700/60 transition-colors group"
                  >
                    {/* Rank */}
                    <span className="text-slate-600 text-xs w-5 text-right shrink-0">
                      {i + 1}
                    </span>

                    {/* Flag + name */}
                    <span className="text-base shrink-0">{flagEmoji(row.code)}</span>
                    <span className="text-slate-200 text-sm font-medium truncate flex-1">
                      {row.name}
                    </span>
                    <span className="text-slate-500 text-xs shrink-0">{row.code}</span>

                    {/* Bar + count */}
                    <div className="flex items-center gap-2 w-40 shrink-0">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            row.suspicious > 0 ? 'bg-orange-400' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.round((row.visitors / maxVisitors) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-200 text-xs font-mono w-8 text-right">
                        {row.visitors.toLocaleString()}
                      </span>
                    </div>

                    {/* Suspicious badge */}
                    {row.suspicious > 0 ? (
                      <span className="bg-red-900/60 text-red-300 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0">
                        ⚠ {row.suspicious}
                      </span>
                    ) : (
                      <span className="w-10 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Summary footer */}
              <div className="mt-3 pt-3 border-t border-slate-700 flex gap-6 text-xs text-slate-500">
                <span>
                  <span className="text-slate-300 font-semibold">
                    {listRows.reduce((s, r) => s + r.visitors, 0).toLocaleString()}
                  </span>{' '}total visitors
                </span>
                <span>
                  <span className="text-orange-300 font-semibold">
                    {listRows.reduce((s, r) => s + r.suspicious, 0).toLocaleString()}
                  </span>{' '}suspicious
                </span>
                <span>
                  <span className="text-slate-300 font-semibold">{listRows.length}</span>{' '}countries
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
