# Escena ambiental (C50)

Fondo de la seccion de biografia que refleja la hora local y el estado
atmosferico reales del visitante. Sin texto propio, sin botones, sin permisos
del navegador. La escena se revela de forma gradual al entrar la seccion en
pantalla y el texto adapta su color al polo de luminancia del cielo.

## Fuentes

| Dato | Origen | Costo | Permiso |
|---|---|---|---|
| Hora y posicion solar | Calculo local (NOAA) en `src/lib/solar.js` | 0 | ninguno |
| Ubicacion aproximada | `context.geo` de Netlify (MaxMind sobre IP) | 0 | ninguno |
| Estado atmosferico | MET Norway Locationforecast 2.0 | 0 | ninguno |

## Parametros usados

Disponibles globalmente segun el modelo de datos de MET (modelo ECMWF HRES,
resolucion aproximada 9 km, cuatro actualizaciones diarias):

`air_temperature`, `air_pressure_at_sea_level`, `cloud_area_fraction`,
`cloud_area_fraction_low`, `cloud_area_fraction_medium`,
`cloud_area_fraction_high`, `dew_point_temperature`, `fog_area_fraction`,
`relative_humidity`, `ultraviolet_index_clear_sky`, `wind_from_direction`,
`wind_speed`, `precipitation_amount`, `symbol_code`.

No disponibles fuera de la region nordica y por lo tanto no confiables en Chile:
`probability_of_thunder`, `wind_speed_of_gust`, `probability_of_precipitation`,
`precipitation_amount_max`, `precipitation_amount_min`. El codigo los lee si
llegan y no depende de ellos.

## Rango termico

Calibrado contra registros oficiales de la Direccion Meteorologica de Chile,
no contra promedios ni estimaciones.

| Extremo | Valor | Lugar | Fecha |
|---|---|---|---|
| Maxima absoluta | 42.2 C | Los Angeles, Biobio | enero de 2017 |
| Minima absoluta | -28.5 C | Balmaceda, Aysen | junio de 1958 |

Amplitud total: 70.7 grados. Todo el pipeline es metrico: temperatura en
grados Celsius nativos de MET Norway, viento en m/s, presion en hPa,
precipitacion en mm.

El eje termico no es lineal. Usa once tramos con umbrales climaticamente
significativos, entre ellos la helada extrema de estepa y altiplano, el
congelamiento, la media nacional anual de 13.06 C reportada por la DMC para
2025, y el umbral de ola de calor de la zona central.

### Por que la temperatura tiene un canal propio

Cinco grados dentro de un rango de 70.7 equivalen al 7 por ciento del eje.
Aplicados a una mezcla de color, eso da entre uno y tres niveles RGB, por
debajo del umbral de deteccion visual. El color por si solo no puede hacer
que -10 se lea distinto de -5. Es aritmetica, no falta de ajuste.

Por eso la temperatura controla ademas la cualidad visible del aire, un canal
independiente que no compite con la luz ni con la nubosidad:

| Fenomeno | Rango | Efecto |
|---|---|---|
| Polvo de diamante | bajo -2 C, aire seco | cristales suspendidos que centellean |
| Halo de cristales | bajo -5 C, cielo abierto | anillo alrededor del astro |
| Ondulacion termica | sobre 26 C | bandas que tiemblan sobre el horizonte |
| Polvo en suspension | sobre 24 C, aire seco | motas terracota a la deriva |

Ambos fenomenos frios son reales del aire muy frio y seco. La diferencia
medida entre -10 y -5 con el mismo cielo: la densidad de cristales pasa de
0.29 a 0.11, casi el triple, y el halo pasa de presente a ausente.

## Cobertura climatica

El vocabulario `symbol_code` de MET cubre las familias clearsky, fair,
partlycloudy, cloudy, fog, rain, sleet, snow, con prefijos light y heavy,
sufijos de dia, noche y crepusculo polar, variantes de chubasco y de tormenta.
Esto cubre el rango chileno completo: cielo despejado del norte, camanchaca
costera, lluvia central e invernal, lluvia persistente del sur, aguanieve,
nieve cordillerana y austral, y viento patagonico.

La camanchaca se refuerza con una inferencia propia: humedad relativa sobre
0.88 con punto de rocio pegado a la temperatura del aire.

## Privacidad

- La IP no se almacena en ningun momento.
- Las coordenadas se redondean a celdas de 0.25 grados (unos 28 km) antes de
  salir de la funcion. Esa celda es la unica clave de cache en Netlify Blobs.
- No se devuelve ciudad, region ni codigo postal al navegador.
- La escena nunca nombra ni sugiere la ubicacion del visitante.

Pendiente de Juan: agregar a la politica de privacidad una linea declarando que
el sitio deriva una ubicacion aproximada de nivel regional a partir de la
conexion, con el unico fin de ajustar un elemento visual, sin almacenamiento.

## Atribucion

MET Norway entrega sus datos bajo CC BY 4.0. La atribucion es obligatoria.
Va en el pie de pagina, no en la franja:

    Datos meteorologicos: MET Norway

## Modo fondo y contraste

Cuando la escena vive detras de texto, la luminancia deja de ser un canal
expresivo disponible.

Medicion sobre los estados reales con el rango completo de luminancia, tomando
como fondo el peor punto (cenit, horizonte y una nube brillante encima):

| Estado | Peor Ink | Peor Off-white | AA 4.5? |
|---|---|---|---|
| Mediodia despejado | 10.03 | 1.01 | si |
| Atardecer terracota | 1.78 | 2.09 | no |
| Amanecer | 1.05 | 2.28 | no |
| Nublado gris medio | 6.91 | 1.23 | si |
| Lluvia nocturna | 1.06 | 11.96 | si |
| Crepusculo nublado | 1.87 | 2.45 | no |

Tres de seis estados fallan, y son justamente los mas expresivos. Corregirlo
con un velo exige hasta 64 por ciento de opacidad, que borra la escena.

La solucion es desacoplar luminancia de tinte. `paletaFondo` fuerza la
luminancia a uno de dos polos seguros y traslada toda la expresion del estado
al tinte, la saturacion y la textura, que no afectan el contraste.

Umbrales calculados contra los dos colores de texto del sistema para alcanzar
7:1 (AAA): polo claro sobre 0.66 de luminancia relativa, polo oscuro bajo
0.075. La franja intermedia queda prohibida y la transicion entre polos ocurre
durante el crepusculo, que es cuando corresponde narrativamente.

Verificacion exhaustiva: 164.736 combinaciones de lugar, cielo, mes, hora y
temperatura. Peor contraste global 7.77:1. Cero estados bajo AA, cero estados
entre AA y AAA.

### Reglas de composicion

- Las credenciales no flotan sobre la escena. Van sobre superficie propia
  derivada del color del cenit, porque son el trust signal principal de la
  seccion y deben leerse igual en todo estado.
- La densidad de particulas en modo fondo es 0.34 de la que usaria una franja
  autonoma. Es atmosfera, no protagonista.
- El fondo no se desvanece al salir de pantalla: eso produciria parpadeo
  durante la lectura.

## Revelado ligado al scroll

Con soporte de `animation-timeline: view()` la opacidad avanza con la posicion
de scroll y corre en el compositor, sin trabajo en el hilo principal.
Soporte a la fecha: Chrome y Edge desde 115, Safari desde 26, Firefox aun
detras de bandera en estable. Cobertura global cerca del 83 por ciento.

El resto recibe una transicion de 1400 ms disparada por IntersectionObserver.
Mismo efecto, sin progresion continua. Con `prefers-reduced-motion` el fondo
aparece de inmediato y no se anima.

## Presupuesto de rendimiento

- Altura reservada con `clamp`, sin desplazamiento de layout.
- La franja vive bajo el pliegue y se monta con IntersectionObserver.
- Capa CSS de gradiente autosuficiente. Con `prefers-reduced-motion` el canvas
  no se monta.
- Canvas 2D: un solo nodo, DPR limitado a 1.5, 30 cuadros por segundo.
  Techos de particulas: precipitacion `min(ancho / 5.5, 200)`, cristales de
  hielo `min(ancho / 7, 130)`, polvo `min(ancho / 12, 70)`. Los tres canales
  son mutuamente excluyentes en la practica: no hay escarcha con lluvia ni
  polvo con frio.
- Pausa fuera de viewport y con la pestana oculta.
- Degradacion adaptativa: si el tiempo medio de cuadro supera 1.6 veces el
  objetivo, baja la densidad; si persiste, apaga el canvas y deja la capa CSS.

## Verificacion post despliegue

1. PageSpeed sobre la home, protocolo de mediana de tres corridas separadas
   cinco minutos, esperando que el cache de Netlify se asiente.
2. INP y CLS en CrUX cuando haya campo suficiente.
3. Umami: comparar profundidad de scroll y tasa de clic a Cal.com contra la
   linea base de las cuatro semanas previas.


## Auditoria automatica

 rasteriza la escena con node-canvas y verifica
tres invariantes sobre cada combinacion de lugar, cielo, hora y temperatura:

1. **Ningun estado quieto.** Movimiento minimo del 0.12 por ciento del lienzo
   entre dos capturas separadas dos segundos.
2. **Movimiento repartido.** Presente en al menos 3 de las 4 franjas
   horizontales, para que sea el fondo de la seccion y no una cenefa.
3. **Contraste real.** 7:1 medido sobre los pixeles compuestos despues del
   velo, no sobre el color teorico del cenit.
4. **Sin bordes visibles.** Ninguna racha de saltos de color alineados mayor a
   40 pixeles. Una particula produce rachas cortas; un borde mal difuminado
   produce una linea recta larga.

### El velo se compone por producto, no por partes

Componerlo como rectangulo opaco mas bandas laterales mas esquinas radiales
dejaba costuras: en el borde de una banda el valor seguia opaco mientras la
radial de la esquina ya decaia, y el salto se veia como un marco rectangular
sobre la escena. Ahora se pinta el perfil horizontal sobre toda la superficie
y se aplica el vertical con destination-in, que multiplica los canales alfa.
El resultado es continuo por construccion. Se cachea en su propia superficie
porque solo depende del tamano, la caja de texto y la paleta.

Ultima corrida: 104 combinaciones, 0 fallos.
Movimiento minimo 0.868 por ciento, contraste minimo 7.34:1.

Requiere 
up to date, audited 41 packages in 1s

12 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities. No forma parte del build.

### Canales que garantizan movimiento

| Canal | Cuando aparece |
|---|---|
| Brisa | siempre, densidad inversa a los demas canales |
| Aves | cielo abierto, de dia, sin lluvia fuerte |
| Estrella fugaz | noche despejada, cada 18 a 45 segundos |
| Estrellas | noche, con centelleo |
| Nubes | cobertura mayor a cero, en tres capas con parallax |
| Precipitacion | segun symbol_code |
| Escarcha y polvo | segun temperatura |
