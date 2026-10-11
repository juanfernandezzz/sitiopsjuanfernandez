/**
 * HORARIOS PROTEGIDOS (ciclo C59)
 *
 * Marca en la hoja Agenda por semana las horas que Juan NO quiere ofrecer,
 * aunque esten libres. Es lo que mira al final de cada sesion para proponer
 * la siguiente, asi que la marca tiene que estar ahi y no en otro sistema.
 *
 * POR QUE NO SE PINTA A MANO
 * escribirAgenda_ redibuja esa hoja entera en cada actualizacion, con
 * setValues y setBackgrounds. Un color puesto a mano se pierde en la
 * siguiente pasada. Por eso la marca vive en una hoja que el script LEE.
 *
 * ALCANCE, Y LO QUE NO HACE
 * Esto es visual. NO cierra nada en Cal.com. Hoy alcanza, porque las primeras
 * sesiones solo se pueden reservar en el horario 'Horas ingresos' (domingo),
 * asi que nadie de afuera puede tomar una hora protegida de lunes a sabado:
 * el unico que puede ocuparla es Juan al agendar controles. Si algun dia se
 * abren ingresos en mas dias, esto deja de alcanzar y hay que cerrar tambien
 * la disponibilidad en Cal.com.
 *
 * COMO SE ENGANCHA
 * escribirAgenda_ llama a pintarProtegidos_(hoja) como ultima linea. Se pinta
 * DESPUES de que la grilla ya esta escrita, leyendo la hoja ya renderizada en
 * vez de meterse en el bucle que la arma. Asi este archivo no depende de como
 * escribirAgenda_ construya la grilla por dentro.
 *
 * INSTALACION: ejecutar crearHojaProtegidos() una vez.
 */

var HOJA_PROTEGIDOS = 'Horarios protegidos';
var ETIQUETA_PROTEGIDO = 'PROTEGIDA';
var FONDO_PROTEGIDO = '#6B4F8A';
var TEXTO_PROTEGIDO = '#FFFFFF';
var DIAS_LARGOS_HP = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/** Instalacion. Correr UNA vez. Si la hoja ya existe, no la pisa. */
function crearHojaProtegidos() {
  var libro = SpreadsheetApp.getActive();
  var hoja = libro.getSheetByName(HOJA_PROTEGIDOS);
  if (hoja) { Logger.log('La hoja ' + HOJA_PROTEGIDOS + ' ya existe. No se toco nada.'); return; }
  hoja = libro.insertSheet(HOJA_PROTEGIDOS);
  hoja.getRange('A1:D1').setValues([['Dia', 'Desde', 'Hasta', 'Motivo']])
    .setFontWeight('bold').setBackground('#2A3B4C').setFontColor('#FFFFFF');
  hoja.getRange('A2:D2').setValues([['viernes', '13:00', '14:00', '']]);
  hoja.getRange('A4').setValue('Una fila por bloque protegido. Agrega las que necesites.');
  hoja.getRange('A5').setValue('Las horas van cerradas: 13:00 a 14:00 marca una hora; 13:00 a 15:00 marca dos.');
  hoja.getRange('A6').setValue('Se repite todas las semanas. Si esa hora ya tiene paciente, gana el paciente.');
  hoja.getRange('A7').setValue('Esto solo pinta la Agenda por semana. No cierra nada en Cal.com.');
  hoja.setColumnWidth(1, 110); hoja.setColumnWidth(2, 80);
  hoja.setColumnWidth(3, 80); hoja.setColumnWidth(4, 240);
  Logger.log('Hoja ' + HOJA_PROTEGIDOS + ' creada.');
}

/** Quita tildes y deja las tres primeras letras en minuscula: 'Miércoles' -> 'mie'. */
function _diaCortoHP_(texto) {
  var s = String(texto || '').trim().toLowerCase();
  s = s.replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
       .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');
  return s.slice(0, 3);
}

/** Devuelve la hora entera de '13:00', '13', '13 h' o 13. Si no se entiende, null. */
function _horaHP_(valor) {
  if (valor instanceof Date) return valor.getHours();
  var m = String(valor || '').trim().match(/^(\d{1,2})/);
  if (!m) return null;
  var h = Number(m[1]);
  return (h >= 0 && h <= 23) ? h : null;
}

/**
 * Lee la hoja y devuelve un conjunto de claves 'dia|hora', por ejemplo
 * 'vie|13'. Una fila mal escrita se ignora y se avisa, en vez de tumbar la
 * actualizacion entera de la planilla por un dato suelto.
 */
function _leerProtegidos_() {
  var set = {};
  var hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PROTEGIDOS);
  if (!hoja) return set;
  var ultima = hoja.getLastRow();
  if (ultima < 2) return set;
  var filas = hoja.getRange(2, 1, ultima - 1, 3).getValues();
  for (var i = 0; i < filas.length; i++) {
    var dia = _diaCortoHP_(filas[i][0]);
    if (!dia) continue;
    if (DIAS_LARGOS_HP.map(_diaCortoHP_).indexOf(dia) === -1) {
      Logger.log('Horarios protegidos, fila ' + (i + 2) + ': dia no reconocido, se ignora.');
      continue;
    }
    var desde = _horaHP_(filas[i][1]);
    var hasta = _horaHP_(filas[i][2]);
    if (desde === null) {
      Logger.log('Horarios protegidos, fila ' + (i + 2) + ': Desde no se entiende, se ignora.');
      continue;
    }
    if (hasta === null || hasta <= desde) hasta = desde + 1;
    for (var h = desde; h < hasta; h++) set[dia + '|' + h] = true;
  }
  return set;
}

/**
 * Pinta sobre la grilla ya escrita. Solo toca celdas VACIAS: si hay paciente,
 * gana el paciente. Nunca lanza: si algo no calza, la agenda queda como
 * estaba y el motivo va al registro. Una hoja de marcas no puede ser capaz de
 * romper la planilla completa.
 */
function pintarProtegidos_(hoja) {
  try {
    var set = _leerProtegidos_();
    var claves = Object.keys(set);
    if (!claves.length) return;

    var datos = hoja.getDataRange().getValues();
    var colDia = null;
    var pintadas = 0;
    var donde = [];

    for (var r = 0; r < datos.length; r++) {
      var fila = datos[r];
      // C59, correccion: antes una fila se tomaba por encabezado si CUALQUIER
      // celda empezaba con tres letras de un dia. Los nombres de los pacientes
      // la rompian: 'Maria Torres' y 'Marcela Rojas' dan 'mar', o sea martes,
      // asi que la fila de las 12:00 pasaba por encabezado y se llevaba el mapa
      // de columnas. La fila de las 13:00 de abajo quedaba mirando columnas que
      // no existian y no se marcaba nada. En las semanas sin ninguna Maria
      // encima si funcionaba, y por eso el fallo parecia aleatorio.
      // Ahora el encabezado se reconoce por lo unico que lo identifica de
      // verdad: la columna A dice 'Hora'. Ningun paciente se llama asi.
      if (String(fila[0] || '').trim().toLowerCase() === 'hora') {
        var mapa = {};
        for (var c = 1; c < fila.length; c++) {
          var d = _diaCortoHP_(fila[c]);
          if (DIAS_LARGOS_HP.map(_diaCortoHP_).indexOf(d) !== -1) mapa[c] = d;
        }
        colDia = mapa;
        continue;
      }
      if (!colDia) continue;

      var hora = _horaHP_(fila[0]);
      if (hora === null) { colDia = null; continue; }

      for (var col in colDia) {
        if (!set[colDia[col] + '|' + hora]) continue;
        if (String(fila[col] || '').trim() !== '') {
          donde.push('SALTADA F' + (r + 1) + 'C' + (Number(col) + 1) + '=[' + String(fila[col]) + ']');
          continue;
        }
        hoja.getRange(r + 1, Number(col) + 1)
          .setValue(ETIQUETA_PROTEGIDO)
          .setBackground(FONDO_PROTEGIDO)
          .setFontColor(TEXTO_PROTEGIDO);
        donde.push('F' + (r + 1) + 'C' + (Number(col) + 1) + '=' + colDia[col] + '|' + hora);
        pintadas++;
      }
    }
    Logger.log('Horarios protegidos: ' + pintadas + ' celdas marcadas: ' + donde.join(', '));
    _dejarRastroHP_(pintadas + ' celdas marcadas: ' + donde.join(', '));
  } catch (e) {
    Logger.log('Horarios protegidos: no se pudo pintar (' + e + '). La agenda queda intacta.');
    _dejarRastroHP_('ERROR: ' + e);
  }
}

/** Diagnostico. No escribe en ninguna hoja. */
function probarProtegidos() {
  var set = _leerProtegidos_();
  Logger.log('Bloques protegidos leidos: ' + Object.keys(set).join(', '));
}

/**
 * C59: deja constancia de la ultima pasada en la propia hoja de marcas, en F1.
 * El registro de ejecuciones de Apps Script es incomodo de leer; esto pone el
 * resultado donde Juan ya esta mirando. Si falla, no importa: es solo un aviso.
 */
function _dejarRastroHP_(texto) {
  try {
    var hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_PROTEGIDOS);
    if (!hoja) return;
    hoja.getRange('F1').setValue('Ultima pasada: ' + texto);
    hoja.getRange('F2').setValue(new Date());
  } catch (err) {}
}
