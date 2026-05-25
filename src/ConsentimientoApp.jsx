import ConsentimientoInformado from './components/forms/ConsentimientoInformado';

/**
 * Root del bundle de la página /consentimiento.html.
 *
 * Página utilitaria: NO importa Hero, Header del sitio, Cal embed,
 * FloatingWhatsApp ni nada del sitio principal. Solo el form.
 */
export default function ConsentimientoApp() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans antialiased">
      {/* Header simple */}
      <header
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 1080,
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span
          className="font-display text-sage"
          style={{
            fontSize: 18,
            letterSpacing: '-0.01em',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
          }}
        >
          Juan Fernández
        </span>
        <a
          href="/"
          className="font-body text-ink/60"
          style={{
            fontSize: 13,
            textDecoration: 'underline',
            textDecorationColor: 'rgba(42, 59, 76, 0.25)',
            textUnderlineOffset: 2,
          }}
        >
          Volver al sitio principal
        </a>
      </header>

      <main>
        <ConsentimientoInformado />
      </main>

      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          marginTop: 48,
        }}
      >
        <p
          className="font-body"
          style={{
            fontSize: 12,
            color: 'rgba(42, 59, 76, 0.55)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Juan Fernández · Psicólogo Clínico · MINSAL RNPI 876085 ·
          psicologojuanfernandez.cl
        </p>
      </footer>
    </div>
  );
}
