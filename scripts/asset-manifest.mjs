import {createRequire}from 'node:module';import{readdir,readFile,writeFile}from 'node:fs/promises';import{join,extname}from 'node:path';
const require=createRequire(import.meta.url);const {hash}=require('blake3-wasm');
const manifest={};
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='_headers'||entry.name==='_redirects')continue;const path=join(dir,entry.name),key=prefix+'/'+entry.name;if(entry.isDirectory())await walk(path,key);else{const b=await readFile(path);manifest[key]={hash:hash(b.toString('base64')+extname(path).slice(1)).toString('hex').slice(0,32),size:b.length};}}}
await walk('dist');await writeFile('build/asset-manifest.json',JSON.stringify(manifest));console.log(JSON.stringify(manifest));
