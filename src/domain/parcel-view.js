import { bbox, bboxClip, buffer, featureCollection } from '@turf/turf';

// Presentation and exports share this selection. Nearby networks remain internal
// evidence for completeness, but never become a claimed parcel intersection.
export function parcelView(parcel, analysis) {
  const rows = analysis.rows.filter(row => row.intersects);
  const margin = Math.max(12, ...rows.map(row => row.maxHalfWidth ?? 0));
  const extent = bbox(buffer(parcel, margin, { units: 'meters' }));
  const lines = analysis.lines.features
    .filter(line => line.properties.intersects)
    .map(line => bboxClip(line, extent))
    .filter(line => line.geometry.coordinates.length);
  return { rows, lines: featureCollection(lines) };
}
