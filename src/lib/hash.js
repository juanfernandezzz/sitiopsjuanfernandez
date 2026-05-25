/**
 * Hash SHA-256 vía Web Crypto API.
 * Requiere contexto seguro (https o localhost). En producción siempre OK.
 *
 * Se usa como fingerprint de integridad del consentimiento firmado.
 * NO se almacena la firma completa en el hash; solo metadata + longitud.
 */

export async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
