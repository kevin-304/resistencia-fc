import { imagenEjercicio } from './plan.js';
import { escapar } from './util.js';
import { ilustracionPersona } from './ilustraciones-personas.js';

export function figuraReloj(etapa, tipo, ejercicios) {
  if (!etapa) return '';
  // Las guías de movilidad existentes conservan su ilustración específica.
  if (!etapa.imagen) {
    const vector = ilustracionPersona(etapa.nombre);
    if (vector) return vector;
  }
  const imagen = etapa.imagen || imagenEjercicio(etapa.nombre);
  return imagen ? `<img class="reloj-figura" src="${imagen}" alt="${escapar(etapa.nombre)}">` : '';
}
