/**
 * Validadores y normalizadores para el formulario de consentimiento.
 *
 * Cada función validar* retorna { valido: boolean, error?: string, normalizado?: string }.
 * Las funciones normalizar* son puras y nunca lanzan; devuelven el input intacto
 * si no logran normalizar (la validación se encarga del error).
 */

export function validarNombre(s) {
  const trimmed = (s || '').trim();
  if (trimmed.length < 5) {
    return { valido: false, error: 'El nombre debe tener al menos 5 caracteres' };
  }
  if (!trimmed.includes(' ')) {
    return { valido: false, error: 'Ingresa nombre y apellido' };
  }
  return { valido: true };
}

export function normalizarRUT(s) {
  const limpio = (s || '').replace(/[^\dkK]/g, '').toUpperCase();
  if (limpio.length < 2) return s;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoConPuntos}-${dv}`;
}

export function validarRUT(s) {
  const limpio = (s || '').replace(/[^\dkK]/g, '').toUpperCase();
  if (limpio.length < 8 || limpio.length > 9) {
    return { valido: false, error: 'RUT inválido' };
  }
  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalculado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

  if (dvCalculado !== dvIngresado) {
    return { valido: false, error: 'Dígito verificador incorrecto' };
  }
  return { valido: true, normalizado: normalizarRUT(s) };
}

export function validarEmail(s) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test((s || '').trim())) {
    return { valido: false, error: 'Email inválido' };
  }
  return { valido: true };
}

export function normalizarTelefono(s) {
  const digitos = (s || '').replace(/\D/g, '');
  if (digitos.startsWith('56') && digitos.length === 11) {
    return `+56 ${digitos[2]} ${digitos.slice(3, 7)} ${digitos.slice(7)}`;
  }
  if (digitos.length === 9 && digitos.startsWith('9')) {
    return `+56 ${digitos[0]} ${digitos.slice(1, 5)} ${digitos.slice(5)}`;
  }
  return s;
}

export function validarTelefono(s) {
  const digitos = (s || '').replace(/\D/g, '');
  if (digitos.length === 9 && digitos.startsWith('9')) {
    return { valido: true, normalizado: normalizarTelefono(s) };
  }
  if (digitos.length === 11 && digitos.startsWith('569')) {
    return { valido: true, normalizado: normalizarTelefono(s) };
  }
  return { valido: false, error: 'Teléfono inválido (debe ser +56 9 XXXX XXXX)' };
}
