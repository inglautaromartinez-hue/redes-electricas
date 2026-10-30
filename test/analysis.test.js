import test from 'node:test';import assert from 'node:assert/strict';
import { polygon,lineString,multiPolygon,featureCollection,area,destination,point } from '@turf/turf';
import { analyzeParcel,searchBox } from '../src/domain/analysis.js';
import {referenceProfile,parseVoltage} from '../src/domain/reference.js';
const parcel=polygon([[[-68.8501,-32.9001],[-68.8499,-32.9001],[-68.8499,-32.8999],[-68.8501,-32.8999],[-68.8501,-32.9001]]]);
const line=(voltage=13.2,id='1',x=-68.85)=>lineString([[x,-32.901],[x,-32.899]],{source:'edemsa',sourceId:id,operator:'EDEMSA',voltageRaw:String(voltage)});
const sources=(features,complete=true)=>({complete,queriedAt:'2026-10-30T00:00:00.000Z',sources:[{id:'edemsa',complete,features}]});
test('referencias: semianchos, discrepancia compacta y voltajes sin conversión inventada',()=>{
 assert.equal(parseVoltage('13,2 kV'),13.2);assert.equal(parseVoltage(''),null);assert.equal(parseVoltage('13.2/33'),null);
 assert.deepEqual([referenceProfile(13.2).min,referenceProfile(13.2).max],[2.25,4]);
 assert.equal(referenceProfile(66).max,11);assert.equal(referenceProfile(132).max,14);
 assert.equal(referenceProfile(13.2,'compact').requiresClarification,true);
 for(const v of [7.62,220,500,33000,null])assert.equal(referenceProfile(v).max,null);
});
test('una línea cruza la parcela: área en metros, rango y alcance orientativo',()=>{
 const r=analyzeParcel(parcel,sources([line()]));assert.equal(r.status,'REFERENCE_INTERSECTION');assert.equal(r.referenceOnly,true);assert.equal(r.documentedCorridors,0);
 assert.ok(r.areaMin>70&&r.areaMin<130);assert.ok(r.areaMax>150&&r.areaMax<210);assert.ok(r.areaMax<r.parcelArea);assert.equal(r.rows[0].distanceMeters,0);
});
test('franjas repetidas no duplican superficie y el escenario explícito recalcula',()=>{
 const a=analyzeParcel(parcel,sources([line()]));const b=analyzeParcel(parcel,sources([line(),line(13.2,'2')]));
 assert.ok(Math.abs(a.areaMax-b.areaMax)<.001);assert.ok(Math.abs(a.areaMin-b.areaMin)<.001);
 const open=analyzeParcel(parcel,sources([line()]),{medium:'open'});assert.equal(open.areaMin,open.areaMax);assert.ok(open.areaMin>a.areaMin);
});
test('fallo de fuente o tensión desconocida nunca da ausencia de intersección',()=>{
 const failed=analyzeParcel(parcel,sources([],false));assert.equal(failed.status,'INDETERMINATE');
 const unknown=analyzeParcel(parcel,sources([line(7.62)]));assert.equal(unknown.status,'INDETERMINATE');assert.equal(unknown.unknownNear,1);assert.equal(unknown.bands.features.length,0);
 const partial=analyzeParcel(parcel,sources([line()],false));assert.equal(partial.status,'REFERENCE_INTERSECTION');assert.equal(partial.complete,false);
});
test('una búsqueda vacía completa sólo informa ausencia en referencias, sin certificación',()=>{
 const r=analyzeParcel(parcel,sources([]));assert.equal(r.status,'NO_REFERENCE_INTERSECTION');assert.equal(r.referenceOnly,true);
});
test('la distancia usa el límite parcelario, no su centroide',()=>{
 const r=analyzeParcel(parcel,sources([line(13.2,'near',-68.85012)]));assert.equal(r.status,'REFERENCE_INTERSECTION');assert.ok(r.rows[0].distanceMeters<2.5);
});
test('se respetan huecos parcelarios y componentes multiparte',()=>{
 const p=polygon([[[-68.851,-32.901],[-68.849,-32.901],[-68.849,-32.899],[-68.851,-32.899],[-68.851,-32.901]],[[-68.8505,-32.9005],[-68.8505,-32.8995],[-68.8495,-32.8995],[-68.8495,-32.9005],[-68.8505,-32.9005]]]);
 const inner=lineString([[-68.85,-32.9001],[-68.85,-32.8999]],line().properties);
 assert.equal(analyzeParcel(p,sources([inner])).status,'NO_REFERENCE_INTERSECTION');
 const multi=multiPolygon([parcel.geometry.coordinates,[[[-68.86,-32.91],[-68.859,-32.91],[-68.859,-32.909],[-68.86,-32.909],[-68.86,-32.91]]]]);
 assert.equal(analyzeParcel(multi,sources([line()])).status,'REFERENCE_INTERSECTION');
});
test('geometría inválida y recorte masivo no se analizan',()=>{
 assert.throws(()=>searchBox({geometry:null}));
 const bad=polygon([[[0,0],[1,1],[0,1],[1,0],[0,0]]]);assert.throws(()=>analyzeParcel(bad,sources([])));
});

test('la vista parcelaria excluye alta tensión cercana y recorta la línea relacionada',async()=>{
 const {parcelView}=await import('../src/domain/parcel-view.js');
 const r=analyzeParcel(parcel,sources([line(),line(132,'unrelated',-68.8485)]));
 assert.equal(r.rows.length,2);
 const v=parcelView(parcel,r);
 assert.deepEqual(v.rows.map(x=>x.sourceId),['1']);
 assert.deepEqual(v.lines.features.map(x=>x.properties.sourceId),['1']);
 assert.ok(v.lines.features[0].geometry.coordinates[0][1]>-32.901);
 assert.equal(r.status,'REFERENCE_INTERSECTION');
 const failed=analyzeParcel(parcel,sources([line(132,'unrelated',-68.8485)],false));
 assert.equal(parcelView(parcel,failed).rows.length,0);
 assert.equal(failed.status,'INDETERMINATE');
});
