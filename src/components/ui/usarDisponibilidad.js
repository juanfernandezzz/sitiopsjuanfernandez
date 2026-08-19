/**
 * Acceso del cliente a la disponibilidad en vivo.
 *
 * POR QUE VIVE AQUI Y NO EN src/lib
 *   src/lib/ es contenido puro que se sincroniza hacia la app nativa: nada de
 *   red, nada de DOM. La llamada a la funcion de Netlify es un detalle del
 *   cliente web, asi que vive del lado de los componentes.
 *
 * POR QUE UNA PROMESA MEMOIZADA
 *   En una misma carga conviven varias superficies que necesitan el mismo dato
 *   (pildora del hero, modulo de la seccion Agendar, chips del modal, barra fija
 *   de movil y, desde C51, el boton flotante de WhatsApp). Sin memoizar, cada
 *   una dispararia su propio fetch a la funcion. La promesa se guarda a nivel de
 *   modulo: una peticion por carga de pagina, sin importar cuantos consumidores
 *   se monten.
 */
import { useEffect, useState } from 'react';
import { normalizar } from '../../lib/disponibilidad';

let promesa = null;

/** Promesa compartida con la respuesta cruda (o null si la red falla). */
export function cargarDisponibilidad() {
  if (!promesa) {
    promesa = fetch('/.netlify/functions/disponibilidad')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return promesa;
}

/**
 * Devuelve los datos ya normalizados para un evento, o null mientras no hayan
 * llegado. El null inicial es deliberado: el prerender compara bytes entre dos
 * renders, asi que el primer render no puede depender de datos de red.
 */
export function usarDisponibilidad(evento) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vivo = true;
    cargarDisponibilidad().then((p) => {
      if (vivo) setDatos(normalizar(p, evento));
    });
    return () => {
      vivo = false;
    };
  }, [evento]);

  return datos;
}
