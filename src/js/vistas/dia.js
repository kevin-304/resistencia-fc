import {campoHora,conectarHoras} from '../selector-hora.js';
// Detalle de un día: lo que tocaba según el plan y todos los apartados para registrar.
// Cada cambio se guarda solo (no hay botón "Guardar").
import { estado, contexto, diaDe, diaEditable, diaCambiado, guardarFrecuentes, rutaPrincipal } from '../estado.js';
import { metricasDia, alertasDia, ETIQUETAS_COMIDA, TIPOS_COMIDA, ML_POR_VASO, fueraDeVentana } from '../metricas.js';
import { TIPOS_SESION, tiposComplemento, rutinaDe, normalizarPlan, ejerciciosDe, FINALIZADOR, CALENTAMIENTO, ENFRIAMIENTO, imagenEjercicio, REGLAS_RUTA, ZONAS_MOLESTIA, DURANTE_AYUNO, nombreTipo, resumenPlan, planEnFecha } from '../plan.js';
import { navegar, alSalir, aviso } from '../nav.js';
import { tarjetaGuia, abrirGuia } from '../guias-rutina.js';
import { montarTemporizador } from '../temporizador.js';
import { figuraReloj } from '../figura-reloj.js';
import { ALIMENTOS, alimentosDelDia } from '../alimentos.js';
import { comidasVisibles, comidasPredeterminadas, selectorAlimentos, actualizarDescripcion, CATEGORIAS_COMIDA, contadorAyuno, guardarComida, reordenarComidas } from '../comidas.js';
import { tarjetaSeccion, conectarTarjetas } from '../tarjetas.js';
import { resumenRutina } from '../resumen-rutina.js';
import { iconoArrastrar } from '../iconos-alimentos.js';
import { conectarOrdenComidas } from '../orden-comidas.js';
import { I } from '../iconos.js';
import { hoyISO, sumarDias, fechaLarga, obtener, fijar, aNumero, escapar, num, formatoHoras, formatoRitmo, formatoDuracion, aMinutos, deMinutos, dos, idUnico, diaSemana, el } from '../util.js';

const PESTANAS = [
  { id: 'plan', nombre: 'Plan del día' },
  { id: 'sueno', nombre: 'Sueño' },
  { id: 'ruta', nombre: 'Ruta' },
  { id: 'ejercicio', nombre: 'Calentamiento y ejercicio' },
  { id: 'comidas', nombre: 'Comida, medidas y notas' },
  { id: 'medidas', nombre: 'Medidas y notas' },
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
  const rutaVisible=PU.actividades?.includes('ruta') || Object.values(PU.semana||{}).some(d=>d.ruta?.activa);
  const vista = cont;
  cont = document.createElement('div');
  cont.className = 'dia-minimal';
  vista.innerHTML = '';
  vista.appendChild(cont);

  cont.innerHTML = `
    <div class="cabecera">
      <button class="boton icono" data-accion="volver" title="Volver al calendario">${I.calendario}</button>
      <button class="boton icono" data-accion="anterior" title="Día anterior">${I.izquierda}</button>
      <button class="boton icono" data-accion="siguiente" title="Día siguiente">${I.derecha}</button>
      <div class="titulo">
        <h1>${fechaLarga(fecha)}${fecha === hoy ? ' <span class="estado-pill ok" style="vertical-align:middle;font-size:.45em">HOY</span>' : ''}</h1>

      </div>
      ${fecha !== hoy ? '<button class="boton" data-accion="hoy">Ir a hoy</button>' : ''}
    </div>
    <div class="dia-paneles secciones-grid">
      ${rutaVisible ? `<div class="panel-pestana" data-panel="ruta">${seccionRuta(d, plan)}</div>` : ''}
      <div class="panel-pestana" data-panel="ejercicio">${seccionComplemento(d, plan)}</div>
      <div class="panel-pestana" data-panel="comidas"><div class="registro-cotidiano"><div class="registro-alimentacion">${seccionComidas(d, plan, fecha)}${seccionAyuno(d, plan, fecha)}</div><div class="registro-personal">${seccionMedidas(d, fecha)}${seccionNotas(d)}</div></div></div>
      <div class="panel-pestana" data-panel="plan"><div class="plan-sueno"><div>${tarjetaPlan(plan,d,fecha===hoy)}</div><div class="sueno-compacto">${seccionSueno(d)}</div></div></div>
    </div>`;

  const detalles = {plan:['',I.plan],sueno:['',I.sueno],ruta:['',I.rutas],ejercicio:['',I.comp],comidas:['',I.comida],medidas:['',I.balanza]};
  cont.querySelectorAll('.panel-pestana').forEach(panel=>{
    const id=panel.dataset.panel, opcion=PESTANAS.find(t=>t.id===id);
    const caja=document.createElement('div');
    caja.innerHTML=tarjetaSeccion(id,opcion.nombre,detalles[id][0],detalles[id][1],'',pestanaActual===id?'open':'');
    const tarjeta=caja.firstElementChild;
    if(id==='ejercicio')tarjeta.classList.add('seccion-entrenar');
    const resumen=tarjeta.querySelector('summary');resumen.dataset.pestana=id;
    resumen.querySelector('.seccion-titulo').insertAdjacentHTML('beforeend',`<span class="punto" data-punto="${id}"></span>`);
    panel.before(tarjeta);tarjeta.querySelector('.seccion-contenido').appendChild(panel);
    tarjeta.addEventListener('toggle',()=>{if(tarjeta.open)pestanaActual=id;else {if(pestanaActual===id)pestanaActual=null;if(id==='ejercicio')cont.querySelector('[data-temporizador]')?.dispatchEvent(new Event('pausar-rutina'));}});
  });
  conectarTarjetas(cont);
  alSalir(conectarHoras(cont));
  alSalir(conectarOrdenComidas(cont,ids=>{const dia=diaEditable(fecha);dia.comidas=reordenarComidas(comidasVisibles(dia),ids);diaCambiado(fecha);}));
  const tipoRutina = d.complemento?.tipo || plan.complemento?.tipo || 'estiramientos';
  montarTemporizador(cont.querySelector('[data-temporizador]'), {
    rutina: rutinaDe(tipoRutina, PU), ejercicios: ejerciciosDe(tipoRutina, plan.semana, PU),
    ajustes:d.preparacion||PU.semana[plan.ds]?.preparacion||null,
    actividades:PU.actividades||[],
    alEditar:p=>{diaEditable(fecha).preparacion=p;diaCambiado(fecha);const programa=cont.querySelector('.plan-dia');if(programa)programa.outerHTML=tarjetaPlan(plan,diaDe(fecha),fecha===hoy);},
    perfil: estado.carpeta || estado.perfil?.nombre || '', fecha, tipo: tipoRutina,
    alComenzar: (instante,datos) => registrarHoraRutina('inicio', instante,null,datos),
    alTerminar: (instante, inicio, datos) => registrarHoraRutina('fin', instante, inicio,datos),
  });

  function registrarHoraRutina(campo,instante,inicio,datos={}) {
    const dia=diaEditable(fecha),cal=datos.modo==='calentamiento';
    if(!cal)prepararDefectos(dia,'complemento.x',plan);
    const destino=cal?(dia.calentamientoSesion||={}):dia.complemento;
    const momento=new Date(instante);destino[campo]=`${dos(momento.getHours())}:${dos(momento.getMinutes())}`;destino[campo+'ISO']=momento.toISOString();
    if(campo==='inicio'){delete destino.fin;delete destino.finISO;}
    if(campo==='fin'){destino.duracion=Math.round((datos.activoMs??instante-inicio)/6000)/10;if(datos.completa&&!cal)destino.hecho=true;}
    diaCambiado(fecha);refrescar();
  }

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
    if(accion==='agregar-item-comida'){
      const c=buscarComida(objetivo.dataset.idComida),cat=CATEGORIAS_COMIDA.find(x=>x.id===objetivo.dataset.categoria),caja=objetivo.closest('.categoria-comida');
      const nombre=caja.querySelector('select').value;if(!cat?.alimentos.includes(nombre))return;
      c.textoLibre??=c.items?.length?'':c.desc||'';c.items||=[];c.items.push({id:idUnico(),categoria:cat.id,nombre,cantidad:caja.querySelector('[data-item-cantidad]').value.trim()});actualizarDescripcion(c);diaCambiado(fecha);repintarComidas(c.id);return;
    }
    if(accion==='quitar-item-comida'){
      const c=buscarComida(objetivo.dataset.idComida);c.items=(c.items||[]).filter(x=>x.id!==objetivo.dataset.item);actualizarDescripcion(c);diaCambiado(fecha);repintarComidas(c.id);return;
    }
    if (accion === 'catalogo-agregar') {
      const id = cont.querySelector('[data-catalogo]').value;
      if (!ALIMENTOS.some(a=>a.id===id)) return;
      const dia = diaEditable(fecha);
      dia.alimentosContados = [...new Set([...(dia.alimentosContados || []), id])];
      diaCambiado(fecha); repintarComidas();
    }
    if (accion === 'guia-ampliar') abrirGuia(objetivo.dataset.rutina);
    if (accion === 'agregar-comida') agregarComida({tipo:objetivo.dataset.tipo});
    if (accion === 'configurar-ayuno') {const dia=diaEditable(fecha);(dia.ayuno||={}).activo=true;diaCambiado(fecha);const caja=cont.querySelector('[data-ayuno-config]');caja.hidden=false;caja.open=true;cont.querySelector('.anadir-comida').open=false;caja.querySelector('input')?.focus();}
    if(accion==='desactivar-ayuno'){const dia=diaEditable(fecha);(dia.ayuno||={}).activo=false;diaCambiado(fecha);cont.querySelector('[data-ayuno-config]').hidden=true;}
    if (accion === 'guardar-comida') {
      const c=buscarComida(objetivo.dataset.idComida);if(!c)return;guardarComida(c);
      const rol=c.tipo==='primera-comida'?'primera':c.tipo==='ultima-comida'?'ultima':null;
      if(rol){const dia=diaEditable(fecha);(dia.ayuno||={})[rol]=c.hora;cont.querySelector(`[data-c="ayuno.${rol}"]`).value=c.hora;}
      diaCambiado(fecha);repintarComidas(null,c.id);
    }
    if (accion === 'borrar-comida') {
      const dia = diaEditable(fecha);
      dia.comidas = comidasVisibles(dia).filter((c) => c.id !== b.dataset.idComida);
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
    const dia=diaEditable(fecha);if(!Array.isArray(dia.comidas))dia.comidas=comidasPredeterminadas();
    return dia.comidas.find(c=>c.id===id);
  }

  function cambiarComida(t) {
    const c = buscarComida(t.dataset.comida);
    if (!c) return;
    const k = t.dataset.k;
    let v = t.value;
    if (k === 'kcal') v = aNumero(v);
    if (k === 'hora') c.horaManual=!!v;
    if (v === '' || v == null) delete c[k]; else c[k] = v;
    if(k==='textoLibre')actualizarDescripcion(c);
    if(k==='tipo')t.closest('.comida').querySelector('summary b').textContent=TIPOS_COMIDA.find(x=>x.id===c.tipo)?.nombre||'Comida';
    diaCambiado(fecha);
    if (k === 'hora') {
      const fila = t.closest('.comida');fila.querySelector('summary small').textContent=c.hora||'';
      const fuera = diaDe(fecha).ayuno?.activo===true && plan.ayuno && fueraDeVentana(c.hora, plan.ayuno.ventana, diaDe(fecha).ayuno?.guineoAntes);
      fila.classList.toggle('fuera-ventana', !!fuera);
      fila.querySelector('.aviso-ventana')?.classList.toggle('oculto', !fuera);
    }
    refrescar();
  }

  function agregarComida(datos) {
    const dia = diaEditable(fecha);
    dia.comidas = comidasVisibles(dia);
    const tipo = datos.tipo || 'intermedia';
    const nuevaId=idUnico();
    dia.comidas.push({ id: nuevaId, tipo, hora: '', borrador:true, etiquetas: [], ...datos, tipo });
    diaCambiado(fecha);
    repintarComidas(nuevaId);
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

  function repintarComidas(abrirId=null,cerrarId=null) {
    const viejo = cont.querySelector('#sec-comidas');
    const abiertas=[...viejo.querySelectorAll('details.comida[open]')].map(x=>x.dataset.comidaId);if(abrirId)abiertas.push(abrirId);
    viejo.outerHTML = seccionComidas(diaDe(fecha), plan, fecha);
    cont.querySelectorAll('details.comida').forEach(x=>{x.open=x.dataset.comidaId!==cerrarId&&abiertas.includes(x.dataset.comidaId);});
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

  }

  // Cuenta regresiva de la ventana de comida (solo hoy)
  if (fecha === hoy) {
    const caja = cont.querySelector('#cuenta-regresiva');
    const tick = () => pintarCuentaRegresiva(cont.querySelector('#cuenta-regresiva'), plan, fecha);
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
  const input = tipo==='hora'?campoHora(valor,`data-c="${camino}" data-t="hora"`,etiqueta):`<input type="${tipoInput}" data-c="${camino}" data-t="${tipo}" value="${escapar(valor)}" placeholder="${escapar(ph)}" ${tipo === 'num' ? 'inputmode="decimal"' : ''}>`;
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
function plegable(titulo, contenido, abierto = false) {
  return `<details class="card-plegable" ${abierto ? 'open' : ''}><summary>${titulo}</summary><div class="card-contenido">${contenido}</div></details>`;
}

// ---------- Secciones ----------
function seccionSueno(d) {
  return `<section class="tarjeta">
    ${cabecera('Sueño', I.sueno, '--c-sueno', '<span data-calc="sueno-estado"></span>')}
    <div class="campos">
      ${campo('Me dormí', 'sueno.dormir', d, { tipo: 'hora' })}
      ${campo('Me desperté', 'sueno.despertar', d, { tipo: 'hora' })}
      <label class="campo"><span>Calidad del sueño</span>${escala('sueno.calidad', d, 5, ['Muy mala', 'Mala', 'Normal', 'Buena', 'Excelente'])}</label>
    </div>
    <div class="resultado"><div><b data-calc="sueno">—</b><small>horas dormidas (meta ${num(PU.metas.suenoHoras, 1)} h)</small></div></div>
  </section>`;
}

function seccionAyuno(d,plan,fecha){
 const activo=d.ayuno?.activo===true;
 return `<details class="tarjeta ayuno-simple" data-ayuno-config ${activo?'':'hidden'}><summary>Ayuno</summary><div class="horas-comida">
 ${campo('Primera comida','ayuno.primera',d,{tipo:'hora'})}${campo('Última comida','ayuno.ultima',d,{tipo:'hora'})}</div>
 ${fecha===hoyISO()?'<div id="cuenta-regresiva" class="ayuno-contador"></div>':''}
 <details class="desplegable"><summary>Qué puedo tomar en ayuno</summary><ul>${DURANTE_AYUNO.map(x=>`<li>${x}</li>`).join('')}</ul></details>
 <button type="button" class="boton fantasma" data-accion="desactivar-ayuno">Quitar ayuno de este día</button></details>
 <section class="tarjeta agua-registro"><div class="contador agua-simple"><span>Agua</span><button type="button" class="boton" data-sumar="agua" data-paso="-1">−</button><span class="valor">${d.agua||0}</span><button type="button" class="boton" data-sumar="agua" data-paso="1">+</button><small>vasos</small></div></section>`;
}

function seccionComidas(d,plan,fecha){
 return `<section class="tarjeta" id="sec-comidas"><details class="anadir-comida"><summary class="boton">${I.mas} Añadir comida</summary><div class="menu-comidas"><button type="button" data-accion="configurar-ayuno">Ayuno</button>${[...TIPOS_COMIDA].sort((a,b)=>['primera','almuerzo','merienda','cena','intermedia','primera-comida','ultima-comida'].indexOf(a.id)-['primera','almuerzo','merienda','cena','intermedia','primera-comida','ultima-comida'].indexOf(b.id)).map(t=>`<button type="button" data-accion="agregar-comida" data-tipo="${t.id}">${t.nombre}</button>`).join('')}</div></details><div class="lista-comidas">${comidasVisibles(d).map(c=>`<details class="comida comida-nueva" data-comida-id="${escapar(c.id)}"><summary><button type="button" class="comida-agarre" data-arrastrar-comida aria-label="Reordenar comida" title="Arrastra para reordenar; usa las flechas arriba y abajo con el teclado">${iconoArrastrar}</button><b>${escapar(TIPOS_COMIDA.find(t=>t.id===c.tipo)?.nombre||'Comida')}</b><small>${escapar(c.hora||'')}</small><button type="button" class="boton icono fantasma" data-accion="borrar-comida" data-id-comida="${escapar(c.id)}" aria-label="Eliminar comida">${I.basura}</button></summary>
 <div class="comida-edicion"><label class="campo"><span>Comida</span><select data-comida="${escapar(c.id)}" data-k="tipo">${TIPOS_COMIDA.map(t=>`<option value="${t.id}" ${t.id===c.tipo?'selected':''}>${t.nombre}</option>`).join('')}</select></label>
 <label class="campo"><span>Hora</span>${campoHora(c.hora,`data-comida="${escapar(c.id)}" data-k="hora"`,'Hora de comida')}</label>
 <label class="campo"><span>Calorías</span><input inputmode="decimal" data-comida="${escapar(c.id)}" data-k="kcal" value="${c.kcal??''}"></label></div>
 ${selectorAlimentos(c)}<label class="campo comida-libre"><span>Otro alimento o detalle</span><input type="text" data-comida="${escapar(c.id)}" data-k="textoLibre" value="${escapar(c.textoLibre??(!c.items?.length?c.desc||'':''))}"></label><div class="comida-guardar"><button type="button" class="boton comenzar-verde" data-accion="guardar-comida" data-id-comida="${escapar(c.id)}">Guardar</button></div></details>`).join('')}</div>
 </section>`;
}

function seccionRuta(d, plan) {
  const r = d.ruta || {};
  const terreno = r.terreno || plan.ruta?.terreno || 'montana';
  const opcionesRutas = [{ id: '', nombre: '— Sin ruta guardada —' }, ...estado.rutas.map((x) => ({ id: x.id, nombre: `${x.nombre} (${x.terreno === 'plano' ? 'plano' : x.terreno === 'mixto' ? 'mixto' : 'montaña'})` }))];
  const rpe = ['Muy fácil', 'Fácil', 'Fácil', 'Moderado', 'Moderado', 'Algo duro', 'Duro', 'Muy duro', 'Máximo casi', 'Máximo'];
  return `<section class="tarjeta">
    ${cabecera(plan.descanso ? 'Ruta (opcional hoy: descanso)' : 'Ruta', I.ruta, '--c-ruta', '<span data-calc="ruta-estado"></span>')}
    <div class="ruta-campos">
      ${seleccion('Ruta', 'ruta.rutaId', d, opcionesRutas, r.rutaId ?? '')}
      ${seleccion('Tipo de sesión', 'ruta.tipo', d, TIPOS_SESION, plan.ruta?.tipo || 'ligera')}
      ${campo('Hora de salida', 'ruta.salida', d, { tipo: 'hora' })}
      ${campo('Hora de llegada', 'ruta.llegada', d, { tipo: 'hora' })}
      ${campo('Distancia', 'ruta.distancia', d, { tipo: 'num', unidad: 'km' })}
      ${campo('Calorías quemadas', 'ruta.kcal', d, { tipo: 'num', unidad: 'kcal' })}
    </div>
    <div class="ruta-calificacion">
      <label class="campo ruta-esfuerzo"><span>Esfuerzo (1–10)</span>${escala('ruta.rpe', d, 10, rpe)}</label>
      ${seleccion('Molestia', 'ruta.molestiaZona', d, [{ id: 'ninguna', nombre: 'Ninguna' }, ...ZONAS_MOLESTIA.map(z=>({id:z,nombre:z}))], 'ninguna')}
    </div>
  </section>`;
}

function guiaEjercicios(ejercicios,tipo){
 return `<details class="guia-rutina" data-guia-ejercicios><summary>Guía ilustrada de ejercicios</summary><div class="guia-ejercicios">${ejercicios.map(e=>`<article><b>${escapar(e.nombre)}</b>${figuraReloj({...e,ejercicioId:e.id},tipo,ejercicios)}</article>`).join('')}</div></details>`;
}
function seccionComplemento(d,plan){
 if(!plan.complemento&&!d.complemento&&!d.preparacion)return '<section class="tarjeta"><p class="suave">Descanso</p></section>';
 const tipo=d.complemento?.tipo||plan.complemento?.tipo||'estiramientos',ejercicios=d.preparacion?.ejercicios||ejerciciosDe(tipo,plan.semana,PU);
 return `<section class="tarjeta"><div data-temporizador></div></section>`;
}

function bloqueSeries(titulo, ejercicios, registro, formato = '', tipo, todos = ejercicios) {
  if (!ejercicios.length) return '';
  return `<h3 class="ej-grupo">${titulo}${formato ? ` <span class="suave" style="text-transform:none;letter-spacing:0;font-weight:500">· ${formato}</span>` : ''}</h3>
    <div class="series-cards">${ejercicios.map((e) => filaSeries(e, registro[e.id] || [], tipo, todos)).join('')}</div>`;
}

function filaSeries(e, valores, tipo, todos) {
  const n = Math.max(e.series, valores.length);
  const llenas = valores.filter((v) => Number(v) > 0).length;
  const unidad = e.unidad === 's' ? 's' : 'reps';
  return `<div class="serie-fila ${llenas >= e.series ? 'hecho' : ''}" data-fila="${e.id}">
    <div class="serie-ilustracion">${figuraReloj({ ...e, ejercicioId:e.id }, tipo, todos)}</div>
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
    ${cabecera('Medidas', I.balanza, '--g-peso')}

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
    <textarea data-c="notas" placeholder="Notas del día">${escapar(d.notas || '')}</textarea>
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
function tarjetaPlan(plan,d,esHoy){
 if(plan.antesDelPlan)return `<section class="tarjeta plan-dia"><p>Inicio: ${fechaLarga(contexto().inicio)}</p></section>`;
 const r=plan.ruta,c=plan.complemento,tipo=d.complemento?.tipo||c?.tipo;
 const ruta=estado.rutas.find(x=>x.id===d.ruta?.rutaId);
 return `<section class="tarjeta plan-dia">${r?`<div class="plan-bloque"><h3>Ruta</h3><b>${escapar(ruta?.nombre||r.titulo)}</b><p class="suave pequeño">${escapar(r.intervalo||r.detalle||'')}${r.metaKm?` · ${num(r.metaKm,1)} km`:''}</p></div>`:''}
 ${c?`<div class="plan-bloque"><h3>Ejercicios</h3>${resumenRutina(rutinaDe(tipo,PU),ejerciciosDe(tipo,plan.semana,PU),d.preparacion||PU.semana[plan.ds]?.preparacion)}</div>`:'<p>Descanso</p>'}</section>`;
}

function pintarCuentaRegresiva(caja,plan,fecha){
 if(!caja)return;const ahora=new Date(),a=diaDe(fecha).ayuno||{};if(a.activo!==true){caja.innerHTML='';return;}
 const cuenta=contadorAyuno(ahora.getHours()*3600+ahora.getMinutes()*60+ahora.getSeconds(),a.primera||plan.ayuno?.ventana?.[0]||'',a.ultima||plan.ayuno?.ventana?.[1]||'');
 if(!cuenta){caja.innerHTML='<span>Indica dos horarios distintos.</span>';return;}
 const t=cuenta.segundos,tiempo=`${Math.floor(t/3600)}:${dos(Math.floor(t%3600/60))}:${dos(t%60)}`;
 caja.innerHTML=`<span>${cuenta.titulo}</span><strong>${tiempo}</strong>`;
}
