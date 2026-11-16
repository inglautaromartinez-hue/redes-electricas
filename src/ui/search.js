export function parseSearch(value){
 const text=String(value??'').trim(),digits=text.replace(/\D/g,'');
 if(!text)return {kind:'empty'};
 if(!/[a-záéíóúñ]/i.test(text)){
  const nums=text.match(/[+-]?\d+(?:[.,]\d+)?/g);
  if(nums?.length===2&&/[;,\s]/.test(text)&&(/[-+.,]/.test(text))){
   const [x,y]=nums.map(n=>Number(n.replace(',','.')));
   if(digits.length===21&&(Math.abs(x)>180||Math.abs(y)>180))return {kind:'nc',nc:digits,valid:true};
   if(x>=-37.6&&x<=-31.5&&y>=-71.5&&y<=-66)return {kind:'coordinates',inverted:true,x,y};
   return {kind:'coordinates',x,y,valid:x>=-71.5&&x<=-66&&y>=-37.6&&y<=-31.5};
  }
  return {kind:'nc',nc:digits,valid:digits.length===21};
 }
 return {kind:'place',query:text};
}
export function groupNc(value){const v=String(value).replace(/\D/g,'').slice(0,21);let at=0;return [2,2,2,4,6,4,1].map(n=>{const s=v.slice(at,at+n);at+=n;return s;}).filter(Boolean).join(' · ');}
export function shareUrl(origin,nc,medium){const url=new URL(origin);url.search='';url.hash='';url.searchParams.set('nc',nc);url.searchParams.set('mt',medium);return url.href;}
