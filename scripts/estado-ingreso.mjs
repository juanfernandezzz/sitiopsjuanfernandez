/**
 * Lee los dos interruptores del sitio desde la Planilla y los escribe en
 * src/lib/estadoIngreso.js, ANTES de que corra Vite. Con eso el HTML
 * prerenderizado sale ya con los valores correctos: no hay peticion en el
 * navegador, no hay parpadeo del CTA primario y el crawler indexa la verdad, no
 * un valor por defecto que se corrige despues.
 *
 * LOS DOS INTERRUPTORES
 *   ingresoFonasaAbierto  booleano. Si el ingreso Fonasa acepta reservas.
 *   heroModo              'particular' o 'fonasa'. Que cara muestra el sitio,
 *                         segun cual de las dos campanas de Google Ads este
 *                         corriendo. Nunca las dos a la vez.
 * Son independientes: cada uno se valida y se escribe por su cuenta, y que uno
 * falle no impide que el otro se aplique.
 *
 * ORIGEN DEL DATO
 *   PLANILLA_ESTADO_URL, variable de entorno de Netlify. Apunta al Web App de
 *   Apps Script publicado desde la Planilla (apps-script/estado-ingreso.gs).
 *   Devuelve {"ingresoFonasaAbierto": true|false, "heroModo": "particular"}.
 *   No vive en el repo a proposito: es una URL de la cuenta de Juan.
 *
 * ESTE SCRIPT NUNCA HACE FALLAR EL BUILD. Sale con codigo 0 pase lo que pase.
 * Un deploy caido es peor que un deploy con Fonasa cerrado: lo primero tumba el
 * sitio entero, lo segundo solo deja de ofrecer una modalidad que hoy ya no se
 * ofrece. Cuando no puede leer, NO escribe, y el build usa los valores
 * versionados.
 *
 * DIRECCION DEL FALLO
 *   sin variable de entorno  -> no escribe -> versionado -> Fonasa cerrado, hero particular
 *   fetch falla o da timeout -> no escribe -> versionado -> Fonasa cerrado, hero particular
 *   respuesta no es JSON     -> no escribe -> versionado -> Fonasa cerrado, hero particular
 *   el campo no es booleano  -> no escribe ESE campo -> Fonasa cerrado
 *   heroModo no es una de las dos cadenas -> no escribe ESE campo -> hero particular
 *   valores validos          -> escribe esos valores
 * Las dos filas del medio son POR CAMPO: un campo invalido NO arrastra al otro.
 * Con ingresoFonasaAbierto true y heroModo "FONASA" el sitio queda con Fonasa
 * ABIERTO y el hero en particular, no con los dos en su valor versionado. C55
 * corrige el aviso, que hasta entonces afirmaba lo segundo en los dos casos.
 * Por eso toda ejecucion termina imprimiendo una linea ESTADO QUE SE COMPILA,
 * leida del archivo en disco: es la unica que dice el estado real de los dos
 * interruptores, sin deducirlo de que fallo y que no.
 * La lectura externa solo puede ABRIR. Nunca cierra por su cuenta, porque el
 * cierre ya es el punto de partida.
 *
 * RIESGO RESIDUAL, ASUMIDO Y CONSCIENTE
 *   Si el ingreso esta ABIERTO y la lectura falla durante un build cualquiera
 *   (por ejemplo un git push que no tiene nada que ver), el sitio se despliega
 *   con Fonasa cerrado y se queda asi, en silencio, hasta el siguiente build.
 *   Lo mismo vale para el modo del hero: una campana Fonasa en curso vuelve a
 *   la cara particular sin que nadie lo note. Por eso el aviso de abajo se
 *   imprime con marco: tiene que saltar a la vista en el registro de Netlify.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(RAIZ, 'src', 'lib', 'estadoIngreso.js');
const TIEMPO_LIMITE_MS = 10000;

// Unicos modos admitidos. Cualquier otra cadena se descarta y queda el valor
// versionado: un modo desconocido dejaria el hero sin variante que resolver.
const MODOS = ['particular', 'fonasa'];

// C55: este aviso ya no afirma en que estado queda el sitio. Antes decia
// siempre "se despliega con los valores versionados", y eso es falso cuando un
// campo se aplico y el otro no: la aplicacion es independiente por campo. Con
// ingresoFonasaAbierto valido y heroModo invalido, el archivo quedaba en true y
// el registro decia CERRADO. Un aviso que afirma sin comprobar es peor que no
// tener aviso. El estado real lo imprime estadoFinal(), leyendo el archivo.
function aviso(texto) {
  const linea = '='.repeat(70);
  console.warn('\n' + linea);
  console.warn('[estado-ingreso] ' + texto);
  console.warn('[estado-ingreso] Ese campo conserva su valor versionado.');
  console.warn(linea + '\n');
}

// Lee el archivo en disco, no las variables en memoria: es lo unico que dice la
// verdad sobre lo que se va a compilar.
function estadoFinal() {
  const fonasa = valorVersionadoFonasa() ? 'ABIERTO' : 'cerrado';
  const modo = valorVersionadoModo();
  console.log(`[estado-ingreso] ESTADO QUE SE COMPILA -> Ingreso Fonasa: ${fonasa} | Modo del hero: ${modo}`);
}

function valorVersionadoFonasa() {
  const texto = readFileSync(DESTINO, 'utf8');
  return /INGRESO_FONASA_ABIERTO_PLANILLA\s*=\s*true/.test(texto);
}

function valorVersionadoModo() {
  const texto = readFileSync(DESTINO, 'utf8');
  const m = texto.match(/HERO_MODO_PLANILLA\s*=\s*'([a-z]+)'/);
  return m ? m[1] : 'particular';
}

/*
 * La comprobacion es "la linea existe", no "el texto cambio". C53b comparaba el
 * antes y el despues, asi que cuando la Planilla confirmaba el valor que ya
 * estaba versionado la sustitucion no cambiaba ningun byte y el script lo
 * denunciaba como si el archivo se hubiera deformado: un aviso enmarcado y
 * falso en el registro de Netlify cada vez que el estado NO cambiaba, que es el
 * caso normal. Probar la expresion regular separa los dos casos.
 */
function sustituir(patron, reemplazo, nombre) {
  const texto = readFileSync(DESTINO, 'utf8');
  if (!patron.test(texto)) {
    aviso(`No se pudo sustituir ${nombre} en estadoIngreso.js. El archivo cambio de forma.`);
    return false;
  }
  writeFileSync(DESTINO, texto.replace(patron, reemplazo), 'utf8');
  return true;
}

function escribirFonasa(abierto) {
  return sustituir(
    /export const INGRESO_FONASA_ABIERTO_PLANILLA = (?:true|false);/,
    `export const INGRESO_FONASA_ABIERTO_PLANILLA = ${abierto};`,
    'INGRESO_FONASA_ABIERTO_PLANILLA'
  );
}

function escribirModo(modo) {
  return sustituir(
    /export const HERO_MODO_PLANILLA = '[a-z]*';/,
    `export const HERO_MODO_PLANILLA = '${modo}';`,
    'HERO_MODO_PLANILLA'
  );
}

function aplicarFonasa(datos) {
  const abierto = datos?.ingresoFonasaAbierto;
  if (typeof abierto !== 'boolean') {
    aviso(
      'La respuesta no trae ingresoFonasaAbierto como booleano. Recibido: ' +
        JSON.stringify(abierto)
    );
    return;
  }

  const antes = valorVersionadoFonasa();
  if (!escribirFonasa(abierto)) return;

  console.log(
    `[estado-ingreso] Ingreso Fonasa: ${abierto ? 'ABIERTO' : 'cerrado'}` +
      (antes === abierto ? ' (sin cambio respecto del valor versionado).' : ' (cambia respecto del valor versionado).')
  );
}

function aplicarModo(datos) {
  const modo = datos?.heroModo;
  if (typeof modo !== 'string' || !MODOS.includes(modo)) {
    aviso(
      'La respuesta no trae heroModo como "particular" o "fonasa". Recibido: ' +
        JSON.stringify(modo)
    );
    return;
  }

  const antes = valorVersionadoModo();
  if (!escribirModo(modo)) return;

  console.log(
    `[estado-ingreso] Modo del hero: ${modo}` +
      (antes === modo ? ' (sin cambio respecto del valor versionado).' : ' (cambia respecto del valor versionado).')
  );
}

async function main() {
  const url = process.env.PLANILLA_ESTADO_URL;

  if (!url) {
    aviso('Falta la variable de entorno PLANILLA_ESTADO_URL.');
    estadoFinal();
    return;
  }

  let datos;
  try {
    const respuesta = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
    if (!respuesta.ok) {
      aviso(`La Planilla respondio ${respuesta.status}.`);
      estadoFinal();
      return;
    }
    datos = await respuesta.json();
  } catch (error) {
    aviso(`No se pudo leer la Planilla: ${error?.message || error}`);
    estadoFinal();
    return;
  }

  console.log('[estado-ingreso] Planilla leida.');
  aplicarFonasa(datos);
  aplicarModo(datos);
  estadoFinal();
}

// Sin catch aqui el build de Netlify se caeria ante cualquier error inesperado.
main().catch((error) => {
  aviso(`Error inesperado: ${error?.message || error}`);
  estadoFinal();
});
