# Auditoría de diseño e interfaz · Redes eléctricas IDECAM

Fecha: 16/11/2026. Base revisada: commit `6bb3f09`. Alcance: lectura del HTML generado, CSS e interacción del cliente; cálculo de contrastes y casos de entrada ejecutados en Node. No es una certificación de conformidad WCAG. Las recomendaciones no requieren modificar los contratos de API, los cálculos geoespaciales ni el Web Worker.

## Diez hallazgos de la versión anterior

Ordenados por efecto sobre comprensión y operación. Las líneas y selectores de esta tabla corresponden al commit base, no a la versión modificada.

| Prioridad | Hallazgo y evidencia | Solución y principio |
|---|---|---|
| 1 | El título «Afectación estimada» puede interpretarse jurídicamente. El aviso de alcance aparece después de identificación y superficies (`src/main.js`, `renderAnalysis`, líneas 54–59); la consulta parcial se comunica en un párrafo posterior. | Abrir con «Intersección estimada», «Sin intersección en las referencias consultadas» o «Requiere revisión» según el estado real. Colocar inmediatamente el aviso legal exacto; distinguir una intersección parcial de un resultado no determinado. Mantener icono, texto y color. |
| 2 | En móvil, el mapa se ubica encima del buscador y ocupa al menos 300 px; el panel queda después, en el desplazamiento de la página (`src/styles.css`, regla `max-width:700px`). No existe panel móvil con tres posiciones. | Mapa en el área disponible y panel inferior operable por arrastre, botón y teclado. La posición media debe mostrar el veredicto; ajustar el encuadre al espacio realmente visible. Evitar que teclado o notch tapen controles. |
| 3 | Hay texto pequeño de bajo contraste: etiqueta de superficie `#8a9492` sobre blanco, 3,12:1; párrafos de ayuda `#74878b` sobre blanco, 3,76:1. Abundan tamaños de 8–12 px (`src/styles.css`, `.metrics span`, `dialog p`, `.timestamp`). | Reforzar contraste, tamaño y jerarquía. Mantener cifras tabulares, separación de miles local y NC legible. El contraste se comprueba por pareja de colores y contexto, no por el nombre del token. |
| 4 | La búsqueda por dirección exige enviar un formulario; las coincidencias se agregan como botones sin combobox ni navegación de lista (`src/main.js`, `#form-place`, línea 73). | Buscador unificado con opciones de dirección, estado de carga, ausencia de resultados, error y navegación por flechas/Enter/Escape. Cancelar respuestas obsoletas al editar, cerrar o perder foco. Conservar búsqueda explícita por tipo como alternativa. |
| 5 | Las pestañas tienen roles y flechas, pero todas permanecen en la secuencia de Tab. El diálogo carece de nombre accesible vinculado al título; no hay enlace para saltar al buscador (`src/main.js`, líneas 12, 23, 69–70, 78). | Un único tabulador activo en las pestañas, nombre del diálogo con `aria-labelledby`, retorno de foco, enlace de salto y orden lógico. Un panel visualmente oculto debe quedar fuera del recorrido de foco. |
| 6 | La NC no ofrece contador ni agrupación visual; coordenadas se validan recién al consultar y no hay geolocalización (`src/main.js`, formularios de líneas 13–14). | Mostrar progreso de 21 dígitos sin transformar el dato canónico, aceptar separadores y coma decimal, detectar inversión y usar los mismos límites que la API. Geolocalizar únicamente tras acción expresa y manejar rechazo, espera y cancelación lógica. |
| 7 | El resumen prioriza metadatos y muestra m² sin porcentaje; anchos y redes se presentan después sin un nivel de detalle desplegable (`src/main.js`, líneas 58–60). | Orden: veredicto y alcance, superficies y porcentaje, detalle técnico. Conservar advertencias sobre matriz, fuentes parciales y anchos desconocidos; nunca convertir datos faltantes en cero ni en ausencia de intersección. |
| 8 | Los controles del mapa miden 34 px de alto y el cierre de ayuda 32 px. Se usan caracteres `⌖`, `☷`, `↗` como iconos; las fuentes dependen de dos familias externas mediante `@import` (`src/styles.css`, línea 1, `.map-tools button`, `.dialog-top button`; `src/main.js`, líneas 8, 21–23). | Objetivos táctiles de al menos 44×44 px, iconos SVG consistentes con nombre accesible del control, una familia local y carga sin `@import` remoto. Mantener el peso añadido acotado. |
| 9 | La aplicación sólo lee `nc` de la URL inicial; no escribe la consulta, no restaura el escenario `mt` y no ofrece copiar enlace (`src/main.js`, línea 80). | Serializar NC y escenario validados después de obtener el resultado; restaurarlos antes de analizar. Copiar el enlace de esa consulta y eliminarlo al limpiar. No incluir coordenadas GPS ni datos personales adicionales en el enlace. |
| 10 | La impresión oculta explícitamente `.map-section`, por lo que el resumen no contiene mapa (`src/styles.css`, regla `@media print`, línea 7). | Hoja con mapa, resultado, escenario, fecha/hora y fuentes, más el aviso legal. Abrir el detalle necesario para imprimir y comprobar que las teselas y la geometría se mantienen encuadradas al cambiar el tamaño. Usar «resumen de consulta». |

## Propuesta y criterios de implementación

La interfaz debe permitir empezar por un dato conocido y leer primero qué puede concluirse de la cartografía. El azul institucional organiza navegación y acciones; el dorado funciona como acento de marca, con uso limitado. Atkinson Hyperlegible Next autoalojada favorece la lectura de nomenclaturas largas; las superficies y coordenadas usan cifras tabulares. La estructura reserva el detalle técnico para una segunda lectura y conserva siempre el límite legal de la consulta.

El panel móvil tiene posiciones inicial, media y completa; sus alturas deben ser monótonas incluso al abrir el teclado. El mapa usa tramas, grosores y halos además del color para diferenciar redes y geometrías. Los controles y los estados siguen siendo operables sin animación y sin depender del hover. La escala de espacio usa múltiplos de 4 px; los componentes se adaptan al ancho disponible del panel.

### Contrastes calculados de la paleta propuesta

Cálculo con luminancia relativa sRGB y razón `(L_claro + 0,05) / (L_oscuro + 0,05)`, redondeada a dos decimales. Son valores para fondos opacos uniformes: no certifican los colores compuestos sobre cartografía o satélite.

| Primer plano | Fondo | Razón | Uso |
|---|---|---:|---|
| Azul `#254e82` | Blanco `#ffffff` | 8,43:1 | Texto institucional y acciones; también sirve la pareja invertida. |
| Azul oscuro `#173254` | Blanco `#ffffff` | 12,96:1 | Títulos y texto de alta prioridad. |
| Texto `#32373c` | Blanco `#ffffff` | 12,02:1 | Texto principal. |
| Texto `#32373c` | Fondo `#edf3fa` | 10,76:1 | Texto en superficies institucionales. |
| Dorado `#d4a63c` | Blanco `#ffffff` | 2,25:1 | Sólo acento decorativo; insuficiente para texto normal o indicador esencial. |
| Azul oscuro `#173254` | Dorado `#d4a63c` | 5,75:1 | Texto oscuro sobre un eventual acento dorado opaco. |

## Verificación y riesgos pendientes

- **Realizado en esta auditoría:** lectura de la base indicada; comparación de estructura y estados; cálculo de contrastes; ejecución del parser con NC completa/separada, punto/coma decimal, coordenadas invertidas y entradas fuera de rango; revisión de carreras de autocompletado y geolocalización. Los hallazgos de integración se comunicaron durante la implementación.
- **NVDA y VoiceOver no probados aquí:** verificar anuncios de resultado y error, combobox con lista abierta/cerrada, candidatos, pestañas, diálogo y retorno de foco. Comprobar que el colapso del panel no deja controles invisibles alcanzables por Tab.
- **Navegador y dispositivos:** la matriz de 320, 360, 390, 414, 768, 1024, 1280, 1440 y 1920 px, ambas orientaciones, requiere evidencia de pruebas de la entrega. Incluir teclado virtual, zoom, safe areas, reducción de movimiento e impresión real. Esta auditoría de código no sustituye esas pruebas.
- **Cartografía:** revisar protanopía y deuteranopía con mapa y satélite, más escenas claras y oscuras. Los contrastes de la tabla no evalúan teselas ni garantizan discernibilidad de redes. Mantener atribuciones visibles.
- **Teselas y operación:** la base usa `tile.openstreetmap.org` y World Imagery de Esri. Evaluar capacidad, condiciones vigentes y alternativa operativa antes de aumentar tráfico; no se contrata ni incorpora un servicio nuevo en esta auditoría. La elección de proveedor corresponde al Colegio.
- **Privacidad y enlaces:** no agregar analítica. Obtener ubicación sólo al pulsar su botón; invalidar callbacks pendientes al limpiar o iniciar otra consulta. El enlace compartido identifica una parcela y su escenario, pero no preserva una instantánea histórica de datos: al abrirlo vuelve a consultar las fuentes disponibles.
- **Marca y alcance:** conservar el emblema institucional existente. Cualquier logo nuevo necesita decisión del Colegio. El límite legal y las advertencias de fuentes/escenarios deben conservarse en pantalla, impresión y exportaciones.

La aceptación final requiere que los estados incompletos nunca se presenten como ausencia o presencia determinada de intersección, que no haya foco perdido u oculto, y que una consulta compartida reproduzca NC y escenario sin alterar los contratos del backend.
