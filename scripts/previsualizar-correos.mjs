/*
 * Previsualizador del correo automatico post reserva.
 *
 * Uso: node scripts/previsualizar-correos.mjs
 *
 * Renderiza a dist-correos/ las ocho variantes que puede tomar el correo (los
 * cuatro tipos de sesion, cada uno con y sin el paso de consentimiento) mas un
 * indice para abrirlas. Sirve para revisar el copy y el diseno sin desplegar ni
 * gastar envios de Resend, y para pillar de una un dato de pago mal escrito.
 *
 * La carpeta de salida esta en .gitignore: es material de revision, no del sitio.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CATALOGO, construirCorreo, formatearInicio } from '../netlify/lib/correoReserva.js';

const SALIDA = 'dist-correos';

// Datos de ejemplo. El nombre y la fecha son ficticios a proposito.
const NOMBRE = 'María José Contreras';
const INICIO = formatearInicio('2026-08-20T15:00:00-04:00');
const LINK = 'https://psicologojuanfernandez.cl/consentimiento.html?nombre=Mar%C3%ADa+Jos%C3%A9&email=ejemplo%40correo.cl';

// Titulos reales de los eventos en Cal.com, para que la previsualizacion se lea
// igual que el correo de produccion.
const TITULOS = {
  'primera-sesion-bonofonasa': 'Primera sesión de psicoterapia online (con bono Fonasa)',
  'sesiones-de-avance-bonofonasa': 'Control y avance de psicoterapia online (con bono Fonasa)',
  'psicoterapia-de-pareja-bonofonasa': 'Psicoterapia de pareja online (con bono Fonasa)',
  'psicoterapia-individual-online-particular-15.000':
    'Psicoterapia individual online (particular - $15.000)',
};

fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA, { recursive: true });

const generadas = [];

for (const slug of Object.keys(CATALOGO)) {
  for (const conConsentimiento of [true, false]) {
    const { asunto, html, texto } = construirCorreo({
      nombre: NOMBRE,
      slug,
      tituloEvento: TITULOS[slug],
      inicioTexto: INICIO,
      linkConsentimiento: conConsentimiento ? LINK : null,
    });

    const base = `${slug}--${conConsentimiento ? 'con' : 'sin'}-consentimiento`;
    fs.writeFileSync(path.join(SALIDA, `${base}.html`), html, 'utf8');
    fs.writeFileSync(path.join(SALIDA, `${base}.txt`), `Asunto: ${asunto}\n\n${texto}`, 'utf8');
    generadas.push({ base, asunto, slug, conConsentimiento });
  }
}

const indice = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Correos post reserva</title>
<style>
  body { font-family: system-ui, sans-serif; background:#F6F1E8; color:#2A3B4C; margin:0; padding:32px; }
  h1 { font-size:22px; margin:0 0 6px; }
  p.sub { color:#6A7480; margin:0 0 24px; font-size:14px; }
  ul { list-style:none; padding:0; margin:0; max-width:820px; }
  li { background:#FFFDF8; border:1px solid #E7DFD0; border-radius:10px; padding:14px 16px; margin-bottom:10px; }
  .asunto { font-weight:700; display:block; margin-bottom:4px; }
  .meta { color:#6A7480; font-size:13px; }
  a { color:#3F5B4A; }
</style></head>
<body>
  <h1>Correo automático post reserva</h1>
  <p class="sub">Ocho variantes: los cuatro tipos de sesión, con y sin el paso de consentimiento informado.</p>
  <ul>
    ${generadas
      .map(
        (g) => `<li>
      <span class="asunto">${g.asunto}</span>
      <span class="meta">${g.slug} · ${g.conConsentimiento ? 'con consentimiento' : 'sin consentimiento'}</span><br>
      <a href="./${g.base}.html">Ver HTML</a> · <a href="./${g.base}.txt">Ver texto plano</a>
    </li>`
      )
      .join('\n    ')}
  </ul>
</body></html>`;

fs.writeFileSync(path.join(SALIDA, 'index.html'), indice, 'utf8');

console.log(`${generadas.length} correos generados en ${SALIDA}/`);
for (const g of generadas) console.log(`  ${g.base}.html  ${g.asunto}`);
console.log(`\nAbre ${path.join(SALIDA, 'index.html')} en el navegador.`);
