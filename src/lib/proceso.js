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
      nota: 'Antes de la sesión: compras tu bono Fonasa y me envías el folio, o pagas la sesión particular por transferencia o WebPay. Te lo recuerdo en el mismo correo.',
    },
    {
      num: '02',
      titulo: 'Recibes el link de la sala',
      texto: 'Te envío por email el link a mi sala virtual en Doxy.me, la plataforma de teleconsulta que certifica Fonasa. No necesitas descargar nada.',
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
  notaPago: `El pago es simple: copago de ${PRECIOS.fonasaCopago.display} con bono Fonasa, o ${PRECIOS.particular.display} en modalidad particular. Lo eliges al momento de agendar.`,
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
      cuerpo: 'Eliges horario y modalidad, con bono Fonasa o particular. Si usas bono Fonasa, lo emites y lo envías por WhatsApp antes del horario de la sesión. Recibes el enlace de videollamada al confirmar la reserva.',
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
  cierreTrust:
    'Videollamada por Doxy.me, plataforma certificada por Fonasa para teleconsulta. Conexión segura, sin descargas ni instalaciones.',
};
