// screen-terms.jsx — Conditions générales d'utilisation

function TermsScreen({ nav }) {
  useLucide();
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--sm-paper)', display: 'flex', flexDirection: 'column' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px', background: 'white', borderBottom: '1px solid var(--sm-line)', flexShrink: 0 }}>
        <button onClick={() => nav.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sm-paper-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16 }}>Conditions générales</span>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 40px', fontFamily: 'var(--font-ui)', fontSize: 14, lineHeight: 1.7, color: 'var(--sm-ink)' }}>

        <h2 className="sm-serif" style={{ fontSize: 20, marginBottom: 6 }}>Sauv'Moi</h2>
        <p style={{ fontSize: 13, color: 'var(--sm-ink-500)', marginBottom: 20 }}>Conditions générales d'utilisation · Version 1.0 · Juin 2025</p>

        {[
          {
            title: '1. Objet',
            body: "Sauv'Moi est une application mobile d'aide aux premiers secours destinée au grand public en Côte d'Ivoire. Elle fournit des conseils pédagogiques validés par les référentiels PSC1 et des contacts d'urgence. Elle ne remplace en aucun cas l'intervention de professionnels de santé qualifiés.",
          },
          {
            title: '2. Avertissement médical',
            body: "Les protocoles de premiers secours présentés sont à titre informatif et éducatif uniquement. En cas d'urgence vitale, composez immédiatement le 185 (SAMU Côte d'Ivoire) ou le 180 (Croix-Rouge). L'application ne pose pas de diagnostic médical.",
          },
          {
            title: '3. Données personnelles',
            body: "Les informations du carnet médical (groupe sanguin, allergies, contacts d'urgence) sont stockées localement et/ou sur des serveurs sécurisés. Elles ne sont jamais vendues ni transmises à des tiers sans votre consentement explicite, sauf obligation légale.",
          },
          {
            title: '4. QR Code médical',
            body: "Le QR Code généré synthétise vos informations médicales essentielles. Il est destiné à être présenté aux secouristes en cas d'urgence. Vous êtes responsable de la confidentialité de ce QR Code.",
          },
          {
            title: '5. Géolocalisation & SOS',
            body: "La fonctionnalité SOS utilise votre position GPS pour envoyer votre localisation aux équipes de secours. Cette fonctionnalité est optionnelle et ne s'active que lors d'une demande SOS explicite de votre part.",
          },
          {
            title: '6. Responsabilité',
            body: "L'éditeur ne saurait être tenu responsable des conséquences résultant d'un mauvais usage des informations présentées. L'application est fournie telle quelle, dans un cadre de démo hackathon, sans garantie de disponibilité continue.",
          },
          {
            title: '7. Modifications',
            body: "Ces conditions peuvent être mises à jour. La version en vigueur est toujours accessible dans l'application. L'utilisation continue de l'application après modification vaut acceptation des nouvelles conditions.",
          },
          {
            title: '8. Contact',
            body: "Pour toute question : teamupsp5@gmail.com",
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--sm-ink)' }}>{section.title}</h3>
            <p style={{ margin: 0, color: 'var(--sm-ink-600)' }}>{section.body}</p>
          </div>
        ))}

        {/* Numéros d'urgence rappel */}
        <div style={{ background: 'var(--sm-soft-red)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <Icon name="phone-call" size={22} color="var(--sm-red)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sm-red)' }}>Numéros d'urgence CI</div>
            <div style={{ fontSize: 13 }}>
              <a href="tel:185" style={{ color: 'var(--sm-red)', fontWeight: 700 }}>185</a> SAMU ·
              <a href="tel:180" style={{ color: 'var(--sm-red)', fontWeight: 700 }}> 180</a> Croix-Rouge ·
              <a href="tel:170" style={{ color: 'var(--sm-red)', fontWeight: 700 }}> 170</a> Police
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { TermsScreen });
