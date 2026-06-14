# Publicar la app en Google Play

Guía paso a paso para llevar la app de Expo a Google Play. Cada paso indica la
acción, dónde se hace y el resultado que debes ver. Sigue el orden.

## Contexto y supuestos

- La app NO cambia su capa nativa en este ciclo (no hay módulos nativos nuevos,
  ni permisos, ni bump de SDK). La foto del inicio viaja como recurso empaquetado
  por OTA. Por eso `runtimeVersion` sigue en `"1.0.1"` en `app/app.json`. No lo
  cambies.
- `versionCode` de Android lo sube EAS solo, porque el perfil `production` de
  `app/eas.json` tiene `autoIncrement: true`. No tienes que tocarlo a mano.
- La versión visible (`version` en `app/app.json`) puede quedarse en `"1.0.0"`
  para esta primera subida.
- Tu cuenta de desarrollador es personal y se creó después del 13 de noviembre
  de 2023. Por eso Google exige una fase de prueba cerrada: al menos 12 testers
  aceptados y 14 días seguidos de prueba antes de poder publicar en producción.

## Antes de empezar (una sola vez)

1. Crea tu cuenta de desarrollador en Play Console.
   - Dónde: https://play.google.com/console
   - Acción: regístrate con tu cuenta de Google y paga la cuota única de
     registro (25 USD).
   - Resultado: ves el panel de Play Console con tu cuenta activa.

2. Confirma que tienes EAS CLI y sesión iniciada.
   - Dónde: terminal, en la carpeta `app/`.
   - Acción: ejecuta `npx eas-cli whoami`. Si no estás autenticado, ejecuta
     `npx eas-cli login`.
   - Resultado: el comando muestra tu usuario de Expo.

## Paso 1: construir el AAB de producción

1. Genera el App Bundle firmado.
   - Dónde: terminal, en `app/`.
   - Acción: ejecuta `npx eas-cli build --platform android --profile production`.
     Cuando pregunte por la firma, deja que EAS gestione el keystore (ya tienes
     credenciales gestionadas por EAS).
   - Resultado: al terminar, EAS te da un enlace al `.aab`. Guárdalo.

## Paso 2: crear la app y subir el AAB

Tienes dos caminos. El A es el más simple.

### Camino A: subida automática con EAS

1. Acción: ejecuta `npx eas-cli submit --platform android --profile production`.
   Sigue las instrucciones para vincular tu cuenta de servicio de Google Play la
   primera vez (EAS te guía con el enlace exacto en Play Console).
2. Resultado: el AAB queda subido como borrador en Play Console.

### Camino B: subida manual

1. Crea la app.
   - Dónde: Play Console, botón "Crear app".
   - Acción: nombre `Psicólogo Juan Fernández`, idioma por defecto español
     (Chile), tipo App, gratis.
   - Resultado: entras a la ficha de la app nueva.
2. Sube el AAB.
   - Dónde: Play Console, menú lateral, "Pruebas" o "Producción", pestaña
     "Versiones".
   - Acción: crea una versión y arrastra el `.aab` que generó EAS.
   - Resultado: la versión muestra el `versionCode` y queda lista para revisar.

## Paso 3: completar "Contenido de la app"

Esta sección es obligatoria para publicar. Dónde: Play Console, menú lateral,
"Contenido de la app" (o "Política").

1. Política de privacidad.
   - Acción: pega la URL `https://psicologojuanfernandez.cl/politica-privacidad`.
   - Resultado: queda guardada y validada.
2. Seguridad de los datos.
   - Acción: completa el formulario. La app no recoge ni comparte datos del
     usuario dentro de la app (el agendamiento ocurre en Cal.com, en el navegador;
     la videollamada en Doxy.me). Declara con honestidad qué datos se manejan en
     esos flujos externos y marca el cifrado en tránsito.
   - Resultado: el cuestionario queda completo.
3. Anuncios.
   - Acción: declara que la app NO contiene anuncios.
   - Resultado: guardado.
4. Clasificación de contenido (IARC).
   - Acción: responde el cuestionario. Es una app de salud y bienestar, sin
     contenido sensible.
   - Resultado: recibes la clasificación por edad.
5. Público objetivo y contenido.
   - Acción: marca el rango de edad adulto. La app no está dirigida a menores.
   - Resultado: guardado.
6. App de noticias, app COVID y otras declaraciones.
   - Acción: marca que NO aplica.
   - Resultado: cada sección queda en verde.

## Paso 4: ficha de Play Store

Dónde: Play Console, "Presencia en Play Store", "Ficha de Store principal".

1. Textos.
   - Acción: escribe el nombre, una descripción breve y una descripción
     completa. Mantén la voz de marca: terapia online en Chile, sesiones de 45
     minutos por videollamada, con bono Fonasa o particular. No prometas
     resultados clínicos.
   - Resultado: textos guardados.
2. Gráficos.
   - Acción: sube el ícono y el gráfico destacado. Ya los tienes en
     `app/store/play-icon-512.png` (512x512) y
     `app/store/play-feature-graphic-1024x500.png` (1024x500). Agrega además al
     menos 2 capturas de teléfono.
   - Resultado: la ficha muestra los gráficos sin advertencias.

## Paso 5: prueba cerrada (el requisito de los 12 testers)

Dónde: Play Console, "Pruebas", "Prueba cerrada".

1. Crea una pista de prueba cerrada y asóciale la versión con tu AAB.
2. Crea una lista de correos con al menos 12 personas y mándales el enlace de
   aceptación.
   - Resultado esperado: 12 o más testers aceptan la invitación e instalan la
     app.
3. Mantén la prueba activa durante 14 días seguidos.
   - Resultado esperado: el contador de Play Console confirma los 14 días con el
     mínimo de testers cumplido.

## Paso 6: pasar a producción

1. Acción: cuando Play Console confirme que cumpliste el requisito, solicita el
   acceso a producción y crea la versión de producción con el mismo AAB (o uno
   nuevo si subiste cambios).
2. Resultado: la app entra en revisión de Google. Tras la aprobación, queda
   publicada.

## Actualizaciones después de publicar (OTA)

- Los cambios que son solo de JavaScript o de datos compartidos (textos,
  pantallas, estilos) se envían sin recompilar con
  `npx eas-cli update --channel production`.
- El `runtimeVersion` del update debe coincidir con el del build instalado
  (`"1.0.1"`). Si algún ciclo futuro toca la capa nativa (módulo nativo nuevo,
  permiso, bump de SDK, ícono empaquetado), ahí sí subes `runtimeVersion`,
  recompilas el AAB y vuelves a subir a Play.

## Opcional: enlace de la app con el dominio (assetlinks.json)

- Para que ciertos enlaces de `psicologojuanfernandez.cl` abran la app, se sube
  un archivo `assetlinks.json` con la huella SHA-256 de la firma. Esa huella la
  entrega Play una vez que la app está firmada por Google Play (App Signing).
- Por eso este paso se hace DESPUÉS de la primera publicación, cuando ya tienes
  la huella en Play Console. No es necesario para publicar. La regla de cabecera
  para `/.well-known/assetlinks.json` ya existe en `netlify.toml`; solo falta el
  archivo con la huella real cuando llegue el momento.
