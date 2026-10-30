import { analyzeParcel,searchBox } from './domain/analysis.js';
import { parcelView } from './domain/parcel-view.js';
self.onmessage=event=>{const {id,kind,parcel,networks,options}=event.data;try{let value;if(kind==='bbox')value=searchBox(parcel);else{value=analyzeParcel(parcel,networks,options);value.view=parcelView(parcel,value);}self.postMessage({id,value});}catch{self.postMessage({id,error:'ANALYSIS_UNAVAILABLE'});}};
