/**
 * Generador del PDF imprimible del consentimiento (para llenar a mano).
 *
 * Misma fuente canonica que el flujo online: TEXTO_CONSENTIMIENTO y
 * CHECKBOXES_DECLARACION. Asi quien firma en papel acepta EXACTAMENTE el mismo
 * texto que quien firma online; ningun documento puede derivar del otro.
 *
 * Diferencia con generarPDFConsentimiento (el firmado): aqui los datos y la
 * firma van en blanco (lineas para escribir y firmar a mano) y las casillas de
 * la declaracion se dibujan vacias para marcar con lapiz. Cabe en una sola hoja
 * A4. Al final, instruccion de enviar foto o escaneo por WhatsApp o email.
 *
 * jsPDF se importa de forma dinamica (igual que el generador firmado), asi no
 * entra en el bundle inicial de consentimiento.html: solo se descarga cuando el
 * usuario pide la version para imprimir. Helvetica (WinAnsi) soporta tildes y
 * enie. Cero em-dashes y cero en-dashes.
 */

import { TEXTO_CONSENTIMIENTO, CHECKBOXES_DECLARACION } from './textoConsentimiento';
import { PRESTADOR, CONTACTO } from './contacto';

export async function generarPDFConsentimientoImprimible() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const IZQ = 16;
  const DER = 194; // 210 - 16
  const ANCHO = DER - IZQ; // 178 mm
  const sage = [63, 91, 74];
  const ink = [42, 59, 76];
  const gris = [120, 120, 120];

  let y = 15;

  // Titulo (mismo encuadre legal que el PDF firmado).
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'Consentimiento Informado: Atención Psicológica por Telerehabilitación',
    105,
    y,
    { align: 'center', maxWidth: ANCHO }
  );
  y += 7;

  // Subtitulo: para que sirve esta hoja.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gris);
  doc.text(
    'Versión para imprimir y completar a mano. Solo si prefieres no llenarlo en línea.',
    105,
    y,
    { align: 'center', maxWidth: ANCHO }
  );
  y += 6;

  // Divisoria sage.
  doc.setDrawColor(...sage);
  doc.setLineWidth(0.3);
  doc.line(IZQ, y, DER, y);
  y += 6;

  // Prestador (una linea compacta).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...ink);
  doc.text('Prestador', IZQ, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${PRESTADOR.nombre}, ${PRESTADOR.titulo}. RUT ${PRESTADOR.rut}. Registro Nacional de Prestadores Individuales (RNPI) N° ${PRESTADOR.rnpi}. Inscrito en Fonasa MLE (códigos 09 08 101, 09 08 102, 09 08 103).`,
    IZQ,
    y,
    { maxWidth: ANCHO }
  );
  y += 8;

  // Campos del consultante (lineas en blanco para escribir a mano).
  const campoLinea = (etiqueta, x, ancho) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text(etiqueta, x, y);
    const inicio = x + doc.getTextWidth(etiqueta) + 2;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(inicio, y + 1, x + ancho, y + 1);
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Datos del consultante', IZQ, y);
  y += 6;

  campoLinea('Nombre y apellido:', IZQ, ANCHO);
  y += 8;
  campoLinea('RUT:', IZQ, 84);
  campoLinea('Fecha:', IZQ + 96, ANCHO - 96 - 0);
  y += 8;
  campoLinea('Email:', IZQ, 84);
  campoLinea('Teléfono:', IZQ + 96, ANCHO - 96 - 0);
  y += 9;

  // Texto del consentimiento (solo las clausulas: el bloque DECLARO embebido
  // se reemplaza por casillas vacias para marcar a mano).
  const cuerpo = TEXTO_CONSENTIMIENTO.split('\n\nDECLARO:')[0];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  const lineas = doc.splitTextToSize(cuerpo, ANCHO);
  lineas.forEach((linea) => {
    doc.text(linea, IZQ, y);
    y += 4;
  });
  y += 3;

  // Declaracion con casillas VACIAS.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Declaro (marca cada casilla):', IZQ, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  CHECKBOXES_DECLARACION.forEach((texto) => {
    doc.setDrawColor(...ink);
    doc.setLineWidth(0.3);
    doc.rect(IZQ, y - 3.4, 4, 4);
    const wrap = doc.splitTextToSize(texto, ANCHO - 9);
    doc.text(wrap, IZQ + 7, y);
    y += 5.2 * wrap.length;
  });
  y += 6;

  // Firma (visible: linea clara con etiqueta).
  doc.setDrawColor(...ink);
  doc.setLineWidth(0.4);
  doc.line(IZQ, y, IZQ + 86, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Firma del consultante', IZQ, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...gris);
  doc.text('Nombre y RUT (repetir bajo la firma):', IZQ, y);

  // Pie: como devolver la hoja firmada. La posicion del enlace se calcula a
  // partir de cuantas lineas ocupa la nota, asi nunca se encima con ella.
  const notaTexto = `Una vez firmada, envíame una foto o escaneo de esta hoja por WhatsApp (${CONTACTO.whatsappDisplay}) o por email (${CONTACTO.email}) antes de tu primera sesión.`;
  const pieTop = 282;
  doc.setDrawColor(...sage);
  doc.setLineWidth(0.3);
  doc.line(IZQ, pieTop - 6, DER, pieTop - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  const notaLineas = doc.splitTextToSize(notaTexto, ANCHO);
  doc.text(notaLineas, IZQ, pieTop);
  doc.setFontSize(8);
  doc.setTextColor(...gris);
  doc.text('psicologojuanfernandez.cl', IZQ, pieTop + notaLineas.length * 4 + 2.5);

  return doc.output('blob');
}
