import { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Button from '../ui/Button';
import PantallaExito from './PantallaExito';
import { TEXTO_ASENTIMIENTO, CHECKBOXES_ASENTIMIENTO } from '../../lib/textoAsentimiento';
import {
  validarNombre,
  validarRUT,
  validarEmail,
  validarTelefono,
  normalizarRUT,
  normalizarTelefono,
  formatearRUTEnVivo,
} from '../../lib/validacion';

const MIN_FIRMA_BYTES = 500;
const WHATSAPP_FALLBACK_URL =
  'https://wa.me/56973394530?text=Hola%2C%20no%20puedo%20firmar%20el%20asentimiento%20por%20el%20sitio.';
const WHATSAPP_EXITO_URL =
  'https://wa.me/56973394530?text=Hola%2C%20firm%C3%A9%20el%20asentimiento%20informado.%20Tengo%20una%20duda.';

const PARENTESCOS = ['Madre', 'Padre', 'Tutor o tutora legal', 'Otro representante legal'];

const inputBase = {
  width: '100%',
  background: '#FFFDF8',
  border: '1px solid rgba(63, 91, 74, 0.3)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 16,
  fontFamily: 'Karla, system-ui, sans-serif',
  color: '#2A3B4C',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  outline: 'none',
};

const inputError = {
  borderColor: '#C97B5E',
};

const labelBase = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: 'rgba(42, 59, 76, 0.85)',
  marginBottom: 6,
  fontFamily: 'Karla, system-ui, sans-serif',
};

function formatearTelefonoLocal(input) {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length > 9) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 9);
  if (digits.length >= 6) {
    return digits[0] + ' ' + digits.slice(1, 5) + ' ' + digits.slice(5);
  }
  if (digits.length >= 2) {
    return digits[0] + ' ' + digits.slice(1);
  }
  return digits;
}

export default function AsentimientoInformado() {
  const [adolescenteNombre, setAdolescenteNombre] = useState('');
  const [adolescenteEdad, setAdolescenteEdad] = useState('');
  const [nombre, setNombre] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [checks, setChecks] = useState([false, false, false, false]);

  const [errores, setErrores] = useState({});
  const [resumenErrores, setResumenErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [exito, setExito] = useState(false);
  const [pdfBlobParaDescarga, setPdfBlobParaDescarga] = useState(null);

  const [canvasWidth, setCanvasWidth] = useState(400);
  const [telefonoFocused, setTelefonoFocused] = useState(false);
  const [scrollAtEnd, setScrollAtEnd] = useState(false);

  const signaturePadRef = useRef(null);
  const refAdolNombre = useRef(null);
  const refAdolEdad = useRef(null);
  const refNombre = useRef(null);
  const refParentesco = useRef(null);
  const refRut = useRef(null);
  const refEmail = useRef(null);
  const refTelefono = useRef(null);
  const refChecks = useRef(null);
  const refFirma = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        const container = refFirma.current?.querySelector('.canvas-wrap');
        const w = container ? container.clientWidth : window.innerWidth - 48;
        setCanvasWidth(Math.max(280, w));
      } else {
        setCanvasWidth(400);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleRutChange = (e) => {
    setRut(formatearRUTEnVivo(e.target.value));
  };

  const onBlurRut = () => {
    if (!rut) return;
    const v = validarRUT(rut);
    if (v.valido && v.normalizado) setRut(v.normalizado);
  };

  const handleTelefonoChange = (e) => {
    setTelefono(formatearTelefonoLocal(e.target.value));
  };

  const toggleCheck = (i) => {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const limpiarFirma = () => {
    signaturePadRef.current?.clear();
  };

  const handleConsentScroll = (e) => {
    const el = e.target;
    const reached = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    setScrollAtEnd((prev) => (prev === reached ? prev : reached));
  };

  function validarTodo() {
    const errs = {};
    const resumen = [];

    const vAdol = validarNombre(adolescenteNombre);
    if (!vAdol.valido) {
      errs.adolescenteNombre = vAdol.error;
      resumen.push({ campo: 'adolescenteNombre', mensaje: `Nombre del adolescente: ${vAdol.error.toLowerCase()}` });
    }

    const edadNum = parseInt(adolescenteEdad, 10);
    if (!adolescenteEdad || Number.isNaN(edadNum) || edadNum < 1 || edadNum > 17) {
      errs.adolescenteEdad =
        'Indica una edad entre 1 y 17 años. Para 18 o más, usa el consentimiento informado.';
      resumen.push({ campo: 'adolescenteEdad', mensaje: 'Revisa la edad del adolescente (1 a 17)' });
    }

    const vNombre = validarNombre(nombre);
    if (!vNombre.valido) {
      errs.nombre = vNombre.error;
      resumen.push({ campo: 'nombre', mensaje: `Nombre del adulto: ${vNombre.error.toLowerCase()}` });
    }

    if (!parentesco) {
      errs.parentesco = 'Selecciona tu parentesco o calidad';
      resumen.push({ campo: 'parentesco', mensaje: 'Falta tu parentesco o calidad' });
    }

    const vRut = validarRUT(rut);
    if (!vRut.valido) {
      errs.rut = vRut.error;
      resumen.push({ campo: 'rut', mensaje: `RUT: ${vRut.error.toLowerCase()}` });
    }

    const vEmail = validarEmail(email);
    if (!vEmail.valido) {
      errs.email = vEmail.error;
      resumen.push({ campo: 'email', mensaje: `Email: ${vEmail.error.toLowerCase()}` });
    }

    const vTel = validarTelefono(telefono);
    if (!vTel.valido) {
      errs.telefono = vTel.error;
      resumen.push({ campo: 'telefono', mensaje: `Teléfono: ${vTel.error.toLowerCase()}` });
    }

    const todosChecks = checks.every(Boolean);
    if (!todosChecks) {
      errs.checks = 'Debes marcar las 4 declaraciones';
      resumen.push({ campo: 'checks', mensaje: 'Falta marcar las declaraciones obligatorias' });
    }

    const pad = signaturePadRef.current;
    const sinFirma = !pad || pad.isEmpty();
    let firmaPNG = null;
    if (!sinFirma) {
      try {
        firmaPNG = pad.getTrimmedCanvas().toDataURL('image/png');
      } catch {
        firmaPNG = pad.toDataURL('image/png');
      }
    }
    if (sinFirma || !firmaPNG || firmaPNG.length < MIN_FIRMA_BYTES) {
      errs.firma = 'Falta la firma del adulto responsable (o es demasiado corta)';
      resumen.push({ campo: 'firma', mensaje: 'Falta la firma del adulto responsable' });
    }

    return { errs, resumen, firmaPNG };
  }

  function enfocarPrimerError(resumen) {
    if (!resumen.length) return;
    const map = {
      adolescenteNombre: refAdolNombre,
      adolescenteEdad: refAdolEdad,
      nombre: refNombre,
      parentesco: refParentesco,
      rut: refRut,
      email: refEmail,
      telefono: refTelefono,
      checks: refChecks,
      firma: refFirma,
    };
    const el = map[resumen[0].campo]?.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') {
        setTimeout(() => el.focus({ preventScroll: true }), 350);
      }
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    const { errs, resumen, firmaPNG } = validarTodo();
    if (resumen.length) {
      setErrores(errs);
      setResumenErrores(resumen);
      enfocarPrimerError(resumen);
      return;
    }

    setErrores({});
    setResumenErrores([]);
    setEnviando(true);
    setErrorEnvio(null);

    try {
      const firmaBase64 = firmaPNG;
      const timestampISO = new Date().toISOString();
      const userAgent = navigator.userAgent;
      const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const datosAdulto = {
        nombre: nombre.trim(),
        rut: normalizarRUT(rut),
        email: email.trim().toLowerCase(),
        telefono: normalizarTelefono(telefono),
      };
      const datosMenor = {
        adolescenteNombre: adolescenteNombre.trim(),
        adolescenteEdad: parseInt(adolescenteEdad, 10),
        parentesco,
      };

      const { sha256 } = await import('../../lib/hash');
      const payloadParaHash = {
        adulto: datosAdulto,
        menor: datosMenor,
        timestamp: timestampISO,
        userAgent,
        zonaHoraria,
        firmaLength: firmaBase64.length,
      };
      const hashDocumento = await sha256(JSON.stringify(payloadParaHash));

      const { generarPDFAsentimiento } = await import('../../lib/generarPDFAsentimiento');
      const pdfBlob = await generarPDFAsentimiento({
        ...datosMenor,
        ...datosAdulto,
        fechaISO: timestampISO,
        zonaHoraria,
        firmaDataURL: firmaBase64,
        hashDocumento,
      });

      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const response = await fetch('/.netlify/functions/enviar-consentimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datos: datosAdulto,
          firmaBase64,
          pdfBase64,
          hashDocumento,
          timestampISO,
          userAgent,
          zonaHoraria,
          tipo: 'asentimiento',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error servidor (${response.status}): ${errorBody}`);
      }

      setPdfBlobParaDescarga(pdfBlob);
      setExito(true);
    } catch (err) {
      setErrorEnvio(err.message || 'Error al enviar el asentimiento');
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <PantallaExito
        pdfBlob={pdfBlobParaDescarga}
        titulo="Listo. Recibí el asentimiento firmado."
        descripcion="Le envié una copia firmada al email del adulto responsable. Si en 10 minutos no llega, revisa la carpeta de spam o promociones. Puedes guardar una copia local en este dispositivo con el botón de aquí abajo. Ante cualquier duda antes de la sesión, escríbeme por WhatsApp."
        downloadName="asentimiento-firmado.pdf"
        whatsappUrl={WHATSAPP_EXITO_URL}
      />
    );
  }

  const rutDigitsLength = rut.replace(/[^\dkK]/g, '').length;
  const rutValidacion = rut ? validarRUT(rut) : null;
  const mostrarRutOK = rut && rutValidacion?.valido;
  const mostrarRutErrorVivo =
    rut && !errores.rut && !rutValidacion?.valido && rutDigitsLength >= 8;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>
      <h2
        className="font-display text-ink"
        style={{
          fontSize: 'clamp(28px, 4vw, 38px)',
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
          fontVariationSettings: '"opsz" 144, "SOFT" 50',
          marginBottom: 14,
        }}
      >
        Asentimiento informado
      </h2>
      <p
        className="font-body text-ink/70"
        style={{ fontSize: 16, lineHeight: 1.55, maxWidth: '60ch', marginBottom: 32 }}
      >
        Para la atención de una persona menor de 18 años necesito el asentimiento
        del adolescente y la autorización de su madre, padre o representante legal.
        Este es el documento legal que respalda la atención por videollamada. Llegará
        una copia firmada al email del adulto responsable y se podrá descargar en PDF.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* BLOQUE 1: El adolescente */}
        <section style={{ marginBottom: 36 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            1. Datos del adolescente
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="asen-adol-nombre" style={labelBase}>
              Nombre completo del adolescente
            </label>
            <input
              ref={refAdolNombre}
              id="asen-adol-nombre"
              type="text"
              value={adolescenteNombre}
              onChange={(e) => setAdolescenteNombre(e.target.value)}
              aria-invalid={!!errores.adolescenteNombre}
              style={{ ...inputBase, ...(errores.adolescenteNombre ? inputError : {}) }}
              autoComplete="off"
              required
            />
            {errores.adolescenteNombre && (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.adolescenteNombre}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="asen-adol-edad" style={labelBase}>
              Edad del adolescente
            </label>
            <input
              ref={refAdolEdad}
              id="asen-adol-edad"
              type="number"
              inputMode="numeric"
              min={1}
              max={17}
              value={adolescenteEdad}
              onChange={(e) => setAdolescenteEdad(e.target.value)}
              aria-invalid={!!errores.adolescenteEdad}
              placeholder="Ej: 15"
              style={{ ...inputBase, maxWidth: 160, ...(errores.adolescenteEdad ? inputError : {}) }}
              required
            />
            {errores.adolescenteEdad && (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.adolescenteEdad}
              </p>
            )}
          </div>
        </section>

        {/* BLOQUE 2: El adulto responsable */}
        <section style={{ marginBottom: 36 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            2. Datos del adulto responsable
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="asen-nombre" style={labelBase}>
              Nombre completo
            </label>
            <input
              ref={refNombre}
              id="asen-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!errores.nombre}
              style={{ ...inputBase, ...(errores.nombre ? inputError : {}) }}
              autoComplete="name"
              required
            />
            {errores.nombre && (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.nombre}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="asen-parentesco" style={labelBase}>
              Parentesco o calidad
            </label>
            <select
              ref={refParentesco}
              id="asen-parentesco"
              value={parentesco}
              onChange={(e) => setParentesco(e.target.value)}
              aria-invalid={!!errores.parentesco}
              style={{ ...inputBase, ...(errores.parentesco ? inputError : {}) }}
              required
            >
              <option value="">Selecciona una opción</option>
              {PARENTESCOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {errores.parentesco && (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.parentesco}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="asen-rut" style={labelBase}>
              RUT del adulto responsable
            </label>
            <input
              ref={refRut}
              id="asen-rut"
              type="text"
              value={rut}
              onChange={handleRutChange}
              onBlur={onBlurRut}
              aria-invalid={!!errores.rut || mostrarRutErrorVivo}
              placeholder="12.345.678-9"
              style={{ ...inputBase, ...(errores.rut || mostrarRutErrorVivo ? inputError : {}) }}
              autoComplete="off"
              inputMode="text"
              required
            />
            {errores.rut ? (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.rut}
              </p>
            ) : mostrarRutOK ? (
              <p className="font-body text-sage" style={{ fontSize: 13, marginTop: 6 }}>
                Formato válido: {normalizarRUT(rut)}
              </p>
            ) : mostrarRutErrorVivo ? (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {rutValidacion.error}
              </p>
            ) : null}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="asen-email" style={labelBase}>
              Email del adulto responsable
            </label>
            <input
              ref={refEmail}
              id="asen-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errores.email}
              style={{ ...inputBase, ...(errores.email ? inputError : {}) }}
              autoComplete="email"
              required
            />
            {errores.email && (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label htmlFor="asen-tel" style={labelBase}>
              Teléfono del adulto responsable
            </label>
            <div
              style={{
                ...inputBase,
                padding: 0,
                display: 'flex',
                alignItems: 'stretch',
                overflow: 'hidden',
                borderColor: errores.telefono
                  ? '#C97B5E'
                  : telefonoFocused
                  ? '#3F5B4A'
                  : 'rgba(63, 91, 74, 0.3)',
                boxShadow:
                  telefonoFocused && !errores.telefono
                    ? '0 0 0 3px rgba(168, 181, 160, 0.2)'
                    : 'none',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  padding: '12px 4px 12px 16px',
                  color: 'rgba(42, 59, 76, 0.55)',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  fontSize: 16,
                  fontFamily: 'Karla, system-ui, sans-serif',
                  borderRight: '1px solid rgba(63, 91, 74, 0.15)',
                  marginRight: 12,
                }}
              >
                +56
              </span>
              <input
                ref={refTelefono}
                id="asen-tel"
                type="tel"
                value={telefono}
                onChange={handleTelefonoChange}
                aria-invalid={!!errores.telefono}
                placeholder="9 1234 5678"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 16px 12px 0',
                  fontSize: 16,
                  fontFamily: 'Karla, system-ui, sans-serif',
                  color: '#2A3B4C',
                  outline: 'none',
                  width: '100%',
                }}
                onFocus={() => setTelefonoFocused(true)}
                onBlur={() => setTelefonoFocused(false)}
                autoComplete="tel-national"
                inputMode="tel"
                maxLength={11}
                required
              />
            </div>
            {!errores.telefono ? (
              <p className="font-body text-ink/55" style={{ fontSize: 12, marginTop: 4 }}>
                Sin el código de país. Ejemplo: 9 1234 5678.
              </p>
            ) : (
              <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}>
                {errores.telefono}
              </p>
            )}
          </div>
        </section>

        {/* BLOQUE 3: Lee el documento */}
        <section style={{ marginBottom: 36 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            3. Lee el documento
          </h3>
          <div
            style={{
              position: 'relative',
              background: '#FFFDF8',
              border: '1px solid rgba(168, 181, 160, 0.3)',
              borderRadius: 12,
              maxHeight: 320,
              overflowY: 'auto',
              padding: 24,
            }}
            onScroll={handleConsentScroll}
          >
            <pre
              className="font-body"
              style={{
                fontFamily: 'Karla, system-ui, sans-serif',
                fontSize: 14,
                lineHeight: 1.7,
                color: 'rgba(42, 59, 76, 0.85)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                margin: 0,
              }}
            >
              {TEXTO_ASENTIMIENTO}
            </pre>
            <div
              aria-hidden="true"
              style={{
                position: 'sticky',
                bottom: -24,
                left: 0,
                right: 0,
                height: 40,
                marginTop: -40,
                marginLeft: -24,
                marginRight: -24,
                background:
                  'linear-gradient(to bottom, rgba(255,253,248,0) 0%, #FFFDF8 100%)',
                pointerEvents: 'none',
                opacity: scrollAtEnd ? 0 : 1,
                transition: 'opacity 0.2s ease',
              }}
            />
          </div>
        </section>

        {/* BLOQUE 4: Confirma */}
        <section ref={refChecks} style={{ marginBottom: 36 }} tabIndex={-1}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            4. Confirma (adulto responsable)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHECKBOXES_ASENTIMIENTO.map((texto, i) => {
              const marcado = checks[i];
              return (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 4px',
                    cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      marginTop: 2,
                      borderRadius: 4,
                      border: marcado
                        ? '2px solid #3F5B4A'
                        : '2px solid rgba(63, 91, 74, 0.5)',
                      background: marcado ? '#3F5B4A' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {marcado && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFDF8"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => toggleCheck(i)}
                    style={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0,0,0,0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  />
                  <span className="font-body text-ink" style={{ fontSize: 15, lineHeight: 1.5 }}>
                    {texto}
                  </span>
                </label>
              );
            })}
          </div>
          {errores.checks && (
            <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 8 }}>
              {errores.checks}
            </p>
          )}
        </section>

        {/* BLOQUE 5: Firma del adulto responsable */}
        <section ref={refFirma} style={{ marginBottom: 36 }} tabIndex={-1}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 8, letterSpacing: '-0.01em' }}
          >
            5. Firma del adulto responsable
          </h3>
          <p className="font-body text-ink/65" style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
            Firma aquí con el mouse o tu dedo.
          </p>

          <div
            className="canvas-wrap"
            style={{
              border: '1px dashed #A8B5A0',
              borderRadius: 8,
              background: '#FFFDF8',
              width: '100%',
              maxWidth: 400,
              overflow: 'hidden',
            }}
          >
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="#2A3B4C"
              minWidth={1.5}
              maxWidth={2.5}
              canvasProps={{
                width: canvasWidth,
                height: 160,
                style: { display: 'block', touchAction: 'none' },
                'aria-label': 'Área para firmar con el mouse o el dedo',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 400, marginTop: 6 }}>
            <button
              type="button"
              onClick={limpiarFirma}
              className="font-body text-sage"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(63, 91, 74, 0.3)',
                textUnderlineOffset: 2,
                padding: '4px 0',
              }}
            >
              Limpiar firma
            </button>
          </div>

          {errores.firma && (
            <p role="alert" className="font-body" style={{ color: '#B0664A', fontSize: 13, marginTop: 8 }}>
              {errores.firma}
            </p>
          )}

          <p className="font-body text-ink/55" style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
            ¿No puedes firmar con mouse o dedo?{' '}
            <a
              href={WHATSAPP_FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sage"
              style={{
                textDecoration: 'underline',
                textDecorationColor: 'rgba(63, 91, 74, 0.3)',
                textUnderlineOffset: 2,
              }}
            >
              Escríbeme por WhatsApp
            </a>{' '}
            y coordinamos otra modalidad.
          </p>
        </section>

        {resumenErrores.length > 0 && (
          <div
            role="alert"
            style={{
              background: 'rgba(201, 123, 94, 0.08)',
              borderLeft: '3px solid #C97B5E',
              padding: 16,
              borderRadius: 4,
              marginBottom: 16,
            }}
          >
            <p
              className="font-body text-ink"
              style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}
            >
              Falta completar:
            </p>
            <ul
              className="font-body text-ink/80"
              style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}
            >
              {resumenErrores.map((r, i) => (
                <li key={i}>{r.mensaje}</li>
              ))}
            </ul>
          </div>
        )}

        {errorEnvio && (
          <div
            role="alert"
            style={{
              background: 'rgba(201, 123, 94, 0.1)',
              border: '1px solid rgba(201, 123, 94, 0.4)',
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p className="font-body" style={{ color: '#B0664A', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              No pude enviar el asentimiento
            </p>
            <p className="font-body text-ink/75" style={{ fontSize: 13, lineHeight: 1.5 }}>
              {errorEnvio}. Vuelve a intentar o escríbeme por WhatsApp.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginTop: 32 }}>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={enviando}
            className="w-full sm:w-auto sm:self-start"
          >
            {enviando ? (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(246,241,232,0.4)',
                    borderTopColor: '#F6F1E8',
                    borderRadius: '50%',
                    animation: 'asen-spin 0.8s linear infinite',
                    marginRight: 4,
                  }}
                />
                Enviando...
              </>
            ) : (
              'Firmar y enviar'
            )}
          </Button>
          <style>{`
            @keyframes asen-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </form>
    </div>
  );
}
