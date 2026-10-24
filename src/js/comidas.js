import {I} from './iconos.js';
import {iconoCategoria} from './iconos-alimentos.js';
import {escapar,aMinutos} from './util.js';
import {CATEGORIAS_COMIDA,catalogoAlimentos} from './catalogo-comidas.js';
export {CATEGORIAS_COMIDA} from './catalogo-comidas.js';
export function comidasPredeterminadas(){return ['primera','almuerzo','merienda'].map(tipo=>({id:`base-${tipo}`,tipo,etiquetas:[],borrador:true,primeraDelDia:tipo==='primera',ultimaDelDia:tipo==='merienda'}));}
export function comidasVisibles(d){return Array.isArray(d.comidas)?d.comidas:comidasPredeterminadas();}
export function tieneComida(c){return !!(c.desc?.trim()||c.items?.length||c.hora||c.kcal!=null);}
export function actualizarDescripcion(c){c.desc=[c.textoLibre||'',...(c.items||[]).map(i=>`${i.nombre}${i.cantidad?' ('+i.cantidad+')':''}`)].filter(Boolean).join(' · ');return c.desc;}
export function selectorAlimentos(c,personales=[]){
 const catalogo=catalogoAlimentos(personales),fila=i=>`<div class="comida-item alimento-guardado" data-alimento-id="${escapar(i.id)}"><input type="text" readonly class="alimento-nombre" data-comida-item="${escapar(c.id)}" data-item-id="${escapar(i.id)}" data-item-campo="nombre" value="${escapar(i.nombre)}" aria-label="Alimento" placeholder="Alimento"><input type="text" readonly class="alimento-cantidad" data-comida-item="${escapar(c.id)}" data-item-id="${escapar(i.id)}" data-item-campo="cantidad" value="${escapar(i.cantidad||'')}" aria-label="Cantidad del alimento" placeholder="Cant."><label class="alimento-kcal"><span data-kcal-modo>${i.kcalManual?'kcal':'kcal aprox.'}</span><input type="number" readonly min="0" step="1" data-comida-item="${escapar(c.id)}" data-item-id="${escapar(i.id)}" data-item-campo="kcal" value="${i.kcal??''}" aria-label="Calorías del alimento" placeholder="kcal" title="${escapar(i.kcalManual?'Valor manual':[i.detalleKcal,i.referenciaKcal].filter(Boolean).join(' · ')||'Calorías editables')}"></label><button type="button" class="boton accion-icono accion-editar" data-accion="editar-alimento" data-id-comida="${escapar(c.id)}" data-item="${escapar(i.id)}" data-ayuda-accion="Modificar alimento" aria-label="Modificar alimento">${I.notas}</button><button type="button" class="boton icono fantasma alimento-quitar" title="Eliminar alimento" data-accion="quitar-item-comida" data-id-comida="${escapar(c.id)}" data-item="${escapar(i.id)}" aria-label="Quitar alimento">${I.basura}</button></div>`;
 const grupos=CATEGORIAS_COMIDA.map(cat=>({cat,items:(c.items||[]).filter(i=>(CATEGORIAS_COMIDA.some(g=>g.id===i.categoria)?i.categoria:catalogo.find(a=>a.nombre===i.nombre)?.categoria||'otros')===cat.id)}));
 grupos.sort((a,b)=>Number(a.items.length>0)-Number(b.items.length>0)||(a.items.length?(c.items||[]).indexOf(a.items[0])-(c.items||[]).indexOf(b.items[0]):0));
 return `<div class="editor-alimentos" data-editor-comida="${escapar(c.id)}"><div class="comida-categorias categorias-agrupadas">${grupos.map(({cat,items})=>{
 const id=`alimentos-${c.id}-${cat.id}`;
 return `<section class="categoria-grupo ${items.length?'tiene-alimentos':''}" data-grupo-categoria="${cat.id}"><details class="categoria-comida" data-categoria-panel="${cat.id}"><summary>${iconoCategoria(cat.id)}<b>${cat.nombre}</b></summary>
 <div class="categoria-elegir"><input type="search" list="${escapar(id)}" data-item-categoria="${cat.id}" aria-label="Buscar en ${escapar(cat.nombre)}" placeholder="Buscar en ${escapar(cat.nombre)} o escribir otro" autocomplete="off" maxlength="120"><datalist id="${escapar(id)}">${catalogo.filter(a=>a.categoria===cat.id).map(a=>`<option value="${escapar(a.nombre)}"></option>`).join('')}</datalist><input data-item-cantidad placeholder="Cant." aria-label="Cantidad"><label class="alimento-kcal" data-item-kcal-campo hidden><span>kcal aprox.</span><input type="number" min="0" step="1" data-item-calorias placeholder="kcal" aria-label="Calorías estimadas editables"></label><small class="referencia-kcal" data-item-kcal-ayuda></small></div>
 <div class="categoria-acciones"><button type="button" class="boton categoria-anadir" data-con-texto data-accion="agregar-item-comida" data-id-comida="${escapar(c.id)}" data-categoria="${cat.id}" title="Añadir" aria-label="Añadir alimento en ${escapar(cat.nombre)}">${I.mas} Añadir</button><button type="button" class="boton categoria-guardar" data-accion="guardar-categoria" data-id-comida="${escapar(c.id)}" data-categoria="${cat.id}">Guardar</button><button type="button" class="boton categoria-cancelar" data-accion="cancelar-categoria">Cancelar</button></div></details>
 <div class="comida-items">${items.map(fila).join('')}</div></section>`;}).join('')}</div></div>`;
}

export function contadorAyuno(segundos,primera,ultima){
 const a=aMinutos(primera),b=aMinutos(ultima);if(a==null||b==null||a===b)return null;
 const ventana=((b-a+1440)%1440)*60,desde=((segundos-a*60+86400)%86400);
 return desde<ventana?{titulo:'Hasta la última comida',segundos:ventana-desde}:{titulo:'Hasta la primera comida',segundos:86400-desde};
}

export function guardarComida(c,ahora=new Date()){
 if(!c.hora||(!c.horaManual&&c.borrador))c.hora=`${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
 c.guardadaEnISO=ahora.toISOString();c.borrador=false;return c;
}
export function reordenarComidas(comidas,ids){
 const mapa=new Map(comidas.map(c=>[c.id,c]));if(ids.length!==comidas.length||new Set(ids).size!==ids.length||ids.some(id=>!mapa.has(id)))return comidas;
 return ids.map(id=>mapa.get(id));
}

export const esPrimeraComida=c=>c.primeraDelDia??(c.tipo==='primera-comida');
export const esUltimaComida=c=>c.ultimaDelDia??(c.tipo==='ultima-comida');
export const tipoComida=c=>['primera-comida','ultima-comida'].includes(c.tipo)?'intermedia':c.tipo;
export function marcarLimiteComida(comidas,id,rol,activo){
 if(!['primeraDelDia','ultimaDelDia'].includes(rol)||!comidas.some(c=>c.id===id))return;
 for(const c of comidas)if(c.id===id||activo)c[rol]=c.id===id&&activo;
}

export function limitesComidas(d){
 const cs=comidasVisibles(d);
 return {primera:cs.find(esPrimeraComida)||(cs.some(c=>Object.hasOwn(c,'primeraDelDia'))?null:cs[0]),ultima:cs.find(esUltimaComida)||(cs.some(c=>Object.hasOwn(c,'ultimaDelDia'))?null:cs.at(-1))};
}
export function limitesPorOrden(cs){for(let i=0;i<cs.length;i++){cs[i].primeraDelDia=i===0;cs[i].ultimaDelDia=i===cs.length-1;}return cs;}
export function primeraRegistrada(d){const c=limitesComidas(d).primera;return !!(c&&c.borrador!==true&&/^\d{1,2}:[0-5]\d$/.test(c.hora||'')&&aMinutos(c.hora)<1440);}
export const ayunoVisible=d=>d.ayuno?.activo!==false&&primeraRegistrada(d);
