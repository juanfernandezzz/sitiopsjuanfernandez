/**
 * Forzar descarga de un Blob como archivo local.
 *
 * Vive en archivo separado de generarPDFConsentimiento.js a propósito:
 * la generación de PDF requiere jsPDF (~50KB gzipped), que se carga
 * dinámicamente en submit. PantallaExito necesita SOLO esta función
 * y se importa de forma estática, por eso vive aquí: así el bundle
 * inicial de consentimiento.html no arrastra jsPDF.
 */

export function descargarPDF(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
