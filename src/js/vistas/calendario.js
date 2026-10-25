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
  partes.push(marca('c-sueno', est(m.suenoOk), I.sueno, 'Sueño (meta de horas)'));
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
      <div class="cal-selector"><h1><button type="button" class="cal-titulo" aria-expanded="false">${MESES[mes - 1]} ${anio}</button></h1><div class="cal-periodos" hidden></div></div>
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
      <span><i style="background:var(--c-sueno)"></i>Sueño cumplido</span>
      <span><i style="border:1.5px dashed var(--texto-suave)"></i>A medias</span>
      <span><i style="border:1.5px solid var(--peligro)"></i>No cumplido</span>
    </div>
    ${r ? resumenMes(r, ctx) : ''}
  `;

  conectarPeriodos(cont, anio, mes);

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
  else textoPlan = (p.complemento?.nombre || p.ruta?.titulo || '').replace(/^(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[·:–-]\s*/i,'').replace(/\s*[·–-]\s*\d+\s*min.*$/i,'').trim();

  const d = deISO(fecha);
  return `<button class="${clases.join(' ')}" data-fecha="${fecha}">
    <div class="c-top"><span class="c-num">${d.getDate()}</span></div>
    <div class="c-plan">${escapar(textoPlan)}</div>
    
    ${p.antesDelPlan && !m.registrado ? '' : `<div class="c-marcas">${marcasDia(m)}</div>`}
  </button>`;
}

function resumenMes(r, ctx) {
  const item = (et, val, nota = '') => `<div class="kpi"><span class="etiqueta">${et}</span><span class="valor">${val}</span>${nota ? `<span class="nota">${nota}</span>` : ''}</div>`;
  return `<div class="tarjeta resumen-mes">
    <div class="tarjeta-cab"><h2>Resumen del mes (hasta hoy)</h2></div>
    <div class="rejilla rejilla-4">
      ${item('Días cumplidos', `${r.diasCumplidos}<small>/ ${r.diasEntreno}</small>`, 'ruta + ayuno + complemento')}
      ${item('Kilómetros', `${num(r.km, 1)}<small>km</small>`, `${num(r.kmEsf, 1)} km-esfuerzo`)}
      ${item('Sueño promedio', r.sueno != null ? `${num(r.sueno, 1)}<small>h</small>` : '—', `${r.diasSuenoOk} noches con tu meta de sueño`)}
      ${item('Comidas registradas', `${r.comidasTotal}<small>comidas</small>`, ctx.plan.alimentos.slice(0, 3).map((a) => `${r.alimentos[a.id] || 0} ${escapar(a.nombre.toLowerCase())}`).join(' · '))}
    </div>
  </div>`;
}

// Navegación progresiva: mes → meses → años. El desplazamiento conserva filas.
function conectarPeriodos(cont, anio, mes) {
  const titulo = cont.querySelector('.cal-titulo');
  const panel = cont.querySelector('.cal-periodos');
  let nivel = 0;
  function abrir() {
    panel.hidden = false;
    titulo.setAttribute('aria-expanded', 'true');
    titulo.textContent = String(anio);
    const inicio = Math.max(100, anio - 60), fin = Math.min(9900, anio + 60);
    panel.innerHTML = nivel === 1
      ? Array.from({length:fin-inicio+1},(_,i)=>{const a=inicio+i;return `<section data-periodo="${a}"><h2>${a}</h2><div class="cal-opciones">${MESES.map((nombre,m)=>`<button type="button" data-mes="${a}-${String(m+1).padStart(2,'0')}" ${a===anio&&m===mes-1?'aria-current="date"':''}>${nombre}</button>`).join('')}</div></section>`;}).join('')
      : `<div class="cal-opciones cal-anios">${Array.from({length:fin-inicio+1},(_,i)=>`<button type="button" data-anio="${inicio+i}" ${inicio+i===anio?'aria-current="date"':''}>${inicio+i}</button>`).join('')}</div>`;
    panel.querySelectorAll('[data-mes]').forEach(b=>b.onclick=()=>{mesVisible=b.dataset.mes;mostrarCalendario(cont);});
    panel.querySelectorAll('[data-anio]').forEach(b=>b.onclick=()=>{anio=Number(b.dataset.anio);nivel=1;abrir();});
    const seleccionado = nivel===1 ? panel.querySelector(`[data-periodo="${anio}"]`) : panel.querySelector(`[data-anio="${anio}"]`);
    panel.scrollTop = seleccionado.offsetTop - panel.firstElementChild.offsetTop;
  }
  titulo.onclick=()=>{nivel=nivel===0?1:nivel===1?2:1;abrir();};
  panel.onwheel=e=>{
    if(e.ctrlKey)return;
    e.preventDefault();
    panel.scrollBy({top:Math.sign(e.deltaY)*64,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  cont.addEventListener('click',e=>{if(!e.target.closest('.cal-selector'))cerrar();});
  titulo.onkeydown=panel.onkeydown=e=>{if(e.key==='Escape'){cerrar();titulo.focus();}};
  function cerrar(){nivel=0;panel.hidden=true;titulo.textContent=`${MESES[mes-1]} ${mesVisible.slice(0,4)}`;titulo.setAttribute('aria-expanded','false');}
}
