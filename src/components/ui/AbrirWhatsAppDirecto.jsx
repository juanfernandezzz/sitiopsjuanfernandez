/**
 * Hace que el botón flotante abra WhatsApp de una, en vez de la ventana interna.
 *
 * EL PROBLEMA
 *   `react-floating-whatsapp` no abre WhatsApp al pulsar la burbuja: despliega
 *   una ventana propia que lo imita, con un campo de texto vacío. Recién al
 *   escribir ahí y pulsar enviar salta a la app, con lo que la persona haya
 *   tecleado, o en blanco si no tecleó nada. Es un paso extra justo en el
 *   momento de mayor intención, y el mensaje prellenado nunca llega.
 *
 * POR QUE UN INTERCEPTOR Y NO UN BOTON NUEVO
 *   La burbuja, su animación y su posición se quedan EXACTAMENTE como están:
 *   sigue siendo el mismo componente, con los mismos props, renderizado igual.
 *   Aquí solo se cambia qué pasa al pulsarla. Reescribir el botón habría
 *   cambiado el aspecto, que no es lo que hay que arreglar.
 *
 * COMO FUNCIONA
 *   La librería engancha su handler en el div de la burbuja (fase de burbujeo).
 *   Este listener va en el contenedor y en fase de CAPTURA, así que corre antes;
 *   `stopPropagation` evita que el handler de la librería llegue a ejecutarse y
 *   la ventana interna nunca se despliega. `floating-whatsapp-button` es la
 *   clase por defecto del prop `buttonClassName` de la librería.
 *
 * EL MENSAJE LLEVA LA FECHA REAL
 *   Se reusa la disponibilidad en vivo que el sitio ya pide (misma promesa
 *   memoizada: no añade una petición). Si el dato llegó, el mensaje nombra la
 *   próxima hora disponible con mes incluido: el mensaje se lee días después y
 *   fuera del contexto del sitio, donde "martes 1" a secas es ambiguo. Si el
 *   dato no llegó o no es confiable, cae al mensaje sin fecha: nunca se inventa
 *   una hora.
 */
import { useEffect, useRef } from 'react';
import { CONTACTO } from '../../lib/contacto';
import { ESTADOS, normalizar, mensajeWhatsApp, urlWhatsApp } from '../../lib/disponibilidad';
import { cargarDisponibilidad } from './ModuloDisponibilidad';

const CLASE_BURBUJA = '.floating-whatsapp-button';

export default function AbrirWhatsAppDirecto({ children, evento = 'primeraSesionFonasa' }) {
  const contenedor = useRef(null);
  // En una ref y no en estado: el destino se lee dentro del click, así que no
  // hace falta repintar cuando llega el dato (y repintar remontaría la burbuja).
  const destino = useRef(urlWhatsApp(CONTACTO.whatsappE164, mensajeWhatsApp(null)));

  useEffect(() => {
    let vivo = true;
    cargarDisponibilidad().then((payload) => {
      if (!vivo) return;
      const datos = normalizar(payload, evento);
      if (!datos || datos.estado === ESTADOS.DESCONOCIDO || !datos.larga) return;
      destino.current = urlWhatsApp(
        CONTACTO.whatsappE164,
        mensajeWhatsApp(datos.larga, 'una primera sesión')
      );
    });
    return () => {
      vivo = false;
    };
  }, [evento]);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return undefined;
    const alPulsar = (e) => {
      const burbuja = e.target instanceof Element ? e.target.closest(CLASE_BURBUJA) : null;
      if (!burbuja || !nodo.contains(burbuja)) return;
      e.preventDefault();
      e.stopPropagation();
      window.open(destino.current, '_blank', 'noopener,noreferrer');
    };
    nodo.addEventListener('click', alPulsar, true);
    return () => nodo.removeEventListener('click', alPulsar, true);
  }, []);

  return <div ref={contenedor}>{children}</div>;
}
