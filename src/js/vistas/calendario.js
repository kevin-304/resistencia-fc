// Pantalla de inicio: calendario del mes con marcas de cumplimiento en cada día.
import { estado, contexto } from '../estado.js';
import { metricasDia, metricasRango, resumen } from '../metricas.js';
import { navegar } from '../nav.js';
import { I } from '../iconos.js';
import { hoyISO, aISO, deISO, sumarDias, lunesDe, MESES, DIAS_CORTOS, num, formatoHoras, escapar } from '../util.js';

let mesVisible = null; // "AAAA-MM" que se recuerda al volver del detalle de un día

export function marcasDia(m) {
  const marca = (clase, estadoMarca, icono, titulo) => `<span class="marca-dia ${estadoMarca}" title="${titulo}" style="${estadoMarca === 'si' ? `background:var(--${clase})` : ''}">${icono}</span>`;
  const est = (v, parcial) => (v === true ? 'si' : parcial ? 'parcial' : v === false ? 'no' : '');
  const pasado = m.fecha < hoyISO();
  const p = m.plan;
  const partes = [];
  if (p.ruta || m.rutaHecha) partes.push(marca('c-ruta', m.rutaHecha ? 'si' : pasado && p.ruta ? 'no' : '', I.ruta, 'Ruta'));
  if (p.ayuno) partes.push(marca('c-ayuno', est(m.ayunoOk), I.ayuno, 'Ayuno'));
  if (p.complemento || m.compHecho) partes.push(marca('c-comp', m.compHecho ? 'si' : m.compParcial ? 'parcial' : pasado && p.complemento ? 'no' : '', I.comp, 'Complemento'));
  partes.push(marca('c-sueno', est(m.suenoOk), I.sueno, 'Sueño ≥ 7 h'));
  return partes.join('');
}

export function mostrarCalendario(cont, params = {}) {
  const hoy = hoyISO();
  if (params.mes) mesVisible = params.mes;
  if (!mesVisible) mesVisible = hoy.slice(0, 7);
  const [anio, mes] = mesVisible.split('-').map(Number);
  const primero = aISO(new Date(anio, mes - 1, 1));
  const ultimo = aISO(new Date(anio, mes, 0));
  const desde = lunesDe(primero);
  const ctx = contexto();

  const celdas = [];
  let f = desde;
  do {
    for (let i = 0; i < 7; i++, f = sumarDias(f, 1)) celdas.push(celda(f, ctx, hoy, mesVisible));
  } while (f <= ultimo);

  const lista = metricasRango(primero, ultimo < hoy ? ultimo : hoy, estado.dias, ctx).filter((m) => !m.plan.antesDelPlan);
  const r = lista.length ? resumen(lista) : null;

  cont.innerHTML = `
    <div class="cal-cabecera">
      <button class="boton icono" data-mover="-1" title="Mes anterior">${I.izquierda}</button>
      <h1>${MESES[mes - 1]} ${anio}</h1>
      <button class="boton icono" data-mover="1" title="Mes siguiente">${I.derecha}</button>
      <button class="boton" data-hoy>Hoy</button>
      <div style="flex:1"></div>
      <button class="boton primario" data-registrar>${I.mas} Registrar hoy</button>
    </div>
    <div class="cal-dias-semana">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<div>${DIAS_CORTOS[d]}</div>`).join('')}</div>
    <div class="cal-rejilla">${celdas.join('')}</div>
    <div class="leyenda">
      <span><i style="background:var(--c-ruta)"></i>Ruta</span>
      <span><i style="background:var(--c-ayuno)"></i>Ayuno cumplido</span>
      <span><i style="background:var(--c-comp)"></i>Complemento</span>
      <span><i style="background:var(--c-sueno)"></i>Sueño ≥ 7 h</span>
      <span><i style="border:1.5px dashed var(--texto-suave)"></i>A medias</span>
      <span><i style="border:1.5px solid var(--peligro)"></i>No cumplido</span>
    </div>
    ${r ? resumenMes(r) : ''}
  `;

  cont.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => {
    const d = new Date(anio, mes - 1 + Number(b.dataset.mover), 1);
    mesVisible = aISO(d).slice(0, 7);
    mostrarCalendario(cont);
  }));
  cont.querySelector('[data-hoy]').addEventListener('click', () => { mesVisible = hoy.slice(0, 7); mostrarCalendario(cont); });
  cont.querySelector('[data-registrar]').addEventListener('click', () => navegar({ vista: 'dia', fecha: hoy }));
  cont.querySelectorAll('.celda').forEach((c) => c.addEventListener('click', () => navegar({ vista: 'dia', fecha: c.dataset.fecha })));
}

function celda(fecha, ctx, hoy, mesActual) {
  const m = metricasDia(fecha, estado.dias, ctx);
  const p = m.plan;
  const clases = ['celda'];
  if (fecha.slice(0, 7) !== mesActual) clases.push('fuera');
  if (fecha === hoy) clases.push('hoy');
  if (p.ds === 0) clases.push('domingo');
  if (p.antesDelPlan) clases.push('antes');

  let textoPlan = '';
  if (p.antesDelPlan) textoPlan = '';
  else if (p.descanso) textoPlan = 'Descanso';
  else textoPlan = p.ruta.titulo + (p.complemento ? ` · ${p.complemento.nombre}` : '');

  const datos = [];
  if (m.rutaKm) datos.push(`${num(m.rutaKm, 2)} km`);
  if (m.peso) datos.push(`${num(m.peso, 1)} kg`);
  if (m.sueno != null && !datos.length) datos.push(formatoHoras(m.sueno));

  const d = deISO(fecha);
  return `<button class="${clases.join(' ')}" data-fecha="${fecha}">
    <div class="c-top"><span class="c-num">${d.getDate()}</span>${p.ds === 1 && !p.antesDelPlan ? `<span class="c-sem">Sem ${p.semana}</span>` : ''}${fecha === ctx.inicio ? '<span class="c-sem" style="color:var(--acento)">Inicio</span>' : ''}</div>
    <div class="c-plan">${escapar(textoPlan)}</div>
    ${datos.length ? `<div class="c-datos">${datos.map((x) => `<span>${x}</span>`).join('')}</div>` : ''}
    ${p.antesDelPlan && !m.registrado ? '' : `<div class="c-marcas">${marcasDia(m)}</div>`}
  </button>`;
}

function resumenMes(r) {
  const item = (et, val, nota = '') => `<div class="kpi"><span class="etiqueta">${et}</span><span class="valor">${val}</span>${nota ? `<span class="nota">${nota}</span>` : ''}</div>`;
  return `<div class="tarjeta resumen-mes">
    <div class="tarjeta-cab"><h2>Resumen del mes (hasta hoy)</h2></div>
    <div class="rejilla rejilla-4">
      ${item('Días cumplidos', `${r.diasCumplidos}<small>/ ${r.diasEntreno}</small>`, 'ruta + ayuno + complemento')}
      ${item('Kilómetros', `${num(r.km, 1)}<small>km</small>`, `${num(r.kmEsf, 1)} km-esfuerzo`)}
      ${item('Sueño promedio', r.sueno != null ? `${num(r.sueno, 1)}<small>h</small>` : '—', `${r.diasSuenoOk} noches ≥ 7 h`)}
      ${item('Frutas', `${r.guineos}<small>guineos</small> ${r.naranjas}<small>naranjas</small>`)}
    </div>
  </div>`;
}
