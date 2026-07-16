import { LEGAL, CONTACTO, PRESTADOR, URLS_EXTERNAS } from '../lib/contacto';

/**
 * Politica de Privacidad - documento legal.
 *
 * El texto es cita textual del bloque canonico definido en C9.
 * No parafrasear sin permiso explicito de Juan.
 *
 * Enmienda C27 (medicion de Google Ads): la nota de la seccion 2 y la
 * seccion 9 se actualizaron al instalar la etiqueta de Google.
 *
 * Enmienda C37 (auditoria contra el texto oficial de la Ley 21.719, Diario
 * Oficial 13-dic-2024): version explicita (art. 14 ter a), universo de
 * titulares y base de licitud de la medicion (14 ter d, arts. 12 y 13),
 * derecho de bloqueo (arts. 4 y 8 ter), plazos y gratuidad (arts. 10 y 11),
 * via de reclamo ante la Agencia (14 ter g, art. 41), transferencias
 * internacionales en los terminos del art. 27, declaracion de no
 * perfilamiento (14 ter l) y alta de Umami como encargado de medicion.
 * Wording aprobado por Juan en C37.
 */

const STYLES = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: 'clamp(48px, 6vw, 64px) clamp(24px, 4vw, 32px)',
  },
  h1: {
    fontSize: 'clamp(32px, 5vw, 44px)',
    letterSpacing: '-0.015em',
    fontVariationSettings: '"opsz" 144, "SOFT" 50',
    fontWeight: 500,
    color: '#2A3B4C',
    margin: '0 0 8px',
    lineHeight: 1.1,
  },
  fecha: {
    fontSize: 14,
    color: 'rgba(42, 59, 76, 0.55)',
    margin: '0 0 32px',
  },
  intro: {
    fontSize: 16,
    lineHeight: 1.65,
    color: 'rgba(42, 59, 76, 0.85)',
    margin: '0 0 40px',
  },
  h2: {
    fontSize: 22,
    letterSpacing: '-0.01em',
    fontWeight: 500,
    color: '#2A3B4C',
    margin: '40px 0 16px',
    fontVariationSettings: '"opsz" 144, "SOFT" 50',
    lineHeight: 1.2,
  },
  p: {
    fontSize: 15,
    lineHeight: 1.65,
    color: 'rgba(42, 59, 76, 0.85)',
    margin: '0 0 16px',
  },
  subhead: {
    fontSize: 15,
    lineHeight: 1.65,
    color: '#2A3B4C',
    margin: '16px 0 8px',
    fontWeight: 600,
  },
  ul: {
    fontSize: 15,
    lineHeight: 1.65,
    color: 'rgba(42, 59, 76, 0.85)',
    paddingLeft: 20,
    margin: '0 0 16px',
  },
  li: {
    marginBottom: 6,
  },
};

const linkStyle = {
  color: '#3F5B4A',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(63, 91, 74, 0.3)',
  textUnderlineOffset: 2,
};

export default function PoliticaPrivacidad() {
  return (
    <article className="font-body" style={STYLES.container}>
      <h1 className="font-display" style={STYLES.h1}>
        Política de Privacidad
      </h1>
      <p style={STYLES.fecha}>
        Última actualización: {LEGAL.ultimaActualizacionPolitica} (versión{' '}
        {LEGAL.versionPolitica})
      </p>

      <p style={STYLES.intro}>
        Esta política describe cómo {PRESTADOR.nombre}, {PRESTADOR.titulo},
        recopila y trata tus datos personales cuando agendas, contratas o usas
        su sitio web psicologojuanfernandez.cl. La redacté en lenguaje claro,
        sin perder precisión legal. Si algo no queda claro, escríbeme a{' '}
        <a href={`mailto:${CONTACTO.email}`} style={linkStyle}>
          {CONTACTO.email}
        </a>
        .
      </p>

      {/* 1 */}
      <h2 className="font-display" style={STYLES.h2}>
        1. Responsable del tratamiento
      </h2>
      <p style={STYLES.p}>
        {PRESTADOR.nombre}, {PRESTADOR.titulo}, RUT {PRESTADOR.rut}, con
        domicilio en {PRESTADOR.ciudadBase}, Chile. Email de contacto:{' '}
        <a href={`mailto:${CONTACTO.email}`} style={linkStyle}>
          {CONTACTO.email}
        </a>
        . Inscrito en el Registro Nacional de Prestadores Individuales (RNPI)
        bajo el N° {PRESTADOR.rnpi}, verificable en el sitio de la
        Superintendencia de Salud (
        <a
          href={URLS_EXTERNAS.superintendenciaSalud}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          superdesalud.gob.cl
        </a>
        ).
      </p>

      {/* 2 */}
      <h2 className="font-display" style={STYLES.h2}>
        2. Qué datos recopilo
      </h2>
      <p style={STYLES.p}>
        Mis bases de datos comprenden a pacientes adultos, a adultos
        responsables de adolescentes en atención y a personas que visitan el
        sitio o me escriben para orientarse antes de agendar.
      </p>
      <p style={STYLES.subhead}>Datos que tú me entregas:</p>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Nombre completo, RUT, email y teléfono al agendar o firmar el
          consentimiento informado.
        </li>
        <li style={STYLES.li}>
          La información que compartes durante las sesiones de psicoterapia.
        </li>
        <li style={STYLES.li}>
          Firma electrónica del consentimiento informado y el momento en que la
          firmaste.
        </li>
      </ul>
      <p style={STYLES.subhead}>Datos técnicos del sitio:</p>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Logs de visitas anonimizados que Netlify genera automáticamente como
          parte del hosting. No incluyen tu IP completa ni tu identidad.
        </li>
        <li style={STYLES.li}>
          Información que compartes voluntariamente al usar formularios
          (consentimiento informado).
        </li>
      </ul>
      <p style={STYLES.p}>
        En las páginas públicas del sitio (el inicio, la página
        &ldquo;Respira conmigo&rdquo; y la página de confirmación de reserva)
        uso la etiqueta de Google: Google Analytics 4 para entender cuántas
        personas visitan el sitio, y la medición de conversiones de Google Ads
        para saber cuántas llegan a reservar una sesión. No la uso en las
        páginas del consentimiento informado, del asentimiento ni en esta
        política: esas quedan libres de medición publicitaria. Esta medición no
        recibe ningún dato clínico ni de salud, ni el motivo de tu consulta, ni
        el tipo de sesión que reservas.
      </p>
      <p style={STYLES.p}>
        En esas mismas páginas públicas uso Umami, una herramienta de medición
        complementaria que cuenta visitas y reservas de forma agregada, no usa
        cookies y no almacena tu dirección IP.
      </p>

      {/* 3 */}
      <h2 className="font-display" style={STYLES.h2}>
        3. Para qué los uso
      </h2>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Coordinar y prestar tu atención psicológica.
        </li>
        <li style={STYLES.li}>
          Cumplir con la obligación legal de mantener tu ficha clínica (
          {LEGAL.leyTelemedicina}).
        </li>
        <li style={STYLES.li}>
          Emitir comprobantes, recibos o facturación cuando aplique.
        </li>
        <li style={STYLES.li}>
          Procesar bonos Fonasa MLE ante el Fondo Nacional de Salud.
        </li>
        <li style={STYLES.li}>
          Comunicarme contigo sobre tus sesiones (confirmaciones,
          reagendamientos, recordatorios).
        </li>
      </ul>

      {/* 4 */}
      <h2 className="font-display" style={STYLES.h2}>
        4. Bases legales del tratamiento
      </h2>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Tu consentimiento expreso, otorgado al firmar el consentimiento
          informado.
        </li>
        <li style={STYLES.li}>
          Cumplimiento de obligaciones legales que me aplican como prestador
          de salud ({LEGAL.leyTelemedicina}, Código Sanitario, normativa
          Fonasa).
        </li>
        <li style={STYLES.li}>
          Ejecución del contrato de prestación de servicios profesionales que
          iniciamos al agendar.
        </li>
        <li style={STYLES.li}>
          Mi interés legítimo en medir el funcionamiento del sitio y el
          resultado de la publicidad (cuántas personas visitan y cuántas
          reservan), sin datos clínicos. Puedes oponerte a esta medición en
          cualquier momento (ver sección 8).
        </li>
      </ul>
      <p style={STYLES.p}>
        No tomo decisiones automatizadas ni elaboro perfiles con tus datos.
      </p>

      {/* 5 */}
      <h2 className="font-display" style={STYLES.h2}>
        5. Datos sensibles de salud
      </h2>
      <p style={STYLES.p}>
        Tus datos de salud reciben el mayor estándar de confidencialidad,
        conforme al Código de Ética del Colegio de Psicólogas y Psicólogos de
        Chile y a la {LEGAL.leyDatosFutura} sobre Protección de Datos
        Personales (con vigencia plena a partir del{' '}
        {LEGAL.vigenciaPlena21719}; durante el período de transición aplica la{' '}
        {LEGAL.leyDatosVigente}). No comparto tus datos con terceros salvo las
        excepciones legales explícitas:
      </p>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>Riesgo grave para tu vida o para terceros.</li>
        <li style={STYLES.li}>
          Situaciones de abuso a menores o personas vulnerables.
        </li>
        <li style={STYLES.li}>Requerimiento judicial.</li>
      </ul>

      {/* 6 */}
      <h2 className="font-display" style={STYLES.h2}>
        6. Plataformas y proveedores que uso
      </h2>
      <p style={STYLES.p}>
        Para prestar el servicio uso herramientas externas. Cada una procesa
        solo los datos mínimos necesarios:
      </p>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Cal.com (agendamiento): procesa tu nombre y email para generar la
          confirmación de la cita.
        </li>
        <li style={STYLES.li}>
          Doxy.me (videollamada): plataforma certificada por Fonasa para
          telerehabilitación. Procesa solo tu nombre durante la sesión. No
          graba.
        </li>
        <li style={STYLES.li}>
          Resend (envío de emails automáticos): procesa nombre, email y el PDF
          del consentimiento firmado solo para entregártelo a ti y a mí.
        </li>
        <li style={STYLES.li}>
          Netlify (hosting y formularios): aloja el sitio web y procesa las
          llamadas a funciones serverless necesarias para el formulario de
          consentimiento. Logs anonimizados.
        </li>
        <li style={STYLES.li}>
          Google (medición): recibe identificadores técnicos de navegación en
          las páginas públicas para contar visitas (Google Analytics 4) y
          conversiones de Google Ads. Nunca recibe datos clínicos ni el motivo
          de tu consulta.
        </li>
        <li style={STYLES.li}>
          Umami (medición sin cookies): cuenta visitas y reservas de forma
          agregada, sin cookies y sin almacenar tu dirección IP.
        </li>
      </ul>
      <p style={STYLES.p}>
        Estos proveedores procesan datos fuera de Chile (servidores en Estados
        Unidos o Europa). Mientras la autoridad chilena no declare qué países
        ofrecen niveles adecuados de protección, estas transferencias se
        amparan en las garantías que reconoce el artículo 27 de la{' '}
        {LEGAL.leyDatosFutura}: cláusulas contractuales de protección de datos
        suscritas con cada proveedor y, cuando corresponde, la necesidad de
        ejecutar el contrato de atención que iniciamos al agendar.
      </p>

      {/* 7 */}
      <h2 className="font-display" style={STYLES.h2}>
        7. Tiempo de retención
      </h2>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>
          Ficha clínica: 15 años desde el último contacto profesional contigo
          (norma sanitaria chilena).
        </li>
        <li style={STYLES.li}>
          Consentimientos informados firmados: 5 años mínimo (Art. 2515 del
          Código Civil, prescripción de acciones).
        </li>
        <li style={STYLES.li}>
          Datos de contacto de personas que no llegaron a agendar sesión:
          hasta 1 año, o hasta que solicites su eliminación, lo que ocurra
          primero.
        </li>
      </ul>

      {/* 8 */}
      <h2 className="font-display" style={STYLES.h2}>
        8. Tus derechos
      </h2>
      <p style={STYLES.p}>
        Bajo la {LEGAL.leyDatosVigente} vigente y la {LEGAL.leyDatosFutura}{' '}
        (vigencia plena desde el {LEGAL.vigenciaPlena21719}), tienes derecho a:
      </p>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>Acceder a los datos que tengo sobre ti.</li>
        <li style={STYLES.li}>Rectificarlos si están incorrectos.</li>
        <li style={STYLES.li}>
          Solicitar su eliminación cuando no exista obligación legal de
          mantenerlos (como la ficha clínica, que sí debo mantener 15 años).
        </li>
        <li style={STYLES.li}>Oponerte a usos específicos.</li>
        <li style={STYLES.li}>
          Solicitar el bloqueo temporal del tratamiento mientras se resuelve
          una solicitud de rectificación, supresión u oposición.
        </li>
        <li style={STYLES.li}>Portar tus datos hacia otro prestador.</li>
        <li style={STYLES.li}>
          Retirar tu consentimiento en cualquier momento (lo que no afecta lo
          ya tratado válidamente).
        </li>
      </ul>
      <p style={STYLES.p}>
        Para ejercer cualquiera de estos derechos, escríbeme a{' '}
        <a href={`mailto:${CONTACTO.email}`} style={linkStyle}>
          {CONTACTO.email}
        </a>{' '}
        con tu nombre completo, RUT y el derecho específico que quieres
        ejercer. Acusaré recibo y responderé dentro de 30 días corridos,
        prorrogables por una sola vez hasta por otros 30 cuando la solicitud
        lo requiera. Ejercer los derechos de rectificación, supresión y
        oposición es siempre gratuito; el acceso y la portabilidad son
        gratuitos al menos una vez por trimestre.
      </p>
      <p style={STYLES.p}>
        Si rechazo tu solicitud o no respondo a tiempo, puedes reclamar ante
        la {LEGAL.autoridadDatos}, la autoridad que crea la{' '}
        {LEGAL.leyDatosFutura}, dentro de los 30 días hábiles siguientes. Es
        un derecho tuyo y mi deber informártelo.
      </p>

      {/* 9 */}
      <h2 className="font-display" style={STYLES.h2}>
        9. Cookies y rastreo
      </h2>
      <p style={STYLES.p}>
        En las páginas del consentimiento informado y del asentimiento solo uso
        cookies estrictamente necesarias para el funcionamiento del formulario
        (recuperación de sesión si el envío falla; expira a los 10 minutos).
      </p>
      <p style={STYLES.p}>
        En las páginas públicas (el inicio, &ldquo;Respira conmigo&rdquo; y la
        página de confirmación de reserva) la etiqueta de Google instala cookies
        para medir visitas y conversiones de la campaña de Google Ads. Estas
        cookies no leen información clínica ni el contenido de los formularios.
        Puedes bloquearlas desde la configuración de tu navegador o instalando
        el complemento de inhabilitación de Google Analytics en{' '}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          tools.google.com/dlpage/gaoptout
        </a>
        . Esta medición se basa en mi interés legítimo (sección 4) y puedes
        oponerte a ella en cualquier momento escribiéndome, además de
        bloquearla desde tu navegador. El tratamiento de estos datos se rige
        por la {LEGAL.leyDatosVigente} y, desde el {LEGAL.vigenciaPlena21719},
        por la {LEGAL.leyDatosFutura}.
      </p>
      <p style={STYLES.p}>
        Umami, la herramienta de medición complementaria, no instala cookies
        ni guarda identificadores personales.
      </p>

      {/* 10 */}
      <h2 className="font-display" style={STYLES.h2}>
        10. Medidas de seguridad
      </h2>
      <ul style={STYLES.ul}>
        <li style={STYLES.li}>HTTPS en todo el sitio (cifrado en tránsito).</li>
        <li style={STYLES.li}>
          Cifrado en tránsito durante la videollamada en Doxy.me, plataforma
          certificada por Fonasa para telerehabilitación.
        </li>
        <li style={STYLES.li}>
          Acceso a la ficha clínica protegido por credenciales personales y
          dispositivos cifrados.
        </li>
        <li style={STYLES.li}>
          Política de mesa limpia: no dejo documentos clínicos visibles ni
          accesibles a terceros.
        </li>
        <li style={STYLES.li}>
          API keys y credenciales de servicios externos almacenadas como
          variables de entorno cifradas en el servidor, nunca en el código.
        </li>
      </ul>

      {/* 11 */}
      <h2 className="font-display" style={STYLES.h2}>
        11. Cambios a esta política
      </h2>
      <p style={STYLES.p}>
        Si actualizo esta política, lo indicaré en la fecha al inicio. Cuando
        el cambio sea sustantivo, te lo aviso por email a quienes son
        pacientes activos.
      </p>

      {/* 12 */}
      <h2 className="font-display" style={STYLES.h2}>
        12. Contacto sobre privacidad
      </h2>
      <p style={STYLES.p}>
        Cualquier duda sobre cómo trato tus datos, escríbeme a{' '}
        <a href={`mailto:${CONTACTO.email}`} style={linkStyle}>
          {CONTACTO.email}
        </a>
        . Responderé en los plazos legales aplicables.
      </p>
    </article>
  );
}
