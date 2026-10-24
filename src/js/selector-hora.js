import {escapar} from './util.js';
const dos=n=>String(n).padStart(2,'0');
export function normalizarHora(v){if(v==='')return '';const m=/^(\d{1,2}):([0-5]\d)$/.exec(v.trim());return m&&Number(m[1])<=23?`${dos(Number(m[1]))}:${m[2]}`:null;}
export function hora24(hora,minuto,periodo){return `${dos(Number(hora)%12+(periodo==='PM'?12:0))}:${dos(minuto)}`;}
export const horaActual=(fecha=new Date())=>`${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
const icono='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>';
export function campoHora(valor,atributos='',etiqueta='Hora'){
 return `<div class="selector-hora"><div class="hora-input-fila"><input type="text" inputmode="numeric" maxlength="5" placeholder="HH:MM" data-hora-manual data-hora-valida="${escapar(valor||'')}" ${atributos} value="${escapar(valor||'')}" aria-label="${escapar(etiqueta)} (24 horas)"><button type="button" class="boton icono" data-abrir-reloj aria-label="Elegir ${escapar(etiqueta.toLowerCase())} en el reloj">${icono}</button></div><button type="button" class="boton marcar-hora" data-hora-actual>Marcar hora actual</button></div>`;
}
export function conectarHoras(cont){
 let dialog=null,origen=null;
 const poner=(input,valor)=>{input.value=valor;input.dataset.horaValida=valor;input.removeAttribute('aria-invalid');input.dispatchEvent(new Event('input',{bubbles:true}));};
 function abrir(input){
  dialog?.close();origen=input;const ahora=new Date(),valor=normalizarHora(input.value)||horaActual(ahora),[h,m]=valor.split(':').map(Number);let hora=h%12||12,minuto=m,periodo=h>=12?'PM':'AM',etapa='hora';
  dialog=document.createElement('dialog');dialog.className='reloj-hora-dialog';dialog.setAttribute('aria-label','Seleccionar hora');document.body.appendChild(dialog);
  function pintar(){
   dialog.innerHTML=`<div class="reloj-hora-cab"><b>Elegir hora</b><span class="reloj-hora-lectura">${dos(hora)}:${dos(minuto)} ${periodo}</span></div><div class="reloj-hora-pasos">${[['hora','Hora'],['periodo','AM / PM'],['minuto','Minutos']].map(([id,t])=>`<button type="button" data-etapa-hora="${id}" aria-current="${id===etapa?'step':'false'}">${t}</button>`).join('')}</div><div class="reloj-esfera" role="group" aria-label="${etapa==='hora'?'Elegir hora del 1 al 12':etapa==='minuto'?'Elegir minutos del 00 al 59':'Elegir AM o PM'}"></div><div class="reloj-hora-pie"><button type="button" class="boton fantasma" data-cancelar-hora>Cancelar</button><button type="button" class="boton comenzar-verde" data-guardar-hora>Guardar hora</button></div>`;
   const esfera=dialog.querySelector('.reloj-esfera');
   if(etapa==='periodo')esfera.innerHTML=`<div class="reloj-periodos">${['AM','PM'].map(x=>`<button type="button" data-periodo-hora="${x}" aria-pressed="${x===periodo}">${x}</button>`).join('')}</div>`;
   else {const minutos=etapa==='minuto',cantidad=minutos?60:12,seleccion=minutos?minuto:hora;
    const anguloSeleccion=(minutos?minuto*6:hora%12*30)*Math.PI/180,radioSeleccion=minutos?(minuto%2?70:106):98;
    esfera.innerHTML=`<svg class="reloj-manecilla" viewBox="0 0 300 300" aria-hidden="true"><line x1="150" y1="150" x2="${150+Math.sin(anguloSeleccion)*radioSeleccion}" y2="${150-Math.cos(anguloSeleccion)*radioSeleccion}"/></svg>`+Array.from({length:cantidad},(_,i)=>{const numero=minutos?i:i+1,angulo=(minutos?i*6:numero%12*30)*Math.PI/180,r=minutos?(i%2?88:124):116,x=150+Math.sin(angulo)*r,y=150-Math.cos(angulo)*r;return `<button type="button" class="reloj-numero ${minutos?'es-minuto':''}" data-numero-hora="${numero}" aria-label="${numero} ${minutos?'minutos':'horas'}" aria-pressed="${numero===seleccion}" style="left:${x/3}%;top:${y/3}%">${minutos?dos(numero):numero}</button>`;}).join('')+`<span class="reloj-centro" aria-hidden="true">${minutos?dos(minuto):hora}</span>`;
   }
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)esfera.animate([{opacity:.25,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:140,easing:'ease-out'});
  }
  dialog.onclick=e=>{const t=e.target.closest('button');if(!t)return;e.preventDefault();if(t.hasAttribute('data-etapa-hora'))etapa=t.dataset.etapaHora;
   else if(t.hasAttribute('data-numero-hora')){if(etapa==='hora'){hora=Number(t.dataset.numeroHora);etapa='periodo';}else minuto=Number(t.dataset.numeroHora);}
   else if(t.hasAttribute('data-periodo-hora')){periodo=t.dataset.periodoHora;etapa='minuto';}
   else if(t.hasAttribute('data-cancelar-hora')){dialog.close();return;}
   else if(t.hasAttribute('data-guardar-hora')){poner(input,hora24(hora,minuto,periodo));dialog.close();return;}
   pintar();dialog.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});
  };
  const actual=dialog;dialog.onclose=()=>{if(dialog===actual)dialog=null;actual.remove();if(input.isConnected)input.focus({preventScroll:true});};pintar();dialog.showModal();
 }
 const clic=e=>{const b=e.target.closest('[data-hora-actual],[data-abrir-reloj]');if(!b)return;e.preventDefault();const input=b.closest('.selector-hora').querySelector('input');if(b.hasAttribute('data-hora-actual'))poner(input,horaActual());else abrir(input);};
 const validar=e=>{const t=e.target;if(!t.matches('[data-hora-manual]'))return;const v=normalizarHora(t.value);if(v===null){e.stopPropagation();if(e.type==='focusout')t.setAttribute('aria-invalid','true');return;}t.dataset.horaValida=v;t.removeAttribute('aria-invalid');if(e.type==='input')t.value=v;else if(t.value!==v)poner(t,v);};
 cont.addEventListener('click',clic);cont.addEventListener('input',validar,true);cont.addEventListener('focusout',validar,true);
 return ()=>{dialog?.close();cont.removeEventListener('click',clic);cont.removeEventListener('input',validar,true);cont.removeEventListener('focusout',validar,true);};
}
