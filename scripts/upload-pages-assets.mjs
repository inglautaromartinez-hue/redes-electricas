// Project-scoped, short-lived asset JWT arrives through stdin, never a file.
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.includes('\n'))break;}
const {jwt}=JSON.parse(input);
const manifest=JSON.parse(await readFile('build/asset-manifest.json','utf8'));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
async function request(path,body){const response=await fetch('https://api.cloudflare.com/client/v4/pages/assets/'+path,{method:'POST',headers:{Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok||data.success===false)throw Error('Pages asset request failed: '+response.status);return data.result;}
const hashes=Object.values(manifest).map(v=>v.hash);
const missing=await request('check-missing',{hashes});
const payload=await Promise.all(Object.entries(manifest).filter(([,v])=>missing.includes(v.hash)).map(async([path,v])=>({key:v.hash,value:(await readFile('dist'+path)).toString('base64'),base64:true,metadata:{contentType:types[extname(path)]??'application/octet-stream'}})));
if(payload.length)await request('upload',payload);
await request('upsert-hashes',{hashes});
console.log(JSON.stringify({uploaded:payload.length,total:hashes.length}));
