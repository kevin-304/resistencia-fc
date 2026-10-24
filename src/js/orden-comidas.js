// Arrastre real por Pointer Events: funciona desde el asa y, con ratón, desde
// el título de una tarjeta. El clic sin movimiento sigue abriendo el contenido.
export function conectarOrdenComidas(cont,alOrdenar,{asaSelector='[data-arrastrar-comida]',filaSelector='.comida-nueva',idClave='comidaId'}={}){
 let fila=null,lista=null,asa=null,puntero=null,original=[],activo=false,inicio=null,ultimo=null,raf=null,suprimirHasta=0;
 const eventos=[];const on=(obj,tipo,fn,opciones)=>{obj.addEventListener(tipo,fn,opciones);eventos.push(()=>obj.removeEventListener(tipo,fn,opciones));};
 const filas=()=>[...(lista?.children||[])].filter(x=>x.matches(filaSelector));
 const ids=()=>filas().map(x=>x.dataset[idClave]);
 function mover(y){const otras=filas().filter(x=>x!==fila),antes=otras.find(x=>{const r=x.getBoundingClientRect();return y<r.top+r.height/2;});lista.insertBefore(fila,antes||null);}
 function terminar(guardar=false){
  cancelAnimationFrame(raf);if(!fila)return;
  if(activo&&guardar)alOrdenar(ids());else if(activo)for(const id of original){const nodo=filas().find(x=>x.dataset[idClave]===id);if(nodo)lista.appendChild(nodo);}
  if(activo)suprimirHasta=performance.now()+450;fila.classList.remove('comida-arrastrando');
  const pointer=puntero;fila=null;lista=null;asa=null;puntero=null;activo=false;inicio=null;ultimo=null;
  if(cont.hasPointerCapture?.(pointer))cont.releasePointerCapture(pointer);
 }
 function desplazar(){if(!activo||!ultimo)return;let zona=cont.closest('#vista');if(!zona||zona.scrollHeight<=zona.clientHeight+1)zona=document.scrollingElement;const r=zona===document.scrollingElement?{top:0,bottom:innerHeight}:zona.getBoundingClientRect();const borde=48,paso=ultimo.y<r.top+borde?-12:ultimo.y>Math.min(r.bottom,innerHeight)-borde?12:0;if(paso){zona.scrollTop+=paso;mover(ultimo.y);}raf=requestAnimationFrame(desplazar);}
 on(cont,'pointerdown',e=>{
  if(e.button!==0||fila)return;const handle=e.target.closest(asaSelector),resumen=e.target.closest('summary'),candidata=handle?.closest(filaSelector)||resumen?.parentElement;
  if(!candidata?.matches(filaSelector)||!cont.contains(candidata))return;
  if(!handle&&(e.pointerType==='touch'||e.target.closest('button,a,input,select,textarea')))return;
  fila=candidata;lista=fila.parentElement;asa=handle;original=ids();puntero=e.pointerId;inicio={x:e.clientX,y:e.clientY};ultimo={...inicio};
  if(handle){e.preventDefault();handle.focus();}
 });
 on(cont,'pointermove',e=>{if(!fila||e.pointerId!==puntero)return;ultimo={x:e.clientX,y:e.clientY};if(!activo&&Math.hypot(e.clientX-inicio.x,e.clientY-inicio.y)<6)return;
  if(!activo){activo=true;try{cont.setPointerCapture(puntero);}catch{}fila.classList.add('comida-arrastrando');desplazar();}e.preventDefault();mover(e.clientY);
 },{passive:false});
 on(cont,'pointerup',e=>{if(e.pointerId===puntero)terminar(true);});
 on(window,'pointerup',()=>{if(fila&&!activo)terminar(false);});
 on(cont,'pointercancel',e=>{if(e.pointerId===puntero)terminar(false);});
 on(cont,'lostpointercapture',e=>{if(e.target===cont&&e.pointerId===puntero&&fila)terminar(false);});on(window,'blur',()=>terminar(false));
 on(cont,'dragstart',e=>{if(e.target.closest(filaSelector))e.preventDefault();});
 on(cont,'click',e=>{if(e.detail>0&&performance.now()<suprimirHasta){e.preventDefault();e.stopImmediatePropagation();}},true);
 on(cont,'keydown',e=>{const handle=e.target.closest(asaSelector);if(!handle||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();fila=handle.closest(filaSelector);lista=fila.parentElement;original=ids();activo=true;const vecino=e.key==='ArrowUp'?fila.previousElementSibling:fila.nextElementSibling;if(vecino)lista.insertBefore(fila,e.key==='ArrowUp'?vecino:vecino.nextElementSibling);terminar(true);handle.focus();});
 return ()=>{terminar(false);eventos.forEach(fn=>fn());};
}
