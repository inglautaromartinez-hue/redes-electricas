import { getDepartmentByCode } from "./departments.js";

export const NOMENCLATURE_ERRORS = Object.freeze({
  EMPTY: "EMPTY",
  TOO_SHORT: "TOO_SHORT",
  UNSUPPORTED_DEPARTMENT: "UNSUPPORTED_DEPARTMENT",
});

export function normalizeNomenclature(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function parseNomenclature(value) {
  const normalized = normalizeNomenclature(value);
  const departmentCode = normalized.slice(0, 2);
  const department = normalized.length >= 2 ? getDepartmentByCode(departmentCode) : null;
  const error = getNomenclatureError(normalized, department);

  return {
    raw: String(value ?? ""),
    normalized,
    departmentCode,
    department,
    isRoutable: !error,
    error,
  };
}

function getNomenclatureError(normalized, department) {
  if (normalized.length === 0) return NOMENCLATURE_ERRORS.EMPTY;
  if (normalized.length < 2) return NOMENCLATURE_ERRORS.TOO_SHORT;
  if (!department) return NOMENCLATURE_ERRORS.UNSUPPORTED_DEPARTMENT;
  return null;
}
