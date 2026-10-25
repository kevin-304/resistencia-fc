import { tramosSueno } from "./sueno.js";
import { campo, escala, cabecera } from "../interfaz/campos.js";
import { I } from "../ilustraciones/iconos.js";
import { num } from "../../util.js";
export function seccionSueno(d, metaHoras) {
  const multiples = Array.isArray(d.sueno?.tramos),
    tramos = tramosSueno(d.sueno);
  return `<section class="tarjeta" data-sueno>
    ${cabecera("Sueño", I.sueno, "--c-sueno", '<span data-calc="sueno-estado"></span>')}
    <div class="sueno-tramos">${tramos
      .map((t, i) => {
        const base = multiples ? `sueno.tramos.${i}` : "sueno";
        return `<div class="sueno-tramo">
      ${campo("Me dormí", base + ".dormir", d, { tipo: "hora" })}
      ${campo("Me desperté", base + ".despertar", d, { tipo: "hora" })}
      <button type="button" class="boton icono" data-accion="quitar-tramo-sueno" data-tramo="${i}" aria-label="Eliminar tramo" title="Eliminar tramo">${I.basura}</button>
    </div>`;
      })
      .join("")}</div>
    <button type="button" class="boton" data-con-texto data-accion="agregar-tramo-sueno">${I.mas} Añadir tramo de sueño</button>
    <label class="campo sueno-calidad"><span>Calidad del sueño</span>${escala("sueno.calidad", d, 5, ["Muy mala", "Mala", "Normal", "Buena", "Excelente"])}</label>
    <div class="resultado"><div><b data-calc="sueno">—</b><small>horas dormidas (meta ${num(metaHoras, 1)} h)</small></div></div>
    <p class="suave" data-calc="sueno-detalle"></p>
  </section>`;
}
