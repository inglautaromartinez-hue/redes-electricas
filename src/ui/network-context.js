import L from 'leaflet';
import { NETWORKS } from '../../config/networks.js';

// Context is intentionally separate from the parcel analysis and its exports.
export function showNetworkContext({map,api,styles}) {
  map.createPane('networkContext');
  map.getPane('networkContext').style.zIndex='390';
  const layers=Object.fromEntries(NETWORKS.map(source=>[source.id,L.geoJSON(null,{
    pane:'networkContext',interactive:false,
    style:{...styles[source.id],weight:2.4,opacity:.85,className:'network-line'}
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
  let controller,timer,version=0;
  const clear=()=>Object.values(layers).forEach(layer=>layer.clearLayers());
  const status=text=>{legend.querySelector('small').textContent=text;};
  async function refresh(){
    const generation=++version;controller?.abort();clear();
    if(!label.firstElementChild.checked){status('Capa oculta');return;}
    const bounds=map.getBounds();
    const box=[Math.max(-71.5,bounds.getWest()),Math.max(-37.6,bounds.getSouth()),Math.min(-66,bounds.getEast()),Math.min(-31.5,bounds.getNorth())];
    const [w,s,e,n]=box;
    if(map.getZoom()<12||(e-w)*(n-s)>.15||e-w>1||n-s>1){status('Acercá el mapa para ver las redes');return;}
    if(w>=e||s>=n){status('Fuera del área de consulta');return;}
    controller=new AbortController();status('Cargando redes del mapa…');
    try{
      const data=await api('/api/networks',{bbox:box.join(',')},controller.signal);
      if(generation!==version)return;
      let count=0;
      for(const source of data.sources){for(const feature of source.features){layers[source.id]?.addData(feature);count++;}}
      status(!data.complete?'Cobertura parcial · alguna fuente no respondió':count?'Referencias del área visible · no acreditan servidumbre':'Sin redes en las referencias consultadas');
    }catch(error){if(error.name!=='AbortError'&&generation===version)status('No se pudieron cargar las redes · mové el mapa para reintentar');}
  }
  map.on('movestart',()=>{version++;controller?.abort();clearTimeout(timer);});
  map.on('moveend',()=>{clearTimeout(timer);timer=setTimeout(refresh,350);});
  label.firstElementChild.addEventListener('change',()=>{for(const layer of Object.values(layers))label.firstElementChild.checked?map.addLayer(layer):map.removeLayer(layer);refresh();});
  refresh();
}
