# Registro de experimentos de rendimiento (ciclo C31)

Objetivo del ciclo: PageSpeed Insights móvil **85 o más** en `https://psicologojuanfernandez.cl/`.
Estado tras el fix pack 5 (15 de julio de 2026): **63 a 71** (la varianza propia de
PSI es de unos ±3 puntos). Todo lo demás está al máximo posible; el único bloqueo es el LCP.

Este documento existe para que **ningún ciclo futuro repita los descartes de abajo**. Es el mismo
razonamiento que llevó a versionar los siete greps en `scripts/greps.mjs`: el conocimiento que vive
solo en la memoria de una sesión se pierde y se vuelve a pagar.

---

## 1. El muro, con su perfil exacto

En el runner de PageSpeed, la portada tiene la **red lista a los ~0,4 s** y el **hilo principal
ocioso**, pero **la pantalla sigue en blanco hasta los ~2,3 s**. El propio informe lo muestra: los
primeros 5 fotogramas del filmstrip están vacíos y todos pesan lo mismo (779 bytes), y recién el
sexto trae contenido.

Ese retraso es lo que el simulador (Lantern) amplifica hasta el **LCP de laboratorio de 6,6 s**, que
cuesta 23 de los 25 puntos que el LCP aporta al puntaje. Desglose típico y estable entre corridas:

| Subparte del LCP | Duración |
|---|---|
| Time to First Byte | 20 a 80 ms |
| Retraso de carga del recurso | 114 a 304 ms |
| Duración de la carga del recurso | 0 a 149 ms |
| **Retraso de renderizado del elemento** | **~2000 a 2470 ms** |

El elemento LCP identificado por Lighthouse es la foto del hero
(`div.relative > div.relative > picture > img.w-full`).

**Dato decisivo:** este hold de ~2,3 s ya existía **idéntico en el informe archivado previo a todos
los cambios de la corrida**. No lo introdujo ninguno de los fix packs. Y **persistió sin variación
a lo largo de cinco deploys distintos**.

## 2. Descartes con evidencia (no reintentar)

Cada uno se probó de forma aislada, midiendo antes y después. Ninguno movió el hold en el runner
de PageSpeed.

| # | Hipótesis probada | Qué se hizo | Resultado |
|---|---|---|---|
| 1 | El fallo de hidratación descarta el HTML y reinicia el render | Se corrigió la raíz (arte generativo no determinista) en el fix pack 3 | Consola quedó limpia, pero **LCP idéntico: 6,6 s antes y después**. La hipótesis era falsa |
| 2 | gtag ocupa el hilo antes del primer paint | Se difirió el script a `window.load` | TBT bajó, **hold igual** |
| 3 | La ejecución del bundle de React precede al paint | Inyector que difiere el módulo hasta después del primer frame (`scripts/prerender.mjs`) | **Hold igual** |
| 4 | Los `modulepreload` encadenan descarga antes del paint | Se quitaron del HTML prerenderizado | **Hold igual** |
| 5 | Los `<link rel=preload as=font>` retienen el render | Se quitaron (fix pack 4b) | Ayudó **solo en la máquina local** (paint observado 2769 → 1757 ms); **en PSI, hold igual** |
| 6 | Los `blur-3xl` del hero son caros de rasterizar | Reemplazados por gradientes radiales equivalentes | **Hold igual** |
| 7 | Las animaciones de entrada retienen el paint | Deshabilitadas por completo vía CSS inyectado | Paint observado 2769 → 2804 ms: **ningún efecto** |
| 8 | Rasterizar la página entera (10+ viewports) en el primer frame | `content-visibility: auto` + `contain-intrinsic-size` en las 6 secciones bajo el pliegue | **Hold igual** |
| 9 | Las `@font-face` retienen el primer paint aunque tengan swap | Las 3 caras diferidas a un CSS externo cargado tras el primer frame | **NO CONCLUYENTE: se midió solo en local (con GPU), nunca contra PSI.** Repetir antes de descartar (ver sección 7) |
| 10 | Las fuentes pesan de más | Subseteadas a cobertura latina con fontTools | Ahorro marginal (ya venían subseteadas); **hold igual** |
| 11 | **Rasterizado procedural por software.** El runner de PSI corre sin GPU; los `feTurbulence` del grano se rasterizan por software en cada pintado. Moverlos a máscara (`656ad60`) les quitó la candidatura a LCP pero no el costo | Fix pack 5: tesela PNG pre-rasterizada de 8,8 KB en vez del filtro SVG. Verificado: cero `feTurbulence` en el DOM servido | **Hold igual: paint observado 2377 ms, 5 fotogramas vacíos, retraso de render 1917 ms.** La familia del raster procedural queda descartada |

## 3. Bisección local del HTML (servido desde `dist`)

Midiendo `observedFirstContentfulPaint` con Lighthouse local sobre variantes del HTML servido:

| Variante | Paint observado |
|---|---|
| Body mínimo (`<h1>` suelto), head intacto | **113 ms** |
| Solo hasta el cierre del hero | ~1900 ms |
| Hero sin la imagen | 1805 ms |
| Hero sin los `<header>` fijos | 1285 ms |
| Hero con todo el texto forzado a Georgia (sin webfonts) | 1281 ms |
| Todos los efectos visuales apagados (`filter`, `mask`, `mix-blend`, animaciones) | 1732 ms |

Los efectos **no son aditivos**, lo que sugiere una causa común aguas arriba en vez de varias
independientes. Ojo con este método: el Chrome local rasteriza **con GPU**, así que un costo de
rasterizado por software (el del runner de PSI) **no aparece aquí**. Esa ceguera del instrumento es
justamente lo que motivó el fix pack 5.

## 3 bis. Bisección de página en el propio PageSpeed (el hallazgo más informativo)

Medir `respira.html` en PSI y compararla con la portada resultó mucho más revelador que toda la
bisección local, porque compara dos páginas **reales servidas por el mismo runner**.

| | Portada | `respira.html` |
|---|---|---|
| Paint observado | 2377 ms | **2304 ms** |
| Fotogramas vacíos al inicio | 5 | 6 |
| LCP de laboratorio | 6,7 s | 5,9 s |
| Puntaje | 63 | 70 |
| Peso del HTML | 94.925 bytes | **24.923 bytes** |
| Header fijo | sí | **no** |
| Foto del hero | sí | **no** |
| Grano | sí | **no** |
| Secciones lazy y halos | sí | **no** |

`respira.html` es una cuarta parte del HTML, sin header fijo, sin foto, sin grano, sin secciones bajo
el pliegue... **y tiene el mismo hold de ~2,3 s**.

**Esto descarta con evidencia dura, y sin necesidad de tocar el diseño:**

- **El header fijo.** Era la única pista abierta que exigía una decisión de diseño de Juan (el CTA
  "Agendar" siempre visible). Ya no hace falta tocarlo: no es la causa. Los ~650 ms que le atribuía
  la bisección local eran un artefacto del entorno con GPU.
- La foto del hero, el grano, los halos, el tamaño del DOM y las secciones bajo el pliegue.

**Lo que las dos páginas comparten, y por lo tanto es donde queda acorralada la causa:**

1. El CSS común `/assets/index-*.css`, con las tres `@font-face`.
2. Las webfonts (Fraunces, Karla, EB Garamond), todas con `font-display: swap`.
3. El inyector que difiere el bundle hasta después del primer frame (`scripts/prerender.mjs`).
4. La estructura de prerender más hidratación, y el hosting de Netlify.

La pista más fuerte es el par CSS + webfonts, y encaja con la bisección local: un body mínimo con el
head intacto pero **texto en Georgia** pinta en 113 ms, y forzar Georgia en el hero completo bajaba
el paint de ~1900 a 1281 ms. El experimento 9 (diferir las `@font-face`) se midió solo en local, con
GPU, así que **conviene repetirlo contra PSI antes de darlo por descartado**: es la prueba pendiente
más barata y de mayor valor.

## 4. Datos de campo (CrUX), que son los que Google usa para rankear

El LCP de usuarios reales (p75, ventana de 28 días) es de **3,4 s**, bastante mejor que el
laboratorio, aunque todavía en naranja. CLS real: 0. La evaluación de Métricas Web Principales
aparece como "No superada" por el LCP.

## 5. Lo que sí mejoró de forma sólida en el ciclo

- Hidratación sin descartes: **11 errores rojos de React (#418 ×10, #422) a cero**.
- **TBT: 280 ms a 150-270 ms.**
- **Speed Index: 5,4 s a 4,4 s.**
- **CLS: 0.** Accesibilidad 97, Prácticas recomendadas 92, SEO 100.
- Fuentes servidas desde el propio dominio, sin la cadena de Google Fonts.
- Guardia de determinismo del prerender: el build falla si vuelve a entrar azar en el árbol.

## 6. Trucos de instrumentación que valen la pena conservar

- El JSON completo del informe de PSI está en `window.__LIGHTHOUSE_MOBILE_JSON__` dentro de
  `pagespeed.web.dev`. Es mucho más fiable que raspar el texto de la interfaz.
- Lighthouse local: `npx lighthouse@12 <url> --only-categories=performance --output=json`.
  Con `--save-assets` deja además la traza completa de Chrome.
- Comparar `observedFirstContentfulPaint` (lo que de verdad pasó) contra el valor simulado
  distingue la realidad del modelo de Lantern. El desglose observado del LCP vive en el audit
  `lcp-breakdown-insight`.
- El tamaño en bytes de cada fotograma de `screenshot-thumbnails` delata los frames en blanco: se
  mantienen pequeños e idénticos mientras la pantalla está vacía.
- **Trampas del entorno:** en pestañas ocultas de Chrome no dispara `requestAnimationFrame` (por eso
  el inyector diferido lleva respaldo en `window.load` y un temporizador tope); las capturas de
  pantalla en pestaña oculta pueden salir sin la foto y dar un falso negativo; la interfaz de PSI se
  estrangula en segundo plano (conviene abrir la URL del informe ya emitido en una pestaña nueva).
  La API pública de PSI responde 429 casi siempre desde esta IP.
- El rastreo de consola y de red de la extensión **arranca recién al invocarlo**: hay que recargar
  *después* de activarlo, o se lee un vacío falso.

## 7. Pistas abiertas (actualizado tras el fix pack 5)

1. **CSS común más webfonts.** Es lo que queda en pie tras la bisección de página: lo único
   compartido por la portada y `respira.html`, que exhiben el mismo hold pese a no compartir casi
   nada más. Prueba pendiente más barata: repetir el experimento 9 (diferir las tres `@font-face` a
   un CSS externo cargado tras el primer frame) **midiendo contra PSI**, no en local. Ojo con la
   hipótesis nula: `font-display: swap` debería pintar con la fuente de reserva de inmediato, así
   que si las fuentes retienen el paint, algo rompe ese contrato y vale la pena entender qué.
2. **Los `mix-blend-mode`.** Quedan dos usos (`multiply` en el grano del fondo, `overlay` en el de la
   foto), pero `respira.html` **no los tiene** y aun así muestra el hold: baja prioridad.
3. **El runner de PSI en sí.** Vale considerar que el hold sea un piso del entorno (arranque en frío
   del renderizador sin GPU) y no algo del sitio. A favor: el campo real (CrUX) mide 3,4 s, muy por
   debajo del laboratorio, y ningún cambio en cinco deploys lo movió un milímetro. Antes de gastar
   otro ciclo persiguiéndolo, conviene comparar el mismo perfil de filmstrip contra un sitio de
   referencia liviano y conocido.

**Descartado y cerrado:** el header fijo. La bisección de página lo prueba (ver sección 3 bis). No
hace falta tocar el diseño del CTA.
