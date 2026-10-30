const DECIMAL = /^[+-]?\d+(?:[.,]\d+)?$/;
const DOT = "[+-]?\\d+(?:\\.\\d+)?";
const NUMBER = "[+-]?\\d+(?:[.,]\\d+)?";
const PAIR = new RegExp(`^(${NUMBER})(?:[ \\t]*;[ \\t]*|[ \\t]+)(${NUMBER})$`);
const COMMA_PAIR = new RegExp(`^(${DOT})[ \\t]*,[ \\t]*(${DOT})$`);
const LABELED = new RegExp(`^(lon|lat|x|y)[ \\t]*=[ \\t]*(${NUMBER})[ \\t]*;[ \\t]*(lon|lat|x|y)[ \\t]*=[ \\t]*(${NUMBER})$`, "i");
// Provisional rejection rectangle only; department WFS decides jurisdiction.
export const MENDOZA_COARSE_BOUNDS = Object.freeze({
  west: -71.5, east: -66, south: -37.6, north: -31.5,
});
const PROFILES = Object.freeze({
  "EPSG:4326": { datum: "WGS84", units: "deg" },
  "EPSG:22172": { datum: "POSGAR98", units: "m", zone: "2", hemisphere: "S" },
  "EPSG:5344": { datum: "POSGAR2007", units: "m", zone: "2", hemisphere: "S", realization: "POSGAR2007" },
});

function decimal(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !DECIMAL.test(value.trim())) return null;
  const number = Number(value.trim().replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function result(status, reason, extra = {}) {
  return {
    status, reason, crs: null, x: null, y: null, longitude: null, latitude: null,
    normalized: null, sourcePoint: null, resolvedContext: null,
    canonicalProjected: null, missing: [], candidates: [], evidence: [], warnings: [],
    ...extra,
  };
}

function syntax(text) {
  if (typeof text !== "string") return { reason: "NON_DECIMAL_OR_NON_FINITE" };
  const raw = text.trim();
  if (!raw) return { reason: "EMPTY_INPUT" };
  const labeled = raw.match(LABELED);
  const pair = labeled || raw.match(PAIR) || raw.match(COMMA_PAIR);
  if (!pair) {
    if (/\d[eE][+-]?\d/.test(raw)) return { reason: "EXPONENT_NOT_SUPPORTED" };
    if (/\d[dD]\d+[mM]/.test(raw)) return { reason: "DMS_NOT_SUPPORTED" };
    if ((raw.match(/,/g) || []).length > 1 && !/[; \t]/.test(raw)) {
      return { reason: "DECIMAL_SEPARATOR_COLLISION" };
    }
    if (/^(?:[+-]?\d+(?:[.,]\d+)?[ \t]+){2}[+-]?\d+(?:[.,]\d+)?$/.test(raw)) {
      return { reason: "EXPECTED_TWO_VALUES" };
    }
    if (/\b(?:NaN|Infinity)\b/i.test(raw)) return { reason: "NON_DECIMAL_OR_NON_FINITE" };
    return { reason: "RESIDUAL_TEXT" };
  }
  const tokens = labeled ? [pair[2], pair[4]] : [pair[1], pair[2]];
  if (tokens.some((token) => token.includes(".")) && tokens.some((token) => token.includes(","))) {
    return { reason: "MIXED_DECIMAL_MARKS" };
  }
  const values = tokens.map(decimal);
  if (values.includes(null)) return { reason: "NON_DECIMAL_OR_NON_FINITE" };
  const labels = labeled ? [pair[1].toLowerCase(), pair[3].toLowerCase()] : null;
  if (labels && labels[0] === labels[1]) return { reason: "DUPLICATE_AXIS" };
  if (labels && !["lon,lat", "lat,lon", "x,y", "y,x"].includes(labels.join(","))) {
    return { reason: "INCOMPATIBLE_AXIS_LABELS" };
  }
  let reason = "EXPLICIT_CONTEXT";
  if (tokens.some((token) => token.includes(","))) {
    reason = raw.includes(";") ? "DECIMAL_COMMA_SEMICOLON" : "DECIMAL_COMMA_WHITESPACE";
  } else if (raw.match(COMMA_PAIR) && tokens.every((token) => !token.includes("."))) {
    reason = "INTEGER_PAIR_COMMA";
  }
  return { values, labels, reason };
}

function geographicRange(longitude, latitude) {
  if (longitude < -180 || longitude > 180) return "LONGITUDE_OUT_OF_RANGE";
  if (latitude < -90 || latitude > 90) return "LATITUDE_OUT_OF_RANGE";
  return null;
}

/**
 * Pure textual parser. context declares the CRS/profile and axes; policy.required
 * can require realization/coordinateEpoch. EXACT does not authorize WFS or ZSF.
 */
// ponytail: closed decimal 2D grammar and syntax-only projected profiles.
// New formats or transformations require explicit review and independent GIS QA.
export function parseCoordinates(text, context = {}, policy = {}) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return result("INVALID", "INVALID_CONTEXT");
  }
  if (!policy || typeof policy !== "object" || Array.isArray(policy) ||
      (policy.required !== undefined && (!Array.isArray(policy.required) ||
        policy.required.some((key) => !["realization", "coordinateEpoch"].includes(key))))) {
    return result("INVALID", "INVALID_POLICY");
  }
  if (typeof context.crs === "string" && /(?:^|[:/])32719$/i.test(context.crs.trim())) {
    return result("INVALID", "CRS_EXCLUDED_BY_PROJECT");
  }
  const parsed = syntax(text);
  if (!parsed.values) return result("INVALID", parsed.reason);
  const profile = Object.hasOwn(PROFILES, context.crs) ? PROFILES[context.crs] : null;
  for (const [key, reason] of [
    ["datum", "CRS_DATUM_CONFLICT"], ["units", "CRS_UNITS_CONFLICT"],
    ["realization", "CRS_REALIZATION_CONFLICT"], ["zone", "CRS_ZONE_CONFLICT"],
    ["hemisphere", "CRS_HEMISPHERE_CONFLICT"],
  ]) {
    if (profile?.[key] && context[key] != null && context[key] !== profile[key]) {
      return result("INVALID", reason);
    }
  }
  if (profile && context.projection != null) {
    return result("INVALID", "UNSUPPORTED_PROJECTION_DECLARATION");
  }
  if (context.coordinateEpoch != null &&
      (typeof context.coordinateEpoch !== "number" || !Number.isFinite(context.coordinateEpoch))) {
    return result("INVALID", "INVALID_COORDINATE_EPOCH");
  }
  const crs = context.crs ?? null;
  const datum = context.datum ?? profile?.datum ?? null;
  const units = context.units ?? profile?.units ?? null;
  const projected = units === "m";
  let order = context.order ?? null;
  if (order && !["lon-lat", "lat-lon", "easting-northing", "northing-easting"].includes(order)) {
    return result("INVALID", "UNSUPPORTED_ORDER");
  }
  if (parsed.labels) {
    let labeledOrder;
    if (parsed.labels.includes("lon")) {
      if (projected) return result("INVALID", "AXIS_PROFILE_CONFLICT");
      labeledOrder = parsed.labels.join("-");
    } else {
      if (profile && !projected) return result("INVALID", "XY_REQUIRES_PROJECTED_PROFILE");
      const axes = parsed.labels.map((label) => context.axisLabels?.[label.toUpperCase()]);
      if (axes.every((axis) => axis != null)) {
        labeledOrder = axes.join("-");
        if (!["easting-northing", "northing-easting"].includes(labeledOrder)) {
          return result("INVALID", "INVALID_AXIS_SEMANTICS");
        }
      }
    }
    if (order && labeledOrder && order !== labeledOrder) return result("INVALID", "ORDER_LABEL_CONFLICT");
    // X/Y without declared meanings do not inherit the CRS authority's axes.
    order = labeledOrder ?? null;
  }
  if (profile && order && (projected !== order.includes("easting"))) {
    return result("INVALID", "AXIS_PROFILE_CONFLICT");
  }
  const missing = [];
  if (!crs) missing.push("crs");
  if (!datum) missing.push("datum");
  if (!order) missing.push(parsed.labels?.includes("x") ? "axis_semantics" : "order");
  if (!units) missing.push("units");
  if (!profile && projected) {
    if (context.projection === "UTM") {
      if (context.zone == null) missing.push("zone");
      if (context.hemisphere == null) missing.push("hemisphere");
    } else missing.push("zone_if_required");
  }
  for (const key of policy.required ?? []) {
    if (context[key] == null && !missing.includes(key)) missing.push(key);
  }
  if (!profile || missing.length) {
    let reason = "MISSING_REFERENCE_AND_ORDER";
    if (crs && !profile) reason = "UNRESOLVED_CRS_PROFILE";
    else if (context.projection === "UTM") reason = "INCOMPLETE_PROJECTED_PROFILE";
    else if (projected && !crs) reason = "MISSING_PROJECTED_REFERENCE";
    else if (missing.length === 1 && missing[0] === "coordinateEpoch") reason = "REQUIRED_COORDINATE_EPOCH_MISSING";
    else if (missing.length === 1 && missing[0] === "realization") reason = "REQUIRED_REALIZATION_MISSING";
    else if (missing.length === 1 && missing[0] === "order") reason = "MISSING_ORDER";
    else if (missing.length === 1 && missing[0] === "crs") reason = "MISSING_CRS";
    else if (order) reason = "MISSING_REFERENCE";
    const candidates = !projected && !order && !parsed.labels
      ? ["lon-lat", "lat-lon"].map((candidateOrder) => ({
        values: [...parsed.values], order: candidateOrder,
        lonLat: candidateOrder === "lon-lat" ? [...parsed.values] : [...parsed.values].reverse(),
        missing: [...missing],
      })).filter((candidate) => !geographicRange(...candidate.lonLat)) : [];
    return result("AMBIGUOUS", reason, { missing, candidates });
  }
  const sourcePoint = {
    values: [...parsed.values], order,
    axisLabels: parsed.labels ? projected ? { ...context.axisLabels } : { lon: "longitude", lat: "latitude" } : null,
    crs, datum, realization: context.realization ?? null,
    coordinateEpoch: context.coordinateEpoch ?? null, units,
    zone: context.zone ?? profile.zone ?? null, hemisphere: context.hemisphere ?? profile.hemisphere ?? null,
  };
  const [first, second] = parsed.values;
  const longitude = projected ? null : order === "lon-lat" ? first : second;
  const latitude = projected ? null : order === "lon-lat" ? second : first;
  const rangeError = projected ? null : geographicRange(longitude, latitude);
  if (rangeError) return result("INVALID", rangeError);
  let reason = parsed.reason;
  if (projected) reason = parsed.labels && context.axisLabels.X === "northing" && context.axisLabels.Y === "easting"
    ? "EXPLICIT_ARGENTINE_AXIS_CONVENTION" : "EXPLICIT_PROJECTED_PROFILE";
  else if (parsed.labels) reason = "LABELED_AXES";
  const { values, ...resolvedContext } = sourcePoint;
  return result("EXACT", reason, {
    crs, sourcePoint, resolvedContext,
    x: longitude, y: latitude, longitude, latitude,
    normalized: projected ? null : `${longitude},${latitude}`,
    canonicalProjected: projected ? {
      xEast: order === "easting-northing" ? first : second,
      yNorth: order === "northing-easting" ? first : second,
    } : null,
    evidence: ["DECLARED_CRS_PROFILE", ...(parsed.labels ? ["TEXT_AXIS_LABELS"] : ["DECLARED_ORDER"]), "DECIMAL_SYNTAX"],
    warnings: projected ? ["PROJECTED_RESOLUTION_DISABLED"] : [],
  });
}

/**
 * Service entry contract: {x, y, crs='EPSG:4326'}, numbers or full decimal strings.
 * Continue only on EXACT + EPSG:4326 + finite longitude/latitude from this API.
 * INVALID must map to INDETERMINATE before any spatial query or ZSF evaluation.
 */
export function parseCoordinateInput(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return result("INVALID", "EXPECTED_TWO_FIELDS");
  const { x, y, crs = "EPSG:4326" } = input;
  if (crs !== "EPSG:4326") {
    return result("INVALID", typeof crs === "string" && /(?:^|[:/])32719$/i.test(crs.trim())
      ? "CRS_EXCLUDED_BY_PROJECT" : "CRS_NOT_ENABLED");
  }
  const longitude = decimal(x);
  const latitude = decimal(y);
  if (longitude === null || latitude === null) return result("INVALID", "EXPECTED_TWO_DECIMAL_FIELDS");
  const rangeError = geographicRange(longitude, latitude);
  if (rangeError) return result("INVALID", rangeError);
  // ponytail: provisional bounding rectangle, NOT provincial jurisdiction.
  // Final department membership must be resolved by the department WFS.
  const { west, east, south, north } = MENDOZA_COARSE_BOUNDS;
  if (longitude < west || longitude > east || latitude < south || latitude > north) {
    return result("INVALID", "OUTSIDE_ADMITTED_AREA");
  }
  return parseCoordinates(`${longitude};${latitude}`, { crs, order: "lon-lat" });
}
