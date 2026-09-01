/**
 * Las cuatro sesiones agendables. Fuente unica consumida por el sitio
 * (ModalTipoSesion, HeaderAgendarMenu) y por la app (pantalla Agendar). key es
 * el NOMBRE de la propiedad en CAL_EVENTS (cal.js), nunca el slug directo.
 *
 * C36: campo `detalle` unificado (antes detalleModal web y detalleApp app). El
 * precio NO vive en el texto: cada superficie renderiza `precio` como dato
 * estructurado junto al titulo, asi el monto sale siempre de PRECIOS y el copy
 * no puede derivar entre superficies.
 *
 * C50: el control y avance SALIO de este arreglo. Ningun paciente reserva su
 * propio control: los agenda Juan. El evento sigue existiendo en Cal.com pero
 * quedo OCULTO, accesible solo por URL directa, y por eso no puede figurar como
 * opcion publica: llevaria a un evento que no acepta reservas desde la pagina
 * publica. Su slug sigue en CAL_EVENTS (cal.js) para el webhook y los correos.
 *
 * C40: bandera `sinCupos`. Una sesion con sinCupos: true sigue existiendo en el
 * sitio (no se borra: la gente la busca) pero no toma reservas. Cada superficie
 * la marca con la etiqueta y desactiva su enlace a Cal.com. Para reabrirla basta
 * con quitar la bandera aqui: no hay que tocar ningun componente.
 *
 * C54: la lista se arma segun OFERTA_FONASA_VISIBLE (el modo del hero). En modo
 * particular la primera sesion Fonasa SALE del arreglo, y la de pareja se queda
 * pero sin marca ni copago Fonasa: en esa campana el copago hace pensar que se
 * puede usar el bono, y el bono no esta disponible para entrar. La terapia de
 * pareja se muestra en los DOS modos, siempre con la etiqueta de sin cupos.
 * Como este arreglo es la fuente unica, el cambio propaga solo a Precios, al
 * menu del header, al modal de tipo de sesion, a la seccion Agendar y a la app.
 *
 * `precio` puede venir en null: significa que esa sesion no tiene monto que
 * mostrar en esta campana. Cada superficie lo omite en vez de imprimir vacio.
 */
import { PRECIOS } from './precios';
import { INGRESO_FONASA_ABIERTO, OFERTA_FONASA_VISIBLE } from './modalidades';

// Texto unico de la etiqueta. Vive aqui para que las cuatro superficies de
// agendamiento (Precios, menu del header, modal de tipo de sesion, seccion
// Agendar) y la app digan exactamente lo mismo.
export const AVISO_SIN_CUPOS = 'Sin cupos por ahora';

export const SESIONES = [
  {
    key: 'particular',
    titulo: 'Sesión particular',
    precio: PRECIOS.particular.display,
    detalle: 'Si tienes Isapre, otra previsión o ninguna. Boleta de honorarios para solicitar reembolso según tu plan.',
    destacada: true,
    cta: 'Agendar sesión particular',
  },
  ...(OFERTA_FONASA_VISIBLE
    ? [
        {
          key: 'primeraSesionFonasa',
          titulo: 'Primera sesión con bono Fonasa',
          precio: PRECIOS.fonasaCopago.display,
          detalle: 'Si es tu primera vez conmigo. Conversamos y entendemos juntos qué te trae.',
          cta: 'Agendar primera sesión',
          sinCupos: !INGRESO_FONASA_ABIERTO,
        },
      ]
    : []),
  {
    key: 'parejaFonasa',
    titulo: OFERTA_FONASA_VISIBLE
      ? 'Sesión de pareja con bono Fonasa'
      : 'Terapia de pareja',
    precio: OFERTA_FONASA_VISIBLE ? PRECIOS.fonasaCopago.display : null,
    detalle: 'Con ambos miembros presentes. Hoy está sin cupos.',
    cta: 'Agendar sesión de pareja',
    sinCupos: true,
  },
];
