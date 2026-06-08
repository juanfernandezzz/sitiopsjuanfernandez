import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { calFullUrl } from '@contenido/cal';

// Abre Cal.com en un navegador dentro de la app: mantiene el contexto y el
// regreso es de un toque. El canal de reserva es el siempre disponible.
export const abrirAgenda = (slug) => WebBrowser.openBrowserAsync(calFullUrl(slug));
export const abrirUrl = (url) => Linking.openURL(url);
