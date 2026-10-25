import { normalizarAlimento } from "./catalogo-comidas.js";

// Lista propia: sigue al campo en cualquier contenedor desplazable.
export function conectarBuscadorAlimentos(contenedor) {
  let seleccionando = false;
  let campo = null,
    lista = null,
    opciones = [],
    indice = -1,
    frame = 0;
  const id = "opciones-alimentos-" + Math.random().toString(36).slice(2);
  function cerrar() {
    if (campo) {
      campo.setAttribute("aria-expanded", "false");
      campo.removeAttribute("aria-controls");
      campo.removeAttribute("aria-activedescendant");
    }
    lista?.remove();
    lista = null;
    campo = null;
    indice = -1;
  }
  function posicionar() {
    if (!campo?.isConnected) {
      cerrar();
      return;
    }
    const r = campo.getBoundingClientRect();
    let visible = r.bottom > 0 && r.top < innerHeight;
    for (let padre = campo.parentElement; padre; padre = padre.parentElement) {
      const estilo = getComputedStyle(padre);
      if (/auto|scroll|hidden/.test(estilo.overflowY)) {
        const b = padre.getBoundingClientRect();
        if (r.bottom <= b.top || r.top >= b.bottom) visible = false;
      }
    }
    lista.hidden = !visible;
    lista.style.left =
      Math.max(8, Math.min(r.left, innerWidth - r.width - 8)) + "px";
    lista.style.top = r.bottom + 4 + "px";
    lista.style.width = Math.min(r.width, innerWidth - 16) + "px";
    lista.style.maxHeight =
      Math.max(0, Math.min(240, innerHeight - r.bottom - 12)) + "px";
  }
  function mover() {
    if (!lista) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (lista) posicionar();
    });
  }
  function resaltar() {
    for (const [i, b] of [...lista.children].entries())
      b.setAttribute("aria-selected", String(i === indice));
    if (indice >= 0) {
      campo.setAttribute("aria-activedescendant", id + "-" + indice);
      lista.children[indice].scrollIntoView({ block: "nearest" });
    } else campo.removeAttribute("aria-activedescendant");
  }
  function elegir(i) {
    const origen = campo;
    origen.value = opciones[i];
    cerrar();
    seleccionando = true;
    try {
      origen.dispatchEvent(new Event("input", { bubbles: true }));
      origen.dispatchEvent(new Event("change", { bubbles: true }));
    } finally {
      seleccionando = false;
    }
  }
  function abrir(input) {
    if (campo !== input) {
      cerrar();
      campo = input;
    }
    const fuente = document.getElementById(input.dataset.listaAlimentos),
      busqueda = normalizarAlimento(input.value);
    opciones = [...(fuente?.options || [])]
      .map((o) => o.value)
      .filter((v) => normalizarAlimento(v).includes(busqueda));
    if (!opciones.length) {
      cerrar();
      return;
    }
    if (!lista) {
      lista = document.createElement("div");
      lista.id = id;
      lista.className = "lista-alimentos";
      lista.setAttribute("role", "listbox");
      lista.setAttribute("aria-label", "Alimentos");
      document.body.appendChild(lista);
      lista.addEventListener("mousedown", (e) => e.preventDefault());
      lista.addEventListener("click", (e) => {
        const b = e.target.closest("[data-opcion-alimento]");
        if (b) elegir(Number(b.dataset.opcionAlimento));
      });
    }
    lista.replaceChildren(
      ...opciones.map((nombre, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.tabIndex = -1;
        b.id = id + "-" + i;
        b.dataset.opcionAlimento = i;
        b.setAttribute("role", "option");
        b.textContent = nombre;
        return b;
      }),
    );
    indice = -1;
    campo.setAttribute("aria-expanded", "true");
    campo.setAttribute("aria-controls", id);
    resaltar();
    posicionar();
  }
  function enfocar(e) {
    if (seleccionando) return;
    if (e.target.matches("[data-lista-alimentos]")) abrir(e.target);
  }
  function teclas(e) {
    if (!e.target.matches("[data-lista-alimentos]")) return;
    if (e.key === "Escape") {
      cerrar();
      return;
    }
    if (e.key === "Tab") {
      cerrar();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!lista) abrir(e.target);
      if (!lista) return;
      indice = Math.max(
        0,
        Math.min(
          opciones.length - 1,
          indice + (e.key === "ArrowDown" ? 1 : -1),
        ),
      );
      resaltar();
    } else if (e.key === "Enter" && lista && indice >= 0) {
      e.preventDefault();
      elegir(indice);
    }
  }
  function fuera(e) {
    if (campo && e.target !== campo && !lista?.contains(e.target)) cerrar();
  }
  function desenfocar(e) {
    if (e.target === campo && !lista?.contains(e.relatedTarget)) cerrar();
  }
  contenedor.addEventListener("focusin", enfocar);
  contenedor.addEventListener("click", enfocar);
  contenedor.addEventListener("input", enfocar);
  contenedor.addEventListener("keydown", teclas);
  contenedor.addEventListener("focusout", desenfocar);
  document.addEventListener("pointerdown", fuera, true);
  document.addEventListener("scroll", mover, true);
  window.addEventListener("resize", mover);
  const observador = new MutationObserver(() => {
    if (campo && !campo.isConnected) cerrar();
  });
  observador.observe(contenedor, { childList: true, subtree: true });
  return () => {
    cerrar();
    cancelAnimationFrame(frame);
    observador.disconnect();
    for (const ev of ["focusin", "click", "input"])
      contenedor.removeEventListener(ev, enfocar);
    contenedor.removeEventListener("keydown", teclas);
    contenedor.removeEventListener("focusout", desenfocar);
    document.removeEventListener("pointerdown", fuera, true);
    document.removeEventListener("scroll", mover, true);
    window.removeEventListener("resize", mover);
  };
}
