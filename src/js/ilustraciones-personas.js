import { escapar } from './util.js';

// Cada celda es una ilustración independiente de inicio y movimiento, sin texto.
// Los tamaños reales de los atlas se fijan al integrar los archivos generados.
const ATLAS = [
  {src:'img/ejercicios/personas/lineas-1.png', ancho:948, alto:1659, filas:[6,214,475,697,901,1138,1387,1648]},
  {src:'img/ejercicios/personas/lineas-2.png', ancho:948, alto:1659, filas:[6,238,489,700,924,1157,1401,1641]},
  {src:'img/ejercicios/personas/lineas-3.png', ancho:948, alto:1659, filas:[2,238,473,712,948,1168,1414,1658]},
];
const normalizar=n=>(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const REGLAS = [
 [/flexiones?(?!.*elevado)/,0], [/press de pecho/,1], [/press de hombro/,2], [/elevaciones laterales/,3], [/patada.*triceps/,4], [/plancha frontal/,5], [/dead bug/,6], [/crunch abdominal/,7], [/boxeo/,8], [/paso lateral/,9], [/jumping jacks sin salto/,10], [/rodilla al codo/,11], [/marcha/,12], [/remo con mancuerna/,13],
 [/remo inclinado/,14], [/aperturas inversas/,15], [/curl.*biceps/,16], [/curl martillo/,17], [/plancha lateral(?!.*rodillas)/,18], [/bird dog/,19], [/plancha con toque/,20], [/sentadillas?/,21], [/zancadas?/,22], [/puente/,23], [/peso muerto/,24], [/elevacion de talones/,25], [/crunch inverso/,26], [/plancha lateral.*rodillas/,27],
 [/escaladores.*elevado/,28], [/toques de talon/,29], [/jumping jacks/,30], [/escaladores/,31], [/burpee/,32], [/rodillas arriba/,33], [/crunch bicicleta/,34], [/flexiones?.*elevado/,35], [/gato/,36], [/rotacion toracica/,37], [/angeles/,38], [/cadera sentado/,39], [/tobillos/,40], [/respiracion diafragmatica/,41],
];
let secuencia=0;
export function ilustracionPersona(nombre) {
 const clip="persona-"+(++secuencia);
 const n=normalizar(nombre);
 if(/deslizamientos? de talon/.test(n))return `<svg class="reloj-figura ilustracion-persona" viewBox="0 200 1954 400" role="img" aria-label="${escapar(nombre)}: posición inicial y movimiento"><title>${escapar(nombre)}: inicio y movimiento</title><image href="img/ejercicios/personas/deslizamiento-talon.png" width="1954" height="805"/></svg>`;
 const regla=REGLAS.find(([r])=>r.test(n));
 if(!regla)return '';
 const i=regla[1];
 const correcciones={6:[12,145,790,310],13:[818,120,706,335],18:[12,650,790,235],27:[818,650,706,235]};
 if(correcciones[i]){
   const [x,y,w,h]=correcciones[i];
   return `<svg class="reloj-figura ilustracion-persona" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escapar(nombre)}: posición inicial y movimiento"><title>${escapar(nombre)}: inicio y movimiento</title><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="img/ejercicios/personas/correcciones.png" width="1536" height="1024" clip-path="url(#${clip})"/></svg>`;
 }
 const atlas=ATLAS[Math.floor(i/14)],celda=i%14;
 const fila=Math.floor(celda/2),x=(celda%2)*474+10,y=atlas.filas[fila]+5,w=454,h=atlas.filas[fila+1]-atlas.filas[fila]-10;
 return `<svg class="reloj-figura ilustracion-persona" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${escapar(nombre)}: posición inicial y movimiento"><title>${escapar(nombre)}: inicio y movimiento</title><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="${atlas.src}" width="${atlas.ancho}" height="${atlas.alto}" clip-path="url(#${clip})"/></svg>`;
}
