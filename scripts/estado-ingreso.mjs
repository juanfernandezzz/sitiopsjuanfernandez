/**
 * Lee el estado del ingreso Fonasa desde la Planilla y lo escribe en
 * src/lib/estadoIngreso.js, ANTES de que corra Vite. Con eso el HTML
 * prerenderizado sale ya con el valor correcto: no hay peticion en el navegador,
 * no hay parpadeo del CTA primario y el crawler indexa la verdad, no un valor
 * por defecto que se corrige despues.
 *
 * ORIGEN DEL DATO
 *   PLANILLA_ESTADO_URL, variable de entorno de Netlify. Apunta al Web App de
 *   Apps Script publicado desde la Planilla (apps-script/estado-ingreso.gs).
 *   Devuelve {"ingresoFonasaAbierto": true|false}.
 *   No vive en el repo a proposito: es una URL de la cuenta de Juan.
 *
 * ESTE SCRIPT NUNCA HACE FALLAR EL BUILD. Sale con codigo 0 pase lo que pase.
 * Un deploy caido es peor que un deploy con Fonasa cerrado: lo primero tumba el
 * sitio entero, lo segundo solo deja de ofrecer una modalidad que hoy ya no se
 * ofrece. Cuando no puede leer, NO escribe, y el build usa el false versionado.
 *
 * DIRECCION DEL FALLO
 *   sin variable de entorno  -> no escribe -> false versionado -> Fonasa cerrado
 *   fetch falla o da timeout -> no escribe -> false versionado -> Fonasa cerrado
 *   respuesta no es JSON     -> no escribe -> false versionado -> Fonasa cerrado
 *   el campo no es booleano  -> no escribe -> false versionado -> Fonasa cerrado
 *   booleano valido          -> escribe ese valor
 * La lectura externa solo puede ABRIR. Nunca cierra por su cuenta, porque el
 * cierre ya es el punto de partida.
 *
 * RIESGO RESIDUAL, ASUMIDO Y CONSCIENTE
 *   Si el ingreso esta ABIERTO y la lectura falla durante un build cualquiera
 *   (por ejemplo un git push que no tiene nada que ver), el sitio se despliega
 *   con Fonasa cerrado y se queda asi, en silencio, hasta el siguiente build.
 *   Por eso el aviso de abajo se imprime con marco: tiene que saltar a la vista
 *   en el registro de build de Netlify.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = resolve(RAIZ, 'src', 'lib', 'estadoIngreso.js');
const TIEMPO_LIMITE_MS = 10000;

function aviso(texto) {
  const linea = '='.repeat(70);
  console.warn('\n' + linea);
  console.warn('[estado-ingreso] ' + texto);
  console.warn('[estado-ingreso] El sitio se despliega con el valor versionado: Fonasa CERRADO.');
  console.warn(linea + '\n');
}

function valorVersionado() {
  const texto = readFileSync(DESTINO, 'utf8');
  return /INGRESO_FONASA_ABIERTO_PLANILLA\s*=\s*true/.test(texto);
}

function escribir(abierto) {
  const texto = readFileSync(DESTINO, 'utf8');
  const nuevo = texto.replace(
    /export const INGRESO_FONASA_ABIERTO_PLANILLA = (?:true|false);/,
    `export const INGRESO_FONASA_ABIERTO_PLANILLA = ${abierto};`
  );
  if (nuevo === texto) {
    aviso('No se pudo sustituir el valor en estadoIngreso.js. El archivo cambio de forma.');
    return false;
  }
  writeFileSync(DESTINO, nuevo, 'utf8');
  return true;
}

async function main() {
  const url = process.env.PLANILLA_ESTADO_URL;

  if (!url) {
    aviso('Falta la variable de entorno PLANILLA_ESTADO_URL.');
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
      return;
    }
    datos = await respuesta.json();
  } catch (error) {
    aviso(`No se pudo leer la Planilla: ${error?.message || error}`);
    return;
  }

  const abierto = datos?.ingresoFonasaAbierto;
  if (typeof abierto !== 'boolean') {
    aviso(
      'La respuesta no trae ingresoFonasaAbierto como booleano. Recibido: ' +
        JSON.stringify(abierto)
    );
    return;
  }

  const antes = valorVersionado();
  if (!escribir(abierto)) return;

  console.log(
    `[estado-ingreso] Planilla leida. Ingreso Fonasa: ${abierto ? 'ABIERTO' : 'cerrado'}` +
      (antes === abierto ? ' (sin cambio respecto del valor versionado).' : ' (cambia respecto del valor versionado).')
  );
}

// Sin catch aqui el build de Netlify se caeria ante cualquier error inesperado.
main().catch((error) => {
  aviso(`Error inesperado: ${error?.message || error}`);
});
