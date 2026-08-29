// Copia el contenido canónico del sitio (/src/lib) a la carpeta interna de la
// app (src/contenido). Se ejecuta en postinstall, así corre en cada build de
// EAS, en cada OTA y en local, sin que nadie tenga que acordarse.
// Fuente única de verdad: /src/lib. Esta copia es un artefacto generado.
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url)); // /app/scripts
const origen = resolve(aqui, '..', '..', 'src', 'lib'); // /repo/src/lib
const destino = resolve(aqui, '..', 'src', 'contenido'); // /app/src/contenido

// C53: 'modalidades.js' y 'estadoIngreso.js' FALTABAN en esta lista desde C52e.
// cal.js y sesiones.js importan './modalidades', asi que la copia de la app
// quedaba con un import que Metro no puede resolver: cualquier build de EAS o
// cualquier OTA posterior a C52e no empaqueta. Al agregar un archivo a /src/lib
// que otro de esta lista importe, hay que agregarlo TAMBIEN aqui.
// La comprobacion de abajo existe para que el proximo olvido no sea silencioso.
const archivos = ['contacto.js', 'cal.js', 'faqData.js', 'precios.js', 'motivos.js', 'credenciales.js', 'sobreMi.js', 'respiraNucleo.js', 'hero.js', 'sesiones.js', 'proceso.js', 'postReserva.js', 'modalidades.js', 'estadoIngreso.js'];

mkdirSync(destino, { recursive: true });
let copiados = 0;
for (const a of archivos) {
  const src = resolve(origen, a);
  if (existsSync(src)) {
    copyFileSync(src, resolve(destino, a));
    copiados++;
  } else {
    console.warn('[sync-contenido] no se encontró:', src);
  }
}
console.log('[sync-contenido] ' + copiados + '/' + archivos.length + ' archivos sincronizados en ' + destino);

// C53: verifica que ningun archivo copiado importe a un hermano que se quedo
// fuera de la lista. Sin esto el fallo aparece recien al empaquetar con Metro,
// lejos de su causa. Falla ruidoso y con codigo 1: un OTA con imports rotos es
// peor que un postinstall que se detiene.
import { readFileSync } from 'node:fs';
const faltantes = [];
for (const a of archivos) {
  const ruta = resolve(destino, a);
  if (!existsSync(ruta)) continue;
  const codigo = readFileSync(ruta, 'utf8');
  for (const m of codigo.matchAll(/from '\.\/([a-zA-Z0-9_.-]+)'/g)) {
    const hermano = m[1].endsWith('.js') ? m[1] : m[1] + '.js';
    if (!archivos.includes(hermano)) faltantes.push(a + " importa './" + m[1] + "'");
  }
}
if (faltantes.length) {
  console.error('[sync-contenido] IMPORTS SIN SINCRONIZAR:');
  for (const f of faltantes) console.error('  - ' + f);
  console.error('[sync-contenido] Agrega esos archivos a la lista de arriba.');
  process.exit(1);
}
console.log('[sync-contenido] imports verificados: ninguno apunta fuera de la lista.');
