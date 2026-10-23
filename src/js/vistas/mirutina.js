import { contexto } from '../estado.js';
import { planDelDia, planEnFecha, normalizarPlan, rutinaDe, ejerciciosDe } from '../plan.js';
import { navegar } from '../nav.js';
import { hoyISO, lunesDe, sumarDias, DIAS, escapar } from '../util.js';
import { tarjetaGuia, abrirGuia } from '../guias-rutina.js';
import { figuraReloj } from '../figura-reloj.js';
import { tarjetaSeccion, conectarTarjetas } from '../tarjetas.js';
import { I } from '../iconos.js';

export function mostrarMiRutina(cont) {
  const ctx=contexto(), lunes=lunesDe(hoyISO());
  const dias=[1,2,3,4,5,6,0].map(ds=>{
    const fecha=sumarDias(lunes,ds===0?6:ds-1);
    const pu=normalizarPlan(planEnFecha(ctx.plan,fecha));
    const plan=planDelDia(fecha,ctx.inicio,ctx.terreno,ctx.rutaPrincipal,pu);
    const tipo=pu.semana[ds]?.complemento, rutina=rutinaDe(tipo,pu);
    return {ds,fecha,pu,plan,tipo,rutina,ejercicios:ejerciciosDe(tipo,plan.semana,pu)};
  });
  cont.innerHTML=`<div class="cabecera mi-rutina-cab"><div class="titulo"><h1>Mi rutina</h1><p>Abre un día para ver tu entrenamiento.</p></div><button class="boton" data-editar-plan>Editar mi plan</button></div>
    <div class="secciones-grid rutina-semana">${dias.map(d=>tarjetaSeccion(String(d.ds),DIAS[d.ds],d.rutina?`${d.ejercicios.length} ejercicios`:'Descanso',I.comp,`<div data-contenido-dia="${d.ds}"></div>`)).join('')}</div>`;
  for(const d of dias){
    const tarjeta=cont.querySelector(`[data-seccion="${d.ds}"]`);
    tarjeta.querySelector('summary').dataset.dia=d.ds;
    tarjeta.addEventListener('toggle',()=>{
      if(!tarjeta.open || tarjeta.dataset.cargada)return;
      tarjeta.dataset.cargada='si';
      const panel=tarjeta.querySelector('[data-contenido-dia]');
      panel.innerHTML=`<div class="rutina-resumen"><div><h2>${escapar(d.rutina?.nombre || 'Día de descanso')}</h2></div><button class="boton comenzar-verde" data-abrir-dia>${d.fecha===hoyISO()?'Entrenar hoy':'Abrir este día'}</button></div>
        ${d.rutina?.formato?`<details class="card-plegable"><summary>Indicaciones y tiempos</summary><p class="card-contenido suave pequeño">${escapar(d.rutina.formato)}</p></details>`:''}
        ${d.plan.ruta?`<details class="card-plegable"><summary>Ruta · ${escapar(d.plan.ruta.titulo)}</summary><div class="card-contenido suave pequeño">${escapar(d.plan.ruta.detalle||'Registra la salida en este día.')}</div></details>`:''}
        ${tarjetaGuia(d.tipo)}
        ${d.ejercicios.length?`<div class="rutina-ejercicios">${d.ejercicios.map((e,i)=>`<details class="rutina-ejercicio card-plegable"><summary><span class="rutina-numero">${i+1}</span><span>${escapar(e.nombre)}<small>${escapar(e.meta)}</small></span></summary><div class="card-contenido"><div class="rutina-figura">${figuraReloj({...e,ejercicioId:e.id},d.tipo,d.ejercicios)}</div>${e.nota?`<p class="suave pequeño">${escapar(e.nota)}</p>`:''}</div></details>`).join('')}</div>`:'<p class="suave">Sin ejercicios programados.</p>'}`;
      panel.querySelector('[data-abrir-dia]').addEventListener('click',()=>navegar({vista:'dia',fecha:d.fecha}));
      panel.querySelectorAll('[data-accion="guia-ampliar"]').forEach(b=>b.addEventListener('click',()=>abrirGuia(d.tipo)));
    });
  }
  conectarTarjetas(cont);
  cont.querySelector('[data-editar-plan]').addEventListener('click',()=>navegar('miplan'));
}
