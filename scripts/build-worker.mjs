import { build } from 'esbuild';
import { readFile,readdir,writeFile,mkdir } from 'node:fs/promises';
import { join,extname } from 'node:path';
await mkdir('build',{recursive:true});
await build({entryPoints:['src/worker.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'build/worker.js'});
// Connector deployments can use this self-contained alternative when uploading
// a Static Assets manifest is unavailable. It shares the identical frontend.
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const assets={};
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),key=prefix+'/'+entry.name;if(entry.isDirectory())await walk(path,key);else{const bytes=await readFile(path);assets[key]={data:bytes.toString('base64'),type:mime[extname(path)]??'application/octet-stream'};}}}
await walk('dist');
const source=await readFile('build/worker.js','utf8');
await writeFile('build/embedded-assets.js',`export default ${JSON.stringify(assets)};`);
await writeFile('build/connector-entry.js',`import app from './worker.js';import files from './embedded-assets.js';export default {async fetch(request,env,ctx){if(new URL(request.url).pathname.startsWith('/api/'))return app.fetch(request,env,ctx);let key=new URL(request.url).pathname;if(key==='/')key='/index.html';const f=files[key];if(!f)return new Response('No encontrado',{status:404});if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});const bytes=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':f.type,'Cache-Control':key==='/index.html'?'no-cache':'public, max-age=86400','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});}};`);
await build({entryPoints:['build/connector-entry.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'build/connector-worker.js'});
console.log('Worker y alternativa autocontenida listos.');
