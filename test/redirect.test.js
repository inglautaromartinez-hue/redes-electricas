import test from 'node:test';
import assert from 'node:assert/strict';
import legacy from '../src/legacy-redirect.js';
test('el enlace anterior conserva la consulta y sólo redirige al dominio institucional',async()=>{
 for(const path of ['/','/api/parcel?nc=052513547653987000009','//example.org/path']){
  const response=await legacy.fetch(new Request('https://legacy.invalid'+path));
  const target=new URL(response.headers.get('Location'));
  assert.equal(target.origin,'https://idecam-redes-electricas.pages.dev');
  assert.equal(target.pathname,new URL('https://legacy.invalid'+path).pathname);
  assert.equal(target.search,new URL('https://legacy.invalid'+path).search);
  assert.equal(response.status,302);
  assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
 }
});
