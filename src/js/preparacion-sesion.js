import {CALENTAMIENTO_GUIADO,ENFRIAMIENTO_GUIADO} from './reloj-rutina.js';
export function crearPreparacion(rutina,ejercicios,guardada=null){
 const movilidad=(lista,bloque,valor)=>lista.map(([nombre,imagen,nota,lado],i)=>({id:`prep-${bloque}-${i}`,nombre,imagen:`img/ejercicios/${imagen}.webp`,nota,lado:!!lado,series:1,unidad:'s',valor,descansoSeg:10}));
 const principales=ejercicios.filter(e=>/-f-/.test(e.id||''));
 const es60=!!rutina?.bloquesMinutos&&principales.length===5&&ejercicios.filter(e=>/-a-/.test(e.id||'')).length===3&&ejercicios.filter(e=>/-c-/.test(e.id||'')).length===5;
 const ventana=es60?(rutina.bloquesMinutos.principal||30)*60/principales.reduce((n,e)=>n+Number(e.series||1),0):40;
 const base={calentamiento:movilidad(CALENTAMIENTO_GUIADO,'cal',50),enfriamiento:movilidad(ENFRIAMIENTO_GUIADO,'enf',40),ejercicios:ejercicios.map(e=>{
   const bloque=/-a-/.test(e.id||'')?'Abdomen':/-c-/.test(e.id||'')?'Cardio':'Principal';
   const duracionSeg=e.unidad==='s'?Number(e.valor)*(e.lado&&!es60?2:1):ventana;
   return {...e,valor:e.unidad==='s'?duracionSeg:e.valor,bloque,duracionSeg,descansoSeg:es60?(bloque==='Principal'?Math.max(0,ventana-duracionSeg):20):20};
 })};
 for(const k of Object.keys(base))if(Array.isArray(guardada?.[k]))base[k]=guardada[k].filter(e=>e&&typeof e==='object').map((e,i)=>{const numero=(v,d,min=1,max=600)=>{const n=Number.isFinite(Number(v))?Number(v):Number.isFinite(Number(d))?Number(d):40;return Math.round(Math.min(max,Math.max(min,n)));};return {...e,id:String(e.id||`prep-${k}-${i}`),nombre:String(e.nombre||'Ejercicio'),series:Math.round(numero(e.series,1,1,20)),valor:numero(e.valor,40),duracionSeg:numero(e.duracionSeg,e.valor||40),descansoSeg:numero(e.descansoSeg,10,0),lado:!!e.lado,unidad:k==='ejercicios'&&e.unidad==='reps'?'reps':'s',bloque:['Principal','Abdomen','Cardio'].includes(e.bloque)?e.bloque:'Principal'};});
 return base;
}
