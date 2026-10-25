// Arrastre real por Pointer Events: funciona desde el asa y, con ratón, desde
// el título de una tarjeta. El clic sin movimiento sigue abriendo el contenido.
export function conectarOrdenComidas(
  cont,
  alOrdenar,
  {
    asaSelector = "[data-arrastrar-comida]",
    filaSelector = ".comida-nueva",
    idClave = "comidaId",
  } = {},
) {
  let fila = null,
    lista = null,
    asa = null,
    puntero = null,
    original = [],
    activo = false,
    inicio = null,
    ultimo = null,
    raf = null,
    suprimirHasta = 0,
    flotante = null,
    agarre = null;
  const eventos = [];
  const on = (obj, tipo, fn, opciones) => {
    obj.addEventListener(tipo, fn, opciones);
    eventos.push(() => obj.removeEventListener(tipo, fn, opciones));
  };
  const filas = () =>
    [...(lista?.children || [])].filter(
      (x) => x.matches(filaSelector) && !x.hidden,
    );
  const ids = () => filas().map((x) => x.dataset[idClave]);
  const reducir = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function animarCambio(cambio) {
    const elementos = filas().filter((x) => x !== fila),
      previos = new Map(
        elementos.map((x) => [x, x.getBoundingClientRect().top]),
      );
    cambio();
    for (const x of elementos) {
      x._ordenAnim?.cancel();
      const dy = previos.get(x) - x.getBoundingClientRect().top;
      if (!reducir() && Math.abs(dy) > 0.5)
        x._ordenAnim = x.animate(
          [
            { transform: `translateY(${dy}px)` },
            { transform: "translateY(0)" },
          ],
          { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    }
  }
  function posicionar() {
    if (!flotante || !ultimo) return;
    const ancho = flotante.getBoundingClientRect().width,
      x = Math.max(6, Math.min(innerWidth - ancho - 6, ultimo.x - agarre.x)),
      y = ultimo.y - agarre.y;
    flotante.style.transform = `translate3d(${x}px,${y}px,0)`;
  }
  function levantar() {
    const resumen = fila.querySelector(":scope>summary"),
      r = resumen.getBoundingClientRect(),
      caja = fila.getBoundingClientRect();
    agarre = { x: inicio.x - caja.left, y: inicio.y - r.top };
    flotante = document.createElement("div");
    flotante.className = "arrastre-flotante";
    flotante.setAttribute("aria-hidden", "true");
    flotante.inert = true;
    flotante.style.width = caja.width + "px";
    const titulo = document.createElement("div");
    titulo.className = "arrastre-titulo";
    titulo.innerHTML = resumen.innerHTML;
    for (const el of titulo.querySelectorAll("*"))
      for (const a of [...el.attributes])
        if (
          a.name.startsWith("data-") ||
          ["id", "tabindex", "aria-controls"].includes(a.name)
        )
          el.removeAttribute(a.name);
    titulo.querySelectorAll("button").forEach((b) => {
      if (!b.classList.contains("comida-agarre")) {
        b.remove();
        return;
      }
      const span = document.createElement("span");
      span.className = b.className;
      span.innerHTML = b.innerHTML;
      b.replaceWith(span);
    });
    flotante.appendChild(titulo);
    document.body.appendChild(flotante);
    fila.style.setProperty("--alto-arrastre", r.height + 2 + "px");
    animarCambio(() => fila.classList.add("comida-arrastrando"));
    document.documentElement.classList.add("arrastre-en-curso");
    posicionar();
    if (!reducir())
      titulo.animate(
        [
          { transform: "scale(.98)", opacity: 0.7 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 130, easing: "ease-out" },
      );
  }
  function mover(y) {
    const otras = filas().filter((x) => x !== fila),
      antes = otras.find((x) => {
        const r = x.getBoundingClientRect(),
          desfase = x._ordenAnim
            ? new DOMMatrix(getComputedStyle(x).transform).m42
            : 0;
        return y < r.top - desfase + r.height / 2;
      });
    if (
      antes === fila.nextElementSibling ||
      (!antes && fila === lista.lastElementChild)
    )
      return;
    animarCambio(() => lista.insertBefore(fila, antes || null));
  }
  function terminar(guardar = false) {
    cancelAnimationFrame(raf);
    if (!fila) return;
    if (activo && guardar) alOrdenar(ids());
    else if (activo)
      for (const id of original) {
        const nodo = filas().find((x) => x.dataset[idClave] === id);
        if (nodo) lista.appendChild(nodo);
      }
    if (activo) suprimirHasta = performance.now() + 450;
    const final = fila;
    flotante?.remove();
    flotante = null;
    document.documentElement.classList.remove("arrastre-en-curso");
    fila.classList.remove("comida-arrastrando");
    fila.style.removeProperty("--alto-arrastre");
    for (const x of filas()) x._ordenAnim?.cancel();
    if (activo && guardar && !reducir() && final.isConnected)
      final.animate(
        [
          { transform: "scale(.985)", opacity: 0.65 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 170, easing: "ease-out" },
      );
    const pointer = puntero;
    fila = null;
    lista = null;
    asa = null;
    puntero = null;
    activo = false;
    inicio = null;
    ultimo = null;
    if (cont.hasPointerCapture?.(pointer)) cont.releasePointerCapture(pointer);
  }
  function desplazar() {
    if (!activo || !ultimo) return;
    let zona = cont.closest("#vista");
    if (!zona || zona.scrollHeight <= zona.clientHeight + 1)
      zona = document.scrollingElement;
    const r =
      zona === document.scrollingElement
        ? { top: 0, bottom: innerHeight }
        : zona.getBoundingClientRect();
    const borde = 48,
      paso =
        ultimo.y < r.top + borde
          ? -12
          : ultimo.y > Math.min(r.bottom, innerHeight) - borde
            ? 12
            : 0;
    if (paso) {
      zona.scrollTop += paso;
      mover(ultimo.y);
    }
    raf = requestAnimationFrame(desplazar);
  }
  on(cont, "pointerdown", (e) => {
    if (e.button !== 0 || fila) return;
    const handle = e.target.closest(asaSelector),
      resumen = e.target.closest("summary"),
      candidata = handle?.closest(filaSelector) || resumen?.parentElement;
    if (!candidata?.matches(filaSelector) || !cont.contains(candidata)) return;
    if (
      !handle &&
      (e.pointerType === "touch" ||
        e.target.closest("button,a,input,select,textarea"))
    )
      return;
    fila = candidata;
    lista = fila.parentElement;
    asa = handle;
    original = ids();
    puntero = e.pointerId;
    inicio = { x: e.clientX, y: e.clientY };
    ultimo = { ...inicio };
    if (handle) {
      e.preventDefault();
      handle.focus();
    }
  });
  on(
    cont,
    "pointermove",
    (e) => {
      if (!fila || e.pointerId !== puntero) return;
      ultimo = { x: e.clientX, y: e.clientY };
      if (!activo && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 6)
        return;
      if (!activo) {
        activo = true;
        try {
          cont.setPointerCapture(puntero);
        } catch {}
        levantar();
        desplazar();
      }
      e.preventDefault();
      posicionar();
      mover(e.clientY);
    },
    { passive: false },
  );
  on(cont, "pointerup", (e) => {
    if (e.pointerId === puntero) terminar(true);
  });
  on(window, "pointerup", () => {
    if (fila && !activo) terminar(false);
  });
  on(cont, "pointercancel", (e) => {
    if (e.pointerId === puntero) terminar(false);
  });
  on(cont, "lostpointercapture", (e) => {
    if (e.target === cont && e.pointerId === puntero && fila) terminar(false);
  });
  on(window, "blur", () => terminar(false));
  on(cont, "dragstart", (e) => {
    if (e.target.closest(filaSelector)) e.preventDefault();
  });
  on(
    cont,
    "click",
    (e) => {
      if (e.detail > 0 && performance.now() < suprimirHasta) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  on(cont, "keydown", (e) => {
    const handle = e.target.closest(asaSelector);
    if (!handle || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    fila = handle.closest(filaSelector);
    lista = fila.parentElement;
    original = ids();
    activo = true;
    const vecino =
      e.key === "ArrowUp"
        ? fila.previousElementSibling
        : fila.nextElementSibling;
    if (vecino)
      lista.insertBefore(
        fila,
        e.key === "ArrowUp" ? vecino : vecino.nextElementSibling,
      );
    terminar(true);
    handle.focus();
  });
  return () => {
    terminar(false);
    eventos.forEach((fn) => fn());
  };
}
