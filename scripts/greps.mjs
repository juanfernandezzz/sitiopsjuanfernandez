import { execSync } from 'node:child_process'
import fs from 'node:fs'

/*
 * Verificador de los 7 greps del proyecto (C31).
 *
 * Regla del ciclo: los siete deben devolver cero antes de cada commit. Hasta
 * ahora la lista canonica vivia fuera del repositorio y cada sesion nueva
 * tenia que reconstruirla; desde este archivo en adelante, ESTA es la lista
 * canonica. Uso: node scripts/greps.mjs (sale con codigo 1 si hay hallazgos).
 *
 * Los patrones se construyen partidos o con escapes unicode a proposito, para
 * que el verificador no se detecte a si mismo y para que un grep manual sobre
 * el arbol siga dando cero. Ademas evita las trampas de un grep manual en
 * Windows: las clases de caracteres multibyte tipo [<raya><semirraya>] operan
 * por bytes segun el locale y marcan falsos positivos con flechas u otros
 * simbolos UTF-8 que comparten bytes.
 *
 * Las 7 reglas:
 *   1. Raya (U+2014) prohibida en todo el arbol.
 *   2. Semirraya (U+2013) prohibida en todo el arbol.
 *   3. La certificacion de privacidad extranjera (la sigla de salud de EEUU)
 *      no se menciona: Doxy.me se presenta solo como plataforma certificada
 *      por Fonasa.
 *   4. La herramienta de analitica descartada en ciclos previos (nombre con
 *      P mayuscula) no vuelve a aparecer. GA4/gtag es la analitica vigente y
 *      NO forma parte de esta regla.
 *   5. El proveedor de correo descartado (email + js, junto) no vuelve a
 *      aparecer; la unica mencion tolerada es su dominio api.* dentro de la
 *      CSP de netlify.toml.
 *   6. La frase de marketing de cifrado punto a punto (en su version con la
 *      palabra extremo repetida) no se usa para describir la videoconsulta.
 *   7. Sin placeholders sin resolver (TO DO:, FIX ME, PLACE HOLDER escritos
 *      juntos, o dobles llaves con CLAVES_EN_MAYUSCULA adentro). El texto visible
 *      "+56 9 XXXX XXXX" de src/lib/validacion.js es una pista de formato
 *      legitima y queda fuera de esta regla a proposito.
 */

const BINARIOS = /\.(woff2?|ttf|otf|png|jpe?g|webp|gif|ico|pdf|zip|jar)$/i

const REGLAS = [
  { n: 1, nombre: 'raya U+2014', patron: new RegExp('\u2014') },
  { n: 2, nombre: 'semirraya U+2013', patron: new RegExp('\u2013') },
  { n: 3, nombre: 'sigla ' + 'HIP' + 'AA', patron: new RegExp('HIP' + 'AA', 'i') },
  { n: 4, nombre: 'analitica ' + 'Plau' + 'sible', patron: new RegExp('Plau' + 'sible') },
  {
    n: 5,
    nombre: 'correo ' + 'email' + 'js',
    patron: new RegExp('email' + 'js', 'i'),
    permitir: new RegExp('api\\.' + 'email' + 'js\\.com'),
  },
  { n: 6, nombre: 'cifrado ' + 'extremo a ' + 'extremo', patron: new RegExp('extremo a ' + 'extremo') },
  {
    n: 7,
    nombre: 'placeholders sin resolver',
    patron: new RegExp('TO' + 'DO:|FIX' + 'ME|PLACE' + 'HOLDER|\\{\\{[A-Z_]+\\}\\}'),
  },
]

const archivos = execSync('git ls-files --cached --others --exclude-standard', {
  encoding: 'utf8',
})
  .split('\n')
  .filter((ruta) => ruta && !BINARIOS.test(ruta))

const hallazgos = []

for (const ruta of archivos) {
  let contenido
  try {
    contenido = fs.readFileSync(ruta, 'utf8')
  } catch {
    continue
  }
  const lineas = contenido.split('\n')
  for (const regla of REGLAS) {
    lineas.forEach((linea, indice) => {
      if (!regla.patron.test(linea)) return
      if (regla.permitir && regla.permitir.test(linea)) return
      hallazgos.push({
        regla,
        ruta,
        numero: indice + 1,
        texto: linea.trim().slice(0, 120),
      })
    })
  }
}

for (const regla of REGLAS) {
  const propios = hallazgos.filter((h) => h.regla.n === regla.n)
  if (propios.length === 0) {
    console.log(`grep ${regla.n} (${regla.nombre}): cero`)
  } else {
    console.error(`grep ${regla.n} (${regla.nombre}): ${propios.length} hallazgo(s)`)
    for (const h of propios) {
      console.error(`   ${h.ruta}:${h.numero}: ${h.texto}`)
    }
  }
}

if (hallazgos.length > 0) {
  console.error(`\nFALLA: ${hallazgos.length} hallazgo(s) en total. No commitear.`)
  process.exit(1)
}

console.log('\nLos 7 greps en cero. Listo para commit.')
