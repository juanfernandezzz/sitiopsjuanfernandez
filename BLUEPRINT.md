# BLUEPRINT: Auditoría y mejora SEO/GEO/AEO/LLMO orientada a CRO

**Sitio:** www.psicologojuanfernandez.cl
**Repositorio:** github.com/juanfernandezzz/sitiopsjuanfernandez
**Documento de gobierno del proceso. Versión 1.0. Ciclo de origen: C30.**

---

## 0. Propósito y reglas del proceso

Este documento define el proceso integral de auditoría y mejora del sitio en seis fases secuenciales, priorizadas por impacto esperado en conversión (agendamiento vía Cal.com y contacto por WhatsApp). Fundamento: investigación completada en el ciclo C30 sobre el estado del arte 2025-2026 en SEO técnico, Generative Engine Optimization, Answer Engine Optimization y optimización para modelos de lenguaje, filtrada por la normativa chilena aplicable.

### 0.1 Workflow por fases (inmutable)

1. Cada fase vive en su propia conversación de claude.ai. Juan inicia la conversación, pega el seed prompt de la fase y sube el ZIP completo del sitio.
2. Claude entrega: (a) ZIP con solo los archivos modificados o nuevos, y (b) prompt para la pestaña Code de Claude Desktop.
3. Juan abre Claude Desktop, pestaña Code (no PowerShell, no terminal), adjunta el ZIP directamente en el chat. Code aplica los cambios, valida y hace commit y push a GitHub. Netlify despliega automáticamente.
4. Las pruebas se delegan a la pestaña Code con Google Chrome conectado o a otra vía autónoma. Se pide intervención de Juan solo cuando no existe forma autónoma (llaves reales, verificación de identidad, paneles de terceros).
5. La fase cierra cuando se cumplen sus criterios de cierre y Claude entrega el seed prompt de la fase siguiente. Los fix packs dentro de una fase no constituyen fase nueva.
6. Formato de commit: `C[n]: descripción breve`. Los ciclos continúan la numeración existente del proyecto.

### 0.2 Restricciones permanentes

- Alcance: solo el sitio web. Si un cambio toca copy compartido en `src/lib/`, el script postinstall lo propaga a la app Android; la app no es objeto de auditoría.
- Sin contenido nuevo: no blog, no artículos, no páginas editoriales. Solo optimización de secciones existentes (hero, sobre mí, cómo trabajo y teleconsulta, sesiones y precios, motivos de consulta, preguntas frecuentes, contacto, flujo Cal.com, página de confirmación).
- Design system fijo: paleta Cream, Sage, Terracotta, Ink; tipografías Fraunces y Karla. Ninguna fase introduce tipografías, paletas ni insignias visuales nuevas. Las directivas de diseño externas al proyecto se subordinan a este sistema.
- Los siete greps obligatorios del proyecto deben retornar cero antes de cada commit. Este documento evita deliberadamente escribir los dos términos prohibidos por los greps 3 y 6 (la certificación estadounidense de privacidad sanitaria y la frase de cifrado punto a punto) para que el repositorio se mantenga en cero. Doxy.me se describe siempre y únicamente como "plataforma certificada por Fonasa".
- Español latino neutral en todo texto visible. Sin rayas ni semirrayas en texto visible del sitio ni en este documento.

### 0.3 Datos canónicos que las fases usan como imán de citación

| Dato | Valor | Verificable en |
|---|---|---|
| Copago Fonasa MLE | $5.570 CLP | Portal Fonasa |
| Sesión particular | $15.000 CLP | Sitio propio |
| Códigos Fonasa | 09 08 101, 09 08 102, 09 08 103 | Portal Fonasa |
| Registro profesional | RNPI N° 876085 | rnpi.superdesalud.gob.cl |
| Título | Psicólogo, UVM, enero 2025 | Registro MINEDUC |
| Teleconsulta | Doxy.me, plataforma certificada por Fonasa | Confirmación Fonasa junio 2025 |
| Agenda | cal.com/psicologojuanfernandez, 4 eventos | Cal.com |
| Duración de sesión | Confirmar con Juan antes de Fase 3 | Pendiente |

En schema.org los precios se escriben como enteros sin separador de miles: "5570" y "15000". El punto es separador decimal en ese vocabulario; escribir "5.570" declararía cinco pesos con 57 centavos.

---

## 1. Fundamento (resumen de la investigación, con nivel de confianza)

1. **Los crawlers de IA no ejecutan JavaScript.** GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot y afines leen solo el HTML crudo. Un sitio React con renderizado en cliente les entrega un cascarón vacío. Gemini es la excepción (usa la infraestructura de render de Googlebot). Confianza alta. Consecuencia: el prerendering es prerrequisito de todo lo demás.
2. **El tráfico referido por asistentes de IA convierte mejor que el orgánico clásico** en verticales de consideración (estudios de Semrush, Seer Interactive y Ahrefs, 2025), con contraevidencia en e-commerce. Salud mental encaja en el perfil de alto valor por visita. Confianza moderada (sesgo de muestra hacia SaaS).
3. **No existe el tipo schema.org/Psychologist.** La estructura correcta es MedicalBusiness enlazado por @graph a Person y HealthcareService, con VirtualLocation y areaServed Chile para señalar servicio 100% online. Confianza alta.
4. **El rich result de FAQ está muerto en Google, pero el markup FAQPage sigue siendo válido** y es parseado por Bingbot (fuente de ChatGPT Search y Copilot) y PerplexityBot. El trabajo pesado lo hace el par pregunta-respuesta visible en HTML. Confianza alta.
5. **llms.txt no tiene adopción funcional** por ningún proveedor mayor. Costo casi nulo, impacto no esperable. Confianza alta.
6. **Core Web Vitals impacta más en conversión que en ranking.** Casos documentados de mejoras de conversión de un dígito alto a dos dígitos tras optimizar LCP e INP. Lighthouse actual ~62, objetivo ≥85. Confianza moderada-alta.
7. **Las tácticas ganadoras de citación en motores generativos** (paper GEO de Princeton, KDD 2024): citar fuentes verificables, incluir cifras concretas y datos estadísticos. El relleno de palabras clave está entre las peores. Confianza alta.
8. **Cumplimiento Ley 21.719 con plena vigencia el 1 de diciembre de 2026:** política de privacidad accesible y versionada, base de licitud para cada tratamiento, y consentimiento explícito si se agregan cookies no esenciales. Datos de salud son categoría sensible. Confianza alta.

---

## 2. Tácticas explícitamente descartadas

| Táctica | Motivo del descarte |
|---|---|
| Testimonios, reseñas de pacientes, casos de éxito | Código de Ética Colpsi: publicidad sobria y digna, limitada a credenciales y especialidad |
| aggregateRating y review en schema | Ético (Colpsi) y técnico: Google considera inelegible la auto-reseña |
| Urgencia manufacturada, garantías de resultados | Colpsi: sin promesas de resultado ni presión comercial |
| Contenido editorial nuevo (blog, guías) | Fuera de alcance definido por Juan |
| llms.txt como palanca | Sin adopción funcional; se puede incluir como gesto de compatibilidad futura, sin expectativa |
| Relleno de palabras clave | Peor táctica en la evidencia; riesgo de spam |
| Referencias a certificaciones extranjeras de privacidad o a cifrado punto a punto | Constantes del proyecto y greps 3 y 6 |
| Insignias de seguridad genéricas o sellos decorativos | Design system fijo; la confianza se construye con credenciales verificables, no con iconografía |

---

## 3. Fases

### Fase 1: Auditoría de renderizado y prerendering (impacto CRO más alto; prerrequisito)

**Objetivo:** que el HTML crudo servido por Netlify contenga el contenido real (bio, precios, preguntas frecuentes, metodología) sin ejecutar JavaScript.

**Primera tarea, antes de elegir herramienta:** inspeccionar el `dist/` real del build actual. El sitio es una MPA Vite multi-entrada; es posible que parte del contenido ya esté en el HTML estático y solo las secciones montadas por React en cliente estén vacías. El árbol de decisión:

- Si el contenido crítico ya está en el HTML de build: la fase se reduce a completar los huecos y optimizar carga.
- Si el contenido crítico se monta vía React en cliente sobre entradas MPA: prerender por entrada en build (por ejemplo vite-prerender-plugin o render en build con ReactDOMServer por página).
- Solo si existiera enrutamiento con react-router: evaluar vite-react-ssg.

**Cambios esperados:** configuración de build, posible reorganización de montaje de componentes, carga diferida de Framer Motion fuera del pliegue inicial (palanca ya identificada para Lighthouse).

**Verificación autónoma (pestaña Code + Chrome):** ver código fuente de la página (no inspeccionar elementos) y confirmar presencia de textos canónicos; prueba con JavaScript desactivado; Lighthouse ≥85; los siete greps en cero.

**Verificación que requiere a Juan:** ninguna esperada.

**Criterio de cierre:** contenido crítico visible en HTML crudo en todas las páginas; sin regresión visual ni funcional (Cal.com embebido, WhatsApp flotante, formulario de contacto operativos).

**Riesgo principal:** hidratación divergente que rompa interactividad. Mitigación: pruebas de flujo completo de reserva en Chrome antes del push.

### Fase 2: Datos estructurados schema.org

**Objetivo:** grafo JSON-LD válido que declare la entidad profesional y el servicio.

**Estructura:** @graph con MedicalBusiness (location: VirtualLocation con URL de teleconsulta; areaServed: Chile), Person (hasCredential: título UVM y registro; identifier: PropertyValue con propertyID RNPI y value 876085; sameAs a perfiles verificables), HealthcareService (availableChannel con serviceUrl de Cal.com; availableLanguage español). Offers con priceCurrency CLP y valores enteros "5570" y "15000". Sin aggregateRating, sin review.

**Verificación autónoma:** Rich Results Test y validator.schema.org sin errores ni advertencias críticas; greps en cero.

**Criterio de cierre:** grafo válido desplegado en todas las páginas relevantes.

### Fase 3: Reestructuración AEO del contenido existente

**Objetivo:** que cada sección responda su consulta objetivo en las primeras 40 a 60 palabras, con los datos canónicos como imán de citación y de clic.

**Cambios:** encabezados en forma de pregunta donde corresponda; respuestas answer-first en preguntas frecuentes; tabla de precios extraíble; pasos de teleconsulta como lista estructurada; densidad de entidades desambiguadas (Fonasa, Modalidad Libre Elección, teleconsulta, TCC, psicología narrativa, Valparaíso, Chile). Todo cambio de copy pasa por `src/lib/` y se sincroniza a la app.

**Prerrequisito bloqueante:** Juan confirma la duración exacta de la sesión. Sin ese dato, la cifra no se publica.

**Verificación autónoma:** lectura del HTML crudo confirmando estructura; greps en cero; sincronización app verificada en el módulo compartido.

**Criterio de cierre:** las secciones existentes responden en formato extraíble sin haber agregado superficies de contenido.

### Fase 4: Cumplimiento Ley 21.719 y medición ligera

**Objetivo:** sitio listo antes del 1 de diciembre de 2026 y medición de conversión sin fricción de consentimiento.

**Cambios:** política de privacidad versionada y accesible desde el footer (datos recolectados por formulario, WhatsApp y Cal.com; finalidad; conservación; terceros; derechos ARCOP y canal de ejercicio); analítica sin cookies (candidatas: Umami self-host o Cloudflare Web Analytics; decisión en la fase según costo operativo); evento de conversión en la página cuya URL contiene "cita-agendada".

**Nota:** el proyecto tiene un grep histórico asociado a una herramienta de analítica descartada; la elección de la fase debe respetar los greps vigentes o actualizarlos explícitamente con aprobación de Juan.

**Verificación autónoma:** política accesible y fechada; analítica registrando visitas y el evento de conversión; sin cookies no esenciales creadas (verificable en Chrome).

**Verificación que requiere a Juan:** alta de cuenta en el proveedor de analítica elegido si aplica.

**Criterio de cierre:** política publicada, conversión medida, cero cookies no esenciales sin consentimiento.

### Fase 5: Señales off-site y acceso de crawlers

**Objetivo:** maximizar la probabilidad de citación por motores generativos y buscadores.

**Cambios en el repo:** robots.txt permitiendo explícitamente GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot y Google-Extended; sitemap.xml; canonical y hreflang es-CL; Open Graph en HTML prerenderizado; enlace visible y verificable al registro RNPI en la Superintendencia de Salud.

**Fuera del repo (requiere a Juan):** Google Business Profile como negocio de área de servicio con dirección oculta (mostrarla causa suspensión para negocios sin atención presencial), categoría Psicólogo, cobertura Chile; verificación en Search Console.

**Verificación autónoma:** fetch de las URLs con user-agents de IA confirmando 200 y contenido (no 403 del CDN); validación de sitemap.

**Criterio de cierre:** crawlers de citación con acceso confirmado; perfil GBP activo sin suspensión.

### Fase 6: Coherencia con Google Ads y monitoreo permanente

**Objetivo:** alinear mensaje anuncio-landing y establecer el ciclo de observación.

**Cambios:** verificar que el diferenciador (copago $5.570, agenda online inmediata, Fonasa MLE) esté en el primer bloque de la landing que reciben los anuncios; set fijo de prompts de monitoreo de citación en ChatGPT y Perplexity ejecutado periódicamente; revisión de Search Console.

**Umbral de decisión:** si el tráfico referido por asistentes de IA supera el 2% del total, se prioriza instrumentación adicional de esa fuente.

**Criterio de cierre:** coherencia verificada y rutina de monitoreo documentada en este archivo (sección 5).

---

## 4. Métricas transversales

| Métrica | Línea base | Objetivo | Fuente |
|---|---|---|---|
| Lighthouse Performance | ~62 | ≥85 | Pestaña Code, Chrome |
| Contenido en HTML crudo | No verificado | 100% de secciones críticas | Ver código fuente |
| Errores de schema | N/A | 0 | Rich Results Test |
| Conversión cita-agendada | Solo Google Ads | Medición propia activa | Analítica Fase 4 |
| Acceso crawlers IA | No verificado | 200 + contenido | Fetch por user-agent |

## 5. Registro de decisiones abiertas

| # | Decisión | Estado |
|---|---|---|
| 1 | Duración exacta de la sesión | Pendiente de Juan (bloquea parte de Fase 3) |
| 2 | Proveedor de analítica sin cookies | Se decide en Fase 4 |
| 3 | Unificación `sesiones.js` (detalleModal vs detalleApp) | Heredada de C29, Opción 1 recomendada; resolver a más tardar en Fase 3 |
| 4 | Perfil en directorios (Doctoralia sin reseñas) | Evaluar en Fase 5; ante duda ética, consultar al Colegio |
