import { useState, useEffect, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Button from '../ui/Button';
import PantallaExito from './PantallaExito';
import { TEXTO_CONSENTIMIENTO, CHECKBOXES_DECLARACION } from '../../lib/textoConsentimiento';
import {
  validarNombre,
  validarRUT,
  validarEmail,
  validarTelefono,
  normalizarRUT,
  normalizarTelefono,
  formatearRUTEnVivo,
} from '../../lib/validacion';

const SESSION_KEY = 'consentimiento_pendiente';
const SESSION_TTL_MS = 10 * 60 * 1000;
const MIN_FIRMA_BYTES = 500;
const WHATSAPP_FALLBACK_URL =
  'https://wa.me/56973394530?text=Hola%2C%20no%20puedo%20firmar%20el%20consentimiento%20por%20el%20sitio.';

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

function leerQueryParams() {
  if (typeof window === 'undefined') return {};
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      nombre: p.get('nombre') ? decodeURIComponent(p.get('nombre')) : '',
      email: p.get('email') ? decodeURIComponent(p.get('email')) : '',
    };
  } catch {
    return {};
  }
}

/**
 * Formatea los dígitos del celular chileno como "9 1234 5678" para display.
 * El prefijo +56 vive en un span aparte, no en el state.
 */
function formatearTelefonoLocal(input) {
  let digits = (input || '').replace(/\D/g, '');
  // Si el usuario pega un número con prefijo 56, lo eliminamos.
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

export default function ConsentimientoInformado() {
  const initial = leerQueryParams();

  const [nombre, setNombre] = useState(initial.nombre || '');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState(initial.email || '');
  const [telefono, setTelefono] = useState('');
  const [checks, setChecks] = useState([false, false, false, false]);

  const [errores, setErrores] = useState({});
  const [resumenErrores, setResumenErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [exito, setExito] = useState(false);
  const [pdfBlobParaDescarga, setPdfBlobParaDescarga] = useState(null);

  const [canvasWidth, setCanvasWidth] = useState(400);
  const [recovery, setRecovery] = useState(null);

  // Estados de focus para el input compuesto del teléfono (wrapper +56 + input).
  const [telefonoFocused, setTelefonoFocused] = useState(false);

  // Detección de scroll-end del bloque de texto del consentimiento.
  const [scrollAtEnd, setScrollAtEnd] = useState(false);

  const signaturePadRef = useRef(null);
  const refNombre = useRef(null);
  const refRut = useRef(null);
  const refEmail = useRef(null);
  const refTelefono = useRef(null);
  const refChecks = useRef(null);
  const refFirma = useRef(null);

  // Responsive canvas width.
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

  // Recuperación de sessionStorage al montar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (
        data?.timestampGuardado &&
        Date.now() - data.timestampGuardado < SESSION_TTL_MS
      ) {
        setRecovery(data);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const aplicarRecovery = useCallback(() => {
    if (!recovery) return;
    const d = recovery.datos || {};
    if (d.nombre) setNombre(d.nombre);
    if (d.rut) setRut(d.rut);
    if (d.email) setEmail(d.email);
    if (d.telefono) setTelefono(formatearTelefonoLocal(d.telefono));
    if (Array.isArray(d.checks)) setChecks(d.checks);
    if (recovery.firmaBase64 && signaturePadRef.current) {
      try {
        signaturePadRef.current.fromDataURL(recovery.firmaBase64);
      } catch {
        // si falla, el usuario firma de nuevo
      }
    }
    setRecovery(null);
  }, [recovery]);

  const descartarRecovery = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setRecovery(null);
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

  // Detector de scroll-end para el bloque del consentimiento.
  // Solo actualiza state si el valor cambió, para evitar re-renders innecesarios.
  const handleConsentScroll = (e) => {
    const el = e.target;
    const reached = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    setScrollAtEnd((prev) => (prev === reached ? prev : reached));
  };

  function validarTodo() {
    const errs = {};
    const resumen = [];

    const vNombre = validarNombre(nombre);
    if (!vNombre.valido) {
      errs.nombre = vNombre.error;
      resumen.push({ campo: 'nombre', mensaje: `Nombre: ${vNombre.error.toLowerCase()}` });
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
      errs.firma = 'Falta tu firma (o es demasiado corta)';
      resumen.push({ campo: 'firma', mensaje: 'Falta tu firma' });
    }

    return { errs, resumen, firmaPNG };
  }

  function enfocarPrimerError(resumen) {
    if (!resumen.length) return;
    const map = {
      nombre: refNombre,
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

      const datosPaciente = {
        nombre: nombre.trim(),
        rut: normalizarRUT(rut),
        email: email.trim().toLowerCase(),
        telefono: normalizarTelefono(telefono),
      };

      const { sha256 } = await import('../../lib/hash');
      const payloadParaHash = {
        datos: datosPaciente,
        timestamp: timestampISO,
        userAgent,
        zonaHoraria,
        firmaLength: firmaBase64.length,
      };
      const hashDocumento = await sha256(JSON.stringify(payloadParaHash));

      // Dynamic import: jsPDF solo se carga aquí, no en initial bundle.
      const { generarPDF } = await import('../../lib/generarPDFConsentimiento');
      const pdfBlob = await generarPDF({
        ...datosPaciente,
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
          datos: datosPaciente,
          firmaBase64,
          pdfBase64,
          hashDocumento,
          timestampISO,
          userAgent,
          zonaHoraria,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error servidor (${response.status}): ${errorBody}`);
      }

      // Guardar blob para descarga manual desde PantallaExito.
      // No disparamos auto-download: algunos browsers lo bloquean y el
      // mensaje de éxito se vuelve falso. El usuario lo baja con click explícito.
      setPdfBlobParaDescarga(pdfBlob);

      sessionStorage.removeItem(SESSION_KEY);
      setExito(true);
    } catch (err) {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            datos: { nombre, rut, email, telefono, checks },
            firmaBase64: signaturePadRef.current?.toDataURL('image/png') || null,
            timestampGuardado: Date.now(),
          })
        );
      } catch {
        // sessionStorage lleno o no disponible
      }
      setErrorEnvio(err.message || 'Error al enviar el consentimiento');
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return <PantallaExito pdfBlob={pdfBlobParaDescarga} />;
  }

  // Feedback en tiempo real del RUT: muestra error de DV si el usuario ya
  // ingresó suficiente caracteres pero el dígito verificador es incorrecto.
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
        Consentimiento informado
      </h2>
      <p
        className="font-body text-ink/70"
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          maxWidth: '60ch',
          marginBottom: 32,
        }}
      >
        Antes de tu primera sesión necesito que leas y aceptes este consentimiento.
        Es el documento legal que respalda nuestra atención por videollamada. Te
        llegará una copia firmada a tu email y la podrás descargar en PDF.
      </p>

      {recovery && (
        <div
          role="status"
          style={{
            background: 'rgba(63, 91, 74, 0.06)',
            border: '1px solid rgba(63, 91, 74, 0.25)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            className="font-body text-ink/80"
            style={{ fontSize: 14, lineHeight: 1.5 }}
          >
            Tienes un intento de envío sin completar. ¿Quieres recuperar los datos?
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={aplicarRecovery}
              className="font-body"
              style={{
                background: '#3F5B4A',
                color: '#F6F1E8',
                border: 'none',
                borderRadius: 999,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Recuperar
            </button>
            <button
              type="button"
              onClick={descartarRecovery}
              className="font-body text-ink/60"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(42,59,76,0.25)',
              }}
            >
              Empezar de cero
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* BLOQUE 1: Tus datos */}
        <section style={{ marginBottom: 36 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            1. Tus datos
          </h3>

          {/* Nombre */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cons-nombre" style={labelBase}>
              Nombre completo
            </label>
            <input
              ref={refNombre}
              id="cons-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'err-nombre' : undefined}
              style={{
                ...inputBase,
                ...(errores.nombre ? inputError : {}),
              }}
              onFocus={(e) => {
                if (!errores.nombre) {
                  e.target.style.borderColor = '#3F5B4A';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 181, 160, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                if (!errores.nombre) {
                  e.target.style.borderColor = 'rgba(63, 91, 74, 0.3)';
                }
              }}
              autoComplete="name"
              required
            />
            {errores.nombre && (
              <p
                id="err-nombre"
                role="alert"
                className="font-body"
                style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}
              >
                {errores.nombre}
              </p>
            )}
          </div>

          {/* RUT */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cons-rut" style={labelBase}>
              RUT
            </label>
            <input
              ref={refRut}
              id="cons-rut"
              type="text"
              value={rut}
              onChange={handleRutChange}
              onBlur={onBlurRut}
              aria-invalid={!!errores.rut || mostrarRutErrorVivo}
              aria-describedby={errores.rut ? 'err-rut' : undefined}
              placeholder="12.345.678-9"
              style={{
                ...inputBase,
                ...(errores.rut || mostrarRutErrorVivo ? inputError : {}),
              }}
              onFocus={(e) => {
                if (!errores.rut && !mostrarRutErrorVivo) {
                  e.target.style.borderColor = '#3F5B4A';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 181, 160, 0.2)';
                }
              }}
              onBlurCapture={(e) => {
                e.target.style.boxShadow = 'none';
              }}
              autoComplete="off"
              inputMode="text"
              required
            />
            {errores.rut ? (
              <p
                id="err-rut"
                role="alert"
                className="font-body"
                style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}
              >
                {errores.rut}
              </p>
            ) : mostrarRutOK ? (
              <p
                className="font-body text-sage"
                style={{ fontSize: 13, marginTop: 6 }}
              >
                Formato válido: {normalizarRUT(rut)}
              </p>
            ) : mostrarRutErrorVivo ? (
              <p
                className="font-body"
                role="alert"
                style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}
              >
                {rutValidacion.error}
              </p>
            ) : null}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="cons-email" style={labelBase}>
              Email
            </label>
            <input
              ref={refEmail}
              id="cons-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errores.email}
              aria-describedby={errores.email ? 'err-email' : undefined}
              style={{
                ...inputBase,
                ...(errores.email ? inputError : {}),
              }}
              onFocus={(e) => {
                if (!errores.email) {
                  e.target.style.borderColor = '#3F5B4A';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 181, 160, 0.2)';
                }
              }}
              autoComplete="email"
              required
            />
            {errores.email && (
              <p
                id="err-email"
                role="alert"
                className="font-body"
                style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}
              >
                {errores.email}
              </p>
            )}
          </div>

          {/* Teléfono: wrapper con prefijo +56 fijo + input editable */}
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="cons-tel" style={labelBase}>
              Teléfono
            </label>
            <div
              style={{
                ...inputBase,
                padding: 0,
                display: 'flex',
                alignItems: 'stretch',
                overflow: 'hidden',
                ...(errores.telefono ? inputError : {}),
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
                id="cons-tel"
                type="tel"
                value={telefono}
                onChange={handleTelefonoChange}
                aria-invalid={!!errores.telefono}
                aria-describedby={errores.telefono ? 'err-tel' : 'hint-tel'}
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
            {!errores.telefono && (
              <p
                id="hint-tel"
                className="font-body text-ink/55"
                style={{ fontSize: 12, marginTop: 4 }}
              >
                Sin el código de país. Ejemplo: 9 1234 5678.
              </p>
            )}
            {errores.telefono && (
              <p
                id="err-tel"
                role="alert"
                className="font-body"
                style={{ color: '#B0664A', fontSize: 13, marginTop: 6 }}
              >
                {errores.telefono}
              </p>
            )}
          </div>
        </section>

        {/* BLOQUE 2: Lee el consentimiento */}
        <section style={{ marginBottom: 36 }}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            2. Lee el consentimiento
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
              {TEXTO_CONSENTIMIENTO}
            </pre>
            {/* Indicador visual de scroll: se desvanece al llegar al final */}
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

        {/* BLOQUE 3: Confirma */}
        <section
          ref={refChecks}
          style={{ marginBottom: 36 }}
          tabIndex={-1}
        >
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}
          >
            3. Confirma
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CHECKBOXES_DECLARACION.map((texto, i) => {
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
                  <span
                    className="font-body text-ink"
                    style={{ fontSize: 15, lineHeight: 1.5 }}
                  >
                    {texto}
                  </span>
                </label>
              );
            })}
          </div>
          {errores.checks && (
            <p
              role="alert"
              className="font-body"
              style={{ color: '#B0664A', fontSize: 13, marginTop: 8 }}
            >
              {errores.checks}
            </p>
          )}
        </section>

        {/* BLOQUE 4: Firma */}
        <section ref={refFirma} style={{ marginBottom: 36 }} tabIndex={-1}>
          <h3
            className="font-display text-ink"
            style={{ fontSize: 20, marginBottom: 8, letterSpacing: '-0.01em' }}
          >
            4. Firma
          </h3>
          <p
            className="font-body text-ink/65"
            style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}
          >
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              maxWidth: 400,
              marginTop: 6,
            }}
          >
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
            <p
              role="alert"
              className="font-body"
              style={{ color: '#B0664A', fontSize: 13, marginTop: 8 }}
            >
              {errores.firma}
            </p>
          )}

          <p
            className="font-body text-ink/55"
            style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}
          >
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

        {/* Resumen de errores */}
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
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              Falta completar:
            </p>
            <ul
              className="font-body text-ink/80"
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {resumenErrores.map((r, i) => (
                <li key={i}>{r.mensaje}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error de envío */}
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
            <p
              className="font-body"
              style={{
                color: '#B0664A',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              No pude enviar el consentimiento
            </p>
            <p
              className="font-body text-ink/75"
              style={{ fontSize: 13, lineHeight: 1.5 }}
            >
              {errorEnvio}. Guardé tus datos en este navegador por 10 minutos.
              Vuelve a intentar o escríbeme por WhatsApp.
            </p>
          </div>
        )}

        {/* Submit */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            marginTop: 32,
          }}
        >
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
                    animation: 'cons-spin 0.8s linear infinite',
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
            @keyframes cons-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </form>
    </div>
  );
}
