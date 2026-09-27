// Navegación entre pantallas, avisos flotantes y limpieza al cambiar de pantalla.
import { escapar } from './util.js';

let manejador = () => {};
const limpiezas = [];

export function fijarManejador(fn) { manejador = fn; }
export function navegar(destino) { manejador(typeof destino === 'string' ? { vista: destino } : destino); }

// Todo lo que deba detenerse al salir de una pantalla (relojes, gráficos) se registra aquí.
export function alSalir(fn) { limpiezas.push(fn); }
export function limpiarPantalla() {
  while (limpiezas.length) {
    try { limpiezas.pop()(); } catch (e) { console.error(e); }
  }
}

export function grafico(canvas, config) {
  const g = new window.Chart(canvas, config);
  alSalir(() => g.destroy());
  return g;
}

export function aviso(texto, tipo = '') {
  const cont = document.getElementById('avisos-flotantes');
  const div = document.createElement('div');
  div.className = 'aviso-flotante ' + tipo;
  div.innerHTML = escapar(texto);
  cont.appendChild(div);
  setTimeout(() => { div.style.transition = 'opacity .4s'; div.style.opacity = '0'; }, 3800);
  setTimeout(() => div.remove(), 4300);
}

// Diálogo de confirmación simple.
export function confirmar(titulo, texto, textoSi = 'Sí', peligro = false) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.innerHTML = `<h2>${escapar(titulo)}</h2><p class="suave">${escapar(texto)}</p>
      <div class="acciones"><button class="boton fantasma" value="no">Cancelar</button><button class="boton ${peligro ? 'peligro' : 'primario'}" value="si">${escapar(textoSi)}</button></div>`;
    document.body.appendChild(d);
    d.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { d.close(); resolve(b.value === 'si'); }));
    d.addEventListener('close', () => { d.remove(); resolve(false); });
    d.showModal();
  });
}
