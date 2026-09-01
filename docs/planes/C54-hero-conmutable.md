Ciclo C54. Repo juanfernandezzz/sitiopsjuanfernandez, rama main, base e1ba61f. No hay ZIP: implementas tú.

Usa las skills `executing-plans`, `incremental-implementation`, `karpathy-guidelines`, `systematic-debugging` y `verification-before-completion`. Si alguna no está instalada, dilo y sigue igual con el criterio equivalente.

PASO 0
Clona el repo. Confirma que estás en `e1ba61f` y sin cambios locales. Si no, detente y dilo.
Guarda este prompt completo, tal cual, en `docs/planes/C54-hero-conmutable.md`. Es el plan versionado del ciclo.

CONTEXTO
Juan tiene un solo cupo de ingreso: domingo 14:00, particular, $25.000. El ingreso Fonasa está cerrado pero conserva pacientes activos. Va a correr dos campañas de Google Ads, nunca las dos a la vez: una particular y una Fonasa. El sitio tiene que poder cambiar de cara según cuál esté activa, desde una celda de una planilla, sin commit.

Ya existe la mitad de la maquinaria. C53b dejó `src/lib/estadoIngreso.js`, un archivo generado pero versionado que `scripts/estado-ingreso.mjs` sobrescribe en tiempo de build leyendo `PLANILLA_ESTADO_URL`. Este ciclo agrega un segundo interruptor por el mismo camino.

REGLA QUE MANDA SOBRE TODO LO DEMÁS
El valor versionado de `src/lib/estadoIngreso.js` es el comportamiento por defecto ante fallo de lectura, no un placeholder. Tiene que quedar commiteado con `INGRESO_FONASA_ABIERTO_PLANILLA = false` y `HERO_MODO_PLANILLA = 'particular'`. Nunca se commitea otro valor. Si al final del trabajo el archivo dice otra cosa, no commitees.

---

TAREA 1. Segundo interruptor: modo del hero

En `src/lib/estadoIngreso.js` agrega, con el mismo tono de comentario que ya tiene el archivo:

    export const HERO_MODO_PLANILLA = 'particular';

Valores admitidos: `'particular'` y `'fonasa'`. Nada más.

En `scripts/estado-ingreso.mjs`: hoy lee `datos.ingresoFonasaAbierto` y valida que sea booleano. Agrega la lectura de `datos.heroModo`, validando que sea exactamente una de las dos cadenas. Misma dirección de fallo que ya está documentada en el archivo: si falta, si no es válida o si la lectura falla, NO escribe y queda el valor versionado. El script sigue saliendo con código 0 pase lo que pase.

En `src/lib/modalidades.js` exporta `HERO_MODO` re-exportando desde `estadoIngreso.js`, igual que se hizo con `INGRESO_FONASA_ABIERTO`. Actualiza el comentario de cabecera: ahora son dos interruptores independientes, y la hoja de la Planilla se llama **Sitio web**, no Configuración.

Los dos interruptores son independientes a propósito. `heroModo: 'fonasa'` con `ingresoFonasaAbierto: false` es un estado válido y es exactamente como estaba el sitio antes de C52: el hero habla de Fonasa y la tarjeta dice que no hay cupos.

---

TAREA 2. Línea de pago bajo el CTA

En `src/lib/hero.js`, el campo `microcopia` hoy dice que se paga después de la sesión por transferencia. Falta WebPay.

Texto exacto, sin cambiar una palabra:

    Pagas por transferencia o WebPay, después de la sesión

Va bajo el CTA primario. Mantén el precio visible como está hoy. No uses raya ni semirraya.

---

TAREA 3. Hero conmutable

`src/lib/hero.js` pasa a exportar dos variantes y a resolver cuál según `HERO_MODO`. La forma la eliges tú; el requisito es que ningún componente tenga que saber qué modo está activo. `Hero.jsx` sigue consumiendo un solo objeto.

**Modo `particular`** (el que va a estar activo):
- Oculta la tarjeta de precio Fonasa con el copago $5.570
- Oculta los códigos de prestación MLE
- Oculta el bloque "¿Eres Fonasa?" y su enlace, que hoy es `HERO.enlaceSecundario` y tiene el ancla rota
- Mantiene "plataforma certificada por Fonasa". La plataforma es la misma para todos y la certificación es señal de confianza, no una oferta
- Mantiene el precio particular y la línea de pago de la tarea 2

**Modo `fonasa`**:
- Vuelve el orden anterior a C52: Fonasa primero, particular después
- La tarjeta Fonasa aparece, y muestra "sin cupos" mientras `INGRESO_FONASA_ABIERTO` sea false

**En los dos modos**: terapia de pareja se muestra con la etiqueta **"sin cupos"**. Ese es el texto literal de Juan y no se cambia por "no ofrezco" ni por ninguna otra fórmula.

DECISIÓN PENDIENTE, NO LA TOMES SOLA: `HERO.chips` incluye hoy `'Inscrito en Fonasa'`. En modo particular puede hacer que alguien crea que puede usar su bono. Deja el chip como está, y al terminar pregúntale a Juan si lo quiere distinto en modo particular. No inventes un reemplazo.

---

TAREA 4. Guía del bono a página de apoyo

La guía de los 7 pasos del Bono Web sale del recorrido principal y pasa a página propia. Enlazada desde el pie del sitio, en los dos modos, y alcanzable siempre. Los pacientes Fonasa activos la usan.

Súmala a `scripts/prerender.mjs`, que hoy prerenderiza 6 páginas y pasará a 7.

Al mover el bloque desaparece el destino del ancla rota de la tarea 3. Confirma que no quede ningún enlace apuntando a un ancla que ya no existe.

---

TAREA 5. Publicar el cupo real

El sitio no dice cuándo hay hora. La persona lo descubre recién en Cal.com. El dato verificado hoy en la página pública de reserva: **domingos, 14:00, un cupo por semana**.

No lo escribas a mano en el copy. Ya existe `ModuloDisponibilidad`, que lee la disponibilidad real de Cal.com y se usa en tres variantes. Haz que el sitio comunique la próxima hora concreta usando esa fuente. Si hoy ya lo hace, di dónde y no dupliques.

Requisito: si Cal.com no responde, el sitio no puede quedar afirmando un horario inventado ni mostrando un hueco roto. Degrada a lo que se muestra hoy.

---

VERIFICACIÓN. Ejecuta en orden y pega la salida de cada comando.

1. `npm run build`
   Nunca `npx vite build`: ese no prerenderiza y todo lo que sigue deja de servir.
   Debe imprimir el aviso enmarcado de que falta `PLANILLA_ESTADO_URL`, y terminar con 7 páginas.

2. `node scripts/greps.mjs`
   Los 7 en cero. Si alguno no lo está, detente.

3. Conteos sobre `dist/index.html`, no sobre los componentes:
   - `grep -c "5.570" dist/index.html` debe dar 0
   - `grep -c "09 08 10" dist/index.html` debe dar 0
   - `grep -c "sin cupos" dist/index.html` debe ser mayor que 0
   - `grep -c "transferencia o WebPay" dist/index.html` debe dar al menos 1
   - `grep -c "certificada por Fonasa" dist/index.html` debe ser mayor que 0

4. Prueba del interruptor del hero. Levanta un servidor falso y reconstruye:
   `node -e "const h=require('http');h.createServer((q,r)=>{r.writeHead(200,{'content-type':'application/json'});r.end('{\"ingresoFonasaAbierto\":false,\"heroModo\":\"fonasa\"}')}).listen(8799)" &`
   `PLANILLA_ESTADO_URL=http://127.0.0.1:8799 npm run build`
   Ahora `grep -c "5.570" dist/index.html` debe ser mayor que 0: el hero cambió de cara en el HTML prerenderizado, sin JavaScript en el navegador.
   Restaura, reconstruye, mata el servidor, y confirma con `git diff src/lib/estadoIngreso.js` que quedó vacío.

5. Prueba de los modos de fallo. Con la variable apuntando a un puerto muerto y con una respuesta que traiga `heroModo` inválido, el script debe avisar, salir con código 0 y dejar `estadoIngreso.js` sin tocar. Prueba los dos casos.

6. `node app/scripts/sync-contenido.mjs`
   Debe pasar la verificación de imports que agregó C53b. Si `hero.js` o `modalidades.js` empiezan a importar un hermano nuevo, agrégalo a la lista de ese script.

AUDITORÍA HOSTIL
Antes de commitear, reporta en formato `❌ [problema detectado] → [corrección aplicada] ✅`. Si el trabajo sobrevive intacto, dilo en una línea y no fabriques correcciones.

Revisa al menos:
- Que `estadoIngreso.js` quede commiteado en `false` y `'particular'`. Este es el punto donde un descuido hace daño real: cualquier otro valor invierte la dirección del fallo.
- Que no exista ninguna superficie donde el modo se decida en el navegador. Todo tiene que estar resuelto en el HTML prerenderizado.
- Que ningún enlace apunte a un ancla que dejó de existir.
- Que no se haya tocado nada nativo: no subas `runtimeVersion` en `app/app.json`.
- Que no hayas escrito "no ofrezco" en ninguna parte. El texto es "sin cupos".

COMMIT Y PUSH
Un solo commit en main:

    C54: hero conmutable desde la Planilla y guia del bono a pagina propia

Push a main. Después del deploy, verifica que el sitio en producción sigue en modo particular y que la página de la guía del bono responde. Reporta las dos cosas.

AL TERMINAR
Pregúntale a Juan lo del chip 'Inscrito en Fonasa'. Nada más. No abras trabajo nuevo.
