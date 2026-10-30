import { findParcel, locateParcels } from './parcels.js';
import { queryNetworks } from './networks.js';
import { readJson } from './wfs.js';
import { METHOD_VERSION, NETWORKS } from '../../config/networks.js';
export const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
export async function handleApi(request, env={}, ctx={}, options={}) {
  const u=new URL(request.url);const fetchImpl=options.fetchImpl??fetch;
  if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED'},405);
  const allowed={ '/api/parcel':['nc'],'/api/locate':['lng','lat'],'/api/networks':['bbox'],'/api/places':['q'],'/api/health':[] };
  if(!allowed[u.pathname])return json({error:'NOT_FOUND'},404);
  if([...u.searchParams.keys()].some(k=>!allowed[u.pathname].includes(k)))return json({error:'INVALID_QUERY'},400);
  if(u.search.length>500)return json({error:'INVALID_QUERY'},400);
  try {
    if(u.pathname==='/api/health')return json({status:'ok',method:METHOD_VERSION,sources:NETWORKS.map(x=>x.id),documentedCorridors:0});
    if(u.pathname==='/api/parcel')return json(await findParcel(u.searchParams.get('nc'),{fetchImpl}));
    if(u.pathname==='/api/locate')return json(await locateParcels(u.searchParams.get('lng'),u.searchParams.get('lat'),{fetchImpl}));
    if(u.pathname==='/api/networks')return json(await queryNetworks(u.searchParams.get('bbox'),{fetchImpl}));
    const q=String(u.searchParams.get('q')??'').trim();if(q.length<3||q.length>160)return json({error:'INVALID_PLACE'},400);
    const cache=globalThis.caches?.default;const cacheKey=new Request(u.toString());
    if(cache){const hit=await cache.match(cacheKey);if(hit)return hit;}
    const endpoint=/\d/.test(q)?'direcciones':'localidades';
    const url=new URL(`https://apis.datos.gob.ar/georef/api/${endpoint}`);
    url.search=new URLSearchParams({[endpoint==='direcciones'?'direccion':'nombre']:q,provincia:'mendoza',max:'5'});
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
    let payload;try{payload=await readJson(await fetchImpl(url,{signal:controller.signal}),250000);}finally{clearTimeout(timer);}
    const items=(payload[endpoint]??[]).map(v=>({label: endpoint==='direcciones'?v.nomenclatura:`${v.nombre} · ${v.departamento?.nombre??'Mendoza'}`,x:v.ubicacion?.lon??v.centroide?.lon,y:v.ubicacion?.lat??v.centroide?.lat})).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y));
    const response=json({items,source:'Georef · Datos Argentina'});response.headers.set('Cache-Control','public, max-age=900');
    if(cache&&ctx.waitUntil)ctx.waitUntil(cache.put(cacheKey,response.clone()));
    return response;
  }catch(error){const invalid=['INVALID_POINT','INVALID_BBOX'].includes(error?.message);return json({error:invalid?error.message:'CONSULTATION_UNAVAILABLE'},invalid?400:503);}
}
