// screen-victim-card.jsx — Fiche d'urgence après scan QR Sauv'Moi
// Données lues depuis window.SM_VICTIM (objet JSON décodé du QR)

function VictimCardScreen({ nav }) {
  useLucide();
  const v = window.SM_VICTIM || {};
  const { nom, age, bloodType, allergies, conditions, contacts, generatedAt, expiresAt } = v;

  const genDate = generatedAt ? new Date(generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const expDate = expiresAt  ? new Date(expiresAt).toLocaleDateString('fr-FR',  { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const isExpired = expiresAt && Date.now() > expiresAt;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f5f6f8', display: 'flex', flexDirection: 'column' }}>

      {/* ── En-tête rouge ── */}
      <div style={{ background: 'var(--sm-red)', padding: '14px 16px 26px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <button
            onClick={() => goBack(nav)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="arrow-left" size={18} color="white" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Icon name="shield-alert" size={18} color="rgba(255,255,255,0.9)" />
            <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Fiche d'Urgence · Sauv'Moi
            </span>
          </div>
        </div>
        <div>
          <div className="sm-serif" style={{ fontSize: 28, color: 'white', fontWeight: 700, lineHeight: 1.1 }}>
            {nom || 'Victime'}
          </div>
          {age != null && (
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.82)', marginTop: 5 }}>
              {age} ans
            </div>
          )}
        </div>

        {isExpired && (
          <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="alert-triangle" size={15} color="white" />
            <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>QR Code expiré — données potentiellement obsolètes</span>
          </div>
        )}
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 24px' }}>

        {/* Groupe sanguin — section critique */}
        <div style={{ background: 'white', borderRadius: 16, border: '2px solid var(--sm-red)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--sm-soft-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="droplets" size={26} color="var(--sm-red)" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sm-red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Groupe sanguin
              </div>
              {bloodType ? (
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--sm-red)', fontFamily: 'var(--font-display, serif)', lineHeight: 1 }}>
                  {bloodType}
                </div>
              ) : (
                <div style={{ fontSize: 15, color: 'var(--sm-ink-400)' }}>Non renseigné</div>
              )}
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--sm-line)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <Icon name="triangle-alert" size={20} color="#e65100" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Allergies
              </div>
              {allergies && allergies.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allergies.map((a, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: 999, background: '#fff3e0', color: '#bf360c', fontWeight: 700, fontSize: 13, border: '1px solid #ffcc02' }}>
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="check-circle" size={16} color="var(--sm-green)" />
                  <span style={{ fontSize: 14, color: 'var(--sm-green)', fontWeight: 600 }}>Aucune allergie connue</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Antécédents médicaux */}
        {conditions && conditions.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--sm-line)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--sm-soft-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <Icon name="clipboard-list" size={20} color="var(--sm-blue)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sm-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Antécédents médicaux
                </div>
                <div style={{ fontSize: 14, color: 'var(--sm-ink)', lineHeight: 1.55 }}>
                  {conditions.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts d'urgence */}
        {contacts && contacts.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--sm-line)', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--sm-line)', background: 'var(--sm-paper-2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sm-ink-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Contacts d'urgence
              </div>
            </div>
            {contacts.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < contacts.length - 1 ? '1px solid var(--sm-line)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sm-soft-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="user" size={18} color="var(--sm-blue)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>
                    {c.relation ? c.relation + ' · ' : ''}{c.phone}
                  </div>
                </div>
                <a
                  href={'tel:' + c.phone}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sm-soft-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                >
                  <Icon name="phone" size={18} color="var(--sm-green)" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Bouton SAMU */}
        <a
          href="tel:185"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px', borderRadius: 14, background: 'var(--sm-red)', color: 'white', textDecoration: 'none', marginBottom: 18 }}
        >
          <Icon name="phone-call" size={22} color="white" />
          <span style={{ fontWeight: 700, fontSize: 17 }}>Appeler le SAMU — 185</span>
        </a>

        {/* Footer informations QR */}
        <div style={{ background: 'var(--sm-paper-2)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {genDate && (
            <div style={{ fontSize: 12, color: 'var(--sm-ink-500)' }}>
              Généré le {genDate}
            </div>
          )}
          {expDate && (
            <div style={{ fontSize: 12, color: isExpired ? 'var(--sm-red)' : 'var(--sm-ink-500)', fontWeight: isExpired ? 600 : 400 }}>
              {isExpired ? 'Expiré le ' : 'Valide jusqu\'au '}{expDate}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--sm-ink-400)', marginTop: 4 }}>
            Ces informations sont fournies par l'application Sauv'Moi et ont été saisies par la victime elle-même.
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { VictimCardScreen });
