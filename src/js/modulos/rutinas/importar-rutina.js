import {normalizarProgramacion,validarFechasRutina} from './programacion-rutinas.js';
import {normalizarPlan} from './plan.js';
export function incorporarRutina(config,perfil,texto){
 if(typeof texto!=='string'||texto.length>2000000)throw Error('El archivo es demasiado grande.');
 const paquete=JSON.parse(texto,(k,v)=>{if(['__proto__','prototype','constructor'].includes(k))throw Error('Archivo inválido');return v;});
 if(paquete.tipo!=='rfc-rutina'||paquete.version!==1)throw Error('Selecciona un archivo de rutina de Resistencia.');
 const r=paquete.rutina;
 if(!r||typeof r.nombre!=='string'||!r.nombre.trim()||r.nombre.length>80||typeof r.id!=='string'||!r.id||r.id.length>100||!r.plan||!r.plan.semana||!r.plan.rutinas)throw Error('Rutina incompleta.');
 const error=validarFechasRutina(r);if(error)throw Error(error);
 const programacion=normalizarProgramacion(config,perfil);
 const nueva={id:r.id,nombre:r.nombre.trim(),inicio:r.inicio,fin:r.fin||null,primeraSesion:r.primeraSesion||null,meta:String(r.meta||'').slice(0,240),borrador:false,plan:normalizarPlan(r.plan)};
 // Importar conserva todas las versiones; si el identificador existe, crea otra.
 if(programacion.rutinas.some(x=>x.id===nueva.id))nueva.id=crypto.randomUUID();
 programacion.rutinas.push(nueva);programacion.seleccionada=nueva.id;
 return {...config,programacionRutinas:programacion};
}
