const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// La app comparte repo con el sitio. Priorizamos el node_modules de la app como
// raíz de resolución para no tomar por error las dependencias del sitio (otra
// versión de React): react 19 vive en app/node_modules y se encuentra antes de
// llegar al node_modules de la raíz del repo.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// Mantenemos la búsqueda jerárquica activa (default de Metro). Con npm, los
// paquetes que declaran peerDependencies sobre react-native/expo (p. ej.
// @react-native/virtualized-lists o expo-asset) quedan anidados bajo su par en
// lugar de hoisteados; Metro debe poder resolverlos caminando hacia arriba.

module.exports = config;
