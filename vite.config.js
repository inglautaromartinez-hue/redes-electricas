import {defineConfig} from 'vite';
// Desarrollo local: ejecuta los mismos handlers que Pages, sin modificar contratos.
export default defineConfig({
 server:{allowedHosts:['terminal.local']},
 plugins:[{name:'redes-api-local',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
   if(!req.url?.startsWith('/api/'))return next();
   try{const {handleApi}=await import('./src/server/api.js');const response=await handleApi(new Request(new URL(req.url,'http://localhost'),{method:req.method}));res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()));}
   catch{res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'CONSULTATION_UNAVAILABLE'}));}
  });
 }}],build:{target:'es2022'}
});
