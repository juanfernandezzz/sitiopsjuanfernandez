Ciclo C55. Repo juanfernandezzz/sitiopsjuanfernandez, rama main, base 7793548. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `karpathy-guidelines`, `systematic-debugging` y `verification-before-completion`. Las tareas 1 a 3 son reemplazos literales: no rediseñes, no refactorices, no toques nada que no esté listado. Si un texto que buscas no aparece exactamente como está escrito aquí, DETENTE y dilo en vez de improvisar un reemplazo parecido. Las tareas 4 y 5 tienen partes de criterio, y están marcadas.

PASO 0
Clona el repo. Confirma que estás en `7793548` y sin cambios locales. Si no, detente y dilo. Guarda este prompt completo, tal cual, en `docs/planes/C55-aviso-pago-pareja-y-barrido.md`.

POR QUÉ ESTE CICLO
Cuatro cosas detectadas auditando C54, más dos decisiones de Juan.

Un fallo real: cuando la Planilla devuelve un campo válido y otro inválido, el script aplica el válido pero el aviso del build afirma que los dos volvieron al valor versionado. Reproducido: con `ingresoFonasaAbierto: true` y `heroModo: "FONASA"`, el archivo queda en `true` y el registro dice "Fonasa CERRADO".

Una inconsistencia de copy: la política de pago de Juan ("pagas por transferencia o WebPay, después de la sesión") es su principal diferenciador y hoy aparece dicha de cuatro formas distintas, una de ellas contradiciéndola.

Dos decisiones de Juan: fuera la insignia "Agenda abierta", y fuera la tarjeta de terapia de pareja cuando el sitio está en modo particular.

Y un hallazgo nuevo, que es el origen de la tarea 5: el 11 de septiembre aparecieron dos eventos en el Google Calendar de Juan, martes 15 y 22 a las 12:00, con un paciente que en realidad tiene hora a las 13:00. Chocaban con otra paciente a la misma hora. Al revisarlos resultó que Cal.com no tenía ninguna reserva a las 12:00: los eventos existían solo en Google Calendar, creados por Cal.com en su momento y nunca retirados cuando la reserva dejó de existir. Se borraron a mano. La pregunta abierta es si hay más huérfanos así.

TAREA 1. Que el aviso deje de afirmar un estado que no verificó

Archivo: `scripts/estado-ingreso.mjs`

1a. Busca esta función y reemplázala completa:

```
function aviso(texto) {
  const linea = '='.repeat(70);
  console.warn('\n' + linea);
  console.warn('[estado-ingreso] ' + texto);
  console.warn('[estado-ingreso] El sitio se despliega con los valores versionados: Fonasa CERRADO, hero en modo PARTICULAR.');
  console.warn(linea + '\n');
}

```

por:

```
// C55: este aviso ya no afirma en que estado queda el sitio. Antes decia
// siempre "se despliega con los valores versionados", y eso es falso cuando un
// campo se aplico y el otro no: la aplicacion es independiente por campo. Con
// ingresoFonasaAbierto valido y heroModo invalido, el archivo quedaba en true y
// el registro decia CERRADO. Un aviso que afirma sin comprobar es peor que no
// tener aviso. El estado real lo imprime estadoFinal(), leyendo el archivo.
function aviso(texto) {
  const linea = '='.repeat(70);
  console.warn('\n' + linea);
  console.warn('[estado-ingreso] ' + texto);
  console.warn('[estado-ingreso] Ese campo conserva su valor versionado.');
  console.warn(linea + '\n');
}

// Lee el archivo en disco, no las variables en memoria: es lo unico que dice la
// verdad sobre lo que se va a compilar.
function estadoFinal() {
  const fonasa = valorVersionadoFonasa() ? 'ABIERTO' : 'cerrado';
  const modo = valorVersionadoModo();
  console.log(`[estado-ingreso] ESTADO QUE SE COMPILA -> Ingreso Fonasa: ${fonasa} | Modo del hero: ${modo}`);
}

```

1b. En `main()`, busca:

```
  console.log('[estado-ingreso] Planilla leida.');
  aplicarFonasa(datos);
  aplicarModo(datos);
}

```

reemplaza por:

```
  console.log('[estado-ingreso] Planilla leida.');
  aplicarFonasa(datos);
  aplicarModo(datos);
  estadoFinal();
}

```

1c. Los `return` tempranos de `main()` salen sin imprimir el estado final. Haz que también lo impriman. La forma la eliges tú; el requisito es que toda ejecución del script termine imprimiendo exactamente una línea `ESTADO QUE SE COMPILA`, incluido el `catch` del final.

1d. Actualiza el comentario de cabecera donde describe la dirección del fallo: la aplicación es por campo, un campo inválido no arrastra al otro.

TAREA 2. Una sola política de pago

Frase de referencia, literal de Juan:

```
Pagas por transferencia o WebPay, después de la sesión

```

Ya está bien en `src/lib/hero.js` y en `src/lib/faqData.js`. No los toques.

2a. `src/lib/proceso.js`. Busca:

```
      nota: 'Si vas con bono Fonasa, lo compras y me envías el folio antes de la sesión, sin excepción. La sesión particular se paga después de la sesión, por transferencia. Te llega todo detallado en el mismo correo.',

```

reemplaza por:

```
      nota: 'Si vas con bono Fonasa, lo compras y me envías el folio antes de la sesión, sin excepción. La sesión particular se paga después de la sesión, por transferencia o WebPay. Te llega todo detallado en el mismo correo.',

```

2b. `src/lib/proceso.js`. Busca:

```
  notaPago: `El pago es simple: la sesión particular cuesta ${PRECIOS.particular.display} y la pagas por transferencia después de la sesión.`,

```

reemplaza por:

```
  notaPago: `El pago es simple: la sesión particular cuesta ${PRECIOS.particular.display} y la pagas por transferencia o WebPay, después de la sesión.`,

```

2c. `src/components/sections/Precios.jsx`. Busca:

```
              Si tienes Isapre, otra previsión o ninguna. El pago se coordina por WhatsApp y puede ser después de la sesión.

```

reemplaza por:

```
              Si tienes Isapre, otra previsión o ninguna. Pagas por transferencia o WebPay, después de la sesión.

```

La más importante de las cuatro: "puede ser" convertía una política en una posibilidad, y "se coordina por WhatsApp" metía un trámite justo donde se ofrece lo contrario.

2d. `src/lib/postReserva.js`. Busca:

```
      'La sesión particular se paga después de la sesión, por transferencia electrónica:',

```

reemplaza por:

```
      'La sesión particular se paga después de la sesión, por transferencia electrónica o WebPay:',

```

TAREA 3. Sacar la insignia "Agenda abierta"

`src/components/sections/Precios.jsx`. Busca y borra entero, incluida la línea en blanco que lo sigue:

```
            <span className="absolute -top-3 left-6 bg-terracotta-deep text-cream font-body text-[12px] font-medium tracking-[0.02em] px-3 py-1.5 rounded-full select-none">
              Agenda abierta
            </span>


```

Criterio de Juan: con que la tarjeta sea agendable es suficiente. Con un cupo semanal, "Agenda abierta" promete más de lo que hay.

Ojo con el `mt-2` del `h3` que venía debajo: existía para dejar sitio a la insignia. Revisa el espaciado y ajústalo si queda raro.

TAREA 4. La tarjeta de terapia de pareja desaparece en modo particular

* modo `fonasa`: se muestra igual que hoy, con "Sin cupos por ahora". No cambia nada.
* modo `particular`: no se muestra en absoluto.

El patrón ya existe en el repo: es como se gobierna la tarjeta de primera sesión Fonasa con `OFERTA_FONASA_VISIBLE`. Sigue ese mismo patrón.

4a. `src/lib/sesiones.js`. Busca:

```
  {
    key: 'parejaFonasa',
    titulo: OFERTA_FONASA_VISIBLE
      ? 'Sesión de pareja con bono Fonasa'
      : 'Terapia de pareja',
    precio: OFERTA_FONASA_VISIBLE ? PRECIOS.fonasaCopago.display : null,
    detalle: 'Con ambos miembros presentes. Hoy está sin cupos.',
    cta: 'Agendar sesión de pareja',
    sinCupos: true,
  },
];

```

reemplaza por:

```
  // C55: la terapia de pareja sale del modo particular por completo. Antes se
  // mostraba en los dos modos con la etiqueta de sin cupos. Decision de Juan:
  // en modo particular no aporta, porque no hay cupo de pareja de ningun tipo
  // y no piensa ofrecerla hasta especializarse. En modo fonasa se mantiene.
  ...(OFERTA_FONASA_VISIBLE
    ? [
        {
          key: 'parejaFonasa',
          titulo: 'Sesión de pareja con bono Fonasa',
          precio: PRECIOS.fonasaCopago.display,
          detalle: 'Con ambos miembros presentes. Hoy está sin cupos.',
          cta: 'Agendar sesión de pareja',
          sinCupos: true,
        },
      ]
    : []),
];

```

4b. `src/components/sections/Precios.jsx`. Dos bloques de JSX pintan la pareja y los dos tienen que quedar condicionados a `OFERTA_FONASA_VISIBLE`, con el mismo `{OFERTA_FONASA_VISIBLE && ( ... )}` que ya envuelve la tarjeta de primera sesión Fonasa:

1. La tarjeta, el `<motion.article>` que va después del comentario `{/* Terapia de pareja */}`.
2. La fila de la tabla comparativa, el `<tr>` cuyo `<th>` contiene `'Terapia de pareja'`.

4c. Corrige los dos comentarios del mismo archivo que ahora dicen lo contrario del comportamiento nuevo:

* `// La terapia de pareja se queda en los dos modos, siempre con la etiqueta.`
* `en modo particular queda solo la terapia de pareja, que se muestra en los dos modos con su etiqueta de sin cupos.`

4d. Criterio tuyo. En modo particular la columna derecha de la sección de precios se queda sin ninguna tarjeta, y el layout de dos columnas pierde sentido. Resuélvelo como te parezca mejor, con la restricción de que en modo `fonasa` el layout quede exactamente igual que hoy. Explica en el reporte qué hiciste y por qué.

No toques `CAL_EVENTS.parejaFonasa` en `cal.js`, ni la ficha de `psicoterapia-de-pareja-bonofonasa` en `postReserva.js` y `cal-webhook.js`, ni el código `09 08 103` en `contacto.js`. El evento sigue vivo en Cal.com y hay pacientes de pareja con enlaces directos.

TAREA 5. Barrido de eventos huérfanos del calendario

LEE ESTO ENTERO ANTES DE ESCRIBIR UNA LÍNEA. Es lo más peligroso del ciclo: un error aquí borra sesiones reales de pacientes reales.

Dónde vive. NO en el sitio. Crea el archivo `apps-script/barrido-huerfanos.gs` en el repo. Es código de Google Apps Script, pensado para pegarse en el proyecto de la Planilla ("Planilla de horas agendadas"), que es el único que ya tiene a la vez acceso al calendario y un cliente de la API de Cal.com. Ese proyecto ya expone `obtenerLlaveCal_`, `pedirCal_` y `traerReservas_`: reúsalos, no escribas otro cliente.

Qué es un huérfano. Un evento del Google Calendar de Juan que Cal.com creó en su momento y que Cal.com ya no reconoce como reserva. Señal: el id del evento termina en `@Cal.com`.

Cómo se decide. NO uses el id como criterio de emparejamiento: el formato del uid de Cal.com no está garantizado y no se ha verificado que coincida con el prefijo del id del calendario. Empareja por hora de inicio exacta más correo del invitado. Un evento es huérfano si no existe ninguna reserva de Cal.com con ese mismo inicio y ese mismo correo.

Condiciones de aborto. Si se cumple cualquiera, el script no borra nada y lo dice:

* La llamada a la API de Cal.com falló, devolvió error, o devolvió cero reservas.
* El número de reservas traídas es menor que el número de eventos del calendario con id `@Cal.com` en la misma ventana. Eso significaría que la consulta a Cal.com vino incompleta, y en ese caso todo parecería huérfano.
* No se pudo leer el correo del invitado de algún evento candidato.

Qué queda excluido siempre, sin excepción:

* Cualquier evento en el pasado. Solo se mira de hoy hacia adelante.
* Eventos de día completo.
* Eventos cuyo id no termine en `@Cal.com`, o sea todo lo que Juan haya creado a mano.
* Eventos con la firma del Limitador en la descripción, `BLOQUEO-AUTOMATICO-v2`.

Dos funciones, y la de borrar nace apagada:

1. `listarHuerfanos()`. Solo lee. Escribe en el registro cuántas reservas trajo de Cal.com, cuántos eventos candidatos hay en el calendario, y la lista de los que considera huérfanos con fecha, hora, título y correo del invitado. Esta es la que se corre primero, siempre.
2. `borrarHuerfanos()`. Repite exactamente el mismo cálculo y borra. Arriba del archivo declara una constante `var CONFIRMO_BORRADO = false;`. Si está en `false`, la función escribe lo que borraría y termina sin tocar nada. Juan la pone en `true` a mano cuando haya revisado la lista.

Documenta en la cabecera del archivo, con el mismo tono de comentario que usan los otros archivos del repo: qué problema resuelve, el caso concreto del 11 de septiembre que lo motivó, por qué el emparejamiento es por hora más correo y no por id, y por qué la de borrar nace apagada.

Lo que NO puedes hacer, y tienes que decirlo en el reporte: no puedes ejecutar este archivo. Apps Script no corre en tu entorno. Verifica lo que sí puedes, que es que el archivo parsea como JavaScript válido, y declara explícitamente que la prueba real queda pendiente de correrse en el editor de Apps Script.

VERIFICACIÓN. Ejecuta en orden y pega la salida de cada comando.

1. `npm run build` Nunca `npx vite build`. Debe terminar con 7 páginas y la línea `ESTADO QUE SE COMPILA -> Ingreso Fonasa: cerrado | Modo del hero: particular`.
2. `node scripts/greps.mjs`: los 7 en cero.
3. El fallo que motiva el ciclo:

```
node -e "const h=require('http');h.createServer((q,r)=>{r.writeHead(200,{'content-type':'application/json'});r.end('{\"ingresoFonasaAbierto\":true,\"heroModo\":\"FONASA\"}')}).listen(8798)" &
PLANILLA_ESTADO_URL=http://127.0.0.1:8798 node scripts/estado-ingreso.mjs

```

Tiene que decir `ESTADO QUE SE COMPILA -> Ingreso Fonasa: ABIERTO | Modo del hero: particular`. Si dice `cerrado`, NO commitees. Después: `git checkout -- src/lib/estadoIngreso.js`, confirma con `git diff` que quedó vacío, mata el servidor.

4. Los otros tres caminos, cada uno con exactamente una línea `ESTADO QUE SE COMPILA`, código de salida 0 y sin tocar `estadoIngreso.js`: sin variable, puerto muerto, HTTP 500.
5. Conteos en modo particular sobre `dist/index.html`:

* `grep -c "se coordina por WhatsApp" dist/index.html` → 0
* `grep -c "Agenda abierta" dist/index.html` → 0
* `grep -c "pareja" dist/index.html` → 0
* `grep -c "09 08 103" dist/index.html` → 0
* `grep -o "por transferencia[^.]*\." dist/index.html | sort | uniq -c` → pega la salida; todas deben incluir WebPay

6. Conteos en modo fonasa. Servidor con `{"ingresoFonasaAbierto":false,"heroModo":"fonasa"}`, reconstruir, y confirmar que `Terapia de pareja con bono Fonasa`, `Sin cupos por ahora` y `5.570` son todos mayores que 0. Restaurar a `particular`, reconstruir, `git diff src/lib/estadoIngreso.js` vacío.
7. `node scripts/previsualizar-correos.mjs`: el correo de `primera-sesion` debe decir "por transferencia electrónica o WebPay".
8. `node app/scripts/sync-contenido.mjs` debe pasar la verificación de imports.
9. `node --check apps-script/barrido-huerfanos.gs` debe pasar sin errores. Es lo único que puedes verificar de la tarea 5.

AUDITORÍA HOSTIL
Reporta en formato `❌ [problema detectado] → [corrección aplicada] ✅`. Si el trabajo sobrevive intacto, dilo en una línea y no fabriques correcciones.

Revisa al menos:

* Que `src/lib/estadoIngreso.js` quede commiteado en `false` y `'particular'`.
* Que ninguna ruta de salida del script se quede sin imprimir el estado final.
* Que en modo fonasa la sección de precios quede idéntica a como estaba antes del ciclo.
* Que `CONFIRMO_BORRADO` quede en `false` en el commit. Este es el punto donde un descuido borra sesiones de pacientes.
* Que `borrarHuerfanos()` y `listarHuerfanos()` calculen el conjunto con exactamente el mismo código, no con dos copias que puedan divergir.
* Que las condiciones de aborto estén las tres, y que cada una corte antes de cualquier borrado.
* Que no hayas tocado nada nativo: no subas `runtimeVersion` en `app/app.json`.

COMMIT Y PUSH
Un solo commit en main:

```
C55: aviso del build honesto, pago unificado, pareja fuera del modo particular y barrido de huerfanos

```

Push a main. Después del deploy, confirma en producción que ya no aparece "se coordina por WhatsApp", ni "Agenda abierta", ni la tarjeta de pareja.

AL TERMINAR
Dile a Juan que la tarea 5 queda escrita pero sin probar, y que el siguiente paso es pegar `apps-script/barrido-huerfanos.gs` en el proyecto de la Planilla y correr `listarHuerfanos()`. No abras trabajo nuevo.

NOTA DE ARCHIVO (no es parte del prompt): el prompt original traia una raya
U+2014 en el punto 2 de VERIFICACION. La regla 1 de los 7 greps la prohibe en
todo el arbol, asi que ahi va dos puntos. Es el unico caracter que difiere del
prompt recibido.
