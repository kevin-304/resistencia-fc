import {sumarDias,aMinutos,aISO} from './util.js';
import {tieneComida} from './comidas.js';
const horaValida=h=>typeof h==='string'&&/^\d{1,2}:[0-5]\d$/.test(h)&&aMinutos(h)<1440;
function horarios(d){return (d?.comidas||[]).filter(c=>c.borrador!==true&&tieneComida(c)&&horaValida(c.hora)&&!(c.kcal!=null&&c.kcal!==''&&Number(c.kcal)===0)&&!(/^agua$/i.test((c.desc||'').trim()))&&!(c.items?.length&&c.items.every(i=>/^agua$/i.test(i.nombre))&&!c.textoLibre?.trim())).map(c=>c.hora);}
function instante(fecha,hora){if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha||'')||!horaValida(hora))return null;const [h,m]=hora.split(':').map(Number),[y,mes,d]=fecha.split('-').map(Number),t=new Date(y,mes-1,d,h,m);return t.getFullYear()===y&&t.getMonth()===mes-1&&t.getDate()===d?t.getTime():null;}
export function resolverAyuno(fecha,dias,ahora=new Date()){
 const d=dias[fecha]||{},a=d.ayuno||{},fechaAnterior=a.fechaAnterior||sumarDias(fecha,-1),anteriorDia=dias[fechaAnterior]||{};
 const previas=[...horarios(anteriorDia),...(horaValida(anteriorDia.ayuno?.ultima)?[anteriorDia.ayuno.ultima]:[])].sort((x,y)=>aMinutos(x)-aMinutos(y));
 const actuales=horarios(d).sort((x,y)=>aMinutos(x)-aMinutos(y));
 const anterior=Object.hasOwn(a,'anterior')?a.anterior:(previas.at(-1)||''),primera=Object.hasOwn(a,'primera')?a.primera:(actuales[0]||'');
 const inicio=instante(fechaAnterior,anterior),fin=instante(fecha,primera);let estado='sin-inicio',segundos=null;
 if(inicio!=null){if(fin!=null){estado=fin>=inicio?'completado':'invalido';if(estado==='completado')segundos=(fin-inicio)/1000;}
  else if(fecha===aISO(ahora)&&inicio<=ahora.getTime()){estado='en-curso';segundos=(ahora.getTime()-inicio)/1000;}
  else estado='sin-fin';}
 return{fechaAnterior,anterior,fechaPrimera:fecha,primera,inicio,fin,estado,segundos,horas:estado==='completado'?segundos/3600:null};
}
