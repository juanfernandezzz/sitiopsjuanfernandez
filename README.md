# psicologojuanfernandez.cl

Sitio profesional de Juan Fernández — Psicólogo Clínico Online.
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

- `public/favicon.svg` — monograma "j" serif italic sobre círculo sage con accent terracotta
- `public/og.jpg` — 1200×630, diseño editorial con headline + signature, MINSAL N° 876085

## Estructura

```
sitio-juan/
├── public/
│   ├── favicon.svg          ✓ creado
│   ├── og.jpg               ✓ creado
│   └── juan.jpg             ← falta (subir)
├── src/
│   ├── components/
│   │   ├── Nav.jsx
│   │   └── Hero.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Sistema de diseño

- **Cream** `#F6F1E8` (fondo dominante)
- **Sage** `#3F5B4A` (estructura, headlines)
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
