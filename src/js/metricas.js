// Cálculos a partir de lo registrado: horas de sueño y de ayuno, cumplimiento del día,
// resúmenes semanales, rachas y alertas sanas (sección 9.8 del plan).

import { horasEntre, sumarDias, diaSemana, duracionAMinutos, lunesDe, hoyISO, aMinutos, promedio, suma, diasEntre } from './util.js';
import { planDelDia, kmEsfuerzo, semanaDelPlan, ejerciciosDe, resumenComplemento } from './plan.js';

export const ETIQUETAS_COMIDA = [
  { id: 'proteina', nombre: 'Proteína', bueno: true },
  { id: 'fruta', nombre: 'Fruta', bueno: true },
  { id: 'verdura', nombre: 'Verdura', bueno: true },
  { id: 'platano', nombre: 'Plátano' },
  { id: 'harina', nombre: 'Harina', limitar: true },
  { id: 'fritura', nombre: 'Fritura', limitar: true },
  { id: 'azucar', nombre: 'Azúcar/dulce', limitar: true },
  { id: 'gaseosa', nombre: 'Gaseosa/jugo', limitar: true },
];

export const TIPOS_COMIDA = [
  { id: 'primera', nombre: 'Primera comida' },
  { id: 'almuerzo', nombre: 'Almuerzo' },
  { id: 'cena', nombre: 'Cena' },
  { id: 'merienda', nombre: 'Merienda' },
];

export const ML_POR_VASO = 250;

// ---------- Un día ----------
export function metricasDia(fecha, dias, ctx) {
  const d = dias[fecha] || {};
  const ayer = dias[sumarDias(fecha, -1)] || {};
  const plan = planDelDia(fecha, ctx.inicio, ctx.terreno, ctx.rutaPrincipal);
  const m = { fecha, plan, registrado: Object.keys(d).length > 0 };

  // Sueño: de la hora de dormir (noche anterior) a la de despertar.
  m.sueno = horasEntre(d.sueno?.dormir, d.sueno?.despertar);
  m.suenoOk = m.sueno == null ? null : m.sueno >= 7 - 1e-9;

  // Ayuno: desde la última comida de ayer hasta la primera de hoy.
  m.ayunoHoras = horasEntre(ayer.ayuno?.ultima, d.ayuno?.primera);
  m.ayunoExcepcion = !!d.ayuno?.guineoAntes;
  const meta = plan.ayuno?.horas;
  if (m.ayunoExcepcion) m.ayunoOk = true;
  else if (m.ayunoHoras != null && meta) m.ayunoOk = m.ayunoHoras >= meta - 1 / 6; // tolerancia 10 min
  else m.ayunoOk = null;
  // Ventana del día (primera → última comida)
  m.ventanaHoras = horasEntre(d.ayuno?.primera, d.ayuno?.ultima);

  // Ruta
  const r = d.ruta || {};
  m.rutaKm = r.distancia ?? null;
  m.rutaMin = duracionAMinutos(r.tiempo);
  m.rutaHecha = !!(r.hecha || r.distancia || m.rutaMin);
  m.rutaDesnivel = r.desnivel ?? null;
  m.rutaKmEsf = m.rutaHecha && m.rutaKm != null ? kmEsfuerzo(m.rutaKm, r.desnivel) : null;
  m.ritmo = m.rutaKm && m.rutaMin ? m.rutaMin / m.rutaKm : null;
  m.rutaTerreno = r.terreno || null;
  m.kcalQuemadas = r.kcal ?? null;
  m.minTrote = r.minTrote ?? null;
  m.molestia = r.molestiaZona && r.molestiaZona !== 'ninguna' ? { zona: r.molestiaZona, nivel: r.molestiaNivel || null } : null;

  // Complemento
  const c = d.complemento || {};
  const listaComp = ejerciciosDe(c.tipo || plan.complemento?.tipo, plan.semana);
  const rc = resumenComplemento(listaComp, c.registro || {});
  const hechosViejos = Object.values(c.ejercicios || {}).filter(Boolean).length; // formato anterior (casillas)
  m.compReps = rc.reps;
  m.compSegundos = rc.segundos;
  m.compPorcentaje = rc.conDatos ? rc.porcentaje : null;
  m.compHecho = !!(c.hecho || (rc.total && rc.completos >= rc.total) || (listaComp.length && hechosViejos >= listaComp.length));
  m.compParcial = !m.compHecho && (rc.conDatos > 0 || hechosViejos > 0);

  // Comidas y frutas
  const comidas = d.comidas || [];
  const kcal = comidas.map((x) => x.kcal).filter((x) => x != null);
  m.kcalIngeridas = kcal.length ? suma(kcal) : null;
  m.comidas = comidas.length;
  m.limitar = comidas.filter((x) => (x.etiquetas || []).some((e) => ETIQUETAS_COMIDA.find((t) => t.id === e)?.limitar)).length;
  m.guineos = d.frutas?.guineo || 0;
  m.naranjas = d.frutas?.naranja || 0;
  m.otrasFrutas = d.frutas?.otra || 0;
  m.aguaL = d.agua ? (d.agua * ML_POR_VASO) / 1000 : null;
  m.comidasFueraVentana = plan.ayuno ? comidas.filter((x) => fueraDeVentana(x.hora, plan.ayuno.ventana, d.ayuno?.guineoAntes)).length : 0;

  m.peso = d.medidas?.peso ?? null;
  m.cintura = d.medidas?.cintura ?? null;

  // Cumplimiento: lunes a sábado = ruta + ayuno + complemento. Domingo no cuenta.
  if (plan.antesDelPlan || plan.descanso) m.cumplido = null;
  else m.cumplido = m.rutaHecha && m.ayunoOk === true && m.compHecho;
  return m;
}

export function fueraDeVentana(hora, ventana, excepcion) {
  const h = aMinutos(hora);
  if (h == null || !ventana) return false;
  const [a, b] = ventana.map(aMinutos);
  if (excepcion) return h > b;
  return h < a || h > b;
}

// ---------- Rango de días ----------
export function metricasRango(desde, hasta, dias, ctx) {
  const lista = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) lista.push(metricasDia(f, dias, ctx));
  return lista;
}

export function resumen(lista) {
  const entreno = lista.filter((m) => !m.plan.antesDelPlan && !m.plan.descanso);
  const rutas = lista.filter((m) => m.rutaHecha);
  const conKcal = lista.filter((m) => m.kcalIngeridas != null);
  return {
    dias: lista.length,
    diasEntreno: entreno.length,
    diasRuta: rutas.length,
    diasAyuno: lista.filter((m) => m.ayunoOk === true).length,
    diasAyunoEval: lista.filter((m) => m.plan.ayuno).length,
    diasComp: lista.filter((m) => m.compHecho).length,
    diasCumplidos: entreno.filter((m) => m.cumplido).length,
    km: suma(rutas.map((m) => m.rutaKm)),
    kmEsf: suma(rutas.map((m) => m.rutaKmEsf)),
    minRuta: suma(rutas.map((m) => m.rutaMin)),
    minTrote: suma(rutas.map((m) => m.minTrote)),
    kcalQuemadas: suma(rutas.map((m) => m.kcalQuemadas)),
    ritmo: (() => {
      const conAmbos = rutas.filter((m) => m.rutaKm && m.rutaMin);
      const km = suma(conAmbos.map((m) => m.rutaKm));
      return km ? suma(conAmbos.map((m) => m.rutaMin)) / km : null;
    })(),
    sueno: promedio(lista.map((m) => m.sueno)),
    diasSuenoOk: lista.filter((m) => m.suenoOk).length,
    kcalProm: promedio(conKcal.map((m) => m.kcalIngeridas)),
    guineos: suma(lista.map((m) => m.guineos)),
    naranjas: suma(lista.map((m) => m.naranjas)),
    otrasFrutas: suma(lista.map((m) => m.otrasFrutas)),
    limitar: suma(lista.map((m) => m.limitar)),
    aguaProm: promedio(lista.map((m) => m.aguaL)),
    peso: [...lista].reverse().find((m) => m.peso != null)?.peso ?? null,
    cintura: [...lista].reverse().find((m) => m.cintura != null)?.cintura ?? null,
  };
}

// Semanas (lunes a domingo) entre dos fechas.
export function semanas(desde, hasta, dias, ctx) {
  const r = [];
  for (let lunes = lunesDe(desde); lunes <= hasta; lunes = sumarDias(lunes, 7)) {
    const domingo = sumarDias(lunes, 6);
    const lista = metricasRango(lunes, domingo < hasta ? domingo : hasta, dias, ctx);
    r.push({ lunes, domingo, semana: semanaDelPlan(lunes, ctx.inicio), ...resumen(lista) });
  }
  return r;
}

// ---------- Peso ----------
export function serieDePeso(dias, perfil) {
  const puntos = Object.entries(dias)
    .filter(([, d]) => d.medidas?.peso != null)
    .map(([fecha, d]) => ({ fecha, peso: d.medidas.peso }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  if (perfil?.pesoInicial && !puntos.some((p) => p.fecha <= perfil.fechaInicio)) {
    puntos.unshift({ fecha: perfil.fechaInicio, peso: perfil.pesoInicial, inicial: true });
  }
  return puntos;
}

export function serieDeCintura(dias, perfil) {
  const puntos = Object.entries(dias)
    .filter(([, d]) => d.medidas?.cintura != null)
    .map(([fecha, d]) => ({ fecha, cintura: d.medidas.cintura }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  if (perfil?.cinturaInicial && !puntos.some((p) => p.fecha <= perfil.fechaInicio)) {
    puntos.unshift({ fecha: perfil.fechaInicio, cintura: perfil.cinturaInicial, inicial: true });
  }
  return puntos;
}

// Cambio de peso semana a semana (último peso de cada semana).
export function cambiosSemanales(seriePeso) {
  const porSemana = new Map();
  for (const p of seriePeso) porSemana.set(lunesDe(p.fecha), p.peso);
  const lunes = [...porSemana.keys()].sort();
  const r = [];
  for (let i = 1; i < lunes.length; i++) {
    if (diasEntre(lunes[i - 1], lunes[i]) !== 7) continue;
    r.push({ lunes: lunes[i], cambio: porSemana.get(lunes[i]) - porSemana.get(lunes[i - 1]) });
  }
  return r;
}

// ---------- Rachas ----------
export function rachas(dias, ctx, hasta = hoyISO()) {
  let actual = 0;
  let mejor = 0;
  let corrida = 0;
  const inicio = ctx.inicio;
  if (hasta < inicio) return { actual: 0, mejor: 0 };
  for (let f = inicio; f <= hasta; f = sumarDias(f, 1)) {
    const m = metricasDia(f, dias, ctx);
    if (m.cumplido === null) continue; // domingo: ni suma ni rompe
    if (m.cumplido) corrida++;
    else if (f === hasta) continue; // el día de hoy aún no termina
    else corrida = 0;
    mejor = Math.max(mejor, corrida);
  }
  actual = corrida;
  return { actual, mejor };
}

// ---------- Alertas sanas ----------
export function alertasDia(fecha, dias, ctx) {
  const m = metricasDia(fecha, dias, ctx);
  const a = [];
  const hoy = hoyISO();
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  const diaTerminado = fecha < hoy || (fecha === hoy && ahora >= 18 * 60 + 30);

  if (m.sueno != null && m.sueno < 6) {
    a.push({ nivel: 'aviso', texto: 'Dormiste menos de 6 h: hoy la ruta va en modo suave (caminata).' });
  }
  if (m.molestia) {
    const zona = m.molestia.zona;
    const seguidos = [1, 2].every((i) => (dias[sumarDias(fecha, -i)]?.ruta?.molestiaZona || '') === zona);
    if (seguidos) a.push({ nivel: 'peligro', texto: `Molestia en ${zona.toLowerCase()} 3 días seguidos: descansa y, si sigue, consulta a un médico o fisioterapeuta.` });
    else if ((m.molestia.nivel || 0) >= 4) a.push({ nivel: 'aviso', texto: `Molestia fuerte en ${zona.toLowerCase()}: dolor localizado = ese día solo caminas.` });
  }
  if (m.plan.ruta && m.kcalIngeridas != null && m.kcalIngeridas < 1500 && diaTerminado) {
    a.push({ nivel: 'aviso', texto: `Comiste ~${Math.round(m.kcalIngeridas)} kcal en un día de entrenamiento: el mínimo es ~1.500 kcal (referencia 1.700–1.900).` });
  }
  if (m.ayunoHoras != null && !m.plan.descanso && m.plan.ayuno && m.ayunoHoras > 16.5) {
    a.push({ nivel: 'aviso', texto: `Ayuno de ${m.ayunoHoras.toFixed(1).replace('.', ',')} h: no alargues más de 16 h con 6 días de ruta.` });
  }
  if (m.guineos > 2) {
    a.push({ nivel: 'info', texto: 'Más de 2 guineos hoy: la recomendación es 1 al día (hasta 2 en días fuertes).' });
  }
  if (m.comidasFueraVentana > 0) {
    a.push({ nivel: 'info', texto: `${m.comidasFueraVentana} comida(s) fuera de la ventana de hoy (${m.plan.ayuno.ventana.join('–')}).` });
  }
  if (diaSemana(fecha) === 1 && m.peso == null && fecha <= hoy && !m.plan.antesDelPlan) {
    a.push({ nivel: 'info', texto: 'Lunes: toca pesarse (en ayunas, después de ir al baño) y medir la cintura.' });
  }
  return a;
}

// Pérdida > 1,5 kg por semana dos semanas seguidas (después de la primera).
export function alertaRitmoPeso(seriePeso, inicio) {
  const cambios = cambiosSemanales(seriePeso).filter((c) => diasEntre(inicio, c.lunes) >= 14);
  for (let i = 1; i < cambios.length; i++) {
    if (cambios[i].cambio < -1.5 && cambios[i - 1].cambio < -1.5 && diasEntre(cambios[i - 1].lunes, cambios[i].lunes) === 7) {
      return { nivel: 'aviso', texto: 'Estás bajando más de 1,5 kg por semana dos semanas seguidas: es demasiado rápido (pierdes músculo y hay riesgo de rebote). Come un poco más.' };
    }
  }
  return null;
}
