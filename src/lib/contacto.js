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
  fonasaCodigos: '09 08 101 / 102 / 103',
  ciudadBase: 'Valparaíso',
};

export const CONTACTO = {
  email: 'juanfernandezpsicologo@gmail.com',
  whatsappE164: '56973394530',
  whatsappDisplay: '+56 9 7339 4530',
  whatsappUrl: 'https://wa.me/56973394530',
  doxyUrl: 'https://doxy.me/psicologojuanfernandez',
};

export const LEGAL = {
  ultimaActualizacionPolitica: '26 de mayo de 2026',
  leyTelemedicina: 'Ley 21.541',
  leyDatosVigente: 'Ley 19.628',
  leyDatosFutura: 'Ley 21.719',
  vigenciaPlena21719: '1 de diciembre de 2026',
};

export const URLS_EXTERNAS = {
  superintendenciaSalud: 'https://www.superdesalud.gob.cl/',
  fonasa: 'https://www.fonasa.cl/',
};
