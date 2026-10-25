// Navegación entre pantallas, avisos flotantes y limpieza al cambiar de pantalla.

let manejador = () => {};
const limpiezas = [];

export function fijarManejador(fn) {
  manejador = fn;
}
export function navegar(destino) {
  manejador(typeof destino === "string" ? { vista: destino } : destino);
}

// Todo lo que deba detenerse al salir de una pantalla (relojes, gráficos) se registra aquí.
export function alSalir(fn) {
  limpiezas.push(fn);
}
export function limpiarPantalla() {
  while (limpiezas.length) {
    try {
      limpiezas.pop()();
    } catch (e) {
      console.error(e);
    }
  }
}

export function grafico(canvas, config) {
  const g = new window.Chart(canvas, config);
  alSalir(() => g.destroy());
  return g;
}

export { aviso, confirmar } from "./modulos/interfaz/avisos.js";
