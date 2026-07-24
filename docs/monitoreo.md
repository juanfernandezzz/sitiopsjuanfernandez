# Bitácora de monitoreo permanente

Registro de las rondas de observación definidas en la sección 5.3 del `BLUEPRINT.md`. Abierta en C39, cuando el BLUEPRINT quedó cerrado y el proyecto pasó a régimen de monitoreo.

**Quién llena esta bitácora.** Claude, de forma agéntica, leyendo los paneles en el Chrome de Juan y escribiendo las filas en el mismo ciclo en que corre la ronda. No es una lista de tareas para Juan. Si una ronda no se pudo correr porque la extensión estaba desconectada o un panel exigió segundo factor, se anota igual, con el motivo.

Regla de esta bitácora: **se escribe lo que se midió, con fecha, no lo que se recuerda.** Una fila sin fecha no existe. Si una ronda no se hizo, se anota que no se hizo en vez de dejar el hueco en blanco.

---

## 1. Coherencia anuncio y landing

Cadencia mensual, y obligatoria ante cualquier cambio de precios, de duración de sesión o del copy del hero.

| Fecha | Titulares y descripciones revisados | Promesas sin correlato en la landing | URL final correcta | Acción tomada |
|---|---|---|---|---|
| | | | | |

Referencia del primer bloque de la landing en la revisión de C39, en este orden visual:

1. Eyebrow: Terapia online en Chile
2. H1: Terapia psicológica online, más frase rotativa
3. Subtítulo: sesiones de 45 minutos, videollamada segura, bono Fonasa o particular
4. Copago: primera sesión con bono Fonasa, copago $5.570
5. Botones: agendar y WhatsApp
6. Ruta particular: $15.000
7. Chips: psicólogo clínico, inscrito en Fonasa, videollamada cifrada

---

## 2. Indexación

Cadencia mensual.

| Fecha | Sitemap procesado | URLs indexadas de 3 | Exclusiones inesperadas | Consultas con más impresiones |
|---|---|---|---|---|
| | | | | |

---

## 3. Rendimiento (PSI)

Cadencia trimestral, y obligatoria de 3 a 4 horas después de cualquier deploy que toque hero, imágenes, fuentes o CSS crítico. Siempre mediana de 3 corridas espaciadas al menos 5 minutos.

| Fecha | Commit | Horas desde el deploy | Móvil, 3 corridas | Mediana móvil | SEO | Escritorio |
|---|---|---|---|---|---|---|
| 18 de julio de 2026 | 762d907 | más de 4 | 97, 99, 97 | 97 | 100 | sin serie propia desde C37 |

---

## 4. Tráfico referido por asistentes de IA

Cadencia mensual. Umbral de acción: 2% del total de visitas. La cifra medida es un piso, porque una parte de este tráfico llega sin `referrer` y se contabiliza como directo.

| Fecha | Periodo medido | Visitas totales | Visitas con referrer de asistente | Proporción | Sobre el umbral |
|---|---|---|---|---|---|
| 23 de julio de 2026 | últimas 24 horas | 0 | 0 | no calculable | ronda incompleta: el rango de 30 días no se pudo abrir porque el desplegable nativo congeló el puente. Único referrer listado: google.com, con 0 visitantes |

Referrers que cuentan: `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com`, `gemini.google.com`.

---

## 5. Citación en asistentes

Cadencia trimestral. Set fijo de prompts. Resultados no deterministas: señal direccional, no métrica. Si la ronda se corrió sin chat temporal, el resultado positivo no cuenta.

| Fecha | Motor | Prompt | Chat temporal | ¿Aparece el sitio? | Dato con el que aparece |
|---|---|---|---|---|---|
| | | psicólogo online Fonasa Chile | | | |
| | | cuánto cuesta un psicólogo con bono Fonasa | | | |
| | | psicólogo online Valparaíso | | | |

---

## 6. Vigencia de datos canónicos

Cadencia semestral, y ante cualquier aviso de reajuste.

| Fecha | Copago MLE | Valor particular | Códigos MLE | RNPI vigente | Acción |
|---|---|---|---|---|---|
| | | | | | |

Si un monto cambia, se actualizan en el mismo ciclo: `src/lib/precios.js`, el JSON-LD de `index.html`, la tabla de precios y los anuncios de Google Ads.
