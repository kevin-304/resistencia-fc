// Arrastre con asa en escritorio, pulsación mantenida en pantalla táctil y teclado.
export function conectarOrdenComidas(cont,alOrdenar,{asaSelector='[data-arrastrar-comida]',filaSelector='.comida-nueva',idClave='comidaId'}={}){
 let fila=null,lista=null,original=[],confirmado=false,timer=null,asa=null,puntero=null,inicio=null,activo=false;
 const filas=()=>[...(lista?.querySelectorAll(':scope > '+filaSelector)||[])];
 const ids=()=>filas().map(x=>x.dataset[idClave]);
 function preparar(agarrador){asa=agarrador;fila=asa.closest(filaSelector);lista=fila.parentElement;original=ids();confirmado=false;}
 function mover(x,y){const destino=document.elementFromPoint(x,y)?.closest(filaSelector);if(!destino||destino===fila||destino.parentElement!==lista)return;const rect=destino.getBoundingClientRect();lista.insertBefore(fila,y<rect.top+rect.height/2?destino:destino.nextSibling);}
 function terminar(guardar){clearTimeout(timer);if(guardar&&fila){alOrdenar(ids());confirmado=true;}else if(lista&&!confirmado){for(const id of original){const nodo=filas().find(x=>x.dataset[idClave]===id);if(nodo)lista.appendChild(nodo);}}fila?.classList.remove('comida-arrastrando');fila=null;lista=null;asa=null;activo=false;puntero=null;}
 cont.addEventListener('dragstart',e=>{const a=e.target.closest(asaSelector);if(!a)return;preparar(a);fila.classList.add('comida-arrastrando');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',fila.dataset[idClave]);});
 cont.addEventListener('dragover',e=>{if(!fila)return;e.preventDefault();e.dataTransfer.dropEffect='move';mover(e.clientX,e.clientY);});
 cont.addEventListener('drop',e=>{if(!fila)return;e.preventDefault();terminar(true);});
 cont.addEventListener('dragend',()=>{if(fila)terminar(false);});
 cont.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const a=e.target.closest(asaSelector);if(!a)return;preparar(a);inicio={x:e.clientX,y:e.clientY};puntero=e.pointerId;asa.setPointerCapture(puntero);timer=setTimeout(()=>{activo=true;fila?.classList.add('comida-arrastrando');},180);});
 cont.addEventListener('pointermove',e=>{if(!fila||puntero!==e.pointerId)return;if(!activo){if(Math.hypot(e.clientX-inicio.x,e.clientY-inicio.y)>10)terminar(false);return;}e.preventDefault();mover(e.clientX,e.clientY);const zona=cont.closest('#vista')||document.scrollingElement,rect=zona.getBoundingClientRect();if(e.clientY<rect.top+60)zona.scrollTop-=14;else if(e.clientY>rect.bottom-60)zona.scrollTop+=14;});
 cont.addEventListener('pointerup',e=>{if(puntero===e.pointerId)terminar(activo);});
 cont.addEventListener('pointercancel',()=>{if(puntero!=null)terminar(false);});
 cont.addEventListener('keydown',e=>{const a=e.target.closest(asaSelector);if(!a||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();preparar(a);const vecino=e.key==='ArrowUp'?fila.previousElementSibling:fila.nextElementSibling;if(vecino)lista.insertBefore(fila,e.key==='ArrowUp'?vecino:vecino.nextElementSibling);terminar(true);a.focus();});
 return ()=>terminar(false);
}
