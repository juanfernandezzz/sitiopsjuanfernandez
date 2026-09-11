/**
 * BARRIDO DE EVENTOS HUERFANOS - ciclo C55
 *
 * QUE PROBLEMA RESUELVE
 * Cal.com crea un evento en el Google Calendar de Juan por cada reserva. Cuando
 * la reserva deja de existir, Cal.com deberia retirar el evento. A veces no lo
 * hace: el evento se queda en el calendario para siempre, ocupando una hora que
 * ya nadie reservo. Un huerfano no es solo ruido visual. El calendario es la
 * fuente de disponibilidad: Cal.com lo lee como ocupado y deja de ofrecer esa
 * hora, y el Limitador de Agenda lo cuenta como sesion del dia y llega antes al
 * tope. Un huerfano cierra agenda real.
 *
 * EL CASO QUE LO MOTIVO
 * El 11 de septiembre aparecieron en el calendario dos eventos, martes 15 y
 * martes 22 a las 12:00, con un paciente que en realidad tiene hora a las 13:00.
 * Chocaban con otra paciente que si tenia las 12:00. Al revisarlo, Cal.com no
 * tenia ninguna reserva a las 12:00: los dos eventos existian solo en Google
 * Calendar, creados por Cal.com en su momento y nunca retirados. Se borraron a
 * mano. Este script existe para contestar la pregunta que quedo abierta: si hay
 * mas huerfanos asi, y cuales.
 *
 * DONDE VA
 * En el proyecto de Apps Script de la Planilla de horas agendadas. Es el unico
 * que tiene a la vez acceso al calendario y un cliente de la API de Cal.com.
 * Este archivo NO trae su propio cliente: reusa obtenerLlaveCal_, pedirCal_ y
 * traerReservas_, que ya viven ahi. Pegado en cualquier otro proyecto no corre,
 * y lo dice en el registro en vez de adivinar.
 *
 * POR QUE EMPAREJA POR HORA MAS CORREO, Y NO POR ID
 * El id del evento de Google termina en "@Cal.com", y es tentador cortarlo por
 * la arroba y buscar ese trozo entre los uid de Cal.com. No se hace. El formato
 * del uid de Cal.com no esta garantizado por su API, puede cambiar sin aviso, y
 * nadie ha verificado que coincida con el prefijo del id del calendario. Si no
 * coincidiera, TODOS los eventos pareceran huerfanos y el barrido vaciaria la
 * agenda. Hora de inicio exacta mas correo del invitado son datos que las dos
 * partes describen igual y que un humano puede comprobar a ojo en la lista.
 * El id se usa para UNA sola cosa, y en direccion segura: solo es candidato a
 * borrarse el evento cuyo id termina en "@Cal.com". Todo lo que Juan creo a
 * mano queda fuera del alcance del script, pase lo que pase.
 *
 * LOS FRENOS, Y CUAL FRENA QUE
 * Hay DOS condiciones de aborto y UN umbral, y no hacen lo mismo.
 *
 *   ABORTO 1. La llamada a Cal.com fallo, dio error, vino en una forma que no
 *             se reconoce, trajo cero reservas vivas, o alguna reserva vino sin
 *             hora o sin correo. Sin con que comparar no se afirma nada.
 *   ABORTO 3. No se pudo leer el correo del invitado de un evento candidato.
 *             Ese evento pareceria huerfano por falta de dato, no por serlo.
 *
 * Los dos abortos cortan el calculo entero: no se lista, no se borra, y el
 * registro dice por que. Los numeros conservan sus nombres de C55 a proposito,
 * para que el codigo y este comentario se puedan leer juntos.
 *
 *   EL UMBRAL.  No aborta. Solo dice que el resultado es sospechoso porque
 *               salieron demasiados huerfanos de golpe, y con eso bloquea el
 *               borrado. listarHuerfanos() avisa y muestra la lista igual.
 *
 * QUE PASO CON EL ABORTO 2 (C56)
 * Existia y estaba roto. Comparaba las reservas vivas contra los eventos de
 * Cal.com del calendario y abortaba cuando habia menos reservas que eventos.
 * Pero cada huerfano ES un evento sin reserva viva, asi que esa desigualdad
 * solo se cumplia cuando NO habia ningun huerfano: en cuanto aparecia uno, el
 * barrido abortaba diciendo que la consulta habia venido incompleta, que era
 * falso. El guardian impedia encontrar aquello para lo que se escribio el
 * archivo. C56 lo saca y pone en su lugar el umbral, que mide lo mismo donde
 * significa algo: sobre el tamano del resultado.
 *
 * POR QUE LA DE BORRAR NACE APAGADA
 * Un falso positivo aqui borra la sesion de un paciente real, y un evento
 * borrado por script no deja rastro util. Ni los abortos ni el umbral cubren el
 * caso de que el emparejamiento este mal pensado. Por eso el orden de uso es
 * siempre: listarHuerfanos(), leer la lista con los ojos, reconocer cada hora, y
 * recien ahi poner CONFIRMO_BORRADO en true. La revision humana no es un
 * tramite: es la unica comprobacion que este script no puede hacerse a si mismo.
 *
 * COMO USARLO
 *   1. Ejecuta listarHuerfanos(). Solo lee. Mira el registro.
 *   2. Si la lista cuadra con lo que ves en el calendario, cambia
 *      CONFIRMO_BORRADO a true aca arriba.
 *   3. Ejecuta borrarHuerfanos().
 *   4. Vuelve a dejar CONFIRMO_BORRADO en false.
 */

// La llave del borrado. En false, borrarHuerfanos() escribe lo que borraria y
// termina sin tocar el calendario. Juan la pone en true a mano, despues de
// revisar la lista, y la devuelve a false al terminar.
var CONFIRMO_BORRADO = false;

var CALENDARIO_BH = 'juanfernandezpsicologo@gmail.com';

// Cuantos dias hacia adelante se miran. Hacia atras no se mira NUNCA: un evento
// pasado ya no ocupa agenda, y borrarlo destruye el registro de lo que ocurrio.
var DIAS_BH = 60;

// La marca del id que dice "esto lo creo Cal.com". Se compara respetando
// mayusculas: si el formato cambiara, no habria candidatos y el barrido no
// borraria nada, que es el lado seguro del error.
var SUFIJO_CAL_BH = '@Cal.com';

// La firma del Limitador de Agenda (limitador.gs). Sus bloqueos son suyos y los
// gestiona el: aca quedan excluidos aunque cumplieran todo lo demas.
var FIRMA_LIMITADOR_BH = 'BLOQUEO-AUTOMATICO-v2';

/*
 * EL UMBRAL DE SOSPECHA, y por que se mide sobre el RESULTADO.
 *
 * La idea de fondo es buena: si a la consulta de Cal.com le falto una pagina,
 * de golpe pareceran huerfanos muchisimos eventos a la vez. Huerfanos de
 * verdad hay pocos y sueltos; una consulta incompleta produce un bloque.
 *
 * C55 midio eso sobre los conteos crudos, comparando reservas contra eventos, y
 * ahi el arreglo estaba mal por construccion. Cada huerfano es, por definicion,
 * un evento sin reserva viva, asi que cada huerfano hace que los eventos
 * superen a las reservas en uno. "Menos reservas que eventos" era exactamente
 * lo mismo que "hay al menos un huerfano": el guardian abortaba justo cuando
 * habia algo que encontrar, e impedia al archivo hacer aquello para lo que se
 * escribio. C56 lo mueve al unico sitio donde la sospecha significa algo, que
 * es el tamano del resultado.
 *
 * Y no frena la lectura: listarHuerfanos() solo mira, asi que avisa y muestra
 * igual. Lo unico que el umbral bloquea es el borrado.
 */

// Tope absoluto. Mas de cinco huerfanos de una sentada no es un calendario
// sucio, es una consulta que vino mal.
var TOPE_HUERFANOS_BH = 5;

// Proporcion maxima sobre los candidatos. Cubre el caso contrario al del tope:
// un calendario chico donde cinco ya serian casi todo.
var PROPORCION_MAX_HUERFANOS_BH = 0.25;

// --------------------------------------------------------------------------
// Utilidades
// --------------------------------------------------------------------------

// El emparejamiento por hora se hace al minuto, no al milisegundo: Cal.com y
// Google no tienen por que coincidir en los segundos, y una diferencia de
// segundos convertiria una reserva viva en huerfano.
function _minutoBH_(fecha) {
  return Math.floor(fecha.getTime() / 60000);
}

function _correoBH_(texto) {
  return String(texto == null ? '' : texto).trim().toLowerCase();
}

function _esArregloBH_(x) {
  return Object.prototype.toString.call(x) === '[object Array]';
}

function _ventanaBH_() {
  var desde = new Date();
  var hasta = new Date(desde.getTime());
  hasta.setDate(hasta.getDate() + DIAS_BH);
  return { desde: desde, hasta: hasta };
}

function _terminaEnBH_(texto, sufijo) {
  if (texto.length < sufijo.length) return false;
  return texto.substring(texto.length - sufijo.length) === sufijo;
}

/**
 * Los eventos que el script puede llegar a mirar. Todo lo que no entra aca es
 * intocable: pasado, dia completo, creado a mano, o bloqueo del Limitador.
 * Cuando una propiedad del evento no se puede leer, el evento se descarta. El
 * error se resuelve siempre hacia "no es candidato".
 */
function _candidatosBH_(cal, ventana) {
  var evs = cal.getEvents(ventana.desde, ventana.hasta);
  var out = [];
  for (var i = 0; i < evs.length; i++) {
    var ev = evs[i];
    try {
      if (ev.isAllDayEvent()) continue;
      // getEvents() devuelve tambien lo que ya empezo y todavia no termina.
      if (ev.getStartTime().getTime() < ventana.desde.getTime()) continue;
      if (!_terminaEnBH_(ev.getId() || '', SUFIJO_CAL_BH)) continue;
      if ((ev.getDescription() || '').indexOf(FIRMA_LIMITADOR_BH) !== -1) continue;
    } catch (e) {
      continue;
    }
    out.push(ev);
  }
  return out;
}

/**
 * Correos de los invitados del evento, sin el de Juan. getGuestList() ya excluye
 * al dueno del calendario, pero se filtra igual por si el calendario figurara
 * tambien como invitado.
 */
function _correosDelEventoBH_(ev) {
  var out = [];
  var invitados;
  try {
    invitados = ev.getGuestList();
  } catch (e) {
    return out;
  }
  var propio = _correoBH_(CALENDARIO_BH);
  for (var i = 0; i < invitados.length; i++) {
    var c = _correoBH_(invitados[i].getEmail());
    if (c && c !== propio) out.push(c);
  }
  return out;
}

/**
 * traerReservas_ es del proyecto de la Planilla y este archivo no controla su
 * forma de salida. Se aceptan las envolturas conocidas de la API de Cal.com.
 * Si no se reconoce ninguna, devuelve null y el barrido aborta: preferir abortar
 * antes que interpretar "no entiendo la respuesta" como "no hay reservas".
 */
function _listaReservasBH_(crudo) {
  if (!crudo) return null;
  if (_esArregloBH_(crudo)) return crudo;
  if (_esArregloBH_(crudo.bookings)) return crudo.bookings;
  if (_esArregloBH_(crudo.data)) return crudo.data;
  if (crudo.data && _esArregloBH_(crudo.data.bookings)) return crudo.data.bookings;
  return null;
}

/**
 * Una reserva cancelada o rechazada NO cuenta como reserva viva. Es justo el
 * caso del 11 de septiembre: si una cancelada valiera como emparejamiento, el
 * evento que quedo colgado de ella nunca se detectaria. Sin campo status se
 * asume viva, que produce mas emparejamientos y por lo tanto menos borrados.
 */
function _reservaVivaBH_(reserva) {
  var s = _correoBH_(reserva.status);
  if (!s) return true;
  return s !== 'cancelled' && s !== 'canceled' && s !== 'rejected';
}

/**
 * De una reserva saca su minuto de inicio y todos los correos que trae. Devuelve
 * null si le falta cualquiera de los dos: una reserva que no se entiende es una
 * reserva que no puede emparejar, y eso convertiria su evento en falso huerfano.
 */
function _parReservaBH_(reserva) {
  if (!reserva) return null;
  var inicio = reserva.startTime || reserva.start || reserva.start_time;
  if (!inicio) return null;
  var d = new Date(inicio);
  if (isNaN(d.getTime())) return null;

  var correos = [];
  if (_esArregloBH_(reserva.attendees)) {
    for (var i = 0; i < reserva.attendees.length; i++) {
      var a = reserva.attendees[i];
      var c = a ? _correoBH_(a.email) : '';
      if (c) correos.push(c);
    }
  }
  if (reserva.responses && reserva.responses.email) {
    correos.push(_correoBH_(reserva.responses.email));
  }
  if (reserva.attendeeEmail) correos.push(_correoBH_(reserva.attendeeEmail));
  if (!correos.length) return null;

  return { minuto: _minutoBH_(d), correos: correos };
}

// --------------------------------------------------------------------------
// Nucleo. Una sola funcion calcula el conjunto, y las dos de arriba la llaman.
// Aca no se borra nada: borrar es cosa de borrarHuerfanos(), y solo si ok.
// --------------------------------------------------------------------------

/**
 * Devuelve { ok, motivo, reservasTotal, reservasEnVentana, candidatos, huerfanos,
 * umbralSuperado, motivoUmbral }.
 *
 * ok y umbralSuperado son DOS SENALES DISTINTAS y no se mezclan:
 *   ok              "pude calcular". En false significa ABORTA: no se puede
 *                   afirmar nada sobre este calendario y no se borra ni un
 *                   evento. huerfanos solo tiene sentido con ok en true.
 *   umbralSuperado  "el resultado es sospechoso". El calculo es fiable igual,
 *                   asi que la lista se muestra; lo unico que se bloquea es el
 *                   borrado. Superar el umbral NUNCA pone ok en false.
 */
function _calcularHuerfanosBH_() {
  var r = {
    ok: false,
    motivo: '',
    reservasTotal: 0,
    reservasEnVentana: 0,
    candidatos: 0,
    huerfanos: [],
    umbralSuperado: false,
    motivoUmbral: '',
  };

  var cal = CalendarApp.getCalendarById(CALENDARIO_BH);
  if (!cal) {
    r.motivo = 'ABORTA: no se pudo abrir el calendario ' + CALENDARIO_BH + '.';
    return r;
  }

  var ventana = _ventanaBH_();
  var candidatos = _candidatosBH_(cal, ventana);
  r.candidatos = candidatos.length;

  // Este archivo vive del cliente de Cal.com del proyecto de la Planilla. Si no
  // esta, no hay con que comparar y no se mira siquiera el calendario.
  if (typeof traerReservas_ !== 'function') {
    r.motivo =
      'ABORTA: no existe traerReservas_ en este proyecto. Este archivo va pegado' +
      ' en el proyecto de la Planilla de horas agendadas, que es el que tiene el' +
      ' cliente de Cal.com (obtenerLlaveCal_, pedirCal_, traerReservas_).';
    return r;
  }

  // CONDICION DE ABORTO 1: la llamada a Cal.com fallo, dio error o vino vacia.
  var crudo;
  try {
    crudo = traerReservas_(ventana.desde, ventana.hasta);
  } catch (e) {
    r.motivo = 'ABORTA: la llamada a Cal.com fallo: ' + e;
    return r;
  }

  var lista = _listaReservasBH_(crudo);
  if (!lista) {
    r.motivo =
      'ABORTA: la respuesta de Cal.com no tiene una forma reconocible. Revisa que' +
      ' devuelve traerReservas_ antes de seguir.';
    return r;
  }
  r.reservasTotal = lista.length;

  var vivas = {};
  var enVentana = 0;
  for (var i = 0; i < lista.length; i++) {
    if (!_reservaVivaBH_(lista[i])) continue;
    var par = _parReservaBH_(lista[i]);
    if (!par) {
      r.motivo =
        'ABORTA: una reserva de Cal.com vino sin hora de inicio o sin correo, asi' +
        ' que no se puede emparejar y todo lo suyo pareceria huerfano.';
      return r;
    }
    if (
      par.minuto >= _minutoBH_(ventana.desde) &&
      par.minuto <= _minutoBH_(ventana.hasta)
    ) {
      enVentana++;
    }
    for (var j = 0; j < par.correos.length; j++) {
      vivas[par.minuto + '|' + par.correos[j]] = true;
    }
  }
  r.reservasEnVentana = enVentana;

  if (enVentana === 0) {
    r.motivo =
      'ABORTA: Cal.com no devolvio ninguna reserva viva en la ventana. Con cero' +
      ' reservas todo evento pareceria huerfano.';
    return r;
  }

  var huerfanos = [];
  for (var k = 0; k < candidatos.length; k++) {
    var ev = candidatos[k];
    var correos = _correosDelEventoBH_(ev);

    // CONDICION DE ABORTO 3: sin el correo del invitado no hay emparejamiento
    // posible, y ese evento se veria huerfano por falta de dato, no por serlo.
    if (!correos.length) {
      r.motivo =
        'ABORTA: no se pudo leer el correo del invitado del evento "' +
        ev.getTitle() + '" del ' + _fechaLegibleBH_(cal, ev.getStartTime()) + '.';
      return r;
    }

    var minuto = _minutoBH_(ev.getStartTime());
    var emparejado = false;
    for (var m = 0; m < correos.length; m++) {
      if (vivas[minuto + '|' + correos[m]]) {
        emparejado = true;
        break;
      }
    }
    if (!emparejado) {
      huerfanos.push({ evento: ev, correos: correos });
    }
  }

  r.huerfanos = huerfanos;
  r.ok = true;

  // El umbral va aqui, sobre el resultado ya calculado, y no antes sobre los
  // conteos crudos. Con cero candidatos no se afirma nada: no hay resultado del
  // que sospechar.
  if (
    candidatos.length > 0 &&
    (huerfanos.length > TOPE_HUERFANOS_BH ||
      huerfanos.length > PROPORCION_MAX_HUERFANOS_BH * candidatos.length)
  ) {
    r.umbralSuperado = true;
    r.motivoUmbral =
      'UMBRAL SUPERADO: salieron ' + huerfanos.length + ' huerfanos sobre ' +
      candidatos.length + ' eventos de Cal.com en la ventana. Tantos de golpe' +
      ' apuntan a una consulta incompleta de Cal.com (una pagina que falto, un' +
      ' filtro, permisos) antes que a huerfanos de verdad, que son pocos y' +
      ' sueltos. El borrado queda bloqueado. La lista se muestra igual para que' +
      ' puedas mirarla y decidir.';
  }

  return r;
}

function _fechaLegibleBH_(cal, fecha) {
  return Utilities.formatDate(fecha, cal.getTimeZone(), 'EEE dd/MM/yyyy HH:mm');
}

function _informarBH_(cal, r) {
  Logger.log('--- BARRIDO DE HUERFANOS ---');
  Logger.log('Ventana: hoy y los ' + DIAS_BH + ' dias siguientes.');
  Logger.log(
    'Reservas traidas de Cal.com: ' + r.reservasTotal +
      ' (vivas dentro de la ventana: ' + r.reservasEnVentana + ').'
  );
  Logger.log('Eventos candidatos en el calendario: ' + r.candidatos + '.');

  if (!r.ok) {
    Logger.log(r.motivo);
    Logger.log('No se toco nada.');
    return;
  }

  if (!r.huerfanos.length) {
    Logger.log('Huerfanos: ninguno. Cada evento de Cal.com tiene su reserva.');
    return;
  }

  Logger.log('Huerfanos: ' + r.huerfanos.length + '.');
  for (var i = 0; i < r.huerfanos.length; i++) {
    var h = r.huerfanos[i];
    Logger.log(
      '  ' + _fechaLegibleBH_(cal, h.evento.getStartTime()) +
        '  |  ' + h.evento.getTitle() +
        '  |  ' + h.correos.join(', ')
    );
  }

  // El aviso va DESPUES de la lista, no en vez de ella: quien mira el registro
  // tiene que poder ver los datos sobre los que se esta desconfiando.
  if (r.umbralSuperado) {
    Logger.log(r.motivoUmbral);
  }
}

// --------------------------------------------------------------------------
// Las dos funciones que se ejecutan a mano
// --------------------------------------------------------------------------

/**
 * Solo lee. Es la primera que se corre, siempre, y la unica que hace falta para
 * contestar la pregunta de si hay huerfanos.
 */
function listarHuerfanos() {
  var cal = CalendarApp.getCalendarById(CALENDARIO_BH);
  if (!cal) {
    Logger.log('ERROR: no se pudo abrir el calendario ' + CALENDARIO_BH);
    return;
  }
  _informarBH_(cal, _calcularHuerfanosBH_());
}

/**
 * Borra. Repite el calculo con la MISMA funcion que listarHuerfanos(), asi que
 * las dos no pueden ver conjuntos distintos. Con CONFIRMO_BORRADO en false
 * escribe lo que borraria y termina sin tocar el calendario.
 */
function borrarHuerfanos() {
  var cal = CalendarApp.getCalendarById(CALENDARIO_BH);
  if (!cal) {
    Logger.log('ERROR: no se pudo abrir el calendario ' + CALENDARIO_BH);
    return;
  }

  var r = _calcularHuerfanosBH_();
  _informarBH_(cal, r);

  // El orden de los frenos: no pude calcular, no hay nada que borrar, el
  // resultado es sospechoso, y recien al final la llave de Juan.
  if (!r.ok) return;
  if (!r.huerfanos.length) return;

  if (r.umbralSuperado) {
    Logger.log(
      'No se borra nada, ni con CONFIRMO_BORRADO en true: con el umbral superado' +
        ' lo probable es que falten reservas en la respuesta de Cal.com, no que' +
        ' sobren eventos en el calendario. Corre listarHuerfanos() y compara la' +
        ' lista con el calendario antes de insistir.'
    );
    return;
  }

  if (!CONFIRMO_BORRADO) {
    Logger.log(
      'ENSAYO. CONFIRMO_BORRADO esta en false, no se borro nada. Revisa la lista' +
        ' de arriba una por una; si cada hora te cuadra, pon CONFIRMO_BORRADO en' +
        ' true arriba del archivo y vuelve a ejecutar.'
    );
    return;
  }

  var borrados = 0;
  for (var i = 0; i < r.huerfanos.length; i++) {
    var h = r.huerfanos[i];
    var etiqueta =
      _fechaLegibleBH_(cal, h.evento.getStartTime()) + ' | ' + h.evento.getTitle();
    try {
      h.evento.deleteEvent();
      borrados++;
      Logger.log('BORRADO: ' + etiqueta);
    } catch (e) {
      Logger.log('NO se pudo borrar: ' + etiqueta + ' (' + e + ')');
    }
  }
  Logger.log('Borrados ' + borrados + ' de ' + r.huerfanos.length + '.');
}
