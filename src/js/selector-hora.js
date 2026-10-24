import {escapar} from './util.js';
const dos=n=>String(n).padStart(2,'0');
export function normalizarHora(v){if(v==='')return '';const m=/^(\d{1,2}):([0-5]\d)$/.exec(v.trim());return m&&Number(m[1])<=23?`${dos(Number(m[1]))}:${m[2]}`:null;}
export function hora24(hora,minuto,periodo){return `${dos(Number(hora)%12+(periodo==='PM'?12:0))}:${dos(minuto)}`;}
export const horaActual=(fecha=new Date())=>`${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
const icono='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>';
export function campoHora(valor,atributos='',etiqueta='Hora'){
 return `<div class="selector-hora"><div class="hora-input-fila"><input type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" data-hora-manual data-hora-valida="${escapar(valor||'')}" ${atributos} value="${escapar(valor||'')}" aria-label="${escapar(etiqueta)} (24 horas)"><button type="button" class="boton icono" data-abrir-reloj data-ayuda-hora="Hora" aria-expanded="false" aria-label="Elegir ${escapar(etiqueta.toLowerCase())} en el reloj">${icono}</button></div><button type="button" class="boton marcar-hora" data-hora-actual>Establecer hora actual</button></div>`;
}
// Una única espiral continua: cada minuto avanza y se acerca al centro.
export function posicionMinuto(minuto){const angulo=minuto*12*Math.PI/180,radio=126-minuto*(52/59);return{x:150+Math.sin(angulo)*radio,y:150-Math.cos(angulo)*radio,radio};}
export function conectarHoras(cont){
 let popup=null,origen=null,botonOrigen=null;
 const poner=(input,valor)=>{input.value=valor;input.dataset.horaValida=valor;input.removeAttribute('aria-invalid');input.dispatchEvent(new Event('input',{bubbles:true}));};
 function cerrar(enfocar=false){const boton=botonOrigen;popup?.remove();popup=null;origen=null;botonOrigen=null;if(boton){boton.setAttribute('aria-expanded','false');boton.removeAttribute('aria-controls');if(enfocar&&boton.isConnected)boton.focus({preventScroll:true});}}
 function posicionar(){if(!popup||!origen)return;const caja=origen.closest('.selector-hora'),fila=caja.querySelector('.hora-input-fila'),r=caja.getBoundingClientRect(),ancho=Math.min(292,innerWidth-20);popup.style.width=ancho+'px';popup.style.left=Math.max(10-r.left,Math.min(0,innerWidth-10-r.left-ancho))+'px';popup.style.top=fila.offsetHeight+8+'px';}
 function abrir(input,boton){
  if(origen===input){cerrar();return;}cerrar();origen=input;botonOrigen=boton;
  const valor=normalizarHora(input.value)||horaActual(),[h,m]=valor.split(':').map(Number);let hora=h%12||12,minuto=m,periodo=h>=12?'PM':'AM',etapa='hora';
  popup=document.createElement('div');popup.className='hora-inline';popup.id='reloj-'+Math.random().toString(36).slice(2);popup.setAttribute('role','group');popup.setAttribute('aria-label','Elegir hora');input.closest('.selector-hora').appendChild(popup);boton.setAttribute('aria-expanded','true');boton.setAttribute('aria-controls',popup.id);
  function pintar(){
   popup.innerHTML=`<div class="reloj-esfera" role="group" aria-label="${etapa==='hora'?'Elige una hora del 1 al 12':etapa==='minuto'?'Elige los minutos del 00 al 59 en espiral':'Elige AM o PM'}"></div>`;
   const esfera=popup.querySelector('.reloj-esfera');
   if(etapa==='periodo')esfera.innerHTML=`<div class="reloj-periodos">${['AM','PM'].map(x=>`<button type="button" data-periodo-hora="${x}" aria-pressed="${x===periodo}">${x}</button>`).join('')}</div>`;
   else{
    const minutos=etapa==='minuto',seleccion=minutos?minuto:hora,cantidad=minutos?60:12,coord=minutos?posicionMinuto(minuto):{x:150+Math.sin(hora%12*30*Math.PI/180)*100,y:150-Math.cos(hora%12*30*Math.PI/180)*100};
    const guia=minutos?`<path d="${Array.from({length:60},(_,i)=>{const p=posicionMinuto(i);return(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1);}).join(' ')}"/>`:`<line x1="150" y1="150" x2="${coord.x}" y2="${coord.y}"/>`;
    esfera.innerHTML=`<svg class="reloj-manecilla ${minutos?'guia-espiral':''}" viewBox="0 0 300 300" aria-hidden="true">${guia}</svg>`+Array.from({length:cantidad},(_,i)=>{const numero=minutos?i:i+1,angulo=numero%12*30*Math.PI/180,p=minutos?posicionMinuto(i):{x:150+Math.sin(angulo)*116,y:150-Math.cos(angulo)*116};return `<button type="button" class="reloj-numero ${minutos?'es-minuto':''}" data-numero-hora="${numero}" aria-label="${numero} ${minutos?'minutos':'horas'}" aria-pressed="${numero===seleccion}" style="left:${p.x/3}%;top:${p.y/3}%">${minutos?dos(numero):numero}</button>`;}).join('')+`<button type="button" class="reloj-centro reloj-volver" data-volver-hora aria-label="Volver a elegir la hora">${dos(hora)}${minutos?`<small>${periodo}</small>`:''}</button>`;
   }
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)esfera.animate([{opacity:.3,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}],{duration:130,easing:'ease-out'});
   posicionar();
  }
  popup.onclick=e=>{const t=e.target.closest('button');if(!t)return;e.preventDefault();
   if(t.hasAttribute('data-volver-hora'))etapa='hora';
   else if(t.hasAttribute('data-numero-hora')){if(etapa==='hora'){hora=Number(t.dataset.numeroHora);etapa='periodo';}else{minuto=Number(t.dataset.numeroHora);poner(input,hora24(hora,minuto,periodo));cerrar(true);return;}}
   else if(t.hasAttribute('data-periodo-hora')){periodo=t.dataset.periodoHora;etapa='minuto';}
   pintar();popup.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  };pintar();
  requestAnimationFrame(()=>{if(!popup)return;const r=popup.getBoundingClientRect();if(r.bottom>innerHeight-12){let zona=origen.closest('#vista');if(!zona||zona.scrollHeight<=zona.clientHeight+1)zona=document.scrollingElement;zona.scrollBy({top:r.bottom-innerHeight+12,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}});
 }
 const clic=e=>{const b=e.target.closest('[data-hora-actual],[data-abrir-reloj]');if(!b)return;e.preventDefault();const input=b.closest('.selector-hora').querySelector('input');if(b.hasAttribute('data-hora-actual')){cerrar();poner(input,horaActual());}else abrir(input,b);};
 const fuera=e=>{if(popup&&!popup.contains(e.target)&&!botonOrigen?.contains(e.target))cerrar();};
 const tecla=e=>{if(popup&&e.key==='Escape'){e.preventDefault();e.stopPropagation();cerrar(true);}};
 const validar=e=>{const t=e.target;if(!t.matches('[data-hora-manual]'))return;const v=normalizarHora(t.value);if(v===null){e.stopPropagation();if(e.type==='focusout')t.setAttribute('aria-invalid','true');return;}t.dataset.horaValida=v;t.removeAttribute('aria-invalid');if(e.type==='input')t.value=v;else if(t.value!==v)poner(t,v);};
 cont.addEventListener('click',clic);cont.addEventListener('input',validar,true);cont.addEventListener('focusout',validar,true);document.addEventListener('click',fuera,true);document.addEventListener('keydown',tecla,true);window.addEventListener('resize',posicionar);
 return ()=>{cerrar();cont.removeEventListener('click',clic);cont.removeEventListener('input',validar,true);cont.removeEventListener('focusout',validar,true);document.removeEventListener('click',fuera,true);document.removeEventListener('keydown',tecla,true);window.removeEventListener('resize',posicionar);};
}
