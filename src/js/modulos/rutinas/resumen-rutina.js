import { construirSesion } from "../reloj/reloj-rutina.js";
import { escapar } from "../../util.js";
import { crearPreparacion } from "./preparacion-sesion.js";
export function resumenRutina(rutina, ejercicios, ajustes = null) {
  if (!ajustes && !construirSesion(rutina, ejercicios).es60)
    ajustes = crearPreparacion(rutina, ejercicios);
  const { etapas } = construirSesion(rutina, ejercicios, { ajustes });
  const grupos = new Map();
  for (const e of etapas) {
    const g = grupos.get(e.bloque) || {
      segundos: 0,
      vueltas: 0,
      nombres: new Set(),
    };
    g.segundos += e.segundos;
    g.vueltas = Math.max(g.vueltas, e.vueltas || 0);
    if (e.clase !== "descanso") g.nombres.add(e.nombre);
    grupos.set(e.bloque, g);
  }
  return `<div class="resumen-etapas resumen-con-listas">${[...grupos].map(([nombre, g]) => `<div><b>${escapar(nombre === "Cardio de cierre" ? "Cardio" : nombre)}</b><strong>${Math.round(g.segundos / 6) / 10} min</strong>${g.vueltas > 1 ? `<small>${g.vueltas} vueltas</small>` : ""}<ul>${[...g.nombres].map((n) => `<li>${escapar(n)}</li>`).join("")}</ul></div>`).join("")}</div>`;
}
