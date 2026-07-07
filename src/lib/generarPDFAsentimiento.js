/**
 * Generador del PDF firmado del asentimiento informado (menores de 18).
 *
 * Mismo patron que generarPDFConsentimiento: jsPDF con Helvetica (soporta
 * tildes y enie), import dinamico, cero em-dashes y en-dashes. El firmante
 * legal es el adulto responsable.
 *
 * Layout compacto pensado para caber siempre en 1 sola hoja tamaño carta:
 * el texto de este documento es mas largo que el del consentimiento de
 * adultos (incluye Parte A para el adolescente y Parte B para el adulto
 * responsable), asi que el cuerpo va en 7.5pt con interlineado ajustado.
 */

import { TEXTO_ASENTIMIENTO, CHECKBOXES_ASENTIMIENTO } from './textoAsentimiento';

const IZQ = 13;
const DER = 202.9;
const ANCHO = DER - IZQ; // ~190 mm

export async function generarPDFAsentimiento({
  adolescenteNombre,
  adolescenteEdad,
  nombre,
  parentesco,
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

  let y = 13;

  // HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    'Asentimiento Informado y Autorización: Atención Psicológica Online (Menores de 18)',
    (IZQ + DER) / 2,
    y,
    { align: 'center', maxWidth: ANCHO }
  );
  y += 9;

  doc.setDrawColor(63, 91, 74);
  doc.setLineWidth(0.3);
  doc.line(IZQ, y, DER, y);
  y += 4.5;

  // Datos combinados: adolescente, adulto responsable, prestador y fecha
  // en lineas compactas (una por bloque) para dejar el maximo de espacio
  // disponible al cuerpo del documento.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Fecha de emisión: ${fechaLegible}`, IZQ, y); y += 3.9;
  doc.text(`Adolescente: ${adolescenteNombre}, ${adolescenteEdad} años`, IZQ, y); y += 3.9;
  doc.text(`Adulto responsable: ${nombre} (${parentesco}) · RUT ${rut}`, IZQ, y); y += 3.9;
  doc.text(`Contacto del adulto responsable: ${email} · ${telefono}`, IZQ, y); y += 3.9;
  const lineasPrestador = doc.splitTextToSize(
    'Prestador: Juan Fernández, Psicólogo Clínico (Universidad Viña del Mar). RUT 17.520.730-9. RNPI N.° 876085. Inscrito en Fonasa MLE bajo códigos 09 08 101, 09 08 102, 09 08 103.',
    ANCHO
  );
  lineasPrestador.forEach((linea) => {
    doc.text(linea, IZQ, y);
    y += 3.9;
  });
  y += 2.5;

  // Texto del asentimiento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Texto del documento', IZQ, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const lineas = doc.splitTextToSize(TEXTO_ASENTIMIENTO, ANCHO);
  lineas.forEach((linea) => {
    doc.text(linea, IZQ, y);
    y += 3.3;
  });
  y += 3;

  // Declaracion del adulto responsable con checkboxes [X]
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Declaración del adulto responsable', IZQ, y);
  y += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  CHECKBOXES_ASENTIMIENTO.forEach((texto) => {
    const wrap = doc.splitTextToSize(texto, ANCHO - 8);
    doc.rect(IZQ, y - 2.8, 3.2, 3.2);
    doc.setLineWidth(0.4);
    doc.line(IZQ + 0.6, y - 1.4, IZQ + 1.3, y - 0.6);
    doc.line(IZQ + 1.3, y - 0.6, IZQ + 2.6, y - 2.4);
    doc.text(wrap, IZQ + 5.5, y);
    y += 3.5 * wrap.length + 0.6;
  });
  y += 2.5;

  // Firma del adulto responsable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Firma del adulto responsable', IZQ, y);
  y += 3.8;
  doc.addImage(firmaDataURL, 'PNG', IZQ, y, 50, 18);
  y += 21;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`${nombre} · RUT ${rut} · ${parentesco}`, IZQ, y);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text(`Documento generado el ${fechaLegible} · Zona horaria: ${zonaHoraria}`, IZQ, footerY);
  const hashCorto = `${hashDocumento.slice(0, 16)}...${hashDocumento.slice(-16)}`;
  doc.text(`Hash de integridad SHA-256: ${hashCorto}`, IZQ, footerY + 3);
  doc.text('psicologojuanfernandez.cl', IZQ, footerY + 6);

  return doc.output('blob');
}
