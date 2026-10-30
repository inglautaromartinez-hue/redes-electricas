# Redes eléctricas · IDECAM

Consulta parcelaria de Mendoza y comparación con franjas de seguridad de referencia.
Aplicación 2D para escritorio y móvil, sin requisito WebGL.

[**Abrir visor publicado**](https://idecam-redes-electricas.pages.dev/)

## Funciones

- NC exacta normalizada y búsqueda de matriz PH por primeros 16 dígitos.
- Coordenadas WGS 84, dirección/localidad Georef y clic sobre mapa. La búsqueda por
  ubicación analiza automáticamente una candidata única y reconsulta su NC. Si hay
  varias parcelas en el punto, permite elegir. Una NC posicional aproximada requiere selección.
- Localización asistida desde NC posicional cuando existe ese formato y no se
  recupera una geometría. Nunca se evalúa un punto como si fuera una parcela.
- Redes EDEMSA, EDESTE, cooperativas y alta tensión; mapa/satélite y capas activables.
- Resultado centrado en una parcela: superficie estimada y ancho total/por lado.
- Mapa y exportaciones sólo con líneas cuyas franjas intersectan esa parcela;
  sin listado de redes cercanas. Comparación de escenarios de media tensión.
- Descarga CSV/GeoJSON, ficha imprimible y guía de uso/metodología.

## Alcance y datos pendientes

**No certifica una servidumbre constituida.** No hay polígonos documentados de
servidumbres incorporados en esta versión. Las geometrías consultadas son redes
publicadas y las bandas son escenarios orientativos, no límites jurídicos.

Las capas de MT incluyen `tension_kv` y `distribuid`, pero no identifican tipo
constructivo. No se inventa esa clasificación. El escenario inicial para 13,2/33 kV
usa un rango típico de 4,50–8 m totales; no constituye una cota universal de diseño.
7,62 kV,220 kV,500 kV y tensiones desconocidas no reciben ancho automático. Las
referencias 66/132 kV requieren verificación de diseño/jurisdicción. La discrepancia
compacta 5,20/5,30 m se señala explícitamente. Ver [metodología](docs/METODOLOGIA.md).

Estados: `REFERENCE_INTERSECTION`, `NO_REFERENCE_INTERSECTION`, `INDETERMINATE`.
Un error o ausencia de datos nunca significa libre de servidumbres. Si una fuente
falla se informa consulta parcial; una superficie parcial no representa el total.

## Desarrollo y despliegue

```sh
npm ci
npm test
npm run build
npm run preview
```

`npm run preview` sirve frontend y API mediante Pages local. Para desarrollo
con recarga, ejecutar también `npm run dev` (proxy/api hacia puerto 8787).

`npm run deploy` publica el frontend y la API en el proyecto independiente
Cloudflare Pages `idecam-redes-electricas`, con una sesión autorizada de Wrangler.
El build prepara `_worker.js` y `_routes.json`: sólo `/api/*` ejecuta funciones.
Los archivos del visor se entregan como contenido estático.

El enlace anterior de Workers redirige al dominio neutral de Pages. La configuración
del redireccionamiento está en `wrangler.legacy.jsonc`; no cambia el subdominio
general de la cuenta ni afecta otros proyectos.

CI GitHub ejecuta pruebas y build. No se incluyen tokens ni credenciales de
despliegue automático. Las publicaciones usan la conexión autorizada de
Cloudflare o la sesión Wrangler de quien despliega.

## Arquitectura y privacidad

- Frontend Leaflet; análisis Turf/JSTS en Web Worker del navegador para evitar
  bloquear la interfaz. Buffers en metros, áreas geodésicas aproximadas y unión
  de intersecciones para evitar doble conteo.
- API Cloudflare sólo permite rutas, fuentes y campos definidos. Consulta WFS
  espacialmente acotada, con límites de respuesta, cantidad y tiempo.
- NC sólo hacia la capa departamental configurada. No descarga provincial.
- No se solicitan ni devuelven titulares, avalúos ni datos registrales.
- No hay analytics propios, credenciales incrustadas ni logs de nomenclaturas.
  La app no registra nomenclaturas ni coordenadas en logs propios.
- Georef es una ayuda de ubicación, no evidencia de identificación parcelaria.

Fuentes técnicas reutilizadas del proyecto ZSF del mismo titular: normalización,
catálogo departamental, validación topológica y conversión de NC posicional.
