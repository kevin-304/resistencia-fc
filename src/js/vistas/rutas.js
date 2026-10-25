// Rutas guardadas y adaptación de terreno (montaña ↔ plano) con la equivalencia en km-esfuerzo.
import {
  estado,
  contexto,
  guardarRutas,
  guardarConfig,
  nuevaRuta,
} from "../modulos/datos/estado.js";
import { metricasRango } from "../modulos/reportes/metricas.js";
import { PISTA } from "../modulos/rutinas/plan.js";
import { aviso, confirmar } from "../nav.js";
import { I } from "../modulos/ilustraciones/iconos.js";
import {
  plegarBloque,
  conectarTarjetas,
} from "../modulos/interfaz/tarjetas.js";
import {
  hoyISO,
  sumarDias,
  num,
  aNumero,
  escapar,
  promedio,
  fechaMedia,
  DIAS,
  diasEntre,
} from "../util.js";

let editando = null; // id de la ruta en edición

export function mostrarRutas(cont) {
  const t = estado.config.terreno;
  const hoy = hoyISO();
  const eq = equivalencia();
  const enAdaptacion =
    t.actual === "plano" &&
    t.desde &&
    diasEntre(t.desde, hoy) < 14 &&
    hoy >= t.desde;

  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Rutas y terreno</h1></div>
      <button class="boton primario" id="nueva">${I.mas} Nueva ruta</button></div>

    <div class="rejilla rejilla-2" style="align-items:start">
      <section class="tarjeta">
        <div class="tarjeta-cab"><h2>Rutas guardadas</h2></div>
        <div id="lista-rutas">${estado.rutas.map(filaRuta).join("") || '<p class="suave">No hay rutas guardadas.</p>'}</div>
      </section>

      <section class="tarjeta">
        <div class="tarjeta-cab"><h2>Terreno actual</h2></div>
        <div class="segmentado" id="terreno">
          <button data-t="montana" class="${t.actual !== "plano" ? "activo" : ""}">⛰ Montaña</button>
          <button data-t="plano" class="${t.actual === "plano" ? "activo" : ""}">▭ Plano / pista</button>
        </div>
        ${
          t.actual === "plano"
            ? `
          <div class="campos" style="margin-top:14px"><label class="campo"><span>Entreno en plano desde</span><input type="date" id="desde" value="${t.desde || hoy}"></label></div>
          <p class="suave pequeño" style="margin-top:8px">${enAdaptacion ? `Estás en las <b>2 semanas de adaptación</b>: 8 km (20 vueltas) todos los días hasta el ${fechaMedia(sumarDias(t.desde, 13))}.` : "Las 2 primeras semanas en plano son de adaptación a 8 km; después se usa la tabla de pista."}</p>`
            : '<p class="suave" style="margin-top:12px">El plan usa tu ruta principal de montaña. Cuando te mudes, cambia aquí a "Plano" y el plan del día se ajusta solo.</p>'
        }

        <div class="tarjeta-cab" style="margin-top:22px"><h2>Equivalencia montaña → plano</h2></div>
        ${
          eq
            ? `<p class="suave pequeño" style="margin-bottom:10px">Con tus ${eq.n} salidas en montaña de las últimas 4 semanas:</p>
          <div class="rejilla rejilla-3">
            <div class="kpi"><span class="etiqueta">Distancia equivalente</span><span class="valor">${num(eq.kmEsf, 1)}<small>km</small></span><span class="nota">≈ ${Math.round(eq.kmEsf / 0.4)} vueltas de 400 m</span></div>
            <div class="kpi"><span class="etiqueta">Misma duración</span><span class="valor">${eq.min ? Math.round(eq.min) : "—"}<small>min</small></span><span class="nota">sesión por tiempo</span></div>
            <div class="kpi"><span class="etiqueta">Mismo esfuerzo</span><span class="valor">${eq.rpe ? num(eq.rpe, 1) : "—"}<small>RPE</small></span><span class="nota">mantén ese RPE promedio</span></div>
          </div>`
            : '<p class="suave">Cuando registres salidas en montaña con distancia (y el desnivel de la ruta), aquí verás su equivalente en plano. Regla: <b>km-esfuerzo = km + desnivel/100</b>.</p>'
        }

        <div class="tarjeta-cab" style="margin-top:22px"><h2>Plan en pista (400 m por vuelta)</h2></div>
        <table class="tabla"><thead><tr><th>Día</th><th>Sesión</th><th>Km</th><th>Vueltas</th></tr></thead><tbody>
          ${[1, 2, 3, 4, 5, 6].map((d) => `<tr><td>${DIAS[d]}</td><td style="white-space:normal;text-align:left;font-family:var(--fuente)">${PISTA[d].titulo}</td><td>${num(PISTA[d].km, 1)}</td><td>${PISTA[d].vueltas}</td></tr>`).join("")}
          <tr><td>Domingo</td><td style="text-align:left;font-family:var(--fuente)">Descanso</td><td>—</td><td>—</td></tr>
        </tbody></table>
        <p class="suave pequeño" style="margin-top:8px">Cambia el sentido de giro cada cierto número de vueltas o usa carriles exteriores. Si hay un parque con cuestas, úsalo el miércoles en lugar de las gradas.</p>
      </section>
    </div>`;

  cont.querySelector("#nueva").addEventListener("click", () => {
    const r = nuevaRuta({ nombre: "Nueva ruta" });
    estado.rutas.push(r);
    editando = r.id;
    guardarRutas();
    mostrarRutas(cont);
  });

  cont.querySelectorAll("#terreno button").forEach((b) =>
    b.addEventListener("click", () => {
      estado.config.terreno = {
        ...t,
        actual: b.dataset.t,
        desde: b.dataset.t === "plano" ? t.desde || hoy : t.desde,
      };
      guardarConfig();
      aviso(
        b.dataset.t === "plano"
          ? "Terreno cambiado a plano: el plan del día usará la pista."
          : "Terreno cambiado a montaña.",
        "ok",
      );
      mostrarRutas(cont);
    }),
  );
  cont.querySelector("#desde")?.addEventListener("change", (e) => {
    estado.config.terreno.desde = e.target.value;
    guardarConfig();
    mostrarRutas(cont);
  });

  cont.querySelectorAll("[data-editar]").forEach((b) =>
    b.addEventListener("click", () => {
      editando = editando === b.dataset.editar ? null : b.dataset.editar;
      mostrarRutas(cont);
    }),
  );
  cont.querySelectorAll("[data-principal]").forEach((b) =>
    b.addEventListener("click", () => {
      estado.config.rutaPrincipal = b.dataset.principal;
      guardarConfig();
      mostrarRutas(cont);
    }),
  );
  cont.querySelectorAll("[data-borrar]").forEach((b) =>
    b.addEventListener("click", async () => {
      const r = estado.rutas.find((x) => x.id === b.dataset.borrar);
      if (
        !(await confirmar(
          "¿Borrar ruta?",
          `Se quitará "${r.nombre}" de tus rutas guardadas. Los días donde la usaste conservan sus datos.`,
          "Borrar",
          true,
        ))
      )
        return;
      estado.rutas = estado.rutas.filter((x) => x.id !== r.id);
      if (estado.config.rutaPrincipal === r.id) {
        estado.config.rutaPrincipal = estado.rutas[0]?.id || null;
        guardarConfig();
      }
      await guardarRutas();
      mostrarRutas(cont);
    }),
  );
  cont.querySelectorAll("[data-campo-ruta]").forEach((inp) =>
    inp.addEventListener("change", () => {
      const r = estado.rutas.find((x) => x.id === inp.dataset.id);
      const k = inp.dataset.campoRuta;
      r[k] = ["distancia", "desnivel"].includes(k)
        ? aNumero(inp.value)
        : inp.value;
      guardarRutas();
    }),
  );
  cont.querySelector("[data-listo]")?.addEventListener("click", () => {
    editando = null;
    mostrarRutas(cont);
  });
  const rejilla = cont.querySelector(".rejilla-2");
  rejilla.classList.add("secciones-grid");
  [...rejilla.children].forEach((seccion, i) => {
    // Las explicaciones de equivalencia y pista se consultan por separado.
    if (i === 1) {
      const cabeceras = [
        ...seccion.querySelectorAll(":scope > .tarjeta-cab"),
      ].slice(1);
      for (const cab of cabeceras) {
        const grupo = document.createElement("div");
        cab.before(grupo);
        let siguiente = cab.nextElementSibling;
        grupo.appendChild(cab);
        while (siguiente && !siguiente.classList.contains("tarjeta-cab")) {
          const proximo = siguiente.nextElementSibling;
          grupo.appendChild(siguiente);
          siguiente = proximo;
        }
        plegarBloque(grupo, cab.textContent.trim());
      }
    }
    const tarjeta = plegarBloque(
      seccion,
      i === 0 ? "Mis rutas" : "Terreno y equivalencias",
      i === 0 ? `${estado.rutas.length} rutas guardadas` : "Montaña o plano",
      i === 0 && !!editando,
    );
    tarjeta.dataset.seccion = i === 0 ? "rutas" : "terreno";
  });
  conectarTarjetas(cont);
}

function filaRuta(r) {
  const principal =
    (estado.config.rutaPrincipal || estado.rutas[0]?.id) === r.id;
  const terreno =
    r.terreno === "plano"
      ? "Plano"
      : r.terreno === "mixto"
        ? "Mixto"
        : "Montaña";
  if (editando === r.id) {
    return `<div class="tarjeta" style="background:var(--superficie-2);margin-bottom:10px;box-shadow:none">
      <div class="campos">
        <label class="campo"><span>Nombre</span><input data-campo-ruta="nombre" data-id="${r.id}" value="${escapar(r.nombre)}"></label>
        <label class="campo"><span>Ciudad</span><input data-campo-ruta="ciudad" data-id="${r.id}" value="${escapar(r.ciudad || "")}"></label>
        <label class="campo"><span>Terreno</span><select data-campo-ruta="terreno" data-id="${r.id}">${[
          ["montana", "Montaña"],
          ["plano", "Plano"],
          ["mixto", "Mixto"],
        ]
          .map(
            ([v, t]) =>
              `<option value="${v}" ${r.terreno === v ? "selected" : ""}>${t}</option>`,
          )
          .join("")}</select></label>
        <label class="campo"><span>Distancia (km)</span><input data-campo-ruta="distancia" data-id="${r.id}" inputmode="decimal" value="${r.distancia != null ? String(r.distancia).replace(".", ",") : ""}"></label>
        <label class="campo"><span>Desnivel positivo (m)</span><input data-campo-ruta="desnivel" data-id="${r.id}" inputmode="decimal" placeholder="por medir" value="${r.desnivel ?? ""}"></label>
      </div>
      <label class="campo" style="margin-top:10px"><span>Notas</span><input data-campo-ruta="notas" data-id="${r.id}" value="${escapar(r.notas || "")}"></label>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="boton primario" data-listo>Listo</button><button class="boton fantasma peligro" data-borrar="${r.id}">${I.basura} Borrar ruta</button></div>
    </div>`;
  }
  return `<details class="card-plegable ruta-card"><summary><b>${escapar(r.nombre)}</b><span class="suave pequeño">${terreno}${r.distancia != null ? " · " + num(r.distancia, 2) + " km" : ""}${principal ? " · Principal" : ""}</span></summary><div class="card-contenido"><div class="hito">
    <span class="icono-hito">${I.rutas}</span>
    <div class="detalle"><div><b>${escapar(r.nombre)}</b>${principal ? ' <span class="estado-pill ok">Principal</span>' : ""}</div>
      <div class="suave pequeño">${terreno} · ${r.distancia != null ? num(r.distancia, 2) + " km" : "distancia ?"} · desnivel ${r.desnivel != null ? num(r.desnivel, 0) + " m" : "por medir"}${r.ciudad ? " · " + escapar(r.ciudad) : ""}</div></div>
    ${principal ? "" : `<button class="boton fantasma" data-principal="${r.id}">Hacer principal</button>`}
    <button class="boton" data-editar="${r.id}">Editar</button>
  </div></div></details>`;
}

// Promedios de las salidas en montaña de las últimas 4 semanas.
function equivalencia() {
  const hoy = hoyISO();
  const lista = metricasRango(
    sumarDias(hoy, -27),
    hoy,
    estado.dias,
    contexto(),
  ).filter((m) => m.rutaHecha && m.rutaKm && m.rutaTerreno !== "plano");
  if (!lista.length) return null;
  const rpe = lista
    .map((m) => estado.dias[m.fecha]?.ruta?.rpe)
    .filter((x) => x != null);
  return {
    n: lista.length,
    kmEsf: promedio(lista.map((m) => m.rutaKmEsf)),
    min: promedio(lista.map((m) => m.rutaMin)),
    rpe: promedio(rpe),
  };
}
