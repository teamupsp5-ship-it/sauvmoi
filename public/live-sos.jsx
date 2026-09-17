// live-sos.jsx — Module SOS vivant (GPS réel, Leaflet, WhatsApp, hasAccount)
// Surcharge SOSCountdown et SOSConfirm de screen-sos.jsx

// ── URL WhatsApp géolocalisé ──────────────────────────────────────────────────
// lat/lng peuvent être null (GPS indisponible au moment de l'alerte) — le
// message ne doit alors jamais prétendre à une position qui n'existe pas.
function buildWaUrl(phone, userName, lat, lng, lang) {
  const clean = phone.replace(/^\+/, '').replace(/\s/g, '');
  const isEn = lang === 'en';
  const now = new Date().toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
  const hasLocation = lat != null && lng != null;
  const locationLine = hasLocation
    ? (isEn ? `Location: https://maps.google.com/?q=${lat},${lng}` : `Position : https://maps.google.com/?q=${lat},${lng}`)
    : (isEn ? 'Location: unavailable (GPS could not be acquired).' : "Position : indisponible (le GPS n'a pas pu être obtenu).");
  const msg = isEn
    ? `🚨 EMERGENCY ALERT - Sauv'Moi\n${userName} has triggered an SOS alert.\n${locationLine}\nTime: ${now}`
    : `🚨 ALERTE URGENCE - Sauv'Moi\n${userName} a déclenché une alerte SOS.\n${locationLine}\nHeure : ${now}`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

// ── Numéros d'urgence directs — recours immédiat, indépendant de l'app.
// Factorisé pour être réutilisé à la fois par l'état de veille et par
// l'état d'échec d'envoi (voir phase 'error' ci-dessous).
function EmergencyQuickNumbers({ t }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: t('sos.samu'),        number: '185', icon: 'ambulance', color: 'var(--sm-red)',  bg: 'var(--sm-red-soft)' },
        { label: t('sos.firefighters'),number: '180', icon: 'flame',     color: '#E67E22',        bg: '#FEF5EC' },
        { label: t('sos.police'),      number: '110', icon: 'shield',    color: 'var(--sm-blue)', bg: 'var(--sm-blue-soft)' },
      ].map(item => (
        <a key={item.number} href={'tel:' + item.number} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="sm-icon-tile" style={{ background: item.bg }}>
              <Icon name={item.icon} size={22} color={item.color} strokeWidth={1.9} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{item.label}</div>
              <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>{t('sos.direct_call')} · {item.number}</div>
            </div>
            <div className="sm-icon-circle" style={{ background: item.bg }}>
              <Icon name="phone" size={16} color={item.color} strokeWidth={2} />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── 4a · Compte à rebours + état idle ─────────────────────────────────────────
function SOSCountdown({ nav }) {
  useLucide();
  const t = useTranslation();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'counting' | 'fired' | 'error'
  const [count, setCount] = useState(5);
  // null tant qu'aucune position réelle n'a été mesurée — jamais de
  // coordonnées par défaut (voir Décisions techniques / correctif SOS) :
  // un défaut silencieux a exactement la même forme qu'une vraie position
  // GPS, donc rien ne permettrait de le distinguer une fois parti vers les
  // secours/contacts.
  const gpsRef = useRef(null);

  const handleStart = () => {
    setPhase('counting');
    setCount(5);
    gpsRef.current = null;
    if (!navigator.geolocation) {
      // API absente (contexte non sécurisé, vieux navigateur…) : pas de
      // position, l'alerte partira quand même sans coordonnées (voir plus
      // bas) — jamais de callback vide qui masquerait ce cas.
      return;
    }
    // GPS démarre ici, résultat disponible pendant les 5s (marge de
    // 500ms sous le timeout d'attente pour laisser le temps au dernier
    // rendu de refléter l'état final avant l'envoi).
    navigator.geolocation.getCurrentPosition(
      p => { gpsRef.current = { lat: p.coords.latitude, lng: p.coords.longitude, label: 'Position GPS' }; },
      () => { gpsRef.current = null; }, // refus, timeout, position indisponible… : reste sans position, jamais de repli silencieux
      { timeout: 4500, enableHighAccuracy: true }
    );
  };

  const handleCancel = () => { setPhase('idle'); setCount(5); };

  // Nouvel essai après échec d'envoi : relance tout le cycle (nouvelle
  // tentative GPS incluse, au cas où l'échec précédent était un timeout
  // ponctuel) plutôt qu'un renvoi instantané des dernières coordonnées,
  // potentiellement obsolètes.
  const handleRetry = () => handleStart();

  useEffect(() => {
    if (phase !== 'counting') return;
    if (count <= 0) {
      setPhase('fired');
      const loc = gpsRef.current
        ? { lat: gpsRef.current.lat, lng: gpsRef.current.lng, label: gpsRef.current.label }
        : {}; // aucune position mesurée — n'envoie ni lat ni lng, jamais de valeur fabriquée
      window.API.sosTrigger(loc)
        .then(a => {
          window.SM.sos = { alertId: a.alertId, contacts: a.contacts || [], lat: a.lat ?? null, lng: a.lng ?? null };
          window.SM.emit();
          setTimeout(() => nav.replace('sos_confirm'), 200);
        })
        .catch(e => {
          console.warn('[SOS] trigger échoué:', e.message);
          // Ne retombe jamais silencieusement sur l'état de veille — l'écran
          // d'échec explicite (phase 'error') reste affiché tant que
          // l'utilisateur n'a pas explicitement choisi de réessayer.
          setPhase('error');
        });
      return;
    }
    navigator.vibrate?.(200);
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, count]);

  // ── État idle ─────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--sm-line)', background: 'linear-gradient(180deg, #f8f9fa, white)', flexShrink: 0 }}>
          <button onClick={() => goBack(nav)} style={{ background: 'none', border: 'none', padding: '4px', margin: '-4px', cursor: 'pointer' }}>
            <Icon name="arrow-left" size={22} color="var(--sm-ink)" />
          </button>
          <h1 className="sm-serif" style={{ fontSize: 20, flex: 1 }}>{t('sos.title')}</h1>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 32px' }}>
          {/* Grand bouton SOS pulsant */}
          <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(231,76,60,0.1)', animation: 'sos-ring 2.2s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 164, height: 164, borderRadius: '50%', background: 'rgba(231,76,60,0.16)', animation: 'sos-ring 2.2s ease-out infinite', animationDelay: '0.7s' }} />
            <button
              onClick={handleStart}
              style={{
                position: 'relative', zIndex: 1,
                width: 140, height: 140, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E74C3C, #C0392B)',
                border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(192,57,43,0.45)',
                transition: 'transform 0.1s ease',
              }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon name="siren" size={42} color="white" strokeWidth={2} />
              <span style={{ fontSize: 20, fontWeight: 700, marginTop: 6, fontFamily: 'var(--font-ui)', letterSpacing: '0.06em', color: 'white' }}>SOS</span>
            </button>
          </div>

          <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', marginBottom: 40 }}>
            {t('sos.press_in_emergency')}
          </p>

          <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 14, width: '100%' }}>{t('sos.emergency_numbers')}</h3>
          {/* Même structure que la carte QR de l'accueil : icône dans un
              carré pastel (sm-icon-tile) + indicateur d'action dans un
              cercle pastel à droite (sm-icon-circle) — pas d'aplat rouge
              plein ici, réservé au bouton SOS principal ci-dessus. */}
          <EmergencyQuickNumbers t={t} />
        </div>
        <FloatingChatButton nav={nav} />
        <HomeTabBar active="sos" nav={nav} />
      </div>
    );
  }

  // ── État d'échec d'envoi ──────────────────────────────────────────────────
  // Jamais un retour silencieux à l'état de veille (voir handleStart/handleRetry
  // ci-dessus) : l'utilisateur doit voir explicitement que rien n'est parti,
  // avec un recours immédiat (numéros d'urgence directs) et un nouvel essai.
  if (phase === 'error') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '40px 24px 32px', gap: 20 }}>
          <Banner
            variant="danger"
            icon="alert-circle"
            title={t('sos.trigger_failed_title')}
            text={t('sos.trigger_failed_text')}
            stacked
          />
          <button
            onClick={handleRetry}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 'var(--sm-radius)', border: 'none',
              background: 'linear-gradient(135deg, #E74C3C, #C0392B)', color: 'white',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
              cursor: 'pointer', letterSpacing: '0.04em',
              boxShadow: '0 4px 16px rgba(192,57,43,0.3)',
            }}
          >
            {t('common.retry')}
          </button>
          <div>
            <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 14 }}>{t('sos.emergency_numbers')}</h3>
            <EmergencyQuickNumbers t={t} />
          </div>
        </div>
        <HomeTabBar active="sos" nav={nav} />
      </div>
    );
  }

  // ── Compte à rebours (phase 'counting' ou 'fired') ────────────────────────
  const gpsMissing = phase === 'fired' && !gpsRef.current;
  const R = 90, C = 2 * Math.PI * R;
  const dashoffset = C * (count / 5);

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', marginBottom: gpsMissing ? 16 : 40, textAlign: 'center' }}>
        {phase === 'fired' ? t('sos.alert_sent') : t('sos.sending_alert')}
      </p>
      {/* Aucune position mesurée au moment de l'envoi — visible avant/pendant
          l'envoi plutôt que de laisser croire qu'une position a été jointe. */}
      {gpsMissing && (
        <Banner
          variant="warning"
          icon="alert-circle"
          title={t('sos.gps_unavailable_title')}
          text={t('sos.gps_unavailable_text')}
          stacked
          style={{ width: '100%', maxWidth: 340, marginBottom: 24 }}
        />
      )}
      {/* Fond disque + ombre douce (var(--sm-shadow-md), échelle du design
          system) derrière l'anneau de progression, plutôt qu'un SVG nu sur
          fond plat. */}
      <div style={{
        position: 'relative', width: 220, height: 220, marginBottom: 48,
        borderRadius: '50%', background: 'var(--sm-paper)', boxShadow: 'var(--sm-shadow-md)',
      }}>
        <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={110} cy={110} r={R} fill="var(--sm-red-soft)" stroke="rgba(192,57,43,0.12)" strokeWidth="2" />
          <circle cx={110} cy={110} r={R} fill="none" stroke="var(--sm-red)" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 980ms linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: 'var(--sm-red)', fontFamily: 'var(--font-ui)', lineHeight: 1 }}>{Math.max(0, count)}</span>
          <span style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 6 }}>{t('sos.seconds')}</span>
        </div>
      </div>
      {phase === 'counting' && (
        <button
          onClick={handleCancel}
          style={{
            width: '100%', maxWidth: 340, padding: '16px',
            borderRadius: 'var(--sm-radius)', border: '2px solid var(--sm-red)',
            background: 'white', color: 'var(--sm-red)',
            fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(192,57,43,0.12)',
          }}
        >
          {t('sos.cancel')}
        </button>
      )}
    </div>
  );
}

// ── 4b · Confirmation avec carte Leaflet réelle ────────────────────────────────
function SOSConfirm({ nav }) {
  useLucide();
  const t = useTranslation();
  const lang = useLang();
  const sos = window.SM?.sos || {};
  // Jamais de coordonnées par défaut ici non plus : null veut dire "le GPS
  // était indisponible au moment de l'alerte", à afficher explicitement
  // plutôt que de centrer une carte sur une position fabriquée.
  const lat = sos.lat ?? null;
  const lng = sos.lng ?? null;
  const hasLocation = lat != null && lng != null;
  const contacts = sos.contacts || [];
  const user = window.SM?.user;
  const prenom = (user?.prenom || user?.name?.split(' ')[0] || t('sos.you_fallback')).trim();

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Carte Leaflet — montée une seule fois, uniquement si une position réelle existe
  useEffect(() => {
    const L = window.L;
    if (!hasLocation || !L || !mapDivRef.current || mapInstanceRef.current) return;

    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const icon = L.divIcon({
      className: '',
      html: '<div style="width:22px;height:22px;border-radius:50%;background:#C0392B;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(t('sos.position_of').replace('{name}', prenom))
      .openPopup();

    mapInstanceRef.current = map;
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  const handleCancel = () => {
    if (sos.alertId) window.API.sosCancel(sos.alertId).catch(() => {});
    window.SM.sos = { alertId: null, contacts: [], lat: null, lng: null };
    window.SM.emit();
    nav.reset('home');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header fixe ── */}
      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid var(--sm-line)' }}>
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sm-red)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="sm-blink" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--sm-red)' }} />
            {t('sos.alert_active')}
          </span>
          <button onClick={() => nav.reset('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon name="x" size={20} color="var(--sm-ink-400)" />
          </button>
        </div>
        {/* Bouton SAMU sticky */}
        <div style={{ padding: '0 16px 14px' }}>
          <a href="tel:185" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{
              width: '100%', padding: '14px', borderRadius: 'var(--sm-radius)',
              background: 'var(--sm-red)', color: 'white', border: 'none',
              fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-ui)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(192,57,43,0.22)',
            }}>
              <Icon name="phone" size={20} color="white" strokeWidth={2.2} />
              {t('sos.call_samu_185')}
            </button>
          </a>
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>

        {/* Carte succès — composant Banner partagé (frames.jsx), même style
            que le reste de l'app plutôt qu'un bloc vert refait à la main. */}
        <Banner
          variant="success"
          icon="check-circle-2"
          title={t('sos.alert_triggered')}
          text={hasLocation ? t('sos.position_recorded') : t('sos.no_location_recorded')}
          stacked
          style={{ marginBottom: 16 }}
        />

        {/* Carte Leaflet — uniquement si une position réelle a été mesurée ;
            jamais de carte centrée sur une position fabriquée. */}
        {hasLocation ? (
          <div style={{ borderRadius: 'var(--sm-radius)', overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--sm-shadow)' }}>
            <div ref={mapDivRef} style={{ width: '100%', height: 220 }} />
          </div>
        ) : (
          <Banner
            variant="warning"
            icon="alert-circle"
            title={t('sos.no_location_title')}
            text={t('sos.no_location_text')}
            stacked
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Contacts d'urgence */}
        {contacts.length > 0 && (
          <>
            <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 12 }}>{t('sos.emergency_contacts')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {contacts.map(c => (
                <div key={c.phone} style={{ background: 'white', borderRadius: 'var(--sm-radius)', boxShadow: 'var(--sm-shadow)', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: c.hasAccount ? 0 : 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--sm-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--sm-red)', fontFamily: 'var(--font-ui)' }}>{c.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{c.relation}</div>
                    </div>
                    {c.hasAccount && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EAFAF1', borderRadius: 999, padding: '4px 10px', flexShrink: 0 }}>
                        <Icon name="check" size={12} color="#27AE60" strokeWidth={2.5} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#27AE60', fontFamily: 'var(--font-ui)' }}>{t('sos.notified_in_app')}</span>
                      </div>
                    )}
                  </div>
                  {!c.hasAccount && (
                    <a href={buildWaUrl(c.phone, prenom, lat, lng, lang)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                      <button style={{
                        width: '100%', padding: '11px 14px', borderRadius: 'var(--sm-radius)',
                        background: '#25D366', color: 'white', border: 'none',
                        fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,211,102,0.22)',
                      }}>
                        <Icon name="message-circle" size={18} color="white" strokeWidth={2} />
                        {t('sos.alert_via_whatsapp')}
                      </button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Numéros d'urgence */}
        <h3 className="sm-serif" style={{ fontSize: 16, marginBottom: 12 }}>{t('sos.immediate_intervention')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <a href="tel:185" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--sm-red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="ambulance" size={22} color="var(--sm-red)" strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>📞 {t('sos.call_samu')}</div>
                <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>{t('sos.emergency_number')} · 185</div>
              </div>
              <Icon name="phone" size={18} color="var(--sm-red)" />
            </div>
          </a>
          <a href="tel:180" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '14px 16px', borderRadius: 'var(--sm-radius)', background: 'white', boxShadow: 'var(--sm-shadow)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: '#FEF5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="flame" size={22} color="#E67E22" strokeWidth={1.9} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--sm-ink)', fontFamily: 'var(--font-ui)' }}>📞 {t('sos.call_firefighters')}</div>
                <div style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginTop: 2 }}>{t('sos.emergency_number')} · 180</div>
              </div>
              <Icon name="phone" size={18} color="#E67E22" />
            </div>
          </a>
        </div>

        {/* Bouton annuler */}
        <button
          onClick={handleCancel}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--sm-radius)',
            border: '2px solid var(--sm-red)', background: 'white', color: 'var(--sm-red)',
            fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-ui)',
            cursor: 'pointer', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="x-circle" size={18} color="var(--sm-red)" />
          {t('sos.cancel_alert')}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { SOSCountdown, SOSConfirm });
