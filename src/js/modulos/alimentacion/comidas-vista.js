import { estado } from "../datos/estado.js";
import { resolverAyuno } from "./ayuno-nocturno.js";
import {
  ayunoVisible,
  primeraRegistrada,
  comidasVisibles,
  tipoComida,
  limitesComidas,
  selectorAlimentos,
} from "./comidas.js";
import { TIPOS_COMIDA } from "../reportes/metricas.js";
import { DURANTE_AYUNO } from "../rutinas/plan.js";
import { campo } from "../interfaz/campos.js";
import { campoHora } from "../reloj/selector-hora.js";
import { iconoArrastrar } from "../ilustraciones/iconos-alimentos.js";
import { I } from "../ilustraciones/iconos.js";
import { escapar, fechaLarga } from "../../util.js";
function seccionAyuno(d, plan, fecha) {
  const activo = ayunoVisible(d),
    a = resolverAyuno(fecha, estado.dias),
    campos = {
      ...d,
      ayuno: { ...d.ayuno, anterior: a.anterior, primera: a.primera },
    };
  return `<details class="comida comida-nueva tarjeta ayuno-simple" data-comida-id="ayuno" data-ayuno-config ${activo ? "" : "hidden"}><summary class="ayuno-cabecera"><button type="button" class="comida-agarre" data-arrastrar-comida aria-label="Reordenar ayuno" title="Arrastra para reordenar">${iconoArrastrar}</button><b>Ayuno nocturno</b><button type="button" class="boton fantasma eliminar-ayuno" data-accion="desactivar-ayuno" aria-label="Eliminar ayuno" title="Eliminar ayuno">${I.basura}</button></summary><div class="horas-comida ayuno-nocturno">
 <div class="ayuno-origen"><span>Última comida de ayer</span><strong data-ayuno-anterior>${escapar(a.anterior || "Sin comida registrada ayer")}</strong></div>
 <div>${campo("Primera comida de hoy", "ayuno.primera", campos, { tipo: "hora" })}<small class="suave">${fechaLarga(fecha)}</small></div></div>
 <div id="cuenta-regresiva" class="ayuno-contador"></div>
 <button type="button" class="boton" data-accion="terminar-ayuno" hidden>Terminar ahora</button>
 <details class="desplegable"><summary>Qué puedo tomar en ayuno</summary><ul>${DURANTE_AYUNO.map((x) => `<li>${x}</li>`).join("")}</ul></details>
 </details>`;
}

export function seccionAgua(d) {
  return `<section class="tarjeta agua-registro"><div class="contador agua-simple"><span>Agua</span><button type="button" class="boton" data-sumar="agua" data-paso="-1">−</button><span class="valor">${d.agua || 0}</span><button type="button" class="boton" data-sumar="agua" data-paso="1">+</button><small>vasos</small></div></section>`;
}

export function seccionComidas(d, plan, fecha) {
  return `<section class="tarjeta" id="sec-comidas"><details class="anadir-comida"><summary class="boton">${I.mas} Añadir comida</summary><div class="menu-comidas">${d.ayuno?.activo === false && primeraRegistrada(d) ? '<button type="button" data-accion="configurar-ayuno">Mostrar ayuno</button>' : ""}${[
    ...TIPOS_COMIDA,
  ]
    .sort(
      (a, b) =>
        [
          "primera",
          "almuerzo",
          "merienda",
          "cena",
          "intermedia",
          "primera-comida",
          "ultima-comida",
        ].indexOf(a.id) -
        [
          "primera",
          "almuerzo",
          "merienda",
          "cena",
          "intermedia",
          "primera-comida",
          "ultima-comida",
        ].indexOf(b.id),
    )
    .map(
      (t) =>
        `<button type="button" data-accion="agregar-comida" data-tipo="${t.id}">${t.nombre}</button>`,
    )
    .join(
      "",
    )}</div></details><div class="lista-comidas">${seccionAyuno(d, plan, fecha)}${comidasVisibles(
    d,
  )
    .map(
      (
        c,
      ) => `<details class="comida comida-nueva" data-comida-id="${escapar(c.id)}"><summary><button type="button" class="comida-agarre" data-arrastrar-comida aria-label="Reordenar comida" title="Arrastra para reordenar; usa las flechas arriba y abajo con el teclado">${iconoArrastrar}</button><b>${escapar(TIPOS_COMIDA.find((t) => t.id === tipoComida(c))?.nombre || "Comida")}</b><small>${escapar(c.hora || "")}</small><button type="button" class="boton guardar-comida-cabecera" data-accion="guardar-comida" data-id-comida="${escapar(c.id)}">Guardar</button><button type="button" class="boton icono fantasma" data-accion="borrar-comida" data-id-comida="${escapar(c.id)}" aria-label="Eliminar comida">${I.basura}</button></summary>
 <div class="comida-edicion"><label class="campo"><span>Comida</span><select data-comida="${escapar(c.id)}" data-k="tipo">${TIPOS_COMIDA.map((t) => `<option value="${t.id}" ${t.id === tipoComida(c) ? "selected" : ""}>${t.nombre}</option>`).join("")}</select></label>
 <label class="campo"><span>Hora</span>${campoHora(c.hora, `data-comida="${escapar(c.id)}" data-k="hora"`, "Hora de comida")}</label>
 </div>
 <div class="comida-limites"><label><input type="checkbox" data-limite-comida="primeraDelDia" data-id-comida="${escapar(c.id)}" ${limitesComidas(d).primera?.id === c.id ? "checked" : ""}> Primera del día</label><label><input type="checkbox" data-limite-comida="ultimaDelDia" data-id-comida="${escapar(c.id)}" ${limitesComidas(d).ultima?.id === c.id ? "checked" : ""}> Última del día</label></div>
 ${selectorAlimentos(c, estado.config.alimentosPersonalizados)}<label class="campo comida-libre"><span>Otro alimento o detalle</span><input type="text" data-comida="${escapar(c.id)}" data-k="textoLibre" value="${escapar(c.textoLibre ?? (!c.items?.length ? c.desc || "" : ""))}"></label>${c.kcal != null && !c.kcalPorAlimentos ? `<label class="campo total-anterior"><span>Total registrado (kcal)</span><input inputmode="decimal" data-comida="${escapar(c.id)}" data-k="kcal" value="${c.kcal}"></label>` : ""}</details>`,
    )
    .join("")}</div>
 </section>`;
}
