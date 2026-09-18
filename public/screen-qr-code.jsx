// screen-qr-code.jsx — Affichage du QR Code médical

function QrCodeScreen({ nav }) {
  useLucide();
  const t = useTranslation();
  const lang = useLang();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState('');

  useEffect(() => {
    window.API.medicalQr()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(t('qrcode.error_generate')); setLoading(false); });
  }, []);

  async function doRegenerate() {
    setShowRegenConfirm(false);
    setRegenerating(true);
    setRegenError('');
    try {
      const d = await window.API.regenerateQr();
      setData(d);
      setError(null);
    } catch (e) {
      setRegenError(t('qrcode.regenerate_failed'));
    }
    setRegenerating(false);
  }

  const payload = data && data.payload;
  const expiresAt = payload ? formatDate(payload.expiresAt, lang) : null;
  const isExpired = payload ? Date.now() > payload.expiresAt : false;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button onClick={() => goBack(nav)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{t('qrcode.title')}</span>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px 40px' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 60 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--sm-line)', borderTopColor: 'var(--sm-blue)', animation: 'sm-spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--sm-ink-500)', fontSize: 14 }}>{t('qrcode.generating')}</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Icon name="wifi-off" size={48} color="var(--sm-ink-300)" />
            <p style={{ color: 'var(--sm-ink-500)', fontSize: 14, marginTop: 14 }}>{error}</p>
            <p style={{ color: 'var(--sm-ink-400)', fontSize: 13 }}>{t('qrcode.error_check_connection')}</p>
          </div>
        )}

        {data && (
          <>
            {/* Titre & sous-titre */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 className="sm-serif" style={{ fontSize: 22, marginBottom: 6 }}>{t('qrcode.subtitle')}</h2>
              <p style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('qrcode.instructions')}</p>
            </div>

            {isExpired && (
              <Banner
                variant="warning"
                icon="alert-triangle"
                title={t('qrcode.expired_title')}
                text={t('qrcode.expired_text')}
                stacked
                style={{ width: '100%', marginBottom: 18 }}
              />
            )}

            {/* QR Code */}
            <div style={{ background: 'white', borderRadius: 18, padding: 14, boxShadow: 'var(--shadow-3)', marginBottom: 20 }}>
              <img
                src={data.qrDataUrl}
                alt={t('qrcode.alt_text')}
                style={{ display: 'block', width: 220, height: 220 }}
              />
            </div>

            {/* Infos récap */}
            {payload && (
              <div style={{ width: '100%', background: 'white', borderRadius: 14, boxShadow: 'var(--sm-shadow)', overflow: 'hidden', marginBottom: 18 }}>

                {payload.nom && (
                  <div className="sm-row-divider" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('qrcode.field_name')}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{payload.nom}</span>
                  </div>
                )}

                {Number.isFinite(payload.ageDays) && payload.ageDays >= 0 && (
                  <div className="sm-row-divider" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('qrcode.field_age')}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{formatAge(payload.ageDays, lang)}</span>
                  </div>
                )}

                {payload.bloodType && (
                  <div className="sm-row-divider" style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('victim.blood_type')}</span>
                      <span style={{ padding: '3px 12px', borderRadius: 999, background: 'var(--sm-soft-red)', color: 'var(--sm-red)', fontWeight: 700, fontSize: 14 }}>{payload.bloodType}</span>
                    </div>
                    <BloodTypeStatusNote t={t} status={payload.bloodTypeStatus} />
                  </div>
                )}

                {payload.allergies && payload.allergies.length > 0 && (
                  <div className="sm-row-divider" style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('victim.allergies')}</span>
                    <span style={{ fontWeight: 500, fontSize: 13, textAlign: 'right', maxWidth: '55%' }}>{payload.allergies.join(', ')}</span>
                  </div>
                )}

                {payload.contacts && payload.contacts.length > 0 && (
                  <div className="sm-row-divider" style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('victim.emergency_contacts')}</span>
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
                    <span style={{ fontSize: 13, color: 'var(--sm-ink-500)' }}>{t('qrcode.valid_until_label')}</span>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{expiresAt}</span>
                  </div>
                )}
              </div>
            )}

            {/* Avertissement */}
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--sm-soft-blue)', borderRadius: 12, width: '100%' }}>
              <Icon name="info" size={17} color="var(--sm-blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: 'var(--sm-blue)', margin: 0, lineHeight: 1.6 }}>
                {t('qrcode.disclaimer')}
              </p>
            </div>

            {regenError && (
              <Banner variant="danger" icon="alert-circle" text={regenError} style={{ width: '100%', marginTop: 14 }} />
            )}

            <button
              onClick={() => setShowRegenConfirm(true)}
              disabled={regenerating}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 18, padding: '13px', borderRadius: 12, background: 'var(--sm-paper-2)', border: '1px solid var(--sm-line)', color: 'var(--sm-ink)', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-ui)', cursor: regenerating ? 'default' : 'pointer', opacity: regenerating ? 0.6 : 1 }}
            >
              <Icon name="refresh-cw" size={16} />
              {regenerating ? t('qrcode.regenerating') : t('qrcode.regenerate_button')}
            </button>
          </>
        )}
      </div>

      {/* Modal confirmation régénération */}
      {showRegenConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
          <div style={{ width: '100%', background: 'white', borderRadius: '20px 20px 0 0', padding: '28px 20px 40px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--sm-line)', margin: '0 auto 22px' }} />
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FDEDEC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="alert-triangle" size={26} color="#C0392B" />
            </div>
            <h3 className="sm-serif" style={{ fontSize: 20, textAlign: 'center', marginBottom: 8 }}>{t('qrcode.regenerate_confirm_title')}</h3>
            <p style={{ fontSize: 14, color: 'var(--sm-ink-500)', textAlign: 'center', marginBottom: 24, fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
              {t('qrcode.regenerate_confirm_body')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={doRegenerate} style={{ padding: '14px', borderRadius: 12, background: '#C0392B', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                {t('qrcode.regenerate_confirm_button')}
              </button>
              <button onClick={() => setShowRegenConfirm(false)} style={{ padding: '14px', borderRadius: 12, background: '#F1F2F4', color: 'var(--sm-ink)', border: 'none', fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { QrCodeScreen });
