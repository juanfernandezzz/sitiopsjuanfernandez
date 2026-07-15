import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/*
 * C31: prerender de build (SSG) para la MPA.
 *
 * Corre despues de los dos builds de Vite (cliente y servidor):
 *   1. Importa dist-ssr/entry-server.js (build SSR de src/entry-server.jsx).
 *   2. Renderiza cada pagina a HTML.
 *   3. Inyecta ese HTML dentro del div raiz del archivo correspondiente en
 *      dist/, que hasta ahora viajaba vacio.
 *   4. Agrega un respaldo <noscript> con estilos: Framer Motion deja estados
 *      iniciales en linea (opacity 0 y transform) que el JS anima al entrar en
 *      pantalla; sin JS nadie los anima, asi que el respaldo los neutraliza y
 *      el contenido queda legible. Los crawlers no lo necesitan (leen el texto
 *      igual), pero la prueba humana con JavaScript desactivado si.
 *   5. Verifica que los textos canonicos quedaron en el HTML final. Si falta
 *      alguno, el build falla: Netlify no publica un dist a medio prerenderizar.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(RAIZ, 'dist')

const PAGINAS = [
  {
    archivo: 'index.html',
    raizDom: 'root',
    clave: 'main',
    textosRequeridos: [
      'La vida moderna nos mantiene siempre en movimiento',
      '5.570',
      'certificada por Fonasa',
      'Preguntas frecuentes',
    ],
  },
  {
    archivo: 'cita-agendada.html',
    raizDom: 'root-cita-agendada',
    clave: 'citaAgendada',
    textosRequeridos: [],
  },
  {
    archivo: 'consentimiento.html',
    raizDom: 'root-consentimiento',
    clave: 'consentimiento',
    textosRequeridos: [],
  },
  {
    archivo: 'asentimientoinformado.html',
    raizDom: 'root-asentimiento',
    clave: 'asentimiento',
    textosRequeridos: [],
  },
  {
    archivo: 'politica-privacidad.html',
    raizDom: 'root-politica',
    clave: 'politica',
    textosRequeridos: [],
  },
  {
    archivo: 'respira.html',
    raizDom: 'root-respira',
    clave: 'respira',
    textosRequeridos: [],
  },
]

// Minimo de caracteres que debe aportar el render de cada pagina. Un valor por
// debajo indica que React devolvio un arbol vacio o casi vacio.
const MINIMO_CARACTERES = 500

const RESPALDO_NOSCRIPT =
  '<noscript><style>[style*="opacity"]{opacity:1!important}[style*="transform"]{transform:none!important}</style></noscript>'

const { render } = await import(
  pathToFileURL(path.join(RAIZ, 'dist-ssr', 'entry-server.js')).href
)

let errores = 0

for (const pagina of PAGINAS) {
  const ruta = path.join(DIST, pagina.archivo)
  let html = fs.readFileSync(ruta, 'utf8')

  const marcador = `<div id="${pagina.raizDom}"></div>`
  if (!html.includes(marcador)) {
    console.error(`[prerender] ${pagina.archivo}: no se encontro ${marcador}`)
    errores += 1
    continue
  }

  const contenido = await render(pagina.clave)

  // Guardia de determinismo (C31 fix pack 3): el mismo render dos veces debe
  // dar bytes identicos. Si difiere, hay azar en el arbol y la hidratacion de
  // React descartaria el HTML en el navegador; mejor que falle el build aqui.
  const contenidoBis = await render(pagina.clave)
  if (contenido !== contenidoBis) {
    console.error(
      `[prerender] ${pagina.archivo}: render NO determinista (dos pasadas difieren); hay azar en el arbol de React`
    )
    errores += 1
    continue
  }

  if (contenido.length < MINIMO_CARACTERES) {
    console.error(
      `[prerender] ${pagina.archivo}: render sospechosamente corto (${contenido.length} caracteres)`
    )
    errores += 1
    continue
  }

  html = html.replace(marcador, `<div id="${pagina.raizDom}">${contenido}</div>`)
  html = html.replace('</head>', `${RESPALDO_NOSCRIPT}</head>`)

  // C31: el bundle completo (descarga Y ejecucion) se difiere hasta despues
  // del primer frame pintado. Con la etiqueta <script type="module"> y los
  // <link rel="modulepreload"> normales, todo el JS baja y se evalua antes de
  // la primera oportunidad de paint del HTML ya prerenderizado, y PageSpeed
  // imputa esa cadena completa (red mas CPU) como retraso de render del LCP.
  // Tras el paint, el modulo inyectado trae sus dependencias por si mismo. El
  // costo real es que la pagina se vuelve interactiva una fraccion despues;
  // el contenido ya era visible y legible desde el primer frame.
  // Tres vias de arranque, gana la primera: doble rAF (pestana visible, tras
  // el primer paint), window.load mas un respiro (pestanas en segundo plano,
  // donde rAF no dispara), y un temporizador de seguridad absoluto.
  html = html.replace(/[ \t]*<link rel="modulepreload"[^>]*>\r?\n?/g, '')
  html = html.replace(
    /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
    (_coincidencia, src) =>
      '<script>(function(){var hecho=false;function arrancar(){if(hecho)return;hecho=true;' +
      'var s=document.createElement("script");s.type="module";s.crossOrigin="";' +
      `s.src="${src}";document.head.appendChild(s)}` +
      'requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(arrancar,0)})});' +
      'window.addEventListener("load",function(){setTimeout(arrancar,150)});' +
      'setTimeout(arrancar,2500)})()</script>'
  )

  for (const texto of pagina.textosRequeridos) {
    if (!html.includes(texto)) {
      console.error(`[prerender] ${pagina.archivo}: falta el texto canonico "${texto}"`)
      errores += 1
    }
  }

  fs.writeFileSync(ruta, html)
  console.log(
    `[prerender] ${pagina.archivo}: ok (${contenido.length} caracteres inyectados)`
  )
}

if (errores > 0) {
  console.error(`[prerender] fallo con ${errores} error(es)`)
  process.exit(1)
}

console.log('[prerender] las 6 paginas quedaron con contenido en HTML crudo')
