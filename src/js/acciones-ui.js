import {I} from './iconos.js';

// Una presentación común sin sustituir los nodos ni sus manejadores.
const eliminar='[data-accion="borrar-comida"],[data-accion="quitar-item-comida"],[data-accion="desactivar-ayuno"],[data-accion="quitar-foto"],[data-prep-quitar],[data-quitar-foto],[data-borrar]';
const agregar='[data-accion="agregar-item-comida"],[data-accion="serie-mas"],[data-prep-agregar]';
function preparar(b){
 if(b.classList.contains('accion-icono')||b.closest('.arrastre-flotante'))return;
 const texto=b.textContent.trim(),etiqueta=b.getAttribute('aria-label')||b.title||texto;
 // Los tipos del menú y las confirmaciones conservan sus nombres.
 if(b.closest('dialog .acciones,.menu-comidas')||b.matches('.perfil-tarjeta,[data-reloj-restablecer],[data-reloj-restablecer-cal]'))return;
 let tipo=b.matches(eliminar)||/^(Eliminar|Borrar|Quitar)\b/i.test(texto)?'eliminar':b.matches(agregar)?'anadir':null;
 if(b.matches('[data-sumar],[data-zoom]'))tipo=b.dataset.paso==='-1'||b.dataset.zoom==='menos'?'restar':'anadir';
 if(!tipo&&['+','−','-'].includes(texto))tipo=texto==='+'?'anadir':'restar';
 if(!tipo)return;
 const nombre=etiqueta&&![ '+','−','-' ].includes(etiqueta)?etiqueta:(tipo==='anadir'?'Añadir':tipo==='restar'?'Restar':'Eliminar');
 b.classList.add('accion-icono','accion-'+tipo);b.dataset.ayudaAccion=nombre;b.setAttribute('aria-label',nombre);b.removeAttribute('title');
 b.innerHTML=tipo==='eliminar'?I.basura:tipo==='anadir'?I.mas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>';
}
export function unificarAcciones(raiz=document){
 if(raiz.nodeType===1&&raiz.matches('button,summary.boton'))preparar(raiz);
 raiz.querySelectorAll?.('button,summary.boton').forEach(preparar);
}
unificarAcciones();
new MutationObserver(cambios=>{if(origen&&!origen.isConnected)ocultar();for(const c of cambios)for(const nodo of c.addedNodes)if(nodo.nodeType===1&&!nodo.closest('.accion-icono'))unificarAcciones(nodo);}).observe(document.documentElement,{childList:true,subtree:true});
let ayuda=null,origen=null;
function ocultar(){ayuda?.remove();ayuda=null;origen=null;}
function mostrar(b){
 if(b===origen)return;ocultar();if(!b)return;origen=b;ayuda=document.createElement('div');ayuda.className='ayuda-accion';ayuda.setAttribute('role','tooltip');ayuda.textContent=b.dataset.ayudaAccion;document.body.appendChild(ayuda);
 const r=b.getBoundingClientRect(),a=ayuda.getBoundingClientRect();ayuda.style.left=Math.max(6,Math.min(innerWidth-a.width-6,r.left+(r.width-a.width)/2))+'px';ayuda.style.top=(r.top>a.height+10?r.top-a.height-7:r.bottom+7)+'px';
}
document.addEventListener('pointerover',e=>{if(e.pointerType!=='touch')mostrar(e.target.closest('.accion-icono'));});
document.addEventListener('pointerout',e=>{if(origen&&!origen.contains(e.relatedTarget))ocultar();});
document.addEventListener('focusin',e=>mostrar(e.target.closest('.accion-icono')));
document.addEventListener('focusout',ocultar);document.addEventListener('click',ocultar,true);document.addEventListener('scroll',ocultar,true);window.addEventListener('blur',ocultar);
document.addEventListener('keydown',e=>{if(e.key==='Escape')ocultar();});
