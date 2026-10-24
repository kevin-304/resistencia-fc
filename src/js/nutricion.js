import {NUTRICION} from './nutricion-datos.js';
const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const tabla=new Map(Object.entries(NUTRICION).map(([n,v])=>[normalizar(n),v]));
const alias={banana:'guineo / banana',guineo:'guineo / banana',banano:'guineo / banana',bananas:'guineo / banana',fideos:'pasta','fideos cocidos':'pasta',espaguetis:'pasta','espaguetis cocidos':'pasta',tallarines:'pasta','tallarines cocidos':'pasta','macarrones cocidos':'pasta','avena cocida':'avena','huevo duro':'huevo','pechuga de pollo':'pollo'};
export function estimarCalorias(nombre,cantidad='1'){
 const n=normalizar(nombre),d=tabla.get(alias[n]||n);if(!d)return{kcal:null,ayuda:'Introducir kcal',detalle:'Sin referencia para este alimento'};
 let texto=normalizar(cantidad||'1').replace(',','.').replace('½','1/2').replace('¼','1/4').replace('¾','3/4').replace(/^(media|medio|mitad)\b/,'0.5');
 const m=/^(\d+\/\d+|\d+(?:\.\d+)?)\s*(.*)$/.exec(texto);if(!m)return{kcal:null,ayuda:'Revisar cantidad',detalle:d.detalle};
 const piezas=m[1].split('/').map(Number),numero=piezas.length===2?piezas[0]/piezas[1]:piezas[0];if(!Number.isFinite(numero)||numero<0)return{kcal:null,ayuda:'Revisar cantidad',detalle:d.detalle};
 const u=m[2].trim();let unidad=d.base,peso;
 if(/^(g|gr|gramo|gramos)$/.test(u)){unidad='g';peso=1;}
 else if(/^(kg|kilogramo|kilogramos)$/.test(u)){unidad='kg';peso=1000;}
 else if(/^(ml|mililitro|mililitros)$/.test(u)&&['agua','cafe','te','leche','jugo de naranja'].includes(n)){unidad='ml';peso=(d.porciones.taza||240)/240;}
 else if(u){const unidades={unidad:'unidad',unidades:'unidad',ud:'unidad',uds:'unidad',taza:'taza',tazas:'taza',porcion:'porcion',porciones:'porcion',cucharada:'cucharada',cucharadas:'cucharada',cda:'cucharada',cucharadita:'cucharadita',cucharaditas:'cucharadita',cdta:'cucharadita',rebanada:'rebanada',rebanadas:'rebanada',tajada:'rebanada',tajadas:'rebanada'};unidad=unidades[u];if(!unidad)return{kcal:null,ayuda:'Revisar unidad',detalle:d.detalle};}
 peso??=d.porciones[unidad];if(peso==null)return{kcal:null,ayuda:'Usa gramos o introduce kcal',detalle:d.detalle};
 const gramos=numero*peso;return{kcal:Math.round(d.kcal100*gramos/100),gramos,ndb:d.ndb,detalle:d.detalle,ayuda:`Est. · ${numero} ${unidad==='porcion'?'porción':unidad} (${Math.round(gramos)} g)`};
}
export function recalcularAlimento(item){if(!item.kcalManual){const e=estimarCalorias(item.nombre,item.cantidad);if(e.kcal==null)delete item.kcal;else item.kcal=e.kcal;item.kcalEstimadas=e.kcal!=null;item.referenciaKcal=e.ayuda;item.detalleKcal=e.detalle;}}
export function actualizarCaloriasComida(c){
 if(!c.items?.length&&!c.kcalPorAlimentos)return;
 if(c.kcal!=null&&!c.kcalPorAlimentos)c.kcalAnterior=c.kcal;
 for(const item of c.items||[])recalcularAlimento(item);
 c.kcalPorAlimentos=true;const items=c.items||[],conDato=items.filter(i=>i.kcal!==''&&i.kcal!=null&&Number.isFinite(Number(i.kcal)));
 if(conDato.length)c.kcal=conDato.reduce((s,i)=>s+Number(i.kcal),0);else delete c.kcal;
 c.kcalParcial=conDato.length<items.length||!!c.textoLibre?.trim();c.kcalEstimadas=conDato.some(i=>i.kcalEstimadas);
}
