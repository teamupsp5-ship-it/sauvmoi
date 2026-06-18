// screen-qr-scanner.jsx — Scanner QR natif (Capacitor MLKit) + fallback web
// Surcharge QrScannerScreen défini dans screen-home.jsx.
// Données décodées stockées dans window.SM_VICTIM avant nav.go('victim_card').

function QrScannerScreen({ nav }) {
  useLucide();
  const fileRef   = useRef(null);
  const canvasRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState(null);
  const [hint, setHint]         = useState(null);

  const isNative = !!(window.Capacitor?.isNativePlatform?.());

  // ── Traitement d'un résultat QR brut ──────────────────────────────────────
  function handleRaw(raw) {
    setError(null);
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { setError("Ce QR Code n'est pas un QR Sauv'Moi."); return; }

    if (!parsed || !parsed.id) {
      setError("Ce QR Code n'est pas un QR Sauv'Moi.");
      return;
    }
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      setError("Ce QR Code est expiré. Demandez à l'utilisateur de le régénérer depuis son profil.");
      return;
    }
    window.SM_VICTIM = parsed;
    nav.go('victim_card');
  }

  // ── Scanner natif via @capacitor-mlkit/barcode-scanning ──────────────────
  async function startNativeScan() {
    setScanning(true);
    setError(null);
    const BS = window.Capacitor?.Plugins?.BarcodeScanner;
    if (!BS) {
      setError("Plugin scanner non disponible. Rebuilder l'APK avec npm run android:run.");
      setScanning(false);
      return;
    }
    try {
      const { camera } = await BS.checkPermissions();
      if (camera !== 'granted') {
        const result = await BS.requestPermissions();
        if (result.camera !== 'granted') {
          setError('Permission caméra refusée. Activez-la dans Paramètres → Applications → Sauv\'Moi.');
          setScanning(false);
          return;
        }
      }
      setHint("Pointez la caméra vers un QR Code Sauv'Moi…");
      const { barcodes } = await BS.scan({ formats: ['QR_CODE'] });
      setHint(null);
      if (barcodes && barcodes.length > 0) {
        handleRaw(barcodes[0].rawValue);
      } else {
        setError('Aucun QR Code détecté. Réessayez.');
      }
    } catch (e) {
      setError('Erreur scanner : ' + (e.message || String(e)));
      setHint(null);
    } finally {
      setScanning(false);
    }
  }

  // ── Fallback web : photo → jsQR ──────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) { setScanning(false); return; }
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      if (typeof window.jsQR !== 'function') {
        setError('Librairie jsQR non chargée. Vérifiez votre connexion internet.');
        setScanning(false);
        return;
      }
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      setScanning(false);
      if (code) {
        handleRaw(code.data);
      } else {
        setError('Aucun QR Code trouvé dans cette image. Essayez avec une meilleure photo.');
      }
    };
    img.onerror = () => { setError('Impossible de lire l\'image.'); setScanning(false); };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a1628', display: 'flex', flexDirection: 'column' }}>

      {/* Canvas invisible pour jsQR */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Input fichier caché */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Header */}
      <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => goBack(nav)} style={{ padding: 8, margin: -8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <Icon name="arrow-left" size={22} color="white" />
        </button>
        <h2 className="sm-serif" style={{ fontSize: 20, color: 'white', flex: 1 }}>
          Scanner un QR Sauv'Moi
        </h2>
      </div>

      {/* Zone viseur */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 32px' }}>

        {/* Cadre viseur animé */}
        <div style={{ position: 'relative', width: 230, height: 230, marginBottom: 28 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }} />
          {[
            { top: 12, left: 12, borderTop: '3px solid white', borderLeft: '3px solid white', borderRadius: '10px 0 0 0' },
            { top: 12, right: 12, borderTop: '3px solid white', borderRight: '3px solid white', borderRadius: '0 10px 0 0' },
            { bottom: 12, left: 12, borderBottom: '3px solid white', borderLeft: '3px solid white', borderRadius: '0 0 0 10px' },
            { bottom: 12, right: 12, borderBottom: '3px solid white', borderRight: '3px solid white', borderRadius: '0 0 10px 0' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
          ))}
          {/* Icône centrale */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {scanning ? (
              <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'sm-spin 0.8s linear infinite' }} />
            ) : (
              <Icon name="scan-qr-code" size={52} color="rgba(255,255,255,0.25)" />
            )}
          </div>
        </div>

        {/* Message aide */}
        {!error && !hint && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', lineHeight: 1.55, marginBottom: 6 }}>
            {isNative
              ? "Pointez la caméra vers un QR Code Sauv'Moi"
              : "Prenez en photo ou importez une image d'un QR Code Sauv'Moi"}
          </p>
        )}
        {hint && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', fontWeight: 600, marginBottom: 6 }}>
            {hint}
          </p>
        )}

        {/* Message d'erreur */}
        {error && (
          <div style={{ background: 'rgba(229,57,53,0.18)', border: '1px solid rgba(229,57,53,0.5)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="x-circle" size={18} color="#ff6b6b" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: '#ff9b9b', fontSize: 13, lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

      </div>

      {/* Boutons action */}
      <div style={{ padding: '0 20px 52px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>

        {isNative ? (
          <button
            onClick={startNativeScan}
            disabled={scanning}
            style={{ width: '100%', padding: '15px', borderRadius: 14, background: scanning ? 'rgba(255,255,255,0.15)' : 'var(--sm-red)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: scanning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Icon name="scan" size={20} color="white" />
            {scanning ? 'Scan en cours…' : 'Ouvrir la caméra'}
          </button>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            style={{ width: '100%', padding: '15px', borderRadius: 14, background: scanning ? 'rgba(255,255,255,0.15)' : 'var(--sm-red)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: scanning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Icon name="camera" size={20} color="white" />
            {scanning ? 'Analyse en cours…' : 'Ouvrir la caméra / galerie'}
          </button>
        )}

        <button
          onClick={() => goBack(nav)}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
        >
          Retour
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { QrScannerScreen });
