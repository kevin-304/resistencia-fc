import {normalizarProgramacion,rutinaVigente} from '../programacion-rutinas.js';
import {panelProgramacion,conectarProgramacion} from '../selector-rutinas.js';
import {iconoActividad} from '../iconos-actividades.js';
import {bloquesDia,aplicarBloques,nombreActividad} from '../bloques-actividad.js';
import {conectarOrdenComidas} from '../orden-comidas.js';
import {iconoArrastrar} from '../iconos-alimentos.js';
import {alSalir} from '../nav.js';
import {estado,contexto,guardarConfig} from '../estado.js';
import {normalizarPlan,ACTIVIDADES,TIPOS_SESION} from '../plan.js';
import {montarPreparacion} from '../editor-sesion.js';
import {ORDEN_SEMANA,entrenaDia,prepararSemana,preparacionSemanal,guardarDiaSemanal,marcarDia,elegirActividades} from '../semana-editable.js';
import {tarjetaSeccion,conectarTarjetas} from '../tarjetas.js';
import {hoyISO,DIAS,escapar} from '../util.js';
import {I} from '../iconos.js';

export function mostrarMiRutina(cont,opciones={}){
 const ctx=contexto(),hoy=hoyISO(),programacion=normalizarProgramacion(estado.config,estado.perfil,hoy);
 const seleccion=programacion.rutinas.find(r=>r.id===(opciones.rutinaId||programacion.seleccionada))||programacion.rutinas.find(r=>r.id===rutinaVigente(programacion,hoy)?.id)||programacion.rutinas[0];
 let p=normalizarPlan(seleccion.plan);const inicioEditor=seleccion.inicio||ctx.inicio;
 if(!Array.isArray(p.actividades))p.actividades=Object.values(p.semana).some(d=>d.ruta.activa)?['ruta','cardio']:[];
 // El plan histórico de Kevin combina circuitos con movimientos de peso corporal.
 if(/^kevin\b/i.test(estado.perfil?.nombre||'')&&p.actividades.every(a=>['ruta','casa','cardio'].includes(a))&&p.actividades.includes('cardio'))p.actividades=['ruta','cardio'];
 p=prepararSemana(p,hoy>inicioEditor?hoy:inicioEditor);
 const abiertas=new Set();
 const guardar=()=>{seleccion.plan=p;programacion.seleccionada=seleccion.id;estado.config.programacionRutinas=programacion;guardarConfig();};
 function render(){
  cont.innerHTML=`<div class="cabecera"><div class="titulo"><h1>Mi rutina</h1></div></div>
   ${panelProgramacion(programacion,seleccion,hoy)}<section class="tarjeta semana-config"><h2>Actividades</h2><div class="semana-actividades">${ACTIVIDADES.map(a=>`<label class="semana-opcion"><input type="checkbox" data-actividad="${a.id}" ${p.actividades.includes(a.id)?'checked':''}>${iconoActividad(a.id,estado.perfil?.sexo)}<span>${escapar(a.nombre)}</span></label>`).join('')}</div></section>
   <section class="tarjeta semana-config"><h2>Días de entrenamiento</h2><p class="suave pequeño">Marca los días que vas a hacer ejercicio; deja vacíos los de descanso.</p><div class="semana-dias">${ORDEN_SEMANA.map(ds=>`<label class="semana-opcion"><input type="checkbox" data-entrena="${ds}" ${entrenaDia(p.semana[ds])?'checked':''}><span>${DIAS[ds]}</span></label>`).join('')}</div></section>
   <div class="secciones-grid rutina-semana">${ORDEN_SEMANA.filter(ds=>entrenaDia(p.semana[ds])).map(ds=>tarjetaSeccion(String(ds),DIAS[ds],entrenaDia(p.semana[ds])?'Editar ejercicios':'Descanso',I.comp,`<div data-editor-semana="${ds}"></div>`,abiertas.has(ds)?'open':'')).join('')}</div>`;
  conectarProgramacion(cont,{programacion,r:seleccion,alGuardar:guardar,alSeleccionar:id=>{estado.config.programacionRutinas=programacion;programacion.seleccionada=id;guardarConfig();mostrarMiRutina(cont,{rutinaId:id});}});
  cont.querySelectorAll('[data-actividad]').forEach(i=>i.addEventListener('change',()=>{const elegidas=[...cont.querySelectorAll('[data-actividad]:checked')].map(x=>x.dataset.actividad);elegirActividades(p,elegidas);for(const ds of ORDEN_SEMANA.filter(ds=>entrenaDia(p.semana[ds]))){const {base}=bloquesDia(p,ds,hoy,inicioEditor);aplicarBloques(p,ds,base);}guardar();render();}));
  cont.querySelectorAll('[data-entrena]').forEach(i=>i.addEventListener('change',()=>{marcarDia(p,Number(i.dataset.entrena),i.checked);guardar();render();}));
  for(const ds of ORDEN_SEMANA){
   const tarjeta=cont.querySelector(`[data-seccion="${ds}"]`);if(!tarjeta)continue;let cargada=false;
   const dibujar=()=>{if(cargada)return;cargada=true;const panel=tarjeta.querySelector('[data-editor-semana]'),d=p.semana[ds];
    if(!entrenaDia(d)){panel.innerHTML='<p class="suave">Descanso</p>';return;}
    const {base,orden}=bloquesDia(p,ds,hoy,inicioEditor);
    panel.innerHTML=`<p class="suave pequeño">Arrastra las actividades para cambiar su orden.</p><div class="bloques-actividades">${orden.map(id=>`<details class="bloque-actividad" data-bloque-id="${id}"><summary><button type="button" class="comida-agarre" data-arrastrar-bloque aria-label="Reordenar actividad">${iconoArrastrar}</button>${iconoActividad(id==='calentamiento'||id==='enfriamiento'?'movilidad':id,estado.perfil?.sexo)}<b>${escapar(nombreActividad(id))}</b></summary><div data-bloque-editor="${id}"></div></details>`).join('')}</div>`;
    const actualizar=()=>{aplicarBloques(p,ds,base);guardar();};
    for(const id of orden){const caja=panel.querySelector(`[data-bloque-editor="${id}"]`);
     if(id==='ruta'){
      caja.innerHTML=`<div class="semana-ruta"><label class="check"><input type="checkbox" data-ruta-semana ${d.ruta.activa?'checked':''}>Ruta activa</label><label class="campo"><span>Tipo de sesión</span><select data-tipo-ruta>${TIPOS_SESION.map(t=>`<option value="${t.id}" ${t.id===d.ruta.tipo?'selected':''}>${escapar(t.nombre)}</option>`).join('')}</select></label></div>`;
      caja.querySelector('[data-ruta-semana]').onchange=e=>{d.ruta.activa=e.target.checked;guardar();};caja.querySelector('[data-tipo-ruta]').onchange=e=>{d.ruta.tipo=e.target.value;guardar();};continue;
     }
     const movilidad=['calentamiento','enfriamiento'].includes(id),grupo=movilidad?id:'ejercicios';
     montarPreparacion(caja,{modo:'bloque',rutina:null,ejercicios:[],ajustes:{calentamiento:base.calentamiento,enfriamiento:base.enfriamiento,ejercicios:movilidad?[]:d.actividadesDia[id]},grupos:[grupo],editarAlInicio:true,controlesExternos:true,actividades:movilidad?['movilidad']:[id],
      alCambiar:preparacion=>{if(movilidad)base[id]=preparacion[id];else d.actividadesDia[id]=preparacion.ejercicios;actualizar();}});
    }
    alSalir(conectarOrdenComidas(panel,ids=>{d.ordenActividades=ids;actualizar();},{asaSelector:'[data-arrastrar-bloque]',filaSelector:'.bloque-actividad',idClave:'bloqueId'}));
   };
   tarjeta.addEventListener('toggle',()=>{if(tarjeta.open){abiertas.add(ds);dibujar();}else abiertas.delete(ds);});if(tarjeta.open)dibujar();
  }
  conectarTarjetas(cont);
 }
 render();
}
