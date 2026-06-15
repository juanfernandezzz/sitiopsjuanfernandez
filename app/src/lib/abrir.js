import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { calFullUrl } from '@contenido/cal';

// Reserva embebida: en vez de abrir Cal.com en un navegador externo (barra y X),
// navega a la pantalla /reservar, que muestra el MISMO widget de Cal contenido
// dentro de la app (react-native-webview). El slug viaja como parametro.
export const abrirAgenda = (slug) =>
  router.push({ pathname: '/reservar', params: { slug } });

// Fallback explicito: solo lo usa /reservar si el embed no carga, para no dejar
// nunca al usuario sin via de reserva. Abre Cal.com en el navegador del sistema.
export const abrirAgendaExterno = (slug) => WebBrowser.openBrowserAsync(calFullUrl(slug));

export const abrirUrl = (url) => Linking.openURL(url);
