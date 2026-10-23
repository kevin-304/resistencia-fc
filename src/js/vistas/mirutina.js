import { contexto } from '../estado.js';
import { planDelDia, planEnFecha, normalizarPlan, rutinaDe, ejerciciosDe } from '../plan.js';
import { navegar } from '../nav.js';
import { hoyISO, lunesDe, sumarDias, diaSemana, DIAS, escapar } from '../util.js';
import { tarjetaGuia, abrirGuia } from '../guias-rutina.js';
import { figuraReloj } from '../figura-reloj.js';

export function mostrarMiRutina(cont) {
  const ctx = contexto();
  const lunes = lunesDe(hoyISO());
  let elegido = diaSemana(hoyISO());
  const orden = [1,2,3,4,5,6,0];
  cont.innerHTML = `<div class="cabecera mi-rutina-cab"><div class="titulo"><h1>Mi rutina</h1><p>Tu semana, día por día.</p></div><button class="boton" data-editar-plan>Editar mi plan</button></div>
    <div class="rutina-dias" role="tablist" aria-label="Días de mi rutina">${orden.map(ds=>`<button class="boton" id="rutina-dia-${ds}" role="tab" data-dia="${ds}" aria-controls="rutina-dia-panel">${DIAS[ds]}</button>`).join('')}</div>
    <section id="rutina-dia-panel" role="tabpanel" class="rutina-dia-panel"></section>`;
  const panel = cont.querySelector('#rutina-dia-panel');
  function seleccionar(ds) {
    elegido = ds;
    const fecha = sumarDias(lunes, ds === 0 ? 6 : ds-1);
    const pu = normalizarPlan(planEnFecha(ctx.plan, fecha));
    const plan = planDelDia(fecha, ctx.inicio, ctx.terreno, ctx.rutaPrincipal, pu);
    const tipo = pu.semana[ds]?.complemento;
    const rutina = rutinaDe(tipo, pu);
    const ejercicios = ejerciciosDe(tipo, plan.semana, pu);
    cont.querySelectorAll('[data-dia]').forEach(b=>{const activo=Number(b.dataset.dia)===ds;b.classList.toggle('activo',activo);b.setAttribute('aria-selected',activo);b.tabIndex=activo?0:-1;});
    panel.setAttribute('aria-labelledby',`rutina-dia-${ds}`);
    panel.innerHTML = `<div class="rutina-resumen tarjeta"><div><span class="suave pequeño">${DIAS[ds]}</span><h2>${escapar(rutina?.nombre || 'Recuperación / sin ejercicios programados')}</h2><p class="suave pequeño">${ejercicios.length} ejercicios${rutina?.bloquesMinutos ? ' · Incluye calentamiento y vuelta a la calma' : ''}</p></div><button class="boton comenzar-verde" data-abrir-dia>${fecha===hoyISO()?'Entrenar hoy':'Abrir este día'}</button></div>
      ${rutina?.formato?`<details class="card-plegable"><summary>Indicaciones y tiempos</summary><p class="card-contenido suave pequeño">${escapar(rutina.formato)}</p></details>`:''}
      ${plan.ruta ? `<details class="card-plegable"><summary>Ruta · ${escapar(plan.ruta.titulo)}</summary><div class="card-contenido suave">${escapar(plan.ruta.detalle || 'Consulta y registra tu salida en el día correspondiente.')}</div></details>`:''}
      ${tarjetaGuia(tipo)}
      ${ejercicios.length ? `<div class="rutina-ejercicios">${ejercicios.map((e,i)=>`<details class="rutina-ejercicio card-plegable"><summary><span class="rutina-numero">${i+1}</span><span>${escapar(e.nombre)}<small>${escapar(e.meta)}</small></span></summary><div class="card-contenido"><div class="rutina-figura">${figuraReloj({...e,ejercicioId:e.id},tipo,ejercicios)}</div>${e.nota?`<p class="suave">${escapar(e.nota)}</p>`:''}</div></details>`).join('')}</div>`:'<p class="tarjeta suave">Este día no tiene ejercicios asignados. Puedes descansar o configurar tu semana en Mi plan.</p>'}`;
    panel.querySelector('[data-abrir-dia]').addEventListener('click',()=>navegar({vista:'dia',fecha}));
    panel.querySelector('[data-accion="guia-ampliar"]')?.addEventListener('click',()=>abrirGuia(tipo));
    panel.querySelector('.guia-miniatura')?.addEventListener('click',()=>abrirGuia(tipo));
  }
  cont.querySelectorAll('[data-dia]').forEach(b=>{
    b.addEventListener('click',()=>seleccionar(Number(b.dataset.dia)));
    b.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const indice=orden.indexOf(elegido);
      const ds=e.key==='Home'?1:e.key==='End'?0:orden[(indice+(e.key==='ArrowRight'?1:6))%7];
      seleccionar(ds);cont.querySelector(`[data-dia="${ds}"]`).focus();
    });
  });
  cont.querySelector('[data-editar-plan]').addEventListener('click',()=>navegar('miplan'));
  seleccionar(elegido);
}
