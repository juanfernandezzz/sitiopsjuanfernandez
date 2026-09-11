Ciclo C57. Repo juanfernandezzz/sitiopsjuanfernandez, rama main, base 744ce72. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `karpathy-guidelines` y `verification-before-completion`. Este ciclo toca un archivo de código y el banco de pruebas. No toques nada del sitio ni de `app/`.

PASO 0
Clona el repo. Confirma que estás en `744ce72` y sin cambios locales. Si no, detente y dilo. Guarda este prompt en `docs/planes/C57-firma-traerreservas.md`.

EL PROBLEMA
En C55 anotaste, con razón, que no podías ver la firma real de `traerReservas_` porque vive en el proyecto de Apps Script de la Planilla y no está versionada en este repo. Se fue a verificar en el editor de Apps Script antes de correr el barrido. El supuesto era incorrecto.

La firma real es:

```
function traerReservas_(estado, extras)
```

Y en el resto de ese proyecto se usa así, en las dos únicas llamadas que existen:

```
traerReservas_('upcoming', {})
traerReservas_('past', { afterStart: hace180 })
```

El barrido la llama con dos fechas, `traerReservas_(ventana.desde, ventana.hasta)`, así que le pasa un `Date` donde va un estado y otro `Date` donde va un objeto de opciones. La consulta a Cal.com sale malformada.

Falla hacia el lado seguro: o revienta y corta por la condición de aborto 1, o devuelve algo irreconocible y corta por `_listaReservasBH_`. No borraría nada por error. Pero el barrido no sirve para nada mientras esté así.

Dato confirmado en el editor, y que conviene dejar escrito: `traerReservas_` pagina sola por dentro, con `hasMore` y `nextCursor`, y devuelve el acumulado. No hay que paginar desde el barrido.

TAREA 1. La llamada correcta

En `apps-script/barrido-huerfanos.gs`, busca:

```
  // CONDICION DE ABORTO 1: la llamada a Cal.com fallo, dio error o vino vacia.
  var crudo;
  try {
    crudo = traerReservas_(ventana.desde, ventana.hasta);
  } catch (e) {
```

reemplaza por:

```
  // CONDICION DE ABORTO 1: la llamada a Cal.com fallo, dio error o vino vacia.
  //
  // C57: la firma real es traerReservas_(estado, extras), no (desde, hasta).
  // Verificada en el editor de Apps Script del proyecto de la Planilla, donde
  // las dos unicas llamadas que existen son traerReservas_('upcoming', {}) y
  // traerReservas_('past', { afterStart: hace180 }). C55 asumio (desde, hasta)
  // y con eso la consulta salia malformada.
  //
  // Se pide 'upcoming' entero, que es un superconjunto de la ventana de
  // DIAS_BH dias, y se filtra despues aca mismo. A proposito: una reserva que
  // cae justo fuera de la ventana igual tiene que poder emparejar con su
  // evento, o su evento pareceria huerfano.
  //
  // traerReservas_ pagina sola por dentro (hasMore, nextCursor) y devuelve el
  // acumulado, asi que desde aca no hay que paginar nada.
  var crudo;
  try {
    crudo = traerReservas_('upcoming', {});
  } catch (e) {
```

TAREA 2. La cabecera al día

En la cabecera del archivo, la línea 26 menciona que este archivo depende de `obtenerLlaveCal_`, `pedirCal_` y `traerReservas_`. Añade ahí, o donde te calce mejor dentro de la cabecera, que la firma de la que depende es `traerReservas_(estado, extras)`, y que si algún día cambia en el proyecto de la Planilla hay que actualizar la llamada de este archivo. Es la única dependencia externa que este repo no puede verificar por sí solo, y por eso conviene que esté escrita donde se lee primero.

TAREA 3. El banco fija la firma

El banco `scripts/probar-barrido-huerfanos.mjs` hoy dobla `traerReservas_` de una forma que acepta cualquier cosa, y por eso la firma equivocada pasó todas las pruebas. Corrígelo:

- El doble de `traerReservas_` debe verificar sus argumentos y hacer fallar la prueba si el primero no es la cadena `'upcoming'` o si el segundo no es un objeto.
- Añade una prueba nueva y explícita, con nombre que diga lo que fija, que compruebe que el barrido llama a `traerReservas_` con `('upcoming', {})`. Esa prueba tiene que fallar contra la versión de `744ce72` y pasar contra la nueva.

Esto es lo que impide que el mismo supuesto se cuele otra vez.

VERIFICACIÓN

1. El banco completo. Pega la salida entera. Todas las pruebas pasan.
2. La prueba nueva contra las dos versiones, igual que hiciste en C56. Ejecútala contra `git show 744ce72:apps-script/barrido-huerfanos.gs` y contra la nueva, y pega las dos salidas. La vieja tiene que fallar y la nueva pasar. Sin esa comparación no has demostrado que la prueba sirva de algo.
3. `npm run build` y `node scripts/greps.mjs`. Este ciclo no toca el sitio: las 7 páginas y los 7 greps en cero son el control de que no rompiste nada de paso.
4. El archivo parsea, con el mismo método de C55 y C56.

AUDITORÍA HOSTIL
Reporta en formato `❌ [problema detectado] → [corrección aplicada] ✅`. Si sobrevive intacto, dilo en una línea.

Revisa al menos:

- Que `CONFIRMO_BORRADO` siga en `false`.
- Que `deleteEvent` siga apareciendo una sola vez en todo el archivo.
- Que no quede ninguna otra llamada a `traerReservas_` con la firma vieja.
- Que la prueba nueva de verdad falle contra `744ce72`. Si pasa contra las dos versiones, no está fijando nada y hay que rehacerla.

COMMIT Y PUSH
Un solo commit en main:

```
C57: el barrido llama a traerReservas_ con su firma real
```

Push a main.

AL TERMINAR
Dile a Juan que el archivo ya se puede pegar en el proyecto de la Planilla. No abras trabajo nuevo.
