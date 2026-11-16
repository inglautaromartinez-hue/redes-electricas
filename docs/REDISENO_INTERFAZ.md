# Redes eléctricas · rediseño de interfaz

Trabajo sobre la versión `6bb3f09` del visor, 16/11/2026. Revisión de Astra y desarrollo visual de Sol 6.1, ambos con razonamiento muy alto, más integración y pruebas. [Visor](https://idecam-redes-electricas.pages.dev/).

## 1. Diagnóstico

Los diez hallazgos, su evidencia y los contrastes calculados están en [la auditoría](AUDITORIA_DISENO.md). Prioridades: búsqueda comprensible, estados concluyentes, lectura/tacto en celular, navegación con teclado y vínculo inequívoco entre la parcela consultada y su resultado.

## 2. Propuesta visual

Una herramienta institucional de consulta, con el buscador como punto de entrada. Azul IDECAM y acento dorado, sin recrear ni modificar el emblema existente. El mapa conserva su espacio y el resultado se lee en orden: veredicto, alcance orientativo, identidad parcelaria, superficies y porcentaje, ancho de las franjas y detalle. En el celular el panel se puede arrastrar o manejar con teclado entre búsqueda, resultado y detalle.

- Tipografía: **Atkinson Hyperlegible Next Variable**, autoalojada; cifras tabulares para nomenclaturas y medidas. Importación del subconjunto latino y latino extendido, `font-display: swap`; no se consulta Google Fonts.
- Azul `#254e82` / blanco: **8,43:1**. Azul oscuro `#173254` / blanco: **12,96:1**. Texto `#32373c` / fondo `#edf3fa`: **10,76:1**.
- Dorado `#d4a63c` / blanco: **2,25:1**; exclusivamente acento no textual. Los textos mantienen contraste suficiente.
- Espacios en múltiplos de 4 px; controles de 44 px; campos de 16 px como mínimo. Modo claro explícito: no se fuerza una conversión oscura sin una cartografía equivalente.
- Pantallas menores de 768 px: mapa completo y panel de tres posiciones. Tablet: panel lateral plegable sobre el mapa. Escritorio desde 1100 px: panel fijo con ancho de lectura limitado.
- Líneas diferenciadas por texto, color y patrón. AT violeta `#9b3276`, MT EDEMSA ocre `#9c5700` segmentada, EDESTE `#5546a3` punto/raya, cooperativas `#006f74` punteada. Contorno parcelario azul oscuro; intersección naranja con borde discontinuo. Halo blanco para separar líneas de fotografía y base gris. El resultado no depende solo del color.

[Bocetos de las tres posiciones móviles, tablet y escritorio](redesign-wireframes.svg).

[Comprobación de protanopía y deuteranopía](paleta-accesible.svg), con las matrices de Machado et al. (2009), severidad 100, de [Colorspacious](https://github.com/njsmith/colorspacious/blob/master/colorspacious/cvd.py). Algunas tonalidades convergen: se conservan nombres y patrones distintos; no se considera suficiente la distinción por color. La comparación es una simulación y no una prueba con usuarios.

## 3. Librerías y peso

| Recurso | Versión utilizada | Licencia | Uso y decisión |
|---|---|---|---|
| Leaflet | 1.9.4, conservada | BSD-2-Clause | Mapa raster existente. No se migra el motor. |
| Lucide vanilla | 1.73.0, fijada en lockfile | ISC | Solo iconos importados y SVG decorativos accesibles; tree shaking de Vite. |
| Atkinson Hyperlegible Next / Fontsource Variable | 5.3.0 | OFL-1.1 | Familia local variable, aproximadamente 53,1 KB de WOFF2 entre ambos subconjuntos; sin solicitudes tipográficas a terceros. |
| Panel táctil propio | Módulo del proyecto | Código del proyecto | Pointer events, captura del puntero y alternativas con botones/teclado. Evita cargar un sistema de paneles para solo tres posiciones. |
| Panes | No incorporada | MIT | Alternativa si en pruebas físicas aparecen diferencias de gestos que requieran una biblioteca especializada. |
| Floating UI | No incorporada | MIT | El autocompletado queda anclado al buscador dentro del encabezado; no se necesita un motor de posicionamiento. |
| Open Props | Referencia de escala | MIT | Se definen tokens propios, sin descargar un catálogo entero. |
| Motion | No incorporada | MIT | Bastan CSS y seguimiento directo del puntero; se respeta movimiento reducido. |
| MapLibre / OpenLayers | Sin incorporación | BSD-3 / BSD-2 | Posibles etapas futuras para estilos vectoriales o servicios adicionales; no se migra en esta entrega. |

Las licencias distribuidas están en `public/licenses`. El incremento medido de JavaScript es **6.738 bytes gzip** (6,58 KiB), por debajo del presupuesto de 40 KB. El Web Worker de análisis conserva exactamente el mismo archivo de salida. La fuente es un recurso independiente y no integra ese presupuesto de JavaScript. Cálculos y API no agregan dependencias.

## 4. Código completo

Los archivos completos están en este mismo repositorio; no requieren sustituir fragmentos. Cambios: `index.html`, `src/styles.css`, `src/main.js`, `src/ui/interface.js`, `src/ui/search.js`, `src/ui/icons.js`, `public/_headers`, licencias, dependencias/lockfile y configuración de desarrollo local. `src/server`, `src/domain`, `src/analysis.worker.js` y `config` conservan su lógica y sus contratos.

Ejecutar `npm ci`, `npm test`, `npm run build`. `npm run dev` sirve la interfaz y ejecuta localmente los mismos handlers de API que Pages. La salida de producción conserva `_worker.js`, `_routes.json` con `/api/*` y assets estáticos. El permiso de ubicación queda limitado a este origen (`geolocation=(self)`); solo se solicita al tocar el botón.

## 5. Microcopy

| Antes | Después / comportamiento |
|---|---|
| Tu parcela y las líneas de energía | Consultá una parcela; ubicá el inmueble y revisá su relación con las líneas de energía. |
| Tres pestañas como primer paso | Nomenclatura, coordenadas o dirección; las tres búsquedas específicas continúan en “Buscar por tipo de dato”. |
| Ingresá los 21 dígitos | Contador de dígitos, agrupación visual y error con cantidad ingresada; acepta pegar separadores. |
| Afectación estimada de esta parcela | Intersección estimada en esta parcela. |
| Pendiente tras no encontrar una parcela | Consulta no determinada, con recuperación por otra ubicación o NC. |
| Carga genérica | Buscando la parcela / consultando redes / calculando referencias; el mapa sigue disponible. |
| Consulta parcial | Intersección estimada · consulta parcial o requiere revisión, según el estado real del análisis. |
| NC dentro del detalle | Parcela consultada siempre identificada antes de las medidas. |
| Sin compartir escenario | Copiar enlace conserva NC ingresada y escenario de media tensión. |
| Impresión de interfaz | Resumen de consulta con mapa, datos, fecha, fuentes y alcance; no se presenta como certificado. |
| Sin ayuda contextual | Glosario en la guía: NC, matriz, franja, servidumbre, media y alta tensión. |

Se conserva literalmente: **“Estimación orientativa; no acredita una servidumbre constituida.”** También se conservan las advertencias sobre falta de datos, posibles omisiones y ausencia de servidumbres aprobadas.

## 6. Verificación y límites

- Pruebas automatizadas de análisis, fuentes, privacidad, normalización, matriz PH y escenarios; nuevos casos de detección del buscador y enlace compartido.
- Comparación del árbol de código: sin cambios en cálculos ni contratos de los cuatro endpoints.
- Revisión de teclado: tabs con flechas/Home/End; combobox con flechas/Enter/Escape; diálogo modal nativo; panel con controles alternativos al arrastre. Foco visible y retorno al cerrar la guía.
- Verificado en navegador mediante un iframe del visor real, con dimensiones estabilizadas: sin desbordamiento horizontal, input de 16 px y controles visibles de al menos 44 px en las 18 combinaciones. Verificado un caso real por coordenadas, estado final sin intersección y aviso legal, cambio automático al panel medio, teclado Home/End del sheet y guía modal con foco de cierre.
- Matriz de anchos solicitados: 320, 360, 390, 414, 768, 1024, 1280, 1440 y 1920 px. Registrar dimensiones efectivas y resultados, sin confundir un iframe de prueba con un dispositivo físico.
- Requiere comprobación física adicional: Safari iOS con notch y teclado, Android/GPS, NVDA con Windows y VoiceOver con iOS/macOS, zoom del navegador al 200/400 %, impresión A4 y auditoría Lighthouse con caché fría.
- No se afirma certificación WCAG 2.2 AA. Los contrastes y patrones son comprobaciones parciales, no sustituyen pruebas con usuarios y tecnología asistiva.

## 7. Pendientes y riesgos

1. Las teselas estándar OSM tienen capacidad limitada y disponibilidad sin SLA: no se agregan precarga ni descargas masivas. Antes de una difusión de alto tráfico, el Colegio debe decidir entre un proveedor OSM compatible con su uso o infraestructura propia. No se contrató ni sustituyó un proveedor en esta entrega.
2. GPS y direcciones son ubicaciones aproximadas; verificar siempre que se seleccionó el inmueble correcto.
3. La disponibilidad y precisión de los servicios de redes siguen condicionando el resultado. Una fuente fallida conserva un estado parcial o no determinado.
4. El emblema se conserva. No se diseñó ni aprobó una nueva marca.
5. No se migró a Leaflet 2, MapLibre ni OpenLayers; no se agregan analítica, cookies propias o servicios pagos.

## Referencias consultadas

- [W3C APG: combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) y [diálogo](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- [Poncho](https://argob.github.io/poncho/), [GOV.UK](https://design-system.service.gov.uk/), [USWDS](https://designsystem.digital.gov/) y [Carbon: accesibilidad](https://www.carbondesignsystem.com/building-blocks/foundations/accessibility/overview): coherencia institucional, formularios legibles y presentación de datos, sin copiar marcas ni instalar sus frameworks.
- [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines), [Emil Design Engineering](https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng) y [Craft Floor](https://github.com/pbakaus/impeccable/blob/main/skill/reference/craft-floor.md): referencias de foco, ritmo, movimiento y controles; se subordinan al alcance y a los requisitos del visor.
- [Política de teselas OSM](https://operations.osmfoundation.org/policies/tiles/).

### Matriz responsive ejecutada

| Ancho | Alto vertical / horizontal | Desborde horizontal | Campos | Controles visibles |
|---|---|---|---|---|
|320|700 / 240|No|16 px|44 px mínimo|
|360|700 / 240|No|16 px|44 px mínimo|
|390|700 / 240|No|16 px|44 px mínimo|
|414|700 / 248|No|16 px|44 px mínimo|
|768|922 / 461|No|16 px|44 px mínimo|
|1024|1229 / 614|No|16 px|44 px mínimo|
|1280|1536 / 768|No|16 px|44 px mínimo|
|1440|1728 / 864|No|16 px|44 px mínimo|
|1920|2304 / 1152|No|16 px|44 px mínimo|

Además se inspeccionó visualmente la composición a 390 × 844 y en escritorio. Estas medidas corresponden al área CSS del visor, no a una certificación física de dispositivos.
