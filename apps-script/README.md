# Apps Script de la Planilla de horas agendadas

Esta carpeta NO es el proyecto. Es una copia parcial y a veces vieja de lo que
corre en Apps Script. La fuente de verdad vive en el editor de Apps Script de
la Planilla de horas agendadas, id `1-iPEB1UN7zvnzyquZPnnSFXAr9BD7pVp5XSxt_oRFqWgP0m0mou6WtUM`,
y este repo no la controla. Editar un `.gs` de acá no cambia nada en
producción: para que algo se mueva, alguien tiene que abrir ese proyecto a
mano, pegar el código y, si el archivo es un Web App, publicar una versión
nueva. Guardar el script sin publicar versión no alcanza (ver Tarea 2 más
abajo).

## Qué hay hoy en la Planilla y qué hay en el repo

El proyecto tiene cuatro archivos. Este repo lleva meses divergiendo de dos de
ellos y directamente no tiene los otros dos:

| Archivo en la Planilla | Líneas en Apps Script | Estado en este repo |
|---|---|---|
| `Codigo.gs` | 951 | **No está versionado en absoluto.** |
| `estado-ingreso.gs` | 159 | La copia de acá es de C53 y quedó obsoleta. |
| `barrido-huerfanos.gs` | 548 | Al día, coincide con el commit `6c0bc47`. |
| `horarios-protegidos.gs` | 185 | **No existe en el repo.** |

Ya salió caro dos veces asumir que la copia del repo reflejaba lo que corre de
verdad. En C58 no se pudo comprobar si el filtro de modos del hero aceptaba
`cerrada`, porque `estado-ingreso.gs` era la copia de C53 y esa copia solo
conocía un interruptor. En C55 el barrido de huérfanos salió con la firma
equivocada de `traerReservas_`, porque esa función vive en `Codigo.gs` y
`Codigo.gs` no estaba en ninguna parte del repo. Este ciclo (C60) no extrae los
951 + 185 líneas que faltan: eso exige copiarlas a mano desde el editor. Lo que
deja escrito es qué existe, qué depende de qué, y cómo comprobarlo, para que el
próximo ciclo no vuelva a asumir.

### `Codigo.gs`, el corazón que no está versionado

951 líneas. Arma la hoja Agenda por semana, la Carga por día, Horas fijas y
Sin calzar, y expone las funciones de las que dependen los otros archivos:
`obtenerLlaveCal_`, `pedirCal_` y `traerReservas_`. Que no esté versionado es
el mayor riesgo abierto de este proyecto: cualquier cambio ahí es invisible
para el repo hasta que alguien lo copie a mano.

La firma real de `traerReservas_`, de la que dependen otros archivos (ver
`barrido-huerfanos.gs`), es:

```
traerReservas_(estado, extras)
```

Pagina sola por dentro con `hasMore` y `nextCursor` y devuelve el acumulado
completo, no una página. Las dos únicas llamadas que existen en el proyecto
hoy son:

```
traerReservas_('upcoming', {})
traerReservas_('past', { afterStart: hace180 })
```

Cualquier otra firma que se asuma sin mirar el editor (por ejemplo
`traerReservas_(desde, hasta)`, que fue el error de C55) rompe en silencio o
revienta con un error doble.

**Gancho invisible para este repo:** al final de `escribirAgenda_`, `Codigo.gs`
llama a `pintarProtegidos_(hoja)` (ver Tarea 3, abajo). Esa línea vive
únicamente en `Codigo.gs`. Si alguien reemplaza `Codigo.gs` completo desde una
copia vieja, la llamada se pierde y los horarios protegidos dejan de pintarse
sin que nada avise.

### Cómo comprobar qué hace lo desplegado

Nunca se deduce del código de esta carpeta, porque esta carpeta puede estar
desactualizada. Se comprueba corriendo la función de diagnóstico del archivo
en cuestión directamente en el editor de Apps Script y leyendo el resultado
del registro (`Logger.log` / Ejecuciones). Por ejemplo, `estado-ingreso.gs`
trae `probarEstado()` con ese propósito.

---

## Tarea 2: hoja Sitio web y el Web App que la publica

`src/lib/modalidades.js` documenta los dos interruptores que Juan escribe en
la hoja **Sitio web** de la Planilla:

- `Ingreso Fonasa abierto`, una casilla de verificación.
- `Modo del hero`, una lista desplegable que hoy ya ofrece los tres modos:
  `particular`, `fonasa`, `cerrada`.

El Web App que publica esos dos valores hacia `scripts/estado-ingreso.mjs`
está hoy en **Versión 3**. Apps Script sirve la versión publicada, no el
código guardado: guardar un cambio en el editor sin hacer Implementar > Nueva
implementación no mueve nada en producción, y el sitio sigue leyendo lo que
decía la versión anterior. Esa confusión ya costó un rato de diagnóstico y por
eso queda escrita acá.

---

## Tarea 3: hoja Horarios protegidos, solo visual

Hay una hoja nueva en la Planilla, **Horarios protegidos**, con columnas
`Día | Desde | Hasta | Motivo`. `Codigo.gs` la lee al armar la Agenda por
semana y pinta en morado, con la etiqueta `PROTEGIDA`, las horas que Juan no
quiere ofrecer. Solo pinta celdas que están vacías: si ya hay un paciente
agendado, el paciente gana y la celda no se toca.

Es puramente visual y **no cierra nada en Cal.com**. Una hora marcada
`PROTEGIDA` en la Planilla sigue disponible para reservar si alguien entra por
Cal.com. Hoy alcanza igual porque las primeras sesiones solo se reservan
dentro del horario `Horas ingresos` (domingo): de lunes a sábado, el único que
puede ocupar una hora protegida es el propio Juan al agendar un control desde
la Planilla o el calendario. Si eso cambiara (por ejemplo, si se abriera otro
horario de primeras sesiones entre semana), esta hoja dejaría de ser
suficiente para bloquear esas horas de verdad.

El sitio (`src/`) no sabe nada de esta hoja ni tiene que saberlo: es una
herramienta de agenda interna, no una política comercial del sitio como las de
`modalidades.js`.

---

## Los otros dos `.gs` que hay en esta carpeta

Esta carpeta trae además `crearHorasFijas.gs` y `limitador.gs`, que no
aparecen en la tabla de arriba porque esa tabla es la lista de archivos que
tiene HOY el proyecto de Apps Script, según lo que describe el ciclo C60, y
esos dos no están en ella. No se sabe, desde este repo, si siguen existiendo
como archivos sueltos en el proyecto, si se fusionaron dentro de `Codigo.gs`,
o si quedaron obsoletos. Es otra pregunta que solo el editor de Apps Script
puede responder, y queda anotada acá para no perderla.

## Qué falta y qué NO hace este README

Este README no es una copia de `Codigo.gs` ni de `horarios-protegidos.gs`.
Nadie los ha visto en este repo para poder copiarlos: lo de arriba es lo que
se sabe de ellos por lo que otros archivos asumen al llamarlos, no una
transcripción de su código. Extraerlos de verdad requiere abrir el editor de
Apps Script y copiar cada uno a mano hacia esta carpeta.
