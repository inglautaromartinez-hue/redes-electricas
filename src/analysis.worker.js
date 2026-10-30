import { analyzeParcel,searchBox } from './domain/analysis.js';
self.onmessage=event=>{const {id,kind,parcel,networks,options}=event.data;try{self.postMessage({id,value:kind==='bbox'?searchBox(parcel):analyzeParcel(parcel,networks,options)});}catch{self.postMessage({id,error:'ANALYSIS_UNAVAILABLE'});}};
