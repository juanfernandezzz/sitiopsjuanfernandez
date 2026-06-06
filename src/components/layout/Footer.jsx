import { PRESTADOR, CONTACTO, REDES, LEGAL, FONASA_CODIGOS } from '../../lib/contacto';

/**
 * Footer compartido en sitio principal, consentimiento y politica-privacidad.
 *
 * Bg sage con texto cream. Tres columnas en desktop, stack en mobile.
 * Banda inferior con copyright y marco legal aplicable (Ley 21.541 + Ley 21.719).
 *
 * Iconos inline para evitar arrastrar lucide-react al bundle de las paginas legales.
 */
export default function Footer() {
  return (
    <footer className="bg-sage text-cream mt-24">
      <div
        className="mx-auto"
        style={{
          maxWidth: 1080,
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            padding: 'clamp(48px, 6vw, 64px) clamp(24px, 4vw, 32px)',
            gap: 'clamp(32px, 4vw, 48px)',
          }}
        >
          <ColumnaIdentidad />
          <ColumnaCredenciales />
          <ColumnaContacto />
        </div>
      </div>

      {/* Banda inferior full-width sobre sage mas oscuro */}
      <div
        style={{
          background: '#2F4438',
          padding: '24px 16px',
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: 1080,
            textAlign: 'center',
          }}
        >
          <p
            className="font-body"
            style={{
              fontSize: 13,
              color: 'rgba(246, 241, 232, 0.6)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            © 2026 {PRESTADOR.nombre}. Todos los derechos reservados.
          </p>
          <p
            className="font-body mx-auto"
            style={{
              fontSize: 12,
              color: 'rgba(246, 241, 232, 0.45)',
              margin: '6px auto 0',
              lineHeight: 1.55,
              maxWidth: '60ch',
            }}
          >
            Sitio realizado conforme a {LEGAL.leyTelemedicina} (Telemedicina) y{' '}
            {LEGAL.leyDatosFutura} (Protección de Datos Personales).
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================ */
/* COLUMNAS                                                     */
/* ============================================================ */

function ColumnaIdentidad() {
  return (
    <div>
      <p
        className="font-wordmark"
        style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '0',
          color: '#F6F1E8',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {PRESTADOR.nombre}
      </p>
      <p
        className="font-body"
        style={{
          fontSize: 15,
          color: 'rgba(246, 241, 232, 0.8)',
          margin: '4px 0 0',
        }}
      >
        {PRESTADOR.titulo}
      </p>
      <p
        className="font-body"
        style={{
          fontSize: 14,
          color: 'rgba(246, 241, 232, 0.7)',
          margin: '8px 0 0',
        }}
      >
        Atención online desde {PRESTADOR.ciudadBase}, Chile
      </p>
      <p
        className="font-body"
        style={{
          fontSize: 14,
          color: 'rgba(246, 241, 232, 0.7)',
          margin: '16px 0 0',
          lineHeight: 1.6,
          maxWidth: '30ch',
        }}
      >
        Psicoterapia individual con enfoque integrativo. CBT y narrativa al
        servicio de tu bienestar, en sesiones de 45 minutos por videollamada.
      </p>
    </div>
  );
}

function ColumnaCredenciales() {
  const items = [
    `Psicólogo titulado, ${PRESTADOR.universidad}`,
    `Registro en la Superintendencia de Salud N° ${PRESTADOR.rnpi}`,
    'Prestador inscrito en Fonasa (Modalidad Libre Elección)',
    'Plataforma certificada por Fonasa: Doxy.me',
  ];
  return (
    <div>
      <HeadingColumna>Credenciales</HeadingColumna>
      <ul
        className="font-body"
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: 14,
          color: 'rgba(246, 241, 232, 0.8)',
          lineHeight: 1.7,
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ marginBottom: 4 }}>
            {item}
          </li>
        ))}
        <li style={{ marginTop: 8 }}>
          Códigos Fonasa:
          <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
            {FONASA_CODIGOS.map(({ codigo, etiqueta }) => (
              <li key={codigo} style={{ color: 'rgba(246, 241, 232, 0.7)' }}>
                {codigo} ({etiqueta})
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </div>
  );
}

function ColumnaContacto() {
  return (
    <div>
      <HeadingColumna>Contacto</HeadingColumna>
      <div
        className="font-body"
        style={{
          fontSize: 14,
          color: 'rgba(246, 241, 232, 0.85)',
          lineHeight: 1.7,
        }}
      >
        <LinkConIcono
          href={`mailto:${CONTACTO.email}`}
          icon={<MailIcon />}
          label={CONTACTO.email}
        />
        <LinkConIcono
          href={CONTACTO.whatsappUrl}
          icon={<WhatsAppIcon />}
          label={`WhatsApp ${CONTACTO.whatsappDisplay}`}
          external
        />
      </div>

      <HeadingSecundario>Sígueme</HeadingSecundario>
      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: 'rgba(246, 241, 232, 0.6)',
          margin: '0 0 10px',
          lineHeight: 1.55,
          maxWidth: '30ch',
        }}
      >
        Contenido breve sobre bienestar y psicología. Para agendar, escríbeme por
        WhatsApp.
      </p>
      <div
        className="font-body"
        style={{
          fontSize: 14,
          color: 'rgba(246, 241, 232, 0.85)',
          lineHeight: 1.7,
        }}
      >
        <LinkConIcono
          href={REDES.instagramUrl}
          icon={<InstagramIcon />}
          label="Instagram"
          external
          rel="me noopener noreferrer"
        />
        <LinkConIcono
          href={REDES.facebookUrl}
          icon={<FacebookIcon />}
          label="Facebook"
          external
          rel="me noopener noreferrer"
        />
      </div>

      <HeadingSecundario>Navegar</HeadingSecundario>
      <NavLinks
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Cómo trabajo', href: '/#como-trabajo' },
          { label: 'Precios', href: '/#precios' },
          { label: 'Agendar', href: '/#agendar' },
          { label: 'FAQ', href: '/#faq' },
        ]}
      />

      <HeadingSecundario>Legal</HeadingSecundario>
      <NavLinks
        items={[
          {
            label: 'Política de Privacidad',
            href: '/politica-privacidad.html',
          },
          {
            label: 'Consentimiento Informado',
            href: '/consentimiento.html',
          },
        ]}
      />
    </div>
  );
}

/* ============================================================ */
/* HELPERS                                                      */
/* ============================================================ */

function HeadingColumna({ children }) {
  return (
    <h3
      className="font-display"
      style={{
        fontSize: 16,
        fontWeight: 500,
        color: '#F6F1E8',
        margin: '0 0 16px',
        fontVariationSettings: '"opsz" 144, "SOFT" 50',
      }}
    >
      {children}
    </h3>
  );
}

function HeadingSecundario({ children }) {
  return (
    <p
      className="font-body"
      style={{
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: 'rgba(246, 241, 232, 0.55)',
        margin: '24px 0 8px',
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

function LinkConIcono({ href, icon, label, external = false, rel }) {
  const extraProps = external
    ? { target: '_blank', rel: rel || 'noopener noreferrer' }
    : {};
  return (
    <a
      href={href}
      {...extraProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'rgba(246, 241, 232, 0.85)',
        textDecoration: 'none',
        padding: '4px 0',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#F6F1E8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(246, 241, 232, 0.85)';
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          width: 16,
          height: 16,
          flexShrink: 0,
          color: 'rgba(246, 241, 232, 0.8)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span style={{ wordBreak: 'break-word' }}>{label}</span>
    </a>
  );
}

function NavLinks({ items }) {
  return (
    <ul
      className="font-body"
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: 14,
        lineHeight: 1.7,
      }}
    >
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            style={{
              color: 'rgba(246, 241, 232, 0.75)',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(246, 241, 232, 0.3)',
              textUnderlineOffset: 2,
              transition: 'color 150ms ease, text-decoration-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F6F1E8';
              e.currentTarget.style.textDecorationColor =
                'rgba(246, 241, 232, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(246, 241, 232, 0.75)';
              e.currentTarget.style.textDecorationColor =
                'rgba(246, 241, 232, 0.3)';
            }}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================ */
/* ICONOS SVG INLINE                                            */
/* ============================================================ */

function MailIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1.5"
        y="3"
        width="13"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2 4.5l6 4.5 6-4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8c0 1.16.31 2.26.85 3.21L1.5 14.5l3.4-.83A6.47 6.47 0 0 0 8 14.5c3.59 0 6.5-2.91 6.5-6.5S11.59 1.5 8 1.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5.7 5.8c.15-.35.32-.36.45-.36.12 0 .25 0 .36 0 .12 0 .29.04.45.34.16.31.55 1.34.6 1.44.05.1.08.21.02.34-.06.13-.09.21-.17.32-.08.1-.17.23-.25.31-.08.09-.17.18-.07.36.1.18.42.7.91 1.13.62.55 1.15.72 1.33.81.18.09.28.07.39-.04.1-.11.45-.52.57-.7.12-.18.24-.15.4-.09.16.06 1.04.49 1.22.58.18.09.3.13.34.21.04.08.04.47-.11.92-.15.45-.86.86-1.23.91-.34.05-.77.07-1.24-.08-.29-.09-.66-.21-1.13-.42-1.99-.86-3.29-2.88-3.39-3.02-.1-.13-.81-1.07-.81-2.04 0-.97.51-1.45.69-1.65l.18-.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1.8"
        y="1.8"
        width="12.4"
        height="12.4"
        rx="3.6"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.6" cy="4.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.4 14.5V8.7h1.9l.3-2.3H9.4V5c0-.66.2-1.1 1.15-1.1H12V1.86c-.3-.04-1.05-.1-1.9-.1-1.9 0-3.15 1.13-3.15 3.2v1.45H5v2.3h1.95v5.8z"
        fill="currentColor"
      />
    </svg>
  );
}
