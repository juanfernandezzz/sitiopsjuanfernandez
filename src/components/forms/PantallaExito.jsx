import { useEffect, useRef } from 'react';
import Button from '../ui/Button';
import { descargarPDF } from '../../lib/descargarPDF';

const WHATSAPP_URL =
  'https://wa.me/56973394530?text=Hola%2C%20firm%C3%A9%20el%20consentimiento%20informado.%20Tengo%20una%20duda.';

export default function PantallaExito({
  pdfBlob,
  titulo = 'Listo. Recibí tu consentimiento firmado.',
  descripcion = 'Te envié una copia firmada a tu email. Si en 10 minutos no llega, revisa la carpeta de spam o promociones. Si quieres guardar una copia local en este dispositivo, descárgala con el botón aquí abajo. Si tienes cualquier duda antes de la sesión, escríbeme por WhatsApp.',
  downloadName = 'consentimiento-firmado.pdf',
  whatsappUrl = WHATSAPP_URL,
}) {
  const headingRef = useRef(null);

  useEffect(() => {
    // Anunciar el cambio de estado a screen readers.
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, []);

  const descargarManual = () => {
    if (!pdfBlob) return;
    descargarPDF(pdfBlob, downloadName);
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '24px',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: '40px 0',
          textAlign: 'center',
        }}
      >
        {/* Checkmark icon en círculo */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="30" stroke="#3F5B4A" strokeWidth="2" fill="rgba(63, 91, 74, 0.08)" />
          <polyline
            points="20 32 28 40 44 24"
            fill="none"
            stroke="#3F5B4A"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-ink"
          style={{
            fontSize: 'clamp(28px, 4vw, 38px)',
            lineHeight: 1.15,
            letterSpacing: '-0.015em',
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            outline: 'none',
            maxWidth: '20ch',
          }}
        >
          {titulo}
        </h2>

        <p
          className="font-body text-ink/75"
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: '60ch',
          }}
        >
          {descripcion}
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginTop: 8,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={descargarManual}
            disabled={!pdfBlob}
          >
            Descargar mi copia (PDF)
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sage"
            style={{
              fontSize: 14,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(63, 91, 74, 0.3)',
              textUnderlineOffset: 2,
            }}
          >
            Escribirme por WhatsApp
          </a>

          <a
            href="/"
            className="font-body text-ink/55"
            style={{
              fontSize: 13,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(42, 59, 76, 0.2)',
              textUnderlineOffset: 2,
              marginTop: 8,
            }}
          >
            Volver al sitio
          </a>
        </div>
      </div>
    </div>
  );
}
