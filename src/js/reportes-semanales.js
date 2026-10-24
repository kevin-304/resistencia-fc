import {resolverAyuno} from './ayuno-nocturno.js';
import {planConProgramacion} from './programacion-rutinas.js';
import {lunesDe,sumarDias} from './util.js';
import {tieneComida,limitesComidas,ayunoVisible} from './comidas.js';
import {normalizarPlan,planEnFecha,planDelDia,ejerciciosDe} from './plan.js';
export function semanasConDatos(dias){return [...new Set(Object.keys(dias||{}).filter(f=>/^\d{4}-\d{2}-\d{2}$/.test(f)&&dias[f]&&Object.keys(dias[f]).length).map(lunesDe))].sort().reverse();}
const latin=s=>String(s??'').replace(/[\r\n]+/g,' ').replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\x20-\xff]/g,' ');
const literal=s=>latin(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
export function lineasSemana(datos,desde){
 const hasta=sumarDias(desde,6),lineas=[],pon=(texto,tipo='texto')=>lineas.push({texto:latin(texto),tipo});
 pon('Resistencia f\'c','titulo');pon(datos.perfil?.nombre||'Perfil','subtitulo');pon(`Registro semanal: ${desde} al ${hasta}`);pon('Se actualiza con los registros guardados.');
 let comidas=0,km=0,sesiones=0;
 for(let i=0;i<7;i++){const fecha=sumarDias(desde,i),d=datos.dias?.[fecha];if(!d||!Object.keys(d).length)continue;pon(fecha,'subtitulo');
  if(d.ruta){const r=d.ruta;pon(`Ruta: ${r.salida||'--:--'} a ${r.llegada||'--:--'} | Distancia: ${r.distancia??'-'} km | Calorías: ${r.kcal??'-'}`);km+=Number(r.distancia)||0;}
  for(const [clave,nombre]of [['calentamientoSesion','Calentamiento'],['complemento','Ejercicio']]){const r=d[clave];if(!r)continue;if(r.inicio||r.fin)pon(`${nombre}: inicio ${r.inicio||'--:--'} | fin ${r.fin||'--:--'}${r.duracion!=null?` | tiempo activo ${r.duracion} min`:''}`);if(clave==='complemento'){
   if(r.hecho)sesiones++;pon(`Estado: ${r.hecho?'completada':r.fin?'finalizada sin confirmar todos los ejercicios':r.inicio?'iniciada':'sin sesión registrada'}`);
   const pu=normalizarPlan(planEnFecha(planConProgramacion(datos.config||{}),fecha)),plan=planDelDia(fecha,datos.perfil?.fechaInicio||fecha,datos.config?.terreno,null,pu),preparacion=d.preparacion||pu.semana[plan.ds]?.preparacion,lista=preparacion?.ejercicios||ejerciciosDe(r.tipo||plan.complemento?.tipo,plan.semana,pu);
   if(r.inicio||r.hecho||Object.keys(r.registro||{}).length){pon('Ejercicios configurados (las cantidades reales solo se indican si se registraron):');for(const e of lista){const reg=r.registro?.[e.id];pon(`  ${e.nombre}${Array.isArray(reg)&&reg.some(x=>x!=null)?` | registrado: ${reg.map(x=>x??'-').join(', ')} ${e.unidad==='s'?'s':'reps'}`:''}`);}}
  }}
  const cs=(d.comidas||[]).filter(tieneComida);comidas+=cs.length;
  if(cs.length){pon('Comidas:');for(const c of cs){const nombre=({'primera':'Desayuno',almuerzo:'Almuerzo',merienda:'Merienda',cena:'Cena',intermedia:'Comida intermedia','primera-comida':'Primera comida','ultima-comida':'Última comida'})[c.tipo]||'Comida';const descripcion=c.desc||[c.textoLibre,...(c.items||[]).map(x=>`${x.nombre}${x.cantidad?' ('+x.cantidad+')':''}`)].filter(Boolean).join(', ');pon(`  ${c.hora||'Sin hora'} - ${nombre}${limitesComidas(d).primera===c?' [Primera del día]':''}${limitesComidas(d).ultima===c?' [Última del día]':''}: ${descripcion||'Sin detalle'}${c.kcal!=null?' | '+c.kcal+' kcal':''}`);}}
  if(d.sueno)pon(`Sueño: ${d.sueno.dormir||'--:--'} a ${d.sueno.despertar||'--:--'} | calidad: ${d.sueno.calidad??'-'}`);
  if(ayunoVisible(d)||d.ayuno?.primera||d.ayuno?.anterior){const a=resolverAyuno(fecha,datos.dias);pon(`Ayuno: última comida ${a.fechaAnterior} ${a.anterior||'--:--'} | primera ${fecha} ${a.primera||'--:--'}${a.horas!=null?' | '+a.horas.toFixed(2)+' h':''}`);}
  if(d.agua!=null)pon(`Agua: ${d.agua} vasos`);
  if(d.medidas)pon(`Medidas: peso ${d.medidas.peso??'-'} kg | cintura ${d.medidas.cintura??'-'} cm`);
  if(d.notas)pon(`Notas: ${d.notas}`);
 }
 pon(`Resumen: ${km.toFixed(2)} km | ${sesiones} sesiones completadas | ${comidas} comidas registradas`,'subtitulo');return lineas;
}
export function generarPDFSemanal(datos,desde){
 const paginas=[[]];let y=792;
 for(const l of lineasSemana(datos,desde)){const size=l.tipo==='titulo'?20:l.tipo==='subtitulo'?12:10,ancho=Math.floor(510/(size*.54)),palabras=l.texto.split(/\s+/);let linea='';const filas=[];
  for(let palabra of palabras){while(palabra.length>ancho){if(linea){filas.push(linea);linea='';}filas.push(palabra.slice(0,ancho));palabra=palabra.slice(ancho);}if((linea+' '+palabra).trim().length>ancho){filas.push(linea);linea=palabra;}else linea=(linea+' '+palabra).trim();}if(linea)filas.push(linea);
  if(l.tipo==='subtitulo')y-=10;
  for(const fila of filas){if(y<58){paginas.push([]);y=792;}paginas.at(-1).push(`BT /${l.tipo==='texto'?'F1':'F2'} ${size} Tf 0.10 0.12 0.14 rg 42 ${y} Td (${literal(fila)}) Tj ET`);y-=size+5;}
 }
 const objetos=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];const ids=[];
 paginas.forEach((p,i)=>{const id=objetos.length+1;ids.push(id);p.push(`BT /F1 8 Tf 0.4 0.4 0.4 rg 42 30 Td (Resistencia f'c | ${desde} | ${i+1} / ${paginas.length}) Tj ET`);const stream=p.join('\n');objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);});
 objetos[1]=`<< /Type /Pages /Kids [${ids.map(id=>id+' 0 R').join(' ')}] /Count ${ids.length} >>`;
 let pdf='%PDF-1.4\n%\xe2\xe3\xcf\xd3\n',offsets=[0];objetos.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objetos.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size ${objetos.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Uint8Array.from(pdf,c=>c.charCodeAt(0));
}
let timer=null,cola=Promise.resolve();const firmas=new Map();
export function programarReportes(datos,api){
 if(!api?.guardarReporteAuto||!datos.perfil||!datos.carpeta)return;clearTimeout(timer);
 timer=setTimeout(()=>{const copia=structuredClone(datos);cola=cola.catch(()=>{}).then(async()=>{const existentes=await api.listarReportesAuto?.()||[];const semanas=[...new Set([...semanasConDatos(copia.dias),...existentes.map(r=>r.nombre.slice(7,17))])];for(const desde of semanas){const fin=sumarDias(desde,6),dias=Object.fromEntries(Object.entries(copia.dias).filter(([f])=>f>=sumarDias(desde,-1)&&f<=fin)),firma=JSON.stringify([copia.perfil.nombre,copia.config.plan,copia.config.programacionRutinas,dias]),clave=copia.carpeta+desde;if(firmas.get(clave)===firma)continue;const pdf=generarPDFSemanal({...copia,dias},desde);await api.guardarReporteAuto(`Semana-${desde}.pdf`,Array.from(pdf),copia.carpeta);firmas.set(clave,firma);}window.dispatchEvent(new Event('reportes-actualizados'));}).catch(e=>{console.error('Reporte semanal:',e);window.dispatchEvent(new CustomEvent('reporte-error',{detail:e.message}));});},1200);
}
