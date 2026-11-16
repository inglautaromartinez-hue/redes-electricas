import test from 'node:test';import assert from 'node:assert/strict';
import {parseSearch,groupNc,shareUrl} from '../src/ui/search.js';
const nc='010111004200004100766';
test('buscador distingue una NC con separadores, direcciones y pares de coordenadas sin confundir identidad',()=>{
 for(const value of [nc,'01-01-11-0042-000041-0076-6','0101110042000041, 00766','0101110042000041 - 00766'])assert.equal(parseSearch(value).nc,nc);
 assert.equal(parseSearch('12345').valid,false);assert.equal(parseSearch('San Martín 1000, Capital').kind,'place');
 for(const value of ['-68.8456, -32.8894','-68,8456; -32,8894','-68.8456 -32.8894'])assert.deepEqual(parseSearch(value),{kind:'coordinates',x:-68.8456,y:-32.8894,valid:true});
 assert.equal(parseSearch('-32.8894; -68.8456').inverted,true);assert.equal(parseSearch('-70; -38').valid,false);
 assert.equal(groupNc(nc).replace(/\D/g,''),nc);
});
test('enlace compartido conserva la NC ingresada y escenario, sin arrastrar parámetros ajenos',()=>{
 const url=new URL(shareUrl('https://example.org/?other=1#map',nc,'compact'));assert.equal(url.searchParams.get('nc'),nc);assert.equal(url.searchParams.get('mt'),'compact');assert.equal(url.searchParams.has('other'),false);assert.equal(url.hash,'');
});
