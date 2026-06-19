/**
 * Credenciales de formacion y registro. Fuente unica consumida por el sitio
 * (seccion Credenciales) y por la app (pantalla Inicio). Antes vivian inline en
 * el componente del sitio; al centralizarlas, la autoridad declarada no puede
 * derivar entre el sitio y la app.
 *
 * Restricciones duras (no negociables):
 *  - Ingles C1 (EF-SET). Nunca C2 hasta nuevo certificado.
 *  - No se incluye el registro Mineduc de Educacion Especial: queda fuera del
 *    contexto clinico y nunca se eleva aqui.
 *
 * El numero de registro y la universidad se leen de PRESTADOR (contacto.js),
 * que ya es fuente unica, por lo que un cambio alli se propaga a las dos
 * superficies sin tocar este archivo.
 */
import { PRESTADOR } from './contacto';

export const CREDENCIALES = [
  `Psicólogo clínico titulado en la ${PRESTADOR.universidad}`,
  `Inscrito en la Superintendencia de Salud (N° ${PRESTADOR.rnpi})`,
  'Formación continua en terapia cognitivo-conductual, cuidado clínico (Harvard) y primeros auxilios psicológicos (UAB)',
  'Supervisión clínica continua',
  'Inglés nivel C1 (EF-SET): atención también en inglés',
];
