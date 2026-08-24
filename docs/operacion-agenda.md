# Operación de agenda

**Documento de gobierno de la operación clínica de agenda. Versión 1.0. Ciclo de origen: C51, 24 de agosto de 2026.**

Este documento existe porque el `BLUEPRINT.md` declara en su sección 0.2 que su alcance es solo el sitio web. La operación de agenda no es el sitio: son tres sistemas que viven en la cuenta de Google y en Cal.com, no en este repositorio. Ensancharlos dentro de un documento ya cerrado habría degradado los dos. El BLUEPRINT conserva únicamente lo que toca al sitio y apunta aquí para el resto.

**Lo que está en este repositorio:** nada de la lógica. Solo este registro. El código vive en dos proyectos de Apps Script en la cuenta de Juan y se documenta aquí para que un ciclo futuro no tenga que redescubrirlo.

---

## 1. Los tres sistemas

| Sistema | Dónde vive | Qué hace | Cadencia |
|---|---|---|---|
| Tipos de evento de Cal.com | cal.com/psicologojuanfernandez | Definen qué se puede reservar, con qué recurrencia y con qué aviso mínimo | Cambian solo por decisión explícita |
| Planilla de horas agendadas | Google Sheets en Drive, Consultantes, Actuales | Cruza la carpeta clínica con Cal.com y produce la agenda, la carga por día, el estado de cada hora fija y los avisos | Automática a las 6 de la mañana, más botón manual |
| Limitador de agenda | Proyecto de Apps Script independiente | Bloquea días en Google Calendar cuando se alcanza el tope diario, con lo que Cal.com deja de ofrecer horas ese día | Cada 5 minutos |

---

## 2. Tipos de evento de Cal.com

Ocho en total, verificados el 22 de agosto de 2026. Todos duran 45 minutos, todos tienen aviso mínimo de 120 minutos y todos apuntan a la sala de Doxy.me.

| Visibilidad | Evento | Recurrencia |
|---|---|---|
| Público | Primera sesión con bono Fonasa | No recurrente |
| Oculto | Control y avance con bono Fonasa | No recurrente |
| Oculto | Psicoterapia de pareja con bono Fonasa | No recurrente |
| Oculto | Psicoterapia individual particular | No recurrente |
| Oculto | Hora fija semanal con bono Fonasa | Cada semana, 4 ocurrencias |
| Oculto | Hora fija quincenal con bono Fonasa | Cada 2 semanas, 2 ocurrencias |
| Oculto | Hora fija semanal particular | Cada semana, 4 ocurrencias |
| Oculto | Hora fija quincenal particular | Cada 2 semanas, 2 ocurrencias |

Los cuatro de hora fija son idénticos entre sí salvo por el título, el slug y la recurrencia. Fonasa y particular no están codificados en ningún campo del evento: viven solo en el nombre. Consecuencia práctica: clonar uno para crear otro es seguro, porque no hay nada específico de modalidad que se arrastre.

### 2.1 La recurrencia es finita, y esto gobierna toda la operación

Un evento recurrente de Cal.com genera un número fijo de ocurrencias y después se agota. Las cuatro variantes de hora fija cubren cuatro semanas y mueren: la semanal porque agota sus 4 sesiones, la quincenal porque agota sus 2 separadas por 14 días.

**Ninguna hora fija es permanente.** Cada cuatro semanas hay que volver a crear la serie, persona por persona. Cualquier razonamiento sobre capacidad futura que asuma series perpetuas está mal, y la agenda se vacía sola si nadie reagenda.

Esta es la razón de existir de la hoja Avisos: su criterio de prioridad alta "serie por vencer" es el único mecanismo que impide que una persona se quede sin hora sin que nadie lo note.

---

## 3. Planilla de horas agendadas

Google Sheets dentro de Drive, Consultantes, Actuales, con un proyecto de Apps Script ligado. La llave de la API de Cal.com vive en las propiedades del script, nunca en el código ni en la planilla.

### 3.1 Fuentes de verdad, separadas a propósito

| Dato | Sale de | Motivo |
|---|---|---|
| Quiénes están en el roster | Nombres de carpeta en Actuales que terminan en `(semanal)` o `(quincenal)` | La carpeta es lo que Juan mantiene a diario |
| Cómo se escribe el nombre | El nombre de la carpeta, siempre | Es la única fuente que respeta la regla de primer nombre más primer apellido. Lo que la persona escribe al reservar en Cal.com no la respeta |
| Día, hora y modalidad | Cal.com | Es donde ocurre el hecho: la reserva existe y se va a cumplir |
| Todos los topes y umbrales | La hoja Configuración | Ver sección 4 |

Cuando Drive y Cal.com se contradicen en la periodicidad, gana Cal.com y la fila queda marcada en la columna Conflicto. Pisar Drive en silencio escondería que una de las dos está mal.

### 3.2 Las siete hojas

| Hoja | Quién la escribe | Contenido |
|---|---|---|
| Configuración | Juan | Los once parámetros de la sección 4, más la casilla que fuerza la actualización |
| Avisos | El script | Lo que requiere acción, ordenado por urgencia. Ver 3.4 |
| Agenda por semana | El script | Cuadrícula rodante desde el lunes en curso, filas por hora, columnas de lunes a sábado |
| Carga por día | El script | Sesiones agendadas contra el tope de ese día, con desglose Fonasa y particular |
| Horas fijas | El script | El roster completo con estado Agendada o Pendiente, sesiones restantes de la serie y fecha de la última |
| Sin calzar | El script | Reservas de hora fija que no encontraron carpeta. Si tiene filas, alguien aparece como Pendiente sin serlo |
| Alias | Juan | Traduce el nombre de Cal.com al nombre de la carpeta cuando no calzan |

Configuración y Alias el script solo las lee. Nunca las reescribe. Todas las demás se borran y se regeneran en cada corrida.

### 3.3 Quincenal A y quincenal B

Una persona quincenal ocupa su franja una semana sí y otra no. Eso significa que **dos personas quincenales pueden compartir el mismo día y la misma hora** si caen en semanas alternas, y que una franja quincenal ocupada deja libre la mitad de las semanas.

La letra sale de la paridad de la semana contada contra un lunes ancla fijo guardado en Configuración. El ancla no se mueve nunca: cambiarla da vuelta todas las letras a la vez y deja ofreciendo la semana equivocada.

Caso real al 24 de agosto de 2026: martes a las 19:00 está tomado por una persona en semanas A y otra en semanas B. Lunes a las 19:00 está tomado solo en semanas A, así que las semanas B son un cupo vendible.

En la cuadrícula, los huecos de la semana alterna se marcan como `Libre QB` o `Libre QA` sobre fondo crema. Esa marca es lo que convierte la planilla en herramienta de venta: dice qué franja quincenal se puede ofrecer y en qué semana.

**Códigos en las celdas de la cuadrícula:**

| Código | Significa |
|---|---|
| `SF` | Semanal, bono Fonasa |
| `SP` | Semanal, particular |
| `QA-F` y `QB-F` | Quincenal Fonasa, en semanas A o en semanas B |
| `QA-P` y `QB-P` | Quincenal particular, en semanas A o en semanas B |

Se eligió texto y no color porque la cuadrícula ya usa tres fondos (hora fija, primera sesión, resto). Sumar cuatro colores más en seis columnas la vuelve ilegible, y el texto escala a combinaciones que el color no.

### 3.4 Criterios de la hoja Avisos

| Prioridad | Criterio | Por qué importa |
|---|---|---|
| Alta | Serie recurrente por vencer | Sin reagendar, esa persona se queda sin hora. No se recupera después |
| Alta | Reserva de hora fija sin carpeta en Actuales | Esa persona figura como Pendiente sin serlo, y se corre riesgo de agendarla dos veces |
| Media | Posible discontinuación | Sin sesión futura y con la última hace más días que el umbral. Sugiere mover la carpeta a Anteriores |
| Media | Sobrecupo | Más sesiones que el tope de ese día. No siempre es un error: a veces es deliberado |
| Media | Tope semanal Fonasa excedido | Deja menos espacio del previsto para particulares |
| Baja | Conflicto de periodicidad entre Drive y Cal.com | Una de las dos fuentes está desactualizada |
| Baja | Configuración incompleta | Se usó un valor por defecto en vez del que Juan quería |

---

## 4. La hoja Configuración como fuente única

Once parámetros. Los seis topes diarios los leen **los dos** sistemas: la planilla para calcular la carga y el limitador para bloquear días en el calendario.

| Parámetro | Valor al cierre de C51 |
|---|---|
| Tope de sesiones el lunes | 5 |
| Tope de sesiones el martes | 4 |
| Tope de sesiones el miércoles | 4 |
| Tope de sesiones el jueves | 4 |
| Tope de sesiones el viernes | 6 |
| Tope de sesiones el sábado | 3 |
| Tope semanal de sesiones Fonasa | 20 |
| Semanas visibles en la agenda | 5 |
| Días sin actividad para sugerir Anteriores | 21 |
| Avisar cuando a una serie le queden N sesiones o menos | 2 |
| Lunes ancla de la paridad quincenal | 2026-01-05 |

El tope semanal Fonasa cuenta **todas** las sesiones Fonasa de la semana, no solo las de hora fija: primera sesión, control y avance, pareja y hora fija. La capacidad total semanal que suman los seis topes diarios es 26, así que 20 de Fonasa dejan 6 para particulares.

### 4.1 Por qué existe este parámetro compartido

Hasta C51 los topes estaban escritos en dos lugares: en el código del limitador y en la cabeza de quien mirara la agenda. Ya habían derivado. El limitador tenía el viernes en 5 mientras la operación asumía 6, de modo que la planilla podía decir que quedaban cupos un viernes en que Google Calendar ya había cerrado el día.

Ahora hay un solo número por día y los dos sistemas obedecen al mismo.

---

## 5. Limitador de agenda

Proyecto de Apps Script independiente, con un disparador cada 5 minutos. Bloquea el día en Google Calendar cuando se alcanza el tope, y con eso Cal.com deja de ofrecer horas ese día.

Desde C51 lee los seis topes desde la hoja Configuración en vez de tenerlos escritos.

### 5.1 Cascada de seguridad ante un fallo de lectura

El orden importa y no es negociable:

1. Si logra leer la hoja, usa esos topes y guarda una copia en las propiedades de su propio proyecto.
2. Si la lectura falla, usa la última copia buena y lo deja escrito en el registro de ejecución.
3. Si nunca hubo copia, usa los topes de emergencia escritos en su código.
4. **En ninguna rama devuelve "sin tope".**

El motivo del punto 4: una agenda abierta por error no se deshace, porque las reservas que entren ya entraron. Un tope desactualizado, en cambio, se corrige cambiando una celda. Ante la duda, el sistema falla hacia cerrado.

### 5.2 Advertencia de autorización

Leer la planilla obligó a añadir el permiso de Hojas de cálculo, que ese proyecto no tenía. **Mientras el permiso no está concedido, el disparador falla cada 5 minutos y la agenda queda sin bloquear.** Cualquier cambio futuro que introduzca un servicio nuevo en ese proyecto abre la misma ventana: hay que autorizar de inmediato, no al día siguiente.

---

## 6. Rutina

El frente semanal de la hoja Avisos está registrado en la tabla de la sección 5.3 del `BLUEPRINT.md`, junto al resto del monitoreo permanente. No se duplica aquí.

---

## 7. Observaciones abiertas

1. **La migración a horas fijas está a medias.** Al 24 de agosto de 2026, 17 personas del roster tienen hora fija reservada y 12 no. Hasta que estén las 29, no puede aplicarse el aviso mínimo de 5 días del evento de avance que la decisión 5 del BLUEPRINT dejó pendiente: las 12 restantes todavía dependen de ese evento.
2. **El cruce por nombre tiene techo.** La planilla une la carpeta con la reserva por primer nombre más primer apellido, sin tildes. Cuando alguien reserva con un nombre distinto del de su carpeta, el cruce falla y la hoja Alias es la única reparación posible. No hay algoritmo que adivine la equivalencia sin arriesgarse a unir a dos personas distintas, y unir mal a dos consultantes en una planilla clínica es peor que dejar una fila sin cruzar.
3. **Las series vencen todas dentro de la misma ventana.** Como se crearon en pocos días, se agotan en pocos días. Conviene escalonar los reagendamientos en vez de dejar que caigan todos en la misma semana.
