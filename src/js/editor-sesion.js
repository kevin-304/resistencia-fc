import {crearPreparacion} from './preparacion-sesion.js';
import {escapar,idUnico} from './util.js';
import {figuraReloj} from './figura-reloj.js';
import {COMPLEMENTOS,imagenEjercicio} from './plan.js';
export function montarPreparacion(cont,{modo,rutina,ejercicios,ajustes,alCambiar,alComenzar,alCancelar}){
 const p=crearPreparacion(rutina,ejercicios,ajustes),catalogo=[...new Set(Object.values(COMPLEMENTOS).flatMap(r=>(r.ejercicios||[]).map(e=>e.nombre)))];
 const grupos=modo==='calentamiento'?['calentamiento','enfriamiento']:['ejercicios','enfriamiento'];
 const nombres={calentamiento:'Calentamiento',ejercicios:'Rutina',enfriamiento:'Enfriamiento'};
 let editando=false;
 const guardar=()=>alCambiar?.(structuredClone(p));
 function render(){
  cont.innerHTML=`<div class="prep-cab"><h3>${modo==='calentamiento'?'Calentamiento':'Rutina'}</h3><button type="button" class="boton" data-prep-editar>${editando?'Listo':'Modificar'}</button></div>
   ${grupos.map(g=>`<section class="prep-grupo">${g===grupos[0]?'':`<h4>${nombres[g]}</h4>`}<div class="prep-lista">${p[g].map((e,i)=>`<details class="prep-ejercicio"><summary><b>${escapar(e.nombre)}</b><small>${e.series||1} × ${e.valor} ${e.unidad==='reps'?'reps':'s'}</small></summary><div class="prep-figura">${figuraReloj({...e,ejercicioId:e.id},'',p.ejercicios)}</div>${editando?`<div class="campos prep-campos">
   <label class="campo prep-nombre"><span>Ejercicio</span><input data-prep-g="${g}" data-prep-i="${i}" data-prep-k="nombre" value="${escapar(e.nombre)}"></label>
   ${g==='ejercicios'?`<label class="campo"><span>Bloque</span><select data-prep-g="${g}" data-prep-i="${i}" data-prep-k="bloque">${['Principal','Abdomen','Cardio'].map(b=>`<option ${e.bloque===b?'selected':''}>${b}</option>`).join('')}</select></label>`:''}
   <label class="campo"><span>Series</span><input type="number" min="1" max="20" data-prep-g="${g}" data-prep-i="${i}" data-prep-k="series" value="${e.series||1}"></label>
   <label class="campo"><span>${e.unidad==='reps'?'Repeticiones':'Segundos'}</span><input type="number" min="1" max="600" data-prep-g="${g}" data-prep-i="${i}" data-prep-k="valor" value="${e.valor}"></label>
   ${g==='ejercicios'?`<label class="campo"><span>Unidad</span><select data-prep-g="${g}" data-prep-i="${i}" data-prep-k="unidad"><option value="s" ${e.unidad==='s'?'selected':''}>Segundos</option><option value="reps" ${e.unidad==='reps'?'selected':''}>Repeticiones</option></select></label>${e.unidad==='reps'?`<label class="campo"><span>Tiempo de serie (s)</span><input type="number" min="1" max="600" data-prep-g="${g}" data-prep-i="${i}" data-prep-k="duracionSeg" value="${e.duracionSeg||40}"></label>`:''}`:''}
   <label class="campo"><span>Descanso (s)</span><input type="number" min="0" max="600" data-prep-g="${g}" data-prep-i="${i}" data-prep-k="descansoSeg" value="${e.descansoSeg??10}"></label>
   <label class="check"><input type="checkbox" data-prep-g="${g}" data-prep-i="${i}" data-prep-k="lado" ${e.lado?'checked':''}>Cambiar de lado</label>
   <button class="boton fantasma peligro" type="button" data-prep-quitar="${g}:${i}">Quitar</button></div>`:''}</details>`).join('')}</div>
   ${editando?`<div class="prep-agregar"><input data-prep-nuevo="${g}" list="prep-catalogo" placeholder="Nombre del ejercicio"><button type="button" class="boton" data-prep-agregar="${g}" aria-label="Añadir ejercicio">+</button></div>`:''}</section>`).join('')}
   <datalist id="prep-catalogo">${catalogo.map(n=>`<option value="${escapar(n)}">`).join('')}</datalist><div class="prep-acciones"><button type="button" class="boton fantasma" data-prep-cancelar>Volver</button><button type="button" class="boton comenzar-verde" data-prep-comenzar>${modo==='calentamiento'?'Comenzar calentamiento':'Comenzar rutina'}</button></div><p data-prep-error role="status"></p>`;
 }
 cont.onclick=e=>{
  if(e.target.closest('[data-prep-editar]')){editando=!editando;render();return;}
  if(e.target.closest('[data-prep-cancelar]')){alCancelar();return;}
  if(e.target.closest('[data-prep-comenzar]')){if(!p[modo==='calentamiento'?'calentamiento':'ejercicios'].length){cont.querySelector('[data-prep-error]').textContent='Añade un ejercicio.';return;}alComenzar(editando?p:null);return;}
  const quitar=e.target.closest('[data-prep-quitar]');if(quitar){const[g,i]=quitar.dataset.prepQuitar.split(':');p[g].splice(Number(i),1);guardar();render();return;}
  const agregar=e.target.closest('[data-prep-agregar]');if(agregar){const g=agregar.dataset.prepAgregar,nombre=cont.querySelector(`[data-prep-nuevo="${g}"]`).value.trim();if(!nombre)return;p[g].push({id:idUnico(),nombre,unidad:'s',valor:40,duracionSeg:40,series:1,descansoSeg:20,bloque:'Principal',imagen:g==='ejercicios'?undefined:imagenEjercicio(nombre)});guardar();render();}
 };
 cont.onchange=e=>{
  const t=e.target,g=t.dataset.prepG,i=Number(t.dataset.prepI),k=t.dataset.prepK;if(!g||!k)return;
  const fila=p[g][i];if(t.type==='checkbox')fila[k]=t.checked;else if(t.type==='number'){const minimo=k==='descansoSeg'?0:1;fila[k]=Math.round(Math.min(k==='series'?20:600,Math.max(minimo,Number(t.value)||minimo)));t.value=fila[k];}else fila[k]=t.value;
  if((k==='valor'||k==='unidad')&&fila.unidad==='s')fila.duracionSeg=fila.valor;
  if(k==='nombre'){delete fila.imagen;delete fila.nota;}
  if(k==='valor'&&g!=='ejercicios'&&fila.nota)fila.nota=fila.nota.replace(/\b\d+\s*s\b/g,Math.round(fila.valor/2)+' s');
  guardar();
  const resumen=t.closest('details').querySelector('summary');resumen.querySelector('b').textContent=fila.nombre;resumen.querySelector('small').textContent=`${fila.series} × ${fila.valor} ${fila.unidad==='reps'?'reps':'s'}`;
  if(k==='unidad')render();
 };
 render();
}
