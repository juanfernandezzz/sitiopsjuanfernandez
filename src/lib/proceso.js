/**
 * Proceso y confianza. Fuente unica de copy consumida por el sitio
 * (ComoTrabajo, que fusiona el arco terapeutico y la logistica de conexion) y
 * por la app (pantalla Agendar). Los
 * iconos NO viven aqui: cada superficie mapea la clave a su set (SVG propios en
 * el sitio, Feather en la app), porque la presentacion difiere; lo que se
 * sincroniza es el texto.
 */
import { PRECIOS } from './precios';

// Como funciona una sesion online (logistica). Sitio: bloque de conexion dentro
// de ComoTrabajo. App: pantalla Agendar (bloque "Como es el proceso" y trio de
// confianza).
export const PROCESO_ONLINE = {
  eyebrow: 'Teleconsulta paso a paso',
  titulo: 'Cómo funciona una sesión online',
  sub: 'Es más simple de lo que parece. En 4 pasos.',
  pasos: [
    {
      num: '01',
      titulo: 'Tu reserva queda confirmada',
      texto: 'Recibes en tu email la confirmación con fecha, hora y enlace de la sesión. Todo desde Cal.com.',
      nota: 'Si vas con bono Fonasa, lo compras y me envías el folio antes de la sesión, sin excepción. La sesión particular se paga después de la sesión, por transferencia. Te llega todo detallado en el mismo correo.',
    },
    {
      num: '02',
      titulo: 'Recibes el link de la sala',
      texto: 'Te envío por email el link a mi sala virtual en Doxy.me. No necesitas descargar ni instalar nada.',
    },
    {
      num: '03',
      titulo: 'A tu hora, abres el link',
      texto: 'Desde cualquier navegador (Chrome, Safari, Firefox). Das permiso a cámara y micrófono. Quedas en sala de espera.',
    },
    {
      num: '04',
      titulo: 'Yo te admito a la sesión',
      texto: 'Cuando estoy listo, te conecto. La sesión transcurre como en cualquier consulta, solo que desde donde estés.',
    },
  ],
  confianza: [
    { clave: 'conexion', titulo: 'Conexión estable', texto: 'Wi-Fi recomendado' },
    { clave: 'privacidad', titulo: 'Privacidad', texto: 'Lugar tranquilo y solo tú' },
    { clave: 'cifrado', titulo: 'Llamada cifrada', texto: 'Conexión protegida' },
  ],
  // C52c: dejaba de liderar con el copago Fonasa, que ya no se puede agendar.
  notaPago: `El pago es simple: la sesión particular cuesta ${PRECIOS.particular.display} y la pagas por transferencia después de la sesión.`,
  cierre: 'Si en cualquier momento la conexión falla, te llamo o coordinamos por WhatsApp para retomar.',
};

// Como trabajo (arco terapeutico). Sitio: ComoTrabajo. Centralizado para que la
// app pueda adoptarlo sin volver a redactar.
export const PROCESO_TRABAJO = {
  eyebrow: 'Cómo trabajo',
  titulo: 'Un proceso simple, paso por paso.',
  sub: 'Acompañamiento individual por videollamada. Sesiones de 45 minutos.',
  pasos: [
    {
      num: '01',
      titulo: 'Agendas tu sesión',
      cuerpo: 'Eliges el horario que te acomode y reservas en línea. Recibes el enlace de videollamada al confirmar la reserva. El pago de la sesión particular es por transferencia, después de la sesión.',
    },
    {
      num: '02',
      titulo: 'Primera sesión',
      cuerpo: 'Exploramos juntos el motivo de tu consulta, evaluamos tu situación actual y definimos los objetivos del proceso terapéutico.',
    },
    {
      num: '03',
      titulo: 'Sesiones de avance',
      cuerpo: 'Trabajamos en los objetivos definidos, revisamos avances y obstáculos, y dejamos espacio para lo que necesites traer al proceso.',
    },
  ],
  // C52d: la certificacion de Fonasa se mantiene donde responde una pregunta
  // (FAQ de proteccion de datos, footer, consentimiento, politica de privacidad
  // y schema). Aca gastaba la linea de cierre en una credencial institucional en
  // vez de en lo que le importa a quien va a entrar a la sala.
  cierreTrust:
    'Videollamada por Doxy.me. Conexión segura y cifrada, sin descargas ni instalaciones. No grabo las sesiones.',
};
