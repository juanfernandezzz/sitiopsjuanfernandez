Ciclo C56. Repo juanfernandezzz/sitiopsjuanfernandez, rama main, base 46b1714. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `karpathy-guidelines`, `systematic-debugging` y `verification-before-completion`. Este ciclo toca un solo archivo: `apps-script/barrido-huerfanos.gs`. No toques nada más del repo.

PASO 0
Clona el repo. Confirma que estás en `46b1714` y sin cambios locales. Si no, detente y dilo. Guarda este prompt completo en `docs/planes/C56-arreglo-aborto-barrido.md`. Si trae algún carácter prohibido por `scripts/greps.mjs`, sustitúyelo y deja una nota al pie, como hiciste en C55.

EL PROBLEMA
La condición de aborto 2 de `_calcularHuerfanosBH_()` dice:

```
  if (enVentana < candidatos.length) {

```

donde `enVentana` son las reservas vivas de Cal.com dentro de la ventana y `candidatos` son los eventos del calendario creados por Cal.com en esa misma ventana.

Cada huérfano es, por definición, un evento del calendario sin reserva viva que le corresponda. Luego cada huérfano hace que `candidatos` supere a `enVentana` en uno. La desigualdad solo se cumple cuando no hay ningún huérfano: en cuanto existe uno, el barrido aborta diciendo que la consulta vino incompleta, que es falso.

El guardián impide encontrar exactamente aquello para lo que se escribió el archivo.

Las 11 pruebas del banco pasaron porque sus fixtures tenían reservas de sobra sin evento de calendario asociado. En el calendario real de Juan eso casi no ocurre: toda reserva viva tiene su evento. Es un artefacto del banco, no una validación. Corrige también el banco, o las pruebas seguirán tapando el defecto.

LA IDEA DEL ARREGLO
La intuición original era buena: si a la consulta de Cal.com le faltó una página, muchísimos eventos parecerán huérfanos de golpe. Lo que estaba mal es dónde se mide.

El umbral no va sobre los conteos crudos, va sobre el resultado. Huérfanos reales son pocos; una consulta incompleta produce un bloque grande. Y el umbral no tiene por qué frenar una función que solo lee.

TAREA 1. Umbrales nuevos

En el bloque de constantes de arriba, después de `var FIRMA_LIMITADOR_BH = 'BLOQUEO-AUTOMATICO-v2';`, añade dos constantes con comentario en el mismo tono que las demás:

* Un tope absoluto de huérfanos, valor 5.
* Una proporción máxima sobre el total de candidatos, valor 0.25.

El comentario tiene que explicar por qué el umbral va sobre el resultado y no sobre los conteos crudos, y mencionar que la versión anterior abortaba justo cuando había huérfanos.

TAREA 2. Quitar la condición de aborto 2 de donde está

En `_calcularHuerfanosBH_()`, busca y borra el bloque completo:

```
  // CONDICION DE ABORTO 2: menos reservas que eventos de Cal.com en el
  // calendario significa que la consulta vino incompleta, no que sobren eventos.
  if (enVentana < candidatos.length) {
    r.motivo =
      'ABORTA: Cal.com devolvio ' + enVentana + ' reservas en la ventana y el' +
      ' calendario tiene ' + candidatos.length + ' eventos de Cal.com en la misma' +
      ' ventana. La consulta vino incompleta (paginacion, filtro o permisos).';
    return r;
  }

```

Las condiciones de aborto 1 y 3 se quedan exactamente como están.

TAREA 3. El umbral se evalúa sobre el resultado, y no bloquea la lectura

`_calcularHuerfanosBH_()` pasa a devolver, además de lo que ya devuelve, un campo que diga si el conjunto de huérfanos supera el umbral, y otro con el motivo legible cuando lo supera. El nombre lo eliges tú.

Reglas:

* `ok` sigue significando lo mismo que hoy: que el cálculo es fiable. Superar el umbral no pone `ok` en false. Son dos cosas distintas: `ok` dice "pude calcular", el umbral dice "el resultado es sospechoso".
* El cálculo del umbral: se supera si el número de huérfanos es mayor que el tope absoluto, o si es mayor que la proporción máxima por el número de candidatos. Cualquiera de las dos.
* Con cero candidatos, no se supera nada.

En `_informarBH_()`, cuando el umbral se supere, escribe un aviso claro que diga cuántos huérfanos salieron sobre cuántos candidatos, que eso apunta a una consulta incompleta de Cal.com más que a huérfanos de verdad, y que por eso el borrado queda bloqueado.

`listarHuerfanos()` no cambia de comportamiento: muestra siempre lo que calculó. Si el umbral se supera, lo dice, pero no se calla la lista. Juan tiene que poder ver los datos para decidir.

`borrarHuerfanos()` sí se frena: si el umbral se supera, informa y termina sin borrar, antes incluso de mirar `CONFIRMO_BORRADO`. El orden de los frenos queda: `ok` en false, luego cero huérfanos, luego umbral superado, luego `CONFIRMO_BORRADO`.

TAREA 4. Cabecera al día

La cabecera del archivo describe las tres condiciones de aborto. Ahora son dos, más un umbral que solo frena el borrado. Corrige esa parte para que describa lo que el archivo hace de verdad, y deja constancia en una línea de por qué cambió, que es el defecto de C55.

TAREA 5. El banco de pruebas

Corrige las fixtures para que reflejen el calendario real: toda reserva viva tiene su evento de calendario, y los huérfanos son eventos de más, no reservas de menos. Con las fixtures corregidas, el caso del 11 de septiembre tiene que detectar los dos eventos de las 12:00 y no tocar ni la hora real de las 13:00 ni la de la otra paciente.

Añade además estas pruebas nuevas:

1. Un huérfano solo, con veinte candidatos: no se supera el umbral, se lista y el borrado procede si `CONFIRMO_BORRADO` está en true.
2. Página faltante: quince huérfanos de veinte candidatos. Se supera el umbral, `listarHuerfanos()` igual los lista, y `borrarHuerfanos()` no borra nada aunque `CONFIRMO_BORRADO` esté en true.
3. Seis huérfanos de cien candidatos: seis supera el tope absoluto de cinco aunque no llegue a la cuarta parte. Se bloquea el borrado.
4. Cero huérfanos: sin aviso de umbral, sin borrado, y el mensaje correcto.

Si el banco no está versionado en el repo, versiónalo ahora bajo `scripts/` o donde te calce mejor, para que el próximo ciclo no tenga que reconstruirlo.

VERIFICACIÓN

1. El banco completo, con las pruebas viejas corregidas y las cuatro nuevas. Pega la salida entera. Todas tienen que pasar.
2. La prueba que reproduce el defecto que motiva el ciclo: un caso con exactamente un huérfano, donde cada reserva viva tiene su evento. Antes de tu cambio ese caso aborta; después lo detecta. Demuéstralo ejecutando el mismo caso contra la versión anterior del archivo (`git show 46b1714:apps-script/barrido-huerfanos.gs`) y contra la nueva, y pega las dos salidas. Sin esa comparación no has demostrado nada.
3. `npm run build` y `node scripts/greps.mjs`. Este ciclo no toca el sitio, así que los 7 greps siguen en cero y las 7 páginas siguen saliendo. Es el control de que no rompiste nada de paso.
4. El archivo parsea. Como `node --check` falla por la extensión `.gs`, cópialo a `.js` y compruébalo así, igual que en C55.

AUDITORÍA HOSTIL
Reporta en formato `❌ [problema detectado] → [corrección aplicada] ✅`. Si sobrevive intacto, dilo en una línea.

Revisa al menos:

* Que `CONFIRMO_BORRADO` siga en `false` en el commit.
* Que superar el umbral no ponga `ok` en false. Son dos señales distintas y mezclarlas repite el error de C55, que fue meter un freno donde no correspondía.
* Que `listarHuerfanos()` siga siendo incapaz de borrar nada por ninguna ruta.
* Que las condiciones de aborto 1 y 3 sigan cortando antes de cualquier borrado.
* Que no quede ninguna prueba del banco que pase solo porque sus fixtures tienen reservas sin evento.
* Que no hayas tocado nada del sitio ni de `app/`.

COMMIT Y PUSH
Un solo commit en main:

```
C56: el umbral del barrido se mide sobre el resultado y no frena la lectura

```

Push a main.

AL TERMINAR
Dile a Juan que el barrido ya se puede pegar en el proyecto de la Planilla y correr `listarHuerfanos()`, que solo lee. No abras trabajo nuevo.
