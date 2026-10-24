import {I} from './iconos.js';
import {iconoCategoria} from './iconos-alimentos.js';
import {ALIMENTOS} from './alimentos.js';
import {escapar,aMinutos} from './util.js';
const frutaIds=['naranja','manzana','guineo','mandarina','pera','uva','sandia','melon','papaya','pina','mango','fresa','kiwi','durazno','cereza','coco','limon','maracuya','granadilla','pitahaya','mora','arandano','guayaba'];
export const CATEGORIAS_COMIDA=[
 {id:'carbohidratos',nombre:'Carbohidratos',alimentos:['Arroz','Papa','Yuca','Choclo','Avena','Pan','Pasta','Plátano cocido','Plátano frito','Patacones','Tortilla de maíz','Camote']},
 {id:'proteinas',nombre:'Proteínas',alimentos:['Pollo','Carne de res','Cerdo','Pescado','Atún','Huevo','Camarón','Lentejas','Fréjoles','Queso','Yogur']},
 {id:'frutas',nombre:'Frutas',alimentos:ALIMENTOS.filter(a=>frutaIds.includes(a.id)).map(a=>a.nombre)},
 {id:'verduras',nombre:'Verduras',alimentos:['Lechuga','Tomate','Zanahoria','Brócoli','Pepino','Cebolla','Espinaca','Col','Pimiento','Zapallo','Coliflor','Ensalada mixta']},
 {id:'bebidas',nombre:'Bebidas',alimentos:['Agua','Café','Té','Leche','Jugo de naranja','Jugo de mora','Jugo de maracuyá','Batido de frutas','Bebida vegetal','Gaseosa']},
 {id:'otros',nombre:'Otros',alimentos:['Aguacate','Maní','Nueces','Aceite','Mantequilla','Salsa']},
];
export function comidasPredeterminadas(){return ['primera','almuerzo','merienda'].map(tipo=>({id:`base-${tipo}`,tipo,etiquetas:[],borrador:true}));}
export function comidasVisibles(d){return Array.isArray(d.comidas)?d.comidas:comidasPredeterminadas();}
export function tieneComida(c){return !!(c.desc?.trim()||c.items?.length||c.hora||c.kcal!=null);}
export function actualizarDescripcion(c){c.desc=[c.textoLibre||'',...(c.items||[]).map(i=>`${i.nombre}${i.cantidad?' ('+i.cantidad+')':''}`)].filter(Boolean).join(' · ');return c.desc;}
export function selectorAlimentos(c){
 return `<div class="comida-items">${(c.items||[]).map(i=>`<div class="comida-item"><input type="text" class="alimento-nombre" data-comida-item="${escapar(c.id)}" data-item-id="${escapar(i.id)}" data-item-campo="nombre" value="${escapar(i.nombre)}" aria-label="Alimento" placeholder="Alimento"><input type="text" class="alimento-cantidad" data-comida-item="${escapar(c.id)}" data-item-id="${escapar(i.id)}" data-item-campo="cantidad" value="${escapar(i.cantidad||'')}" aria-label="Cantidad del alimento" placeholder="Cantidad"><button type="button" class="boton icono fantasma alimento-quitar" title="Eliminar alimento" data-accion="quitar-item-comida" data-id-comida="${escapar(c.id)}" data-item="${escapar(i.id)}" aria-label="Quitar alimento">${I.basura}</button></div>`).join('')}</div>
 <div class="comida-categorias">${CATEGORIAS_COMIDA.map(cat=>`<details class="categoria-comida"><summary>${iconoCategoria(cat.id)}<span>${cat.nombre}</span></summary><div class="categoria-elegir"><select data-item-categoria="${cat.id}" aria-label="${cat.nombre}"><option value="">Seleccionar</option>${cat.alimentos.map(n=>`<option>${escapar(n)}</option>`).join('')}</select><input data-item-cantidad placeholder="Cant." aria-label="Cantidad"><button type="button" class="boton icono alimento-anadir" title="Añadir alimento" data-accion="agregar-item-comida" data-id-comida="${escapar(c.id)}" data-categoria="${cat.id}" aria-label="Añadir alimento">+</button></div></details>`).join('')}</div>`;
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
