// screen-terms.jsx — Conditions générales d'utilisation

function TermsScreen({ nav }) {
  useLucide();
  const t = useTranslation();
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', background: 'white', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button onClick={() => goBack(nav)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>{t('terms.header_title')}</span>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 40px', fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.7, color: 'var(--sm-ink)' }}>

        <h2 className="sm-serif" style={{ fontSize: 20, marginBottom: 6 }}>Sauv'Moi</h2>
        <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginBottom: 20 }}>{t('terms.version_line')}</p>

        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--sm-ink)' }}>{t('terms.section' + n + '_title')}</h3>
            <p style={{ margin: 0, color: 'var(--sm-ink-600)' }}>{t('terms.section' + n + '_body')}</p>
          </div>
        ))}

        {/* Numéros d'urgence rappel */}
        <div style={{ background: 'var(--sm-soft-red)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Icon name="phone-call" size={22} color="var(--sm-red)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sm-red)' }}>{t('terms.emergency_numbers_title')}</div>
            <div style={{ fontSize: 13 }}>
              <a href="tel:185" style={{ color: 'var(--sm-red)', fontWeight: 700 }}>185</a> {t('sos.samu')} ·
              <a href="tel:180" style={{ color: 'var(--sm-red)', fontWeight: 700 }}> 180</a> {t('terms.emergency_red_cross')} ·
              <a href="tel:170" style={{ color: 'var(--sm-red)', fontWeight: 700 }}> 170</a> {t('sos.police')}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { TermsScreen });
