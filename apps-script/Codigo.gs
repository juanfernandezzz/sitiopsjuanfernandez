/**
 * PLANILLA DE HORAS AGENDADAS
 * Ligada al archivo dentro de Google Drive > Consultantes > Actuales.
 *
 * Hojas:
 *   Configuracion     : la escribes tu. El script la LEE y nunca la reescribe. Aqui vive el boton.
 *   Avisos            : lo que requiere accion, ordenado por urgencia.
 *   Agenda por semana : cuadricula rodante, filas por hora, colores por tipo.
 *   Carga por dia     : sesiones contra el tope diario, con desglose Fonasa y particular.
 *   Horas fijas       : el roster completo con estado Agendada o Pendiente.
 *   Sin calzar        : reservas que no encontraron carpeta.
 *   Alias             : la escribes tu. El script la LEE y nunca la borra.
 *
 * Fuentes de verdad:
 *   Drive   : quien esta en el roster y como se escribe su nombre (nombre canon).
 *   Cal.com : dia, hora, tipo de sesion y si la hora fija ya quedo reservada.
 *   Configuracion : todos los topes y umbrales.
 */

const ID_CARPETA_ACTUALES = '1mn8j7waBR_PQeXqa-sXP2-yjGezbkt52';
const ZONA_HORARIA = 'America/Santiago';
const VERSION_API_CAL = '2026-05-01';
const BASE_API_CAL = 'https://api.cal.com/v2';

/** Los 4 event types de hora fija. */
const EVENTOS_HORA_FIJA = {
  '6682136': { periodicidad: 'Semanal',   modalidad: 'Fonasa' },
  '6705795': { periodicidad: 'Quincenal', modalidad: 'Fonasa' },
  '6766194': { periodicidad: 'Semanal',   modalidad: 'Particular' },
  '6775385': { periodicidad: 'Quincenal', modalidad: 'Particular' }
};

/** Modalidad de TODOS los event types. El tope semanal Fonasa cuenta todos, no solo hora fija. */
const MODALIDAD_EVENTO = {
  '5776252': 'Fonasa',      // Primera sesion con bono Fonasa
  '5785345': 'Fonasa',      // Control y avance con bono Fonasa
  '5785464': 'Fonasa',      // Pareja con bono Fonasa
  '5785503': 'Particular',  // Individual particular
  '6682136': 'Fonasa',
  '6705795': 'Fonasa',
  '6766194': 'Particular',
  '6775385': 'Particular'
};

const EVENTO_PRIMERA_SESION = '5776252';

/** clave, etiqueta visible, valor por defecto, tipo, explicacion */
const CONFIG_DEF = [
  ['topeLun', 'Tope de sesiones el lunes', 5, 'num', 'Maximo de sesiones que aceptas ese dia. El Limitador de Agenda lee este mismo numero.'],
  ['topeMar', 'Tope de sesiones el martes', 4, 'num', ''],
  ['topeMie', 'Tope de sesiones el miercoles', 4, 'num', ''],
  ['topeJue', 'Tope de sesiones el jueves', 4, 'num', ''],
  ['topeVie', 'Tope de sesiones el viernes', 6, 'num', ''],
  ['topeSab', 'Tope de sesiones el sabado', 3, 'num', ''],
  ['topeFonasa', 'Tope semanal de sesiones Fonasa', 20, 'num', 'Cuenta TODAS las sesiones Fonasa de la semana: primera sesion, control y avance, pareja y hora fija. El resto de tu capacidad queda para particulares.'],
  ['semanas', 'Semanas visibles en la agenda', 5, 'num', 'Cuantas semanas muestra Agenda por semana, contando desde el lunes en curso.'],
  ['diasAbandono', 'Dias sin actividad para sugerir Anteriores', 21, 'num', 'Si alguien no tiene sesion futura y su ultima sesion fue hace mas dias que esto, Avisos te sugiere mover su carpeta a Anteriores.'],
  ['avisoRestantes', 'Avisar cuando a una serie le queden N sesiones o menos', 2, 'num', 'Las series recurrentes de Cal.com se agotan a las 4 semanas. Este es el margen con que quieres el aviso.'],
  ['ancla', 'Lunes ancla de la paridad quincenal', '2026-01-05', 'fecha', 'Fecha fija desde la que se cuentan las semanas para decidir si una quincena es A o B. NO la muevas: si la cambias, todas las etiquetas A y B se dan vuelta.']
];

const HOJA_CONFIG = 'Configuración';
const HOJA_AVISOS = 'Avisos';
const HOJA_AGENDA = 'Agenda por semana';
const HOJA_CARGA = 'Carga por día';
const HOJA_HORAS = 'Horas fijas';
const HOJA_SIN_CALZAR = 'Sin calzar';
const HOJA_ALIAS = 'Alias';
const ORDEN_HOJAS = [HOJA_CONFIG, HOJA_AVISOS, HOJA_AGENDA, HOJA_CARGA,
                     HOJA_HORAS, HOJA_SIN_CALZAR, HOJA_ALIAS];

/** El boton vive en Configuracion, que el script NUNCA reescribe. */
const CELDA_BOTON = 'B2';
const FILA0_CONFIG = 5;

const COLOR = {
  fijaFondo: '#E8EFE9', fijaTexto: '#2F4638',
  primeraFondo: '#F7E3DA', primeraTexto: '#8A3F20',
  otraFondo: '#F1F0EC', otraTexto: '#2A3B4C',
  libreFondo: '#FFFDF8', libreTexto: '#A8B5A0',
  vacio: '#FFFFFF',
  encabezado: '#3F5B4A', encabezadoTexto: '#FFFFFF',
  franja: '#F6F1E8',
  alerta: '#FBE9E7', alertaTexto: '#B03A2E',
  media: '#FDF3E3', mediaTexto: '#8A5A16',
  ok: '#E8EFE9', okTexto: '#2F4638',
  tenue: '#777777',
  pasadaFondo: '#f3f3f3', pasadaTexto: '#999999'
};

const COLUMNAS = ['Nombre', 'Periodicidad', 'Modalidad', 'Día', 'Hora',
                  'Vigente desde', 'Sesiones restantes', 'Última de la serie',
                  'Estado', 'Conflicto', 'Correo', 'Notas', 'Seguimiento'];
const COL_NOTAS = 12;

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ORDEN_DIA = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
                    'Viernes': 5, 'Sábado': 6, 'Domingo': 7 };

/* ------------------------------------------------------------------ menu */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Horas fijas')
    .addItem('Actualizar ahora', 'actualizar')
    .addItem('Configurar (una sola vez)', 'configurar')
    .addToUi();
}

function configurar() {
  obtenerLlaveCal_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === 'actualizar' || f === 'alEditar') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('actualizar')
    .timeBased().everyDays(1).atHour(6).inTimezone(ZONA_HORARIA).create();
  ScriptApp.newTrigger('alEditar')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
  actualizar();
}

/** Solo reacciona a la casilla de Configuracion. Instalable, no simple: necesita salir a Cal.com. */
function alEditar(e) {
  if (!e || !e.range) return;
  if (e.range.getSheet().getName() !== HOJA_CONFIG) return;
  if (e.range.getA1Notation() !== CELDA_BOTON) return;
  if (e.range.getValue() !== true) return;
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  try {
    libro.toast('Consultando Cal.com y Drive.', 'Actualizando', 30);
    actualizar();
    e.range.setValue(false);
    libro.toast('Listo.', 'Planilla actualizada', 6);
  } catch (err) {
    e.range.setValue(false);
    libro.toast(String(err).slice(0, 220), 'No se pudo actualizar', 30);
    throw err;
  }
}

/* ------------------------------------------------------------- Cal.com */

function obtenerLlaveCal_() {
  const llave = PropertiesService.getScriptProperties().getProperty('CAL_API_KEY');
  if (!llave) {
    throw new Error('Falta la llave de Cal.com. En el editor: Configuración del proyecto, ' +
      'Propiedades del script, Agregar propiedad. Nombre exacto: CAL_API_KEY.');
  }
  return llave;
}

function pedirCal_(ruta, parametros) {
  const partes = [];
  Object.keys(parametros).forEach(function (k) {
    const v = parametros[k];
    if (v !== null && v !== undefined && v !== '') {
      partes.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
  });
  const url = BASE_API_CAL + ruta + (partes.length ? '?' + partes.join('&') : '');
  const respuesta = UrlFetchApp.fetch(url, {
    method: 'get', muteHttpExceptions: true,
    headers: { 'Authorization': 'Bearer ' + obtenerLlaveCal_(), 'cal-api-version': VERSION_API_CAL }
  });
  const codigo = respuesta.getResponseCode();
  if (codigo !== 200) {
    throw new Error('Cal.com respondió ' + codigo + ' en ' + ruta +
      '. Las hojas no se tocaron. Detalle: ' + respuesta.getContentText().slice(0, 400));
  }
  return JSON.parse(respuesta.getContentText());
}

function traerReservas_(estado, extras) {
  const todas = [];
  let cursor = null;
  for (let vuelta = 0; vuelta < 25; vuelta++) {
    const parametros = { status: estado, limit: 100, cursor: cursor };
    Object.keys(extras || {}).forEach(function (k) { parametros[k] = extras[k]; });
    const cuerpo = pedirCal_('/bookings', parametros);
    (cuerpo.data || []).forEach(function (r) { todas.push(r); });
    const pag = cuerpo.pagination || {};
    if (!pag.hasMore || !pag.nextCursor) return todas;
    cursor = pag.nextCursor;
  }
  throw new Error('Cal.com devolvió más de 25 páginas de reservas ' + estado +
    '. Las hojas no se tocaron.');
}

/**
 * C61: reservas canceladas con inicio en el pasado, para el aviso "¿Sigues atendiendo?".
 * Devuelve null si Cal.com no acepta 'cancelled' como estado: el aviso cae entonces
 * a la rama B (hueco temporal) en vez de tumbar la actualizacion.
 */
function traerCanceladas_(desde) {
  try {
    const ahora = Date.now();
    return traerReservas_('cancelled', { afterStart: desde }).filter(function (r) {
      return new Date(r.start || r.startTime).getTime() < ahora;
    });
  } catch (e) {
    Logger.log('Canceladas no disponibles, se usa el hueco temporal: ' + String(e).slice(0, 200));
    return null;
  }
}

/* ------------------------------------------------------------- utilidades */

function normalizar_(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function claveNombre_(nombre) {
  return normalizar_(nombre).split(' ').filter(Boolean).slice(0, 2).join(' ');
}

function capitalizar_(texto) {
  return String(texto || '').split(/\s+/).filter(Boolean).map(function (p) {
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
}

function idEventoDe_(r) {
  return String((r.eventType && r.eventType.id) || r.eventTypeId || '');
}

function uidSerieDe_(r) {
  return String(r.recurringBookingUid || r.uid || r.id);
}

function nombreAsistente_(r) {
  const a = (r.attendees || [])[0];
  return a ? String(a.name || '') : '';
}

function fmt_(fecha, patron) {
  return Utilities.formatDate(fecha, ZONA_HORARIA, patron);
}

function aFecha_(v) {
  if (v instanceof Date) return v;
  const p = String(v).trim().split('-');
  if (p.length === 3 && p[0].length === 4) {
    return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 15));
  }
  throw new Error('La fecha ancla de Configuración no se entiende: ' + v +
    '. Debe ir como 2026-01-05 y ser un lunes.');
}

/** Lunes de la semana de esa fecha, anclado a las 15:00 UTC para que el horario de verano no lo mueva. */
function lunesDeFecha_(f) {
  const dow = Number(fmt_(f, 'u'));
  const p = fmt_(f, 'yyyy-MM-dd').split('-');
  const base = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 15, 0, 0);
  return new Date(base - (dow - 1) * 86400000);
}

/** A o B segun la paridad de la semana contra el lunes ancla. Estable en el tiempo. */
function paridadDe_(fecha, ancla) {
  const semanas = Math.round(
    (lunesDeFecha_(fecha).getTime() - lunesDeFecha_(ancla).getTime()) / (7 * 86400000));
  return (((semanas % 2) + 2) % 2) === 0 ? 'A' : 'B';
}

/** SF, SP, QA-F, QB-P. Texto y no color: la grilla ya usa tres fondos. */
function codigoFija_(periodicidad, modalidad, paridad) {
  const m = modalidad === 'Fonasa' ? 'F' : 'P';
  return periodicidad === 'Semanal' ? ('S' + m) : ('Q' + paridad + '-' + m);
}

/* ------------------------------------------------------------------ Drive */

function leerRoster_() {
  const it = DriveApp.getFolderById(ID_CARPETA_ACTUALES).getFolders();
  const roster = [];
  while (it.hasNext()) {
    const n = it.next().getName();
    const m = n.match(/^(.+?)\s*\(\s*(semanal|quincenal)\s*\)\s*$/i);
    if (!m) continue;
    roster.push({
      nombre: m[1].trim(),
      periodicidadDrive: m[2].toLowerCase() === 'semanal' ? 'Semanal' : 'Quincenal',
      clave: claveNombre_(m[1])
    });
  }
  if (!roster.length) {
    throw new Error('Ninguna carpeta de Actuales terminó en (semanal) o (quincenal). ' +
      'Las hojas no se tocaron: revisa el ID de la carpeta.');
  }
  return roster;
}

/* ------------------------------------------------------------ Configuracion */

function crearConfig_(hoja) {
  hoja.clear();
  hoja.getRange(1, 1, 1, 3).merge().setValue(
    'Esta hoja la controlas tú. El script la LEE en cada corrida y nunca la reescribe. ' +
    'Cambia un valor de la columna B y vuelve a actualizar.'
  ).setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(2, 1).setValue('Actualizar la planilla ahora')
    .setFontWeight('bold').setFontSize(11);
  const b = hoja.getRange(CELDA_BOTON);
  b.insertCheckboxes();
  b.setBackground(COLOR.primeraFondo).setHorizontalAlignment('center');
  hoja.getRange(2, 3).setValue('Marca la casilla. Se desmarca sola al terminar.')
    .setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(4, 1, 1, 3).setValues([['Parámetro', 'Valor', 'Qué hace']])
    .setFontWeight('bold').setBackground(COLOR.encabezado).setFontColor(COLOR.encabezadoTexto);
  const filas = CONFIG_DEF.map(function (d) { return [d[1], d[2], d[4]]; });
  const rango = hoja.getRange(FILA0_CONFIG, 1, filas.length, 3);
  rango.setNumberFormat('@');
  rango.setValues(filas);
  hoja.getRange(FILA0_CONFIG, 2, filas.length, 1)
    .setHorizontalAlignment('center').setFontWeight('bold').setBackground(COLOR.franja);
  hoja.setFrozenRows(4);
  hoja.setColumnWidth(1, 330);
  hoja.setColumnWidth(2, 110);
  hoja.setColumnWidth(3, 620);
  hoja.getRange(FILA0_CONFIG, 3, filas.length, 1).setWrap(true);
}

function leerConfig_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_CONFIG);
  if (!hoja) { hoja = libro.insertSheet(HOJA_CONFIG, 0); crearConfig_(hoja); }
  if (hoja.getLastRow() < FILA0_CONFIG) crearConfig_(hoja);

  const filas = hoja.getRange(FILA0_CONFIG, 1, hoja.getLastRow() - FILA0_CONFIG + 1, 2).getValues();
  const puestos = {};
  filas.forEach(function (f) { if (f[0] !== '') puestos[normalizar_(f[0])] = f[1]; });

  const cfg = { _faltantes: [] };
  CONFIG_DEF.forEach(function (d) {
    const bruto = puestos[normalizar_(d[1])];
    if (bruto === undefined || bruto === null || String(bruto).trim() === '') {
      cfg[d[0]] = d[2];
      cfg._faltantes.push(d[1]);
      return;
    }
    if (d[3] === 'num') {
      const n = Number(String(bruto).replace(',', '.'));
      if (!isFinite(n) || n < 0) {
        cfg[d[0]] = d[2];
        cfg._faltantes.push(d[1] + ' (valor no numérico: ' + bruto + ')');
      } else { cfg[d[0]] = n; }
    } else { cfg[d[0]] = bruto; }
  });

  cfg.topes = { 1: cfg.topeLun, 2: cfg.topeMar, 3: cfg.topeMie,
                4: cfg.topeJue, 5: cfg.topeVie, 6: cfg.topeSab, 7: 0 };
  cfg.anclaFecha = aFecha_(cfg.ancla);
  cfg.semanas = Math.max(1, Math.min(12, Math.round(cfg.semanas)));

  // Espejo para el Limitador de Agenda, que corre en otro proyecto y lee esto sin abrir la planilla.
  PropertiesService.getScriptProperties().setProperty('TOPES_JSON', JSON.stringify({
    topes: cfg.topes, actualizado: new Date().toISOString()
  }));
  return cfg;
}

/* ------------------------------------------------------------------ Alias */

function leerAlias_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_ALIAS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_ALIAS);
    hoja.getRange(1, 1).setValue(
      'Esta hoja la escribes tú y el script NUNCA la borra. Sirve cuando el nombre en Cal.com ' +
      'no calza con el de la carpeta (ejemplo: "Made Ramírez" contra "Madeleine Ramírez"). ' +
      'Agrega una fila cuando Avisos o Sin calzar te avisen.'
    ).setFontSize(9).setFontColor(COLOR.tenue);
    hoja.getRange(2, 1, 1, 2)
      .setValues([['Nombre tal como aparece en Cal.com', 'Nombre de la carpeta en Actuales']])
      .setFontWeight('bold').setBackground('#2A3B4C').setFontColor('#FFFFFF');
    hoja.setFrozenRows(2);
    hoja.setColumnWidth(1, 280);
    hoja.setColumnWidth(2, 280);
  }
  const mapa = {};
  if (hoja.getLastRow() > 2) {
    hoja.getRange(3, 1, hoja.getLastRow() - 2, 2).getValues().forEach(function (f) {
      if (f[0] && f[1]) mapa[normalizar_(f[0])] = String(f[1]).trim();
    });
  }
  return mapa;
}

function claveDeCal_(nombreCal, alias) {
  const a = alias[normalizar_(nombreCal)];
  return claveNombre_(a || nombreCal);
}

/** El nombre de carpeta es el canon. Sin carpeta, el de Cal.com recortado y capitalizado. */
function nombreVisible_(nombreCal, alias, rosterPorClave) {
  const clave = claveDeCal_(nombreCal, alias);
  if (rosterPorClave[clave]) return rosterPorClave[clave];
  const base = alias[normalizar_(nombreCal)] || nombreCal;
  return capitalizar_(String(base).split(/\s+/).filter(Boolean).slice(0, 2).join(' '));
}

/* -------------------------------------------------------------- el trabajo */

function actualizar() {
  // 1. Recolectar. Nada se escribe hasta que esto termine sin errores.
  const cfg = leerConfig_();
  const alias = leerAlias_();
  const roster = leerRoster_();
  const rosterPorClave = {};
  roster.forEach(function (p) { rosterPorClave[p.clave] = p.nombre; });

  const hace180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  const vivas = function (r) { return String(r.status).toLowerCase() !== 'cancelled'; };
  const proximas = traerReservas_('upcoming', {}).filter(vivas);
  const pasadas = traerReservas_('past', { afterStart: hace180 }).filter(vivas);

  const hf = calcularHorasFijas_(cfg, roster, alias, proximas, pasadas);
  const agenda = calcularAgenda_(cfg, alias, rosterPorClave, proximas.concat(pasadas), hf.vigente);
  const indice = indicePersonas_(alias, proximas, pasadas);
  const canceladas = traerCanceladas_(hace180);
  const avisos = calcularAvisos_(cfg, roster, hf, agenda, indice, alias, proximas, canceladas);

  // 2. Escribir.
  escribirAvisos_(avisos);
  escribirAgenda_(agenda);
  escribirCarga_(cfg, agenda);
  escribirHorasFijas_(hf.tabla, hf.sinCalzar);
  ordenarHojas_();
}

/** Ultima sesion pasada y proxima futura por persona, de cualquier tipo de evento. */
function indicePersonas_(alias, proximas, pasadas) {
  const idx = {};
  const meter = function (r, futura) {
    const n = nombreAsistente_(r);
    if (!n) return;
    const k = claveDeCal_(n, alias);
    const t = new Date(r.start).getTime();
    const e = idx[k] || (idx[k] = { futuras: 0, ultima: 0, proxima: 0 });
    if (futura) { e.futuras++; if (!e.proxima || t < e.proxima) e.proxima = t; }
    else if (t > e.ultima) { e.ultima = t; }
  };
  proximas.forEach(function (r) { meter(r, true); });
  pasadas.forEach(function (r) { meter(r, false); });
  return idx;
}

/* ------------------------------------------------- calculo: horas fijas */

function calcularHorasFijas_(cfg, roster, alias, proximas, pasadas) {
  const esHF = function (r) { return !!EVENTOS_HORA_FIJA[idEventoDe_(r)]; };
  const series = {};
  proximas.filter(esHF).concat(pasadas.filter(esHF)).forEach(function (r) {
    const nombre = nombreAsistente_(r);
    if (!nombre) return;
    const uid = uidSerieDe_(r);
    const inicio = new Date(r.start);
    const creada = new Date(r.createdAt);
    let s = series[uid];
    if (!s) {
      const conf = EVENTOS_HORA_FIJA[idEventoDe_(r)];
      s = series[uid] = {
        clave: claveDeCal_(nombre, alias), nombreCal: nombre,
        correo: String(((r.attendees || [])[0] || {}).email || '').toLowerCase(),
        creada: creada, inicioSerie: inicio, proximaFutura: null, ultimaFutura: null, restantes: 0,
        periodicidad: conf.periodicidad, modalidad: conf.modalidad
      };
    }
    if (creada < s.creada) s.creada = creada;
    if (inicio < s.inicioSerie) s.inicioSerie = inicio;
  });
  proximas.filter(esHF).forEach(function (r) {
    const s = series[uidSerieDe_(r)];
    if (!s) return;
    const t = new Date(r.start);
    s.restantes++;
    if (!s.proximaFutura || t < s.proximaFutura) s.proximaFutura = t;
    if (!s.ultimaFutura || t > s.ultimaFutura) s.ultimaFutura = t;
  });

  // Por persona gana la serie CREADA mas recientemente, no la que ocurre antes.
  const vigente = {};
  Object.keys(series).forEach(function (uid) {
    const s = series[uid];
    if (!s.proximaFutura) return;
    if (!vigente[s.clave] || s.creada > vigente[s.clave].creada) vigente[s.clave] = s;
  });
  Object.keys(vigente).forEach(function (k) {
    const s = vigente[k];
    s.paridad = s.periodicidad === 'Quincenal' ? paridadDe_(s.proximaFutura, cfg.anclaFecha) : '';
    s.etiqueta = s.periodicidad === 'Quincenal'
      ? ('Quincenal ' + s.paridad) : 'Semanal';
    s.codigo = codigoFija_(s.periodicidad, s.modalidad, s.paridad);
    s.dia = DIAS[Number(fmt_(s.proximaFutura, 'u')) % 7];
    s.hora = fmt_(s.proximaFutura, 'HH:mm');
  });

  const ahora = new Date();
  const usadas = {};
  const tabla = [];
  const conflictos = [];

  roster.forEach(function (p) {
    const s = vigente[p.clave];
    if (!s) {
      tabla.push({ orden: [99, '99:99', normalizar_(p.nombre)],
        datos: [p.nombre, p.periodicidadDrive, '', '', '', '', '', '', 'Pendiente', '', ''] });
      return;
    }
    usadas[p.clave] = true;
    s.nombreCanon = p.nombre;
    const conflicto = (s.periodicidad !== p.periodicidadDrive)
      ? 'Drive dice ' + p.periodicidadDrive + ', Cal.com dice ' + s.periodicidad : '';
    if (conflicto) conflictos.push({ nombre: p.nombre, detalle: conflicto });
    tabla.push({
      orden: [ORDEN_DIA[s.dia] || 98, s.hora, normalizar_(p.nombre)],
      datos: [p.nombre, s.etiqueta, s.modalidad, s.dia, s.hora,
        s.inicioSerie < ahora ? 'En curso' : fmt_(s.inicioSerie, 'dd-MM-yyyy'),
        s.restantes, fmt_(s.ultimaFutura, 'dd-MM-yyyy'),
        'Agendada', conflicto, s.correo]
    });
  });

  tabla.sort(function (a, b) {
    if (a.orden[0] !== b.orden[0]) return a.orden[0] - b.orden[0];
    if (a.orden[1] !== b.orden[1]) return a.orden[1] < b.orden[1] ? -1 : 1;
    return a.orden[2] < b.orden[2] ? -1 : 1;
  });

  const sinCalzar = [];
  Object.keys(vigente).forEach(function (k) {
    if (usadas[k]) return;
    const s = vigente[k];
    sinCalzar.push([s.nombreCal, s.correo, s.etiqueta, s.modalidad, s.dia, s.hora]);
  });

  return { tabla: tabla, sinCalzar: sinCalzar, vigente: vigente,
           usadas: usadas, conflictos: conflictos };
}

/* ------------------------------------------------- calculo: agenda mensual */

function calcularAgenda_(cfg, alias, rosterPorClave, reservas, vigente) {
  const lunes = lunesDeFecha_(new Date());
  const dias = [];
  for (let i = 0; i < cfg.semanas * 7; i++) {
    dias.push(fmt_(new Date(lunes.getTime() + i * 86400000), 'yyyy-MM-dd'));
  }
  const dentro = {};
  dias.forEach(function (d) { dentro[d] = true; });

  // C61: una semana hacia atras, en gris, para ver lo que acaba de pasar sin
  // abrir el calendario. Si alguna vez se quieren dos, esto se sube a la hoja
  // Configuración junto al resto de los umbrales.
  const SEMANAS_ATRAS = 1;
  // Solo se DIBUJA: sus dias no entran en dias, conteo ni fonasa, que alimentan
  // Carga por día, Sobrecupo y el tope Fonasa. Sus celdas van en el mismo mapa
  // porque las claves llevan la fecha completa.
  const previas = [], dentroPrev = {}, fonasaPrev = {};
  for (let k = SEMANAS_ATRAS; k >= 1; k--) {
    const l = new Date(lunes.getTime() - k * 7 * 86400000);
    const ds = [];
    for (let i = 0; i < 7; i++) {
      const d = fmt_(new Date(l.getTime() + i * 86400000), 'yyyy-MM-dd');
      ds.push(d); dentroPrev[d] = true;
    }
    previas.push({ lunes: l, dias: ds });
  }

  const celdas = {}, conteo = {}, fonasa = {}, particular = {};
  let minHora = 23, maxHora = 0, hubo = false;

  reservas.forEach(function (r) {
    const inicio = new Date(r.start || r.startTime);
    const dia = fmt_(inicio, 'yyyy-MM-dd');
    const esPrev = !!dentroPrev[dia];
    if (!dentro[dia] && !esPrev) return;
    const nombre = nombreAsistente_(r);
    if (!nombre) return;
    const hora = Number(fmt_(inicio, 'HH'));
    const id = idEventoDe_(r);
    const conf = EVENTOS_HORA_FIJA[id];
    const modalidad = MODALIDAD_EVENTO[id] || 'Particular';
    const tipo = conf ? 'fija' : (id === EVENTO_PRIMERA_SESION ? 'primera' : 'otra');
    let texto = nombreVisible_(nombre, alias, rosterPorClave);
    if (conf) {
      const par = conf.periodicidad === 'Quincenal' ? paridadDe_(inicio, cfg.anclaFecha) : '';
      texto += ' · ' + codigoFija_(conf.periodicidad, conf.modalidad, par);
    }
    const k = dia + '|' + hora;
    if (!celdas[k]) celdas[k] = { texto: texto, tipo: tipo };
    else celdas[k].texto += ' / ' + texto;
    if (esPrev) {
      if (modalidad === 'Fonasa') fonasaPrev[dia] = (fonasaPrev[dia] || 0) + 1;
    } else {
      conteo[dia] = (conteo[dia] || 0) + 1;
      if (modalidad === 'Fonasa') fonasa[dia] = (fonasa[dia] || 0) + 1;
      else particular[dia] = (particular[dia] || 0) + 1;
    }
    if (hora < minHora) minHora = hora;
    if (hora > maxHora) maxHora = hora;
    hubo = true;
  });

  // Huecos quincenales: la semana alterna de cada quincenal es un slot vendible.
  // Solo se marca si la celda esta vacia, para no pisar nada real.
  const libres = [];
  Object.keys(vigente).forEach(function (k) {
    const s = vigente[k];
    if (s.periodicidad !== 'Quincenal') return;
    const opuesta = s.paridad === 'A' ? 'B' : 'A';
    const hora = Number(s.hora.slice(0, 2));
    dias.forEach(function (d) {
      const f = new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1,
                                  Number(d.slice(8, 10)), 15));
      if (DIAS[Number(fmt_(f, 'u')) % 7] !== s.dia) return;
      if (paridadDe_(f, cfg.anclaFecha) !== opuesta) return;
      const kk = d + '|' + hora;
      if (celdas[kk]) return;
      celdas[kk] = { texto: 'Libre Q' + opuesta, tipo: 'libre' };
      libres.push({ dia: s.dia, hora: s.hora, paridad: opuesta, fecha: d });
    });
  });

  if (!hubo) { minHora = 10; maxHora = 20; }
  const horas = [];
  for (let h = minHora; h <= maxHora; h++) horas.push(h);

  const fonasaSemana = [];
  for (let w = 0; w < cfg.semanas; w++) {
    let n = 0;
    dias.slice(w * 7, w * 7 + 7).forEach(function (d) { n += (fonasa[d] || 0); });
    fonasaSemana.push(n);
  }

  previas.forEach(function (p) {
    p.fonasa = 0;
    p.dias.forEach(function (d) { p.fonasa += (fonasaPrev[d] || 0); });
  });

  return { lunes: lunes, dias: dias, horas: horas, celdas: celdas, conteo: conteo,
           fonasa: fonasa, particular: particular, fonasaSemana: fonasaSemana, libres: libres,
           previas: previas };
}

/* ------------------------------------------------------- calculo: avisos */

function calcularAvisos_(cfg, roster, hf, agenda, indice, alias, proximas, canceladas) {
  const avisos = [];
  const hoy = new Date();
  const dia = 86400000;
  const P = { alta: 1, media: 2, baja: 3 };

  // 1. Series recurrentes por vencer. Las de Cal.com se agotan a las 4 semanas.
  Object.keys(hf.vigente).forEach(function (k) {
    const s = hf.vigente[k];
    if (s.restantes > cfg.avisoRestantes) return;
    avisos.push([P.alta, 'Alta', 'Serie por vencer',
      (s.nombreCanon || s.nombreCal) + ', ' + s.dia + ' ' + s.hora + ' (' + s.etiqueta + ')',
      fmt_(s.ultimaFutura, 'dd-MM-yyyy'),
      'Le quedan ' + s.restantes + '. Vuelve a agendar la serie en Cal.com antes de esa fecha.']);
  });

  // 1b. C61: semanales y quincenales sin hora la proxima semana cuando les toca.
  // Deliberadamente NO se deduplica contra "Serie por vencer": la misma persona puede
  // salir en las dos filas, y una fila de mas molesta pero una ausente cuesta una sesion.
  const lunesSig = new Date(agenda.lunes.getTime() + 7 * dia);
  const diasSig = {};
  for (let i = 0; i < 6; i++) diasSig[fmt_(new Date(lunesSig.getTime() + i * dia), 'yyyy-MM-dd')] = true;
  const conReserva = {};
  proximas.forEach(function (r) {
    if (!_reservaVivaBH_(r) || !diasSig[fmt_(new Date(r.start || r.startTime), 'yyyy-MM-dd')]) return;
    const n = nombreAsistente_(r);
    if (n) conReserva[claveDeCal_(n, alias)] = true;
  });
  const letraSig = paridadDe_(lunesSig, cfg.anclaFecha);
  roster.forEach(function (p) {
    if (conReserva[p.clave]) return;
    const s = hf.vigente[p.clave];
    const quincenal = (s ? s.periodicidad : p.periodicidadDrive) === 'Quincenal';
    if (quincenal) {
      // La letra sale de la serie vigente o, sin ella, de su ultima sesion. Sin ninguna
      // reserva no se puede inventar: esa persona ya figura Pendiente en Horas fijas.
      const e = indice[p.clave];
      const letra = s ? s.paridad : (e && e.ultima ? paridadDe_(new Date(e.ultima), cfg.anclaFecha) : '');
      if (!letra || letra !== letraSig) return;
    }
    avisos.push([P.alta, 'Alta', 'Sin agenda la próxima semana',
      s ? (p.nombre + ', ' + s.dia + ' ' + s.hora + ' (' + s.etiqueta + ')') : p.nombre,
      fmt_(lunesSig, 'dd-MM-yyyy'),
      'No tiene hora reservada para la semana del ' + fmt_(lunesSig, 'dd-MM') +
      '. Agenda su serie en Cal.com.']);
  });

  // 2. Abandono probable.
  roster.forEach(function (p) {
    const e = indice[p.clave];
    if (e && e.futuras > 0) return;
    const dias = (e && e.ultima) ? Math.floor((hoy.getTime() - e.ultima) / dia) : null;
    if (dias === null) {
      avisos.push([P.media, 'Media', 'Sin ninguna sesión', p.nombre, '',
        'No tiene sesiones pasadas ni futuras en los últimos 180 días. Revisa si corresponde a Actuales.']);
    } else if (dias >= cfg.diasAbandono) {
      avisos.push([P.media, 'Media', 'Posible discontinuación', p.nombre,
        fmt_(new Date(e.ultima), 'dd-MM-yyyy'),
        'Sin sesión hace ' + dias + ' días y sin ninguna agendada. Considera mover su carpeta a Anteriores.']);
    }
  });

  // 2b. C61: "¿Sigues atendiendo?". La carpeta ya esta en Actuales por definicion (el roster
  // sale de ahi), asi que no hace falta mirar Anteriores.
  // RAMA A (canceladas != null): la ausencia es un dato duro, una reserva cancelada con
  // inicio pasado, posterior a la ultima sesion realizada y sin ninguna futura.
  // RAMA B (canceladas == null, Cal.com no entrego el estado 'cancelled'): hueco temporal
  // acotado, con texto ambiguo a proposito. Ya cubierta la serie por vencer sin filtro
  // extra: esa persona tiene sesion futura y sale antes por "futuras > 0".
  // Comprobado en vivo el 11-10-2026: traerReservas_('past') NO incluye canceladas (298
  // accepted, ninguna cancelled), pero traerReservas_('cancelled', { afterStart }) SI
  // funciona (156 en 180 dias, 140 con inicio pasado). Queda implementada la RAMA A. La B
  // solo corre si ese estado deja de responder: el registro dira "Canceladas no disponibles".
  const cancPor = {};
  (canceladas || []).forEach(function (r) {
    const n = nombreAsistente_(r);
    if (!n) return;
    const k = claveDeCal_(n, alias);
    (cancPor[k] || (cancPor[k] = [])).push(new Date(r.start || r.startTime).getTime());
  });
  roster.forEach(function (p) {
    const e = indice[p.clave];
    if (e && e.futuras > 0) return;
    const dias = (e && e.ultima) ? Math.floor((hoy.getTime() - e.ultima) / dia) : null;
    // A partir de diasAbandono ya habla "Posible discontinuación": nunca las dos filas.
    if (dias !== null && dias >= cfg.diasAbandono) return;
    const quien = p.nombre + ', ' + ((e && e.ultima)
      ? 'última sesión ' + fmt_(new Date(e.ultima), 'dd-MM-yyyy') : 'sin sesiones realizadas') +
      ' (' + p.periodicidadDrive + ')';
    if (canceladas) {
      const n = (cancPor[p.clave] || []).filter(function (t) { return t > ((e && e.ultima) || 0); }).length;
      if (!n) return;
      avisos.push([P.media, 'Media', '¿Sigues atendiendo?', quien, '',
        'Tiene ' + n + ' sesión(es) cancelada(s) y ninguna futura. ' +
        'Su carpeta sigue en Actuales: decide si sigue o muévela a Anteriores.']);
    } else {
      const cadencia = p.periodicidadDrive === 'Semanal' ? 7 : 14;
      if (dias === null || dias <= cadencia + 2) return;
      avisos.push([P.media, 'Media', '¿Sigues atendiendo?', quien, '',
        'Sin sesión futura y la última fue hace ' + dias + ' días, más de lo que indica su periodicidad. ' +
        'Su carpeta sigue en Actuales: confirma si sigue o si fue solo que no le has reagendado.']);
    }
  });

  // 3. Reservas sin carpeta.
  hf.sinCalzar.forEach(function (f) {
    avisos.push([P.alta, 'Alta', 'Reserva sin carpeta', f[0] + ' (' + f[1] + ')', '',
      'Tiene hora fija en Cal.com pero ninguna carpeta en Actuales la reconoce. ' +
      'Agrega una fila en Alias o crea la carpeta.']);
  });

  // 4. Dias en sobrecupo.
  agenda.dias.forEach(function (d) {
    const f = new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1,
                                Number(d.slice(8, 10)), 15));
    const dow = Number(fmt_(f, 'u'));
    if (dow === 7) return;
    const n = agenda.conteo[d] || 0;
    const tope = cfg.topes[dow];
    if (n <= tope) return;
    avisos.push([P.media, 'Media', 'Sobrecupo',
      DIAS[dow % 7] + ' ' + d.slice(8, 10) + '-' + d.slice(5, 7),
      d.slice(8, 10) + '-' + d.slice(5, 7) + '-' + d.slice(0, 4),
      n + ' sesiones contra un tope de ' + tope + '. Si es a propósito, ignóralo.']);
  });

  // 5. Conflicto entre Drive y Cal.com.
  hf.conflictos.forEach(function (c) {
    avisos.push([P.baja, 'Baja', 'Conflicto de periodicidad', c.nombre, '',
      c.detalle + '. Gana Cal.com. Corrige el nombre de la carpeta si Cal.com tiene razón.']);
  });

  // 6. Tope semanal Fonasa.
  agenda.fonasaSemana.forEach(function (n, w) {
    if (n <= cfg.topeFonasa) return;
    const l = new Date(agenda.lunes.getTime() + w * 7 * dia);
    avisos.push([P.media, 'Media', 'Tope Fonasa excedido',
      'Semana del ' + fmt_(l, 'dd-MM'), fmt_(l, 'dd-MM-yyyy'),
      n + ' sesiones Fonasa contra un tope de ' + cfg.topeFonasa +
      '. Deja menos espacio para particulares.']);
  });

  // 7. Configuracion incompleta.
  (cfg._faltantes || []).forEach(function (f) {
    avisos.push([P.baja, 'Baja', 'Configuración incompleta', f, '',
      'Se usó el valor por defecto. Corrige la celda en la hoja Configuración.']);
  });

  avisos.sort(function (a, b) {
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[2] !== b[2]) return a[2] < b[2] ? -1 : 1;
    return a[3] < b[3] ? -1 : 1;
  });
  return avisos;
}

/* ------------------------------------------------------------- escritura */

function prepararHoja_(nombre, indice) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre, indice);
  const todo = hoja.getRange(1, 1, hoja.getMaxRows(), hoja.getMaxColumns());
  todo.breakApart();
  // clear() NO borra las validaciones de datos. Sin esto queda una casilla fantasma
  // de una version anterior que se puede marcar sin que pase nada.
  todo.clearDataValidations();
  hoja.clear();
  return hoja;
}

function escribirAvisos_(avisos) {
  const hoja = prepararHoja_(HOJA_AVISOS, 1);
  const cab = ['Prioridad', 'Tipo', 'Quién o cuándo', 'Fecha límite', 'Qué hacer'];
  hoja.getRange(1, 1).setValue('Actualizado ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') +
    '. Si esta hoja está vacía, no hay nada que requiera tu atención.')
    .setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(1, 1, 1, cab.length).merge();
  hoja.getRange(2, 1, 1, cab.length).setValues([cab])
    .setFontWeight('bold').setBackground(COLOR.encabezado).setFontColor(COLOR.encabezadoTexto);

  if (!avisos.length) {
    hoja.getRange(3, 1).setValue('Nada pendiente. Todo en orden.').setFontColor(COLOR.fijaTexto);
  } else {
    const filas = avisos.map(function (a) { return [a[1], a[2], a[3], a[4], a[5]]; });
    const fondos = avisos.map(function (a) {
      const f = a[0] === 1 ? COLOR.alerta : (a[0] === 2 ? COLOR.media : COLOR.franja);
      return [f, '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'];
    });
    const textos = avisos.map(function (a) {
      const t = a[0] === 1 ? COLOR.alertaTexto : (a[0] === 2 ? COLOR.mediaTexto : COLOR.otraTexto);
      return [t, COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto];
    });
    const r = hoja.getRange(3, 1, filas.length, cab.length);
    r.setNumberFormat('@');
    r.setValues(filas).setBackgrounds(fondos).setFontColors(textos).setVerticalAlignment('top');
    hoja.getRange(3, 1, filas.length, 1).setFontWeight('bold').setHorizontalAlignment('center');
  }
  hoja.setFrozenRows(2);
  hoja.setColumnWidth(1, 90);
  hoja.setColumnWidth(2, 200);
  hoja.setColumnWidth(3, 280);
  hoja.setColumnWidth(4, 110);
  hoja.setColumnWidth(5, 560);
  if (avisos.length) hoja.getRange(3, 5, avisos.length, 1).setWrap(true);
}

function escribirAgenda_(a) {
  const hoja = prepararHoja_(HOJA_AGENDA, 2);
  const valores = [], fondos = [], textos = [], pesos = [];
  const hoy = fmt_(new Date(), 'yyyy-MM-dd');
  const titulos = [];
  const blanco = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'];
  const gris = [COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto,
                COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto];
  const semanas = Math.floor(a.dias.length / 7);

  // C61: primero las semanas pasadas (se pintan en gris al final), despues las de siempre.
  const bloques = a.previas.map(function (p) {
    return { lunes: p.lunes, dias: p.dias, fonasa: p.fonasa };
  });
  for (let w = 0; w < semanas; w++) {
    bloques.push({ lunes: new Date(a.lunes.getTime() + w * 7 * 86400000),
                   dias: a.dias.slice(w * 7, w * 7 + 7), fonasa: a.fonasaSemana[w] });
  }

  bloques.forEach(function (b) {
    const diasSemana = b.dias.slice(0, 6);
    titulos.push(valores.length + 1);
    valores.push(['Semana del ' + fmt_(b.lunes, 'dd-MM') +
      ' al ' + fmt_(new Date(b.lunes.getTime() + 5 * 86400000), 'dd-MM') +
      '   ·   ' + b.fonasa + ' sesiones Fonasa', '', '', '', '', '', '']);
    fondos.push(blanco.slice()); textos.push(gris.slice());
    pesos.push(['bold', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal']);

    const enc = ['Hora'], encF = [COLOR.encabezado], encT = [COLOR.encabezadoTexto];
    for (let j = 0; j < diasSemana.length; j++) {
      const d = diasSemana[j];
      enc.push(DIAS_CORTOS[j] + ' ' + d.slice(8, 10) + '-' + d.slice(5, 7) +
        (d === hoy ? ' (hoy)' : ''));
      encF.push(COLOR.encabezado); encT.push(COLOR.encabezadoTexto);
    }
    valores.push(enc); fondos.push(encF); textos.push(encT);
    pesos.push(['bold', 'bold', 'bold', 'bold', 'bold', 'bold', 'bold']);

    a.horas.forEach(function (h) {
      const fila = [(h < 10 ? '0' : '') + h + ':00'];
      const ff = [COLOR.franja], ft = [COLOR.otraTexto];
      diasSemana.forEach(function (d) {
        const c = a.celdas[d + '|' + h];
        fila.push(c ? c.texto : '');
        if (!c) { ff.push(COLOR.vacio); ft.push(COLOR.otraTexto); }
        else if (c.tipo === 'fija') { ff.push(COLOR.fijaFondo); ft.push(COLOR.fijaTexto); }
        else if (c.tipo === 'primera') { ff.push(COLOR.primeraFondo); ft.push(COLOR.primeraTexto); }
        else if (c.tipo === 'libre') { ff.push(COLOR.libreFondo); ft.push(COLOR.libreTexto); }
        else { ff.push(COLOR.otraFondo); ft.push(COLOR.otraTexto); }
      });
      valores.push(fila); fondos.push(ff); textos.push(ft);
      pesos.push(['bold', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal']);
    });

    valores.push(['', '', '', '', '', '', '']);
    fondos.push(blanco.slice()); textos.push(gris.slice());
    pesos.push(['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal']);
  });

  const rango = hoja.getRange(1, 1, valores.length, 7);
  rango.setNumberFormat('@');
  rango.setValues(valores).setBackgrounds(fondos).setFontColors(textos).setFontWeights(pesos)
    .setVerticalAlignment('middle').setFontSize(10);
  titulos.forEach(function (r) { hoja.getRange(r, 1, 1, 7).merge().setFontSize(11); });

  hoja.setColumnWidth(1, 60);
  for (let c = 2; c <= 7; c++) hoja.setColumnWidth(c, 175);

  const ley = valores.length + 2;
  hoja.getRange(ley, 1).setValue('Verde: hora fija')
    .setBackground(COLOR.fijaFondo).setFontColor(COLOR.fijaTexto);
  hoja.getRange(ley, 2).setValue('Terracota: primera sesión')
    .setBackground(COLOR.primeraFondo).setFontColor(COLOR.primeraTexto);
  hoja.getRange(ley, 3).setValue('Gris: control, avance o pareja')
    .setBackground(COLOR.otraFondo).setFontColor(COLOR.otraTexto);
  hoja.getRange(ley, 4).setValue('Crema: slot quincenal libre')
    .setBackground(COLOR.libreFondo).setFontColor(COLOR.libreTexto);
  hoja.getRange(ley, 5).setValue('Gris claro: semana pasada')
    .setBackground(COLOR.pasadaFondo).setFontColor(COLOR.pasadaTexto);
  hoja.getRange(ley + 1, 1, 1, 7).merge().setValue(
    'Códigos: SF semanal Fonasa, SP semanal particular, QA-F y QB-F quincenal Fonasa en semana A o B, ' +
    'QA-P y QB-P quincenal particular. "Libre QB" significa que ese día y hora está libre en las semanas B.'
  ).setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(ley + 2, 1, 1, 7).merge().setValue(
    'Actualizado ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') + '.'
  ).setFontSize(9).setFontColor(COLOR.tenue);

  // C59: marca las horas que Juan no quiere ofrecer, leidas de la hoja
  // 'Horarios protegidos'. Va al final, sobre la grilla ya escrita, y solo
  // pinta celdas vacias. Nunca lanza: ver horarios-protegidos.gs.
  pintarProtegidos_(hoja);

  // C61: la semana pasada va en gris de una sola pasada y DESPUES de pintarProtegidos_,
  // que si no volveria a poner morado encima. Costo aceptado: en una semana ya ocurrida
  // la distincion fija, primera, resto no sirve para decidir nada, es historia.
  const filasBloque = 3 + a.horas.length;
  hoja.getRange(1, 1, a.previas.length * filasBloque - 1, 7)
    .setBackground(COLOR.pasadaFondo).setFontColor(COLOR.pasadaTexto);
}

function escribirCarga_(cfg, a) {
  const hoja = prepararHoja_(HOJA_CARGA, 3);
  const filas = [], fondos = [], textos = [];
  const hoy = fmt_(new Date(), 'yyyy-MM-dd');

  a.dias.forEach(function (d) {
    const f = new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1,
                                Number(d.slice(8, 10)), 15));
    const dow = Number(fmt_(f, 'u'));
    if (dow === 7) return;
    const tope = cfg.topes[dow];
    const n = a.conteo[d] || 0;
    const libres = tope - n;
    filas.push([d.slice(8, 10) + '-' + d.slice(5, 7) + '-' + d.slice(0, 4) +
      (d === hoy ? ' (hoy)' : ''), DIAS[dow % 7], n, tope, libres,
      libres > 0 ? ('Quedan ' + libres) : (libres === 0 ? 'Lleno' : 'Sobrecupo (+' + (-libres) + ')'),
      a.fonasa[d] || 0, a.particular[d] || 0]);
    const c = libres < 0 ? COLOR.alerta : (libres === 0 ? COLOR.franja : COLOR.ok);
    const t = libres < 0 ? COLOR.alertaTexto : (libres === 0 ? COLOR.otraTexto : COLOR.okTexto);
    fondos.push(['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', c, c, '#FFFFFF', '#FFFFFF']);
    textos.push([COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto, COLOR.otraTexto,
                 t, t, COLOR.otraTexto, COLOR.otraTexto]);
  });

  hoja.getRange(1, 1).setValue('Actualizado ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') +
    '. Topes y umbrales salen de la hoja Configuración. Sobrecupo no es un error: ' +
    'es un día en que agendaste por encima de tu tope.')
    .setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(1, 1, 1, 8).merge();
  hoja.getRange(2, 1, 1, 8).setValues([['Fecha', 'Día', 'Agendadas', 'Tope', 'Libres', 'Estado',
    'Fonasa', 'Particular']])
    .setFontWeight('bold').setBackground(COLOR.encabezado).setFontColor(COLOR.encabezadoTexto);
  if (filas.length) {
    hoja.getRange(3, 1, filas.length, 2).setNumberFormat('@');
    hoja.getRange(3, 1, filas.length, 8).setValues(filas)
      .setBackgrounds(fondos).setFontColors(textos);
  }
  hoja.setFrozenRows(2);
  hoja.autoResizeColumns(1, 8);
  hoja.setColumnWidth(1, 130);
  hoja.setColumnWidth(6, 150);
}

function escribirHorasFijas_(tabla, sinCalzar) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const previa = libro.getSheetByName(HOJA_HORAS);

  // Notas y Seguimiento se conservan POR PERSONA: las filas se reordenan cada corrida.
  const notasPrevias = {};
  if (previa && previa.getLastRow() > 2) {
    const ancho = Math.min(COLUMNAS.length, previa.getLastColumn());
    previa.getRange(3, 1, previa.getLastRow() - 2, ancho).getValues().forEach(function (f) {
      const k = claveNombre_(f[0]);
      if (!k) return;
      const n1 = f[COL_NOTAS - 1], n2 = f[COL_NOTAS];
      if (n1 || n2) notasPrevias[k] = [n1 || '', n2 || ''];
    });
  }
  const cuerpo = tabla.map(function (f) {
    return f.datos.concat(notasPrevias[claveNombre_(f.datos[0])] || ['', '']);
  });

  const hoja = prepararHoja_(HOJA_HORAS, 4);
  hoja.getRange(1, 1).setValue('Actualizado ' + fmt_(new Date(), 'dd-MM-yyyy HH:mm') +
    '. Nombre y periodicidad desde las carpetas de Actuales. Día, hora y modalidad desde Cal.com. ' +
    'Quincenal A y B indican en qué semana cae: dos personas de letras distintas comparten el mismo slot.')
    .setFontSize(9).setFontColor(COLOR.tenue);
  hoja.getRange(1, 1, 1, COLUMNAS.length).merge();
  hoja.getRange(2, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
    .setFontWeight('bold').setBackground(COLOR.encabezado).setFontColor(COLOR.encabezadoTexto);

  if (cuerpo.length) {
    hoja.getRange(3, 1, cuerpo.length, COLUMNAS.length).setNumberFormat('@').setValues(cuerpo);
    const estados = hoja.getRange(3, 9, cuerpo.length, 1);
    hoja.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pendiente')
        .setBackground(COLOR.primeraFondo).setFontColor(COLOR.primeraTexto)
        .setRanges([estados]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Agendada')
        .setBackground(COLOR.fijaFondo).setFontColor(COLOR.fijaTexto)
        .setRanges([estados]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextContains('Quincenal A')
        .setBackground('#E3EDF4').setFontColor('#1F4E6B')
        .setRanges([hoja.getRange(3, 2, cuerpo.length, 1)]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextContains('Quincenal B')
        .setBackground('#F4EDE3').setFontColor('#6B4A1F')
        .setRanges([hoja.getRange(3, 2, cuerpo.length, 1)]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenCellNotEmpty()
        .setBackground(COLOR.alerta).setFontColor(COLOR.alertaTexto)
        .setRanges([hoja.getRange(3, 10, cuerpo.length, 1)]).build()
    ]);
  }
  hoja.setFrozenRows(2);
  hoja.autoResizeColumns(1, COLUMNAS.length);
  hoja.setColumnWidth(1, 200);
  hoja.setColumnWidth(2, 110);
  hoja.setColumnWidth(10, 260);
  hoja.setColumnWidth(12, 220);
  hoja.setColumnWidth(13, 220);

  const hoja2 = prepararHoja_(HOJA_SIN_CALZAR, 5);
  hoja2.getRange(1, 1).setValue(
    'Reservas de hora fija en Cal.com que NO calzaron con ninguna carpeta de Actuales. ' +
    'Si aquí hay algo, esa persona aparece como Pendiente en Horas fijas sin serlo: ' +
    'agrégala en la hoja Alias y vuelve a actualizar.').setFontSize(9).setFontColor(COLOR.tenue);
  hoja2.getRange(2, 1, 1, 6)
    .setValues([['Nombre en Cal.com', 'Correo', 'Periodicidad', 'Modalidad', 'Día', 'Hora']])
    .setFontWeight('bold').setBackground('#C97B5E').setFontColor('#FFFFFF');
  if (sinCalzar.length) {
    hoja2.getRange(3, 1, sinCalzar.length, 6).setNumberFormat('@').setValues(sinCalzar);
  } else {
    hoja2.getRange(3, 1).setValue('Todo calzó. Ninguna reserva de hora fija quedó sin carpeta.')
      .setFontColor(COLOR.fijaTexto);
  }
  hoja2.setFrozenRows(2);
  hoja2.autoResizeColumns(1, 6);
  hoja2.setColumnWidth(1, 200);
  hoja2.setColumnWidth(2, 240);
}

function ordenarHojas_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  ORDEN_HOJAS.forEach(function (n, i) {
    const h = libro.getSheetByName(n);
    if (!h) return;
    libro.setActiveSheet(h);
    libro.moveActiveSheet(i + 1);
  });
  const c = libro.getSheetByName(HOJA_CONFIG);
  if (c) libro.setActiveSheet(c);
}
