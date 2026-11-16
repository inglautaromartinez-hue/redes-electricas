import L from 'leaflet';
import { NETWORKS, WFS_URL } from '../../config/networks.js';

// Context is intentionally separate from the parcel analysis and its exports.
export function showNetworkContext({map,api,styles}) {
  map.createPane('networkContext');
  map.getPane('networkContext').style.zIndex='390';
  const layers=Object.fromEntries(NETWORKS.map(source=>[source.id,L.tileLayer.wms(
    WFS_URL.replace(/\/wfs$/, '/wms'),{
      layers:source.layer,format:'image/png',transparent:true,version:'1.1.1',
      pane:'networkContext',maxZoom:20,opacity:.85,
      bounds:[[-37.6,-71.5],[-31.5,-66]],
      sld_body:networkSld(source.layer,styles[source.id]),
      attribution:'Redes eléctricas: IDECAM'
    }).addTo(map)]));
  const legend=document.createElement('div');
  legend.className='network-reference';
  legend.innerHTML='<b>Redes eléctricas</b><div class="network-reference-keys"></div><small role="status" aria-live="polite"></small>';
  for(const source of NETWORKS){
    const item=document.createElement('span');
    const swatch=document.createElementNS('http://www.w3.org/2000/svg','svg');
    swatch.setAttribute('viewBox','0 0 28 8');swatch.setAttribute('aria-hidden','true');
    const line=document.createElementNS(swatch.namespaceURI,'line');
    for(const [key,value] of Object.entries({x1:1,y1:4,x2:27,y2:4,stroke:styles[source.id].color,'stroke-width':2.4,'stroke-dasharray':styles[source.id].dashArray||''}))line.setAttribute(key,value);
    swatch.append(line);item.append(swatch,document.createTextNode(source.label));
    legend.querySelector('div').append(item);
  }
  document.querySelector('.map-bottom').prepend(legend);
  const label=document.createElement('label');label.innerHTML='<input type="checkbox" checked>Redes del mapa';
  document.querySelector('.layer-options').prepend(label);
  const status=text=>{legend.querySelector('small').textContent=text;};
  const pending=new Set();
  let failed=false;
  const update=()=>status(!label.firstElementChild.checked?'Capa oculta':failed?
    'Cobertura parcial · alguna imagen no se pudo cargar':pending.size?
    'Cargando redes del mapa…':'Referencias del área visible · no acreditan servidumbre');
  for(const [id,layer] of Object.entries(layers)){
    layer.on('loading',()=>{pending.add(id);update();});
    layer.on('load',()=>{pending.delete(id);update();});
    layer.on('tileerror',()=>{failed=true;update();});
  }
  map.on('movestart',()=>{failed=false;});
  label.firstElementChild.addEventListener('change',()=>{
    for(const layer of Object.values(layers))label.firstElementChild.checked?map.addLayer(layer):map.removeLayer(layer);
    update();
  });
  update();
}

// Explicit cartographic styling avoids source styles with scale-dependent hiding.
export function networkSld(layer,style){
  const dash=style.dashArray?`<CssParameter name="stroke-dasharray">${style.dashArray}</CssParameter>`:'';
  return `<?xml version="1.0" encoding="UTF-8"?><StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"><NamedLayer><Name>${layer}</Name><UserStyle><FeatureTypeStyle><Rule><LineSymbolizer><Stroke><CssParameter name="stroke">#ffffff</CssParameter><CssParameter name="stroke-width">3.6</CssParameter></Stroke></LineSymbolizer><LineSymbolizer><Stroke><CssParameter name="stroke">${style.color}</CssParameter><CssParameter name="stroke-width">2</CssParameter>${dash}</Stroke></LineSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`;
}
