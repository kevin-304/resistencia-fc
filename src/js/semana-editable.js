import {normalizarPlan,planSugerido,planDesdeActividades,ejerciciosDe,rutinaDe,semanaDelPlan} from './plan.js';
import {crearPreparacion} from './preparacion-sesion.js';
export const ORDEN_SEMANA=[1,2,3,4,5,6,0];
export const entrenaDia=d=>!!(d?.ruta?.activa||d?.complemento);
export function prepararSemana(p,fecha){
 const copia=structuredClone(normalizarPlan(p));
 if(copia.vigenteDesde!==fecha){const anterior=structuredClone(copia);delete copia.planAnterior;copia.planAnterior=anterior;copia.vigenteDesde=fecha;}
 return copia;
}
export function preparacionSemanal(p,ds,fecha,inicio){
 const d=p.semana[ds],tipo=d.complemento;
 return crearPreparacion(rutinaDe(tipo,p),ejerciciosDe(tipo,Math.max(1,semanaDelPlan(fecha,inicio)),p),d.preparacion);
}
export function guardarDiaSemanal(p,ds,preparacion){
 const d=p.semana[ds],anterior=rutinaDe(d.complemento,p),id=`semanal-${ds}`;
 d.preparacion=structuredClone(preparacion);
 p.rutinas[id]={nombre:anterior?.nombre||'Mi rutina',actividad:p.actividades?.find(a=>a!=='ruta')||'cardio',finalizador:false,ejercicios:structuredClone(preparacion.ejercicios)};
 d.complemento=id;
}
export function marcarDia(p,ds,activo){
 const d=p.semana[ds];
 if(!activo){if(entrenaDia(d))d.descansoGuardado={ruta:structuredClone(d.ruta),complemento:d.complemento,preparacion:structuredClone(d.preparacion)};d.ruta.activa=false;d.complemento=null;delete d.preparacion;return;}
 if(d.descansoGuardado){Object.assign(d,structuredClone(d.descansoGuardado));delete d.descansoGuardado;d.ruta.activa=!!p.actividades?.includes('ruta')&&!!d.ruta.activa;if(entrenaDia(d))return;}
 const actividades=p.actividades||[],base=planDesdeActividades(actividades),tipo=base.semana[ds]?.complemento||Object.values(base.semana).find(x=>x.complemento)?.complemento;
 d.ruta={...planSugerido().semana[ds===0?1:ds].ruta,activa:actividades.includes('ruta')};
 d.complemento=tipo||null;
 if(!d.ruta.activa&&!d.complemento){d.complemento=`semanal-${ds}`;p.rutinas[d.complemento]={nombre:'Mi rutina',finalizador:false,ejercicios:[]};}
}
export function elegirActividades(p,actividades){
 const anteriores=p.actividades||[];p.actividades=[...actividades];
 for(const ds of ORDEN_SEMANA){const d=p.semana[ds];if(!entrenaDia(d))continue;if(!actividades.includes('ruta'))d.ruta.activa=false;else if(!anteriores.includes('ruta'))d.ruta.activa=true;}
}
