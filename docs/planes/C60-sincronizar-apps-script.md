Ciclo C60. Repo juanfernandezzz/sitiopsjuanfernandez, rama main. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `karpathy-guidelines` y `verification-before-completion`. Este ciclo NO toca el sitio. Solo documenta y versiona.

PASO 0
Clona el repo. Confirma que estás en el último commit de `main` y sin cambios locales. Guarda este prompt en `docs/planes/C60-sincronizar-apps-script.md`.

EL PROBLEMA
El proyecto de Apps Script de la Planilla de horas agendadas y el repo llevan meses divergiendo. Hoy ese proyecto tiene cuatro archivos y el repo refleja mal o nada de ellos:

| Archivo en la Planilla | Líneas | Estado en el repo |
|---|---|---|
| `Codigo.gs` | 951 | **No está versionado en absoluto** |
| `estado-ingreso.gs` | 159 | Hay una copia de C53, obsoleta |
| `barrido-huerfanos.gs` | 548 | Al día, coincide con `6c0bc47` |
| `horarios-protegidos.gs` | 185 | **No existe en el repo** |

Ya nos costó caro dos veces. En C58 no se pudo comprobar si el filtro de modos aceptaba `cerrada`, porque la copia del repo era de C53 y solo conocía un interruptor. Y en C55 el barrido salió con la firma equivocada de `traerReservas_`, porque esa función vive en `Codigo.gs` y `Codigo.gs` no está en ninguna parte del repo.

Este ciclo no arregla la divergencia entera, que exige extraer 40 KB de código a mano. Hace lo que sí se puede hacer bien: **dejar escrito qué existe, dónde vive, qué depende de qué, y cómo verificarlo**, para que el próximo ciclo no vuelva a asumir.

---

TAREA 1. Un mapa del proyecto de Apps Script

Crea `apps-script/README.md`. Tiene que decir, con el tono de comentario que usa el resto del repo:

- Que el proyecto de Apps Script de la Planilla es una fuente de verdad **que este repo no controla**, y que editar un archivo de `apps-script/` no cambia nada en producción hasta que alguien lo pegue en el editor de Apps Script.
- El id del proyecto: `1-iPEB1UN7zvnzyquZPnnSFXAr9BD7pVp5XSxt_oRFqWgP0m0mou6WtUM`.
- La tabla de los cuatro archivos de arriba, con el estado de cada uno.
- Que `Codigo.gs` (951 líneas) es el corazón: arma la Agenda por semana, la Carga por día, Horas fijas, Sin calzar, y expone `obtenerLlaveCal_`, `pedirCal_` y `traerReservas_`. No está versionado y ese es el mayor riesgo abierto del proyecto.
- La firma real de la que dependen otros archivos: `traerReservas_(estado, extras)`, que pagina sola por dentro con `hasMore` y `nextCursor` y devuelve el acumulado. Las dos llamadas que existen en el proyecto son `traerReservas_('upcoming', {})` y `traerReservas_('past', { afterStart: hace180 })`.
- Que `Codigo.gs` tiene **una línea de gancho** que este repo no puede ver: al final de `escribirAgenda_` llama a `pintarProtegidos_(hoja)`. Si alguien reemplaza `Codigo.gs` desde una copia vieja, esa línea se pierde y los horarios protegidos dejan de pintarse en silencio.
- Cómo se comprueba que lo desplegado hace lo que se cree: correr la función de diagnóstico del archivo en cuestión y leer el resultado, nunca deducirlo del código del repo.

---

TAREA 2. Hoja Sitio web, al día en la documentación

`src/lib/modalidades.js` describe hoy la hoja Sitio web y los pasos para cambiar de modo. Revísalo contra esto, que es lo que hay desplegado hoy, y corrige lo que no calce:

- La hoja se llama **Sitio web** y tiene dos filas: `Ingreso Fonasa abierto` (casilla de verificación) y `Modo del hero` (lista desplegable).
- La lista desplegable ya ofrece los tres modos: `particular`, `fonasa`, `cerrada`.
- El Web App está en **Versión 3**. Apps Script sirve la versión publicada, no el código guardado: editar el script sin publicar versión nueva no cambia nada. Eso merece quedar escrito, porque es una trampa que ya nos costó un rato.

No cambies comportamiento. Solo texto de comentarios.

---

TAREA 3. La hoja Horarios protegidos, documentada donde se usa

Hay una hoja nueva en la Planilla, **Horarios protegidos**, con columnas `Día | Desde | Hasta | Motivo`. Marca en la Agenda por semana las horas que Juan no quiere ofrecer, pintándolas en morado con la etiqueta `PROTEGIDA`. Solo pinta celdas vacías: si hay paciente, gana el paciente.

Es visual y **no cierra nada en Cal.com**. Hoy alcanza porque las primeras sesiones solo se reservan en el horario `Horas ingresos` (domingo), así que de lunes a sábado el único que puede ocupar una hora protegida es Juan al agendar controles.

Añade esto al `README.md` de la tarea 1. No hace falta tocarlo en `src/`, porque el sitio no sabe nada de esta hoja.

---

TAREA 4. Un aviso donde de verdad se lea

En `BLUEPRINT.md`, o en el archivo del repo que haga de índice general, agrega un renglón corto que apunte a `apps-script/README.md` y diga que hay una fuente de verdad fuera del repo. El objetivo es que quien llegue nuevo lo vea sin tener que abrir la carpeta.

---

VERIFICACIÓN

**1.** `npm run build` y `node scripts/greps.mjs`. Este ciclo no toca el sitio: las 7 páginas y los 7 greps en cero son el control de que no rompiste nada de paso. Si el `README.md` nuevo trae algún carácter prohibido, sustitúyelo y dilo.

**2.** `git diff --stat` contra el commit base. Solo deben aparecer archivos de documentación: el `README.md` nuevo, `modalidades.js` (solo comentarios), el índice, y el plan. **Ningún cambio de comportamiento.** Si aparece otra cosa, detente.

**3.** Confirma explícitamente que NO creaste ni modificaste ningún `.gs`. Este ciclo no inventa copias de código que no puedes ver: una copia inventada sería peor que no tener ninguna, porque el próximo ciclo la creería.

AUDITORÍA HOSTIL
Reporta en formato `❌ [problema] → [corrección] ✅`. Si sobrevive intacto, dilo en una línea.

Revisa al menos:
- Que no hayas afirmado nada sobre el contenido de `Codigo.gs` más allá de lo que dice este prompt. No lo has visto.
- Que quede claro en el README que editar `apps-script/` no despliega nada.
- Que `src/lib/estadoIngreso.js` siga en `false` y `'particular'`.

COMMIT Y PUSH
Un solo commit en main:

    C60: mapa del Apps Script de la Planilla y su divergencia con el repo

Push a main.

AL TERMINAR
Dile a Juan que queda abierto extraer `Codigo.gs` y `horarios-protegidos.gs` al repo, y que eso necesita copiarlos desde el editor de Apps Script. No abras trabajo nuevo.
