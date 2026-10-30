export const WFS_URL = 'https://geonode-cam.marketsis.com.ar/geoserver/wfs';
export const NETWORKS = [
  { id:'edemsa', label:'EDEMSA · media tensión', layer:'geonode:Red_EDEMSA_media_tension', color:'#c18329', fields:'the_geom,id_origen,distribuid,tension_kv', voltage:'tension_kv', owner:'distribuid' },
  { id:'edeste', label:'EDESTE', layer:'geonode:Red_EDESTE', color:'#8766bb', fields:'the_geom,id_origen,distribuid,tension_kv', voltage:'tension_kv', owner:'distribuid' },
  { id:'cooperativas', label:'Cooperativas eléctricas', layer:'geonode:Red_electrica_cooperativas', color:'#338b85', fields:'the_geom,id_origen,distribuid,tension_kv', voltage:'tension_kv', owner:'distribuid' },
  { id:'alta', label:'Alta tensión', layer:'geonode:linea_alta_tension', color:'#cb5c4a', fields:'the_geom,NOMBRE,TENSION,PROPIEDAD,CONCESION', voltage:'TENSION', owner:'PROPIEDAD' },
];
export const NORM_URL='https://epremendoza.gob.ar/2019/resoluciones-anexos/Res%20155-2025.pdf';
export const METHOD_VERSION='2026-10-30.1';
export const SEARCH_MARGIN_METERS=200;
