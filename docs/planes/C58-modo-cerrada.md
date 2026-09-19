Ciclo C58. Repo juanfernandezzz/sitiopsjuanfernandez, rama main, base 6c0bc47. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `karpathy-guidelines`, `incremental-implementation` y `verification-before-completion`.

PASO 0
Clona el repo. Confirma que estás en `6c0bc47` y sin cambios locales. Si no, detente y dilo.
Guarda este prompt en `docs/planes/C58-modo-cerrada.md`.

QUÉ SE PIDE
Un tercer valor para el modo del hero: `cerrada`. Hoy son dos, `particular` y `fonasa`.

Por qué. Juan tiene un solo cupo de ingreso a la semana, domingo 14:00. Cuando ese cupo no existe, el sitio no debe ofrecer nada. Le resulta raro ofrecer una modalidad y a la vez explicar que la otra está cerrada; prefiere que el sitio diga una sola cosa: que la agenda está cerrada.

Qué hace el modo `cerrada`:
- El sitio **no pide nada**. No hay acción principal de reserva, no hay lista de espera, no hay formulario, no hay captura de correo. Es una decisión consciente de Juan: no quiere pagar en tiempo cada conversación que termine en un "no puedo atenderte".
- Se queda todo lo que sirve a quien vuelva después: credenciales, registro de la Superintendencia, precio, cómo trabaja, la plataforma, las preguntas frecuentes, el pie.
- El botón flotante de WhatsApp se queda donde está, sin cambios. Es el canal de contacto que ya existe y no pasa a ser protagonista.
- Nada de Fonasa en primer plano, igual que en modo particular.

**Este modo no es una hipótesis.** Se va a usar en cuanto quede escrito, así que tiene que quedar utilizable, no esbozado.

---

TAREA 1. El tercer valor, de punta a punta

`src/lib/estadoIngreso.js`: el comentario de cabecera dice que los valores son `'particular'` o `'fonasa'`. Ahora son tres. Actualízalo. El valor versionado sigue siendo `'particular'` y no se toca.

`scripts/estado-ingreso.mjs`: `const MODOS = ['particular', 'fonasa'];` pasa a incluir `'cerrada'`. Revisa **todos** los textos del archivo que enumeran los dos valores, incluidos los de la cabecera y el mensaje de error de validación, y déjalos diciendo los tres. La dirección del fallo no cambia: un `heroModo` que no sea uno de los tres no se escribe, y queda el valor versionado.

`src/lib/modalidades.js`: la cabecera describe `HERO_MODO` como `'particular'` o `'fonasa'`. Tres ahora.

Revisa que `OFERTA_FONASA_VISIBLE` siga siendo correcto: hoy es `HERO_MODO_PLANILLA === 'fonasa'`, así que con `cerrada` da falso, que es lo que se quiere. Confírmalo en el reporte en vez de darlo por hecho.

Revisa también `EVENTO_PRINCIPAL`, que depende de `INGRESO_FONASA_ABIERTO` y no del modo. En `cerrada` no debería usarse para nada, porque no hay CTA de reserva. Si alguna superficie lo sigue consumiendo en ese modo, dilo.

---

TAREA 2. El hero en modo `cerrada`

`src/lib/hero.js` tiene hoy `HERO_PARTICULAR` y `HERO_FONASA`, y resuelve con `HERO_MODO === 'fonasa' ? HERO_FONASA : HERO_PARTICULAR`. Ese ternario deja `cerrada` cayendo en particular, que es justo lo que no queremos.

Añade `HERO_CERRADA` y resuelve los tres casos de forma explícita. Que un modo nuevo no pueda volver a caer por descuido en otro.

Contenido del hero cerrado, con criterio tuyo para la redacción exacta, dentro de estas reglas:
- Dice que la agenda está cerrada, en presente y sin rodeos. **No inventes fechas de reapertura**: Juan no las tiene, y una fecha inventada es una promesa que no puede cumplir.
- Sin acción principal de reserva. Sin enlace secundario que lleve a agendar.
- Sin la línea de pago ni el precio en el hero: no se está ofreciendo nada que pagar. El precio sigue existiendo más abajo, en Precios.
- Los chips de confianza se quedan, los mismos del modo particular.
- No uses raya ni semirraya. El grep 1 y el 2 tienen que seguir en cero.

---

TAREA 3. Las superficies de reserva, apagadas

En modo `cerrada` no puede quedar ninguna vía de agendamiento visible. Revisa y apaga, en ese modo:
- El CTA primario y el CTA de ancho completo.
- Los tres módulos de disponibilidad: el del hero, el de sección y la barra inferior de móvil.
- El CTA de la tarjeta de Precios.
- El enlace de agendar del menú del encabezado.

Los `data-cal-link` del HTML prerenderizado tienen que desaparecer en este modo. La verificación de abajo lo mide contando sobre `dist/index.html`, no leyendo componentes.

Lo que **no** se apaga: el botón flotante de WhatsApp, las páginas de consentimiento y asentimiento, la guía del bono, y cualquier enlace que sirva a un paciente que ya está en tratamiento.

Criterio tuyo: qué hacer con el hueco que dejan los módulos de disponibilidad. Que no quede un bloque vacío ni un esqueleto de carga eterno. Explica en el reporte qué elegiste.

---

TAREA 4. Documentar el segundo paso, que el código no hace

Poner la celda en `cerrada` cierra lo que el sitio **dice**. No cierra lo que Cal.com **acepta**. Con solo el paso uno, quien tenga el enlace directo de `primera-sesion` sigue reservando el domingo.

Y ojo: **ocultar el evento en Cal.com no basta**. Ya se comprobó en C53 que un evento oculto sigue aceptando reservas por enlace directo y por embed. Lo que hay que quitar es la disponibilidad.

La forma acordada con Juan, usando lo que ya existe: apagar el domingo en el horario **Horas ingresos** de Cal.com. Ese horario lo comparten los eventos de primera sesión de las dos modalidades, así que un solo interruptor los cierra a los dos.

Documenta esto en `src/lib/modalidades.js`, junto a los tres pasos de reapertura de Fonasa que ya están escritos ahí, con el mismo tono. Tiene que quedar claro que son dos pasos, que el segundo es manual, y qué pasa si alguien hace solo el primero.

---

VERIFICACIÓN. Ejecuta en orden y pega la salida.

**1.** `npm run build`. Las 7 páginas y la línea `ESTADO QUE SE COMPILA -> Ingreso Fonasa: cerrado | Modo del hero: particular`.

**2.** `node scripts/greps.mjs`: los 7 en cero.

**3.** Los tres modos, cada uno con su servidor falso, reconstruyendo entre medio. Pega los conteos de `dist/index.html` de los tres:

| | particular | fonasa | cerrada |
|---|---|---|---|
| `data-cal-link` | >0 | >0 | **0** |
| `5.570` | 0 | >0 | **0** |
| `primera-sesion` | >0 | >0 | **0** |
| `wa.me` | >0 | >0 | **>0** |

El botón de WhatsApp tiene que seguir en los tres. Si `wa.me` sale 0 en `cerrada`, apagaste de más.

**4.** Un `heroModo` inválido, por ejemplo `"CERRADA"` en mayúsculas: no se escribe, queda `particular`, código de salida 0, `estadoIngreso.js` intacto. Confirma con `git diff`.

**5.** Que en modo `particular` y en modo `fonasa` el sitio quede **idéntico** a como estaba en `6c0bc47`. Compara el texto visible de `dist/index.html` antes y después del ciclo para los dos modos, como hiciste en C55. Este ciclo agrega un modo, no cambia los que ya existían. Si aparece cualquier diferencia en esos dos, es un defecto.

**6.** `node app/scripts/sync-contenido.mjs` debe pasar la verificación de imports.

AUDITORÍA HOSTIL
Reporta en formato `❌ [problema detectado] → [corrección aplicada] ✅`. Si sobrevive intacto, dilo en una línea.

Revisa al menos:
- Que `src/lib/estadoIngreso.js` quede commiteado en `false` y `'particular'`.
- Que no quede ningún ternario, condición o comparación que trate el modo como binario y haga caer `cerrada` en otra rama por descuido. Búscalos todos, no solo el de `hero.js`.
- Que no quede ningún texto en el repo que siga enumerando solo dos modos.
- Que en modo `cerrada` no sobreviva ninguna vía de reserva, ni en el HTML prerenderizado ni en un componente que se monte después en el navegador.
- Que el botón de WhatsApp siga vivo en los tres modos.
- Que no hayas tocado nada nativo: no subas `runtimeVersion` en `app/app.json`.

COMMIT Y PUSH
Un solo commit en main:

    C58: tercer modo del hero, agenda cerrada

Push a main. Después del deploy, confirma que producción sigue en modo particular y sin cambios: este ciclo no debe alterar lo que se ve hoy.

AL TERMINAR
Dile a Juan que para activar el modo hay dos pasos, la celda y el domingo en Cal.com, y que el segundo no lo hace el código. No abras trabajo nuevo.
