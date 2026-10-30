// Short-lived upload capability is read from stdin and never stored on disk.
// stdout carries only the API completion response for the calling deploy tool.
import{readFile}from 'node:fs/promises';import{extname}from 'node:path';
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.includes('\n'))break;}
const {accountId,jwt,buckets}=JSON.parse(input);if(!/^[a-f0-9]{32}$/.test(accountId))throw Error('Invalid account');
const manifest=JSON.parse(await readFile('build/asset-manifest.json','utf8'));
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
let completion='';
for(const bucket of buckets){const form=new FormData();for(const digest of bucket){const entry=Object.entries(manifest).find(([,v])=>v.hash===digest);if(!entry)throw Error('Asset not in manifest');const file=await readFile('dist'+entry[0]);form.append(digest,new Blob([file.toString('base64')],{type:types[extname(entry[0])]??'application/octet-stream'}),digest);}
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/assets/upload?base64=true`,{method:'POST',headers:{Authorization:`Bearer ${jwt}`},body:form});
 const data=await r.json();if(!r.ok||data.success===false){console.log(JSON.stringify({error:true,status:r.status,errors:data.errors}));process.exit(1);}completion=data.result?.jwt??completion;
}
console.log(JSON.stringify({jwt:completion}));
