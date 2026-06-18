// screen-qr-code.jsx — Affichage du QR Code médical

function QrCodeScreen({ nav }) {
  useLucide();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    window.API.medicalQr()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Impossible de générer le QR Code."); setLoading(false); });
  }, []);

  const payload = data && data.payload;
  const expiresAt = payload ? new Date(payload.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button onClick={() => goBack(nav)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>QR Code médical</span>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 40px' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--sm-line)', borderTopColor: 'var(--sm-blue)', animation: 'sm-spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--sm-ink-500)', fontSize: 14 }}>Génération en cours…</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Icon name="wifi-off" size={48} color="var(--sm-ink-300)" />
            <p style={{ color: 'var(--sm-ink-500)', fontSize: 14, marginTop: 14 }}>{error}</p>
            <p style={{ color: 'var(--sm-ink-400)', fontSize: 13 }}>Vérifiez votre connexion et réessayez.</p>
          </div>
        )}

        {data && (
          <>
            {/* Titre & sous-titre */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 className="sm-serif" style={{ fontSize: 22, marginBottom: 6 }}>Mon carnet médical</h2>
              <p style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Présentez ce code aux secours en cas d'urgence</p>
            </div>

            {/* QR Code */}
            <div style={{ background: 'white', borderRadius: 18, padding: 14, boxShadow: 'var(--shadow-3)', border: '1.5px solid var(--sm-line)', marginBottom: 20 }}>
              <img
                src={data.qrDataUrl}
                alt="QR Code médical"
                style={{ display: 'block', width: 220, height: 220 }}
              />
            </div>

            {/* Infos récap */}
            {payload && (
              <div style={{ width: '100%', background: 'var(--sm-paper)', borderRadius: 14, border: '1px solid var(--sm-line)', overflow: 'hidden', marginBottom: 18 }}>

                {payload.nom && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--sm-line)' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Nom</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{payload.nom}</span>
                  </div>
                )}

                {(payload.age != null) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--sm-line)' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Âge</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{payload.age} ans</span>
                  </div>
                )}

                {payload.bloodType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid var(--sm-line)' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Groupe sanguin</span>
                    <span style={{ padding: '3px 12px', borderRadius: 999, background: 'var(--sm-soft-red)', color: 'var(--sm-red)', fontWeight: 700, fontSize: 14 }}>{payload.bloodType}</span>
                  </div>
                )}

                {payload.allergies && payload.allergies.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--sm-line)' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Allergies</span>
                    <span style={{ fontWeight: 500, fontSize: 13, textAlign: 'right', maxWidth: '55%' }}>{payload.allergies.join(', ')}</span>
                  </div>
                )}

                {payload.contacts && payload.contacts.length > 0 && (
                  <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--sm-line)' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Contacts d'urgence</span>
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {payload.contacts.map((c, i) => (
                        <div key={i} style={{ fontSize: 13, fontWeight: 500 }}>
                          {c.name}{c.relation ? ' (' + c.relation + ')' : ''} · {c.phone}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expiresAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>Valide jusqu'au</span>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{expiresAt}</span>
                  </div>
                )}
              </div>
            )}

            {/* Avertissement */}
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sm-soft-blue)', borderRadius: 12, width: '100%' }}>
              <Icon name="info" size={17} color="var(--sm-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: 'var(--sm-blue)', margin: 0, lineHeight: 1.6 }}>
                Ce QR Code encode vos informations médicales essentielles. Mettez-le à jour depuis votre profil si vos données changent.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { QrCodeScreen });
