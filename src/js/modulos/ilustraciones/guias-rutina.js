// Guías locales: solo corresponden a las rutinas personales de esta revisión.
// Los demás perfiles y las rutinas antiguas no muestran imágenes que no les pertenecen.
import { alSalir } from "../../nav.js";
import { escapar } from "../../util.js";

const GUIAS = {
  1: ["lunes", "01-lunes-rutina-60min.png"],
  2: ["martes", "02-martes-rutina-60min.png"],
  3: ["miércoles", "03-miercoles-rutina-60min.png"],
  4: ["jueves", "04-jueves-rutina-60min.png"],
  5: ["viernes", "05-viernes-rutina-60min.png"],
  6: ["sábado", "06-sabado-rutina-60min.png"],
  0: ["domingo", "07-domingo-rutina-60min.png"],
};

export function guiaParaRutina(tipo) {
  const match = /^kev60-20261019-([0-6])$/.exec(tipo || "");
  if (!match) return null;
  const [dia, archivo] = GUIAS[match[1]];
  return {
    dia,
    src: `img/rutina-60min/${archivo}`,
    titulo: `Guía ilustrada del ${dia}`,
  };
}

export function tarjetaGuia(tipo, abierta = false) {
  const guia = guiaParaRutina(tipo);
  if (!guia) return "";
  return `<details class="guia-rutina" ${abierta ? "open" : ""}>
    <summary>${escapar(guia.titulo)} <span class="suave pequeño">· ejercicios, tiempos y descansos</span></summary>
    <div class="guia-rutina-contenido">
      <button type="button" class="boton" data-accion="guia-ampliar" data-rutina="${escapar(tipo)}">Ampliar imagen</button>
      <button type="button" class="guia-miniatura" data-accion="guia-ampliar" data-rutina="${escapar(tipo)}" aria-label="Ampliar ${escapar(guia.titulo)}">
        <img src="${guia.src}" alt="${escapar(guia.titulo)}: bloque principal, abdomen y cardio de cierre" loading="lazy" decoding="async">
      </button>
    </div>
  </details>`;
}

export function abrirGuia(tipo) {
  const guia = guiaParaRutina(tipo);
  if (!guia) return;
  document.querySelector(".guia-visor")?.remove();
  const anterior = document.activeElement;
  const dialogo = document.createElement("dialog");
  dialogo.className = "guia-visor";
  dialogo.setAttribute("aria-labelledby", "titulo-guia-visor");
  dialogo.innerHTML = `<div class="guia-herramientas">
      <h2 id="titulo-guia-visor">${escapar(guia.titulo)}</h2>
      <div class="guia-controles">
        <button type="button" class="boton" data-zoom="menos" aria-label="Reducir imagen">−</button>
        <span class="guia-porcentaje" aria-live="polite">100 %</span>
        <button type="button" class="boton" data-zoom="mas" aria-label="Aumentar imagen">+</button>
        <button type="button" class="boton" data-zoom="ajustar">Ajustar</button>
        <button type="button" class="boton primario" data-cerrar>Cerrar</button>
      </div>
    </div>
    <div class="guia-desplazamiento"><img src="${guia.src}" alt="${escapar(guia.titulo)} completa"></div>`;
  const imagen = dialogo.querySelector("img");
  const zona = dialogo.querySelector(".guia-desplazamiento");
  let zoom = 100;
  dialogo.querySelectorAll("[data-zoom]").forEach((b) =>
    b.addEventListener("click", () => {
      zoom =
        b.dataset.zoom === "ajustar"
          ? 100
          : Math.max(
              100,
              Math.min(300, zoom + (b.dataset.zoom === "mas" ? 50 : -50)),
            );
      imagen.style.width = `${zoom}%`;
      dialogo.querySelector(".guia-porcentaje").textContent = `${zoom} %`;
      if (zoom === 100) {
        zona.scrollLeft = 0;
        zona.scrollTop = 0;
      }
    }),
  );
  dialogo.querySelector("[data-cerrar]").addEventListener("click", () => {
    dialogo.close();
    dialogo.remove();
    if (anterior?.isConnected) anterior.focus();
  });
  dialogo.addEventListener(
    "close",
    () => {
      dialogo.remove();
      if (anterior?.isConnected) anterior.focus();
    },
    { once: true },
  );
  alSalir(() => {
    if (dialogo.open) dialogo.close();
    dialogo.remove();
  });
  document.body.appendChild(dialogo);
  dialogo.showModal();
}
