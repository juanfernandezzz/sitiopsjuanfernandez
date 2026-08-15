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
  particular: { display: '$20.000', clp: 20000, montoWebpay: '20000' },
};
