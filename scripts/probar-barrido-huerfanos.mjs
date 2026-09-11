/*
 * Banco de pruebas de apps-script/barrido-huerfanos.gs.
 *
 * POR QUE EXISTE
 * El barrido borra eventos del calendario de Juan: un falso positivo borra la
 * sesion de un paciente real. Apps Script no corre fuera de Google, asi que la
 * unica forma de probarlo antes de pegarlo es cargar dobles de CalendarApp,
 * Logger, Utilities y traerReservas_, y ejecutar el archivo TAL CUAL esta en el
 * repo dentro de un contexto de vm. No se copia ni se adapta el codigo: se
 * ejecuta el mismo archivo que Juan va a pegar.
 *
 * POR QUE ESTA VERSIONADO (C56)
 * En C55 el banco vivio fuera del repo y eso costo un defecto. Sus fixtures
 * traian reservas de Cal.com sin evento de calendario detras, cosa que en el
 * calendario real casi no pasa: toda reserva viva tiene su evento. Ese exceso
 * de reservas inflaba el conteo y tapaba la condicion de aborto rota, que
 * abortaba justo cuando habia huerfanos. Las 11 pruebas pasaban en verde sobre
 * un archivo que no podia encontrar nada. Un banco fuera del repo es un banco
 * que el siguiente ciclo no revisa.
 *
 * LA REGLA DE ORO DE LAS FIXTURES
 * Toda reserva viva tiene su evento de calendario, y los huerfanos son eventos
 * de MAS, nunca reservas de MENOS. Las reservas se derivan de la hora del
 * evento (new Date(inicio).toISOString()), no se escriben a mano: en C55 se
 * escribieron a mano con una hora de desfase y los 11 casos dieron rojo por un
 * error del banco, no del codigo.
 *
 * LO QUE UN DOBLE FLOJO TAPO (C57)
 * El doble de traerReservas_ ignoraba sus argumentos y devolvia las reservas
 * fuera cual fuera la llamada. Con eso, el barrido llamaba a traerReservas_ con
 * dos fechas cuando la firma real es traerReservas_(estado, extras), la consulta
 * a Cal.com salia malformada, y las 14 pruebas pasaban en verde igual. Ahora el
 * doble verifica la firma y revienta la corrida si no cuadra. Un doble que
 * acepta cualquier cosa no prueba nada.
 *
 * USO
 *   node scripts/probar-barrido-huerfanos.mjs
 *   node scripts/probar-barrido-huerfanos.mjs --caso-regresion
 *   node scripts/probar-barrido-huerfanos.mjs --caso-firma
 *   node scripts/probar-barrido-huerfanos.mjs --fuente <ruta al .gs>
 *
 * --caso-regresion corre solo el caso que motiva C56 (un huerfano, cada reserva
 * viva con su evento) y escupe el registro entero. Con --fuente apuntando a la
 * version anterior del archivo se ve el defecto en vivo.
 *
 * --caso-firma corre sola la prueba que fija la firma de traerReservas_ (C57).
 * Va aparte por el mismo motivo: contra la version anterior del .gs el doble
 * revienta en la primera prueba y el banco entero se cae antes de llegar a ella.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const iFuente = argv.indexOf('--fuente');
const FUENTE_RUTA =
  iFuente !== -1 ? argv[iFuente + 1] : resolve(RAIZ, 'apps-script', 'barrido-huerfanos.gs');
const SOLO_REGRESION = argv.indexOf('--caso-regresion') !== -1;
const SOLO_FIRMA = argv.indexOf('--caso-firma') !== -1;

const FUENTE = readFileSync(FUENTE_RUTA, 'utf8');

// Momento congelado: el dia en que aparecieron los dos huerfanos reales.
const HOY = new Date('2026-09-11T10:00:00-04:00');

// --------------------------------------------------------------------------
// Dobles
// --------------------------------------------------------------------------

function ev({ inicio, id, titulo, correos = [], todoElDia = false, desc = '' }) {
  const borrado = { valor: false };
  return {
    _borrado: borrado,
    isAllDayEvent: () => todoElDia,
    getStartTime: () => new Date(inicio),
    getEndTime: () => new Date(new Date(inicio).getTime() + 45 * 60000),
    getId: () => id,
    getTitle: () => titulo,
    getDescription: () => desc,
    getGuestList: () => correos.map((c) => ({ getEmail: () => c })),
    deleteEvent: () => {
      borrado.valor = true;
    },
  };
}

// La reserva SIEMPRE se deriva de la hora del evento. Ver la regla de oro.
function reservaDe(inicio, correo, estado) {
  return {
    startTime: new Date(inicio).toISOString(),
    attendees: [{ email: correo }],
    status: estado || 'accepted',
  };
}

/*
 * Una hora agendada normal: evento en el calendario Y su reserva viva en
 * Cal.com. Es el par que en C55 faltaba y que hacia pasar las pruebas por el
 * motivo equivocado.
 */
function parNormal(inicio, correo, titulo) {
  return { evento: ev({ inicio, id: correo + '@Cal.com', titulo, correos: [correo] }), reserva: reservaDe(inicio, correo) };
}

// Un evento de Cal.com sin reserva detras. Esto y solo esto es un huerfano.
function huerfano(inicio, correo, titulo) {
  return ev({ inicio, id: 'h-' + correo + '@Cal.com', titulo, correos: [correo] });
}

// Horas correlativas dentro de la ventana, una por hora desde el dia siguiente.
const PRIMERA = Date.parse('2026-09-12T09:00:00-04:00');
const horaN = (i) => new Date(PRIMERA + i * 3600 * 1000).toISOString();

/*
 * LA FIRMA QUE EL DOBLE FIJA (C57)
 * En el proyecto de la Planilla la firma real es traerReservas_(estado, extras)
 * y las dos unicas llamadas que existen son traerReservas_('upcoming', {}) y
 * traerReservas_('past', { afterStart: hace180 }). El barrido tiene que llamarla
 * con ('upcoming', {}).
 *
 * Se exige objeto LLANO en el segundo argumento a proposito. Un Date cumple
 * typeof x === 'object', y un Date en ese lugar es exactamente el error que hay
 * que atrapar: un doble que lo dejara pasar volveria a tapar el mismo defecto.
 */
function esObjetoLlano(x) {
  return Object.prototype.toString.call(x) === '[object Object]';
}

function describirArg(x) {
  if (typeof x === 'string') return "'" + x + "'";
  if (Object.prototype.toString.call(x) === '[object Date]') return 'Date(' + x.toISOString() + ')';
  if (esObjetoLlano(x)) return JSON.stringify(x);
  return String(x);
}

function correr({
  eventos,
  reservas,
  confirmo = false,
  sinCliente = false,
  explota = false,
  funcion = 'borrarHuerfanos',
}) {
  const registro = [];
  const llamadas = [];
  let firmaMala = '';
  const ctx = {
    Date: class extends Date {
      constructor(...a) {
        if (a.length === 0) super(HOY.getTime());
        else super(...a);
      }
      static now() {
        return HOY.getTime();
      }
    },
    isNaN,
    Object,
    Math,
    String,
    Number,
    Logger: { log: (m) => registro.push(String(m)) },
    Utilities: {
      formatDate: (d) => new Date(d).toISOString().slice(0, 16).replace('T', ' '),
    },
    CalendarApp: {
      getCalendarById: () => ({
        getTimeZone: () => 'America/Santiago',
        getEvents: (desde, hasta) =>
          eventos.filter((e) => {
            const t = e.getStartTime().getTime();
            return t >= desde.getTime() - 45 * 60000 && t <= hasta.getTime();
          }),
      }),
    },
  };
  if (!sinCliente) {
    ctx.traerReservas_ = (estado, extras) => {
      llamadas.push([estado, extras]);
      if (estado !== 'upcoming' || !esObjetoLlano(extras)) {
        firmaMala =
          'se la llamo con traerReservas_(' +
          [estado, extras].map(describirArg).join(', ') +
          "), y su firma es traerReservas_(estado, extras): aca va ('upcoming', {}).";
        // Se lanza para que el barrido no siga con una consulta malformada, y
        // ademas queda anotado afuera: el try del barrido se tragaria esta
        // excepcion y la contaria como aborto 1, que seria un verde falso.
        throw new Error('FIRMA EQUIVOCADA de traerReservas_');
      }
      if (explota) throw new Error('403 de Cal.com');
      return { bookings: reservas };
    };
  }
  vm.createContext(ctx);
  vm.runInContext(FUENTE + '\nCONFIRMO_BORRADO = ' + confirmo + ';', ctx);
  vm.runInContext(funcion + '();', ctx);
  if (firmaMala) {
    const err = new Error('FIRMA EQUIVOCADA: ' + firmaMala);
    err.llamadas = llamadas;
    throw err;
  }
  return { registro, texto: registro.join('\n'), llamadas };
}

/*
 * Corre el barrido y devuelve como se llamo a traerReservas_, aunque el doble
 * haya matado la corrida por firma equivocada. Es lo que deja correr la prueba
 * de firma contra la version vieja del .gs, donde el doble revienta a proposito.
 */
function llamadasATraerReservas(opciones) {
  try {
    return correr(opciones).llamadas;
  } catch (e) {
    if (e && e.llamadas) return e.llamadas;
    throw e;
  }
}

// --------------------------------------------------------------------------
// Escenarios
// --------------------------------------------------------------------------

const REAL = 'paciente@correo.cl';
const OTRA = 'otra.paciente@correo.cl';

const H15 = '2026-09-15T12:00:00-04:00';
const H22 = '2026-09-22T12:00:00-04:00';
const REAL13 = '2026-09-15T13:00:00-04:00';
const OTRA12 = '2026-09-15T12:00:00-04:00';

/*
 * El caso del 11 de septiembre, sobre un calendario con el volumen que tiene el
 * de Juan: ocho horas agendadas normales mas las dos de verdad del caso, y los
 * dos huerfanos encima. 12 candidatos y 2 huerfanos, o sea un 17 por ciento,
 * por debajo del umbral: el borrado procede. Con los 4 eventos pelados de C55
 * los mismos 2 huerfanos eran el 50 por ciento y el umbral los frenaria, que es
 * correcto pero no es el caso que Juan tiene delante.
 */
function escenario11Sep() {
  const pares = [];
  for (var i = 0; i < 8; i++) pares.push(parNormal(horaN(i), 'paciente' + i + '@correo.cl', 'Sesion normal ' + i));
  // Las dos horas reales del caso: existen en el calendario Y en Cal.com.
  pares.push(parNormal(REAL13, REAL, 'REAL 13:00'));
  pares.push(parNormal(OTRA12, OTRA, 'OTRA 12:00'));

  const eventos = [
    huerfano(H15, REAL, 'HUERFANO 15'),
    huerfano(H22, REAL, 'HUERFANO 22'),
    ...pares.map((p) => p.evento),
    // Hora fija creada a mano por Juan: sin @Cal.com, intocable.
    ev({ inicio: '2026-09-16T10:00:00-04:00', id: 'manual@google.com', titulo: 'Hora fija', correos: [] }),
    // Bloqueo del Limitador de Agenda.
    ev({
      inicio: '2026-09-17T00:00:00-04:00',
      id: 'blk@Cal.com',
      titulo: 'Agenda completa',
      desc: 'BLOQUEO-AUTOMATICO-v2\nNo editar',
    }),
    // Evento de dia completo.
    ev({ inicio: '2026-09-18T00:00:00-04:00', id: 'dia@Cal.com', titulo: 'Vacaciones', todoElDia: true }),
    // Pasado: fuera de la ventana por definicion.
    ev({ inicio: '2026-09-01T12:00:00-04:00', id: 'viejo@Cal.com', titulo: 'Sesion vieja', correos: [REAL] }),
  ];
  return { eventos, reservas: pares.map((p) => p.reserva) };
}

/*
 * N candidatos de los cuales cuantos sean huerfanos. Todo lo que no es huerfano
 * viene con su reserva viva, como en el calendario real.
 */
function escenario(candidatos, cuantosHuerfanos) {
  const eventos = [];
  const reservas = [];
  for (var i = 0; i < candidatos; i++) {
    const inicio = horaN(i);
    const correo = 'paciente' + i + '@correo.cl';
    if (i < cuantosHuerfanos) {
      eventos.push(huerfano(inicio, correo, 'HUERFANO ' + i));
    } else {
      const p = parNormal(inicio, correo, 'Sesion ' + i);
      eventos.push(p.evento);
      reservas.push(p.reserva);
    }
  }
  return { eventos, reservas };
}

// --------------------------------------------------------------------------
// El caso que motiva C56, aislado para poder correrlo contra las dos versiones
// --------------------------------------------------------------------------

function casoRegresion() {
  // Cuatro candidatos, tres con su reserva viva, uno huerfano. Ni una sola
  // reserva sobrante: es el calendario real. Con la version de C55 esto aborta.
  return escenario(4, 1);
}

if (SOLO_REGRESION) {
  const { eventos, reservas } = casoRegresion();
  console.log('Fuente: ' + FUENTE_RUTA);
  console.log('Caso: 4 candidatos, 3 con reserva viva, 1 huerfano. Ninguna reserva sin evento.\n');
  const { texto } = correr({ eventos, reservas, confirmo: false });
  console.log(texto);
  const detectado = /Huerfanos: 1\./.test(texto);
  console.log('\n=> ' + (detectado ? 'DETECTA el huerfano' : 'NO detecta el huerfano'));
  process.exit(0);
}

// --------------------------------------------------------------------------
// Pruebas
// --------------------------------------------------------------------------

let fallos = 0;
function afirmar(nombre, condicion, extra) {
  if (condicion) {
    console.log('  ok   ' + nombre);
  } else {
    fallos++;
    console.log('  FALLA ' + nombre);
    if (extra) console.log(extra);
  }
}

/*
 * LA PRUEBA QUE FIJA LA FIRMA (C57). Vive en una funcion, y no suelta como las
 * demas, porque tiene que poder correrse sola contra las dos versiones del .gs:
 * contra 744ce72 el doble revienta ya en la prueba 1 y el banco entero se cae
 * antes de llegar hasta aca. Con --caso-firma corre solo esto.
 */
function pruebaFirmaC57() {
  console.log("\n== 15. NUEVA C57. El barrido llama a traerReservas_ con ('upcoming', {}) ==");
  const { eventos, reservas } = escenario(6, 1);
  const llamadas = llamadasATraerReservas({ eventos, reservas, confirmo: false });
  const primera = llamadas[0] || [];
  const comoSeLlamo = 'traerReservas_(' + primera.map(describirArg).join(', ') + ')';
  console.log('  llamada real: ' + comoSeLlamo);
  afirmar(
    'llama a traerReservas_ una sola vez: no pagina desde aca',
    llamadas.length === 1,
    '  llamadas: ' + llamadas.length
  );
  afirmar(
    "el primer argumento es el estado 'upcoming', no una fecha",
    primera[0] === 'upcoming',
    '  fue: ' + comoSeLlamo
  );
  afirmar(
    'el segundo argumento es un objeto de opciones, no una fecha',
    esObjetoLlano(primera[1]),
    '  fue: ' + comoSeLlamo
  );
  afirmar(
    'el objeto de opciones va vacio',
    esObjetoLlano(primera[1]) && Object.keys(primera[1]).length === 0,
    '  fue: ' + comoSeLlamo
  );
}

if (SOLO_FIRMA) {
  console.log('Fuente: ' + FUENTE_RUTA);
  pruebaFirmaC57();
  console.log(fallos === 0 ? '\nLA FIRMA ES LA CORRECTA\n' : `\n${fallos} AFIRMACIONES DE FIRMA FALLAN\n`);
  process.exit(fallos === 0 ? 0 : 1);
}

console.log('\n== 1. Caso del 11 de septiembre: detecta los dos huerfanos, en ensayo no borra ==');
{
  const { eventos, reservas } = escenario11Sep();
  const { texto } = correr({ eventos, reservas, confirmo: false });
  afirmar('dice Huerfanos: 2', /Huerfanos: 2\./.test(texto), texto);
  afirmar('lista los dos huerfanos', /HUERFANO 15/.test(texto) && /HUERFANO 22/.test(texto), texto);
  afirmar('no lista las dos horas reales', !/REAL 13:00/.test(texto) && !/OTRA 12:00/.test(texto), texto);
  afirmar('no avisa de umbral', !/UMBRAL/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor), texto);
  afirmar('explica que es ENSAYO', /ENSAYO/.test(texto), texto);
  console.log(texto.split('\n').filter((l) => /Reservas|candidatos|Huerfanos|ENSAYO|\|/.test(l)).join('\n'));
}

console.log('\n== 2. Mismo caso con CONFIRMO_BORRADO en true: borra solo los dos ==');
{
  const { eventos, reservas } = escenario11Sep();
  const { texto } = correr({ eventos, reservas, confirmo: true });
  const borrados = eventos.filter((e) => e._borrado.valor);
  afirmar('borra exactamente 2', borrados.length === 2, texto);
  afirmar(
    'borra exactamente los dos huerfanos',
    borrados.map((e) => e.getTitle()).sort().join(',') === 'HUERFANO 15,HUERFANO 22',
    texto
  );
  const porTitulo = (t) => eventos.find((e) => e.getTitle() === t);
  afirmar('NO borra la hora real de 13:00', !porTitulo('REAL 13:00')._borrado.valor);
  afirmar('NO borra la de la otra paciente', !porTitulo('OTRA 12:00')._borrado.valor);
  afirmar('NO borra la hora fija manual', !porTitulo('Hora fija')._borrado.valor);
  afirmar('NO borra el bloqueo del Limitador', !porTitulo('Agenda completa')._borrado.valor);
  afirmar('NO borra el evento de dia completo', !porTitulo('Vacaciones')._borrado.valor);
  afirmar('NO borra el evento pasado', !porTitulo('Sesion vieja')._borrado.valor);
  afirmar('NO borra ninguna sesion normal', eventos.every((e) => !/^Sesion normal/.test(e.getTitle()) || !e._borrado.valor));
}

console.log('\n== 3. Aborto 1a: la llamada a Cal.com explota ==');
{
  const { eventos } = escenario11Sep();
  const { texto } = correr({ eventos, reservas: [], confirmo: true, explota: true });
  afirmar('aborta', /ABORTA: la llamada a Cal\.com fallo/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 4. Aborto 1b: Cal.com devuelve cero reservas ==');
{
  const { eventos } = escenario11Sep();
  const { texto } = correr({ eventos, reservas: [], confirmo: true });
  afirmar('aborta', /ABORTA: Cal\.com no devolvio ninguna reserva viva/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 5. Aborto 3: un evento candidato sin correo de invitado ==');
{
  const { eventos, reservas } = escenario11Sep();
  eventos.push(ev({ inicio: '2026-09-19T11:00:00-04:00', id: 'sin@Cal.com', titulo: 'Sesion sin invitado', correos: [] }));
  const { texto } = correr({ eventos, reservas, confirmo: true });
  afirmar('aborta', /ABORTA: no se pudo leer el correo del invitado/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 6. Una reserva cancelada no salva a su evento ==');
{
  // Sobre un calendario con volumen real. Con solo dos eventos, un huerfano es
  // la mitad del calendario y el umbral bloquea el borrado con toda la razon:
  // la prueba mediria el umbral en vez de lo que quiere medir.
  const base = escenario(10, 0);
  const eventos = [
    ev({ inicio: H15, id: 'aaa@Cal.com', titulo: 'Cancelada', correos: [REAL] }),
    ev({ inicio: REAL13, id: 'ccc@Cal.com', titulo: 'Viva', correos: [REAL] }),
    ...base.eventos,
  ];
  const reservas = [reservaDe(H15, REAL, 'cancelled'), reservaDe(REAL13, REAL), ...base.reservas];
  const { texto } = correr({ eventos, reservas, confirmo: true });
  afirmar('detecta solo uno', /Huerfanos: 1./.test(texto), texto);
  afirmar('borra el de la reserva cancelada', eventos[0]._borrado.valor, texto);
  afirmar('NO borra el de la reserva viva', !eventos[1]._borrado.valor, texto);
  afirmar('NO borra ninguna sesion normal', base.eventos.every((e) => !e._borrado.valor), texto);
}

console.log('\n== 7. Sin el cliente de la Planilla, aborta y lo explica ==');
{
  const { eventos, reservas } = escenario11Sep();
  const { texto } = correr({ eventos, reservas, confirmo: true, sinCliente: true });
  afirmar('aborta', /ABORTA: no existe traerReservas_/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 8. Calendario limpio: cero huerfanos, sin aviso de umbral, sin borrado ==');
{
  const { eventos, reservas } = escenario(12, 0);
  const { texto } = correr({ eventos, reservas, confirmo: true });
  afirmar('dice que no hay huerfanos', /Huerfanos: ninguno/.test(texto), texto);
  afirmar('no avisa de umbral', !/UMBRAL/.test(texto), texto);
  afirmar('no dice que borro nada', !/BORRADO:/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 9. listarHuerfanos() nunca borra, ni con CONFIRMO_BORRADO en true ==');
{
  const { eventos, reservas } = escenario11Sep();
  const { texto } = correr({ eventos, reservas, confirmo: true, funcion: 'listarHuerfanos' });
  afirmar('lista los huerfanos', /Huerfanos: 2\./.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor), texto);
  afirmar('no dice BORRADO', !/BORRADO:/.test(texto), texto);
}

console.log('\n== 10. Segundos distintos entre Cal.com y Google no crean huerfanos ==');
{
  const eventos = [ev({ inicio: REAL13, id: 'ccc@Cal.com', titulo: 'Viva', correos: [REAL] })];
  const reservas = [
    { startTime: '2026-09-15T17:00:37.512Z', attendees: [{ email: REAL }], status: 'accepted' },
  ];
  const { texto } = correr({ eventos, reservas, confirmo: true });
  afirmar('empareja igual', /Huerfanos: ninguno/.test(texto), texto);
  afirmar('no borro nada', eventos.every((e) => !e._borrado.valor));
}

console.log('\n== 11. NUEVA. Un huerfano de 20 candidatos: bajo umbral, se borra ==');
{
  // Dos juegos separados: uno para el ensayo y otro para el borrado. Compartir
  // la lista de reservas entre dos juegos de eventos distintos funciona porque
  // escenario() es determinista, pero se lee como un error.
  const ensayoFix = escenario(20, 1);
  const { texto: ensayo } = correr({ eventos: ensayoFix.eventos, reservas: ensayoFix.reservas, confirmo: false });
  afirmar('lo lista', /Huerfanos: 1\./.test(ensayo), ensayo);
  afirmar('no avisa de umbral', !/UMBRAL/.test(ensayo), ensayo);

  const borradoFix = escenario(20, 1);
  const { texto } = correr({ eventos: borradoFix.eventos, reservas: borradoFix.reservas, confirmo: true });
  const borrados = borradoFix.eventos.filter((e) => e._borrado.valor);
  afirmar('borra exactamente 1', borrados.length === 1, texto);
  afirmar('borra el huerfano', borrados[0] && borrados[0].getTitle() === 'HUERFANO 0', texto);
}

console.log('\n== 12. NUEVA. Pagina faltante: 15 huerfanos de 20 candidatos ==');
{
  const listado = escenario(20, 15);
  const { texto: txtListar } = correr({
    eventos: listado.eventos,
    reservas: listado.reservas,
    confirmo: true,
    funcion: 'listarHuerfanos',
  });
  afirmar('listarHuerfanos avisa del umbral', /UMBRAL/.test(txtListar), txtListar);
  afirmar('listarHuerfanos IGUAL lista los 15', /Huerfanos: 15\./.test(txtListar), txtListar);
  afirmar('listarHuerfanos no borro nada', listado.eventos.every((e) => !e._borrado.valor));

  const borrado = escenario(20, 15);
  const { texto } = correr({ eventos: borrado.eventos, reservas: borrado.reservas, confirmo: true });
  afirmar('borrarHuerfanos avisa del umbral', /UMBRAL/.test(texto), texto);
  afirmar('borrarHuerfanos NO borra nada con CONFIRMO en true', borrado.eventos.every((e) => !e._borrado.valor), texto);
  afirmar('no dice BORRADO', !/BORRADO:/.test(texto), texto);
  console.log(texto.split('\n').filter((l) => /UMBRAL|Huerfanos: /.test(l)).join('\n'));
}

console.log('\n== 13. NUEVA. Seis huerfanos de 100: pasa el tope absoluto aunque no la proporcion ==');
{
  const { eventos, reservas } = escenario(100, 6);
  const { texto } = correr({ eventos, reservas, confirmo: true });
  afirmar('6 sobre 100 no llega a la cuarta parte', 6 <= 0.25 * 100);
  afirmar('avisa del umbral igual', /UMBRAL/.test(texto), texto);
  afirmar('NO borra nada con CONFIRMO en true', eventos.every((e) => !e._borrado.valor), texto);
  afirmar('igual los lista', /Huerfanos: 6\./.test(texto), texto);
}

console.log('\n== 14. REGRESION C56. Un huerfano con cada reserva viva en su evento ==');
{
  const { eventos, reservas } = casoRegresion();
  const { texto } = correr({ eventos, reservas, confirmo: false });
  afirmar('NO aborta por conteos', !/ABORTA/.test(texto), texto);
  afirmar('detecta el unico huerfano', /Huerfanos: 1\./.test(texto), texto);
  afirmar('no avisa de umbral (1 de 4 no lo supera)', !/UMBRAL/.test(texto), texto);
  afirmar('no borro nada (ensayo)', eventos.every((e) => !e._borrado.valor));
}

pruebaFirmaC57();

console.log(fallos === 0 ? '\nTODAS LAS PRUEBAS PASAN\n' : `\n${fallos} PRUEBAS FALLAN\n`);
process.exit(fallos === 0 ? 0 : 1);
