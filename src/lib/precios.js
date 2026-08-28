/**
 * Fuente única de los montos de atención. Consumido por el sitio y por la app.
 *
 * Antes estos números estaban repetidos a mano en varios componentes; al
 * centralizarlos, el precio no puede derivar entre superficies (un precio
 * distinto en el sitio y en la app sería un golpe directo a la confianza).
 *
 *  - display: string listo para mostrar, formato chileno con punto de miles.
 *  - clp: entero, por si se necesita cálculo.
 *  - montoWebpay: string crudo que espera el campo oculto de WebPay (sin signo ni punto).
 *
 * C49: el particular sube de $15.000 a $20.000. El monto vivía además dentro
 * del slug del evento de Cal.com; ese slug se renombró sin número para que un
 * cambio de precio futuro no vuelva a tocar una URL pública.
 */
export const PRECIOS = {
  fonasaCopago: { display: '$5.570', clp: 5570 },
  // C52e: montoWebpay se pone al dia con el precio. Juan corrigio el formulario
  // 388212 en Transbank y ahora cobra $25.000 con el mismo idFormulario.
  //
  // No sabemos si ese formulario esta en modo monto fijo (ignora el campo que le
  // manda el sitio) o monto variable (lo usa). '25000' es correcto en los dos
  // casos, por eso se cambia igual. Pero la diferencia importa para el futuro:
  // si es fijo, cambiar el precio aca NO cambia lo que se cobra y hay que
  // editarlo tambien en Transbank; si es variable, basta con esta linea. Mientras
  // no se sepa, cualquier cambio de precio tiene que tocar los dos lados.
  particular: { display: '$25.000', clp: 25000, montoWebpay: '25000' },
};
