/**
 * Etiqueta "Sin cupos por ahora" y el velo que apaga la tarjeta que la lleva.
 *
 * El velo es crema translucido, no oscuro: baja el contraste de la tarjeta para
 * que se lea como no disponible, pero el contenido (precio, codigo Fonasa,
 * descripcion) sigue visible detras. La etiqueta va centrada sobre el velo, con
 * fondo solido para que nunca compita con el texto que queda abajo.
 *
 * El texto vive en AVISO_SIN_CUPOS (lib/sesiones.js) para que las cuatro
 * superficies de agendamiento digan exactamente lo mismo.
 */
import { AVISO_SIN_CUPOS } from '../../lib/sesiones';

// `sobreVelo` cambia el fondo de la pildora en vez de dejar que el llamador
// mande un bg-* por className: dos utilidades bg-* compiten y gana la que este
// antes en el CSS, no la que se escriba despues.
export function EtiquetaSinCupos({ className = '', sobreVelo = false }) {
  const fondo = sobreVelo
    ? 'bg-offwhite ring-sage/35 shadow-[0_2px_14px_rgba(42,59,76,0.10)]'
    : 'bg-cream ring-sage/25';

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${fondo} text-sage font-body text-[12px] font-medium tracking-[0.02em] px-3 py-1.5 rounded-full ring-1 select-none whitespace-nowrap ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-sage/45 flex-shrink-0"
        aria-hidden="true"
      />
      {AVISO_SIN_CUPOS}
    </span>
  );
}

/**
 * Velo + etiqueta centrada. Se monta dentro de un contenedor `relative` y lo
 * cubre entero. Captura los clics (sin pointer-events-none) para que nada de
 * lo que queda debajo sea accionable, aunque los botones ya van disabled.
 *
 * `radio` acompaña el rounded del contenedor que lo hospeda.
 */
export default function VeloSinCupos({ radio = 'rounded-2xl' }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex items-center justify-center px-4 ${radio}`}
      style={{
        // Crema del sitio al 78%: apaga fuerte sin oscurecer.
        backgroundColor: 'rgba(246, 241, 232, 0.78)',
        backdropFilter: 'saturate(0.6)',
        WebkitBackdropFilter: 'saturate(0.6)',
      }}
    >
      <EtiquetaSinCupos sobreVelo />
    </div>
  );
}
