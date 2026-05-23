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
- [ ] Agendar (Cal.com embed × 4 eventos)
- [ ] Preguntas frecuentes
- [ ] Footer (privacidad Ley 21.719-ready)
