import proj4 from "proj4";
import { parseNomenclature } from "./nomenclature.js";
import { parseCoordinateInput } from "./coordinates.js";

// ponytail: inverse-only operation authorized for assisted positional NC lookup.
// This does not enable projected inputs in the general coordinate service.
export const POSITIONAL_OPERATION = "+proj=tmerc +lat_0=-90 +lon_0=-69 +k=1 +x_0=2500000 +y_0=0 +ellps=WGS84 +units=m +no_defs +towgs84=-0.41,0.46,-0.35";

export function parsePositionalNomenclature(input) {
  const parsed = parseNomenclature(input);
  const blocks = parsed.normalized.match(/^\d{2}(2\d{6})(6\d{6})(\d*)$/);
  const isPositional = parsed.isRoutable && blocks !== null;
  return { normalized: parsed.normalized, departmentCode: parsed.departmentCode,
    isPositional, x: isPositional ? Number(blocks[1]) : null,
    y: isPositional ? Number(blocks[2]) : null, remainder: isPositional ? blocks[3] : null };
}

export function positionalNomenclaturePoint(input) {
  const parsed = parsePositionalNomenclature(input);
  if (!parsed.isPositional) throw new Error("POSITIONAL_NOMENCLATURE_INVALID");
  // Operational NC axes are Easting, Northing, regardless of formal EPSG axes.
  const [x, y] = proj4(POSITIONAL_OPERATION, "EPSG:4326", [parsed.x, parsed.y]);
  const checked = parseCoordinateInput({ x, y, crs: "EPSG:4326" });
  if (checked.status !== "EXACT") throw new Error("POSITIONAL_POINT_INVALID");
  return { x, y, crs: "EPSG:4326" };
}
