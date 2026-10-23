import {alSalir,aviso} from '../nav.js';
import {escapar} from '../util.js';
export function montarReportesSemanales(cont){
 let vivo=true;async function pintar(){try{const lista=await window.api.listarReportesAuto?.()||[];if(!vivo)return;cont.innerHTML=`<section class="tarjeta"><h2>Reportes semanales</h2><p class="suave pequeño">Se actualizan al guardar tus registros.</p><div class="lista-reportes">${lista.length?lista.map(r=>`<button class="boton" data-pdf-semanal="${escapar(r.nombre)}">Semana del ${escapar(r.nombre.slice(7,17))} · PDF</button>`).join(''):'<p class="suave">Aparecerán al registrar tu primer día.</p>'}</div><p class="pequeño suave" data-error-reporte></p></section>`;cont.querySelectorAll('[data-pdf-semanal]').forEach(b=>b.onclick=()=>window.api.abrirReporteAuto(b.dataset.pdfSemanal).catch(e=>aviso(e.message,'error')));}catch(e){if(vivo)cont.textContent=e.message;}}
 const error=e=>{const caja=cont.querySelector('[data-error-reporte]');if(caja)caja.textContent='No se pudo actualizar: '+e.detail;};
 window.addEventListener('reportes-actualizados',pintar);window.addEventListener('reporte-error',error);alSalir(()=>{vivo=false;window.removeEventListener('reportes-actualizados',pintar);window.removeEventListener('reporte-error',error);});pintar();
}
export function mostrarSemanales(cont){cont.innerHTML='<div class="cabecera"><h1>Reportes PDF</h1></div><div data-reportes-semanales></div>';montarReportesSemanales(cont.querySelector('[data-reportes-semanales]'));}
