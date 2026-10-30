export const DEPARTMENTS = Object.freeze({
  "01": "Capital",
  "03": "Las Heras",
  "04": "Guaymallén",
  "05": "Godoy Cruz",
  "06": "Luján de Cuyo",
  "07": "Maipú",
  "08": "San Martín",
  "09": "Junín",
  "10": "Rivadavia",
  "11": "Santa Rosa",
  "12": "La Paz",
  "13": "Lavalle",
  "14": "Tupungato",
  "15": "Tunuyán",
  "16": "San Carlos",
  "17": "San Rafael",
  "18": "General Alvear",
  "19": "Malargüe",
});

export function getDepartmentByCode(code) {
  return DEPARTMENTS[String(code)] ?? null;
}
