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

const archivos = ['contacto.js', 'cal.js', 'faqData.js', 'precios.js', 'motivos.js', 'credenciales.js', 'respiraNucleo.js', 'hero.js', 'sesiones.js', 'proceso.js', 'postReserva.js'];

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
