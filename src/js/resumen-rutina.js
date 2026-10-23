import { construirSesion } from './reloj-rutina.js';
import { escapar } from './util.js';

// El resumen procede de las mismas etapas que ejecuta el reloj.
export function resumenRutina(rutina, ejercicios) {
  const { etapas } = construirSesion(rutina, ejercicios);
  const grupos = new Map();
  for (const etapa of etapas) {
    const g = grupos.get(etapa.bloque) || { segundos: 0, vueltas: 0 };
    g.segundos += etapa.segundos;
    g.vueltas = Math.max(g.vueltas, etapa.vueltas || 0);
    grupos.set(etapa.bloque, g);
  }
  const cierre = grupos.get('Enfriamiento');
  return `<div class="resumen-etapas">${[...grupos].filter(([nombre]) => nombre !== 'Enfriamiento').map(([nombre,g]) => `<div><b>${escapar(nombre === 'Cardio de cierre' ? 'Cardio' : nombre)}</b><strong>${Math.round(g.segundos / 6) / 10} min</strong><small>${g.vueltas ? `${g.vueltas} ${g.vueltas === 1 ? 'vuelta' : 'vueltas'}` : 'Movilidad y preparación'}</small></div>`).join('')}</div>${cierre ? `<p class="cierre-rutina suave pequeño">Al terminar: ${Math.round(cierre.segundos / 60)} min de vuelta a la calma. Los tiempos incluyen las pausas.</p>` : '<p class="cierre-rutina suave pequeño">Tiempo orientativo, incluidas las pausas.</p>'}`;
}
