# psicologojuanfernandez.cl

Sitio profesional de Juan Fernández. Psicólogo Clínico Online.
Stack: Vite + React 18 + Tailwind 3 + Framer Motion.

## Setup primera vez

```bash
npm install
npm run dev
```

Servidor de desarrollo en `http://localhost:5173`.

## Pendiente antes del primer commit

**Foto profesional** (único pendiente):
Súbeme la imagen en el chat y la coloco en `public/juan.jpg` + regenero el zip. Mientras tanto el `<img src="/juan.jpg">` del Hero estará roto.

Cuando la foto esté en `public/juan.jpg`, también puedo regenerar `og.jpg` incorporándola como elemento visual (en lugar del monograma tipográfico actual).

## Assets ya incluidos

- `public/favicon.svg`: monograma "j" serif italic sobre círculo sage con accent terracotta
- `public/og.jpg`: 1200×630, diseño editorial con headline + signature, MINSAL N° 876085

## Estructura

```
sitio-juan/
├── public/
│   ├── favicon.svg          ✓ creado
│   ├── og.jpg               ✓ creado
│   ├── juan.jpg             ← falta (subir)
│   ├── robots.txt           ✓ creado (C10)
│   └── sitemap.xml          ✓ creado (C10)
├── src/
│   ├── components/
│   │   ├── Nav.jsx
│   │   └── Hero.jsx
│   ├── lib/
│   │   ├── contacto.js
│   │   └── faqData.js       ✓ creado (C10)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── consentimiento.html
├── politica-privacidad.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Sistema de diseño

- **Cream** `#F6F1E8` (fondo dominante)
- **Sage** `#3F5B4A` (estructura, headlines, theme-color en móvil)
- **Terracotta** `#C97B5E` (CTAs, accentos puntuales)
- **Ink** `#2A3B4C` (texto principal)
- **Fraunces** display con eje SOFT activado (warmth)
- **Karla** body

## Próximas secciones

- [ ] Sobre Mí (bio canónica + credenciales CV)
- [ ] Metodología (CBT integrativo + narrativo)
- [x] Agendar (Cal.com embed × 4 eventos)
- [x] Preguntas frecuentes
- [ ] Footer (privacidad Ley 21.719-ready)

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
