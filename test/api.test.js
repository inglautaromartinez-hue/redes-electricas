import test from 'node:test';import assert from 'node:assert/strict';
import {findParcel,locateParcels,validatePoint}from '../src/server/parcels.js';
import {handleApi}from '../src/server/api.js';
import {validateBbox,queryNetworks}from '../src/server/networks.js';
import {wfsQuery,readJson}from '../src/server/wfs.js';
const nc='010111004200004100766',matrix='010111004200004100006';
const geometry={type:'Polygon',coordinates:[[[-68.851,-32.9],[-68.85,-32.9],[-68.85,-32.899],[-68.851,-32.9]]]};
const f=(code=nc)=>({type:'Feature',geometry,properties:{NOMENCLATU:code,OWNER:'private',AVALUO:999}});
const response=(features,extra={})=>new Response(JSON.stringify({type:'FeatureCollection',features,numberMatched:features.length,numberReturned:features.length,totalFeatures:features.length,crs:features.some(f=>f.geometry)?{properties:{name:'EPSG:4326'}}:null,...extra}),{headers:{'Content-Type':'application/json'}});
test('identidad exacta primero; se limita origen, campos y departamento',async()=>{
 let calls=0;const r=await findParcel(nc,{fetchImpl:async url=>{calls++;const u=new URL(url);assert.equal(u.hostname,'geonode-cam.marketsis.com.ar');assert.equal(u.searchParams.get('propertyName'),'NOMENCLATU,the_geom');assert.equal(u.searchParams.get('typeNames'),'geonode:a__LGS_GRP_oct_CAPITAL');return response([f()]);}});
 assert.equal(calls,1);assert.equal(r.match,'EXACT');assert.deepEqual(r.feature.properties,{NOMENCLATU:nc});assert.ok(!JSON.stringify(r).includes('private'));
});
test('PH busca matriz única con OR de formatos y conserva NC original',async()=>{
 let calls=0;const r=await findParcel('01-01-11-0042-000041-0076-6',{fetchImpl:async url=>{calls++;const c=new URL(url).searchParams.get('CQL_FILTER');if(calls===1){assert.ok(!c.includes('LIKE'));return response([]);}assert.ok(c.includes("LIKE '0101110042000041%' OR NOMENCLATU LIKE '01-01-11-0042-000041%'"));return response([f(matrix)]);}});
 assert.equal(r.match,'MATRIX');assert.equal(r.input,nc);assert.equal(r.nomenclature,matrix);assert.equal(calls,2);
});
test('múltiples identidades, errores y respuesta incompleta no evalúan una parcela',async()=>{
 for(const payload of [response([f(),f(matrix)]),response([f(matrix)]),response([f()],{numberMatched:3}),response([f()],{crs:null})]){
  const r=await findParcel(nc,{fetchImpl:async()=>payload.clone()});assert.equal(r.status,'ERROR');
 }
 let calls=0;const e=await findParcel(nc,{fetchImpl:async()=>{calls++;throw Error('network');}});assert.equal(e.reason,'PARCEL_SOURCE_ERROR');assert.equal(calls,1);
});
test('NC incompleta o departamento02 no hacen consultas',async()=>{
 for(const input of ['0101','02'+nc.slice(2)])assert.equal((await findParcel(input,{fetchImpl:()=>{throw Error('must not query');}})).status,'ERROR');
});
test('búsqueda posicional devuelve candidatas a confirmar con campos mínimos',async()=>{
 let calls=0;const r=await locateParcels(-68.85,-32.9,{fetchImpl:async url=>{calls++;const u=new URL(url);if(u.searchParams.get('typeNames')==='geonode:DEPARTAMENTOS_4326')return response([{type:'Feature',geometry:null,properties:{CODIGO_DEP:'01'}}]);return response([f(matrix)]);}});
 assert.equal(calls,2);assert.equal(r.status,'CANDIDATES');assert.equal(r.candidates[0].nomenclature,matrix);assert.ok(!JSON.stringify(r).includes('OWNER'));
});
test('valida bbox, puntos y límites antes de pedir datos',()=>{
 for(const [x,y]of [[null,-33],['',-33],[0,0],['NaN',-33],[-68,Infinity]])assert.throws(()=>validatePoint(x,y));
 for(const b of ['',null,'-69,-33,-68,-32','-69,-33,-68.9,-33','-69,-33,,0'])assert.throws(()=>validateBbox(b));
 assert.deepEqual(validateBbox('-68.86,-32.91,-68.85,-32.9'),[-68.86,-32.91,-68.85,-32.9]);
});
test('red incompleta queda marcada, no se devuelve como colección vacía completa',async()=>{
 const r=await queryNetworks('-68.86,-32.91,-68.85,-32.9',{fetchImpl:async()=>response([],{numberMatched:401})});
 assert.equal(r.complete,false);assert.equal(r.sources.length,4);assert.ok(r.sources.every(s=>!s.complete));
});
test('API no funciona como proxy abierto ni admite métodos de escritura',async()=>{
 assert.equal((await handleApi(new Request('https://test/api/parcel?nc='+nc+'&url=https://evil.test'))).status,400);
 assert.equal((await handleApi(new Request('https://test/api/health',{method:'POST'}))).status,405);
 const r=await handleApi(new Request('https://test/api/health'));assert.equal(r.status,200);assert.equal((await r.json()).documentedCorridors,0);
});
test('lectura de respuesta acotada y timeout de fuente',async()=>{
 await assert.rejects(readJson(new Response('abcdefgh'),3));
 await assert.rejects(wfsQuery('x',{}, {timeoutMs:10,fetchImpl:async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('abort'))))}));
});
