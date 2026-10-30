import { handleApi } from './server/api.js';
export default {async fetch(request,env,ctx){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/'))return handleApi(request,env,ctx);
  if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
  return env.ASSETS.fetch(request);
}};
