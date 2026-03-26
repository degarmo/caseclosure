/**
 * WorldVisitorMap.jsx
 *
 * Interactive visitor map with separate regional views.
 * Tabs: United States (state-level, clickable) | Europe | World | List
 *
 * No API key required.
 * - World/Europe: world-atlas@2 countries-110m.json (jsDelivr CDN)
 * - US States:    us-atlas@3 states-10m.json (jsDelivr CDN, Albers USA projection)
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
// US State FIPS → Name
// ─────────────────────────────────────────────────────────────────────────────
const STATE_FIPS = {
  '01':'Alabama','02':'Alaska','04':'Arizona','05':'Arkansas',
  '06':'California','08':'Colorado','09':'Connecticut','10':'Delaware',
  '11':'D.C.','12':'Florida','13':'Georgia','15':'Hawaii',
  '16':'Idaho','17':'Illinois','18':'Indiana','19':'Iowa',
  '20':'Kansas','21':'Kentucky','22':'Louisiana','23':'Maine',
  '24':'Maryland','25':'Massachusetts','26':'Michigan','27':'Minnesota',
  '28':'Mississippi','29':'Missouri','30':'Montana','31':'Nebraska',
  '32':'Nevada','33':'New Hampshire','34':'New Jersey','35':'New Mexico',
  '36':'New York','37':'North Carolina','38':'North Dakota','39':'Ohio',
  '40':'Oklahoma','41':'Oregon','42':'Pennsylvania','44':'Rhode Island',
  '45':'South Carolina','46':'South Dakota','47':'Tennessee','48':'Texas',
  '49':'Utah','50':'Vermont','51':'Virginia','53':'Washington',
  '54':'West Virginia','55':'Wisconsin','56':'Wyoming',
  '72':'Puerto Rico',
};

// Rough lat/lng bounding boxes per state FIPS (for city-to-state assignment)
const STATE_BOUNDS = {
  '01':{latMin:30.2,latMax:35.0,lngMin:-88.5,lngMax:-84.9},
  '02':{latMin:51.2,latMax:71.4,lngMin:-179.1,lngMax:-129.9},
  '04':{latMin:31.3,latMax:37.0,lngMin:-114.8,lngMax:-109.0},
  '05':{latMin:33.0,latMax:36.5,lngMin:-94.6,lngMax:-89.6},
  '06':{latMin:32.5,latMax:42.0,lngMin:-124.4,lngMax:-114.1},
  '08':{latMin:36.9,latMax:41.0,lngMin:-109.1,lngMax:-102.0},
  '09':{latMin:40.9,latMax:42.1,lngMin:-73.7,lngMax:-71.8},
  '10':{latMin:38.4,latMax:39.8,lngMin:-75.8,lngMax:-74.9},
  '11':{latMin:38.8,latMax:39.0,lngMin:-77.1,lngMax:-76.9},
  '12':{latMin:24.4,latMax:31.0,lngMin:-87.6,lngMax:-79.9},
  '13':{latMin:30.4,latMax:35.0,lngMin:-85.6,lngMax:-80.8},
  '15':{latMin:18.9,latMax:22.2,lngMin:-160.2,lngMax:-154.8},
  '16':{latMin:41.9,latMax:49.0,lngMin:-117.2,lngMax:-111.0},
  '17':{latMin:36.9,latMax:42.5,lngMin:-91.5,lngMax:-87.0},
  '18':{latMin:37.8,latMax:41.8,lngMin:-88.1,lngMax:-84.8},
  '19':{latMin:40.4,latMax:43.5,lngMin:-96.6,lngMax:-90.1},
  '20':{latMin:36.9,latMax:40.0,lngMin:-102.1,lngMax:-94.6},
  '21':{latMin:36.5,latMax:39.1,lngMin:-89.6,lngMax:-81.9},
  '22':{latMin:28.9,latMax:33.0,lngMin:-94.0,lngMax:-88.8},
  '23':{latMin:43.1,latMax:47.5,lngMin:-71.1,lngMax:-66.9},
  '24':{latMin:37.9,latMax:39.7,lngMin:-79.5,lngMax:-74.9},
  '25':{latMin:41.2,latMax:42.9,lngMin:-73.5,lngMax:-69.9},
  '26':{latMin:41.7,latMax:48.3,lngMin:-90.4,lngMax:-82.4},
  '27':{latMin:43.5,latMax:49.4,lngMin:-97.2,lngMax:-89.5},
  '28':{latMin:30.2,latMax:35.0,lngMin:-91.7,lngMax:-88.1},
  '29':{latMin:35.9,latMax:40.6,lngMin:-95.8,lngMax:-89.1},
  '30':{latMin:44.4,latMax:49.0,lngMin:-116.1,lngMax:-104.0},
  '31':{latMin:39.9,latMax:43.0,lngMin:-104.1,lngMax:-95.3},
  '32':{latMin:35.0,latMax:42.0,lngMin:-120.0,lngMax:-114.0},
  '33':{latMin:42.7,latMax:45.3,lngMin:-72.6,lngMax:-70.6},
  '34':{latMin:38.9,latMax:41.4,lngMin:-75.6,lngMax:-73.9},
  '35':{latMin:31.3,latMax:37.0,lngMin:-109.1,lngMax:-103.0},
  '36':{latMin:40.5,latMax:45.0,lngMin:-79.8,lngMax:-71.8},
  '37':{latMin:33.8,latMax:36.6,lngMin:-84.3,lngMax:-75.5},
  '38':{latMin:45.9,latMax:49.0,lngMin:-104.1,lngMax:-96.5},
  '39':{latMin:38.4,latMax:41.9,lngMin:-84.8,lngMax:-80.5},
  '40':{latMin:33.6,latMax:37.0,lngMin:-103.0,lngMax:-94.4},
  '41':{latMin:41.9,latMax:46.3,lngMin:-124.7,lngMax:-116.5},
  '42':{latMin:39.7,latMax:42.3,lngMin:-80.5,lngMax:-74.7},
  '44':{latMin:41.1,latMax:42.0,lngMin:-71.9,lngMax:-71.1},
  '45':{latMin:32.0,latMax:35.2,lngMin:-83.4,lngMax:-78.5},
  '46':{latMin:42.5,latMax:45.9,lngMin:-104.1,lngMax:-96.4},
  '47':{latMin:34.9,latMax:36.7,lngMin:-90.3,lngMax:-81.6},
  '48':{latMin:25.8,latMax:36.5,lngMin:-106.6,lngMax:-93.5},
  '49':{latMin:36.9,latMax:42.0,lngMin:-114.1,lngMax:-109.0},
  '50':{latMin:42.7,latMax:45.0,lngMin:-73.5,lngMax:-71.5},
  '51':{latMin:36.5,latMax:39.5,lngMin:-83.7,lngMax:-75.2},
  '53':{latMin:45.5,latMax:49.0,lngMin:-124.7,lngMax:-116.9},
  '54':{latMin:37.2,latMax:40.6,lngMin:-82.7,lngMax:-77.7},
  '55':{latMin:42.5,latMax:47.1,lngMin:-92.9,lngMax:-86.2},
  '56':{latMin:40.9,latMax:45.0,lngMin:-111.1,lngMax:-104.1},
};

// ─────────────────────────────────────────────────────────────────────────────
// Regional view definitions (for Europe & World tabs using world-atlas)
// ─────────────────────────────────────────────────────────────────────────────
const MAP_W = 960;
const MAP_H = 480;

const WORLD_REGIONS = {
  europe: {
    label: 'Europe', flag: '🇪🇺',
    viewBox: '407 45 200 115',
    lngMin: -28, lngMax: 52, latMin: 30, latMax: 74,
  },
  world: {
    label: 'World', flag: '🌍',
    viewBox: `0 0 ${MAP_W} ${MAP_H}`,
    lngMin: -180, lngMax: 180, latMin: -90, latMax: 90,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// World-atlas TopoJSON decoder (outputs geographic [lng, lat] coordinates)
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
// US-Atlas TopoJSON decoder (outputs Albers USA pixel coordinates directly)
// ─────────────────────────────────────────────────────────────────────────────
function decodeUSStates(topo) {
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

  return topo.objects.states.geometries.map(g => ({
    id: String(g.id).padStart(2, '0'),  // FIPS code with leading zero
    polygons: geomToPaths(g),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Projections
// ─────────────────────────────────────────────────────────────────────────────

// Equirectangular projection for world/europe world-atlas tabs
function project([lng, lat]) {
  return [
    ((lng + 180) / 360) * MAP_W,
    ((90 - lat) / 180) * MAP_H,
  ];
}

// Albers USA conic equal-area projection for city dots on US state map.
// Matches the lower-48 sub-projection used by us-atlas@3 states-10m.json.
// Standard parallels: 29.5°N and 45.5°N, centered at 96°W, 37.5°N.
// Scale 1300, translate [487.5, 305] → fits 975×610 viewport.
function albersUSA(lng, lat) {
  const toRad = d => d * Math.PI / 180;
  const phi1 = toRad(29.5), phi2 = toRad(45.5);
  const phi0 = toRad(37.5), lam0 = toRad(-96);
  const n    = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  const C    = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;

  const phi   = toRad(lat);
  const lam   = toRad(lng);
  const rho   = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(phi))) / n;
  const theta = n * (lam - lam0);

  const x = rho * Math.sin(theta);
  const y = rho0 - rho * Math.cos(theta);

  return [487.5 + 1300 * x, 305 - 1300 * y];
}

// ─────────────────────────────────────────────────────────────────────────────
// Path helpers
// ─────────────────────────────────────────────────────────────────────────────

// For world-atlas: applies equirectangular projection to [lng, lat] rings
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

// For us-atlas: coordinates are already in pixel space
function polygonsToPathDirect(polygons) {
  return polygons
    .map(poly =>
      poly.map(ring =>
        ring.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ') + 'Z'
      ).join(' ')
    ).join(' ');
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
  const [topoStates,    setTopoStates]    = useState(null);
  const [loadError,     setLoadError]     = useState(null);
  const [region,        setRegion]        = useState('us');
  const [hovered,       setHovered]       = useState(null);       // country a2
  const [hoveredState,  setHoveredState]  = useState(null);       // state FIPS
  const [selectedState, setSelectedState] = useState(null);       // state FIPS
  const [tooltip,       setTooltip]       = useState(null);
  const [sortBy,        setSortBy]        = useState('visitors');

  useEffect(() => {
    // World + Europe map data
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(topo => setTopoCountries(decodeTopo(topo)))
      .catch(() => setLoadError('Could not load map data.'));

    // US states map data
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(topo => setTopoStates(decodeUSStates(topo)))
      .catch(() => {}); // fail silently; US tab will show spinner
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
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

  // Cities that fall within the contiguous US (Alaska/Hawaii need separate sub-projections)
  const usCities = (geoData?.cities || []).filter(c =>
    c.lat && c.lng &&
    c.lat >= 24 && c.lat <= 50 &&
    c.lng >= -125 && c.lng <= -66
  );

  // Cities within a specific region for world/europe tabs
  const regionCities = (currentRegion) => (geoData?.cities || []).filter(c => {
    if (!c.lat || !c.lng || !currentRegion) return false;
    return (
      c.lng >= currentRegion.lngMin && c.lng <= currentRegion.lngMax &&
      c.lat >= currentRegion.latMin && c.lat <= currentRegion.latMax
    );
  });

  // Cities in selected state (using rough bounding box)
  const selectedStateBounds = selectedState ? STATE_BOUNDS[selectedState] : null;
  const selectedStateCities = selectedStateBounds
    ? (geoData?.cities || []).filter(c =>
        c.lat && c.lng &&
        c.lat >= selectedStateBounds.latMin && c.lat <= selectedStateBounds.latMax &&
        c.lng >= selectedStateBounds.lngMin && c.lng <= selectedStateBounds.lngMax
      )
    : [];

  // ── Mouse handlers ──────────────────────────────────────────────────────────
  const handleCountryMove = useCallback((e, country) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10, data: country });
  }, []);

  const handleStateMove = useCallback((e, state) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 10, data: state });
  }, []);

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'us',     label: '🇺🇸 United States' },
    { id: 'europe', label: '🇪🇺 Europe'         },
    { id: 'world',  label: '🌍 World'           },
    { id: 'list',   label: '☰ List'            },
  ];

  const isUSTab       = region === 'us';
  const isWorldEurope = region === 'europe' || region === 'world';
  const currentWorldRegion = WORLD_REGIONS[region];

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
              onClick={() => { setRegion(tab.id); setSelectedState(null); setTooltip(null); }}
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

      {/* ── US STATE MAP ──────────────────────────────────────────────────────── */}
      {isUSTab && (
        <div className="relative" style={{ background: '#0f172a' }}>
          {!topoStates ? (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm animate-pulse">
              Loading US map…
            </div>
          ) : (
            <>
              <svg
                viewBox="0 0 975 610"
                className="w-full"
                style={{ display: 'block', maxHeight: 380 }}
                onMouseLeave={() => { setHoveredState(null); setTooltip(null); }}
              >
                {/* Ocean / background */}
                <rect width={975} height={610} fill="#0f172a" />

                {/* State fills */}
                {topoStates.map(state => {
                  const d = polygonsToPathDirect(state.polygons);
                  if (!d) return null;
                  const isHov = hoveredState === state.id;
                  const isSel = selectedState === state.id;
                  let fill = '#1e3a5f';                          // default slate-blue
                  if (isSel) fill = '#2563eb';                   // selected: bright blue
                  else if (isHov) fill = '#f59e0b';              // hover: amber

                  return (
                    <path
                      key={state.id}
                      d={d}
                      fill={fill}
                      stroke="#334155"
                      strokeWidth="0.5"
                      style={{ cursor: 'pointer', transition: 'fill 0.12s' }}
                      onMouseEnter={() => setHoveredState(state.id)}
                      onMouseMove={e => handleStateMove(e, {
                        name: STATE_FIPS[state.id] || `State ${state.id}`,
                        fips: state.id,
                      })}
                      onMouseLeave={() => { setHoveredState(null); setTooltip(null); }}
                      onClick={() =>
                        setSelectedState(prev => prev === state.id ? null : state.id)
                      }
                    />
                  );
                })}

                {/* Pulsing city dots (contiguous US only, Albers USA projected) */}
                {usCities.map((city, i) => {
                  const [cx, cy] = albersUSA(city.lng, city.lat);
                  // Clamp to viewport
                  if (cx < 0 || cx > 975 || cy < 0 || cy > 610) return null;
                  const coreR = Math.max(2.5, Math.min(7, 1.5 + city.visitors * 0.4));
                  const ringR = Math.max(5,   Math.min(14, coreR * 2.2));
                  const color = city.suspicious > 0 ? '#ef4444' : '#facc15';
                  const delay = `${(i * 0.37) % 2}s`;
                  return (
                    <g key={i} style={{ pointerEvents: 'none' }}>
                      <circle cx={cx} cy={cy} r={ringR} fill={color} opacity={0}>
                        <animate attributeName="r"       values={`${coreR};${ringR * 1.6};${ringR * 1.6}`} dur="2s" begin={delay} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0;0"                                  dur="2s" begin={delay} repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r={coreR} fill={color} opacity={0.9} stroke="#0f172a" strokeWidth="0.6" />
                    </g>
                  );
                })}
              </svg>

              {/* State tooltip */}
              {tooltip?.data?.name && !tooltip.data.visitors && (
                <div
                  className="pointer-events-none absolute z-10 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs shadow-xl"
                  style={{ left: tooltip.x, top: tooltip.y }}
                >
                  <span className="font-semibold text-white">{tooltip.data.name}</span>
                  {selectedState === tooltip.data.fips && (
                    <span className="text-blue-400 ml-2">● selected</span>
                  )}
                </div>
              )}

              {/* Selected state panel */}
              {selectedState && (
                <div className="px-4 py-2.5 border-t border-slate-700 bg-slate-800/80 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                    <span className="text-white text-xs font-semibold">
                      {STATE_FIPS[selectedState] || selectedState}
                    </span>
                  </div>
                  {selectedStateCities.length > 0 ? (
                    <>
                      <span className="text-slate-400 text-xs">
                        {selectedStateCities.length} {selectedStateCities.length === 1 ? 'city' : 'cities'} with visitors
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-slate-300 text-xs font-mono">
                        {selectedStateCities.reduce((s, c) => s + (c.visitors || 0), 0).toLocaleString()} visitors
                      </span>
                      {selectedStateCities.some(c => c.suspicious > 0) && (
                        <>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-red-400 text-xs">
                            ⚠ {selectedStateCities.filter(c => c.suspicious > 0).length} suspicious
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs">No visitor data for this state</span>
                  )}
                  <button
                    onClick={() => setSelectedState(null)}
                    className="ml-auto text-slate-500 hover:text-slate-300 text-xs transition-colors"
                  >
                    ✕ clear
                  </button>
                </div>
              )}

              {/* Legend */}
              <div className={`px-4 py-2 flex items-center gap-3 text-[10px] text-slate-400 flex-wrap ${selectedState ? '' : 'border-t border-slate-700/50'}`}>
                <span className="text-slate-500">Click a state to select · Hover for name</span>
                <span className="ml-auto flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="relative inline-flex w-2.5 h-2.5">
                      <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-yellow-400 opacity-60" />
                      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    </span>
                    Visitors
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="relative inline-flex w-2.5 h-2.5">
                      <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-60" />
                      <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
                    </span>
                    Suspicious
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── WORLD / EUROPE MAP ────────────────────────────────────────────────── */}
      {isWorldEurope && (
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
                viewBox={currentWorldRegion.viewBox}
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
                      onMouseMove={e => handleCountryMove(e, {
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

                {/* Pulsing city dots */}
                {regionCities(currentWorldRegion).map((city, i) => {
                  const [cx, cy] = project([city.lng, city.lat]);
                  const isWorld = region === 'world';
                  const coreR  = Math.max(isWorld ? 1.5 : 2,   Math.min(isWorld ? 4   : 6,   1 + city.visitors * 0.4));
                  const ringR  = Math.max(isWorld ? 3   : 4.5, Math.min(isWorld ? 7   : 12,  coreR * 2.2));
                  const color  = city.suspicious > 0 ? '#ef4444' : '#facc15';
                  const delay  = `${(i * 0.37) % 2}s`;
                  return (
                    <g key={i} style={{ pointerEvents: 'none' }}>
                      <circle cx={cx} cy={cy} r={ringR} fill={color} opacity={0}>
                        <animate attributeName="r"       values={`${coreR};${ringR * 1.6};${ringR * 1.6}`} dur="2s" begin={delay} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.55;0;0"                                  dur="2s" begin={delay} repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r={coreR} fill={color} opacity={0.9} stroke="#0f172a" strokeWidth={isWorld ? '0.4' : '0.6'} />
                    </g>
                  );
                })}
              </svg>

              {/* Country tooltip */}
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
                  <span className="relative inline-flex w-2.5 h-2.5">
                    <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-yellow-400 opacity-60" />
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  </span>
                  City (live)
                </span>
                <span className="flex items-center gap-1">
                  <span className="relative inline-flex w-2.5 h-2.5">
                    <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-60" />
                    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
                  </span>
                  Suspicious
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
