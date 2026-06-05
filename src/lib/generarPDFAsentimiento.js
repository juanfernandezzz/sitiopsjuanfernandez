/**
 * Generador del PDF firmado del asentimiento informado (menores de 18).
 *
 * Mismo patron que generarPDFConsentimiento: jsPDF con Helvetica (soporta
 * tildes y enie), import dinamico, cero em-dashes y en-dashes. El firmante
 * legal es el adulto responsable.
 */

import { TEXTO_ASENTIMIENTO, CHECKBOXES_ASENTIMIENTO } from './textoAsentimiento';

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
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const fechaLegible = new Date(fechaISO).toLocaleString('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: zonaHoraria,
  });

  let y = 20;

  // HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'Asentimiento Informado y Autorización: Atención Psicológica Online (Menores de 18)',
    105,
    y,
    { align: 'center', maxWidth: 170 }
  );
  y += 12;

  doc.setDrawColor(63, 91, 74);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${fechaLegible}`, 20, y);
  y += 10;

  // Datos del adolescente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Datos del adolescente', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${adolescenteNombre}`, 20, y); y += 5;
  doc.text(`Edad: ${adolescenteEdad} años`, 20, y); y += 10;

  // Datos del adulto responsable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Adulto responsable', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${nombre}`, 20, y); y += 5;
  doc.text(`Parentesco o calidad: ${parentesco}`, 20, y); y += 5;
  doc.text(`RUT: ${rut}`, 20, y); y += 5;
  doc.text(`Email: ${email}`, 20, y); y += 5;
  doc.text(`Teléfono: ${telefono}`, 20, y); y += 10;

  // Prestador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Prestador', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Nombre: Juan Fernández', 20, y); y += 5;
  doc.text('RUT: 17.520.730-9', 20, y); y += 5;
  doc.text('Registro Nacional Prestadores Individuales (RNPI): 876085', 20, y); y += 5;
  doc.text('Psicólogo Clínico, Universidad Viña del Mar', 20, y); y += 5;
  doc.text('Inscrito en Fonasa MLE bajo códigos 09 08 101, 09 08 102, 09 08 103', 20, y); y += 10;

  // Texto del asentimiento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Texto del documento', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const lineas = doc.splitTextToSize(TEXTO_ASENTIMIENTO, 170);
  lineas.forEach((linea) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(linea, 20, y);
    y += 5;
  });
  y += 5;

  // Declaracion del adulto responsable con checkboxes [X]
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Declaración del adulto responsable', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  CHECKBOXES_ASENTIMIENTO.forEach((texto) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.rect(20, y - 3.5, 4, 4);
    doc.setLineWidth(0.4);
    doc.line(20.8, y - 1.8, 21.7, y - 0.8);
    doc.line(21.7, y - 0.8, 23.3, y - 2.9);
    const wrap = doc.splitTextToSize(texto, 160);
    doc.text(wrap, 27, y);
    y += 6 * wrap.length;
  });
  y += 6;

  // Firma del adulto responsable
  if (y > 220) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Firma del adulto responsable', 20, y);
  y += 6;
  doc.addImage(firmaDataURL, 'PNG', 20, y, 70, 28);
  y += 32;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${nombre} · RUT ${rut} · ${parentesco}`, 20, y);
  y += 5;

  // Footer
  const pageHeight = 297;
  const footerY = pageHeight - 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Documento generado el ${fechaLegible} · Zona horaria: ${zonaHoraria}`, 20, footerY);
  const hashCorto = `${hashDocumento.slice(0, 16)}...${hashDocumento.slice(-16)}`;
  doc.text(`Hash de integridad SHA-256: ${hashCorto}`, 20, footerY + 4);
  doc.text('psicologojuanfernandez.cl', 20, footerY + 8);

  return doc.output('blob');
}
