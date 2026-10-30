import { area,bbox,bboxClip,booleanIntersects,buffer,featureCollection,intersect,union,polygonToLine,flattenEach,pointToLineDistance,point } from '@turf/turf';
import { referenceProfile } from './reference.js';
import { isUsableGeometry } from './geometry.js';
import { METHOD_VERSION, SEARCH_MARGIN_METERS } from '../../config/networks.js';
export function searchBox(parcel) {
  if(!isUsableGeometry(parcel?.geometry))throw new Error('PARCEL_INVALID');
  const b=bbox(parcel);const lat=(b[1]+b[3])/2;
  const dy=SEARCH_MARGIN_METERS/110000,dx=SEARCH_MARGIN_METERS/(110000*Math.cos(lat*Math.PI/180));
  const result=[b[0]-dx,b[1]-dy,b[2]+dx,b[3]+dy];
  if((result[2]-result[0])*(result[3]-result[1])>0.15)throw new Error('AREA_TOO_LARGE');
  return result;
}
function combined(features) {
  if(!features.length)return null;if(features.length===1)return features[0];
  return union(featureCollection(features));
}
function boundaries(parcel) {
  const output=[];const p=polygonToLine(parcel);
  flattenEach(p,f=>{if(f.geometry.type==='LineString')output.push(f);});return output;
}
function distanceToParcel(parcel,line,edges) {
  if(booleanIntersects(parcel,line))return 0;
  let min=Infinity;const segments=[];flattenEach(line,f=>segments.push(f));
  for(const segment of segments)for(const edge of edges){
    for(const p of edge.geometry.coordinates)min=Math.min(min,pointToLineDistance(point(p),segment,{units:'meters'}));
    for(const p of segment.geometry.coordinates)min=Math.min(min,pointToLineDistance(point(p),edge,{units:'meters'}));
  }
  return min;
}
export function analyzeParcel(parcel,networkResult,{medium='unknown'}={}) {
  const box=searchBox(parcel);const edges=boundaries(parcel);
  const rows=[],bands=[],minParts=[],maxParts=[];const lines=[];const issues=[];
  let unknownNear=0;
  for(const source of networkResult.sources??[]){
    if(!source.complete)issues.push(source.id);
    for(const original of source.features??[]){
      try {
        const line=bboxClip(original,box);const coords=line.geometry.coordinates;
        if(!coords.length)continue;
        const profile=referenceProfile(original.properties.voltageRaw,medium);
        const distance=distanceToParcel(parcel,line,edges);if(!Number.isFinite(distance))throw new Error('DISTANCE_INVALID');
        const row={...original.properties,voltage:profile.voltage,profile:profile.label,minHalfWidth:profile.min,maxHalfWidth:profile.max,distanceMeters:distance,areaMin:0,areaMax:0,intersects:false,review:false};
        if(profile.max===null){row.review=distance<=SEARCH_MARGIN_METERS;if(row.review)unknownNear++;}
        else {
          const outer=buffer(line,profile.max,{units:'meters',steps:12});
          const inner=profile.min===profile.max?outer:buffer(line,profile.min,{units:'meters',steps:12});
          if(!outer||!inner)throw new Error('BUFFER_INVALID');
          row.intersects=booleanIntersects(parcel,outer);
          if(row.intersects){
            const maxPart=intersect(featureCollection([parcel,outer]));
            const minPart=intersect(featureCollection([parcel,inner]));
            if(maxPart){maxParts.push(maxPart);row.areaMax=area(maxPart);}if(minPart){minParts.push(minPart);row.areaMin=area(minPart);}
          }
          const clippedBand=intersect(featureCollection([outer,{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]],[box[0],box[1]]]]}}]));
          if(clippedBand)bands.push({...clippedBand,properties:{source:row.source,profile:row.profile}});
        }
        lines.push({...line,properties:{...row}});rows.push(row);
      }catch{issues.push(source.id);}
    }
  }
  const overlapMin=combined(minParts),overlapMax=combined(maxParts);
  const affected=rows.filter(r=>r.intersects).length;
  const complete=networkResult.complete===true&&issues.length===0;
  const status=affected?'REFERENCE_INTERSECTION':!complete||unknownNear?'INDETERMINATE':'NO_REFERENCE_INTERSECTION';
  return {status,method:METHOD_VERSION,medium,referenceOnly:true,documentedCorridors:0,complete,failedSources:[...new Set(issues)],unknownNear,affected,
    parcelArea:area(parcel),areaMin:overlapMin?area(overlapMin):0,areaMax:overlapMax?area(overlapMax):0,
    overlapMin,overlapMax,bands:featureCollection(bands),lines:featureCollection(lines),rows:rows.sort((a,b)=>Number(b.intersects)-Number(a.intersects)||a.distanceMeters-b.distanceMeters),
    queriedAt:networkResult.queriedAt,bbox:box};
}
