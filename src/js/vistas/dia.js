// Detalle de un día: lo que tocaba según el plan y todos los apartados para registrar.
// Cada cambio se guarda solo (no hay botón "Guardar").
import { estado, contexto, diaDe, diaEditable, diaCambiado, guardarFrecuentes, rutaPrincipal } from '../estado.js';
import { metricasDia, alertasDia, ETIQUETAS_COMIDA, TIPOS_COMIDA, ML_POR_VASO, fueraDeVentana } from '../metricas.js';
import { TIPOS_SESION, tiposComplemento, rutinaDe, normalizarPlan, ejerciciosDe, FINALIZADOR, CALENTAMIENTO, ENFRIAMIENTO, imagenEjercicio, REGLAS_RUTA, ZONAS_MOLESTIA, DURANTE_AYUNO, nombreTipo, resumenPlan } from '../plan.js';
import { navegar, alSalir, aviso } from '../nav.js';
import { I } from '../iconos.js';
import { hoyISO, sumarDias, fechaLarga, obtener, fijar, aNumero, escapar, num, formatoHoras, formatoRitmo, formatoDuracion, aMinutos, deMinutos, dos, idUnico, diaSemana, el } from '../util.js';

const PESTANAS = [
  { id: 'plan', nombre: 'Plan del día' },
  { id: 'sueno', nombre: 'Sueño' },
  { id: 'calentamiento', nombre: 'Calentamiento' },
  { id: 'ruta', nombre: 'Ruta' },
  { id: 'ejercicio', nombre: 'Ejercicio' },
  { id: 'ayuno', nombre: 'Ayuno y agua' },
  { id: 'comidas', nombre: 'Comidas' },
  { id: 'medidas', nombre: 'Medidas' },
  { id: 'notas', nombre: 'Notas' },
];
let pestanaActual = 'plan';
let PU = normalizarPlan(null); // plan del perfil abierto (se fija al mostrar el día) // se recuerda al pasar de un día a otro

export function mostrarDia(cont, { fecha }) {
  const ctx = contexto();
  PU = ctx.plan;
  const hoy = hoyISO();
  const m0 = metricasDia(fecha, estado.dias, ctx);
  const plan = m0.plan;
  const d = diaDe(fecha);
  const vista = cont;
  cont = document.createElement('div');
  vista.innerHTML = '';
  vista.appendChild(cont);

  cont.innerHTML = `
    <div class="cabecera">
      <button class="boton icono" data-accion="volver" title="Volver al calendario">${I.calendario}</button>
      <button class="boton icono" data-accion="anterior" title="Día anterior">${I.izquierda}</button>
      <button class="boton icono" data-accion="siguiente" title="Día siguiente">${I.derecha}</button>
      <div class="titulo">
        <h1>${fechaLarga(fecha)}${fecha === hoy ? ' <span class="estado-pill ok" style="vertical-align:middle;font-size:.45em">HOY</span>' : ''}</h1>
        <p>${plan.antesDelPlan ? 'Antes del inicio del plan' : `Semana ${plan.semana} del plan · ${plan.descanso ? 'Día de descanso' : escapar(resumenPlan(plan))}`}</p>
      </div>
      ${fecha !== hoy ? '<button class="boton" data-accion="hoy">Ir a hoy</button>' : ''}
    </div>
    <nav class="pestanas" id="pestanas">
      ${PESTANAS.filter((t) => t.id !== 'calentamiento' || PU.calentamiento).map((t) => `<button data-pestana="${t.id}" class="${t.id === pestanaActual ? 'activa' : ''}"><span class="punto" data-punto="${t.id}"></span>${t.nombre}</button>`).join('')}
    </nav>
    <div class="alertas" id="alertas" style="margin-bottom:16px"></div>
    <div class="dia-paneles">
      <div class="panel-pestana" data-panel="plan">${tarjetaPlan(plan, d, fecha === hoy)}</div>
      <div class="panel-pestana" data-panel="sueno">${seccionSueno(d)}</div>
      <div class="panel-pestana" data-panel="calentamiento">${seccionCalentamiento(d, plan)}</div>
      <div class="panel-pestana" data-panel="ruta">${seccionRuta(d, plan)}</div>
      <div class="panel-pestana" data-panel="ejercicio">${seccionComplemento(d, plan)}</div>
      <div class="panel-pestana" data-panel="ayuno">${seccionAyuno(d, plan)}</div>
      <div class="panel-pestana" data-panel="comidas">${seccionComidas(d, plan, fecha)}</div>
      <div class="panel-pestana" data-panel="medidas">${seccionMedidas(d, fecha)}</div>
      <div class="panel-pestana" data-panel="notas">${seccionNotas(d)}</div>
    </div>`;

  const mostrarPestana = (id) => {
    pestanaActual = id;
    cont.querySelectorAll('#pestanas button').forEach((b) => b.classList.toggle('activa', b.dataset.pestana === id));
    cont.querySelectorAll('.panel-pestana').forEach((p) => p.classList.toggle('activo', p.dataset.panel === id));
  };
  cont.querySelectorAll('#pestanas button').forEach((b) => b.addEventListener('click', () => mostrarPestana(b.dataset.pestana)));
  mostrarPestana(PESTANAS.some((t) => t.id === pestanaActual) ? pestanaActual : 'plan');

  // ---------- Eventos ----------
  cont.querySelector('[data-accion="volver"]').addEventListener('click', () => navegar({ vista: 'calendario', mes: fecha.slice(0, 7) }));
  cont.querySelector('[data-accion="anterior"]').addEventListener('click', () => navegar({ vista: 'dia', fecha: sumarDias(fecha, -1) }));
  cont.querySelector('[data-accion="siguiente"]').addEventListener('click', () => navegar({ vista: 'dia', fecha: sumarDias(fecha, 1) }));
  cont.querySelector('[data-accion="hoy"]')?.addEventListener('click', () => navegar({ vista: 'dia', fecha: hoy }));

  const cambiar = (camino, valor) => {
    const dia = diaEditable(fecha);
    prepararDefectos(dia, camino, plan);
    fijar(dia, camino, valor);
    diaCambiado(fecha);
    refrescar();
  };

  // Campos de texto, número, hora, selección y casillas
  cont.addEventListener('input', (e) => {
    const t = e.target;
    if (t.type === 'checkbox' || t.tagName === 'SELECT') return; // se atienden en "change"
    if (t.dataset.c) cambiar(t.dataset.c, leerValor(t));
    else if (t.dataset.comida) cambiarComida(t);
    else if (t.dataset.reg) cambiarSerie(t);
  });
  cont.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.c && (t.type === 'checkbox' || t.tagName === 'SELECT')) {
      t.closest('.ejercicio, .ej-tarjeta')?.classList.toggle('hecho', t.checked);
      cambiar(t.dataset.c, leerValor(t));
      if (t.dataset.c === 'ruta.rutaId') alElegirRuta(t.value);
      if (t.dataset.c === 'complemento.tipo') {
        const dia = diaEditable(fecha);
        if (dia.complemento) { delete dia.complemento.ejercicios; delete dia.complemento.registro; }
        diaCambiado(fecha);
        repintar();
      }
    } else if (t.dataset.comida && t.tagName === 'SELECT') cambiarComida(t);
  });

  // Botones: calificaciones, segmentados, contadores, etiquetas…
  cont.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.valorDe) {
      const actual = obtener(diaDe(fecha), b.dataset.valorDe);
      const v = isNaN(Number(b.dataset.valor)) ? b.dataset.valor : Number(b.dataset.valor);
      cambiar(b.dataset.valorDe, actual === v && b.dataset.alternar !== 'no' ? null : v);
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('activo', x === b && !(actual === v && b.dataset.alternar !== 'no')));
      if (b.dataset.valorDe === 'ruta.terreno') repintar();
    }
    if (b.dataset.sumar) {
      const actual = obtener(diaDe(fecha), b.dataset.sumar) || 0;
      const nuevo = Math.max(0, actual + Number(b.dataset.paso));
      cambiar(b.dataset.sumar, nuevo || null);
      b.closest('.contador').querySelector('.valor').textContent = nuevo;
    }
    if (b.dataset.etiqueta) {
      const c = buscarComida(b.dataset.idComida);
      c.etiquetas = c.etiquetas || [];
      c.etiquetas = c.etiquetas.includes(b.dataset.etiqueta) ? c.etiquetas.filter((x) => x !== b.dataset.etiqueta) : [...c.etiquetas, b.dataset.etiqueta];
      b.classList.toggle('activo');
      diaCambiado(fecha);
      refrescar();
    }
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    const objetivo = e.target.closest('[data-accion]');
    if (accion === 'agregar-comida') agregarComida({});
    if (accion === 'borrar-comida') {
      const dia = diaEditable(fecha);
      dia.comidas = (dia.comidas || []).filter((c) => c.id !== b.dataset.idComida);
      diaCambiado(fecha);
      repintarComidas();
    }
    if (accion === 'frecuente-guardar') {
      const c = buscarComida(b.dataset.idComida);
      if (!c.desc) { aviso('Escribe primero la descripción de la comida.'); return; }
      estado.frecuentes.push({ id: idUnico(), tipo: c.tipo, desc: c.desc, etiquetas: c.etiquetas || [], kcal: c.kcal ?? null });
      await guardarFrecuentes();
      aviso('Guardada en comidas frecuentes.', 'ok');
      repintarComidas();
    }
    if (accion === 'frecuente-usar') {
      const f = estado.frecuentes.find((x) => x.id === b.dataset.id);
      if (f) agregarComida({ tipo: f.tipo, desc: f.desc, etiquetas: [...(f.etiquetas || [])], kcal: f.kcal });
    }
    if (accion === 'frecuente-quitar') {
      estado.frecuentes = estado.frecuentes.filter((x) => x.id !== objetivo.dataset.id);
      await guardarFrecuentes();
      repintarComidas();
    }
    if (accion === 'hora-ahora') {
      const input = b.parentElement.querySelector('input');
      const ahora = new Date();
      input.value = `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (accion === 'foto') {
      const rel = await window.api.importarImagen('fotos');
      if (rel) { cambiar('medidas.foto', rel); repintarFoto(); }
    }
    if (accion === 'quitar-foto') { cambiar('medidas.foto', null); repintarFoto(); }
    if (accion === 'todo-complemento') {
      const dia = diaEditable(fecha);
      prepararDefectos(dia, 'complemento.x', plan);
      dia.complemento.registro = Object.fromEntries(ejerciciosDe(dia.complemento.tipo, plan.semana, PU).map((x) => [x.id, Array(x.series).fill(x.valor)]));
      dia.complemento.hecho = true;
      diaCambiado(fecha);
      repintar();
    }
    if (accion === 'serie-sugerido') {
      const dia = diaEditable(fecha);
      prepararDefectos(dia, 'complemento.x', plan);
      dia.complemento.registro = { ...(dia.complemento.registro || {}), [objetivo.dataset.id]: Array(Number(objetivo.dataset.series)).fill(Number(objetivo.dataset.valor)) };
      diaCambiado(fecha);
      const fila = objetivo.closest('.serie-fila');
      fila.querySelectorAll('input[data-reg]').forEach((inp, i) => { inp.value = dia.complemento.registro[objetivo.dataset.id][i] ?? ''; });
      fila.classList.add('hecho');
      refrescar();
    }
    if (accion === 'serie-mas') {
      const fila = objetivo.closest('.serie-fila');
      const n = fila.querySelectorAll('input[data-reg]').length;
      const nueva = el(`<label class="serie"><span>S${n + 1}</span><input type="text" inputmode="numeric" data-reg="${objetivo.dataset.id}" data-serie="${n}" placeholder=""></label>`);
      fila.querySelector('.serie-unidad').before(nueva);
      nueva.querySelector('input').focus();
    }
  });

  // Repeticiones (o segundos) de una serie
  function cambiarSerie(t) {
    const dia = diaEditable(fecha);
    prepararDefectos(dia, 'complemento.x', plan);
    const reg = dia.complemento.registro = dia.complemento.registro || {};
    const lista = reg[t.dataset.reg] = reg[t.dataset.reg] || [];
    const v = parseInt(String(t.value).replace(/\D/g, ''), 10);
    lista[Number(t.dataset.serie)] = Number.isFinite(v) && v > 0 ? v : null;
    while (lista.length && lista.at(-1) == null) lista.pop();
    if (!lista.length) delete reg[t.dataset.reg];
    diaCambiado(fecha);
    const fila = t.closest('.serie-fila');
    const sugeridas = Number(fila.querySelector('[data-accion="serie-sugerido"]').dataset.series);
    fila.classList.toggle('hecho', (reg[t.dataset.reg] || []).filter((x) => x > 0).length >= sugeridas);
    refrescar();
  }

  function buscarComida(id) {
    return (diaEditable(fecha).comidas || []).find((c) => c.id === id);
  }

  function cambiarComida(t) {
    const c = buscarComida(t.dataset.comida);
    if (!c) return;
    const k = t.dataset.k;
    let v = t.value;
    if (k === 'kcal') v = aNumero(v);
    if (v === '' || v == null) delete c[k]; else c[k] = v;
    diaCambiado(fecha);
    if (k === 'hora') {
      const fila = t.closest('.comida');
      const fuera = plan.ayuno && fueraDeVentana(c.hora, plan.ayuno.ventana, diaDe(fecha).ayuno?.guineoAntes);
      fila.classList.toggle('fuera-ventana', !!fuera);
      fila.querySelector('.aviso-ventana')?.classList.toggle('oculto', !fuera);
    }
    refrescar();
  }

  function agregarComida(datos) {
    const dia = diaEditable(fecha);
    dia.comidas = dia.comidas || [];
    const usados = dia.comidas.map((c) => c.tipo);
    const tipo = datos.tipo && !usados.includes(datos.tipo) ? datos.tipo : TIPOS_COMIDA.find((t) => !usados.includes(t.id))?.id || 'merienda';
    const ahora = new Date();
    dia.comidas.push({ id: idUnico(), tipo, hora: fecha === hoyISO() ? `${dos(ahora.getHours())}:${dos(ahora.getMinutes())}` : '', etiquetas: [], ...datos, tipo });
    dia.comidas.sort((a, b) => (a.hora || '99') < (b.hora || '99') ? -1 : 1);
    diaCambiado(fecha);
    repintarComidas();
  }

  function alElegirRuta(id) {
    const r = estado.rutas.find((x) => x.id === id);
    if (!r) return;
    const dia = diaEditable(fecha);
    dia.ruta.terreno = r.terreno === 'plano' ? 'plano' : 'montana';
    if (r.desnivel != null) dia.ruta.desnivel = r.desnivel;
    if (dia.ruta.distancia == null && r.distancia) dia.ruta.distancia = r.distancia;
    diaCambiado(fecha);
    repintar();
  }

  function repintar() {
    const top = vista.scrollTop;
    navegar({ vista: 'dia', fecha });
    vista.scrollTop = top;
  }

  function repintarComidas() {
    const viejo = cont.querySelector('#sec-comidas');
    viejo.outerHTML = seccionComidas(diaDe(fecha), plan, fecha);
    refrescar();
  }

  async function repintarFoto() {
    const caja = cont.querySelector('#caja-foto');
    const rel = diaDe(fecha).medidas?.foto;
    caja.innerHTML = rel ? `<img class="foto-medida" src="${await window.api.urlArchivo(rel)}" alt="Foto"><button class="boton fantasma peligro" data-accion="quitar-foto" style="margin-top:6px">${I.basura} Quitar foto</button>` : '';
  }

  // Resultados calculados (se actualizan en vivo)
  function refrescar() {
    const m = metricasDia(fecha, estado.dias, ctx);
    const pon = (k, html) => cont.querySelectorAll(`[data-calc="${k}"]`).forEach((x) => (x.innerHTML = html));
    pon('sueno', m.sueno != null ? formatoHoras(m.sueno) : '—');
    pon('sueno-estado', m.suenoOk == null ? pill('nada', 'Sin datos') : m.suenoOk ? pill('ok', `✓ ${num(PU.metas.suenoHoras, 1)} h o más`) : pill('no', `Menos de ${num(PU.metas.suenoHoras, 1)} h`));
    pon('ayuno', m.ayunoHoras != null ? formatoHoras(m.ayunoHoras) : '—');
    pon('ventana', m.ventanaHoras != null ? formatoHoras(m.ventanaHoras) : '—');
    pon('ayuno-estado', !plan.ayuno ? pill('nada', 'Sin meta') : m.ayunoExcepcion ? pill('ok', '✓ Excepción permitida') : m.ayunoOk == null ? pill('nada', 'Faltan horas') : m.ayunoOk ? pill('ok', `✓ Meta ${plan.ayuno.horas} h`) : pill('no', `Meta ${plan.ayuno.horas} h`));
    pon('agua', m.aguaL != null ? `${num(m.aguaL, 2)} L` : '0 L');
    pon('kcal', m.kcalIngeridas != null ? `${Math.round(m.kcalIngeridas)} kcal` : '—');
    pon('ritmo', formatoRitmo(m.ritmo));
    pon('kmesf', m.rutaKmEsf != null ? num(m.rutaKmEsf, 2) : '—');
    pon('duracion', formatoDuracion(m.rutaMin));
    pon('ruta-estado', m.rutaHecha ? pill('ok', '✓ Ruta hecha') : pill('nada', 'Sin registrar'));
    pon('comp-resumen', m.compPorcentaje == null ? '' : `<b>${m.compReps}</b> repeticiones${m.compSegundos ? ` · <b>${formatoDuracion(m.compSegundos / 60)}</b> de trabajo por tiempo` : ''} · <b>${m.compPorcentaje} %</b> de lo sugerido<div class="barra-progreso"><div style="width:${Math.min(100, m.compPorcentaje)}%;background:var(--c-comp)"></div></div>`);
    pon('comp-estado', m.compHecho ? pill('ok', '✓ Completado') : m.compParcial ? pill('nada', 'A medias') : pill('nada', 'Pendiente'));
    const dia = diaDe(fecha);
    const calent = Object.values(dia.calentamiento || {}).filter(Boolean).length;
    const puntos = {
      sueno: m.suenoOk,
      calentamiento: calent >= TOTAL_CALENTAMIENTO ? true : calent > 0 ? 'parcial' : null,
      ruta: m.rutaHecha || null,
      ejercicio: m.compHecho ? true : m.compParcial ? 'parcial' : null,
      ayuno: m.ayunoOk,
      comidas: m.comidas > 0 || null,
      medidas: m.peso != null || m.cintura != null || null,
      notas: !!(dia.notas || dia.animo) || null,
    };
    pon('calent', pillCalentamiento(calent));
    cont.querySelectorAll('[data-punto]').forEach((x) => {
      const v = puntos[x.dataset.punto];
      x.className = 'punto' + (v === true ? ' ok' : v === 'parcial' ? ' parcial' : v === false ? ' no' : '');
    });
    const cajaAlertas = cont.querySelector('#alertas');
    cajaAlertas.innerHTML = alertasDia(fecha, estado.dias, ctx).map((a) => `<div class="alerta ${a.nivel}">${a.nivel === 'info' ? I.info : I.alerta}<div>${escapar(a.texto)}</div></div>`).join('');
  }

  // Cuenta regresiva de la ventana de comida (solo hoy)
  if (fecha === hoy && plan.ayuno) {
    const caja = cont.querySelector('#cuenta-regresiva');
    const tick = () => pintarCuentaRegresiva(caja, plan, fecha);
    tick();
    const t = setInterval(tick, 1000);
    alSalir(() => clearInterval(t));
  }

  refrescar();
  repintarFoto();
}

// Al tocar por primera vez la ruta o el complemento, se toman los valores del plan.
function prepararDefectos(dia, camino, plan) {
  if (camino.startsWith('ruta.') && !dia.ruta) {
    const principal = rutaPrincipal();
    dia.ruta = {
      tipo: plan.ruta?.tipo || 'ligera',
      terreno: plan.ruta?.terreno || 'montana',
    };
    if (principal && (principal.terreno === 'plano') === (dia.ruta.terreno === 'plano')) {
      dia.ruta.rutaId = principal.id;
      if (principal.desnivel != null) dia.ruta.desnivel = principal.desnivel;
    }
  }
  if (camino.startsWith('complemento.') && !dia.complemento) {
    dia.complemento = { tipo: plan.complemento?.tipo || 'estiramientos' };
    if (rutinaDe(dia.complemento.tipo, PU)?.usaPeso) dia.complemento.pesoLb = 10;
  }
}

function leerValor(t) {
  if (t.type === 'checkbox') return t.checked || null;
  if (t.dataset.t === 'num') return aNumero(t.value);
  return t.value;
}

const pill = (clase, texto) => `<span class="estado-pill ${clase}">${texto}</span>`;

// ---------- Constructores de campos ----------
function campo(etiqueta, camino, d, { tipo = 'texto', unidad = '', ph = '', ahora = false } = {}) {
  const v = obtener(d, camino);
  const valor = v == null ? '' : tipo === 'num' ? String(v).replace('.', ',') : v;
  const tipoInput = tipo === 'hora' ? 'time' : 'text';
  const input = `<input type="${tipoInput}" data-c="${camino}" data-t="${tipo}" value="${escapar(valor)}" placeholder="${escapar(ph)}" ${tipo === 'num' ? 'inputmode="decimal"' : ''}>`;
  return `<label class="campo"><span>${etiqueta}</span>${
    unidad ? `<div class="con-unidad">${input}<em>${unidad}</em></div>`
    : ahora ? `<div style="display:flex;gap:6px">${input}<button type="button" class="boton icono" data-accion="hora-ahora" title="Poner la hora actual">${I.ayuno}</button></div>`
    : input
  }</label>`;
}

function seleccion(etiqueta, camino, d, opciones, defecto) {
  const v = obtener(d, camino) ?? defecto ?? '';
  return `<label class="campo"><span>${etiqueta}</span><select data-c="${camino}">${opciones.map((o) => `<option value="${o.id}" ${o.id === v ? 'selected' : ''}>${escapar(o.nombre)}</option>`).join('')}</select></label>`;
}

function escala(camino, d, max, etiquetas) {
  const v = obtener(d, camino);
  return `<div class="estrellas">${Array.from({ length: max }, (_, i) => i + 1).map((n) => `<button type="button" data-valor-de="${camino}" data-valor="${n}" class="${v === n ? 'activo' : ''}" title="${etiquetas?.[n - 1] || n}">${n}</button>`).join('')}</div>`;
}

function segmentado(camino, d, opciones, defecto) {
  const v = obtener(d, camino) ?? defecto;
  return `<div class="segmentado">${opciones.map((o) => `<button type="button" data-valor-de="${camino}" data-valor="${o.id}" data-alternar="no" class="${o.id === v ? 'activo' : ''}">${o.nombre}</button>`).join('')}</div>`;
}

function casilla(texto, camino, d) {
  return `<label class="check"><input type="checkbox" data-c="${camino}" ${obtener(d, camino) ? 'checked' : ''}><span>${texto}</span></label>`;
}

function cabecera(titulo, icono, colorVar, extra = '') {
  return `<div class="tarjeta-cab"><span class="icono-sec" style="background:color-mix(in srgb, var(${colorVar}) 18%, transparent);color:var(${colorVar})">${icono}</span><h2>${titulo}</h2>${extra}</div>`;
}

// ---------- Secciones ----------
function seccionSueno(d) {
  return `<section class="tarjeta">
    ${cabecera('Sueño', I.sueno, '--c-sueno', '<span data-calc="sueno-estado"></span>')}
    <div class="campos">
      ${campo('Me dormí (noche anterior)', 'sueno.dormir', d, { tipo: 'hora' })}
      ${campo('Me desperté', 'sueno.despertar', d, { tipo: 'hora' })}
      <label class="campo"><span>Calidad del sueño</span>${escala('sueno.calidad', d, 5, ['Muy mala', 'Mala', 'Normal', 'Buena', 'Excelente'])}</label>
    </div>
    <div class="resultado"><div><b data-calc="sueno">—</b><small>horas dormidas (meta ${num(PU.metas.suenoHoras, 1)} h)</small></div></div>
  </section>`;
}

function seccionAyuno(d, plan) {
  const a = plan.ayuno;
  const vasos = d.agua || 0;
  return `<section class="tarjeta">
    ${cabecera('Ayuno y agua', I.ayuno, '--c-ayuno', '<span data-calc="ayuno-estado"></span>')}
    ${a ? `<p class="suave pequeño" style="margin:-6px 0 12px">Hoy: <b>${a.protocolo}</b> · ventana ${a.ventana[0]} – ${a.ventana[1]}</p>` : ''}
    <div class="campos">
      ${campo('Primera comida (abre la ventana)', 'ayuno.primera', d, { tipo: 'hora', ahora: true })}
      ${campo('Última comida (cierra la ventana)', 'ayuno.ultima', d, { tipo: 'hora', ahora: true })}
    </div>
    <div style="margin-top:8px">${casilla('Excepción: comí algo pequeño antes de entrenar (ej. un guineo) porque estaba muy cansado o mareado', 'ayuno.guineoAntes', d)}</div>
    <div class="resultado">
      <div><b data-calc="ayuno">—</b><small>de ayuno (desde la última comida de ayer)</small></div>
      <div><b data-calc="ventana">—</b><small>ventana de comida de hoy</small></div>
    </div>
    <div class="contador" style="margin-top:14px">
      <span style="color:var(--c-ayuno)">${I.agua}</span>
      <span class="nombre">Agua <span class="suave pequeño">(vasos de ${ML_POR_VASO} ml · meta ${PU.metas.aguaVasos || 10} vasos = ${num(((PU.metas.aguaVasos || 10) * ML_POR_VASO) / 1000, 2)} L)</span></span>
      <span class="suave num" data-calc="agua"></span>
      <button class="boton" data-sumar="agua" data-paso="-1">−</button>
      <span class="valor">${vasos}</span>
      <button class="boton" data-sumar="agua" data-paso="1">+</button>
    </div>
  </section>`;
}

function seccionComidas(d, plan, fecha) {
  const comidas = d.comidas || [];
  const frutas = d.frutas || {};
  const filas = comidas.map((c) => {
    const fuera = plan.ayuno && fueraDeVentana(c.hora, plan.ayuno.ventana, d.ayuno?.guineoAntes);
    return `<div class="comida ${fuera ? 'fuera-ventana' : ''}">
      <select data-comida="${c.id}" data-k="tipo">${TIPOS_COMIDA.map((t) => `<option value="${t.id}" ${t.id === c.tipo ? 'selected' : ''}>${t.nombre}</option>`).join('')}</select>
      <input type="time" data-comida="${c.id}" data-k="hora" value="${escapar(c.hora || '')}">
      <input type="text" data-comida="${c.id}" data-k="desc" value="${escapar(c.desc || '')}" placeholder="¿Qué comiste? (ej. 2 huevos + 1 guineo + 1 naranja)">
      <div class="con-unidad"><input type="text" inputmode="numeric" data-comida="${c.id}" data-k="kcal" value="${c.kcal ?? ''}" placeholder="Calorías"><em>kcal</em></div>
      <button class="boton icono fantasma" data-accion="borrar-comida" data-id-comida="${c.id}" title="Borrar esta comida">${I.basura}</button>
      <div class="chips">
        ${ETIQUETAS_COMIDA.map((e) => `<button type="button" class="chip ${e.limitar ? 'limitar' : e.bueno ? 'bueno' : ''} ${(c.etiquetas || []).includes(e.id) ? 'activo' : ''}" data-etiqueta="${e.id}" data-id-comida="${c.id}">${e.nombre}</button>`).join('')}
        <button type="button" class="chip" data-accion="frecuente-guardar" data-id-comida="${c.id}" title="Guardar para repetirla con un clic" style="margin-left:auto">☆ Guardar como frecuente</button>
      </div>
      <div class="aviso-ventana ${fuera ? '' : 'oculto'}">⚠ Esta hora queda fuera de la ventana de hoy (${plan.ayuno?.ventana.join(' – ')}).</div>
    </div>`;
  }).join('');

  const contador = (nombre, clave, extra = '') => `<div class="contador"><span class="nombre">${nombre}${extra}</span>
    <button class="boton" data-sumar="frutas.${clave}" data-paso="-1">−</button><span class="valor">${frutas[clave] || 0}</span><button class="boton" data-sumar="frutas.${clave}" data-paso="1">+</button></div>`;

  return `<section class="tarjeta" id="sec-comidas">
    ${cabecera('Comidas', I.comida, '--acento', '<span class="suave num" data-calc="kcal"></span>')}
    ${filas || '<p class="suave" style="margin-bottom:10px">Aún no hay comidas registradas este día.</p>'}
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="boton primario" data-accion="agregar-comida">${I.mas} Añadir comida</button>
    </div>
    ${estado.frecuentes.length ? `<div class="frecuentes"><span class="suave pequeño">Frecuentes:</span>${estado.frecuentes.map((f) => `<button class="chip" data-accion="frecuente-usar" data-id="${f.id}" title="${escapar(f.desc)}">${escapar(f.desc.length > 34 ? f.desc.slice(0, 32) + '…' : f.desc)}${f.kcal ? ` · ${f.kcal} kcal` : ''} <span data-accion="frecuente-quitar" data-id="${f.id}" title="Quitar de frecuentes" style="opacity:.5;margin-left:4px">✕</span></button>`).join('')}</div>` : ''}
    ${PU.alimentos.length ? `<h3 style="margin:18px 0 10px">Alimentos que cuento</h3>
    <div class="rejilla" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      ${PU.alimentos.map((a) => contador(`${escapar(a.emoji || '')} ${escapar(a.nombre)}`, a.id, a.nota || a.max ? ` <span class="suave pequeño">(${escapar(a.nota || `máx. ${a.max}`)})</span>` : '')).join('')}
    </div>` : ''}
  </section>`;
}

function seccionRuta(d, plan) {
  const r = d.ruta || {};
  const terreno = r.terreno || plan.ruta?.terreno || 'montana';
  const opcionesRutas = [{ id: '', nombre: '— Sin ruta guardada —' }, ...estado.rutas.map((x) => ({ id: x.id, nombre: `${x.nombre} (${x.terreno === 'plano' ? 'plano' : x.terreno === 'mixto' ? 'mixto' : 'montaña'})` }))];
  const rpe = ['Muy fácil', 'Fácil', 'Fácil', 'Moderado', 'Moderado', 'Algo duro', 'Duro', 'Muy duro', 'Máximo casi', 'Máximo'];
  return `<section class="tarjeta">
    ${cabecera(plan.descanso ? 'Ruta (opcional hoy: descanso)' : 'Ruta', I.ruta, '--c-ruta', '<span data-calc="ruta-estado"></span>')}
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
      ${segmentado('ruta.terreno', d, [{ id: 'montana', nombre: '⛰ Montaña' }, { id: 'plano', nombre: '▭ Plano' }], terreno)}
      ${casilla('Hecha (aunque no tenga los datos)', 'ruta.hecha', d)}
    </div>
    <div class="campos">
      ${seleccion('Ruta', 'ruta.rutaId', d, opcionesRutas, r.rutaId ?? '')}
      ${seleccion('Tipo de sesión', 'ruta.tipo', d, TIPOS_SESION, plan.ruta?.tipo || 'ligera')}
      ${campo('Hora de salida', 'ruta.salida', d, { tipo: 'hora' })}
      ${campo('Tiempo (de la app Adidas)', 'ruta.tiempo', d, { ph: 'h:mm:ss  ej. 1:12:30' })}
      ${campo('Distancia', 'ruta.distancia', d, { tipo: 'num', unidad: 'km', ph: '8,0' })}
      ${campo('Calorías quemadas', 'ruta.kcal', d, { tipo: 'num', unidad: 'kcal' })}
      ${campo('Desnivel positivo', 'ruta.desnivel', d, { tipo: 'num', unidad: 'm', ph: terreno === 'plano' ? '0' : 'por medir' })}
      ${campo('Minutos trotando', 'ruta.minTrote', d, { tipo: 'num', unidad: 'min' })}
      ${campo('Frec. cardíaca prom.', 'ruta.fc', d, { tipo: 'num', unidad: 'ppm', ph: 'opcional' })}
    </div>
    <div class="campos" style="margin-top:12px;grid-template-columns:1fr">
      <label class="campo"><span>Esfuerzo percibido (RPE 1–10)</span>${escala('ruta.rpe', d, 10, rpe)}</label>
    </div>
    <div class="campos" style="margin-top:12px">
      ${seleccion('Molestia', 'ruta.molestiaZona', d, [{ id: 'ninguna', nombre: 'Ninguna' }, ...ZONAS_MOLESTIA.map((z) => ({ id: z, nombre: z }))], 'ninguna')}
      ${r.molestiaZona && r.molestiaZona !== 'ninguna' ? `<label class="campo"><span>Intensidad (1–5)</span>${escala('ruta.molestiaNivel', d, 5)}</label>` : ''}
    </div>
    <div class="resultado">
      <div><b data-calc="duracion">—</b><small>duración</small></div>
      <div><b data-calc="ritmo">—</b><small>ritmo promedio</small></div>
      <div><b data-calc="kmesf">—</b><small>km-esfuerzo (km + desnivel/100)</small></div>
      ${plan.ruta ? `<div><b>${num(plan.ruta.metaKm, 1)} km</b><small>meta del plan</small></div>` : ''}
    </div>
  </section>`;
}

function seccionComplemento(d, plan) {
  const c = d.complemento || {};
  const tipo = c.tipo || plan.complemento?.tipo || 'estiramientos';
  const def = rutinaDe(tipo, PU);
  const ejercicios = ejerciciosDe(tipo, plan.semana, PU);
  return `<section class="tarjeta">
    ${cabecera(plan.complemento ? 'Ejercicio del día' : 'Ejercicio (opcional hoy)', I.comp, '--c-comp', '<span data-calc="comp-estado"></span>')}
    <div class="campos">
      ${seleccion('Rutina', 'complemento.tipo', d, tiposComplemento(PU), tipo)}
      ${campo('Hora de inicio', 'complemento.inicio', d, { tipo: 'hora' })}
      ${campo('Duración', 'complemento.duracion', d, { tipo: 'num', unidad: 'min', ph: '20–30' })}
      ${def?.usaPeso ? campo('Peso usado', 'complemento.pesoLb', d, { tipo: 'num', unidad: 'lb', ph: '10' }) : ''}
    </div>
    <p class="suave pequeño" style="margin:12px 0 0">Semana ${Math.max(1, plan.semana)} · ${def?.formato || ''}. Escribe en cada casilla lo que hiciste de verdad (el número gris es lo sugerido).</p>
    ${bloqueSeries('Bloque principal', ejercicios.filter((e) => e.bloque === 'principal'), c.registro || {})}
    ${ejercicios.some((e) => e.bloque === 'abdomen') ? bloqueSeries(`🔥 ${FINALIZADOR.nombre}`, ejercicios.filter((e) => e.bloque === 'abdomen'), c.registro || {}, FINALIZADOR.formato) : ''}
    <div class="resumen-series" data-calc="comp-resumen"></div>
    <div style="display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap">
      ${casilla('Completado', 'complemento.hecho', d)}
      <button class="boton fantasma" data-accion="todo-complemento">${I.check} Todo como lo sugerido</button>
    </div>
    <p class="suave pequeño" style="margin-top:12px">La grasa del abdomen no se quema "localmente" con abdominales: baja con el déficit de calorías y la ruta diaria. Los abdominales fortalecen el core y marcan la zona a medida que la grasa baja.</p>
  </section>`;
}

function bloqueSeries(titulo, ejercicios, registro, formato = '') {
  if (!ejercicios.length) return '';
  return `<h3 class="ej-grupo">${titulo}${formato ? ` <span class="suave" style="text-transform:none;letter-spacing:0;font-weight:500">· ${formato}</span>` : ''}</h3>
    ${ejercicios.map((e) => filaSeries(e, registro[e.id] || [])).join('')}`;
}

function filaSeries(e, valores) {
  const n = Math.max(e.series, valores.length);
  const llenas = valores.filter((v) => Number(v) > 0).length;
  const unidad = e.unidad === 's' ? 's' : 'reps';
  return `<div class="serie-fila ${llenas >= e.series ? 'hecho' : ''}" data-fila="${e.id}">
    <div class="serie-nombre"><b>${escapar(e.nombre)}</b>
      <small>Sugerido: ${escapar(e.meta)}${e.nota ? ` · ${escapar(e.nota)}` : ''}</small></div>
    <div class="series">
      ${Array.from({ length: n }, (_, i) => `<label class="serie"><span>S${i + 1}</span>
        <input type="text" inputmode="numeric" data-reg="${e.id}" data-serie="${i}" value="${valores[i] ?? ''}" placeholder="${e.valor}"></label>`).join('')}
      <span class="serie-unidad">${unidad}${e.lado ? ' c/lado' : ''}</span>
      <button type="button" class="boton icono fantasma" data-accion="serie-mas" data-id="${e.id}" title="Añadir otra serie">${I.mas}</button>
      <button type="button" class="boton fantasma serie-sugerido" data-accion="serie-sugerido" data-id="${e.id}" data-series="${e.series}" data-valor="${e.valor}">${I.check} Hecho como sugerido</button>
    </div>
  </div>`;
}

function seccionMedidas(d, fecha) {
  const lunes = diaSemana(fecha) === 1;
  return `<section class="tarjeta">
    ${cabecera('Medidas', I.balanza, '--g-peso', lunes ? '<span class="estado-pill nada">Lunes: día de pesarse</span>' : '')}
    <p class="suave pequeño" style="margin:-6px 0 12px">1 vez por semana, mismo día y hora, en ayunas, después de ir al baño. Cintura a la altura del ombligo.</p>
    <div class="campos">
      ${campo('Peso', 'medidas.peso', d, { tipo: 'num', unidad: 'kg' })}
      ${campo('Cintura', 'medidas.cintura', d, { tipo: 'num', unidad: 'cm' })}
      <label class="campo"><span>Foto (opcional)</span><button class="boton" data-accion="foto">${I.imagen} ${d.medidas?.foto ? 'Cambiar foto' : 'Añadir foto'}</button></label>
    </div>
    <div id="caja-foto"></div>
  </section>`;
}

function seccionNotas(d) {
  return `<section class="tarjeta">
    ${cabecera('Notas del día', I.notas, '--texto-suave')}
    <label class="campo" style="margin-bottom:12px"><span>¿Cómo me sentí?</span>${escala('animo', d, 5, ['Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'])}</label>
    <textarea data-c="notas" placeholder="Cómo te fue, qué comiste fuera de lo normal, cómo estuvo la ruta…">${escapar(d.notas || '')}</textarea>
  </section>`;
}

const TOTAL_CALENTAMIENTO = CALENTAMIENTO.reduce((s, g) => s + g.items.length, 0) + ENFRIAMIENTO.length;

const pillCalentamiento = (n) => `<span class="estado-pill ${n >= TOTAL_CALENTAMIENTO ? 'ok' : 'nada'}">${n}/${TOTAL_CALENTAMIENTO}</span>`;

function seccionCalentamiento(d) {
  const c = d.calentamiento || {};
  const tarjeta = (clave, texto, metaGrupo) => {
    const [nombre, m] = texto.split(' – ');
    const meta = /^\d+$/.test(m || '') ? `${m} repeticiones` : m;
    const img = imagenEjercicio(texto);
    return `<label class="ej-tarjeta ${c[clave] ? 'hecho' : ''}">
      <input type="checkbox" data-c="calentamiento.${clave}" ${c[clave] ? 'checked' : ''}>
      <div class="ej-imagen">${img ? `<img src="${img}" alt="${escapar(nombre)}" loading="lazy">` : ''}<span class="ej-check">${I.check}</span></div>
      <div class="ej-texto"><b>${escapar(nombre)}</b><span>${escapar(meta || metaGrupo)}</span></div>
    </label>`;
  };
  const hechos = Object.values(c).filter(Boolean).length;
  return `<section class="tarjeta">
    ${cabecera('Calentamiento y enfriamiento', I.calentar, '--aviso', `<span data-calc="calent">${pillCalentamiento(hechos)}</span>`)}
    <p class="suave pequeño" style="margin:-6px 0 4px">Toca cada tarjeta al terminar el ejercicio. Siempre: los primeros 5 minutos de la ruta son caminando, aunque ese día toque correr.</p>
    ${CALENTAMIENTO.map((g, gi) => `<h3 class="ej-grupo">${g.grupo}</h3>
      <div class="ej-galeria">${g.items.map((it, ii) => tarjeta(`g${gi}_${ii}`, it, gi === 0 ? '10 repeticiones' : '')).join('')}</div>`).join('')}
    <h3 class="ej-grupo">Enfriamiento al regresar (5 min)</h3>
    <div class="ej-galeria">${ENFRIAMIENTO.map((z, i) => tarjeta(`e${i}`, `${z} – 30 s`, '')).join('')}</div>
  </section>`;
}

// ---------- Plan del día ----------
function tarjetaPlan(plan, d, esHoy) {
  if (plan.antesDelPlan) {
    return `<section class="tarjeta plan-dia"><h2>Plan del día</h2><p class="suave" style="margin-top:10px">El plan comienza el <b>${fechaLarga(contexto().inicio)}</b>. Puedes ir registrando igual si quieres.</p></section>`;
  }
  const r = plan.ruta;
  const c = plan.complemento;
  const a = plan.ayuno;
  return `<section class="tarjeta plan-dia">
    <div class="tarjeta-cab"><h2>Plan del día</h2><span class="estado-pill nada">Semana ${plan.semana}</span></div>
    <div class="plan-bloque">
      <h4>Ruta</h4>
      ${r ? `<div class="grande" style="color:var(--c-ruta)">${escapar(r.titulo)}</div>
        ${r.detalle ? `<p class="suave" style="margin-top:4px">${escapar(r.detalle)}</p>` : ''}
        ${r.intervalo ? `<p style="margin-top:6px"><b>Intervalo:</b> ${escapar(r.intervalo)}</p>` : ''}
        <p style="margin-top:6px"><b>Meta:</b> ${num(r.metaKm, 1)} km${r.vueltas ? ` · ${r.vueltas} vueltas de 400 m` : r.nombreRuta ? ` · ${escapar(r.nombreRuta)}` : ''} · ${r.terreno === 'plano' ? 'plano' : r.terreno === 'mixto' ? 'mixto' : 'montaña'}</p>
        ${PU.intervalos ? `<ul>${REGLAS_RUTA.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}`
      : plan.descanso ? '<div class="grande">Descanso total</div><p class="suave" style="margin-top:4px">O caminata ligera de 20–30 min. Puedes dormir hasta 1 h más.</p>'
      : '<div class="grande">Sin ruta hoy</div><p class="suave" style="margin-top:4px">Hoy toca solo el ejercicio de abajo.</p>'}
    </div>
    ${c ? `<div class="plan-bloque"><h4>Complemento</h4><div class="grande" style="color:var(--c-comp)">${c.nombre}</div><p class="suave">${c.formato}</p>
      <ul>${c.ejercicios.map((e) => `<li>${e.bloque === 'abdomen' ? '🔥 ' : ''}${escapar(e.nombre)} – ${escapar(e.meta)}</li>`).join('')}</ul></div>` : ''}
    ${a ? `<div class="plan-bloque"><h4>Ayuno</h4><div class="grande" style="color:var(--c-ayuno)">${a.protocolo} · ${a.ventana[0]} – ${a.ventana[1]}</div><p class="suave">${a.texto}</p>
      ${esHoy ? '<div class="cuenta-regresiva" id="cuenta-regresiva"></div>' : ''}
      <details class="desplegable" style="margin-top:8px"><summary>Qué puedo tomar en ayuno</summary><ul>${DURANTE_AYUNO.map((x) => `<li>${x}</li>`).join('')}</ul></details>
    </div>` : ''}
    ${r ? `<p class="suave pequeño" style="margin-top:6px">Antes de salir: pestaña <b>Calentamiento</b> (10 min) y al volver, el enfriamiento (5 min).</p>` : ''}
  </section>`;
}

function pintarCuentaRegresiva(caja, plan, fecha) {
  if (!caja) return;
  const ahora = new Date();
  const seg = ahora.getHours() * 3600 + ahora.getMinutes() * 60 + ahora.getSeconds();
  const [abre, cierra] = plan.ayuno.ventana.map((h) => aMinutos(h) * 60);
  const dia = diaDe(fecha);
  const ayer = diaDe(sumarDias(fecha, -1));
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 3600)}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`; };
  let titulo, tiempo, progreso, nota = '';
  if (seg < abre && !dia.ayuno?.primera) {
    // En ayuno: desde la última comida de ayer (o el cierre planeado) hasta la apertura.
    const ultimaAyer = aMinutos(ayer.ayuno?.ultima);
    const inicio = (ultimaAyer != null ? ultimaAyer : aMinutos('18:00')) * 60 - 86400;
    const total = abre - inicio;
    titulo = 'En ayuno · la ventana abre en';
    tiempo = fmt(abre - seg);
    progreso = (seg - inicio) / total;
    nota = `Llevas ${fmt(seg - inicio)} de ayuno.`;
  } else if (seg < cierra) {
    titulo = 'Ventana abierta · cierra en';
    tiempo = fmt(cierra - seg);
    progreso = (seg - abre) / (cierra - abre);
    nota = `Última comida antes de las ${plan.ayuno.ventana[1]}.`;
  } else {
    const ultima = aMinutos(dia.ayuno?.ultima);
    const desde = (ultima != null ? ultima : cierra / 60) * 60;
    titulo = 'Ventana cerrada · ayuno en curso';
    tiempo = fmt(seg - desde);
    progreso = 1;
    nota = `Mañana abre a las ${deMinutos(abre / 60)} (según la semana del plan).`;
  }
  caja.innerHTML = `<div class="suave pequeño" style="font-weight:600">${titulo}</div><div class="tiempo">${tiempo}</div>
    <div class="barra-progreso"><div style="width:${Math.min(100, Math.max(0, progreso * 100))}%"></div></div><div class="suave pequeño" style="margin-top:6px">${nota}</div>`;
}
