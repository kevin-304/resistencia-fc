import { estado } from "../datos/estado.js";
import { TIPOS_SESION, ZONAS_MOLESTIA } from "../rutinas/plan.js";
import { campo, seleccion, escala, cabecera } from "../interfaz/campos.js";
import { I } from "../ilustraciones/iconos.js";
export function seccionRuta(d, plan) {
  if (plan.descanso)
    return '<section class="tarjeta"><p class="suave">Descanso</p></section>';
  const r = d.ruta || {};
  const terreno = r.terreno || plan.ruta?.terreno || "montana";
  const opcionesRutas = [
    { id: "", nombre: "— Sin ruta guardada —" },
    ...estado.rutas.map((x) => ({
      id: x.id,
      nombre: `${x.nombre} (${x.terreno === "plano" ? "plano" : x.terreno === "mixto" ? "mixto" : "montaña"})`,
    })),
  ];
  const rpe = [
    "Muy fácil",
    "Fácil",
    "Fácil",
    "Moderado",
    "Moderado",
    "Algo duro",
    "Duro",
    "Muy duro",
    "Máximo casi",
    "Máximo",
  ];
  return `<section class="tarjeta">
    ${cabecera("Ruta", I.ruta, "--c-ruta", '<span data-calc="ruta-estado"></span>')}
    <div class="ruta-campos">
      ${seleccion("Ruta", "ruta.rutaId", d, opcionesRutas, r.rutaId ?? "")}
      ${seleccion("Tipo de sesión", "ruta.tipo", d, TIPOS_SESION, plan.ruta?.tipo || "ligera")}
      ${campo("Hora de salida", "ruta.salida", d, { tipo: "hora" })}
      ${campo("Hora de llegada", "ruta.llegada", d, { tipo: "hora" })}
      ${campo("Distancia", "ruta.distancia", d, { tipo: "num", unidad: "km" })}
      ${campo("Calorías quemadas", "ruta.kcal", d, { tipo: "num", unidad: "kcal" })}
    </div>
    <div class="ruta-calificacion">
      <label class="campo ruta-esfuerzo"><span>Esfuerzo (1–10)</span>${escala("ruta.rpe", d, 10, rpe)}</label>
      ${seleccion("Molestia", "ruta.molestiaZona", d, [{ id: "ninguna", nombre: "Ninguna" }, ...ZONAS_MOLESTIA.map((z) => ({ id: z, nombre: z }))], "ninguna")}
    </div>
  </section>`;
}
