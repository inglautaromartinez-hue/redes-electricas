# Criterios del visor y evidencia de fuentes

Versión metodológica 2026-10-30.1.

## Referencias oficiales

- [EPRE: reglamentación 144/155-2025](https://epremendoza.gob.ar/reglamento-condiciones-tecnicas/)
- [Anexo 155/2025](https://epremendoza.gob.ar/2019/resoluciones-anexos/Res%20155-2025.pdf)
- [Orden de Servicio 577 del Registro de la Propiedad](https://jusmendoza.gob.ar/wp-content/uploads/2024/02/Orden-de-Servicio-N%C2%B0-577.pdf)

La tablaII (página 10 del anexo) establece valores típicos; las observaciones y
punto 5 exigen verificar diseño, estructuras y flecha. Ztotal incluye Zmáx y dos
bandasZs, con restricciones diferentes. Este visor sólo representa Ztotal como
referencia de análisis. No presenta restricciones constructivas como dictamen.

Para compactas: tablaII 5,20 m, punto 5.2.3 5,30 m. Se representa como escenario
2,60–2,65 m por lado, pendiente de aclaración del EPRE. No se resuelve la diferencia
por decisión automática. La norma provincial de distribuidoras no sustituye los
actos de afectación ni la normativa aplicable a transportistas de jurisdicción nacional.

## Datos verificados

GetCapabilities y consultas controladas del 30/10/2026 confirman las 18 capas
departamentales configuradas, `geonode:DEPARTAMENTOS_4326` y las 4 redes en
`config/networks.js`. DescribeFeatureType confirma nombres/campos. No se usan
las versiones duplicadas con sufijo 0 para evitar conteos dobles.

Las redesMT sólo incluyen tensión, distribuidora y longitud. Alta tensión incluye
TENSION, PROPIEDAD, CONCESION y NOMBRE. Ninguna capa consultada acredita ancho
aprobado ni tipo constructivo de cada tramo. Se observó 7,62 kV en EDESTE: no se
convierte a 13,2 kV suponiendo tensión fase-neutro; requiere verificación.

No se encontró una capa de polígonos identificada como servidumbre de electroducto
en GetCapabilities. No se modificó el servidor ni se atribuye valor registral a las redes.

## Método

1. NC 21: búsqueda exacta, con/sin formato, en la capa departamental. Ausencia
   completa habilita búsqueda por prefijo 16, única en ambos formatos combinados.
2. Identidad y topología verificadas. Coordenadas/clic/dirección analizan una única
   candidata automáticamente mediante nueva consulta por NC. Si hay varias, requieren
   selección. Una NC posicional aproximada conserva la selección explícita. Nunca
   se analiza un punto como sustituto de la geometría parcelaria.
3. Consulta de redes por bbox parcelario ampliado 200 m; máximo 400 registros/fuente,
   2,5 MB/respuesta,50.000 vértices/fuente,12 s/consulta. Una respuesta truncada falla
   de forma explícita. La falta de fuente no equivale a ausencia de red.
4. Recorte local, buffer métrico Turf (proyección azimutal equidistante usada por
   la biblioteca) y superposición con geometría parcelaria validada. Las superficies
   son geodésicas aproximadas; no sustituyen medición de mensura.
5. Intersecciones combinadas por unión geométrica: no sumar ciegamente áreas
   superpuestas de varias líneas. Contacto de borde también cuenta como contacto
   aunque su área de intersección sea cero.
6. Fuentes incompletas, tensión sin referencia o error geométrico impiden un
   resultado negativo concluyente. Incluso el estado sin intersección se limita
   al escenario y las capas consultadas, nunca certifica ausencia de servidumbre.

## Desarrollo futuro sin alterar el significado

Incorporar tipo constructivo y antecedente técnico por tramo; luego incorporar
polígonos de afectación respaldados por acto/plano, jurisdicción, fecha y fuente.
Mantener separados `servidumbre documentada` y `franja estimada`; una tabla de
voltajes o un buffer no constituye el derecho real/administrativo.
