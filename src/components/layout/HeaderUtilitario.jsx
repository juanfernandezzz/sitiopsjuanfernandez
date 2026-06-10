import { PRESTADOR } from '../../lib/contacto';

/**
 * Header utilitario para páginas legales (consentimiento, política de privacidad).
 *
 * Sin nav, sin modales, sin CTA. Solo identidad + link de retorno.
 * Mantiene bundle ligero en páginas no comerciales.
 */
export default function HeaderUtilitario() {
  return (
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
      <a
        href="/"
        className="font-wordmark text-sage"
        style={{
          fontSize: 20,
          letterSpacing: '0',
          textDecoration: 'none',
        }}
      >
        {PRESTADOR.nombre}
      </a>
      <a
        href="/"
        className="font-body text-ink/75"
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
  );
}
