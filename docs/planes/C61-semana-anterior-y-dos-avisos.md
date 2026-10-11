# C61. Semana anterior en la cuadricula y dos avisos nuevos

**Este archivo es el prompt para ejecutar en local, no un registro de algo ya hecho.**

Pegaselo completo a Haiku en una sesion local con Claude in Chrome, con el
editor de Apps Script de la Planilla abierto. No se pudo hacer desde el entorno
de nube: el codigo que hay que tocar es `Codigo.gs`, 951 lineas que viven
unicamente en el proyecto de Apps Script de la cuenta de Juan, no estan en este
repositorio, y la sesion de nube no tiene ninguna herramienta de Apps Script
(solo Hojas de calculo y Drive, que leen y escriben datos, no codigo). Lo que si
se hizo desde la nube fue leer la planilla en vivo: todos los numeros, nombres
de hoja y layouts de abajo estan verificados contra ella el 11 de octubre de
2026, no deducidos de la documentacion.

---

## Lo que pide Juan

1. Que la hoja **Agenda por semana** incluya **una semana anterior**, pintada en
   otro color, ademas de las que ya muestra hacia adelante.
2. Que la hoja **Avisos** le diga **qué personas semanales o quincenales no
   estan agendadas para la proxima semana cuando les corresponde estarlo**.
3. Que la hoja **Avisos** le **pregunte si va a seguir atendiendo** a alguien
   que falto a una o mas sesiones y cuya carpeta sigue en `Actuales` en vez de
   haberse movido a `Anteriores`.

---

## PASO 0, no negociable: versionar `Codigo.gs` ANTES de tocarlo

`Codigo.gs` no esta en ninguna parte de este repositorio. Si lo editas sin
copia previa y algo sale mal, no hay a que volver: la version original existe
solo en el historial del editor de Apps Script, que es mas incomodo de
recuperar que un archivo en git.

1. Abre el proyecto de Apps Script ligado a la Planilla. Id del proyecto:
   `1-iPEB1UN7zvnzyquZPnnSFXAr9BD7pVp5XSxt_oRFqWgP0m0mou6WtUM`.
   Id de la planilla: `1vvC0mnDd1Ah9ujxFoRcmK9p55bu_-fSKkV98h5ybP0A`.
2. Copia `Codigo.gs` **textualmente**, sin reformatear ni corregir nada, a
   `apps-script/Codigo.gs`. Haz lo mismo con `horarios-protegidos.gs`, que
   tampoco esta versionado.
3. Commitea esos dos archivos **solos**, antes de escribir una linea nueva:

       C61 paso 0: baseline de Codigo.gs y horarios-protegidos.gs tal como corren

4. Recien ahi empieza a editar. Todo cambio posterior tiene que ser legible como
   diff contra ese baseline.

Esto cierra, de paso, el pendiente que C60 dejo abierto a proposito.

### Que NO hay que hacer al terminar

`Codigo.gs` **no es un Web App**. Corre por disparador a las 6 de la manana y
por la casilla `Actualizar la planilla ahora` de la hoja Configuracion. Guardar
el script alcanza: **no** hace falta Implementar > Nueva implementacion. Esa
ceremonia aplica solo a `estado-ingreso.gs`, que si publica un Web App (hoy en
Version 3). Confundir las dos cosas ya costo tiempo de diagnostico antes.

---

## Estado real de la planilla al 11 de octubre de 2026

Nueve hojas, en este orden: `Configuración`, `Avisos`, `Agenda por semana`,
`Carga por día`, `Horas fijas`, `Sin calzar`, `Alias`, `Horarios protegidos`,
`Sitio web`.

### Configuración, valores en vivo

La documentacion del repositorio (`docs/operacion-agenda.md`, seccion 4) esta
desactualizada en cuatro filas. Estos son los valores reales:

| Parametro | Valor real hoy | Lo que decia el doc |
|---|---|---|
| Tope de sesiones el lunes | 6 | 5 |
| Tope de sesiones el martes | 5 | 4 |
| Tope de sesiones el miercoles | 5 | 4 |
| Tope de sesiones el jueves | 5 | 4 |
| Tope de sesiones el viernes | 6 | 6 |
| Tope de sesiones el sabado | 3 | 3 |
| Tope semanal de sesiones Fonasa | 20 | 20 |
| Semanas visibles en la agenda | 5 | 5 |
| Dias sin actividad para sugerir Anteriores | 21 | 21 |
| Avisar cuando a una serie le queden N sesiones o menos | 1 | 2 |
| Lunes ancla de la paridad quincenal | 2026-01-05 | 2026-01-05 |

Dos consecuencias:

- Juan cree que la agenda muestra "la semana en curso y 3 mas". Muestra 5
  semanas contando desde el lunes en curso. No es un error que haya que
  arreglar, pero no asumas 4 en ningun calculo.
- Como parte de la tarea, corrige esa tabla en `docs/operacion-agenda.md`
  seccion 4 con los valores reales de arriba. Es documentacion que ya enganio
  una vez.

### Layout exacto de `Agenda por semana`

Verificado leyendo `A1:H26`. Los bloques van **apilados verticalmente**, 15
filas por bloque:

```
fila  1   Semana del 05-10 al 10-10   ·   15 sesiones Fonasa
fila  2   Hora | Lun 05-10 | Mar 06-10 | Mié 07-10 | Jue 08-10 | Vie 09-10 | Sáb 10-10 (hoy)
fila  3   08:00 ...
fila  4   09:00
...
fila 14   19:00
fila 15   (vacia)
fila 16   Semana del 12-10 al 17-10   ·   19 sesiones Fonasa
fila 17   Hora | Lun 12-10 | ...
```

Es decir: titulo (1) + cabecera (1) + 12 filas de hora, de 08:00 a 19:00 (12) +
separadora (1) = 15. Origen del bloque de la semana `i`, contando desde 0 para
la semana en curso: `1 + i * 15`. Columnas: `A` la hora, `B` a `G` de lunes a
sabado. La columna del dia de hoy lleva el sufijo ` (hoy)` en la cabecera.

Contenido de celda: `Nombre · CODIGO`, con `SF`, `SP`, `QA-F`, `QB-F`, `QA-P`,
`QB-P`. Los huecos de la semana alterna dicen `Libre QA` o `Libre QB`. Las horas
que Juan no ofrece dicen `PROTEGIDA`. Hay celdas con nombre y sin codigo: son
sesiones que no son hora fija.

### Layout exacto de `Avisos`

Verificado leyendo `A1:F12`:

```
fila 1   Actualizado 10-10-2026 06:03. Si esta hoja está vacía, no hay nada que requiera tu atención.
fila 2   Prioridad | Tipo | Quién o cuándo | Fecha límite | Qué hacer
fila 3+  Alta | Serie por vencer | <Nombre>, Lunes 19:00 (Quincenal A) | 26-10-2026 | Le quedan 1. Vuelve a agendar la serie en Cal.com antes de esa fecha.
```

Cinco columnas, `A` a `E`. Los avisos nuevos usan exactamente ese formato: no
agregues columnas.

Dato operativo relevante: al 10 de octubre la hoja tenia **ocho** filas, todas
`Alta / Serie por vencer`, todas con `Le quedan 1`. Las series se crearon en
pocos dias y se agotan en pocos dias. Esto importa muchisimo para la Tarea 3 y
esta explicado ahi.

---

## TAREA 1. Una semana anterior en la cuadricula, en otro color

### Que implementar

Que `Agenda por semana` empiece una semana antes: primero el bloque de la
semana pasada, despues el de la semana en curso, despues las que ya se
muestran. El total pasa de 5 bloques a 6.

**No agregues un parametro nuevo a la hoja Configuración.** Juan pidio una
semana anterior, no un numero configurable de semanas anteriores. Una constante
al principio de la funcion, con comentario, alcanza:

```javascript
// C61: una semana hacia atras, en gris, para ver lo que acaba de pasar sin
// abrir el calendario. Si alguna vez se quieren dos, esto se sube a la hoja
// Configuración junto al resto de los umbrales.
var SEMANAS_ATRAS = 1;
```

Un parametro nuevo obligaria ademas a cubrir el caso de celda vacia o basura,
que es justo lo que alimenta el aviso existente `Configuración incompleta`. Mas
codigo que la funcionalidad misma.

### Donde mirar antes de escribir

1. Encuentra la funcion que arma la hoja, probablemente `escribirAgenda_`, y
   **como calcula el lunes de cada bloque y la fila de origen**. Si el origen
   esta escrito inline como `1 + i * 15` en mas de un lugar, saca un helper
   unico (`filaOrigenBloque_(i)`) y haz que todos lo usen. El resto de la tarea
   depende de que haya una sola definicion.
2. `escribirAgenda_` termina llamando a `pintarProtegidos_(hoja)`, que vive en
   `horarios-protegidos.gs`. **Esa funcion calcula por su cuenta las filas de
   cada bloque.** Si no comparte el helper, va a pintar `PROTEGIDA` 15 filas
   arriba de donde corresponde en todos los bloques. Esto es la rotura numero
   uno de esta tarea. Comprueba como lo hace y hazla usar el mismo helper.
3. Revisa que la linea `pintarProtegidos_(hoja)` siga ahi al terminar. Si
   reemplazas `Codigo.gs` desde una copia, esa llamada se pierde y los horarios
   protegidos dejan de pintarse sin que nada avise.

### El color

Pinta el bloque de la semana anterior completo en gris claro (`#f3f3f3` de
fondo, `#999999` de texto) **como ultima operacion de la funcion, despues de
`pintarProtegidos_`**. Si lo pintas antes, `pintarProtegidos_` vuelve a poner
morado encima y el bloque pasado queda con un morado que no significa nada.

Una sola llamada a `getRange(...).setBackground(...).setFontColor(...)` sobre
el rango del bloque. Es menos codigo que ramificar dentro del bucle que pinta
por categoria, y en una semana ya ocurrida la distincion entre hora fija,
primera sesion y resto no sirve para decidir nada: es historia. Ese es el costo
aceptado y hay que dejarlo escrito en un comentario de una linea.

### Los tres sitios que se rompen en silencio

Antes de dar la tarea por hecha, busca todo consumidor del arreglo de semanas.
Si alguno itera sobre el mismo arreglo al que acabas de agregar la semana
pasada, se contamina:

1. **El aviso `Tope semanal Fonasa excedido`.** Si cuenta Fonasa por cada
   semana del arreglo, va a generar un aviso por una semana ya ocurrida, sobre
   la que no se puede hacer nada. Tiene que seguir contando solo desde la
   semana en curso hacia adelante.
2. **La hoja `Carga por día`.** Mismo problema: si recorre el arreglo, aparecen
   dias pasados con sobrecupo. El aviso `Sobrecupo` depende de eso.
3. **El sufijo ` (hoy)`.** Hoy marca la columna del dia actual. Verifica que no
   quede marcando una columna del bloque pasado por comparar solo el dia de la
   semana y no la fecha completa.

La forma limpia de evitar los tres: deja el arreglo existente de semanas hacia
adelante intacto para todos los consumidores actuales, y maneja la semana
anterior como un bloque extra que **solo** se dibuja. No la metas en el arreglo
que ya consume el resto del script.

---

## TAREA 2. Aviso nuevo: quien no esta agendado para la proxima semana

### Criterio

Para cada persona del roster (carpeta en Drive `Consultantes / Actuales` cuyo
nombre termina en `(semanal)` o `(quincenal)`), mirar la ventana lunes a sabado
de **la semana siguiente a la en curso**:

- **Semanal**: le corresponde sesion todas las semanas. Si no tiene ninguna
  reserva viva en esa ventana, se emite el aviso.
- **Quincenal**: le corresponde solo en su propia paridad. Calcula la letra de
  la proxima semana contra el ancla `2026-01-05` de la hoja Configuración, con
  la misma funcion que ya usa la cuadricula para decidir `QA` y `QB`. **No
  escribas una segunda implementacion de la paridad**: si quedan dos, van a
  derivar y la letra se da vuelta en una sola de las dos.
  - Si la proxima semana es de su letra y no tiene reserva: se emite el aviso.
  - Si la proxima semana no es de su letra: **no se emite nada**. Esto es el
    nucleo de la tarea. Sin este filtro, la mitad del roster quincenal genera
    un aviso falso todas las semanas y la hoja se vuelve ruido.
- **Quincenal sin ninguna reserva en todo el historial**: su letra es
  desconocida y no se puede inventar. **No emitas el aviso.** Esa persona ya
  aparece como `Pendiente` en la hoja `Horas fijas`, que es donde corresponde
  verla.

Una reserva cancelada o rechazada **no** cuenta como agendada. El proyecto ya
tiene ese criterio escrito en `_reservaVivaBH_` de `barrido-huerfanos.gs`:
status `cancelled`, `canceled` o `rejected` no es reserva viva, y sin campo
`status` se asume viva. Reusa ese mismo criterio, no inventes otro.

### Fila que se escribe

| Columna | Contenido |
|---|---|
| Prioridad | `Alta` |
| Tipo | `Sin agenda la proxima semana` |
| Quien o cuando | `<Nombre de carpeta>, <Dia> <Hora> (<Semanal / Quincenal A / Quincenal B>)`, igual que lo hace `Serie por vencer`. Si no se conoce su franja habitual, solo el nombre |
| Fecha limite | El lunes de la proxima semana, formato `dd-MM-yyyy` |
| Que hacer | `No tiene hora reservada para la semana del <dd-MM>. Agenda su serie en Cal.com.` |

### Lo que NO hay que hacer

No deduplicar contra `Serie por vencer`. Una misma persona puede salir en las
dos filas: la serie con una sesion restante esta por vencer, y si esa ultima
sesion cae esta semana, la proxima ya esta vacia. Son el mismo trabajo, pero
esconder una de las dos es la direccion peligrosa: segun el documento de
gobierno, una serie que vence deja a la persona sin hora y eso no se recupera
con una correccion posterior. Dos filas molestan; una fila ausente cuesta una
sesion. Deja las dos y pon un comentario de una linea diciendo que es
deliberado.

---

## TAREA 3. Aviso nuevo: la pregunta por la ausencia

Esta es la tarea dificil y hay que leerla entera antes de escribir nada.

### Lo que Juan pide

Que la hoja le pregunte si va a seguir atendiendo a alguien que falto a una o
mas sesiones y cuya carpeta sigue en `Actuales`.

### La parte facil

La condicion de la carpeta **ya esta satisfecha y no necesita ninguna llamada a
Drive**. El roster se construye leyendo los nombres de carpeta de `Actuales`:
si una persona esta en el roster, su carpeta esta en `Actuales` por definicion.
Quien ya fue movida a `Anteriores` no aparece en el roster y no puede generar el
aviso. No agregues una lectura de `Anteriores`: no aporta nada.

### El problema real, que hay que resolver antes de codificar

**El script, con los datos que hoy carga, no puede distinguir "esta persona
falto" de "Juan todavia no le ha reagendado la serie".** Las dos cosas se ven
igual: sin sesion futura y con la ultima sesion hace varios dias.

Y ahora mismo el segundo caso es masivo: las series de Cal.com se agotan a las
4 semanas, se crearon todas en pocos dias, y al 10 de octubre ocho personas
tenian `Le quedan 1`. Un aviso basado solo en el hueco temporal le va a
preguntar a Juan si sigue atendiendo a media agenda la semana en que las series
vencen. Eso no es un aviso util, es una hoja que se aprende a ignorar, y una
hoja de avisos que se ignora es peor que no tenerla, porque los avisos de
prioridad alta que si importan se pierden entre el ruido.

### Como resolverlo: primero comprueba, despues elige rama

**Comprobacion obligatoria antes de escribir el aviso.** En el editor, corre una
funcion de diagnostico de usar y tirar que haga:

```javascript
function probarCanceladasC61() {
  var hace180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  var crudo = traerReservas_('past', { afterStart: hace180 });
  // Imprime un trozo del crudo para ver si las canceladas vienen incluidas y
  // con que valor exacto de status.
  Logger.log(JSON.stringify(crudo).slice(0, 2000));
}
```

Mira el registro y responde una sola pregunta: **la respuesta de
`traerReservas_('past', ...)` incluye reservas con `status` cancelado, si o no.**

Ojo con la firma. Es `traerReservas_(estado, extras)`, pagina sola por dentro
con `hasMore` y `nextCursor` y devuelve el acumulado completo. Las dos unicas
llamadas que existen en el proyecto son `traerReservas_('upcoming', {})` y
`traerReservas_('past', { afterStart: hace180 })`. Asumir
`traerReservas_(desde, hasta)` ya rompio un ciclo entero (C55). No la llames de
otra forma sin leer su cuerpo primero.

La envoltura de la respuesta tampoco es fija: puede venir como arreglo, como
`.bookings`, como `.data` o como `.data.bookings`. `_listaReservasBH_` en
`barrido-huerfanos.gs` ya cubre los cuatro casos. Reusala en vez de asumir una.

**Rama A, si las canceladas vienen incluidas.** Es el camino bueno y no necesita
ninguna llamada nueva a la API: la ausencia real es **una reserva cancelada con
hora de inicio en el pasado**. Eso es un dato duro, no una inferencia. El aviso
se emite cuando la persona tiene al menos una reserva cancelada pasada y no
tiene reserva viva futura.

**Rama B, si no vienen.** Hay que caer al hueco temporal, y entonces el aviso
tiene que estar acotado para no disparar sobre toda la agenda:

- Cadencia esperada: 7 dias si es semanal, 14 si es quincenal.
- Se emite si: sin reserva viva futura **y** dias desde la ultima sesion
  `> cadencia + 2` **y** dias desde la ultima sesion `<= 21` (el valor de
  `Dias sin actividad para sugerir Anteriores`).
- El tope de 21 dias no es cosmetico: evita duplicar el aviso existente
  `Posible discontinuación`, que ya cubre de 21 dias en adelante y que en vez de
  preguntar recomienda mover la carpeta a `Anteriores`. Quedan en escalera: la
  pregunta primero, la recomendacion despues.
- Ademas, **no lo emitas si esa persona ya aparece en `Serie por vencer` con
  fecha limite futura**: ahi el hueco es de reagendamiento, no de ausencia.
- En esta rama, el texto del aviso tiene que ser honestamente ambiguo. No
  afirmes que falto. Ver la fila de abajo.

Si existe una tercera opcion que no vi (por ejemplo que `traerReservas_` acepte
un estado `'cancelled'` como tercer valor, lo que la documentacion de Cal.com
sugiere pero no confirma), compruebala en el editor antes de usarla y prefierela
sobre la rama B.

Escribe en un comentario cual de las dos ramas quedo implementada y por que, con
la fecha de la comprobacion. El proximo ciclo no tiene que repetirla a ciegas.

### Fila que se escribe

| Columna | Contenido |
|---|---|
| Prioridad | `Media` |
| Tipo | `¿Sigues atendiendo?` |
| Quien o cuando | `<Nombre de carpeta>, ultima sesion <dd-MM-yyyy> (<Semanal / Quincenal>)` |
| Fecha limite | Vacio. No hay fecha de corte: es una decision, no un vencimiento |
| Que hacer, rama A | `Tiene <N> sesion(es) cancelada(s) y ninguna futura. Su carpeta sigue en Actuales: decide si sigue o muevela a Anteriores.` |
| Que hacer, rama B | `Sin sesion futura y la ultima fue hace <N> dias, mas de lo que indica su periodicidad. Su carpeta sigue en Actuales: confirma si sigue o si fue solo que no le has reagendado.` |

---

## VERIFICACION

Nada de esto es opcional. El script toca una planilla clinica en produccion.

1. **Baseline commiteado** (Paso 0). Sin eso, detente y hazlo primero.
2. **Corre la actualizacion a mano desde el editor**, no esperando el disparador
   de las 6. Busca en la lista de disparadores del proyecto cual es la funcion
   de entrada y ejecuta esa. Lee el registro de ejecucion completo, no solo el
   "ejecucion completada".
3. **Agenda por semana, cuatro comprobaciones concretas:**
   - El primer bloque es la semana que ya paso y esta en gris.
   - El segundo bloque es la semana en curso, con sus colores de siempre y con
     el sufijo ` (hoy)` en la columna correcta.
   - Hay 6 bloques en total, el ultimo empieza en la fila `1 + 5 * 15 = 76`.
   - Una hora que estaba marcada `PROTEGIDA` antes del cambio sigue marcada
     `PROTEGIDA` y en la misma celda. Si se corrio 15 filas, `pintarProtegidos_`
     quedo con su propio calculo de filas.
4. **Avisos, tres comprobaciones:**
   - Ninguna persona quincenal aparece en `Sin agenda la proxima semana` en una
     semana que no es de su letra. Verificalo a mano contra la cuadricula: toma
     una quincenal que si tiene hora la proxima semana y una a la que no le
     corresponde, y confirma que solo sale la que de verdad falta.
   - Nadie aparece a la vez en `¿Sigues atendiendo?` y en
     `Posible discontinuación`.
   - El recuento total de filas de `Avisos` es explicable. Si pasa de 8 a 40,
     algo esta disparando de mas: para y revisa el criterio antes de dejarlo
     corriendo.
5. **`node scripts/greps.mjs` da cero y `npm run build` pasa.** Este ciclo no
   toca el sitio, asi que eso es solo el control de que no rompiste nada de
   paso. Cuidado especial con las reglas 1 y 2: la raya `U+2014` y la semirraya
   `U+2013` estan prohibidas en todo el arbol, incluidos los comentarios de los
   `.gs` que vas a copiar al repositorio. Si el `Codigo.gs` original las trae,
   **no las cambies en el editor**: sustituyelas solo en la copia del repositorio
   y dejalo dicho, porque entonces la copia no es textual.

### Que haria incorrecto este trabajo

- Que `pintarProtegidos_` pinte filas corridas. Es la rotura mas probable y la
  menos visible: nadie revisa una hora protegida hasta que alguien la ocupa.
- Que el aviso quincenal ignore la paridad. Convierte la hoja en ruido y el
  dano real es que se dejen de leer los avisos de prioridad alta.
- Que la Tarea 3 se implemente por hueco temporal sin el tope de 21 dias y sin
  el filtro de `Serie por vencer`, justo en la ventana en que ocho series
  vencen a la vez.
- Que el bloque gris entre en el arreglo de semanas que consumen `Carga por día`
  y el tope semanal Fonasa.

### Que pasa si sale mal

La planilla borra y regenera `Avisos`, `Agenda por semana`, `Carga por día`,
`Horas fijas` y `Sin calzar` en cada corrida, asi que un error de dibujo se
arregla revirtiendo `Codigo.gs` al baseline y volviendo a correr: no se pierden
datos. `Configuración` y `Alias` solo se leen, nunca se reescriben; si tu
version las escribe, es un bug y hay que revertir de inmediato. El dano que no
se revierte es el silencioso: un aviso que deja de salir, o que sale tanto que
se ignora, y una persona que se queda sin hora. Por eso la verificacion 4 se
hace a mano contra la cuadricula y no por inspeccion del codigo.

---

## AUDITORIA HOSTIL

Al terminar, reporta en formato `❌ [problema] → [correccion] ✅`. Si sobrevive
intacto, dilo en una linea. Revisa al menos:

- Que `apps-script/Codigo.gs` y `apps-script/horarios-protegidos.gs` quedaron en
  el repositorio, y que el baseline se commiteo **antes** de los cambios.
- Que la llamada `pintarProtegidos_(hoja)` sigue al final de `escribirAgenda_`.
- Que la paridad quincenal se calcula en un solo lugar.
- Que el gris se aplica despues de `pintarProtegidos_`.
- Que no agregaste filas a la hoja `Configuración`.
- Que dejaste escrito en un comentario si la Tarea 3 quedo en rama A o B.
- Que `docs/operacion-agenda.md` seccion 4 quedo con los valores reales.

## COMMIT

Dos commits: el baseline del Paso 0, y despues uno solo con el cambio.

    C61: semana anterior en la cuadricula y dos avisos nuevos

No abras un pull request si Juan no lo pide.

## AL TERMINAR

Dile a Juan cual de las dos ramas quedo en la Tarea 3 y, si quedo la B, que el
aviso no distingue "falto" de "no le he reagendado" y que la unica forma de
distinguirlo es que Cal.com entregue las reservas canceladas. No abras trabajo
nuevo.
