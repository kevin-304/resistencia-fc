// Confirmación por pulsación continua; ratón, pantalla táctil y teclado.
export function pulsacionProlongada(boton, alCompletar, duracion = 5000) {
  let inicio = null,
    timer = null,
    frame = null,
    puntero = null,
    tecla = null;
  const cancelar = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    inicio = null;
    puntero = null;
    tecla = null;
    boton.classList.remove("manteniendo");
    boton.style.setProperty("--avance", "0%");
  };
  const pintar = () => {
    if (inicio === null) return;
    boton.style.setProperty(
      "--avance",
      `${Math.min(100, ((performance.now() - inicio) / duracion) * 100)}%`,
    );
    frame = requestAnimationFrame(pintar);
  };
  const comenzar = () => {
    if (inicio !== null || boton.disabled) return;
    inicio = performance.now();
    boton.classList.add("manteniendo");
    pintar();
    timer = setTimeout(() => {
      const valido =
        !boton.disabled &&
        boton.getClientRects().length > 0 &&
        !document.hidden;
      cancelar();
      if (valido) alCompletar();
    }, duracion);
  };
  const eventos = [];
  const on = (obj, nombre, fn) => {
    obj.addEventListener(nombre, fn);
    eventos.push(() => obj.removeEventListener(nombre, fn));
  };
  on(boton, "pointerdown", (e) => {
    if (e.button !== 0 || inicio !== null) return;
    e.preventDefault();
    boton.focus();
    puntero = e.pointerId;
    boton.setPointerCapture?.(puntero);
    comenzar();
  });
  on(boton, "pointermove", (e) => {
    if (e.pointerId !== puntero) return;
    const r = boton.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      cancelar();
  });
  on(boton, "pointerup", cancelar);
  on(boton, "pointercancel", cancelar);
  on(boton, "lostpointercapture", cancelar);
  on(boton, "keydown", (e) => {
    if (![" ", "Enter"].includes(e.key)) return;
    e.preventDefault();
    if (e.repeat || inicio !== null) return;
    tecla = e.key;
    comenzar();
  });
  on(boton, "keyup", (e) => {
    if (e.key === tecla) {
      e.preventDefault();
      cancelar();
    }
  });
  on(boton, "blur", cancelar);
  on(window, "blur", cancelar);
  on(document, "visibilitychange", () => {
    if (document.hidden) cancelar();
  });
  on(boton, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  on(boton, "contextmenu", (e) => e.preventDefault());
  return () => {
    cancelar();
    eventos.forEach((fn) => fn());
  };
}
