import {estadoRutina,nuevaRutina,validarFechasRutina} from './programacion-rutinas.js';
import {escapar,hoyISO} from './util.js';
import {aviso} from './nav.js';
export function panelProgramacion(programacion,r,fecha=hoyISO()){
 return `<section class="tarjeta selector-rutinas"><div class="rutinas-selector-fila"><label class="campo"><span>Rutina</span><select data-elegir-rutina>${programacion.rutinas.map(x=>`<option value="${escapar(x.id)}" ${x.id===r.id?'selected':''}>Rutina: ${escapar(x.nombre)}</option>`).join('')}</select></label><button class="boton" type="button" data-nueva-semana>+ Añadir rutina</button><span class="suave pequeño">${estadoRutina(r,programacion,fecha)}</span></div>
 <details class="fechas-rutina"><summary>Fechas y meta</summary><form data-fechas-rutina><div class="campos">
 <label class="campo"><span>Rutina:</span><input name="nombre" value="${escapar(r.nombre)}" required maxlength="80"></label>
 <label class="campo"><span>Fecha de inicio</span><input type="date" name="inicio" value="${r.inicio}" required></label>
 <label class="campo"><span>Fecha de fin</span><input type="date" name="fin" value="${r.fin||''}" ${r.fin?'':'disabled'}></label>
 <label class="check"><input type="checkbox" name="sinFin" ${r.fin?'':'checked'}>Sin fecha de fin</label>
 <label class="campo"><span>Primera sesión (opcional)</span><input type="date" name="primeraSesion" value="${r.primeraSesion||''}"></label>
 <label class="campo"><span>Meta de esta rutina</span><input name="meta" value="${escapar(r.meta||'')}" placeholder="Ej. mejorar mi resistencia" maxlength="240"></label>
 </div><p class="suave pequeño">Se repite cada semana. Una rutina nueva programada sustituye a la anterior desde su fecha de inicio.</p><div class="rutinas-guardar"><button class="boton comenzar-verde" type="submit">${r.borrador?'Programar rutina':'Guardar fechas y meta'}</button><span role="status" data-error-fechas></span></div></form></details>
 <p class="pequeño suave rutina-vigencia">Desde ${r.inicio}${r.fin?' hasta '+r.fin:' · sin fecha de fin'}${r.primeraSesion?' · primera sesión '+r.primeraSesion:''}${r.meta?' · '+escapar(r.meta):''}</p></section>`;
}
export function conectarProgramacion(cont,{programacion,r,alGuardar,alSeleccionar}){
 cont.querySelector('[data-elegir-rutina]').onchange=e=>{alGuardar();programacion.seleccionada=e.target.value;alSeleccionar(e.target.value);};
 const form=cont.querySelector('[data-fechas-rutina]');form.elements.sinFin.onchange=()=>{form.elements.fin.disabled=form.elements.sinFin.checked;};
 form.onsubmit=e=>{e.preventDefault();const nombre=form.elements.nombre.value.replace(/^rutina\s*:\s*/i,'').trim(),datos={inicio:form.elements.inicio.value,fin:form.elements.sinFin.checked?null:form.elements.fin.value,primeraSesion:form.elements.primeraSesion.value||null};
  const error=!nombre?'Pon un nombre a la rutina.':!form.elements.sinFin.checked&&!datos.fin?'Elige la fecha de fin o marca «Sin fecha de fin».':validarFechasRutina(datos);if(error){cont.querySelector('[data-error-fechas]').textContent=error;return;}
  Object.assign(r,datos,{nombre,meta:form.elements.meta.value.trim(),borrador:false});alGuardar();alSeleccionar(r.id);aviso('Rutina guardada.','ok');
 };
 cont.querySelector('[data-nueva-semana]').onclick=()=>{
  const dialog=document.createElement('dialog');dialog.innerHTML=`<form method="dialog"><h2>Añadir rutina</h2><label class="campo"><span>Rutina:</span><input name="nombre" value="${programacion.rutinas.length+1}" required maxlength="80"></label><label class="campo"><span>Comenzar con</span><select name="base"><option value="actual">Una copia de Rutina: ${escapar(r.nombre)}</option><option value="vacia">Una rutina vacía</option></select></label><div class="acciones"><button class="boton fantasma" value="cancelar">Cancelar</button><button class="boton comenzar-verde" value="crear">Crear rutina</button></div></form>`;document.body.appendChild(dialog);
  dialog.addEventListener('close',()=>{if(dialog.returnValue==='crear'){alGuardar();const nuevo=nuevaRutina(programacion,r,{nombre:dialog.querySelector('[name="nombre"]').value,base:dialog.querySelector('[name="base"]').value});alSeleccionar(nuevo.id);}dialog.remove();},{once:true});dialog.showModal();
 };
}
