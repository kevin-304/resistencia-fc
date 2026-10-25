import { obtener, escapar } from "../../util.js";
import { campoHora } from "../reloj/selector-hora.js";
export function campo(
  etiqueta,
  camino,
  d,
  { tipo = "texto", unidad = "", ph = "" } = {},
) {
  const v = obtener(d, camino);
  const valor =
    v == null ? "" : tipo === "num" ? String(v).replace(".", ",") : v;
  const tipoInput = tipo === "hora" ? "time" : "text";
  const input =
    tipo === "hora"
      ? campoHora(valor, `data-c="${camino}" data-t="hora"`, etiqueta)
      : `<input type="${tipoInput}" data-c="${camino}" data-t="${tipo}" value="${escapar(valor)}" placeholder="${escapar(ph)}" ${tipo === "num" ? 'inputmode="decimal"' : ""}>`;
  return `<label class="campo"><span>${etiqueta}</span>${
    unidad ? `<div class="con-unidad">${input}<em>${unidad}</em></div>` : input
  }</label>`;
}

export function seleccion(etiqueta, camino, d, opciones, defecto) {
  const v = obtener(d, camino) ?? defecto ?? "";
  return `<label class="campo"><span>${etiqueta}</span><select data-c="${camino}">${opciones.map((o) => `<option value="${o.id}" ${o.id === v ? "selected" : ""}>${escapar(o.nombre)}</option>`).join("")}</select></label>`;
}

export function escala(camino, d, max, etiquetas) {
  const v = obtener(d, camino);
  return `<div class="estrellas">${Array.from({ length: max }, (_, i) => i + 1)
    .map(
      (n) =>
        `<button type="button" data-valor-de="${camino}" data-valor="${n}" class="${v === n ? "activo" : ""}" title="${etiquetas?.[n - 1] || n}">${n}</button>`,
    )
    .join("")}</div>`;
}

export function cabecera(titulo, icono, colorVar, extra = "") {
  return `<div class="tarjeta-cab"><span class="icono-sec" style="background:color-mix(in srgb, var(${colorVar}) 18%, transparent);color:var(${colorVar})">${icono}</span><h2>${titulo}</h2>${extra}</div>`;
}
