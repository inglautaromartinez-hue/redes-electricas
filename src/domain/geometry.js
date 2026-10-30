import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";

export function isUsableGeometry(geometry) {
  try {
    if (!["Polygon", "MultiPolygon"].includes(geometry?.type)) return false;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    if (!Array.isArray(polygons) || polygons.length === 0) return false;
    let vertices = 0;
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || polygon.length === 0) return false;
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) return false;
        for (const point of ring) {
          if (++vertices > 100000 || !Array.isArray(point) || point.length < 2 ||
              !point.every(Number.isFinite) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) return false;
        }
        if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) return false;
      }
    }
    // ponytail: reject invalid topology; automatic repair would change the source geometry.
    return new IsValidOp(new GeoJSONReader().read(geometry)).isValid();
  } catch {
    return false;
  }
}
