// screen-lang-choice.jsx — Choix de langue au tout premier lancement.
// Affiché AVANT le splash si aucune langue n'est encore enregistrée
// (window.SM_I18N.lang === null) — voir app-live.jsx. Texte volontairement
// bilingue : aucune langue n'est encore choisie à ce stade, donc on ne peut
// pas appeler t() de façon pertinente ici.

function LangChoiceScreen({ nav }) {
  function choose(lang) {
    window.SM_I18N.set(lang);
    nav.reset('splash');
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--sm-paper)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 28px',
    }}>
      <img
        src="logo_80.png"
        alt="Sauv'Moi"
        style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 28, borderRadius: 22, boxShadow: '0 8px 28px rgba(10,22,40,.15)' }}
      />

      <p style={{ fontSize: 15, color: 'var(--sm-ink-500)', textAlign: 'center', lineHeight: 1.6, marginBottom: 36, fontFamily: 'var(--font-ui)' }}>
        Choisissez votre langue<br />
        Choose your language
      </p>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          onClick={() => choose('fr')}
          style={{
            width: '100%', padding: '18px 24px', borderRadius: 16,
            background: 'white',
            fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--sm-ink)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: 'var(--sm-shadow)',
          }}
        >
          <span style={{ fontSize: 24 }}>🇫🇷</span>
          Français
        </button>
        <button
          onClick={() => choose('en')}
          style={{
            width: '100%', padding: '18px 24px', borderRadius: 16,
            background: 'white',
            fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-ui)', color: 'var(--sm-ink)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: 'var(--sm-shadow)',
          }}
        >
          <span style={{ fontSize: 24 }}>🇬🇧</span>
          English
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--sm-ink-400)', textAlign: 'center', marginTop: 28, lineHeight: 1.5, fontFamily: 'var(--font-ui)', maxWidth: 300 }}>
        Vous pourrez la changer à tout moment depuis le profil.<br />
        You can change it anytime from your profile.
      </p>
    </div>
  );
}

Object.assign(window, { LangChoiceScreen });
