import { normalizarPlan, planVacio } from "./plan.js";
import {
  hoyISO,
  lunesDe,
  sumarDias,
  idUnico,
  aISO,
  deISO,
} from "../../util.js";
const fechaValida = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  aISO(deISO(v)) === v;
export function copiarPlantilla(plan, { historial = false } = {}) {
  const copia = structuredClone(normalizarPlan(plan));
  delete copia.programacionRutinas;
  delete copia.inicioRutina;
  delete copia.rutinaNombre;
  delete copia.rutinaId;
  if (!historial) {
    delete copia.planAnterior;
    delete copia.vigenteDesde;
  }
  return copia;
}
export function normalizarProgramacion(config, perfil, fecha = hoyISO()) {
  const existente = config.programacionRutinas;
  if (existente?.rutinas?.length) return structuredClone(existente);
  return {
    version: 1,
    seleccionada: "rutina-1",
    rutinas: [
      {
        id: "rutina-1",
        nombre: "1",
        inicio: perfil?.fechaInicio || lunesDe(fecha),
        fin: null,
        meta: "",
        primeraSesion: null,
        borrador: false,
        plan: copiarPlantilla(config.plan, { historial: true }),
      },
    ],
  };
}
export function planConProgramacion(config) {
  return {
    ...normalizarPlan(config.plan),
    programacionRutinas: config.programacionRutinas,
  };
}
export function rutinaVigente(programacion, fecha = hoyISO()) {
  return (
    (programacion?.rutinas || [])
      .map((r, i) => ({ ...r, indice: i }))
      .filter((r) => !r.borrador && r.inicio <= fecha)
      .sort(
        (a, b) => b.inicio.localeCompare(a.inicio) || b.indice - a.indice,
      )[0] || null
  );
}
export function estadoRutina(r, programacion, fecha = hoyISO()) {
  if (r.borrador) return "Sin programar";
  if (r.inicio > fecha) return "Programada";
  if (r.fin && fecha > r.fin) return "Finalizada";
  return rutinaVigente(programacion, fecha)?.id === r.id
    ? "Activa"
    : "Anterior";
}
export function nuevaRutina(
  programacion,
  actual,
  { nombre, base = "actual", fecha = hoyISO() } = {},
) {
  const r = {
    id: idUnico(),
    nombre: (nombre || String(programacion.rutinas.length + 1))
      .replace(/^rutina\s*:\s*/i, "")
      .trim(),
    inicio: sumarDias(lunesDe(fecha), 7),
    fin: null,
    meta: "",
    primeraSesion: null,
    borrador: true,
    plan:
      base === "vacia"
        ? { ...planVacio(), actividades: [] }
        : copiarPlantilla(actual.plan),
  };
  programacion.rutinas.push(r);
  programacion.seleccionada = r.id;
  return r;
}
export function validarFechasRutina({ inicio, fin, primeraSesion }) {
  if (!fechaValida(inicio)) return "Elige una fecha de inicio válida.";
  if (fin && (!fechaValida(fin) || fin < inicio))
    return "La fecha de fin debe ser igual o posterior al inicio.";
  if (
    primeraSesion &&
    (!fechaValida(primeraSesion) ||
      primeraSesion < inicio ||
      (fin && primeraSesion > fin))
  )
    return "La primera sesión debe estar dentro de las fechas de la rutina.";
  return null;
}
