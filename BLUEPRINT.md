# BLUEPRINT: Auditoría y mejora SEO/GEO/AEO/LLMO orientada a CRO

**Sitio:** psicologojuanfernandez.cl (forma canónica: apex sin www, declarada en canonical, hreflang, og:url y sitemap)
**Repositorio:** github.com/juanfernandezzz/sitiopsjuanfernandez
**Documento de gobierno del proceso. Versión 2.0. Ciclo de origen: C30. Última actualización: C39, 18 de julio de 2026.**

**Estado: las seis fases están ejecutadas y cerradas.** Este documento deja de ser un plan de trabajo y pasa a ser el registro de lo hecho más la rutina de observación permanente de la sección 5.3. No existe una Fase 7. Cualquier trabajo posterior es o bien mantenimiento dentro de la rutina, o bien un proyecto nuevo que requiere su propio documento de gobierno.

---

## 0. Propósito y reglas del proceso

Este documento define el proceso integral de auditoría y mejora del sitio en seis fases secuenciales, priorizadas por impacto esperado en conversión (agendamiento vía Cal.com y contacto por WhatsApp). Fundamento: investigación completada en el ciclo C30 sobre el estado del arte 2025-2026 en SEO técnico, Generative Engine Optimization, Answer Engine Optimization y optimización para modelos de lenguaje, filtrada por la normativa chilena aplicable.

### 0.1 Workflow por fases (inmutable)

1. Cada fase vive en su propia conversación de claude.ai. Juan inicia la conversación, pega el seed prompt de la fase y sube el ZIP completo del sitio.
2. Claude entrega: (a) ZIP con solo los archivos modificados o nuevos, y (b) prompt para la pestaña Code de Claude Desktop.
3. Juan abre Claude Desktop, pestaña Code (no PowerShell, no terminal), adjunta el ZIP directamente en el chat. Code aplica los cambios, valida y hace commit y push a GitHub. Netlify despliega automáticamente.
4. **Las verificaciones fuera del repositorio se ejecutan de forma agéntica, no delegadas a Juan.** Claude se conecta al Chrome real de Juan a través de la extensión Claude in Chrome, donde las sesiones de Google Ads, Search Console y Umami ya están iniciadas, y lee los paneles por sí mismo. Este documento no vuelve a contener instrucciones paso a paso para que Juan recorra paneles a mano. Se le pide una acción solo en tres casos: (a) la extensión no está conectada o el puente local no responde, (b) un paso exige verificación de identidad, segundo factor o CAPTCHA, (c) la acción **muta estado** y por lo tanto requiere su aprobación explícita antes de ejecutarse. La frontera es esa: leer y medir es autónomo; editar un anuncio, cambiar una configuración, aceptar términos o enviar algo pasa siempre por aprobación previa. Regla fijada por Juan en C39.
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
| Duración de sesión | 45 minutos, en todas las modalidades | Confirmado por Juan en C31 |

En schema.org los precios se escriben como enteros sin separador de miles: "5570" y "15000". El punto es separador decimal en ese vocabulario; escribir "5.570" declararía cinco pesos con 57 centavos.

---

## 1. Fundamento (resumen de la investigación, con nivel de confianza)

1. **Los crawlers de IA no ejecutan JavaScript.** GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot y afines leen solo el HTML crudo. Un sitio React con renderizado en cliente les entrega un cascarón vacío. Gemini es la excepción (usa la infraestructura de render de Googlebot). Confianza alta. Consecuencia: el prerendering es prerrequisito de todo lo demás.
2. **El tráfico referido por asistentes de IA convierte mejor que el orgánico clásico** en verticales de consideración (estudios de Semrush, Seer Interactive y Ahrefs, 2025), con contraevidencia en e-commerce. Salud mental encaja en el perfil de alto valor por visita. Confianza moderada (sesgo de muestra hacia SaaS).
3. **No existe el tipo schema.org/Psychologist.** La estructura correcta es MedicalBusiness enlazado por @graph a Person y Service, con VirtualLocation y areaServed Chile para señalar servicio 100% online. Confianza alta.
4. **El rich result de FAQ está muerto en Google, pero el markup FAQPage sigue siendo válido** y es parseado por Bingbot (fuente de ChatGPT Search y Copilot) y PerplexityBot. El trabajo pesado lo hace el par pregunta-respuesta visible en HTML. Confianza alta.
5. **llms.txt no tiene adopción funcional** por ningún proveedor mayor. Costo casi nulo, impacto no esperable. Confianza alta.
6. **Core Web Vitals impacta más en conversión que en ranking.** Casos documentados de mejoras de conversión de un dígito alto a dos dígitos tras optimizar LCP e INP. Confianza moderada-alta. Estado: la línea base de C30 era 62 en móvil y el objetivo declarado era ≥85. C31 llevó el móvil a 98 con prerendering y con las palancas de rasterizado documentadas en `docs/experimentos-rendimiento-C31.md`. La medición vigente es la de la sección 4.
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
| Google Business Profile | Descartado en C38. La política de elegibilidad de Google exige contacto en persona con clientes y declara inelegibles a los negocios exclusivamente online. Crearlo obligaría a declarar una cobertura presencial inexistente, con riesgo de suspensión y tensión con el Código de Ética. La señal local la sostienen `areaServed` Chile en el schema, el enlace al RNPI y Search Console |

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

**Estructura:** @graph con MedicalBusiness (location: VirtualLocation con URL de teleconsulta; areaServed: Chile), Person (hasCredential: título UVM y registro; identifier: PropertyValue con propertyID RNPI y value 876085; sameAs a perfiles verificables), Service (availableChannel con serviceUrl de Cal.com; availableLanguage español). Corrección C35: HealthcareService tampoco existe en schema.org (es un recurso FHIR de HL7, no un tipo del vocabulario); el tipo válido para el nodo de servicio es Service, verificado en validator.schema.org. Offers con priceCurrency CLP y valores enteros "5570" y "15000". Sin aggregateRating, sin review.

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

**Fuera del repo (requiere a Juan):** verificación de propiedad y envío de sitemap en Search Console. **Corrección C38: el Google Business Profile previsto en la versión 1.0 de este documento NO se creó.** El supuesto original (registrarlo como negocio de área de servicio con dirección oculta) no resuelve el problema de fondo: la elegibilidad exige contacto en persona con clientes, no solo ocultar la dirección. Ver la tabla de tácticas descartadas.

**Verificación autónoma:** fetch de las URLs con user-agents de IA confirmando 200 y contenido (no 403 del CDN); validación de sitemap.

**Criterio de cierre:** crawlers de citación con acceso confirmado. Ejecutado en C38 con 200 en las 40 combinaciones de 8 agentes por 5 URLs y con la bio canónica presente en el HTML crudo en todas ellas.

### Fase 6: Coherencia con Google Ads y monitoreo permanente

**Objetivo:** alinear mensaje anuncio-landing y establecer el ciclo de observación.

**Cambios:** verificar que el diferenciador (copago $5.570, agenda online inmediata, Fonasa MLE) esté en el primer bloque de la landing que reciben los anuncios; set fijo de prompts de monitoreo de citación en ChatGPT y Perplexity ejecutado periódicamente; revisión de Search Console.

**Umbral de decisión:** si el tráfico referido por asistentes de IA supera el 2% del total, se prioriza instrumentación adicional de esa fuente. Advertencia de método: una parte de ese tráfico llega sin `referrer` y se contabiliza como directo, de modo que la cifra medida es un piso, no un valor exacto.

**Hallazgo de C39 y corrección aplicada.** El copago sí estaba en el HTML crudo, pero en móvil quedaba fuera del pliegue. El orden visual del hero en móvil es `flex-col-reverse` (foto arriba), y la suma de foto, encabezado, subtítulo y botones empujaba el copago muy por debajo del borde inferior de la pantalla.

Primero se estimó por aritmética de clases. Después se **midió** sobre el sitio en vivo, en el Chrome real de Juan, montando la portada dentro de un iframe de 390px de ancho (mismo origen) y leyendo `getBoundingClientRect` de cada elemento. La estimación erró por 13px, un 1,4%. Se conserva el registro porque el método sirve para futuras verificaciones de pliegue sin depender de emulación manual.

| Elemento | Estimado | Medido en vivo | Medido con C39 aplicado |
|---|---|---|---|
| Copago $5.570 | 950px | **963px** | **637px** |
| Botón Agendar | 822px | **829px** | **664px** |
| Alto de la foto | 350px | **350px** | **187px** |

Pliegue útil de referencia: 553px en equipos clase iPhone SE, 664px en iPhone 14 con Safari, 780px en Android con Chrome.

**Matiz que la medición agregó y la estimación no tenía.** El encabezado fijo mide 52px y lleva un botón Agendar visible de forma permanente en móvil. O sea que la acción primaria nunca está fuera de alcance, aunque el botón del hero lo esté. Lo que realmente había que subir sobre el pliegue no era el botón, era el **dato de precio**, que es lo que prometen los anuncios y lo que el visitante viene a confirmar. Con C39 el copago ocupa de 637 a 660px: entra en iPhone 14 y en Android, con margen estrecho, y sigue fuera en equipos clase iPhone SE. No se declara resuelto para todo el parque de dispositivos.

C39 recortó la foto a banda 3/2 solo bajo 640px, comprimió el espaciado vertical solo en móvil y subió el copago por encima de los botones. El escritorio no cambia.

**Criterio de cierre:** coherencia verificada y rutina de monitoreo documentada en este archivo (sección 5.3).

---

## 4. Métricas transversales

Las cifras de esta tabla son las vigentes. Ninguna se cita de memoria ni de una corrida aislada: cada una indica el ciclo y la fecha en que se midió. Si una fila no tiene serie propia posterior, se dice explícitamente en vez de arrastrar el valor anterior como si fuera actual.

| Métrica | Línea base (C30) | Estado vigente | Medido en | Objetivo permanente |
|---|---|---|---|---|
| PSI Performance móvil | 62 | mediana 97, serie {97, 99, 97} | C39, 18 de julio de 2026, sobre deploy asentado | no bajar de 90 |
| PSI Performance escritorio | no medido | 99 | C37; **sin serie propia posterior, no citar como estado actual** | no bajar de 90 |
| PSI SEO móvil | no medido | 100 | C39, 18 de julio de 2026 | 100 |
| Contenido en HTML crudo | no verificado | 6 de 6 páginas prerenderizadas, bio canónica incluida | C31, revalidado en C38 y C39 | 100% de secciones críticas |
| Errores de schema | n/a | 0 | C35 | 0 |
| Acceso de crawlers de IA | no verificado | 200 en 40 de 40 combinaciones (8 agentes por 5 URLs) | C38 | 200 con contenido |
| URLs indexables en sitemap | n/a | 3 en forma canónica | C38 | coincidencia exacta con las páginas `index,follow` |
| Conversión cita-agendada | solo Google Ads | GA4 más Umami sin cookies, con candado de `sessionStorage` compartido | C37 | medición propia activa |
| Tráfico referido por asistentes de IA | no medido | pendiente de primera medición | C39, frente (b) | umbral de acción 2% |

**Protocolo de medición de PSI (obligatorio, lección C38).** Netlify purga la caché durable de CDN en cada deploy, y eso contamina la serie completa, no una corrida suelta. Evidencia: la misma URL y el mismo commit dieron {98, 70, 69} minutos después del push y {97, 99, 97} horas después. Ventana mínima de espera: 3 a 4 horas, ideal 24. Siempre mediana de 3 corridas espaciadas al menos 5 minutos. Los datos de campo de CrUX no sirven como evidencia de un deploy reciente porque describen los 28 días anteriores.

## 5. Decisiones, lecciones y rutina permanente

### 5.1 Registro de decisiones

| # | Decisión | Estado | Resuelta en |
|---|---|---|---|
| 1 | Duración exacta de la sesión | **Resuelta:** 45 minutos en todas las modalidades | C31 |
| 2 | Proveedor de analítica sin cookies | **Resuelta:** Umami Cloud, sin cookies, cargado después de `window.load`. Se descartó el autohospedaje por costo operativo para una práctica individual | C37 |
| 3 | Unificación de `sesiones.js` | **Resuelta:** Opción 1, campo único `detalle`, con el precio renderizado por separado en cada superficie. Verificado en C39: no quedan referencias funcionales a `detalleModal` ni a `detalleApp` en el repositorio; la única mención restante es el comentario de cabecera que documenta el cambio | C36, verificada en C39 |
| 4 | Perfil en directorios de salud tipo Doctoralia | **Archivada por alcance.** Ver 5.1.1 | C39 |

#### 5.1.1 Decisión 4: archivada

Juan cerró esta decisión por alcance en C39: **los directorios de salud quedan fuera del proyecto por ahora y la única superficie de trabajo es el sitio propio.** No se crea ni se reclama perfil en ninguna plataforma del tipo, y no se envía consulta al Colegio por este tema.

Se conserva aquí lo verificado en C39, sin acción asociada, para que una eventual reapertura no tenga que investigarlo de nuevo:

1. El control que Doctoralia documenta para el profesional gobierna la **solicitud** automática de opiniones tras una cita, no su recepción. No se encontró un ajuste documentado que cierre la recepción. Confianza moderada a alta.
2. Doctoralia Chile declara que no se requiere perfil activo para que se publiquen opiniones sobre un profesional, y terceros pueden crear un perfil que se publica tras revisión de un moderador.
3. El profesional no puede eliminar opiniones; solo reportar las que incumplan las directrices, y decide la moderación de la plataforma.

Consecuencia registrada, no accionada: abstenerse no garantiza ausencia. Si la decisión se reabre, el punto de partida no es si conviene crear un perfil, sino qué hacer si ya existe uno sin participación de Juan.

### 5.2 Lecciones operativas vigentes

Cada una nació de un error concreto y gobierna todos los ciclos posteriores.

| Lección | Regla permanente | Origen |
|---|---|---|
| Medición de PSI | Nunca medir en los minutos posteriores a un deploy. Esperar de 3 a 4 horas como mínimo. Mediana de 3 corridas espaciadas 5 minutos. CrUX jamás como evidencia de un deploy reciente | C38 |
| `HealthcareService` no existe en schema.org | Es un recurso FHIR de HL7, no un tipo del vocabulario. El tipo válido para el nodo de servicio es `Service`, verificado en validator.schema.org | C35 |
| Google Business Profile | Inadvisable para una práctica 100% online. Ver tabla de tácticas descartadas | C38 |
| Interpolación de texto en JSX | Mezclar texto y variables en un mismo elemento produce separadores de comentario HTML que fragmentan el texto extraíble para los crawlers de IA. Usar plantillas literales o elementos separados, de modo que cada bloque quede como un único nodo de texto | C36, reaplicada en C39 |
| Verificación en navegador | Siempre en el Chrome real de Juan a través de la extensión. El navegador interno de automatización ocultó 11 errores reales de hidratación en C31 | C31 |
| Verificación de datos frágiles | Toda cifra, política de terceros o condición de plataforma se verifica contra fuente primaria antes de escribirla. Si no se puede verificar, se declara desconocida en vez de rellenarla | C35 |
| Pliegue móvil | El orden DOM no es el orden visual cuando hay `flex-col-reverse`. Cualquier cambio en el hero exige recontar qué queda sobre el pliegue en móvil, no solo confirmar que el texto existe en el HTML crudo | C39 |
| Medición del pliegue | No estimar por aritmética de clases si se puede medir. Método: montar la página en un iframe de 390px de ancho y mismo origen dentro del Chrome de Juan, y leer `getBoundingClientRect`. Da la posición real en píxeles CSS sin depender de emulación manual ni de que alguien mire una pantalla | C39 |
| Puente de Claude in Chrome | Los desplegables nativos de `select` congelan el puente en Windows: las llamadas siguientes agotan el tiempo a los 4 minutos. Nunca abrirlos con clic. Manipular el `select` por JavaScript con el setter nativo de `value` más un evento `change` | C39 |

### 5.3 Rutina de monitoreo permanente

Este es el criterio de cierre de la Fase 6 y el régimen en el que queda el proyecto. El registro de cada ronda se escribe en `docs/monitoreo.md`.

**Quién ejecuta.** Todos los frentes de esta tabla los corre Claude de forma agéntica en el Chrome de Juan, según la regla 4 de la sección 0.1. Juan no recorre paneles a mano. Lo que Claude entrega al final de cada ronda son los números, el diagnóstico y, cuando corresponda, una propuesta de cambio que espera su aprobación antes de tocar nada. Lo único que Juan hace es aprobar o rechazar.

| Frente | Qué se revisa | Dónde | Cadencia | Umbral de acción |
|---|---|---|---|---|
| Coherencia anuncio y landing | Cada titular y descripción de los RSA activos debe tener correlato literal en el primer bloque de la landing. URL final apuntando a página indexable y al mismo dominio de la URL visible | Google Ads, Anuncios y recursos | Mensual, y **obligatorio** ante cualquier cambio de precios, de duración de sesión o del copy del hero | Cualquier promesa del anuncio sin correlato en la landing se corrige en la landing o se saca del anuncio, en el mismo día |
| Indexación | Cobertura de las 3 URLs indexables, estado del sitemap, consultas y clics | Search Console | Mensual | Cualquier URL indexable excluida sin explicación, o el sitemap sin procesar |
| Rendimiento | PSI móvil, Performance y SEO, con el protocolo de la sección 4 | pagespeed.web.dev | Trimestral, y **obligatorio** 3 a 4 horas después de cualquier deploy que toque hero, imágenes, fuentes o CSS crítico | Mediana móvil bajo 90, o SEO distinto de 100 |
| Tráfico de asistentes de IA | Proporción de referrers de chatgpt.com, perplexity.ai, claude.ai y similares sobre el total de visitas | Umami Cloud | Mensual | Sobre 2% se prioriza instrumentación adicional de esa fuente. Recordar que una parte llega sin referrer y se cuenta como directa: la cifra es un piso |
| Citación en asistentes | Set fijo de prompts de la sección 5.3.1, en sesión temporal o cerrada | ChatGPT y Perplexity | Trimestral | Ausencia en dos rondas seguidas obliga a revisar la densidad de datos canónicos en el HTML crudo |
| Vigencia de datos canónicos | Copago, valor particular, códigos Fonasa MLE, vigencia del RNPI | Portal Fonasa y rnpi.superdesalud.gob.cl | Semestral, y ante cualquier aviso de reajuste | Un cambio de monto obliga a actualizar `src/lib/precios.js`, el JSON-LD, la tabla de precios y los RSA en el mismo ciclo |
| Cumplimiento legal | Política de privacidad frente a la Ley 21.719, con plena vigencia el 1 de diciembre de 2026 | Repositorio y sitio | Revisión antes de noviembre de 2026, luego anual | Cualquier tratamiento nuevo sin base de licitud declarada |
| Higiene de repositorio | `node scripts/greps.mjs` en 7 de 7 en cero y `npm run build` verde con las 6 páginas prerenderizadas | Local, antes del commit | Cada commit | Cualquier grep distinto de cero bloquea el commit |

#### 5.3.1 Set fijo de prompts de citación

El set es fijo a propósito: cambiar los prompts entre rondas impide comparar. Se ejecutan en sesión temporal o cerrada, sin historial, porque la personalización contamina el resultado.

1. `psicólogo online Fonasa Chile`
2. `cuánto cuesta un psicólogo con bono Fonasa`
3. `psicólogo online Valparaíso`

De cada ejecución se registra: fecha, motor, prompt, si el sitio aparece citado, y con qué dato aparece (copago, RNPI, códigos, duración). **Estos resultados no son deterministas: dos ejecuciones del mismo prompt pueden diferir. Sirven como señal direccional, nunca como métrica.** Una ausencia aislada no significa nada; una ausencia sostenida en dos rondas sí.

**Advertencia de método propia de este frente.** Es el único de la tabla donde ejecutar dentro del Chrome de Juan introduce un sesgo: su sesión de ChatGPT tiene historial y personalización, y un asistente que ya conversó sobre su sitio tiene más probabilidad de citarlo. Por eso, aquí el agente activa el chat temporal antes de escribir el prompt, y si el motor no ofrece esa opción, deja constancia en la bitácora de que la ronda se corrió con sesión personalizada. Un resultado positivo obtenido con historial activo no cuenta como citación.

---

## 6. Cierre del BLUEPRINT

Con la Fase 6 ejecutada en C39, las seis fases están cerradas:

| Fase | Objeto | Ciclo de cierre |
|---|---|---|
| 1 | Prerendering y contenido en HTML crudo | C31 |
| 2 | Datos estructurados schema.org | C35 |
| 3 | Reestructuración AEO del contenido existente | C36 |
| 4 | Cumplimiento Ley 21.719 y medición | C37 |
| 5 | Señales off-site y acceso de crawlers | C38 |
| 6 | Coherencia con Google Ads y monitoreo permanente | C39 |

A partir de aquí el proyecto opera en régimen de monitoreo según la sección 5.3. Los ciclos siguientes, si los hay, se numeran igual (C40 y siguientes) pero ya no responden a una fase de este documento.

### 6.1 Observaciones abiertas que no bloquean el cierre

Ninguna de estas es un defecto conocido con corrección obvia. Son puntos que la rutina debe vigilar y que se registran aquí para que no se pierdan.

1. **Dominio canónico frente a dominio primario de Netlify.** Todo el sitio declara la forma apex `https://psicologojuanfernandez.cl/` en canonical, hreflang, `og:url`, sitemap y la línea `Sitemap:` de robots.txt. Falta confirmar que el dominio primario configurado en Netlify sea también el apex. Si el primario fuera `www`, cada URL canónica respondería con una redirección y la URL final de los anuncios sumaría un salto innecesario. Verificación: en Netlify, Domain management, ver cuál aparece como primary domain.
2. **Reescritura comodín a `index.html`.** `netlify.toml` termina con `/*` hacia `/index.html` con estado 200. Es lo que hace funcionar la MPA, pero implica que cualquier ruta inexistente devuelve la portada con estado 200 en vez de 404. El `canonical` de la portada evita la indexación duplicada, y por eso no se toca. La consecuencia esperable es que Search Console reporte esas rutas como "página con redirección" o "404 blanda". Si aparecen, son explicables y no exigen acción salvo que afecten a una de las 3 URLs indexables.
3. **PSI de escritorio sin serie propia desde C37.** No se cita como estado actual hasta que exista una serie de 3 corridas bajo el protocolo de la sección 4.
