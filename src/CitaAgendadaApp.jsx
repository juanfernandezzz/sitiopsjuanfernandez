import { useEffect, useRef, useState } from 'react';
import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import Button from './components/ui/Button';
import { CONTACTO } from './lib/contacto';
import {
  CONFIRMACION,
  CONSENTIMIENTO,
  LLEGADA,
  tipoDeReserva,
  pasosFonasa,
  pasosParticular,
} from './lib/postReserva';
import {
  contextoConfirmacion,
  dispararEventoCita,
} from './lib/seguimiento';

/**
 * Pagina /cita-agendada (C27).
 *
 * Doble proposito:
 *   1. Su carga dispara la conversion de Google Ads (medicion por URL) y el
 *      evento GA4 'cita_agendada' (gated, solo en reservas reales).
 *   2. Confirma la reserva y entrega la misma guia del correo automatico:
 *      consentimiento informado primero (requisito legal), luego el pago segun
 *      la sesion, y como entrar a la videollamada.
 *
 * El tipo de sesion se lee de sessionStorage (nunca de la URL): si no se pudo
 * determinar, se muestran las dos vias de pago para no dejar a nadie sin
 * instrucciones.
 */
export default function CitaAgendadaApp() {
  const [slug, setSlug] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const { slug: s } = contextoConfirmacion();
    setSlug(s || null);
    dispararEventoCita();
    if (headingRef.current) headingRef.current.focus();
  }, []);

  const tipo = tipoDeReserva(slug);
  const mostrarFonasa = tipo === 'fonasa' || tipo === null;
  const mostrarParticular = tipo === 'particular' || tipo === null;
  const ambos = tipo === null;

  return (
    <div className="bg-cream min-h-screen flex flex-col text-ink">
      <HeaderUtilitario />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-2xl px-5 md:px-8 pt-6 md:pt-10 pb-16 md:pb-20">
          {/* Cabecera de confirmacion */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 18 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="32" cy="32" r="30" stroke="#3F5B4A" strokeWidth="2" fill="rgba(63, 91, 74, 0.08)" />
              <polyline points="20 32 28 40 44 24" fill="none" stroke="#3F5B4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-ink"
              style={{
                fontSize: 'clamp(30px, 5vw, 44px)',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                fontVariationSettings: '"opsz" 144, "SOFT" 50',
                outline: 'none',
              }}
            >
              {CONFIRMACION.titulo}
            </h1>
            <p className="font-body text-ink/75" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: '52ch' }}>
              {CONFIRMACION.bajada}
            </p>
          </div>

          {/* Proximos pasos */}
          <h2
            className="font-display text-ink"
            style={{
              fontSize: 22,
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
              margin: '40px 0 16px',
            }}
          >
            Tus próximos pasos
          </h2>

          {/* Paso 1: consentimiento (accion primaria) */}
          <Tarjeta numero={1} titulo={CONSENTIMIENTO.titulo}>
            <p className="font-body text-ink/80" style={parrafo}>{CONSENTIMIENTO.texto}</p>
            <div style={{ marginTop: 14 }}>
              <Button as="a" href={CONSENTIMIENTO.ruta} variant="primary" size="lg">
                {CONSENTIMIENTO.ctaTexto}
              </Button>
            </div>
          </Tarjeta>

          {/* Paso 2: pago */}
          <Tarjeta numero={2} titulo="Paga tu sesión antes de la hora">
            {ambos && (
              <p className="font-body text-ink/70" style={{ ...parrafo, fontSize: 14 }}>
                Sigue el bloque que corresponde a la sesión que reservaste.
              </p>
            )}
            {mostrarFonasa && <BloqueFonasa data={pasosFonasa(slug)} />}
            {mostrarParticular && <BloqueParticular data={pasosParticular()} conSeparador={ambos} />}
          </Tarjeta>

          {/* Paso 3: llegada a la videollamada */}
          <Tarjeta numero={3} titulo={LLEGADA.titulo}>
            <p className="font-body text-ink/80" style={parrafo}>{LLEGADA.texto}</p>
            <div style={{ marginTop: 14 }}>
              <Button as="a" href={LLEGADA.url} variant="secondary" size="md" target="_blank" rel="noopener noreferrer">
                {LLEGADA.ctaTexto}
              </Button>
            </div>
          </Tarjeta>

          {/* Cierre: dudas y volver */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <p className="font-body text-ink/75" style={{ fontSize: 15, lineHeight: 1.55 }}>
              ¿Tienes una duda antes de la sesión?
            </p>
            <a
              href={CONTACTO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sage"
              style={{ fontSize: 15, textDecoration: 'underline', textDecorationColor: 'rgba(63, 91, 74, 0.3)', textUnderlineOffset: 2 }}
            >
              Escribirme por WhatsApp
            </a>
            <a
              href="/"
              className="font-body text-ink/55"
              style={{ fontSize: 13, textDecoration: 'underline', textDecorationColor: 'rgba(42, 59, 76, 0.2)', textUnderlineOffset: 2, marginTop: 8 }}
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const parrafo = { fontSize: 15, lineHeight: 1.65, margin: 0 };

function Tarjeta({ numero, titulo, children }) {
  return (
    <div className="bg-offwhite rounded-2xl ring-1 ring-sage/15" style={{ padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span
          className="font-body"
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: 14,
            background: '#3F5B4A',
            color: '#F6F1E8',
            fontSize: 14,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {numero}
        </span>
        <div style={{ flex: 1 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 17, fontVariationSettings: '"opsz" 144, "SOFT" 50', margin: '2px 0 8px' }}
          >
            {titulo}
          </h3>
          {children}
        </div>
      </div>
    </div>
  );
}

function BloqueFonasa({ data }) {
  return (
    <div>
      <p className="font-body text-ink" style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 6px' }}>{data.titulo}</p>
      <p className="font-body text-ink/80" style={parrafo}>{data.intro}</p>
      <ol className="font-body text-ink/80" style={{ fontSize: 15, lineHeight: 1.7, paddingLeft: 20, margin: '8px 0 0' }}>
        {data.pasos.map((p, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{p}</li>
        ))}
      </ol>
      <div style={{ marginTop: 14 }}>
        <Button as="a" href={data.enlace.url} variant="secondary" size="md" target="_blank" rel="noopener noreferrer">
          {data.enlace.texto}
        </Button>
      </div>
    </div>
  );
}

function BloqueParticular({ data, conSeparador }) {
  const t = data.transferencia;
  return (
    <div style={conSeparador ? { marginTop: 22, paddingTop: 22, borderTop: '1px solid rgba(63,91,74,0.15)' } : undefined}>
      <p className="font-body text-ink" style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 6px' }}>{data.titulo}</p>
      <p className="font-body text-ink/80" style={parrafo}>{data.intro}</p>

      <p className="font-body text-ink" style={{ fontSize: 15, fontWeight: 600, margin: '14px 0 6px' }}>Opción 1: WebPay</p>
      <Button as="a" href={data.webpay.url} variant="primary" size="md" target="_blank" rel="noopener noreferrer">
        {data.webpay.texto}
      </Button>

      <p className="font-body text-ink" style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 6px' }}>Opción 2: transferencia electrónica</p>
      <dl className="font-body text-ink/80" style={{ fontSize: 15, lineHeight: 1.65, margin: 0 }}>
        <FilaDato etiqueta="Banco" valor={t.banco} />
        <FilaDato etiqueta="N° de cuenta" valor={t.cuenta} />
        <FilaDato etiqueta="Titular" valor={t.titular} />
        <FilaDato etiqueta="RUT" valor={t.rut} />
        <FilaDato etiqueta="Comprobante a" valor={t.correoComprobante} />
      </dl>
      <p className="font-body text-ink/80" style={{ ...parrafo, marginTop: 12 }}>{data.nota}</p>
    </div>
  );
}

function FilaDato({ etiqueta, valor }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '2px 0' }}>
      <dt style={{ color: 'rgba(42,59,76,0.6)', minWidth: 130 }}>{etiqueta}</dt>
      <dd style={{ margin: 0, wordBreak: 'break-word' }}>{valor}</dd>
    </div>
  );
}
