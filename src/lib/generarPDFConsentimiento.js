/**
 * Generador del PDF firmado del consentimiento.
 *
 * Usa jsPDF con Helvetica (WinAnsi/CP1252) que soporta tildes y ñ.
 * Cero em-dashes y cero en-dashes en el PDF.
 *
 * Layout compacto pensado para caber siempre en 1 sola hoja tamaño carta
 * (no A4, que es mas alto): margenes chicos, texto en cuerpo 8.5pt y
 * bloques de datos en lineas combinadas en vez de una linea por campo.
 *
 * El import de jsPDF es dinámico para mantener fuera del bundle inicial.
 * Helper descargarPDF vive en src/lib/descargarPDF.js (archivo separado
 * para que PantallaExito pueda importarlo estáticamente sin arrastrar jsPDF).
 */

import { TEXTO_CONSENTIMIENTO, CHECKBOXES_DECLARACION } from './textoConsentimiento';

const IZQ = 14;
const DER = 201.9;
const ANCHO = DER - IZQ; // ~188 mm

export async function generarPDF({
  nombre,
  rut,
  email,
  telefono,
  fechaISO,
  zonaHoraria,
  firmaDataURL,
  hashDocumento,
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });

  const fechaLegible = new Date(fechaISO).toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  });

  let y = 14;

  // HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'Consentimiento Informado: Atención Psicológica por Telerehabilitación',
    (IZQ + DER) / 2,
    y,
    { align: 'center', maxWidth: ANCHO }
  );
  y += 9;

  // Línea divisoria sage
  doc.setDrawColor(63, 91, 74);
  doc.setLineWidth(0.3);
  doc.line(IZQ, y, DER, y);
  y += 5;

  // Fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Fecha de emisión: ${fechaLegible}`, IZQ, y);
  y += 5.5;

  // Datos del consultante (lineas combinadas para ahorrar espacio)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Datos del consultante', IZQ, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nombre: ${nombre} · RUT: ${rut}`, IZQ, y); y += 3.8;
  doc.text(`Email: ${email} · Teléfono: ${telefono}`, IZQ, y); y += 5.5;

  // Prestador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Prestador', IZQ, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const lineasPrestador = doc.splitTextToSize(
    'Juan Fernández, Psicólogo Clínico (Universidad Viña del Mar). RUT 17.520.730-9. Registro Nacional de Prestadores Individuales (RNPI) N.° 876085. Inscrito en Fonasa MLE bajo códigos 09 08 101, 09 08 102, 09 08 103.',
    ANCHO
  );
  lineasPrestador.forEach((linea) => {
    doc.text(linea, IZQ, y);
    y += 3.8;
  });
  y += 2;

  // Texto del consentimiento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Texto del consentimiento', IZQ, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const lineas = doc.splitTextToSize(TEXTO_CONSENTIMIENTO, ANCHO);
  lineas.forEach((linea) => {
    doc.text(linea, IZQ, y);
    y += 3.8;
  });
  y += 3;

  // Declaración del consultante con checkboxes [X]
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Declaración del consultante', IZQ, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  CHECKBOXES_DECLARACION.forEach((texto) => {
    const wrap = doc.splitTextToSize(texto, ANCHO - 8);
    // Caja
    doc.rect(IZQ, y - 3, 3.5, 3.5);
    // Checkmark
    doc.setLineWidth(0.4);
    doc.line(IZQ + 0.7, y - 1.5, IZQ + 1.5, y - 0.7);
    doc.line(IZQ + 1.5, y - 0.7, IZQ + 2.9, y - 2.6);
    doc.text(wrap, IZQ + 6, y);
    y += 3.8 * wrap.length + 0.8;
  });
  y += 3;

  // Firma
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Firma del consultante', IZQ, y);
  y += 4;
  doc.addImage(firmaDataURL, 'PNG', IZQ, y, 55, 20);
  y += 23;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${nombre} · RUT ${rut}`, IZQ, y);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Documento generado el ${fechaLegible} · Zona horaria: ${zonaHoraria}`, IZQ, footerY);
  const hashCorto = `${hashDocumento.slice(0, 16)}...${hashDocumento.slice(-16)}`;
  doc.text(`Hash de integridad SHA-256: ${hashCorto}`, IZQ, footerY + 3.2);
  doc.text('psicologojuanfernandez.cl', IZQ, footerY + 6.4);

  return doc.output('blob');
}
