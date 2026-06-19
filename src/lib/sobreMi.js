/**
 * Sobre mi: identidad narrativa del prestador. Fuente unica consumida por el
 * sitio (seccion SobreMi, ancla #bio) y por la app (pestana Informacion). Aqui
 * vive TODO el texto de "quien soy / como trabajo / formato", para que la app
 * (OTA o build) muestre siempre el mismo texto que la web: cero copia
 * hardcodeada por superficie.
 *
 * `bio` es la presentacion canonica de Juan: se usa LITERALMENTE y no se
 * reescribe sin autorizacion. eyebrow y titulo son rotulo y encabezado de la
 * seccion. enfoque y formato son los bloques (rotulo + texto) que antes estaban
 * hardcodeados solo en la app; al centralizarlos no pueden derivar entre
 * superficies. Sin segmentacion por poblacion (decision CRO: no polarizar).
 *
 * Las credenciales NO viven aqui: la seccion las lee de credenciales.js, que ya
 * es fuente unica compartida con la app. Asi la prueba de autoridad no deriva.
 */
export const SOBRE_MI = {
  eyebrow: 'Sobre mí',
  titulo: 'Quién te acompaña en cada sesión.',
  bio: 'La vida moderna nos mantiene siempre en movimiento, pero mereces un espacio seguro y profesional donde tú seas protagonista. Soy Juan Fernández, psicólogo clínico, y te acompaño a modificar lo que hoy te limita, dándole un nuevo sentido a tus experiencias. Da el primer paso hacia tu bienestar desde la comodidad de tu hogar.',
  enfoque: {
    titulo: 'El enfoque',
    texto: 'Trabajo con un enfoque integrativo que combina la terapia cognitivo conductual y la psicología narrativa. Cada proceso parte de lo que te trae y se ajusta a ti.',
  },
  formato: {
    titulo: 'El formato',
    texto: 'Las sesiones duran 45 minutos y son por videollamada. La primera es para conocernos y entender juntos qué te trae. Si después no quieres continuar, no hay compromiso.',
  },
};
