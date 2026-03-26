/**
 * WorldVisitorMap.jsx
 *
 * Interactive visitor map with separate regional views.
 * Tabs: United States | Europe | World | List
 *
 * No API key required. Uses world-atlas topojson from jsDelivr CDN.
 * Regional views zoom into the same SVG via viewBox cropping.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ISO numeric → ISO alpha-2 lookup
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
  704:'VN',887:'YE',894:'ZM',716:'ZW',51:'AM',31:'AZ',
  112:'BY',70:'BA',232:'ER',233:'EE',268:'GE',417:'KG',428:'LV',
  440:'LT',807:'MK',498:'MD',499:'ME',688:'RS',703:'SK',705:'SI',
  44:'BS',48:'BH',52:'BB',84:'BZ',96:'BN',174:'KM',196:'CY',
  204:'BJ',212:'DM',222:'SV',226:'GQ',238:'FK',242:'FJ',270:'GM',
  296:'KI',308:'GD',316:'GU',328:'GY',344:'HK',352:'IS',384:'CI',
  438:'LI',450:'MG',454:'MW',458:'MY',462:'MV',466:'ML',470:'MT',
  478:'MR',480:'MU',492:'MC',512:'OM',520:'NR',540:'NC',548:'VU',
  570:'NU',583:'FM',584:'MH',585:'PW',624:'GW',626:'TL',634:'QA',
  638:'RE',659:'KN',662:'LC',670:'VC',674:'SM',678:'ST',690:'SC',
  702:'SG',732:'EH',740:'SR',748:'SZ',776:'TO',795:'TM',798:'TV',
  850:'VI',882:'WS',
};

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
  BE:'Belgium',CH:'Switzerland',AT:'Austria',IE:'Ireland',SK:'Slovakia',
  SI:'Slovenia',HR:'Croatia',RS:'Serbia',BA:'Bosnia',MK:'North Macedonia',
  AL:'Albania',ME:'Montenegro',BG:'Bulgaria',EE:'Estonia',LV:'Latvia',
  LT:'Lithuania',BY:'Belarus',MD:'Moldova',GE:'Georgia',AM:'Armenia',
  AZ:'Azerbaijan',
};

// ─────────────────────────────────────────────────────────────────────────────
// Regional view definitions
// viewBox: "x y width height" — crops the 960×480 world SVG
// ─────────────────────────────────────────────────────────────────────────────
const MAP_W = 960;
const MAP_H = 480;

const REGIONS = {
  us: {
    label: 'United States',
    flag: '🇺🇸',
    // lng -130..−60, lat 20..55  →  zoomed North America
    viewBox: '120 90 205 115',
    lngMin: -135, lngMax: -55, latMin: 17, latMax: 57,
  },
  europe: {
    label: 'Europe',
    flag: '🇪🇺',
    // lng -25..50, lat 33..72  →  zoomed Europe
    viewBox: '407 45 200 115',
    lngMin: -28, lngMax: 52, latMin: 30, latMax: 74,
  },
  world: {
    label: 'World',
    flag: '🌍',
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    lngMin: -180, lngMax: 180, latMin: -90, latMax: 90,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Minimal topojson decoder
// ─────────────────────────────────────────────────────────────────────────────
function decodeTopo(topo) {
  const { scale, translate } = topo.transform;
  const arcs = topo.arcs.map(arc => {
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
    if (geom.type === 'Polygon')
      return [geom.arcs.map(ring => ring.flatMap(arcCoords))];
    if (geom.type === 'MultiPolygon')
      return geom.arcs.map(poly => poly.map(ring => ring.flatMap(arcCoords)));
    return [];
  }

  return topo.objects.countries.geometries.map(g => ({
    id: String(g.id),
    alpha2: NUM_TO_A2[g.id] || null,
    polygons: geomToPaths(g),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Equirectangular projection
// ─────────────────────────────────────────────────────────────────────────────
function project([lng, lat]) {
  return [
    ((lng + 180) / 360) * MAP_W,
    ((90 - lat) / 180) * MAP_H,
  ];
}

function ringToPath(ring) {
  return ring.map((pt, i) => {
    const [x, y] = project(pt);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + 'Z';
}

function polygonsToD(polygons) {
  return polygons
    .map(poly => poly.map(ring => ringToPath(ring)).join(' '))
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour helpers
// ─────────────────────────────────────────────────────────────────────────────
function fillColor(vis, suspicious, hovered) {
  if (hovered) return '#f59e0b';
  if (!vis) return '#1e293b';
  const v = vis.visitors || 0;
  if (suspicious > 0 && v > 0) {
    return suspicious >= 3 ? '#ef4444' : '#f97316';
  }
  if (v >= 50)  return '#1e40af';
  if (v >= 20)  return '#2563eb';
  if (v >= 10)  return '#3b82f6';
  if (v >= 5)   return '#60a5fa';
  if (v >= 2)   return '#93c5fd';
  return '#bfdbfe';
}

function flagEmoji(code) {
  if (!code || code.length !== 2) return '🌐';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset) +
         String.fromCodePoint(code.charCodeAt(1) + offset);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function WorldVisitorMap({ geoData }) {
  const [topoCountries, setTopoCountries] = useState(null);
  const [loadError, setLoadError]         = useState(null);
  const [region, setRegion]               = useState('us');   // 'us' | 'europe' | 'world' | 'list'
  const [hovered, setHovered]             = useState(null);
  const [tooltip, setTooltip]             = useState(null);
  const [sortBy, setSortBy]               = useState('visitors');
  const svgRef = useRef(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(topo => setTopoCountries(decodeTopo(topo)))
      .catch(() => setLoadError('Could not load map data.'));
  }, []);

  const visitorMap = {};
  (geoData?.countries || []).forEach(c => { visitorMap[c.code] = c; });

  const listRows = (geoData?.countries || [])
    .map(c => ({
      code: c.code,
      name: COUNTRY_NAMES[c.code] || c.code,
      visitors: c.visitors || 0,
      events: c.events || 0,
      suspicious: c.suspicious || 0,
    }))
    .sort((a, b) =>
      sortBy === 'suspicious'
        ? b.suspicious - a.suspicious || b.visitors - a.visitors
        : b.visitors - a.visitors
    );

  const maxVisitors = listRows[0]?.visitors || 1;

  const handleMouseMove = useCallback((e, country) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10, data: country });
  }, []);

  const currentRegion = REGIONS[region];
  const isMapView = region !== 'list';

  // Filter cities to those within the current region's bounds
  const visibleCities = (geoData?.cities || []).filter(c => {
    if (!c.lat || !c.lng || !currentRegion) return false;
    return (
      c.lng >= currentRegion.lngMin && c.lng <= currentRegion.lngMax &&
      c.lat >= currentRegion.latMin && c.lat <= currentRegion.latMax
    );
  });

  const tabs = [
    { id: 'us',     label: '🇺🇸 United States' },
    { id: 'europe', label: '🇪🇺 Europe' },
    { id: 'world',  label: '🌍 World' },
    { id: 'list',   label: '☰ List' },
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Visitor Locations</h3>
          {listRows.length > 0 && (
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
              {listRows.length} {listRows.length === 1 ? 'country' : 'countries'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setRegion(tab.id)}
              className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                region === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP VIEW ─────────────────────────────────────────────────────────── */}
      {isMapView && (
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
                viewBox={currentRegion.viewBox}
                className="w-full"
                style={{ display: 'block', maxHeight: region === 'world' ? 400 : 380 }}
                onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              >
                {/* Ocean */}
                <rect width={MAP_W} height={MAP_H} fill="#1e293b" />

                {/* Countries */}
                {topoCountries.map(country => {
                  const a2 = country.alpha2;
                  const vis = a2 ? visitorMap[a2] : null;
                  const susp = vis?.suspicious || 0;
                  const d = polygonsToD(country.polygons);
                  if (!d) return null;
                  return (
                    <path
                      key={country.id}
                      d={d}
                      fill={fillColor(vis, susp, hovered === a2)}
                      stroke="#334155"
                      strokeWidth={region === 'world' ? '0.4' : '0.6'}
                      style={{ cursor: vis ? 'pointer' : 'default', transition: 'fill 0.15s' }}
                      onMouseEnter={() => setHovered(a2)}
                      onMouseMove={e => handleMouseMove(e, {
                        code: a2,
                        name: vis?.name || COUNTRY_NAMES[a2] || a2 || 'Unknown',
                        visitors: vis?.visitors || 0,
                        events: vis?.events || 0,
                        suspicious: susp,
                      })}
                      onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                    />
                  );
                })}

                {/* City dots */}
                {visibleCities.map((city, i) => {
                  const [cx, cy] = project([city.lng, city.lat]);
                  return (
                    <circle
                      key={i}
                      cx={cx} cy={cy}
                      r={Math.max(region === 'world' ? 1.5 : 2.5, Math.min(region === 'world' ? 5 : 8, 1 + city.visitors * 0.5))}
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
                    <div className="text-red-400 font-semibold mt-1">⚠ {tooltip.data.suspicious} suspicious</div>
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-slate-400 border-t border-slate-700/50 flex-wrap">
                {[
                  { color: '#bfdbfe', label: '1–4 visits' },
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

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {region === 'list' && (
        <div className="p-4">
          {listRows.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No geographic data yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                <span>Sort by:</span>
                {['visitors', 'suspicious'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2.5 py-1 rounded-full transition-colors capitalize ${
                      sortBy === s
                        ? s === 'suspicious' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {s === 'visitors' ? 'Visits' : 'Suspicious'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {listRows.map((row, i) => (
                  <div key={row.code} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-700/60 transition-colors">
                    <span className="text-slate-600 text-xs w-5 text-right shrink-0">{i + 1}</span>
                    <span className="text-base shrink-0">{flagEmoji(row.code)}</span>
                    <span className="text-slate-200 text-sm font-medium truncate flex-1">{row.name}</span>
                    <span className="text-slate-500 text-xs shrink-0">{row.code}</span>
                    <div className="flex items-center gap-2 w-40 shrink-0">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.suspicious > 0 ? 'bg-orange-400' : 'bg-blue-500'}`}
                          style={{ width: `${Math.round((row.visitors / maxVisitors) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-200 text-xs font-mono w-8 text-right">{row.visitors.toLocaleString()}</span>
                    </div>
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

              <div className="mt-3 pt-3 border-t border-slate-700 flex gap-6 text-xs text-slate-500">
                <span><span className="text-slate-300 font-semibold">{listRows.reduce((s, r) => s + r.visitors, 0).toLocaleString()}</span> total visitors</span>
                <span><span className="text-orange-300 font-semibold">{listRows.reduce((s, r) => s + r.suspicious, 0).toLocaleString()}</span> suspicious</span>
                <span><span className="text-slate-300 font-semibold">{listRows.length}</span> countries</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
