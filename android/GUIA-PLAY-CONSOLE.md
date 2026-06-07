# Guía C22: publicar la app Android en Google Play (solo Chile)

Esta guía va en formato **acción / dónde / qué esperar**. Sigue los bloques en orden.
La app es un envoltorio TWA: muestra el sitio en vivo. No requiere reconstruir el AAB
para cambios de contenido, precios o copy. Solo los cambios de cáscara piden AAB nuevo
(ver el bloque M al final).

Package name permanente e inmutable una vez publicado: `cl.psicologojuanfernandez.app`.

---

## A. Confirmaciones previas (hazlas antes de generar nada)

1. **Host del TWA.** El `twa-manifest.json` usa `psicologojuanfernandez.cl` (dominio raíz,
   el mismo del canonical del sitio). Verifica cuál sirve Netlify como principal.
   - Acción: abre en el navegador `https://psicologojuanfernandez.cl/.well-known/assetlinks.json`
     y luego `https://www.psicologojuanfernandez.cl/.well-known/assetlinks.json`.
   - Qué esperar: el archivo debe responder **200 y como JSON**, sin redirección 301.
     Un redirect entre raíz y www rompe la verificación del dominio.
   - Si el principal es `www`, cambia `host`, `iconUrl`, `maskableIconUrl`, `webManifestUrl`
     y `fullScopeUrl` del `twa-manifest.json` a la versión con `www` antes del primer build.

2. **Cuenta de desarrollador.** El gate de testers (12 testers, 14 días) aplica, porque
   ninguna de tus cuentas tenía el perfil de Play Console creado antes del 13 de noviembre de 2023.
   Lo resolvemos en el bloque H.

---

## B. Crear la clave de firma (una sola vez, sin instalar nada)

Requisito antes de empezar: estos workflows ya deben estar en el repositorio (los trae este
paquete C22). Si la pestaña Actions muestra la pantalla "Get started with GitHub Actions" con
tarjetas sugeridas, es que los archivos aún no se aplicaron: aplica primero el zip de C22 y
recarga Actions. Recién entonces verás los dos workflows en la lista de la izquierda.

1. Crea un token. Entra a github.com. Arriba a la derecha, clic en tu foto, luego Settings.
   En el menú izquierdo baja del todo hasta Developer settings. Clic en Personal access tokens,
   luego Fine-grained tokens. Botón Generate new token. Nombre `bootstrap`. Expiration: 7 days.
   Repository access: marca "Only select repositories" y elige el repositorio de tu sitio.
   Permissions: abre Repository permissions, busca **Secrets** y ponlo en "Read and write".
   Baja y clic en Generate token.
   Qué esperar: aparece un texto que empieza por `github_pat_`. Cópialo entero ahora, después
   no se vuelve a mostrar.
2. Guarda el token como secret. Ve al repositorio de tu sitio, pestaña Settings (la del
   repositorio, no la de tu cuenta). Menú izquierdo: Secrets and variables, luego Actions.
   Botón New repository secret. Name exactamente `BOOTSTRAP_TOKEN`. Secret: pega el texto.
   Clic en Add secret.
   Qué esperar: `BOOTSTRAP_TOKEN` aparece en la lista.
3. Corre el workflow. Pestaña Actions. En la lista izquierda, clic en
   "Bootstrap keystore (una sola vez)". A la derecha, botón "Run workflow", y otra vez
   "Run workflow" en el desplegable.
   Qué esperar: en uno o dos minutos queda con un visto verde. Si queda en rojo, abre la
   ejecución y revisa el paso que falló.
4. Descarga el respaldo. Entra a esa ejecución en verde, baja hasta Artifacts y descarga
   `keystore-backup`. Es un zip con `android.keystore` y `passwords.txt`. Guarda ambos en tu
   gestor de contraseñas o en un lugar cifrado.
   Qué esperar: el artifact se borra solo a las 24 horas, así que bájalo el mismo día.
5. Comprueba los secrets. En Settings, Secrets and variables, Actions.
   Qué esperar: existen cuatro secrets nuevos: `UPLOAD_KEYSTORE_BASE64`,
   `UPLOAD_KEYSTORE_PASSWORD`, `UPLOAD_KEY_PASSWORD` y `UPLOAD_KEY_ALIAS`.
6. Borra `BOOTSTRAP_TOKEN`. En esa misma lista, al lado del secret, clic en el tacho y confirma.
   Qué esperar: ya no aparece. Ya no se necesita.

Nota sobre el botón "Run workflow": solo se muestra cuando el archivo del workflow está en la
rama por defecto del repositorio (la que despliega Netlify, normalmente `main`). Si no aparece,
confirma que el push dejó `.github/workflows/bootstrap-keystore.yml` en esa rama.

Por qué así: la clave de firma nunca toca tu equipo ni se versiona. Vive como secret cifrado.
Como usaremos Play App Signing (bloque F), esta clave es la **upload key**: si la pierdes,
Google puede resetearla. La clave de firma real la custodia Google.

---

## C. Primer build del AAB

1. Acción: corre el build. Dónde: Actions, "Android build (AAB firmado)", Run workflow,
   versionName `1.0.0`. Qué esperar: termina en verde y crea un Release `android-v1.0.0-N`
   con un archivo `.aab` adjunto.
2. Acción: descarga el `.aab` del Release. Qué esperar: es el binario que subirás a Play.

Por qué el binario vive en Releases y no en artifacts: los Releases persisten, tienen URL estable
y el workflow poda solos los antiguos dejando los 3 más recientes.

---

## D. Crear la app en Play Console

1. Acción: paga la cuota única de desarrollador (25 USD) y completa la verificación de identidad.
   Dónde: play.google.com/console. Qué esperar: cuenta personal activa.
2. Acción: crea la app. Dónde: Play Console, Create app. Nombre `Psicólogo Juan Fernández`,
   idioma por defecto español (Chile), tipo App, gratuita. Qué esperar: la app aparece en el panel.

---

## E. Subir el AAB a Closed Testing (manual)

La primera subida es manual a propósito: la API de Play no puede crear apps nuevas, y para una
sola consulta no compensa montar una cuenta de servicio. Lo evaluamos como mejora futura.

1. Acción: ve a Test and release, Testing, Closed testing, crea una pista (track) nueva.
   Qué esperar: una pista lista para recibir releases.
2. Acción: Create new release, sube el `.aab`. Qué esperar: Play procesa el bundle.
   Verás un aviso de que activó **Play App Signing**: acéptalo.

---

## F. Activar Play App Signing y copiar la huella SHA-256

Este es el punto donde más gente falla. La huella que va en `assetlinks.json` debe ser la de la
**clave de firma de la app** que custodia Google, **no** la de la clave de subida.

1. Acción: ve a Test and release, Setup, App integrity, App signing.
   Qué esperar: ves dos certificados. Copia el **SHA-256 del "App signing key certificate"**.
   No copies el del "Upload key certificate".

---

## G. Pegar la huella en assetlinks.json y volver a desplegar

1. Acción: abre `public/.well-known/assetlinks.json`. Hoy el arreglo `sha256_cert_fingerprints`
   está vacío. Pega dentro la huella copiada en F, en mayúsculas, entre comillas. Debe quedar así:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "cl.psicologojuanfernandez.app",
         "sha256_cert_fingerprints": ["AA:BB:CC:...:99"]
       }
     }
   ]
   ```

2. Acción: aplica el cambio por el flujo normal del proyecto (Claude Desktop, pestaña Code, con el zip)
   y deja que Netlify despliegue. Qué esperar: en
   `https://psicologojuanfernandez.cl/.well-known/assetlinks.json` ya se ve la huella, como JSON, sin redirect.
3. Acción: valida. Dónde: pega tu dominio y el package name en el verificador oficial
   `https://developers.google.com/digital-asset-links/tools/generator`. Qué esperar: "success".

Orden importante: primero subes el AAB (E), luego Google te da la huella (F), luego la pegas (G).
Antes de eso la app mostraría la barra de URL del navegador. No es un error, es el orden natural.

---

## H. Testers (12 / 14 días) y distribución solo Chile

El gate aplica. La pista que cuenta es **Closed testing**, no Internal testing.

1. Acción: reúne 12 personas con un teléfono Android y una cuenta de Gmail. Sirven familiares,
   colegas y conocidos. Pídeles que instalen y **mantengan instalada** la app 14 días seguidos.
   Qué esperar: el reloj de 14 días arranca cuando el release está aprobado y hay 12 personas dentro.
2. Acción: en la pista de Closed testing, Testers, crea una lista de correos con sus 12 Gmail y
   comparte el enlace de aceptación (opt in). Qué esperar: cada tester acepta desde ese enlace.
3. Acción: configura el país. Dónde: en la pista, Countries / regions, deja **solo Chile**.
   Repite lo mismo en Production cuando llegues a ese paso. Qué esperar: la app solo se ofrece en Chile.

Nota honesta: existen servicios pagados de testers. Google rechaza la solicitud de producción si
detecta participación falsa o inactiva, así que conviene gente real que de verdad abra la app.

---

## I. Data Safety y política de privacidad

1. Acción: declara la URL de privacidad. Dónde: Policy, App content, Privacy policy.
   Usa `https://psicologojuanfernandez.cl/politica-privacidad`. Qué esperar: aceptada.
   Esa página ya cita Ley 19.628 y Ley 21.719. Revisa que mencione qué datos trata el sitio.
2. Acción: completa el formulario Data Safety. Dónde: Policy, App content, Data safety.
   Declara con honestidad según lo que hace el sitio: se recogen nombre y correo para gestionar
   la hora (a través de la agenda), la conexión va cifrada en tránsito, y no se comparten datos
   con terceros con fines publicitarios. El pago y la videollamada ocurren en plataformas externas.
   Encuadra todo en Ley 21.719 (vigencia plena el 1 de diciembre de 2026) y Ley 21.541 de telemedicina.
   No uses marcos de privacidad extranjeros: no aplican en Chile.
3. Acción: elige categoría. Dónde: Store settings, App category. Usa **Medicina**.
   Qué esperar: puede pedir una breve justificación del rol clínico.

---

## J. Ficha de la tienda (store listing) y textos optimizados

Activos listos en `android/store/`:
- `play-icon-512.png`: ícono de 512 con la marca a sangre, zona segura respetada.
- `play-feature-graphic-1024x500.png`: gráfico destacado de marca.

Screenshots: Play prefiere capturas reales. Acción: instala la app desde la pista de Closed testing
en tu teléfono y captura 2 a 8 pantallas verticales (mínimo 1080 px de lado corto). Qué esperar:
se ve el sitio real dentro de la app, sin barra de URL una vez verificada.

Textos sugeridos (optimizados para que el clic lleve a agendar):

- **Título** (30): `Psicólogo Juan Fernández`
- **Descripción breve** (80): `Terapia psicológica online con bono Fonasa o particular. Sesiones de 45 minutos.`
- **Descripción completa**:

  ```
  Atención psicológica clínica online, por videollamada, desde la comodidad de tu hogar.

  Atiende Juan Fernández, psicólogo clínico titulado, con enfoque integrativo que combina
  terapia cognitivo conductual y psicología narrativa, para adultos.

  Modalidades:
  - Bono Fonasa (copago 5.570 pesos) para afiliados de tramos B, C y D.
  - Particular (15.000 pesos).
  Misma duración y dedicación en ambas: 45 minutos por sesión.

  Cómo funciona:
  1. Agenda tu hora desde la app.
  2. Recibes el enlace de la videollamada.
  3. Te conectas desde el navegador, sin instalar nada.

  La plataforma de videollamadas está certificada por Fonasa y la conexión va cifrada en tránsito.
  Atención para todo Chile.
  ```

Por qué este copy: la descripción breve es lo que más se lee, así que lleva el precio y la duración,
los dos datos que más reducen la fricción antes de agendar. Sin testimonios (norma del Colegio de 1999).

---

## K. Solicitar acceso a producción

1. Acción: cuando lleves 14 días con 12 testers activos, ve al Dashboard de Play Console y pulsa
   "Apply for production access". Qué esperar: Google revisa la calidad del testeo y puede tardar
   varios días. Responde las preguntas sobre el proceso de testeo con datos reales.
2. Acción: ya con acceso, crea un release en Production con el mismo AAB, país solo Chile.
   Qué esperar: la app queda pública en Chile.

---

## L. Publicación automática vía API (opcional, a futuro)

Para una sola consulta no compensa hoy. Si más adelante actualizas la cáscara seguido, se puede
añadir publicación automática con una cuenta de servicio de Google Cloud y la acción
`r0adkll/upload-google-play`. Requiere que la app ya exista en Play (por eso la primera subida es
manual) y que el dueño de la cuenta enlace la cuenta de servicio con permiso de gestor de releases.

---

## M. Mantenimiento: qué pide AAB nuevo y qué no

**No piden AAB nuevo** (solo Netlify, la app lo muestra en vivo al instante):
- Contenido, textos, copy, precios, preguntas frecuentes.
- SEO, metadatos, imágenes, páginas nuevas.
- Ajustes de diseño del sitio.

**Sí piden AAB nuevo** (correr "Android build" con un versionName mayor y volver a subir a Play):
- Nombre de la app o ícono de lanzador.
- Package name (no se debe cambiar nunca tras publicar).
- Target SDK por exigencia anual de Play.
- Cambios en `twa-manifest.json` (colores de tema, splash, configuración del TWA).

Regla práctica: si cambia lo que se ve dentro del sitio, es Netlify. Si cambia la cáscara, es AAB nuevo.
