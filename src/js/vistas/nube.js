import { tarjetaNube } from "../modulos/perfiles/cuenta-ui.js";
export { tarjetaNube };
import { estado } from "../modulos/datos/estado.js";
import { navegar } from "../nav.js";
import { I } from "../modulos/ilustraciones/iconos.js";

// Pantalla completa (cuando aún no hay perfil en este equipo, p. ej. un celular nuevo).
export function mostrarNube(cont) {
  cont.innerHTML = `<div class="bienvenida cuenta-pagina">
    <div class="logo-grande"><img src="../build/icon.png" alt=""><div class="titulo-logo">Resistencia <span class="fc">f'c</span></div></div>
    <section class="tarjeta" id="caja-nube"></section>
    <div class="bienvenida-pie"><button class="boton fantasma" id="volver">${I.izquierda} Volver</button><span></span></div>
  </div>`;
  tarjetaNube(cont.querySelector("#caja-nube"));
  cont
    .querySelector("#volver")
    .addEventListener("click", () =>
      navegar(estado.perfil ? "calendario" : "perfiles"),
    );
}
