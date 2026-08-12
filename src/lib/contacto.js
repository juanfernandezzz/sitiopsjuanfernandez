/**
 * Constantes públicas y estables del prestador y del marco legal.
 *
 * Información pública verificable, hardcodeada a propósito para evitar
 * dependencia de variables de entorno en el bundle de cliente.
 */

export const PRESTADOR = {
  nombre: 'Juan Fernández',
  titulo: 'Psicólogo Clínico',
  rut: '17.520.730-9',
  universidad: 'Universidad Viña del Mar',
  anioTitulo: 2025,
  rnpi: '876085',
  ciudadBase: 'Valparaíso',
};

/**
 * Códigos Fonasa MLE con nomenclatura funcional (lenguaje del paciente).
 * Formato del token numérico unificado a "09 08 101" en todo el sitio, idéntico
 * a como lo muestra el portal Mi Fonasa, para que el código que el usuario lee
 * aquí calce exactamente con el que selecciona al comprar el bono.
 *
 * Nota: los strings LITERALES del arancel Fonasa (p. ej. "Telerehabilitación:
 * Psicólogo clínico") viven solo donde el usuario debe reconocer el portal:
 * la guía (ModalGuiaFonasa) y el correo post-reserva (cal-webhook). Aquí se usa
 * la etiqueta funcional para no recargar al usuario que solo está orientándose.
 */
export const FONASA_CODIGOS = [
  { codigo: '09 08 101', etiqueta: 'primera sesión individual' },
  { codigo: '09 08 102', etiqueta: 'sesión de avance' },
  { codigo: '09 08 103', etiqueta: 'terapia de pareja' },
];

export const CONTACTO = {
  email: 'juanfernandezpsicologo@gmail.com',
  whatsappE164: '56973394530',
  whatsappDisplay: '+56 9 7339 4530',
  whatsappUrl: 'https://wa.me/56973394530',
  doxyUrl: 'https://doxy.me/psicologojuanfernandez',
};

/**
 * Perfiles públicos en redes sociales. Función de presencia y prueba de marca,
 * no de conversión: por eso viven solo en el footer y nunca en el header ni en
 * el fold (ver decisión CRO en Footer.jsx). El handle se muestra como etiqueta
 * legible; la URL canónica es la que abre el enlace.
 */
export const REDES = {
  instagramHandle: '@ps.juanfernandez',
  instagramUrl: 'https://www.instagram.com/ps.juanfernandez/',
  facebookUrl: 'https://www.facebook.com/psicologojuanfernandez/',
};

export const LEGAL = {
  ultimaActualizacionPolitica: '16 de julio de 2026',
  versionPolitica: '3',
  autoridadDatos: 'Agencia de Protección de Datos Personales',
  leyTelemedicina: 'Ley 21.541',
  leyDatosVigente: 'Ley 19.628',
  leyDatosFutura: 'Ley 21.719',
  leySaludMental: 'Ley 21.331',
  vigenciaPlena21719: '1 de diciembre de 2026',
};

export const URLS_EXTERNAS = {
  superintendenciaSalud: 'https://www.superdesalud.gob.cl/',
  // Portal publico de busqueda del RNPI (sin permalink por prestador: se
  // consulta por RUT o nombre). URL verificada con respuesta 200 en C38.
  rnpiRegistro: 'https://rnpi.superdesalud.gob.cl/',
  fonasa: 'https://www.fonasa.cl/',
  miFonasa: 'https://mi.fonasa.gob.cl/',
};
