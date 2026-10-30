import departments from '../../config/departments.json' with {type:'json'};
import { normalizeNomenclature } from '../domain/nomenclature.js';
import { isUsableGeometry } from '../domain/geometry.js';
import { positionalNomenclaturePoint } from '../domain/positional-nomenclature.js';
import { escapeCql, wfsQuery } from './wfs.js';
const formatted=nc=>[nc.slice(0,2),nc.slice(2,4),nc.slice(4,6),nc.slice(6,10),nc.slice(10,16),nc.slice(16,20),nc.slice(20)].join('-');
export async function findParcel(input, options={}) {
  const nc=normalizeNomenclature(input);
  if(!/^\d{21}$/.test(nc))return {status:'ERROR',reason:'INVALID_NOMENCLATURE'};
  const department=departments[nc.slice(0,2)];
  if(!department)return {status:'ERROR',reason:'DEPARTMENT_UNSUPPORTED'};
  const values=[nc,formatted(nc)];
  const prefix=nc.slice(0,16);const formatPrefix=formatted(nc).split('-').slice(0,5).join('-');
  const filters=[values.map(v=>`NOMENCLATU='${escapeCql(v)}'`).join(' OR '),
    `NOMENCLATU LIKE '${prefix}%' OR NOMENCLATU LIKE '${formatPrefix}%'`];
  for(const [stage,filter]of filters.entries()) {
    let collection;try{collection=await wfsQuery(department.parcelLayer,{count:'2',propertyName:'NOMENCLATU,the_geom',CQL_FILTER:`(${filter})`},options);}catch(error){return {status:'ERROR',reason:'PARCEL_SOURCE_ERROR',sourceState:error.name==='AbortError'?'TIMEOUT':/^SOURCE_[A-Z0-9_]+$/.test(error.message)?error.message:'UNAVAILABLE'};}
    if(collection.features.length>1)return {status:'ERROR',reason:'PARCEL_AMBIGUOUS'};
    if(!collection.features.length)continue;
    const f=collection.features[0];const found=normalizeNomenclature(f.properties?.NOMENCLATU);
    if(!/^\d{21}$/.test(found)||(stage===0?found!==nc:found.slice(0,16)!==prefix)||!isUsableGeometry(f.geometry))return {status:'ERROR',reason:'PARCEL_INVALID'};
    return {status:'FOUND',input:nc,nomenclature:found,match:stage===0?'EXACT':'MATRIX',department:department.name,
      layer:department.parcelLayer,feature:{type:'Feature',geometry:f.geometry,properties:{NOMENCLATU:found}}};
  }
  try{return {status:'POSITIONAL',input:nc,point:positionalNomenclaturePoint(nc),department:department.name};}
  catch{return {status:'ERROR',reason:'PARCEL_NOT_FOUND'};}
}
export function validatePoint(lng,lat) {
  if(lng===null||lat===null||String(lng).trim()===''||String(lat).trim()==='')throw new Error('INVALID_POINT');
  const x=Number(String(lng).replace(',','.')),y=Number(String(lat).replace(',','.'));
  if(!Number.isFinite(x)||!Number.isFinite(y)||x< -71.5||x> -66||y< -37.6||y> -31.5)throw new Error('INVALID_POINT');
  return {x,y};
}
export async function locateParcels(lng,lat,options={}) {
  const {x,y}=validatePoint(lng,lat);const cql=`INTERSECTS(the_geom,SRID=4326;POINT(${x} ${y}))`;
  const dep=await wfsQuery('geonode:DEPARTAMENTOS_4326',{count:'5',propertyName:'CODIGO_DEP,DEPARTAMEN',CQL_FILTER:cql},options);
  if(dep.features.length>4)throw new Error('DEPARTMENT_AMBIGUOUS');
  const codes=[...new Set(dep.features.map(f=>f.properties?.CODIGO_DEP))];
  if(codes.some(code=>!departments[code]))throw new Error('DEPARTMENT_UNSUPPORTED');
  const candidates=[];
  for(const code of codes){
    const d=departments[code];const data=await wfsQuery(d.parcelLayer,{count:'9',propertyName:'NOMENCLATU,the_geom',CQL_FILTER:cql},options);
    for(const f of data.features){const nc=normalizeNomenclature(f.properties?.NOMENCLATU);
      if(!/^\d{21}$/.test(nc)||nc.slice(0,2)!==code||!isUsableGeometry(f.geometry))throw new Error('PARCEL_INVALID');
      candidates.push({nomenclature:nc,department:d.name,feature:{type:'Feature',geometry:f.geometry,properties:{NOMENCLATU:nc}}});
    }
  }
  if(candidates.length>8)throw new Error('PARCEL_AMBIGUOUS');
  return {status:'CANDIDATES',point:{x,y},candidates};
}
