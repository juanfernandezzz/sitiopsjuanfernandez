# C50 fix 1

Dos defectos reportados tras el despliegue, mas una salvedad sobre el auditor.

## 1. El fondo quedaba estatico tras desplazarse un rato

Dos causas independientes, ambas en `FondoAmbiental.jsx`.

**El motor se recreaba sin escena.** Al salir la seccion del viewport el
efecto se limpia y el motor se destruye. Al volver a entrar se crea uno nuevo,
pero el efecto que le entrega la escena depende de `[escena, paleta, ahora]`:
si esos valores no cambiaron entre medias, no se dispara. El motor nuevo se
quedaba sin escena, `cuadro()` retornaba de inmediato y solo quedaba visible
el degradado CSS.

Corregido: la escena se entrega al motor en el mismo momento de crearlo,
leyendo de referencias vivas.

**La degradacion adaptativa se disparaba con el scroll.** Promediaba 45
cuadros seguidos. Durante un desplazamiento el hilo principal esta saturado y
ese promedio se dispara, de modo que la degradacion se activaba por el scroll
y no por el dispositivo. Dos reducciones seguidas apagaban el lienzo de forma
permanente, sin via de vuelta.

Corregido en tres frentes: se usa la MEDIANA en vez del promedio, no se mide
mientras hay desplazamiento en curso ni en los 400 ms siguientes, y la
degradacion es reversible: si el dispositivo sostiene el ritmo durante varias
ventanas, la densidad vuelve a subir.

## 2. Bordes duros arriba y abajo de la seccion

La seccion cortaba a plomo contra el resto de la pagina. De noche el cielo es
tinta y el sitio es crema, y el salto se leia como una banda pegada encima del
diseño en vez de como parte de el.

Corregido con una mascara de fundido en los extremos, resuelta en el
compositor y por lo tanto sin costo por cuadro. Su altura,
`clamp(40px, 7%, 104px)`, se mantiene por debajo del relleno vertical de la
seccion para que el velo de legibilidad nunca se desvanezca por debajo del
texto. Hay respaldo con degradados superpuestos para navegadores sin soporte
de mascara.

## 3. Salvedad sobre el auditor

Los auditores ahora excluyen la banda inferior del analisis de bordes: los
tallos de la vegetacion son lineas verticales intencionales y se contaban como
costuras.

Limitacion conocida y no resuelta: la siembra de particulas usa valores
aleatorios sin semilla fija, asi que las mediciones varian entre corridas. En
los casos limite eso hace que un mismo estado pase o falle segun la corrida.
Fijar la semilla del sembrado queda pendiente para que la auditoria sea
reproducible.
