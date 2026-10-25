import { hoyISO } from "../../util.js";
// La plantilla se consulta por fecha. Este reloj solo refresca la vista abierta;
// no copia registros ni necesita que la app esté ejecutándose a medianoche.
export function iniciarCambioDia(alCambiar, { fechaActual = hoyISO } = {}) {
  let anterior = fechaActual(),
    timer;
  const comprobar = () => {
    const fecha = fechaActual();
    if (fecha !== anterior) {
      const previa = anterior;
      anterior = fecha;
      alCambiar(fecha, previa);
    }
  };
  const programar = () => {
    clearTimeout(timer);
    const ahora = new Date(),
      fin = new Date(ahora);
    fin.setHours(24, 0, 0, 80);
    timer = setTimeout(
      () => {
        comprobar();
        programar();
      },
      Math.max(50, fin - ahora),
    );
  };
  const visible = () => {
    if (!document.hidden) {
      comprobar();
      programar();
    }
  };
  const intervalo = setInterval(comprobar, 30000);
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("pageshow", visible);
  programar();
  return () => {
    clearTimeout(timer);
    clearInterval(intervalo);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("pageshow", visible);
  };
}
