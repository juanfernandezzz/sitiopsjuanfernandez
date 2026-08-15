/**
 * LIMITADOR DE AGENDA - v2 (ciclo C49)
 *
 * Bloquea el resto del día cuando se alcanza el tope de sesiones de ese día de
 * la semana, para que Cal.com deje de ofrecer horas.
 *
 * QUE CAMBIA RESPECTO DE LA VERSION ANTERIOR
 *
 * 1. CONTEO. Antes se contaban solo los eventos de 45 minutos que llevaban
 *    "cal.com" en la descripción. Las horas fijas de continuidad se crean a mano
 *    en Google Calendar y NO llevan esa marca, así que no se contaban: el día
 *    admitía su tope completo de reservas de Cal.com ADEMAS de las horas fijas.
 *    Sobrecupo garantizado. Ahora se cuenta toda sesión de 45 minutos que no sea
 *    un bloqueo creado por este script.
 *
 * 2. BORRADO. Este script SOLO puede eliminar eventos que él mismo creó, y los
 *    reconoce por la firma exacta en su descripción. Cualquier otro evento del
 *    calendario es intocable, sin excepción y sin importar su forma.
 *
 * INSTALACION
 *   Reemplaza el contenido del archivo existente en script.google.com. NO crees
 *   un proyecto nuevo: el disparador temporal está asociado a este.
 *   Después ejecuta probarConteo() una vez: solo escribe en el registro, no toca
 *   el calendario.
 */

// --------------------------------------------------------------------------
// Configuración
// --------------------------------------------------------------------------

var CALENDARIO = 'juanfernandezpsicologo@gmail.com';

// Tope de sesiones por día de la semana. Indexado por Date.getDay():
// 0 domingo, 1 lunes ... 6 sábado. El domingo no se gestiona.
var LIMITES_POR_DIA_SEMANA = {
  1: 5, // lunes
  2: 4, // martes
  3: 4, // miércoles
  4: 4, // jueves
  5: 6, // viernes
  6: 3, // sábado
};

// Cuántos días hacia adelante revisa cada corrida.
var DIAS_A_REVISAR = 30;

// Duración exacta de una sesión, en minutos. Solo los eventos con esta duración
// cuentan como sesión.
var DURACION_SESION_MIN = 45;

// FIRMA: la marca que identifica a los eventos creados por este script. Es la
// única llave que autoriza un borrado. No la cambies sin limpiar antes los
// bloqueos anteriores a mano, o quedarán huérfanos y nadie podrá removerlos.
var FIRMA = 'BLOQUEO-AUTOMATICO-v2';

var TITULO_BLOQUEO = 'Agenda completa';

// --------------------------------------------------------------------------
// Utilidades
// --------------------------------------------------------------------------

function _cal() {
  return CalendarApp.getCalendarById(CALENDARIO);
}

function _inicioDelDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}

function _finDelDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0);
}

function _duracionMin(ev) {
  return Math.round((ev.getEndTime().getTime() - ev.getStartTime().getTime()) / 60000);
}

/**
 * Un evento es bloqueo propio si su descripción contiene la firma. Se comprueba
 * SOLO por firma: ni el título ni la duración ni el color autorizan un borrado.
 */
function _esBloqueoPropio(ev) {
  var desc = '';
  try {
    desc = ev.getDescription() || '';
  } catch (e) {
    return false;
  }
  return desc.indexOf(FIRMA) !== -1;
}

/**
 * Cuenta como sesión cualquier evento de exactamente 45 minutos que no sea un
 * bloqueo propio. Cubre por igual las reservas de Cal.com y las horas fijas de
 * continuidad, sin depender de etiquetas en la descripción.
 */
function _esSesion(ev) {
  if (_esBloqueoPropio(ev)) return false;
  if (ev.isAllDayEvent()) return false;
  return _duracionMin(ev) === DURACION_SESION_MIN;
}

// --------------------------------------------------------------------------
// Núcleo
// --------------------------------------------------------------------------

function _sesionesDelDia(cal, dia) {
  var evs = cal.getEvents(_inicioDelDia(dia), _finDelDia(dia));
  var n = 0;
  for (var i = 0; i < evs.length; i++) {
    if (_esSesion(evs[i])) n++;
  }
  return n;
}

function _bloqueosDelDia(cal, dia) {
  var evs = cal.getEvents(_inicioDelDia(dia), _finDelDia(dia));
  var out = [];
  for (var i = 0; i < evs.length; i++) {
    if (_esBloqueoPropio(evs[i])) out.push(evs[i]);
  }
  return out;
}

function _crearBloqueo(cal, dia) {
  var ev = cal.createEvent(TITULO_BLOQUEO, _inicioDelDia(dia), _finDelDia(dia), {
    description: FIRMA + '\nCreado automáticamente. No editar a mano.',
  });
  // OPAQUE marca el evento como ocupado; Cal.com deja de ofrecer horas ese día.
  // El nombre correcto es CalendarApp.EventTransparency, no CalendarApp.Transparency.
  ev.setTransparency(CalendarApp.EventTransparency.OPAQUE);
  return ev;
}

/**
 * Corrida principal. Idempotente: si el bloqueo ya existe no lo duplica, y si el
 * día dejó de estar lleno (por una cancelación) retira el bloqueo propio.
 */
function ejecutarLimitador() {
  var cal = _cal();
  if (!cal) {
    Logger.log('ERROR: no se pudo abrir el calendario ' + CALENDARIO);
    return;
  }

  var hoy = new Date();

  for (var i = 0; i < DIAS_A_REVISAR; i++) {
    var dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    var limite = LIMITES_POR_DIA_SEMANA[dia.getDay()];

    // Domingo u otro día sin tope declarado: no se gestiona.
    if (typeof limite !== 'number') continue;

    var sesiones = _sesionesDelDia(cal, dia);
    var bloqueos = _bloqueosDelDia(cal, dia);
    var lleno = sesiones >= limite;

    if (lleno && bloqueos.length === 0) {
      _crearBloqueo(cal, dia);
      Logger.log('Bloqueo creado ' + dia.toDateString() + ' (' + sesiones + '/' + limite + ')');
    } else if (lleno && bloqueos.length > 1) {
      // Duplicados: deja uno y retira el resto. Solo bloqueos propios.
      for (var j = 1; j < bloqueos.length; j++) bloqueos[j].deleteEvent();
      Logger.log('Duplicados retirados ' + dia.toDateString());
    } else if (!lleno && bloqueos.length > 0) {
      for (var k = 0; k < bloqueos.length; k++) bloqueos[k].deleteEvent();
      Logger.log(
        'Bloqueo retirado ' + dia.toDateString() + ' (' + sesiones + '/' + limite + ')'
      );
    }
  }
}

// --------------------------------------------------------------------------
// Verificación previa. NO toca el calendario: solo escribe en el registro.
// Ejecútala una vez después de instalar, antes de dejar el disparador suelto.
// --------------------------------------------------------------------------

function probarConteo() {
  var cal = _cal();
  if (!cal) {
    Logger.log('ERROR: no se pudo abrir el calendario ' + CALENDARIO);
    return;
  }
  var hoy = new Date();
  Logger.log('--- Conteo de verificación, sin escribir nada ---');
  for (var i = 0; i < 14; i++) {
    var dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    var limite = LIMITES_POR_DIA_SEMANA[dia.getDay()];
    if (typeof limite !== 'number') {
      Logger.log(dia.toDateString() + ': sin gestionar');
      continue;
    }
    var evs = cal.getEvents(_inicioDelDia(dia), _finDelDia(dia));
    var sesiones = 0;
    var propios = 0;
    var otros = 0;
    for (var j = 0; j < evs.length; j++) {
      if (_esBloqueoPropio(evs[j])) propios++;
      else if (_esSesion(evs[j])) sesiones++;
      else otros++;
    }
    Logger.log(
      dia.toDateString() +
        ': sesiones ' + sesiones + '/' + limite +
        ' | bloqueos propios ' + propios +
        ' | otros eventos intocables ' + otros
    );
  }
}
