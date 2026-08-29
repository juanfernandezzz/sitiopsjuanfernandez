/**
 * ESTADO DEL INGRESO FONASA (ciclo C53)
 *
 * Publica hacia el sitio una sola cosa: si el ingreso Fonasa esta abierto o
 * cerrado. Juan lo escribe a mano en la hoja Configuracion; este archivo solo
 * lee. Es la misma frontera que ya rige en la Planilla: Configuracion y Alias
 * los escribe Juan, el script nunca decide por su cuenta.
 *
 * DOS PIEZAS
 *   doGet()              Web App que devuelve {"ingresoFonasaAbierto": bool}.
 *                        Lo consulta scripts/estado-ingreso.mjs en cada build
 *                        del sitio.
 *   alEditarConfiguracion(e)  Disparador instalable onEdit. Si se edito la
 *                        celda del ingreso, llama al build hook de Netlify y el
 *                        sitio se reconstruye solo.
 *
 * INSTALACION, EN ESTE ORDEN
 *   1. En la hoja Configuracion, agrega una fila nueva. En la columna A escribe
 *      exactamente: Ingreso Fonasa abierto
 *      En la columna B pon FALSE (casilla de verificacion o el texto FALSE).
 *   2. Pega este archivo en el proyecto de Apps Script de la Planilla
 *      (id 1-iPEB1UN7zvnzyquZPnnSFXAr9BD7pVp5XSxt_oRFqWgP0m0mou6WtUM).
 *      NO crees un proyecto nuevo: los disparadores viven en ese.
 *   3. Crea el build hook en Netlify: Site configuration > Build & deploy >
 *      Build hooks > Add build hook, rama main. Copia la URL.
 *   4. En Apps Script: Configuracion del proyecto > Propiedades del script >
 *      Agregar propiedad. Nombre: BUILD_HOOK_URL. Valor: la URL del paso 3.
 *      Va aca y no en el codigo porque cualquiera con esa URL puede disparar
 *      builds de tu sitio.
 *   5. Implementar > Nueva implementacion > Aplicacion web.
 *      Ejecutar como: Yo. Quien tiene acceso: Cualquier usuario.
 *      Google va a pedir autorizacion y va a mostrar el aviso de aplicacion no
 *      verificada. Es tu propio proyecto: continua.
 *      Copia la URL que termina en /exec.
 *   6. En Netlify: Site configuration > Environment variables > Add.
 *      Nombre: PLANILLA_ESTADO_URL. Valor: la URL del paso 5.
 *   7. Activadores > Anadir activador. Funcion: alEditarConfiguracion.
 *      Origen del evento: Desde hoja de calculo. Tipo: Al editar.
 *      Tiene que ser INSTALABLE: un onEdit simple no puede usar UrlFetchApp.
 *   8. Ejecuta probarEstado() una vez. Solo escribe en el registro.
 *
 * COMPROBACION
 *   Abre la URL del paso 5 en el navegador. Debe responder
 *   {"ingresoFonasaAbierto":false}. Si responde otra cosa, o pide iniciar
 *   sesion, la implementacion no quedo con acceso para cualquier usuario y el
 *   build no va a poder leerla.
 */

var HOJA_CONFIG = 'Configuración';
var ETIQUETA_INGRESO = 'Ingreso Fonasa abierto';

/**
 * Busca la etiqueta en la columna A y devuelve el booleano de la columna B.
 * Se busca por etiqueta y no por celda fija a proposito: si Juan inserta una
 * fila en Configuracion, una referencia tipo B13 empezaria a leer otro
 * parametro sin avisar. Esto falla ruidoso en vez de mentir en silencio.
 */
function _leerIngresoFonasa_() {
  var hoja = SpreadsheetApp.getActive().getSheetByName(HOJA_CONFIG);
  if (!hoja) throw new Error('No existe la hoja ' + HOJA_CONFIG);

  var filas = hoja.getRange(1, 1, hoja.getLastRow(), 2).getValues();
  for (var i = 0; i < filas.length; i++) {
    var etiqueta = String(filas[i][0]).trim();
    if (etiqueta !== ETIQUETA_INGRESO) continue;

    var crudo = filas[i][1];
    if (typeof crudo === 'boolean') return crudo;
    var texto = String(crudo).trim().toUpperCase();
    if (texto === 'TRUE' || texto === 'VERDADERO' || texto === 'SI' || texto === 'SÍ') return true;
    if (texto === 'FALSE' || texto === 'FALSO' || texto === 'NO') return false;
    throw new Error('El valor de "' + ETIQUETA_INGRESO + '" no es booleano: ' + crudo);
  }
  throw new Error('No se encontro la fila "' + ETIQUETA_INGRESO + '" en ' + HOJA_CONFIG);
}

/**
 * Web App. Ante cualquier problema devuelve false, no un error: el sitio no
 * puede quedarse sin respuesta, y false es el estado seguro. El motivo real
 * viaja en el campo error para poder diagnosticarlo sin romper el build.
 */
function doGet() {
  var salida = {};
  try {
    salida.ingresoFonasaAbierto = _leerIngresoFonasa_();
  } catch (error) {
    salida.ingresoFonasaAbierto = false;
    salida.error = String(error && error.message ? error.message : error);
  }
  return ContentService
    .createTextOutput(JSON.stringify(salida))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Disparador instalable onEdit. Solo reacciona a la celda del ingreso: sin este
 * filtro cada edicion de la Planilla dispararia un build de Netlify.
 */
function alEditarConfiguracion(e) {
  if (!e || !e.range) return;
  var hoja = e.range.getSheet();
  if (hoja.getName() !== HOJA_CONFIG) return;
  if (e.range.getColumn() !== 2) return;

  var etiqueta = String(hoja.getRange(e.range.getRow(), 1).getValue()).trim();
  if (etiqueta !== ETIQUETA_INGRESO) return;

  dispararBuild_();
}

function dispararBuild_() {
  var url = PropertiesService.getScriptProperties().getProperty('BUILD_HOOK_URL');
  if (!url) {
    Logger.log('Falta la propiedad BUILD_HOOK_URL. No se disparo ningun build.');
    return;
  }
  var respuesta = UrlFetchApp.fetch(url, {
    method: 'post',
    payload: '',
    muteHttpExceptions: true,
  });
  Logger.log('Build hook: HTTP ' + respuesta.getResponseCode());
}

/** Diagnostico. No escribe en la hoja ni dispara builds. */
function probarEstado() {
  try {
    Logger.log('Ingreso Fonasa abierto: ' + _leerIngresoFonasa_());
  } catch (error) {
    Logger.log('ERROR: ' + error);
  }
  Logger.log('Respuesta del Web App: ' + doGet().getContent());
  var url = PropertiesService.getScriptProperties().getProperty('BUILD_HOOK_URL');
  Logger.log('BUILD_HOOK_URL configurada: ' + (url ? 'si' : 'NO'));
}
