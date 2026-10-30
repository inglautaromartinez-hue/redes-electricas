import { WFS_URL } from '../../config/networks.js';
export function escapeCql(value) { return String(value).replace(/'/g,"''"); }
export async function readJson(response, maxBytes=2500000) {
  if(!response.ok) throw new Error(`SOURCE_HTTP_${response.status}`);
  if(Number(response.headers.get('content-length'))>maxBytes) throw new Error('RESPONSE_TOO_LARGE');
  const reader=response.body.getReader();let size=0;const chunks=[];
  try { for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('RESPONSE_TOO_LARGE');chunks.push(value);} }
  finally {await reader.cancel().catch(()=>{});}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('SOURCE_INVALID_JSON');}
}
export async function wfsQuery(layer, params, {fetchImpl=fetch,timeoutMs=12000}={}) {
  const u=new URL(WFS_URL);u.search=new URLSearchParams({service:'WFS',version:'2.0.0',request:'GetFeature',typeNames:layer,outputFormat:'application/json',srsName:'EPSG:4326',...params});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const data=await readJson(await fetchImpl(u,{signal:controller.signal,headers:{Accept:'application/json'}}));
    if(data?.type!=='FeatureCollection'||!Array.isArray(data.features))throw new Error('SOURCE_INVALID');
    if(!Number.isSafeInteger(data.numberMatched)||data.numberMatched!==data.features.length||data.numberReturned!==data.features.length||
      (data.totalFeatures!==undefined&&data.totalFeatures!==data.numberMatched)||data.next||data.links?.some(x=>x.rel==='next'))throw new Error('SOURCE_INCOMPLETE');
    const name=data.crs?.properties?.name;
    if(data.features.some(f=>f.geometry!==null)&&!['EPSG:4326','urn:ogc:def:crs:EPSG::4326','CRS:84','urn:ogc:def:crs:OGC:1.3:CRS84'].includes(name))throw new Error('CRS_UNCONFIRMED');
    return data;
  } finally {clearTimeout(timer);}
}
