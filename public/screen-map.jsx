// screen-map.jsx — Module Localisation : centres de santé + suivi GPS temps réel

const SAN_PEDRO = { lat: 4.7485, lng: -6.6363 };
const FILTERS = [
  { id: 'all',        label: 'Tous' },
  { id: 'hopital',    label: 'Hôpitaux' },
  { id: 'clinique',   label: 'Cliniques' },
  { id: 'dispensaire',label: 'Dispensaires' },
  { id: '24h',        label: '24h/24' },
];

const TYPE_ICON  = { hopital: 'building-2', clinique: 'stethoscope', maternite: 'baby', dispensaire: 'pill', public: 'heart-handshake' };
const TYPE_COLOR = { hopital: 'var(--sm-red)', clinique: 'var(--sm-blue)', maternite: '#D81B60', dispensaire: '#E67E22', public: '#27AE60' };
const TYPE_BG    = { hopital: 'var(--sm-red-soft)', clinique: 'var(--sm-blue-soft)', maternite: '#FCE4EC', dispensaire: '#FEF5EC', public: '#EAFAF1' };

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km) {
  return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km';
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ padding: '16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: '#F1F2F4', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#F1F2F4', borderRadius: 4, marginBottom: 8, width: '75%' }} />
          <div style={{ height: 12, background: '#F1F2F4', borderRadius: 4, width: '40%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, height: 36, background: '#F1F2F4', borderRadius: 10 }} />
        <div style={{ flex: 1, height: 36, background: '#F1F2F4', borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
function MapScreen({ nav }) {
  useLucide();

  const [centers, setCenters]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [userPos, setUserPos]   = useState(null);   // { lat, lng, accuracy }
  const [gpsError, setGpsError] = useState(null);   // null | 'denied' | 'unavailable'
  const [filter, setFilter]     = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const mapDivRef        = useRef(null);
  const mapRef           = useRef(null);
  const userMarkerRef    = useRef(null);
  const accuracyCircleRef= useRef(null);
  const centerMarkersRef = useRef({});
  const watchIdRef       = useRef(null);

  // ── Init carte Leaflet ──────────────────────────────────────────────────
  useEffect(() => {
    const L = window.L;
    if (!L || !mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView([SAN_PEDRO.lat, SAN_PEDRO.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Bouton zoom personnalisé
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current        = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
      centerMarkersRef.current  = {};
    };
  }, []);

  // ── Marqueurs centres (mis à jour quand la liste arrive) ────────────────
  useEffect(() => {
    const L   = window.L;
    const map = mapRef.current;
    if (!L || !map || centers.length === 0) return;

    centers.forEach(c => {
      if (centerMarkersRef.current[c.id]) return;
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#E74C3C;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup(`<b style="font-family:sans-serif;font-size:13px">${c.name}</b>`);
      centerMarkersRef.current[c.id] = marker;
    });
  }, [centers]);

  // ── GPS watchPosition ───────────────────────────────────────────────────
  const startGps = () => {
    if (!navigator.geolocation) { setGpsError('unavailable'); return; }

    const id = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setUserPos({ lat, lng, accuracy });
        setGpsError(null);

        const L   = window.L;
        const map = mapRef.current;
        if (!L || !map) return;

        if (!userMarkerRef.current) {
          const icon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#1565C0;border:3px solid white;box-shadow:0 2px 8px rgba(21,101,192,0.5)"></div>',
            iconSize: [16, 16], iconAnchor: [8, 8],
          });
          userMarkerRef.current     = L.marker([lat, lng], { icon }).addTo(map).bindPopup('📍 Ma position');
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: accuracy, color: '#1565C0', fillColor: '#1565C0', fillOpacity: 0.08, weight: 1.5,
          }).addTo(map);
        } else {
          userMarkerRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setLatLng([lat, lng]).setRadius(accuracy);
        }
      },
      err => setGpsError(err.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    watchIdRef.current = id;
  };

  useEffect(() => {
    startGps();
    return () => {
      if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    };
  }, []);

  const retryGps = () => {
    setGpsError(null);
    if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    startGps();
  };

  // ── Chargement des centres depuis l'API ─────────────────────────────────
  useEffect(() => {
    const loc = userPos;
    window.API.healthCenters(loc?.lat, loc?.lng)
      .then(setCenters)
      .catch(() => setCenters([]))
      .finally(() => setLoading(false));
  }, []); // fetch une fois au montage ; le tri dynamique est fait en JS

  // ── Centrer la carte sur un centre ─────────────────────────────────────
  const selectCenter = c => {
    setSelectedId(c.id);
    const map    = mapRef.current;
    const marker = centerMarkersRef.current[c.id];
    if (map && marker) { map.setView([c.lat, c.lng], 16); marker.openPopup(); }
  };

  // ── Recentrer sur l'utilisateur ─────────────────────────────────────────
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userPos) map.setView([userPos.lat, userPos.lng], 16);
    else map.setView([SAN_PEDRO.lat, SAN_PEDRO.lng], 15);
  };

  // ── Filtrage + tri par distance ─────────────────────────────────────────
  const filtered = centers.filter(c => {
    if (filter === 'all') return true;
    if (filter === '24h') return c.available24h;
    return c.type === filter;
  });

  const sorted = userPos
    ? [...filtered].sort((a, b) =>
        haversineKm(userPos.lat, userPos.lng, a.lat, a.lng) -
        haversineKm(userPos.lat, userPos.lng, b.lat, b.lng)
      )
    : filtered;

  // ════════════════════════════════════════════════════════════════════════
  // RENDU
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--sm-line)',
        background: 'linear-gradient(180deg, #f8f9fa, white)',
        flexShrink: 0,
      }}>
        <button onClick={() => goBack(nav)} style={{ background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
        </button>
        <h1 className="sm-serif" style={{ fontSize: 20, flex: 1 }}>Centres de santé proches</h1>
        {/* Indicateur GPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: userPos ? '#27AE60' : (gpsError ? '#E74C3C' : '#F59E0B') }} />
          <span style={{ fontSize: 11, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
            {userPos ? 'GPS actif' : gpsError ? 'GPS indisponible' : 'Localisation…'}
          </span>
        </div>
      </div>

      {/* ── Corps scrollable ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Bandeau erreur GPS */}
        {gpsError && (
          <div style={{
            margin: '12px 16px 0', padding: '14px 16px',
            borderRadius: 'var(--sm-radius)', background: '#FFFBEB',
            border: '1px solid #FCD34D', display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <Icon name="alert-circle" size={20} color="#D97706" strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#92400E', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                {gpsError === 'denied' ? 'Accès GPS refusé' : 'GPS indisponible'}
              </div>
              <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5, marginBottom: 10 }}>
                Activez votre position pour voir les centres les plus proches
              </div>
              <button
                onClick={retryGps}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: '#D97706', color: 'white', border: 'none',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* ── Carte Leaflet ─────────────────────────────────────────────── */}
        <div style={{ margin: '12px 16px 0', position: 'relative' }}>
          <div style={{ borderRadius: 'var(--sm-radius)', overflow: 'hidden', boxShadow: 'var(--sm-shadow)', height: 250 }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
          </div>
          {/* Bouton recentrer */}
          <button
            onClick={recenter}
            title="Recentrer sur ma position"
            style={{
              position: 'absolute', bottom: 12, right: 12, zIndex: 500,
              width: 40, height: 40, borderRadius: '50%',
              background: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="crosshair" size={20} color="var(--sm-blue)" />
          </button>
        </div>

        {/* ── Filtres ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 16px 6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: filter === f.id ? 'var(--sm-blue)' : '#F1F2F4',
                color: filter === f.id ? 'white' : 'var(--sm-ink)',
                fontSize: 13, fontWeight: filter === f.id ? 600 : 400,
                fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <div style={{ padding: '6px 16px 10px', fontSize: 13, color: 'var(--sm-ink-500)', fontFamily: 'var(--font-ui)' }}>
          {loading
            ? 'Chargement des centres…'
            : `${sorted.length} établissement${sorted.length !== 1 ? 's' : ''} trouvé${sorted.length !== 1 ? 's' : ''}`}
        </div>

        {/* ── Liste ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Skeletons */}
          {loading && [0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}

          {/* Cartes réelles */}
          {!loading && sorted.map(c => {
            const dist = userPos
              ? haversineKm(userPos.lat, userPos.lng, c.lat, c.lng)
              : (c.distanceKm ?? null);
            const isSelected = selectedId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => selectCenter(c)}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--sm-radius)',
                  background: 'white',
                  boxShadow: isSelected
                    ? '0 0 0 2px var(--sm-blue), var(--sm-shadow)'
                    : 'var(--sm-shadow)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Ligne principale */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: TYPE_BG[c.type] || '#F1F2F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={TYPE_ICON[c.type] || 'map-pin'}
                      size={22}
                      color={TYPE_COLOR[c.type] || 'var(--sm-ink)'}
                      strokeWidth={1.9}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--sm-ink)',
                      fontFamily: 'var(--font-ui)', lineHeight: 1.35, marginBottom: 5,
                    }}>
                      {c.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {dist != null ? (
                        <span style={{ fontSize: 13, color: 'var(--sm-blue)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                          📍 {formatDist(dist)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--sm-ink-400)' }}>Distance indisponible</span>
                      )}
                      {c.available24h && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: '#27AE60',
                          background: '#EAFAF1', borderRadius: 999, padding: '2px 9px',
                          fontFamily: 'var(--font-ui)',
                        }}>24h/24</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={'tel:' + c.phone.replace(/[\s ]/g, '')}
                    onClick={e => e.stopPropagation()}
                    style={{ textDecoration: 'none', flex: 1 }}
                  >
                    <button style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      background: 'var(--sm-blue-soft)', color: 'var(--sm-blue)',
                      border: 'none', fontSize: 13, fontWeight: 600,
                      fontFamily: 'var(--font-ui)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      cursor: 'pointer',
                    }}>
                      <Icon name="phone" size={15} color="var(--sm-blue)" />
                      Appeler
                    </button>
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ textDecoration: 'none', flex: 1 }}
                  >
                    <button style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10,
                      background: '#F1F2F4', color: 'var(--sm-ink)',
                      border: 'none', fontSize: 13, fontWeight: 600,
                      fontFamily: 'var(--font-ui)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      cursor: 'pointer',
                    }}>
                      <Icon name="navigation" size={15} color="var(--sm-ink)" />
                      Itinéraire
                    </button>
                  </a>
                </div>
              </div>
            );
          })}

          {/* Aucun résultat */}
          {!loading && sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sm-ink-500)', fontSize: 14, fontFamily: 'var(--font-ui)' }}>
              Aucun établissement pour ce filtre
            </div>
          )}
        </div>
      </div>

      {/* ── Barre de navigation ──────────────────────────────────────────── */}
      <HomeTabBar active="map" nav={nav} />
    </div>
  );
}

Object.assign(window, { MapScreen });
