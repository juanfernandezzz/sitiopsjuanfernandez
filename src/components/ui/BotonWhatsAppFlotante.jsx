/**
 * Botón flotante de WhatsApp. Enlace directo, sin widget.
 *
 * QUE REEMPLAZA Y POR QUE (C51)
 *   Hasta C50 esto era `react-floating-whatsapp`. Ese componente no abre
 *   WhatsApp: abre una ventana IMITANDO WhatsApp dentro del propio sitio, con
 *   un avatar recortado a la fuerza (la foto de Juan salía aplastada), un
 *   burbujeo de saludo falso y un campo de texto vacío. Recién al escribir ahí
 *   y pulsar enviar salta a WhatsApp: con lo que la persona haya tecleado, o
 *   en blanco si no tecleó nada. Es decir: el mensaje prellenado se perdía
 *   entero y se añadía un paso extra justo en el momento de mayor intención.
 *
 *   Un <a> a wa.me no tiene ninguno de esos problemas: en móvil abre la app
 *   directamente en la conversación, con el texto ya escrito y listo para
 *   enviar. Un toque, no tres. De paso salen del bundle los ~196 KB de
 *   imágenes en base64 que la librería incrustaba.
 *
 * EL MENSAJE LLEVA LA FECHA REAL
 *   Se reusa la misma disponibilidad en vivo que el resto del sitio (una sola
 *   petición memoizada, compartida). Si el dato llegó, el mensaje nombra la
 *   próxima hora disponible: eso convierte un "hola" anónimo en una
 *   conversación que ya empezó, y le ahorra a Juan la primera pregunta. Si el
 *   dato no llegó o no es confiable, el mensaje cae a la versión sin fecha:
 *   nunca se inventa una hora.
 *
 * POSICION
 *   Esquina inferior derecha. La barra fija de disponibilidad de móvil reserva
 *   esa banda con `pr-20`, así que no se pisan.
 */
import { CONTACTO } from '../../lib/contacto';
import { ESTADOS, mensajeWhatsApp, urlWhatsApp } from '../../lib/disponibilidad';
import { usarDisponibilidad } from './usarDisponibilidad';

export default function BotonWhatsAppFlotante({ evento = 'primeraSesionFonasa' }) {
  const datos = usarDisponibilidad(evento);

  // Solo se nombra la fecha cuando el estado es confiable. En DESCONOCIDO el
  // módulo de disponibilidad directamente no se pinta; aquí el botón sí se
  // pinta (es un canal de contacto, no un indicador), pero sin fecha.
  const fecha =
    datos && datos.estado !== ESTADOS.DESCONOCIDO ? datos.larga : null;

  const texto = mensajeWhatsApp(fecha, 'una primera sesión');
  const href = urlWhatsApp(CONTACTO.whatsappE164, texto);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir por WhatsApp al ${CONTACTO.whatsappDisplay}`}
      data-wa="flotante"
      className="group fixed right-4 bottom-4 z-50 flex items-center gap-0 rounded-full bg-sage text-offwhite shadow-[0_6px_20px_-6px_rgba(42,59,76,0.45)] ring-1 ring-offwhite/20 transition-transform duration-200 ease-out hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-deep"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <span className="flex h-14 w-14 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 fill-current"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.38-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
          <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.82 9.82 0 0 0 4.69 1.19h.01c5.43 0 9.85-4.42 9.85-9.86 0-2.63-1.02-5.11-2.88-6.97A9.79 9.79 0 0 0 12.04 2Zm0 17.96h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.15 8.15 0 0 1-1.25-4.36c0-4.52 3.68-8.19 8.2-8.19 2.19 0 4.25.85 5.8 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.52-3.68 8.19-8.2 8.19Z" />
        </svg>
      </span>

      {/* La etiqueta solo existe en pantallas con puntero: en móvil el espacio
          es de la barra de disponibilidad, y un botón que se ensancha solo
          taparía la fecha. */}
      <span className="hidden md:block max-w-0 overflow-hidden whitespace-nowrap font-body text-[14px] font-medium transition-[max-width,padding] duration-300 ease-out group-hover:max-w-[220px] group-hover:pr-5 group-focus-visible:max-w-[220px] group-focus-visible:pr-5">
        Escríbeme por WhatsApp
      </span>
    </a>
  );
}
