import { escapar } from "../../util.js";

export function tarjetaSeccion(
  id,
  titulo,
  detalle,
  icono,
  contenido = "",
  extra = "",
) {
  return `<details class="seccion-card" data-seccion="${escapar(id)}" ${extra}><summary><span class="seccion-icono">${icono || ""}</span><span class="seccion-titulo"><b>${escapar(titulo)}</b>${detalle ? `<small>${escapar(detalle)}</small>` : ""}</span><span class="seccion-flecha" aria-hidden="true">⌄</span></summary><div class="seccion-contenido">${contenido}</div></details>`;
}

export function conectarTarjetas(
  cont,
  selector = ".secciones-grid > .seccion-card",
) {
  const tarjetas = [...cont.querySelectorAll(selector)];
  for (const tarjeta of tarjetas)
    tarjeta.addEventListener("toggle", () => {
      if (tarjeta.open)
        for (const otra of tarjetas)
          if (otra !== tarjeta) desplegarSuave(otra, false);
    });
}

// Reduce una sección existente conservando sus inputs y listeners.
export function plegarBloque(nodo, titulo, detalle = "", abierto = false) {
  const envoltura = document.createElement("div");
  envoltura.innerHTML = tarjetaSeccion(
    "",
    titulo,
    detalle,
    "",
    "",
    abierto ? "open" : "",
  );
  const tarjeta = envoltura.firstElementChild;
  nodo.before(tarjeta);
  tarjeta.querySelector(".seccion-contenido").appendChild(nodo);
  return tarjeta;
}

export function tablaEnTarjetas(tabla) {
  const titulos = [...tabla.querySelectorAll("thead th")].map(
    (t) => t.textContent,
  );
  const rejilla = document.createElement("div");
  rejilla.className = "editor-cards";
  for (const fila of tabla.querySelectorAll("tbody tr")) {
    const celdas = [...fila.children],
      nombre =
        celdas[0]?.querySelector("input")?.value ||
        celdas[0]?.textContent.trim() ||
        "Ejercicio";
    const caja = document.createElement("div");
    caja.innerHTML = tarjetaSeccion("", nombre, "Editar", "");
    const tarjeta = caja.firstElementChild,
      campos = tarjeta.querySelector(".seccion-contenido");
    campos.classList.add("campos");
    celdas.forEach((celda, i) => {
      if (i === 0 && !celda.querySelector("input,select,button")) return;
      const campo = document.createElement("div");
      campo.className = "campo";
      if (titulos[i]) {
        const etiqueta = document.createElement("span");
        etiqueta.textContent = titulos[i];
        campo.appendChild(etiqueta);
      }
      while (celda.firstChild) campo.appendChild(celda.firstChild);
      campos.appendChild(campo);
    });
    rejilla.appendChild(tarjeta);
  }
  tabla.replaceWith(rejilla);
}

// La altura se anima sin trasladar el foco ni sustituir los controles.
export function desplegarSuave(tarjeta, abrir) {
  tarjeta._despliegue?.cancel();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tarjeta.open = abrir;
    return;
  }
  const resumen = tarjeta.querySelector(":scope > summary");
  if (!resumen) return;
  const desde = tarjeta.getBoundingClientRect().height;
  if (abrir) tarjeta.open = true;
  const hasta = abrir
    ? tarjeta.getBoundingClientRect().height
    : resumen.getBoundingClientRect().height + 2;
  tarjeta.style.overflow = "hidden";
  const animacion = tarjeta.animate(
    [{ height: desde + "px" }, { height: hasta + "px" }],
    { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
  tarjeta._despliegue = animacion;
  animacion.onfinish = () => {
    tarjeta.open = abrir;
    tarjeta.style.overflow = "";
    tarjeta._despliegue = null;
  };
  animacion.oncancel = () => {
    tarjeta.style.overflow = "";
  };
}

document.addEventListener("click", (e) => {
  const resumen = e.target.closest("summary");
  if (!resumen || e.target.closest("button,a,input,select")) return;
  const tarjeta = resumen.parentElement;
  if (tarjeta.tagName !== "DETAILS") return;
  e.preventDefault();
  if (tarjeta.open)
    tarjeta
      .querySelector("[data-temporizador]")
      ?.dispatchEvent(new Event("pausar-rutina"));
  desplegarSuave(tarjeta, !tarjeta.open);
});
