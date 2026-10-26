import { conectarBuscadorAlimentos } from "../modulos/alimentacion/buscador-alimentos.js";
import { campo, escala, cabecera } from "../modulos/interfaz/campos.js";
import { seccionSueno } from "../modulos/sueno/sueno-vista.js";
import {
  seccionComidas,
  seccionAgua,
} from "../modulos/alimentacion/comidas-vista.js";
import { seccionRuta } from "../modulos/rutas/ruta-vista.js";
import { tramosSueno, resumenSueno } from "../modulos/sueno/sueno.js";
import { buscarAlimento } from "../modulos/alimentacion/catalogo-comidas.js";
import {
  estimarCalorias,
  recalcularAlimento,
  actualizarCaloriasComida,
} from "../modulos/alimentacion/nutricion.js";
import { resolverAyuno } from "../modulos/alimentacion/ayuno-nocturno.js";
import { conectarHoras } from "../modulos/reloj/selector-hora.js";
// Detalle de un día: lo que tocaba según el plan y todos los apartados para registrar.
// Cada cambio se guarda solo (no hay botón "Guardar").
import {
  estado,
  contexto,
  diaDe,
  diaEditable,
  diaCambiado,
  guardarFrecuentes,
  guardarConfig,
  rutaPrincipal,
} from "../modulos/datos/estado.js";
import {
  metricasDia,
  TIPOS_COMIDA,
  fueraDeVentana,
} from "../modulos/reportes/metricas.js";
import {
  rutinaDe,
  normalizarPlan,
  ejerciciosDe,
  CALENTAMIENTO,
  ENFRIAMIENTO,
  planEnFecha,
} from "../modulos/rutinas/plan.js";
import { navegar, alSalir, aviso } from "../nav.js";
import { abrirGuia } from "../modulos/ilustraciones/guias-rutina.js";
import { montarTemporizador } from "../modulos/reloj/temporizador.js";

import {
  limitesComidas,
  limitesPorOrden,
  primeraRegistrada,
  ayunoVisible,
  tipoComida,
  marcarLimiteComida,
  comidasVisibles,
  comidasPredeterminadas,
  actualizarDescripcion,
  guardarComida,
  reordenarComidas,
} from "../modulos/alimentacion/comidas.js";
import {
  tarjetaSeccion,
  conectarTarjetas,
} from "../modulos/interfaz/tarjetas.js";
import { resumenRutina } from "../modulos/rutinas/resumen-rutina.js";

import { conectarOrdenComidas } from "../modulos/alimentacion/orden-comidas.js";
import { I } from "../modulos/ilustraciones/iconos.js";
import {
  hoyISO,
  sumarDias,
  fechaLarga,
  obtener,
  fijar,
  aNumero,
  escapar,
  num,
  formatoHoras,
  formatoRitmo,
  formatoDuracion,
  dos,
  idUnico,
  diaSemana,
  el,
} from "../util.js";

const PESTANAS = [
  { id: "plan", nombre: "Plan del día" },
  { id: "sueno", nombre: "Sueño" },
  { id: "ruta", nombre: "Ruta" },
  { id: "ejercicio", nombre: "Calentamiento y ejercicio" },
  { id: "comidas", nombre: "Comida, medidas y notas" },
  { id: "medidas", nombre: "Medidas y notas" },
];
let pestanaActual = null;
let ultimaFecha = null;
let PU = normalizarPlan(null); // plan del perfil abierto (se fija al mostrar el día) // se recuerda al pasar de un día a otro

export function mostrarDia(cont, { fecha }) {
  if (ultimaFecha !== fecha) pestanaActual = null;
  ultimaFecha = fecha;
  const ctx = contexto();
  PU = planEnFecha(ctx.plan, fecha);
  const hoy = hoyISO();
  const m0 = metricasDia(fecha, estado.dias, ctx);
  const plan = m0.plan;
  const d = diaDe(fecha);
  const rutaVisible =
    PU.actividades?.includes("ruta") ||
    Object.values(PU.semana || {}).some((d) => d.ruta?.activa);
  const vista = cont;
  cont = document.createElement("div");
  cont.className = "dia-minimal";
  vista.innerHTML = "";
  vista.appendChild(cont);

  cont.innerHTML = `
    <div class="cabecera">
      <button class="boton icono" data-accion="volver" title="Volver al calendario">${I.calendario}</button>
      <button class="boton icono" data-accion="anterior" title="Día anterior">${I.izquierda}</button>
      <button class="boton icono" data-accion="siguiente" title="Día siguiente">${I.derecha}</button>
      <div class="titulo">
        <h1>${fechaLarga(fecha)}${fecha === hoy ? ' <span class="estado-pill ok" style="vertical-align:middle;font-size:.45em">HOY</span>' : ""}</h1>

      </div>
      ${fecha !== hoy ? '<button class="boton" data-accion="hoy">Ir a hoy</button>' : ""}
    </div>
    <div class="dia-paneles secciones-grid">
      ${rutaVisible ? `<div class="panel-pestana" data-panel="ruta">${seccionRuta(d, plan)}</div>` : ""}
      <div class="panel-pestana" data-panel="ejercicio">${seccionComplemento(d, plan)}</div>
      <div class="panel-pestana" data-panel="comidas"><div class="registro-cotidiano"><div class="registro-alimentacion">${seccionComidas(d, plan, fecha)}${seccionAgua(d)}</div><div class="registro-personal">${seccionMedidas(d, fecha)}${seccionNotas(d)}</div></div></div>
      <div class="panel-pestana" data-panel="plan"><div class="plan-sueno"><div>${tarjetaPlan(plan, d, fecha === hoy)}</div><div class="sueno-compacto">${seccionSueno(d, PU.metas.suenoHoras)}</div></div></div>
    </div>`;

  const detalles = {
    plan: ["", I.plan],
    sueno: ["", I.sueno],
    ruta: ["", I.rutas],
    ejercicio: ["", I.comp],
    comidas: ["", I.comida],
    medidas: ["", I.balanza],
  };
  cont.querySelectorAll(".panel-pestana").forEach((panel) => {
    const id = panel.dataset.panel,
      opcion = PESTANAS.find((t) => t.id === id);
    const caja = document.createElement("div");
    caja.innerHTML = tarjetaSeccion(
      id,
      opcion.nombre,
      detalles[id][0],
      detalles[id][1],
      "",
      pestanaActual === id ? "open" : "",
    );
    const tarjeta = caja.firstElementChild;
    if (id === "ejercicio") tarjeta.classList.add("seccion-entrenar");
    const resumen = tarjeta.querySelector("summary");
    resumen.dataset.pestana = id;
    resumen
      .querySelector(".seccion-titulo")
      .insertAdjacentHTML(
        "beforeend",
        `<span class="punto" data-punto="${id}"></span>`,
      );
    panel.before(tarjeta);
    tarjeta.querySelector(".seccion-contenido").appendChild(panel);
    tarjeta.addEventListener("toggle", () => {
      if (tarjeta.open) pestanaActual = id;
      else {
        if (pestanaActual === id) pestanaActual = null;
        if (id === "ejercicio")
          cont
            .querySelector("[data-temporizador]")
            ?.dispatchEvent(new Event("pausar-rutina"));
      }
    });
  });
  conectarTarjetas(cont);
  alSalir(conectarHoras(cont));
  alSalir(conectarBuscadorAlimentos(cont));
  alSalir(
    conectarOrdenComidas(cont, (ids) => {
      const dia = diaEditable(fecha);
      dia.ordenComidas = ids;
      dia.comidas = limitesPorOrden(
        reordenarComidas(
          comidasVisibles(dia),
          ids.filter((id) => id !== "ayuno"),
        ),
      );
      diaCambiado(fecha);
      refrescar();
    }),
  );
  ordenarTarjetasComidas();
  const tipoRutina =
    d.complemento?.tipo || plan.complemento?.tipo || "estiramientos";
  montarTemporizador(cont.querySelector("[data-temporizador]"), {
    rutina: rutinaDe(tipoRutina, PU),
    ejercicios: ejerciciosDe(tipoRutina, plan.semana, PU),
    ajustes: d.preparacion || PU.semana[plan.ds]?.preparacion || null,
    actividades: PU.actividades || [],
    alEditar: (p) => {
      diaEditable(fecha).preparacion = p;
      diaCambiado(fecha);
      const programa = cont.querySelector(".plan-dia");
      if (programa)
        programa.outerHTML = tarjetaPlan(plan, diaDe(fecha), fecha === hoy);
    },
    perfil: estado.carpeta || estado.perfil?.nombre || "",
    fecha,
    tipo: tipoRutina,
    alComenzar: (instante, datos) =>
      registrarHoraRutina("inicio", instante, null, datos),
    alTerminar: (instante, inicio, datos) =>
      registrarHoraRutina("fin", instante, inicio, datos),
  });

  function registrarHoraRutina(campo, instante, inicio, datos = {}) {
    const dia = diaEditable(fecha),
      cal = datos.modo === "calentamiento";
    if (!cal) prepararDefectos(dia, "complemento.x", plan);
    const destino = cal ? (dia.calentamientoSesion ||= {}) : dia.complemento;
    const momento = new Date(instante);
    destino[campo] = `${dos(momento.getHours())}:${dos(momento.getMinutes())}`;
    destino[campo + "ISO"] = momento.toISOString();
    if (campo === "inicio") {
      delete destino.fin;
      delete destino.finISO;
    }
    if (campo === "fin") {
      destino.duracion =
        Math.round((datos.activoMs ?? instante - inicio) / 6000) / 10;
      if (datos.completa && !cal) destino.hecho = true;
    }
    diaCambiado(fecha);
    refrescar();
  }

  // ---------- Eventos ----------
  cont
    .querySelector('[data-accion="volver"]')
    .addEventListener("click", () =>
      navegar({ vista: "calendario", mes: fecha.slice(0, 7) }),
    );
  cont
    .querySelector('[data-accion="anterior"]')
    .addEventListener("click", () =>
      navegar({ vista: "dia", fecha: sumarDias(fecha, -1) }),
    );
  cont
    .querySelector('[data-accion="siguiente"]')
    .addEventListener("click", () =>
      navegar({ vista: "dia", fecha: sumarDias(fecha, 1) }),
    );
  cont
    .querySelector('[data-accion="hoy"]')
    ?.addEventListener("click", () => navegar({ vista: "dia", fecha: hoy }));

  const cambiar = (camino, valor) => {
    const dia = diaEditable(fecha);
    prepararDefectos(dia, camino, plan);
    fijar(dia, camino, valor);
    diaCambiado(fecha);
    refrescar();
  };

  // Campos de texto, número, hora, selección y casillas
  cont.addEventListener("input", (e) => {
    const t = e.target;
    if (t.hasAttribute("data-item-categoria")) {
      prepararCalorias(t.closest(".categoria-comida"), true);
      return;
    }
    if (t.matches("[data-item-cantidad],[data-item-calorias]")) {
      prepararCalorias(
        t.closest(".categoria-comida"),
        false,
        t.hasAttribute("data-item-calorias"),
      );
      return;
    }
    if (t.type === "checkbox" || t.tagName === "SELECT") return; // se atienden en "change"
    if (t.dataset.c) cambiar(t.dataset.c, leerValor(t));
    else if (t.dataset.comidaItem) cambiarAlimento(t);
    else if (t.dataset.comida) cambiarComida(t);
  });
  cont.addEventListener("change", (e) => {
    const t = e.target;
    if (t.hasAttribute("data-item-categoria")) {
      prepararCalorias(t.closest(".categoria-comida"), true);
      return;
    }
    if (t.dataset.limiteComida) {
      const dia = diaEditable(fecha);
      dia.comidas = comidasVisibles(dia);
      marcarLimiteComida(
        dia.comidas,
        t.dataset.idComida,
        t.dataset.limiteComida,
        t.checked,
      );
      if (
        t.dataset.limiteComida === "primeraDelDia" &&
        t.checked &&
        dia.ayuno?.activo === false
      )
        delete dia.ayuno.activo;
      diaCambiado(fecha);
      repintarComidas(t.dataset.idComida);
      return;
    }
    if (t.dataset.c && (t.type === "checkbox" || t.tagName === "SELECT")) {
      t.closest(".ejercicio, .ej-tarjeta")?.classList.toggle(
        "hecho",
        t.checked,
      );
      cambiar(t.dataset.c, leerValor(t));
      if (t.dataset.c === "ruta.rutaId") alElegirRuta(t.value);
      if (t.dataset.c === "complemento.tipo") {
        const dia = diaEditable(fecha);
        if (dia.complemento) {
          delete dia.complemento.ejercicios;
          delete dia.complemento.registro;
        }
        diaCambiado(fecha);
        repintar();
      }
    } else if (t.dataset.comida && t.tagName === "SELECT") cambiarComida(t);
  });

  // Botones: calificaciones, segmentados, contadores, etiquetas…
  cont.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.valorDe) {
      const actual = obtener(diaDe(fecha), b.dataset.valorDe);
      const v = isNaN(Number(b.dataset.valor))
        ? b.dataset.valor
        : Number(b.dataset.valor);
      cambiar(
        b.dataset.valorDe,
        actual === v && b.dataset.alternar !== "no" ? null : v,
      );
      b.parentElement
        .querySelectorAll("button")
        .forEach((x) =>
          x.classList.toggle(
            "activo",
            x === b && !(actual === v && b.dataset.alternar !== "no"),
          ),
        );
      if (b.dataset.valorDe === "ruta.terreno") repintar();
    }
    if (b.dataset.sumar) {
      const actual = obtener(diaDe(fecha), b.dataset.sumar) || 0;
      const nuevo = Math.max(0, actual + Number(b.dataset.paso));
      cambiar(b.dataset.sumar, nuevo || null);
      b.closest(".contador").querySelector(".valor").textContent = nuevo;
    }
    if (b.dataset.etiqueta) {
      const c = buscarComida(b.dataset.idComida);
      c.etiquetas = c.etiquetas || [];
      c.etiquetas = c.etiquetas.includes(b.dataset.etiqueta)
        ? c.etiquetas.filter((x) => x !== b.dataset.etiqueta)
        : [...c.etiquetas, b.dataset.etiqueta];
      b.classList.toggle("activo");
      diaCambiado(fecha);
      refrescar();
    }
    const accion = e.target.closest("[data-accion]")?.dataset.accion;
    const objetivo = e.target.closest("[data-accion]");
    if (accion === "agregar-tramo-sueno" || accion === "quitar-tramo-sueno") {
      const dia = diaEditable(fecha),
        sueno = (dia.sueno ||= {});
      sueno.tramos = tramosSueno(sueno).map((t) => ({ ...t }));
      if (accion === "agregar-tramo-sueno")
        sueno.tramos.push({ dormir: "", despertar: "" });
      else sueno.tramos.splice(Number(objetivo.dataset.tramo), 1);
      delete sueno.dormir;
      delete sueno.despertar;
      diaCambiado(fecha);
      const anterior = cont.querySelector("[data-sueno]");
      anterior.outerHTML = seccionSueno(dia, PU.metas.suenoHoras);
      refrescar();
      return;
    }
    if (accion === "cancelar-categoria") {
      const panel = objetivo.closest(".categoria-comida");
      panel.querySelector("[data-item-categoria]").value = "";
      panel.querySelector("[data-item-cantidad]").value = "";
      const kcal = panel.querySelector("[data-item-calorias]");
      kcal.value = "";
      delete kcal.dataset.manual;
      prepararCalorias(panel);
      panel.open = false;
      panel.querySelector("summary").focus();
      return;
    }
    if (accion === "guardar-categoria") {
      e.preventDefault();
      const c=buscarComida(objetivo.dataset.idComida),panel=objetivo.closest('.categoria-comida');
      if(!c)return;
      if(panel.querySelector('[data-item-categoria]').value.trim()&&!agregarAlimentoDesde(panel,c))return;
      if(!c.items?.some(i=>i.categoria===objetivo.dataset.categoria)){panel.querySelector('[data-item-categoria]').focus();return;}
      guardarComida(c);
      actualizarCaloriasComida(c);
      diaCambiado(fecha);
      repintarComidas(c.id,null,{categoria:objetivo.dataset.categoria,limpiar:true,cerrar:true});
      return;
    }
    if (accion === "editar-alimento") {
      const fila = objetivo.closest(".comida-item");
      fila.classList.remove("alimento-guardado");
      fila
        .querySelectorAll("[data-item-campo]")
        .forEach((i) => (i.readOnly = false));
      objetivo.classList.remove("accion-icono", "accion-editar");
      objetivo.classList.add("guardar-alimento");
      objetivo.dataset.accion = "guardar-alimento";
      objetivo.removeAttribute("data-ayuda-accion");
      objetivo.setAttribute("aria-label", "Guardar alimento");
      objetivo.textContent = "Guardar";
      fila.querySelector('[data-item-campo="nombre"]').focus();
      return;
    }
    if (accion === "agregar-item-comida") {
      const c = buscarComida(objetivo.dataset.idComida),
        panel = objetivo.closest(".categoria-comida");
      if (!c || !agregarAlimentoDesde(panel, c)) return;
      diaCambiado(fecha);
      repintarComidas(c.id, null, {
        categoria: objetivo.dataset.categoria,
        limpiar: true,
        cerrar: false,
      });
      cont
        .querySelector(
          `[data-comida-id="${c.id}"] [data-categoria-panel="${objetivo.dataset.categoria}"] [data-item-categoria]`,
        )
        ?.focus();
      return;
    }
    if (accion === "quitar-item-comida") {
      const c = buscarComida(objetivo.dataset.idComida);
      c.items = (c.items || []).filter((x) => x.id !== objetivo.dataset.item);
      actualizarCaloriasComida(c);
      actualizarDescripcion(c);
      diaCambiado(fecha);
      repintarComidas(c.id);
      return;
    }
    if (accion === "guia-ampliar") abrirGuia(objetivo.dataset.rutina);
    if (accion === "agregar-comida")
      agregarComida({ tipo: objetivo.dataset.tipo });
    if (accion === "configurar-ayuno") {
      if (!primeraRegistrada(diaDe(fecha))) return;
      const dia = diaEditable(fecha);
      (dia.ayuno ||= {}).activo = true;
      diaCambiado(fecha);
      const caja = cont.querySelector("[data-ayuno-config]");
      caja.hidden = false;
      caja.open = true;
      ordenarTarjetasComidas();
      cont.querySelector(".anadir-comida").open = false;
      caja.querySelector("input")?.focus();
      refrescar();
    }
    if (accion === "desactivar-ayuno") {
      e.preventDefault();
      const dia = diaEditable(fecha);
      (dia.ayuno ||= {}).activo = false;
      for (const k of ["primera", "anterior", "fechaAnterior"])
        delete dia.ayuno[k];
      diaCambiado(fecha);
      const caja = cont.querySelector("[data-ayuno-config]");
      caja.hidden = true;
      caja.open = false;
      refrescar();
    }
    if (accion === "terminar-ayuno") {
      const input = cont.querySelector('[data-c="ayuno.primera"]'),
        ahora = new Date();
      input.value = `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (accion === "guardar-alimento") {
      const c = buscarComida(objetivo.dataset.idComida);
      if (!c) return;
      const invalido = objetivo.closest(".comida").querySelector(":invalid");
      if (invalido) {
        invalido.reportValidity();
        return;
      }
      guardarComida(c);
      actualizarCaloriasComida(c);
      diaCambiado(fecha);
      repintarComidas(c.id);
      return;
    }
    if (accion === "guardar-comida") {
      e.preventDefault();
      const c = buscarComida(objetivo.dataset.idComida);
      if (!c) return;
      guardarComida(c);
      diaCambiado(fecha);
      repintarComidas(null, c.id);
    }
    if (accion === "borrar-comida") {
      e.preventDefault();
      const dia = diaEditable(fecha);
      dia.comidas = limitesPorOrden(
        comidasVisibles(dia).filter((c) => c.id !== b.dataset.idComida),
      );
      diaCambiado(fecha);
      repintarComidas();
    }
    if (accion === "frecuente-guardar") {
      const c = buscarComida(b.dataset.idComida);
      if (!c.desc) {
        aviso("Escribe primero la descripción de la comida.");
        return;
      }
      estado.frecuentes.push({
        id: idUnico(),
        tipo: c.tipo,
        desc: c.desc,
        etiquetas: c.etiquetas || [],
        kcal: c.kcal ?? null,
      });
      await guardarFrecuentes();
      aviso("Guardada en comidas frecuentes.", "ok");
      repintarComidas();
    }
    if (accion === "frecuente-usar") {
      const f = estado.frecuentes.find((x) => x.id === b.dataset.id);
      if (f)
        agregarComida({
          tipo: f.tipo,
          desc: f.desc,
          etiquetas: [...(f.etiquetas || [])],
          kcal: f.kcal,
        });
    }
    if (accion === "frecuente-quitar") {
      estado.frecuentes = estado.frecuentes.filter(
        (x) => x.id !== objetivo.dataset.id,
      );
      await guardarFrecuentes();
      repintarComidas();
    }
    if (accion === "foto") {
      const rel = await window.api.importarImagen("fotos");
      if (rel) {
        cambiar("medidas.foto", rel);
        repintarFoto();
      }
    }
    if (accion === "quitar-foto") {
      cambiar("medidas.foto", null);
      repintarFoto();
    }
  });

  function buscarComida(id) {
    const dia = diaEditable(fecha);
    if (!Array.isArray(dia.comidas)) dia.comidas = comidasPredeterminadas();
    return dia.comidas.find((c) => c.id === id);
  }

  function agregarAlimentoDesde(caja, c) {
    const escrito = caja
      .querySelector("[data-item-categoria]")
      .value.trim()
      .slice(0, 120);
    if (!escrito) return false;
    const invalido = caja.querySelector(":invalid");
    if (invalido) {
      invalido.reportValidity();
      return false;
    }
    const cat = caja.dataset.categoriaPanel,
      conocido = buscarAlimento(escrito, estado.config.alimentosPersonalizados),
      nombre = conocido?.nombre || escrito,
      categoria = cat || conocido?.categoria || "otros";
    if (!conocido) {
      const lista = Array.isArray(estado.config.alimentosPersonalizados)
        ? estado.config.alimentosPersonalizados
        : [];
      estado.config.alimentosPersonalizados = [
        ...lista,
        { nombre, categoria },
      ].slice(-1000);
      guardarConfig();
    }
    c.textoLibre ??= c.items?.length ? "" : c.desc || "";
    c.items ||= [];
    const cantidad =
        caja.querySelector("[data-item-cantidad]").value.trim() || "1",
      campoKcal = caja.querySelector("[data-item-calorias]"),
      item = { id: idUnico(), categoria, nombre, cantidad };
    if (
      campoKcal.dataset.manual === "true" &&
      campoKcal.value !== "" &&
      Number(campoKcal.value) >= 0
    ) {
      item.kcal = Number(campoKcal.value);
      item.kcalManual = true;
    }
    recalcularAlimento(item);
    c.items.push(item);
    actualizarCaloriasComida(c);
    actualizarDescripcion(c);
    return true;
  }

  function prepararCalorias(caja, reiniciar = false, manual = false) {
    if (!caja) return;
    const nombre = caja.querySelector("[data-item-categoria]").value.trim(),
      cantidad = caja.querySelector("[data-item-cantidad]"),
      campo = caja.querySelector("[data-item-calorias]"),
      etiqueta = caja.querySelector("[data-item-kcal-campo]"),
      ayuda = caja.querySelector("[data-item-kcal-ayuda]");
    etiqueta.hidden = true;
    ayuda.hidden = true;
    if (reiniciar) {
      delete campo.dataset.manual;
      if (!cantidad.value) cantidad.value = "1";
    }
    if (manual) campo.dataset.manual = "true";
    const e = estimarCalorias(nombre, cantidad.value);
    if (campo.dataset.manual !== "true") campo.value = e.kcal ?? "";
    etiqueta.querySelector("span").textContent =
      campo.dataset.manual === "true" ? "kcal" : "kcal aprox.";
    ayuda.textContent = nombre
      ? campo.dataset.manual === "true"
        ? "Valor manual"
        : (buscarAlimento(nombre, estado.config.alimentosPersonalizados)
            ? ""
            : "Nuevo alimento · ") + e.ayuda
      : "";
    ayuda.title = e.detalle || "";
  }

  function cambiarAlimento(t) {
    const c = buscarComida(t.dataset.comidaItem),
      item = c?.items?.find((i) => i.id === t.dataset.itemId),
      k = t.dataset.itemCampo;
    if (!item || !["nombre", "cantidad", "kcal"].includes(k)) return;
    if (k === "kcal") {
      if (
        t.value !== "" &&
        (!Number.isFinite(Number(t.value)) || Number(t.value) < 0)
      )
        return;
      if (t.value === "") {
        delete item.kcalManual;
        recalcularAlimento(item);
      } else {
        item.kcal = Number(t.value);
        item.kcalManual = true;
        item.kcalEstimadas = false;
      }
    } else {
      item[k] = t.value;
      recalcularAlimento(item);
    }
    const fila = t.closest(".comida-item"),
      calorias = fila.querySelector('[data-item-campo="kcal"]');
    if (k !== "kcal") calorias.value = item.kcal ?? "";
    calorias.title = item.kcalManual
      ? "Valor manual"
      : [item.detalleKcal, item.referenciaKcal].filter(Boolean).join(" · ") ||
        "Introducir kcal";
    fila.querySelector("[data-kcal-modo]").textContent = item.kcalManual
      ? "kcal"
      : "kcal aprox.";
    actualizarCaloriasComida(c);
    actualizarDescripcion(c);
    diaCambiado(fecha);
    refrescar();
  }

  function cambiarComida(t) {
    const c = buscarComida(t.dataset.comida);
    if (!c) return;
    const k = t.dataset.k;
    let v = t.value;
    if (k === "kcal") v = aNumero(v);
    if (k === "hora") c.horaManual = !!v;
    if (v === "" || v == null) delete c[k];
    else c[k] = v;
    if (k === "textoLibre") {
      actualizarDescripcion(c);
      actualizarCaloriasComida(c);
    }
    if (k === "tipo")
      t.closest(".comida").querySelector("summary b").textContent =
        TIPOS_COMIDA.find((x) => x.id === tipoComida(c))?.nombre || "Comida";
    diaCambiado(fecha);
    if (k === "hora") {
      const fila = t.closest(".comida");
      fila.querySelector("summary small").textContent = c.hora || "";
      const fuera =
        diaDe(fecha).ayuno?.activo === true &&
        plan.ayuno &&
        fueraDeVentana(
          c.hora,
          plan.ayuno.ventana,
          diaDe(fecha).ayuno?.guineoAntes,
        );
      fila.classList.toggle("fuera-ventana", !!fuera);
      fila.querySelector(".aviso-ventana")?.classList.toggle("oculto", !fuera);
    }
    refrescar();
  }

  function agregarComida(datos) {
    const dia = diaEditable(fecha);
    dia.comidas = comidasVisibles(dia);
    const tipo = datos.tipo || "intermedia";
    const nuevaId = idUnico();
    dia.comidas.push({
      id: nuevaId,
      hora: "",
      borrador: true,
      etiquetas: [],
      ...datos,
      tipo,
    });
    limitesPorOrden(dia.comidas);
    diaCambiado(fecha);
    repintarComidas(nuevaId);
  }

  function alElegirRuta(id) {
    const r = estado.rutas.find((x) => x.id === id);
    if (!r) return;
    const dia = diaEditable(fecha);
    dia.ruta.terreno = r.terreno === "plano" ? "plano" : "montana";
    if (r.desnivel != null) dia.ruta.desnivel = r.desnivel;
    if (dia.ruta.distancia == null && r.distancia)
      dia.ruta.distancia = r.distancia;
    diaCambiado(fecha);
    repintar();
  }

  function repintar() {
    const top = vista.scrollTop;
    navegar({ vista: "dia", fecha });
    vista.scrollTop = top;
  }

  function ordenarTarjetasComidas() {
    const lista = cont.querySelector(".lista-comidas");
    if (!lista) return;
    const guardado = diaDe(fecha).ordenComidas || [],
      orden = guardado.includes("ayuno") ? guardado : ["ayuno", ...guardado];
    const filas = [...lista.children],
      porId = new Map(filas.map((x) => [x.dataset.comidaId, x]));
    for (const id of [...orden, ...filas.map((x) => x.dataset.comidaId)]) {
      const nodo = porId.get(id);
      if (nodo) {
        lista.appendChild(nodo);
        porId.delete(id);
      }
    }
  }

  function repintarComidas(abrirId = null, cerrarId = null, opciones = {}) {
    const viejo = cont.querySelector("#sec-comidas");
    const borradores = [
      ...viejo.querySelectorAll("[data-categoria-panel]"),
    ].map((p) => ({
      comida: p.closest("[data-comida-id]").dataset.comidaId,
      categoria: p.dataset.categoriaPanel,
      abierto: p.open,
      nombre: p.querySelector("[data-item-categoria]").value,
      cantidad: p.querySelector("[data-item-cantidad]").value,
      kcal: p.querySelector("[data-item-calorias]").value,
      manual: p.querySelector("[data-item-calorias]").dataset.manual,
    }));
    const abiertas = [...viejo.querySelectorAll("details.comida[open]")].map(
      (x) => x.dataset.comidaId,
    );
    if (abrirId) abiertas.push(abrirId);
    viejo.outerHTML = seccionComidas(diaDe(fecha), plan, fecha);
    cont.querySelectorAll("details.comida").forEach((x) => {
      x.open =
        x.dataset.comidaId !== cerrarId &&
        abiertas.includes(x.dataset.comidaId);
    });
    for (const b of borradores) {
      const panel = cont.querySelector(
        `[data-comida-id="${b.comida}"] [data-categoria-panel="${b.categoria}"]`,
      );
      if (!panel) continue;
      const cambiado =
        b.comida === abrirId && b.categoria === opciones.categoria;
      panel.open = cambiado ? !opciones.cerrar : b.abierto;
      if (cambiado && opciones.limpiar) continue;
      panel.querySelector("[data-item-categoria]").value = b.nombre;
      panel.querySelector("[data-item-cantidad]").value = b.cantidad;
      const k = panel.querySelector("[data-item-calorias]");
      k.value = b.kcal;
      if (b.manual) k.dataset.manual = b.manual;
      prepararCalorias(panel);
    }
    ordenarTarjetasComidas();
    refrescar();
  }

  async function repintarFoto() {
    const caja = cont.querySelector("#caja-foto");
    const rel = diaDe(fecha).medidas?.foto;
    caja.innerHTML = rel
      ? `<img class="foto-medida" src="${await window.api.urlArchivo(rel)}" alt="Foto"><button class="boton fantasma peligro" data-accion="quitar-foto" style="margin-top:6px">${I.basura} Quitar foto</button>`
      : "";
  }

  // Resultados calculados (se actualizan en vivo)
  function refrescar() {
    const limites = limitesComidas(diaDe(fecha));
    cont.querySelectorAll("[data-limite-comida]").forEach((i) => {
      i.checked =
        i.dataset.idComida ===
        (i.dataset.limiteComida === "primeraDelDia"
          ? limites.primera?.id
          : limites.ultima?.id);
    });
    const cajaAyuno = cont.querySelector("[data-ayuno-config]");
    if (cajaAyuno) cajaAyuno.hidden = !ayunoVisible(diaDe(fecha));
    const m = metricasDia(fecha, estado.dias, ctx);
    const resuelto = resolverAyuno(fecha, estado.dias),
      actual = diaDe(fecha).ayuno || {};
    const anterior = cont.querySelector("[data-ayuno-anterior]");
    if (anterior)
      anterior.textContent = resuelto.anterior || "Sin comida registrada ayer";
    for (const [k, v] of [["primera", resuelto.primera]]) {
      const i = cont.querySelector(`[data-c="ayuno.${k}"]`);
      if (
        i &&
        (!Object.hasOwn(actual, k) || primeraRegistrada(diaDe(fecha))) &&
        document.activeElement !== i
      )
        i.value = v;
    }
    pintarCuentaRegresiva(cont.querySelector("#cuenta-regresiva"), plan, fecha);
    const pon = (k, html) =>
      cont
        .querySelectorAll(`[data-calc="${k}"]`)
        .forEach((x) => (x.innerHTML = html));
    pon("sueno", m.sueno != null ? formatoHoras(m.sueno) : "—");
    const rs = resumenSueno(diaDe(fecha).sueno);
    pon(
      "sueno-detalle",
      rs.error ||
        (rs.despierto > 0
          ? "Tiempo despierto: " + formatoHoras(rs.despierto)
          : rs.incompleto && tramosSueno(diaDe(fecha).sueno).length > 1
            ? "Completa las horas de cada tramo."
            : ""),
    );
    pon(
      "sueno-estado",
      m.suenoOk == null
        ? pill("nada", "Sin datos")
        : m.suenoOk
          ? pill("ok", `✓ ${num(PU.metas.suenoHoras, 1)} h o más`)
          : pill("no", `Menos de ${num(PU.metas.suenoHoras, 1)} h`),
    );
    pon("ayuno", m.ayunoHoras != null ? formatoHoras(m.ayunoHoras) : "—");
    pon("ventana", m.ventanaHoras != null ? formatoHoras(m.ventanaHoras) : "—");
    pon(
      "ayuno-estado",
      !plan.ayuno
        ? pill("nada", "Sin meta")
        : m.ayunoExcepcion
          ? pill("ok", "✓ Excepción permitida")
          : m.ayunoOk == null
            ? pill("nada", "Faltan horas")
            : m.ayunoOk
              ? pill("ok", `✓ Meta ${plan.ayuno.horas} h`)
              : pill("no", `Meta ${plan.ayuno.horas} h`),
    );
    pon("agua", m.aguaL != null ? `${num(m.aguaL, 2)} L` : "0 L");
    pon(
      "kcal",
      m.kcalIngeridas != null ? `${Math.round(m.kcalIngeridas)} kcal` : "—",
    );
    pon("ritmo", formatoRitmo(m.ritmo));
    pon("kmesf", m.rutaKmEsf != null ? num(m.rutaKmEsf, 2) : "—");
    pon("duracion", formatoDuracion(m.rutaMin));
    pon(
      "ruta-estado",
      m.rutaHecha ? pill("ok", "✓ Ruta hecha") : pill("nada", "Sin registrar"),
    );
    pon(
      "comp-resumen",
      m.compPorcentaje == null
        ? ""
        : `<b>${m.compReps}</b> repeticiones${m.compSegundos ? ` · <b>${formatoDuracion(m.compSegundos / 60)}</b> de trabajo por tiempo` : ""} · <b>${m.compPorcentaje} %</b> de lo sugerido<div class="barra-progreso"><div style="width:${Math.min(100, m.compPorcentaje)}%;background:var(--c-comp)"></div></div>`,
    );
    pon(
      "comp-estado",
      m.compHecho
        ? pill("ok", "✓ Completado")
        : m.compParcial
          ? pill("nada", "A medias")
          : pill("nada", "Pendiente"),
    );
    const dia = diaDe(fecha);
    const calent = Object.values(dia.calentamiento || {}).filter(
      Boolean,
    ).length;
    const puntos = {
      sueno: m.suenoOk,
      calentamiento:
        calent >= TOTAL_CALENTAMIENTO ? true : calent > 0 ? "parcial" : null,
      ruta: m.rutaHecha || null,
      ejercicio: m.compHecho ? true : m.compParcial ? "parcial" : null,
      ayuno: m.ayunoOk,
      comidas: m.comidas > 0 || null,
      medidas: m.peso != null || m.cintura != null || null,
      notas: !!(dia.notas || dia.animo) || null,
    };
    pon("calent", pillCalentamiento(calent));
    cont.querySelectorAll("[data-punto]").forEach((x) => {
      const v = puntos[x.dataset.punto];
      x.className =
        "punto" +
        (v === true
          ? " ok"
          : v === "parcial"
            ? " parcial"
            : v === false
              ? " no"
              : "");
    });
  }

  // Cuenta regresiva de la ventana de comida (solo hoy)
  if (fecha === hoy) {
    const caja = cont.querySelector("#cuenta-regresiva");
    const tick = () =>
      pintarCuentaRegresiva(
        cont.querySelector("#cuenta-regresiva"),
        plan,
        fecha,
      );
    tick();
    const t = setInterval(tick, 1000);
    alSalir(() => clearInterval(t));
  }

  refrescar();
  repintarFoto();
}

// Al tocar por primera vez la ruta o el complemento, se toman los valores del plan.
function prepararDefectos(dia, camino, plan) {
  if (camino.startsWith("ruta.") && !dia.ruta) {
    const principal = rutaPrincipal();
    dia.ruta = {
      tipo: plan.ruta?.tipo || "ligera",
      terreno: plan.ruta?.terreno || "montana",
    };
    if (
      principal &&
      (principal.terreno === "plano") === (dia.ruta.terreno === "plano")
    ) {
      dia.ruta.rutaId = principal.id;
      if (principal.desnivel != null) dia.ruta.desnivel = principal.desnivel;
    }
  }
  if (camino.startsWith("complemento.") && !dia.complemento) {
    dia.complemento = { tipo: plan.complemento?.tipo || "estiramientos" };
    if (rutinaDe(dia.complemento.tipo, PU)?.usaPeso)
      dia.complemento.pesoLb = 10;
  }
}

function leerValor(t) {
  if (t.type === "checkbox") return t.checked || null;
  if (t.dataset.t === "num") return aNumero(t.value);
  return t.value;
}

const pill = (clase, texto) =>
  `<span class="estado-pill ${clase}">${texto}</span>`;

// ---------- Constructores de campos ----------
// ---------- Secciones ----------
function seccionComplemento(d, plan) {
  if (plan.descanso || (!plan.complemento && !d.complemento && !d.preparacion))
    return '<section class="tarjeta"><p class="suave">Descanso</p></section>';
  const tipo = d.complemento?.tipo || plan.complemento?.tipo || "estiramientos",
    ejercicios =
      d.preparacion?.ejercicios || ejerciciosDe(tipo, plan.semana, PU);
  return `<section class="tarjeta"><div data-temporizador></div></section>`;
}

function seccionMedidas(d, fecha) {
  const lunes = diaSemana(fecha) === 1;
  return `<section class="tarjeta">
    ${cabecera("Medidas", I.balanza, "--g-peso")}

    <div class="campos">
      ${campo("Peso", "medidas.peso", d, { tipo: "num", unidad: "kg" })}
      ${campo("Cintura", "medidas.cintura", d, { tipo: "num", unidad: "cm" })}
      <label class="campo"><span>Foto (opcional)</span><button class="boton" data-accion="foto">${I.imagen} ${d.medidas?.foto ? "Cambiar foto" : "Añadir foto"}</button></label>
    </div>
    <div id="caja-foto"></div>
  </section>`;
}

function seccionNotas(d) {
  return `<section class="tarjeta">
    ${cabecera("Notas del día", I.notas, "--texto-suave")}
    <label class="campo" style="margin-bottom:12px"><span>¿Cómo me sentí?</span>${escala("animo", d, 5, ["Muy mal", "Mal", "Normal", "Bien", "Excelente"])}</label>
    <textarea data-c="notas" placeholder="Notas del día">${escapar(d.notas || "")}</textarea>
  </section>`;
}

const TOTAL_CALENTAMIENTO =
  CALENTAMIENTO.reduce((s, g) => s + g.items.length, 0) + ENFRIAMIENTO.length;

const pillCalentamiento = (n) =>
  `<span class="estado-pill ${n >= TOTAL_CALENTAMIENTO ? "ok" : "nada"}">${n}/${TOTAL_CALENTAMIENTO}</span>`;

// ---------- Plan del día ----------
function tarjetaPlan(plan, d, esHoy) {
  if (plan.antesDelPlan)
    return `<section class="tarjeta plan-dia"><p>Inicio: ${fechaLarga(contexto().inicio)}</p></section>`;
  const r = plan.ruta,
    c = plan.complemento,
    tipo = d.complemento?.tipo || c?.tipo;
  const ruta = estado.rutas.find((x) => x.id === d.ruta?.rutaId);
  return `<section class="tarjeta plan-dia">${r ? `<div class="plan-bloque"><h3>Ruta</h3><b>${escapar(ruta?.nombre || r.titulo)}</b><p class="suave pequeño">${escapar(r.intervalo || r.detalle || "")}${r.metaKm ? ` · ${num(r.metaKm, 1)} km` : ""}</p></div>` : ""}
 ${c ? `<div class="plan-bloque"><h3>Ejercicios</h3>${resumenRutina(rutinaDe(tipo, PU), ejerciciosDe(tipo, plan.semana, PU), d.preparacion || PU.semana[plan.ds]?.preparacion)}</div>` : "<p>Descanso</p>"}</section>`;
}

function pintarCuentaRegresiva(caja, plan, fecha) {
  if (!caja) return;
  const a = resolverAyuno(fecha, estado.dias),
    activo = ayunoVisible(diaDe(fecha)),
    boton = caja.parentElement.querySelector('[data-accion="terminar-ayuno"]');
  if (boton) boton.hidden = !activo || a.estado !== "en-curso";
  if (!activo) {
    caja.innerHTML = "";
    return;
  }
  if (a.estado === "sin-inicio") {
    caja.innerHTML =
      "<span>Falta registrar la última comida en el día anterior.</span>";
    return;
  }
  if (a.estado === "invalido") {
    caja.innerHTML =
      "<span>Revisa las fechas: la primera comida debe ser posterior a la última comida anterior.</span>";
    return;
  }
  if (a.estado === "sin-fin") {
    caja.innerHTML = "<span>Falta la primera comida de este día.</span>";
    return;
  }
  const t = Math.max(0, Math.floor(a.segundos)),
    h = Math.floor(t / 3600),
    m = Math.floor((t % 3600) / 60),
    s = t % 60;
  caja.innerHTML = `<span>${a.estado === "completado" ? "Tiempo de ayuno" : "Ayuno en curso"}</span><strong>${a.estado === "completado" ? `${h} h ${dos(m)} min` : `${h}:${dos(m)}:${dos(s)}`}</strong>`;
}
