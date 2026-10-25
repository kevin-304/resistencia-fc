import { alCambiarNube } from "../sincronizacion/nube.js";
import { alSalir, navegar } from "../../nav.js";
export function montarResumenCuenta(cont) {
  cont.classList.add("perfiles-cuenta-barra");
  cont.innerHTML =
    '<div><b data-cuenta-resumen-nombre></b><p data-cuenta-resumen-detalle></p></div><button class="boton" type="button" data-gestionar-cuenta></button>';
  cont.querySelector("button").onclick = () => navegar("nube");
  const quitar = alCambiarNube((n) => {
    if (!cont.isConnected) return;
    cont.querySelector("[data-cuenta-resumen-nombre]").textContent = n.conectado
      ? n.nombreCuenta || "Mi cuenta"
      : "Cuenta de sincronización";
    cont.querySelector("[data-cuenta-resumen-detalle]").textContent =
      n.conectado ? n.email : "Inicia sesión para conectar tus dispositivos.";
    cont.querySelector("button").textContent = n.conectado
      ? "Gestionar cuenta"
      : "Iniciar sesión";
  });
  alSalir(quitar);
}
