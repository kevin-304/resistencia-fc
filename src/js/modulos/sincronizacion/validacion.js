// Solo se sincronizan datos JSON; nunca código ni rutas de archivos arbitrarias.
const prohibidas = new Set(["__proto__", "prototype", "constructor"]);
export function leerDatoNube(texto) {
  if (texto == null) return null;
  if (typeof texto !== "string" || texto.length > 900000)
    throw Error("El registro recibido no es válido.");
  const dato = JSON.parse(texto);
  let nodos = 0;
  function revisar(v, nivel = 0) {
    if (++nodos > 50000 || nivel > 40)
      throw Error("El registro recibido es demasiado complejo.");
    if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v)) {
        if (prohibidas.has(k))
          throw Error("El registro contiene una propiedad no permitida.");
        revisar(x, nivel + 1);
      }
  }
  revisar(dato);
  if (dato !== null && typeof dato !== "object")
    throw Error("Se esperaba un registro.");
  return dato;
}
export const fechaNubeValida = (f) =>
  typeof f === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(f) &&
  !isNaN(Date.parse(f + "T12:00:00Z"));
export function emuladorLocal(valor) {
  return typeof valor === "string" &&
    /^127\.0\.0\.1:\d{2,5},127\.0\.0\.1:\d{2,5}$/.test(valor)
    ? valor
    : null;
}
