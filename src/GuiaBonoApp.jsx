import HeaderUtilitario from './components/layout/HeaderUtilitario';
import Footer from './components/layout/Footer';
import { PRESTADOR, CONTACTO, FONASA_CODIGOS } from './lib/contacto';
import { PRECIOS } from './lib/precios';
import { INGRESO_FONASA_ABIERTO } from './lib/modalidades';

/**
 * Guía del Bono Web de Fonasa, en página propia (C54).
 *
 * POR QUE DEJO DE SER UN MODAL
 *   Vivía como ModalGuiaFonasa, abierto desde la tarjeta de Precios y desde el
 *   FAQ. Eso la ponía en medio del recorrido de venta de quien llega por un
 *   anuncio de sesión particular, que no puede usar el bono. Aquí es una página
 *   de apoyo: la usan los pacientes Fonasa que ya están en tratamiento, se
 *   enlaza desde el pie del sitio en los dos modos del hero, y es alcanzable
 *   siempre, sin importar si el ingreso Fonasa está abierto.
 *
 * POR QUE NO DEPENDE DEL MODO
 *   El modo del hero decide qué campaña se muestra. Esta página no es campaña:
 *   es documentación operativa de un trámite que los pacientes activos siguen
 *   haciendo cada mes. Por eso los códigos de prestación viven aquí completos
 *   aunque el resto del sitio los oculte.
 *
 * LO UNICO QUE SI MIRA UN INTERRUPTOR es el cierre: con el ingreso cerrado no
 * ofrece agendar una primera sesión Fonasa que no existe.
 */

const WA_MENSAJE = encodeURIComponent(
  'Hola Juan, tengo una duda sobre la compra del bono Fonasa.'
);
const WA_HREF = `${CONTACTO.whatsappUrl}?text=${WA_MENSAJE}`;

const PASOS = [
  {
    titulo: 'Entra a tu cuenta de Mi Fonasa',
    desc:
      'El portal para comprar el bono es https://mi.fonasa.gob.cl, que no es el mismo sitio institucional fonasa.cl. Vas a necesitar tu ClaveÚnica.',
  },
  {
    titulo: 'Inicia sesión con ClaveÚnica',
    desc:
      'Si todavía no tienes ClaveÚnica, puedes obtenerla en claveunica.gob.cl con tu cédula de identidad. Es gratis y se hace una vez.',
  },
  {
    titulo: 'Busca la opción de compra de bonos en línea',
    desc:
      'Una vez dentro del portal, navega al área de trámites o servicios y selecciona la opción de compra de bonos web.',
  },
  {
    titulo: 'Selecciona el prestador',
    desc:
      'Elige la búsqueda por RUT del prestador e ingresa el mío (lo tienes en el bloque de datos de arriba). Verás mi nombre completo y podrás seleccionarlo.',
  },
  {
    titulo: 'Selecciona el código de prestación',
    desc:
      `Elige uno de los códigos disponibles según el tipo de sesión: 09 08 101 o 09 08 102 para individual, 09 08 103 para pareja. El copago para tramos B, C y D es de ${PRECIOS.fonasaCopago.display}.`,
  },
  {
    titulo: 'Paga el bono en línea',
    desc:
      'Confirma el monto y completa el pago con los medios habilitados por Fonasa (WebPay u otros). Recibirás el bono por email con un folio único.',
  },
  {
    titulo: 'Envíame el folio antes de la sesión',
    desc:
      'Por WhatsApp o por email. Sin el folio no puedo registrar la prestación en Fonasa. El bono tiene 30 días de vigencia desde su emisión.',
  },
];

const ADVERTENCIAS = [
  'Tramo Fonasa A no accede a esta modalidad. La atención para tramo A es gratuita en la red pública.',
  'El bono debe comprarse antes de la sesión, no después.',
  'Asegúrate de elegir un código de la familia 0908 (telerehabilitación). Los códigos presenciales son distintos y no aplican a sesiones online.',
  'El bono caduca a los 30 días desde su emisión.',
];

// Literales del arancel Fonasa. Se muestran tal cual los imprime el portal para
// que el código que se lee aquí calce con el que se selecciona allá.
const CODIGOS_LITERALES = [
  "09 08 101 Telerehabilitación: Psicólogo clínico (sesiones 45')",
  '09 08 102 Telerehabilitación: Psicoterapia individual',
  '09 08 103 Telerehabilitación: Sesión de psicoterapia de pareja (con ambos miembros)',
];

export default function GuiaBonoApp() {
  return (
    <div className="bg-cream min-h-screen flex flex-col text-ink">
      <HeaderUtilitario />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-5 md:px-8 pt-6 md:pt-10 pb-16 md:pb-20">
          <p
            className="font-body uppercase tracking-widest text-sage mb-3"
            style={{ fontSize: 13 }}
          >
            Bono Fonasa Modalidad Libre Elección
          </p>
          <h1
            className="font-display text-ink text-balance mb-4"
            style={{
              fontSize: 'clamp(34px, 6vw, 54px)',
              fontVariationSettings: '"opsz" 144, "SOFT" 50',
              lineHeight: 1.08,
            }}
          >
            Cómo comprar tu bono Fonasa paso a paso
          </h1>
          <p
            className="font-body text-ink/80"
            style={{ fontSize: 18, lineHeight: 1.6, maxWidth: '58ch' }}
          >
            Tiempo estimado: 5 minutos, y se hace completo por internet. Esta
            guía es para quienes se atienden conmigo con bono Fonasa.
          </p>

          {/* Datos del prestador */}
          <section
            aria-labelledby="datos-prestador"
            className="mt-10 rounded-2xl bg-offwhite ring-1 ring-sage/20 p-6 md:p-7"
          >
            <h2
              id="datos-prestador"
              className="font-display text-ink mb-3"
              style={{ fontSize: 20 }}
            >
              Datos para que compres el bono
            </h2>
            <ul
              className="font-body text-ink/80"
              style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 15, lineHeight: 1.8 }}
            >
              <li>
                <strong className="font-semibold text-ink">RUT prestador:</strong>{' '}
                {PRESTADOR.rut}
              </li>
              <li>
                <strong className="font-semibold text-ink">Nombre:</strong>{' '}
                {PRESTADOR.nombreCompleto}
              </li>
              <li>
                <strong className="font-semibold text-ink">Región y comuna:</strong>{' '}
                {PRESTADOR.regionBono}, {PRESTADOR.comunaBono}. El formulario de
                Fonasa los pide para emitir el bono; la sesión sigue siendo
                online, desde donde tú estés.
              </li>
              <li className="mt-2">
                <strong className="font-semibold text-ink">Códigos disponibles:</strong>
                <ul className="list-disc pl-6 mt-1 marker:text-sage/50">
                  {CODIGOS_LITERALES.map((linea) => (
                    <li key={linea}>{linea}</li>
                  ))}
                </ul>
              </li>
            </ul>
          </section>

          {/* Los 7 pasos */}
          <h2
            className="font-display text-ink mt-14 mb-6"
            style={{ fontSize: 'clamp(26px, 3.5vw, 34px)', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            Los siete pasos
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="flex gap-5 mb-8 last:mb-0">
                <span
                  className="font-display text-sage/60 flex-shrink-0"
                  aria-hidden="true"
                  style={{
                    fontSize: 44,
                    fontWeight: 300,
                    lineHeight: 1,
                    minWidth: 46,
                    fontVariationSettings: '"opsz" 144',
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-ink mb-1.5" style={{ fontSize: 19, lineHeight: 1.3 }}>
                    <span className="sr-only">{`Paso ${i + 1}: `}</span>
                    {paso.titulo}
                  </h3>
                  <p
                    className="font-body text-ink/75"
                    style={{ fontSize: 16, lineHeight: 1.65, margin: 0, maxWidth: '58ch' }}
                  >
                    {paso.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Errores comunes */}
          <section
            aria-labelledby="errores-comunes"
            className="mt-14"
            style={{
              backgroundColor: 'rgba(201, 123, 94, 0.08)',
              borderLeft: '3px solid #C97B5E',
              padding: 20,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <h2
              id="errores-comunes"
              className="font-display mb-3"
              style={{ fontSize: 18, color: '#B0664A' }}
            >
              Errores comunes a evitar
            </h2>
            <ul
              className="font-body text-ink/80 list-disc marker:text-[#C97B5E]/60"
              style={{ fontSize: 15, lineHeight: 1.75, paddingLeft: 20, margin: 0 }}
            >
              {ADVERTENCIAS.map((texto) => (
                <li key={texto}>{texto}</li>
              ))}
            </ul>
          </section>

          {/* Cierre */}
          <section className="mt-12 bg-offwhite rounded-2xl px-6 py-8 md:px-10 md:py-10 ring-1 ring-sage/15">
            <p
              className="font-body text-ink/80 mb-5"
              style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '52ch' }}
            >
              {INGRESO_FONASA_ABIERTO
                ? 'Con el bono comprado y el folio a mano, ya puedes reservar tu hora.'
                : 'El ingreso con bono Fonasa está sin cupos por ahora: sigo atendiendo con bono a quienes ya están en tratamiento. Si es tu caso y algo del trámite no te calza, escríbeme y lo vemos.'}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href={INGRESO_FONASA_ABIERTO ? '/#agendar' : WA_HREF}
                {...(INGRESO_FONASA_ABIERTO
                  ? {}
                  : { target: '_blank', rel: 'noopener noreferrer' })}
                className="inline-flex items-center justify-center bg-terracotta-deep text-offwhite font-body font-medium rounded-full px-6 py-3 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-light focus-visible:ring-offset-2 focus-visible:ring-offset-offwhite"
                style={{ fontSize: 15 }}
              >
                {INGRESO_FONASA_ABIERTO
                  ? 'Agendar mi sesión ahora'
                  : 'Escribirme por WhatsApp'}
              </a>
              <a
                href="/#precios"
                className="font-body text-sage underline decoration-sage/30 hover:decoration-sage underline-offset-4 transition-colors duration-200"
                style={{ fontSize: 15 }}
              >
                Ver todos los valores →
              </a>
            </div>
          </section>

          {/* Resumen de codigos, en lenguaje de paciente */}
          <p
            className="font-body text-ink/60 mt-10"
            style={{ fontSize: 13.5, lineHeight: 1.7, maxWidth: '58ch' }}
          >
            {`Códigos inscritos: ${FONASA_CODIGOS.map((c) => `${c.codigo} (${c.etiqueta})`).join(', ')}. Copago de ${PRECIOS.fonasaCopago.display} para afiliados de los tramos B, C y D, en Modalidad Libre Elección.`}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
