import {ACTIVIDADES,planDesdeActividades,ejerciciosDe,semanaDelPlan,rutinaDe} from './plan.js';
import {preparacionSemanal,guardarDiaSemanal} from './semana-editable.js';
import {crearPreparacion} from './preparacion-sesion.js';
export function bloquesDia(p,ds,fecha,inicio){
 const d=p.semana[ds],base=preparacionSemanal(p,ds,fecha,inicio),elegidas=p.actividades||[],principal=rutinaDe(d.complemento,p)?.actividad;
 if(!d.actividadesDia){
  d.actividadesDia={};
  const destino=elegidas.includes(principal)?principal:elegidas.find(a=>a!=='ruta');
  for(const id of elegidas.filter(a=>a!=='ruta')){
   if(id===destino)d.actividadesDia[id]=structuredClone(base.ejercicios);
   else {const plantilla=planDesdeActividades([id]),tipo=plantilla.semana[ds]?.complemento||Object.values(plantilla.semana).find(x=>x.complemento)?.complemento;
    d.actividadesDia[id]=crearPreparacion(rutinaDe(tipo,plantilla),ejerciciosDe(tipo,Math.max(1,semanaDelPlan(fecha,inicio)),plantilla)).ejercicios;}
  }
 }
 for(const id of elegidas.filter(a=>a!=='ruta'))if(!Array.isArray(d.actividadesDia[id])){
  const plantilla=planDesdeActividades([id]),tipo=plantilla.semana[ds]?.complemento||Object.values(plantilla.semana).find(x=>x.complemento)?.complemento;
  d.actividadesDia[id]=crearPreparacion(rutinaDe(tipo,plantilla),ejerciciosDe(tipo,1,plantilla)).ejercicios;
 }
 const validos=['calentamiento',...elegidas,'enfriamiento'];
 d.ordenActividades=[...new Set([...(d.ordenActividades||[]).filter(x=>validos.includes(x)),...validos])];
 return {base,orden:d.ordenActividades};
}
export function aplicarBloques(p,ds,base){
 const d=p.semana[ds],orden=d.ordenActividades||[];
 const ejercicios=orden.filter(a=>(p.actividades||[]).includes(a)&&a!=='ruta').flatMap(a=>(d.actividadesDia?.[a]||[]).map(e=>({...e,actividad:a})));
 guardarDiaSemanal(p,ds,{...base,ejercicios,ordenActividades:orden});
}
export const nombreActividad=id=>ACTIVIDADES.find(a=>a.id===id)?.nombre||({calentamiento:'Calentamiento',enfriamiento:'Enfriamiento'}[id]||id);
