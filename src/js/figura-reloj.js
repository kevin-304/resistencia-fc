import { imagenEjercicio } from './plan.js';
import { guiaParaRutina } from './guias-rutina.js';
import { escapar } from './util.js';

// Ventanas sobre las ilustraciones originales, en coordenadas normalizadas
// 1024 × 1536. Se muestra solo la tarjeta del movimiento que toca realizar.
const FILAS = {
  0: [[8,268,1008,431],[8,776,1008,318],[8,1164,1008,262]],
  1: [[16,272,992,418],[16,762,992,320],[16,1154,992,286]],
  2: [[4,267,1016,513],[4,850,1016,266],[4,1186,1016,249]],
  3: [[17,276,991,358],[17,716,991,298],[17,1100,991,282]],
  4: [[11,258,1003,414],[11,750,1003,306],[11,1132,1003,275]],
  5: [[17,267,990,442],[17,775,990,323],[17,1164,990,241]],
  6: [[21,238,985,468],[17,782,990,328],[17,1188,990,236]],
};

export function figuraReloj(etapa, tipo, ejercicios) {
  if (!etapa) return '';
  const imagen = etapa.imagen || imagenEjercicio(etapa.nombre);
  const guia = guiaParaRutina(tipo);
  const match = /^kev60-20261019-([0-6])$/.exec(tipo || '');
  const grupo = ['f', 'a', 'c'].find(g => etapa.ejercicioId?.includes(`-${g}-`));
  const lista = grupo ? ejercicios.filter(e => e.id?.includes(`-${grupo}-`)) : [];
  const posicion = lista.findIndex(e => e.id === etapa.ejercicioId);
  if (guia && match && posicion >= 0) {
    const [x,y,ancho,alto] = FILAS[match[1]][['f','a','c'].indexOf(grupo)];
    const w = ancho / lista.length;
    return `<svg class="reloj-figura" viewBox="${x + posicion * w} ${y} ${w} ${alto}" role="img" aria-label="${escapar(etapa.nombre)}"><image href="${guia.src}" width="1024" height="1536" preserveAspectRatio="none" /></svg>`;
  }
  return imagen ? `<img class="reloj-figura" src="${imagen}" alt="${escapar(etapa.nombre)}">` : '<p class="suave pequeño">Este movimiento todavía no tiene ilustración.</p>';
}
