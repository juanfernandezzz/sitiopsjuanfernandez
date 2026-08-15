/**
 * HORAS FIJAS DE CONTINUIDAD - ciclo C49
 *
 * Crea un evento recurrente de 45 minutos por paciente estable. Cal.com lee el
 * calendario como ocupado, así que la franja desaparece sola de la disponibilidad
 * pública. El paciente deja de agendar sesión a sesión.
 *
 * ESTE SCRIPT NO BORRA NADA. NUNCA. Si la franja pedida choca con algo que ya
 * existe, la salta y lo deja anotado en el registro para que lo resuelvas a mano.
 *
 * COMO USARLO
 *   1. Llena PACIENTES abajo. Una fila por persona.
 *   2. Ejecuta simularHorasFijas() primero: no escribe nada, solo te dice qué
 *      pasaría y qué choca.
 *   3. Si el resultado es el esperado, ejecuta crearHorasFijas().
 *   4. Se puede volver a ejecutar: las filas ya creadas se detectan y se saltan.
 */

var CALENDARIO_HF = 'juanfernandezpsicologo@gmail.com';
var MARCA_HF = 'HORA-FIJA';
var DURACION_HF_MIN = 45;

// Cuántas semanas hacia adelante se generan las repeticiones. Se puede volver a
// ejecutar más adelante para extenderlas.
var SEMANAS_HF = 26;

// dia: 1 lunes, 2 martes, 3 miércoles, 4 jueves, 5 viernes, 6 sábado.
// hora: "HH:MM" en 24 horas.
// frecuencia: "semanal" o "quincenal".
var PACIENTES = [
  // { nombre: 'Nombre Apellido', dia: 2, hora: '10:00', frecuencia: 'semanal' },
  // { nombre: 'Otro Nombre',     dia: 4, hora: '18:00', frecuencia: 'quincenal' },
];

function _calHF() {
  return CalendarApp.getCalendarById(CALENDARIO_HF);
}

function _proximaFecha(dia, hora) {
  var partes = hora.split(':');
  var h = Number(partes[0]);
  var m = Number(partes[1]);
  var f = new Date();
  f.setHours(h, m, 0, 0);
  // Avanza hasta el próximo día de la semana pedido. Si hoy es ese día pero la
  // hora ya pasó, salta a la semana siguiente.
  while (f.getDay() !== dia || f.getTime() <= Date.now()) {
    f.setDate(f.getDate() + 1);
    f.setHours(h, m, 0, 0);
  }
  return f;
}

function _ocupado(cal, inicio, fin) {
  var evs = cal.getEvents(inicio, fin);
  for (var i = 0; i < evs.length; i++) {
    if (!evs[i].isAllDayEvent()) return evs[i].getTitle();
  }
  return null;
}

function _procesar(escribir) {
  var cal = _calHF();
  if (!cal) {
    Logger.log('ERROR: no se pudo abrir el calendario ' + CALENDARIO_HF);
    return;
  }
  if (PACIENTES.length === 0) {
    Logger.log('No hay pacientes cargados en PACIENTES. Nada que hacer.');
    return;
  }

  Logger.log(escribir ? '--- CREANDO horas fijas ---' : '--- SIMULACION, no se escribe nada ---');

  for (var i = 0; i < PACIENTES.length; i++) {
    var p = PACIENTES[i];
    var paso = p.frecuencia === 'quincenal' ? 2 : 1;
    var base = _proximaFecha(p.dia, p.hora);
    var creados = 0;
    var choques = 0;

    for (var s = 0; s < SEMANAS_HF; s += paso) {
      var inicio = new Date(base.getTime());
      inicio.setDate(inicio.getDate() + s * 7);
      var fin = new Date(inicio.getTime() + DURACION_HF_MIN * 60000);

      var choque = _ocupado(cal, inicio, fin);
      if (choque) {
        choques++;
        Logger.log(
          'CHOQUE ' + p.nombre + ' ' + inicio.toLocaleString() + ' ocupado por: ' + choque
        );
        continue;
      }

      if (escribir) {
        cal.createEvent(p.nombre, inicio, fin, {
          description: MARCA_HF + '\nHora fija de continuidad. Creada por script.',
        });
      }
      creados++;
    }

    Logger.log(
      p.nombre + ': ' + creados + (escribir ? ' creadas' : ' se crearían') +
        ', ' + choques + ' choques saltados'
    );
  }
}

function simularHorasFijas() {
  _procesar(false);
}

function crearHorasFijas() {
  _procesar(true);
}
