import { aMinutos } from "../../util.js";

// Los tramos siguen el orden de la noche y admiten un cruce de medianoche.
export function tramosSueno(sueno = {}) {
  return Array.isArray(sueno.tramos)
    ? sueno.tramos
    : [{ dormir: sueno.dormir || "", despertar: sueno.despertar || "" }];
}
export function resumenSueno(sueno = {}) {
  const tramos = tramosSueno(sueno);
  if (
    !tramos.length ||
    tramos.some(
      (t) => aMinutos(t.dormir) == null || aMinutos(t.despertar) == null,
    )
  )
    return { horas: null, incompleto: true };
  let inicio = null,
    fin = null,
    total = 0,
    despierto = 0;
  for (const t of tramos) {
    let a = aMinutos(t.dormir),
      b = aMinutos(t.despertar);
    if (a === b)
      return { horas: null, error: "Revisa las horas de cada tramo." };
    if (fin !== null) {
      while (a < fin) a += 1440;
      despierto += a - fin;
    }
    if (inicio === null) inicio = a;
    while (b <= a) b += 1440;
    if (b - inicio > 1440)
      return {
        horas: null,
        error: "Revisa el orden de los tramos de esta noche.",
      };
    total += b - a;
    fin = b;
  }
  return { horas: total / 60, despierto: despierto / 60 };
}
