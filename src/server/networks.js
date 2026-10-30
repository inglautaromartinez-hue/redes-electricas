import { NETWORKS } from '../../config/networks.js';
import { wfsQuery } from './wfs.js';
export function validateBbox(value) {
  if(typeof value!=='string')throw new Error('INVALID_BBOX');
  const parts=value.split(',');if(parts.length!==4||parts.some(x=>x.trim()===''))throw new Error('INVALID_BBOX');
  const b=parts.map(Number);const [w,s,e,n]=b;
  if(!b.every(Number.isFinite)||w< -71.5||e> -66||s< -37.6||n> -31.5||w>=e||s>=n||(e-w)*(n-s)>0.15||e-w>1||n-s>1)throw new Error('INVALID_BBOX');
  return b;
}
export async function queryNetworks(box, options={}) {
  const bbox=validateBbox(box);
  const sources=await Promise.all(NETWORKS.map(async source=>{
    try {
      const data=await wfsQuery(source.layer,{count:'400',bbox:`${bbox.join(',')},EPSG:4326`,propertyName:source.fields},options);
      let vertices=0;
      const features=data.features.map(f=>{
        if(!['LineString','MultiLineString'].includes(f.geometry?.type))throw new Error('NETWORK_GEOMETRY_INVALID');
        const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
        if(!Array.isArray(lines)||!lines.length||lines.some(line=>!Array.isArray(line)||line.length<2||line.some(p=>++vertices>50000||!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>180||Math.abs(p[1])>90)))throw new Error('NETWORK_GEOMETRY_INVALID');
        const p=f.properties??{};
        return {type:'Feature',geometry:f.geometry,properties:{source:source.id,sourceId:String(f.id??p.id_origen??''),voltageRaw:String(p[source.voltage]??''),operator:String(p[source.owner]??source.label).slice(0,180),name:String(p.NOMBRE??'').slice(0,180),construction:'UNKNOWN'}};
      });
      return {id:source.id,label:source.label,complete:true,features,count:features.length};
    }catch{return {id:source.id,label:source.label,complete:false,features:[],count:0};}
  }));
  return {sources,bbox,complete:sources.every(s=>s.complete),queriedAt:new Date().toISOString()};
}
