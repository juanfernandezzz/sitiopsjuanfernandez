/**
 * Módulo de disponibilidad en vivo. Tres estados, cuatro variantes.
 *
 * ESTADOS
 *   cercano     próxima hora dentro del umbral: fecha, horas del día y CTA a Cal.
 *   lejano      fuera del umbral: la fecha se muestra igual, muy clara, y el CTA
 *               conmuta a WhatsApp con mensaje prellenado que incluye esa fecha.
 *   desconocido no se renderiza nada. Un módulo roto resta más de lo que suma.
 *
 * VARIANTES
 *   hero     píldora compacta junto al CTA primario.
 *   seccion  módulo completo, en Agendar.
 *   chip     micro etiqueta por opción, dentro del modal de tipo de sesión.
 *   barra    barra fija de móvil.
 *
 * DETERMINISMO DEL BUILD
 *   El prerender renderiza dos veces y compara bytes. Por eso el primer render
 *   es SIEMPRE el mismo marcador de posición, sin datos y sin fecha. El dato
 *   entra solo tras la hidratación. El marcador reserva altura para que no haya
 *   salto de layout cuando llega.
 *
 * UNA SOLA PETICION
 *   Varias instancias conviven en la misma página. La promesa se memoiza a nivel
 *   de módulo para que la función de Netlify se llame una vez por carga.
 */
import { useEffect, useState } from 'react';
import { CAL_USERNAME, CAL_EVENTS } from '../../lib/cal';
import { CONTACTO } from '../../lib/contacto';
import {
  ESTADOS,
  AVISO_CUPOS_LIMITADOS,
  normalizar,
  mensajeWhatsApp,
  urlWhatsApp,
} from '../../lib/disponibilidad';

let promesa = null;
function cargar() {
  if (!promesa) {
    promesa = fetch('/.netlify/functions/disponibilidad')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return promesa;
}

const SESION_LEGIBLE = {
  primeraSesionFonasa: 'una primera sesión',
  particular: 'una sesión particular',
};

const SLUG_POR_CLAVE = {
  primeraSesionFonasa: CAL_EVENTS.primeraSesionFonasa,
  particular: CAL_EVENTS.particular,
};

export default function ModuloDisponibilidad({
  evento = 'primeraSesionFonasa',
  variante = 'hero',
  className = '',
}) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vivo = true;
    cargar().then((p) => {
      if (vivo) setDatos(normalizar(p, evento));
    });
    return () => {
      vivo = false;
    };
  }, [evento]);

  const estado = datos ? datos.estado : null;

  // Marcador de posición: idéntico en servidor y cliente, sin texto variable.
  if (!datos) {
    if (variante === 'chip') return <span className="inline-block h-[18px]" aria-hidden="true" />;
    if (variante === 'barra') return null;
    return (
      <div
        className={`h-[34px] ${className}`}
        aria-hidden="true"
        data-disponibilidad="cargando"
      />
    );
  }

  if (estado === ESTADOS.DESCONOCIDO) return null;

  const cercano = estado === ESTADOS.CERCANO;
  const enlaceCal = `https://cal.com/${CAL_USERNAME}/${SLUG_POR_CLAVE[evento]}`;
  const enlaceWa = urlWhatsApp(
    CONTACTO.whatsappE164,
    mensajeWhatsApp(datos.corta, SESION_LEGIBLE[evento] || 'una sesión')
  );

  // Punto verde solo cuando hay disponibilidad cercana. En estado lejano el
  // punto sería una promesa que el texto contradice.
  const punto = (
    <span
      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cercano ? 'bg-terracotta' : 'bg-sage/45'}`}
      aria-hidden="true"
    />
  );

  if (variante === 'chip') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-sage font-body text-[12px] tracking-[0.02em] ${className}`}
      >
        {punto}
        {cercano ? `Próxima: ${datos.corta}` : `Próxima: ${datos.larga}`}
      </span>
    );
  }

  if (variante === 'hero') {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-offwhite ring-1 ring-sage/25 rounded-full px-3.5 py-2 ${className}`}
        data-disponibilidad={estado}
      >
        {punto}
        <span className="font-body text-[13px] text-ink leading-tight">
          <span className="text-sage">Próxima hora disponible: </span>
          <strong className="font-medium">{datos.larga}</strong>
          {cercano && datos.horas.length > 0 ? (
            <span className="text-sage">{`, ${datos.horas.slice(0, 3).join(', ')}`}</span>
          ) : null}
        </span>
      </div>
    );
  }

  if (variante === 'barra') {
    // pr-20 deja libre la banda derecha donde vive el botón flotante de WhatsApp.
    return (
      <div
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden bg-offwhite/95 backdrop-blur border-t border-sage/20 px-4 pr-20 py-2.5 ${className}`}
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
        data-disponibilidad={estado}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-body text-[12.5px] text-ink leading-tight min-w-0">
            <span className="text-sage block">Próxima hora</span>
            <strong className="font-medium block truncate">
              {datos.larga}
              {cercano && datos.horas.length > 0 ? `, ${datos.horas[0]}` : ''}
            </strong>
          </span>
          <a
            href={cercano ? enlaceCal : enlaceWa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-terracotta-deep text-offwhite font-body text-[13px] font-medium rounded-full px-4 py-2"
          >
            {cercano ? 'Agendar' : 'Escribir'}
          </a>
        </div>
      </div>
    );
  }

  // variante "seccion": el módulo completo. C50: el remanente de cupos es el
  // que calcula la función en vivo (datos.cuposSemana), nunca la constante
  // estática: esa cuenta cambia reserva a reserva y la constante mentiría.
  return (
    <div
      className={`bg-offwhite ring-1 ring-sage/25 rounded-2xl p-5 ${className}`}
      data-disponibilidad={estado}
    >
      <div className="flex items-center gap-2 mb-2">
        {punto}
        <span className="font-body text-[12px] uppercase tracking-[0.08em] text-sage">
          Próxima hora disponible
        </span>
      </div>

      <p className="font-display text-[22px] leading-snug text-ink">
        {`Próxima hora: ${datos.larga}.`}
      </p>

      {cercano && datos.horas.length > 0 ? (
        <p className="font-body text-[14px] text-sage mt-1">
          {datos.horas.join(', ')}
        </p>
      ) : null}

      {cercano && typeof datos.cuposSemana === 'number' ? (
        <p className="font-body text-[12.5px] text-sage/90 mt-3">
          {`Cupos disponibles esta semana: ${datos.cuposSemana}`}
        </p>
      ) : (
        <p className="font-body text-[12.5px] text-sage/90 mt-3">{AVISO_CUPOS_LIMITADOS}</p>
      )}

      <div className="mt-4">
        {cercano ? (
          <a
            href={enlaceCal}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-terracotta-deep text-offwhite font-body text-[14px] font-medium rounded-full px-5 py-2.5"
          >
            Ver disponibilidad y agendar
          </a>
        ) : (
          <>
            <a
              href={enlaceWa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-terracotta-deep text-offwhite font-body text-[14px] font-medium rounded-full px-5 py-2.5"
            >
              Escribirme por WhatsApp
            </a>
            <p className="font-body text-[12.5px] text-sage mt-2.5">
              Si se libera una hora antes, te aviso.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
