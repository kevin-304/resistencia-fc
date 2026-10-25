// Una cola por perfil: nunca se borra un cambio nuevo al confirmar uno anterior.
export function crearColaLocal({ leer, escribir }) {
  const colas = new Map();
  function actualizar(id, fn) {
    const trabajo = (colas.get(id) || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const actual = (await leer(id)) || {};
        const siguiente = fn(actual);
        await escribir(id, siguiente);
        return siguiente;
      });
    colas.set(id, trabajo);
    return trabajo;
  }
  return {
    marcar(id, tipo, clave) {
      const revision = crypto.randomUUID();
      return actualizar(id, (m) => {
        const campo = tipo === "dia" ? "sucios" : "suciosDatos";
        m[campo] = [...new Set([...(m[campo] || []), clave])];
        m.revisiones ||= {};
        m.revisiones[tipo] ||= {};
        m.revisiones[tipo][clave] = revision;
        return m;
      });
    },
    async leer(id) {
      await colas.get(id);
      return (await leer(id)) || {};
    },
    guardar(id, meta, confirmadas = {}) {
      const copia = structuredClone(meta);
      return actualizar(id, (actual) => {
        const siguiente = {
          ...actual,
          ...copia,
          revisiones: actual.revisiones || {},
        };
        for (const [tipo, campo] of [
          ["dia", "sucios"],
          ["datos", "suciosDatos"],
        ]) {
          siguiente[campo] = [...(actual[campo] || [])];
          for (const [clave, revision] of Object.entries(
            confirmadas[tipo] || {},
          )) {
            if ((actual.revisiones?.[tipo]?.[clave] ?? null) !== revision)
              continue;
            siguiente[campo] = siguiente[campo].filter((k) => k !== clave);
            if (siguiente.revisiones[tipo])
              delete siguiente.revisiones[tipo][clave];
          }
        }
        return siguiente;
      });
    },
  };
}
export function confirmaciones(meta, dias = [], datos = []) {
  return {
    dia: Object.fromEntries(
      dias.map((k) => [k, meta.revisiones?.dia?.[k] ?? null]),
    ),
    datos: Object.fromEntries(
      datos.map((k) => [k, meta.revisiones?.datos?.[k] ?? null]),
    ),
  };
}
