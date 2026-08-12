# psicologojuanfernandez.cl

Sitio profesional de Juan Fernández. Psicólogo Clínico Online.
Stack: Vite + React 18 + Tailwind 3 + Framer Motion.

## Setup primera vez

```bash
npm install
npm run dev
```

Servidor de desarrollo en `http://localhost:5173`.

## Assets ya incluidos

- `public/favicon.svg`: monograma "JF" serif sobre fondo ink con accent terracotta (más PNG e .ico derivados)
- `public/og.jpg`: 1200×630, diseño editorial con headline + signature, MINSAL N° 876085

## Estructura

```
sitio-juan/
├── public/                  favicon set (svg+png+ico), og.jpg, juan.jpg, robots.txt, sitemap.xml
├── src/
│   ├── assets/images/juan.jpg
│   ├── components/
│   │   ├── layout/          Header (barra fija sage), HeaderUtilitario, Footer
│   │   ├── sections/        Hero, ComoTrabajo, Precios, ComoFuncionaOnline, Agendar, FAQ
│   │   ├── modals/          ModalGuiaFonasa
│   │   ├── forms/           ConsentimientoInformado, PantallaExito
│   │   └── ui/              Button
│   ├── lib/                 cal, contacto, faqData, validacion, hash, generarPDF..., descargarPDF, uiContext, textoConsentimiento
│   ├── pages/               PoliticaPrivacidad
│   ├── App.jsx              raiz del sitio principal
│   ├── ConsentimientoApp.jsx
│   ├── PoliticaPrivacidadApp.jsx
│   ├── main.jsx / main-consentimiento.jsx / main-politica.jsx
│   └── index.css
├── netlify/functions/       cal-webhook, enviar-consentimiento
├── index.html / consentimiento.html / politica-privacidad.html
├── netlify.toml
├── tailwind.config.js / postcss.config.js / vite.config.js
└── package.json
```

## Sistema de diseño

- **Cream** `#F6F1E8` (fondo dominante)
- **Sage** `#3F5B4A` (estructura, headlines, theme-color en móvil)
- **Terracotta** `#C97B5E` (CTAs, accentos puntuales)
- **Ink** `#2A3B4C` (texto principal)
- **Fraunces** display con eje SOFT activado (warmth)
- **Karla** body

## Secciones del sitio (todas implementadas)

- [x] Hero (rotación de frase, foto con marco)
- [x] Cómo trabajo
- [x] Precios (grid 1+3, 4 modalidades)
- [x] Cómo funciona online
- [x] Agendar (Cal.com embed, 4 event types)
- [x] Preguntas frecuentes
- [x] Footer (privacidad Ley 21.719-ready)

## Configuración Cal.com (para Juan)

### Event types requeridos
Los 4 event types deben existir en cal.com/psicologojuanfernandez con los slugs declarados en `src/lib/cal.js` (`CAL_EVENTS`). Duración 45 min cada uno.

### Inicialización
Cal.com se inicializa una sola vez en `src/App.jsx` con namespace `psicojuan` (constante `CAL_NAMESPACE` en `src/lib/cal.js`). La config aplica branding sage, layout `month_view` y theme light.

Para que cualquier botón abra el modal correctamente debe llevar el namespace:
- Si usa el componente `<Button>` con prop `calLink="username/slug"`: el namespace se inyecta automáticamente.
- Si es un `<button>` nativo: debe incluir `data-cal-link="username/slug"` Y `data-cal-namespace="psicojuan"`.

### Additional Questions (custom fields)
Cal.com soporta preguntas adicionales por event type. Para los 3 eventos Fonasa (`primeraSesionFonasa`, `controlAvanceFonasa`, `parejaFonasa`) agregar:
- Pregunta: "Folio del bono Fonasa"
- Tipo: Short Text
- Required: No (opcional, porque algunos lo compran después de agendar)
- Placeholder: "Lo puedes enviar por WhatsApp si aún no lo tienes"

Para `particular15000` NO agregar esta pregunta.

### Email de confirmación
En cada event type, editar el "Confirmation email" para incluir:
- Link directo a la sala Doxy.me: https://doxy.me/psicologojuanfernandez
- Recordatorio de probar cámara y micrófono unos minutos antes
- Número WhatsApp para coordinar si falla la conexión: +56 9 7339 4530

### Recordatorios automáticos
Configurar workflows en cal.com con dos triggers:
- 24h antes: email con el link de la sala
- 1h antes: email + (opcional) SMS si el cliente dejó número

### Política de reagendamiento
Definir la política en cada event type (Booking Limits / Reschedule Policy). El copy del sitio en la sección Agendar dice "reagendamiento flexible según mi política" para no contradecir la config real.

### Correo automático post reserva (C42)
El webhook `cal-webhook` envía un correo en **cada reserva nueva**, con el contenido que corresponde al tipo de sesión. El motivo es el bono: hay que comprarlo antes de cada sesión Fonasa, sin excepción, así que un control o una sesión de pareja también necesitan sus datos de prestador.

Todo el correo vive dentro de `netlify/functions/cal-webhook.js`, en un solo archivo. En C42 el contenido estaba en `netlify/lib/`, fuera de la carpeta de funciones, y el correo siguió saliendo con el formato viejo pese a que el sitio sí se actualizó: ese import cruzado no llegó a la función desplegada. Un archivo autocontenido elimina esa clase de falla.

**Comprobar qué versión está viva**, sin entrar a Netlify y sin mandarle un correo de prueba a nadie:

```bash
curl https://psicologojuanfernandez.cl/.netlify/functions/cal-webhook
```

Devuelve `{"funcion":"cal-webhook","revision":"C48","slugs":[...]}`. Si la revisión no es la esperada, el deploy no actualizó la función. **Subir `REVISION` en cada cambio del correo.**

Ramas por slug de Cal.com (catálogo `CATALOGO` en el mismo archivo):

| Evento | Contenido de pago | Consentimiento |
|---|---|---|
| `primera-sesion-bonofonasa` | bono Fonasa, código 0908101 | **siempre** |
| `sesiones-de-avance-bonofonasa` | bono Fonasa, código 0908102 | **nunca** |
| `psicoterapia-de-pareja-bonofonasa` | bono Fonasa, código 0908103 (trato en plural) | según registro |
| `psicoterapia-individual-online-particular-15.000` | transferencia, se paga **después** de la sesión | según registro |
| slug desconocido | sin bloque de pago (degradación segura) | según registro |

Los datos del prestador que pide Mi Fonasa (dónde comprarlo, nombre legal completo, RUT, región, comuna, código, copago) van en una tabla dentro del correo. La atención es online: región y comuna se incluyen solo porque el formulario del bono las exige, y el correo lo aclara. La URL del portal (`https://mi.fonasa.gob.cl`) va como texto visible además del botón, porque no es el mismo dominio que el sitio institucional `fonasa.cl` y ahí se pierde gente.

Un reagendamiento **no** dispara correo: es la misma sesión movida de hora, el bono comprado sigue sirviendo y Cal.com ya avisa del cambio por su cuenta.

### Los tres estados de una reserva Fonasa

1. **Primera sesión** → consentimiento + bono `0908101`. Lleva el consentimiento **siempre**, aunque el registro diga que ya se pidió: no se puede firmar antes de agendar, así que reservar una primera sesión implica necesitarlo. Este evento no tiene variante "sin consentimiento".
2. **Primer control** de un correo que ya está en el registro → bono `0908102` con el aviso de que **el código cambió**. Comprar el bono con el código viejo deja la prestación sin poder registrarse, así que es el único aviso que se destaca. Llega **una sola vez** por correo electrónico.
3. **Controles siguientes, y pareja** → bono, sin aviso.

El control y avance **nunca** lleva el consentimiento: no se llega a un control sin haber pasado por la primera sesión, donde ya se pidió. Es un estado imposible y por eso no existe en el código.

### Registros (Netlify Blobs)

| Store | Clave | Responde | Si Blobs falla |
|---|---|---|---|
| `consentimiento-solicitado` | email en minúsculas | ¿ya se le pidió firmar? | se pide igual (requisito legal) |
| `primer-control-avisado` | email en minúsculas | ¿ya se le avisó del cambio de código? | se avisa igual |

Ninguno decide si se envía el correo, solo qué contenido lleva. Para pacientes que ya estaban en tratamiento cuando esto se desplegó, el registro arranca vacío: agrega sus emails en la env var opcional de Netlify `CONSENTIMIENTO_YA_OBTENIDO` (separados por coma o salto de línea) y recibirán el correo sin el paso de consentimiento. No va en el repo por ser dato de pacientes.

Para revisar el copy sin desplegar ni gastar envíos:

```bash
node scripts/previsualizar-correos.mjs
```

Genera en `dist-correos/` las siete variantes reales en HTML y texto plano, más un índice para abrirlas. Solo genera combinaciones posibles: la primera sesión no tiene "sin consentimiento" y el control no tiene "con consentimiento".

**Alineación con el sitio y la app (C45).** La página `/cita-agendada` y la pantalla equivalente de la app dicen lo mismo que el correo: nombre legal completo como titular, región y comuna, tipo de cuenta explícito, transferencia como vía principal con WebPay como alternativa, y el particular como pago **posterior** a la sesión. La fuente es `src/lib/postReserva.js` (la app recibe una copia generada por `app/scripts/sync-contenido.mjs` en cada `npm install`).

El correo **no** importa ese archivo: `cal-webhook.js` tiene su propia copia de los datos. Si cambia un dato de pago hay que tocar los dos, y subir `REVISION` para poder comprobar el deploy. La separación es a propósito: el correo es la ruta crítica y no debe depender del bundle del sitio.

Fuera de alcance a propósito: la guía de compra del bono (`ModalGuiaFonasa`) sigue sin región ni comuna. Es la guía del portal de Fonasa, no un espejo del correo.

## SEO y verificación de motores de búsqueda

### Estado actual (C10)
- Meta tags completos en las 3 páginas (title, description, OG, Twitter, canonical, robots, theme-color, author).
- JSON-LD Physician + WebSite + FAQPage en `index.html`.
- JSON-LD WebPage en `politica-privacidad.html`.
- `consentimiento.html` con `noindex,nofollow` y excluido del sitemap.
- `robots.txt` y `sitemap.xml` en `public/`.
- `og.jpg` (1200x630) servido desde la raíz.
- `theme-color` unificado a sage (`#3F5B4A`) en las 3 páginas.

### Pasos post-deploy

1. **Google Search Console** (https://search.google.com/search-console):
   - Agregar propiedad: `https://psicologojuanfernandez.cl/` (prefijo URL).
   - Verificar dominio por método de meta tag: copiar el meta tag que entrega Google, pegarlo dentro del `<head>` de `index.html` después de la línea `<meta name="robots" content="index, follow" />`, hacer commit y push, esperar deploy, presionar "Verificar".
   - Una vez verificado, enviar el sitemap: `https://psicologojuanfernandez.cl/sitemap.xml`.
   - Solicitar indexación manual de `/` y `/politica-privacidad.html` desde la herramienta "Inspección de URL".

2. **Bing Webmaster Tools** (https://www.bing.com/webmasters):
   - Si ya verificaste Google Search Console, importar la propiedad con un click (Bing soporta sincronización con GSC).
   - Enviar el mismo sitemap.

3. **Google Business Profile** (https://business.google.com):
   - Crear perfil como "Service-area business" (sin dirección pública).
   - Categoría primaria: **Psychologist**.
   - Área de servicio: **Chile** (país completo).
   - Sitio web: `https://psicologojuanfernandez.cl/`.
   - Teléfono: +56 9 7339 4530.
   - Horario: definir según disponibilidad de Juan en Cal.com.
   - Foto de portada: usar `og.jpg` o foto profesional.
   - Verificación: Google solicitará video-verificación o tarjeta postal. Seguir el flujo guiado.

4. **Validación técnica:**
   - Schema.org validator: https://validator.schema.org/ pegar `https://psicologojuanfernandez.cl/` y verificar Physician + FAQPage + WebSite sin errores.
   - Rich Results Test: https://search.google.com/test/rich-results idem.
   - Lighthouse (Chrome DevTools, pestaña Lighthouse): correr en modo "Production" y apuntar a SEO ≥ 95.
   - Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

### Keywords objetivo (referencia para outreach y contenido)
- psicólogo online Chile
- psicólogo Fonasa online
- terapia online videollamada Chile
- psicólogo clínico bono Fonasa
- psicoterapia online Chile
- psicólogo cognitivo conductual online
- atención psicológica online Chile
- terapia individual videoconsulta

### Mantenimiento
- Si editas `src/lib/faqData.js`, actualiza también el JSON-LD FAQPage en `index.html`. Drift entre ambos no rompe el sitio pero invalida los rich snippets de Google.
- Si cambias el RNPI, los precios, o las credenciales, actualizar también el JSON-LD Physician en `index.html`.
- Si agregas páginas indexables nuevas, agrégalas al `sitemap.xml`.
