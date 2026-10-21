// Motor sin DOM: genera las etapas del entrenamiento y cuenta tiempo real, no ticks.
const entero = (v, defecto, max = 3600) => Number.isFinite(Number(v)) && Number(v) > 0 ? Math.min(max, Math.round(Number(v))) : defecto;
const paso = (nombre, segundos, extra = {}) => ({ nombre, segundos, bloque: 'Rutina', clase: 'trabajo', ...extra });
const objetivo = e => `${e.valor}${e.unidad === 's' ? ' s' : ' repeticiones'}${e.lado ? ' por lado' : ''}`;

function intervalo(e, segundos, extra = {}) {
  const lados = e.lado || /\b\d+\s*s por lado/i.test(e.nota || '');
  const base = { ejercicioId: e.id, indicacion: e.nota || '', objetivo: objetivo(e), ...extra };
  if (!lados) return [paso(e.nombre, segundos, base)];
  return [
    paso(e.nombre, segundos / 2, { ...base, lado: 'Primer lado' }),
    paso(e.nombre, segundos / 2, { ...base, lado: 'Cambia al otro lado' }),
  ];
}

export function construirSesion(rutina, ejercicios, { modo = 'completa', trabajo = 40, descanso = 20 } = {}) {
  trabajo = entero(trabajo, 40, 300);
  descanso = entero(descanso, 20, 300);
  const principales = ejercicios.filter(e => /-f-/.test(e.id || ''));
  const abdomen = ejercicios.filter(e => /-a-/.test(e.id || ''));
  const cardio = ejercicios.filter(e => /-c-/.test(e.id || ''));
  const es60 = !!rutina?.bloquesMinutos && principales.length === 5 && abdomen.length === 3 && cardio.length === 5;
  const etapas = [];
  const agregar = (...p) => etapas.push(...p);
  if (es60) {
    if (modo === 'completa') agregar(paso('Calentamiento: marcha y movilidad dinámica', 480, { bloque: 'Calentamiento', indicacion: 'Movilidad suave de hombros, cadera y tobillos; practica los movimientos del día.' }));
    if (['completa', 'principal'].includes(modo)) {
      const rondas = Math.max(...principales.map(e => entero(e.series, 3, 20)));
      const estaciones = principales.reduce((n, e) => n + entero(e.series, 3, 20), 0);
      const ventana = entero(rutina.bloquesMinutos.principal, 30, 180) * 60 / estaciones;
      for (let v = 1; v <= rondas; v++) for (const e of principales) {
        if (v > e.series) continue;
        const extra = { bloque: 'Principal', vuelta: v, vueltas: rondas };
        if (e.unidad === 'reps') {
          agregar(paso(e.nombre, ventana, { ...extra, clase: 'serie', ejercicioId: e.id, objetivo: objetivo(e), indicacion: 'Completa las repeticiones con control y pulsa «Terminé la serie». Descansa lo que quede de esta ventana. Si es por lado, haz ambos lados dentro del mismo tiempo.' }));
        } else {
          const duracion = Math.min(entero(e.valor, 40), ventana);
          agregar(...intervalo(e, duracion, extra));
          if (ventana > duracion) agregar(paso('Descanso y cambio de ejercicio', ventana - duracion, { ...extra, clase: 'descanso' }));
        }
      }
    }
    if (['completa', 'abdomen'].includes(modo)) {
      for (let v = 1; v <= 4; v++) for (const e of abdomen) {
        const extra = { bloque: 'Abdomen', vuelta: v, vueltas: 4 };
        agregar(...intervalo(e, 40, extra), paso('Descanso', 20, { ...extra, clase: 'descanso' }));
      }
    }
    if (['completa', 'cardio'].includes(modo)) {
      for (const e of cardio) agregar(...intervalo(e, 40, { bloque: 'Cardio de cierre', vuelta: 1, vueltas: 1 }), paso('Descanso y cambio', 20, { bloque: 'Cardio de cierre', clase: 'descanso' }));
    }
    if (modo === 'completa') agregar(paso('Vuelta a la calma', 300, { bloque: 'Enfriamiento', indicacion: 'Baja el ritmo y estira suavemente, sin rebotes ni dolor.' }));
  } else {
    // Otras rutinas: conserva sus series y segundos. Las repeticiones usan una
    // ventana orientativa editable: el reloj nunca inventa repeticiones hechas.
    const rondas = Math.max(0, ...ejercicios.map(e => entero(e.series, 1, 20)));
    for (let v = 1; v <= rondas; v++) for (const e of ejercicios) {
      if (v > entero(e.series, 1, 20)) continue;
      const extra = { bloque: 'Rutina', vuelta: v, vueltas: rondas };
      if (e.unidad === 's') agregar(...intervalo(e, entero(e.valor, trabajo) * (e.lado ? 2 : 1), extra));
      else agregar(paso(e.nombre, trabajo, { ...extra, clase: 'serie', ejercicioId: e.id, objetivo: objetivo(e), indicacion: 'Completa las repeticiones sugeridas con control. Pulsa «Terminé la serie» para descansar el tiempo restante; puedes pausar si necesitas más tiempo.' }));
      agregar(paso('Descanso', descanso, { ...extra, clase: 'descanso' }));
    }
  }
  return { etapas, es60, totalSegundos: etapas.reduce((n, e) => n + e.segundos, 0) };
}

export class RelojRutina {
  constructor(etapas, guardado = null) {
    this.etapas = etapas;
    this.reiniciar();
    if (guardado && Number.isInteger(guardado.indice) && guardado.indice >= 0 && guardado.indice <= etapas.length && Number.isFinite(guardado.restanteMs) && guardado.restanteMs >= 0 && Number.isFinite(guardado.transcurridoMs) && guardado.transcurridoMs >= 0) {
      this.indice = guardado.indice;
      this.restanteMs = Math.min(guardado.restanteMs, (etapas[this.indice]?.segundos || 0) * 1000);
      this.transcurridoMs = guardado.transcurridoMs;
      this.descansoSerie = !!guardado.descansoSerie;
      // Volver a abrir nunca arranca el reloj sin un gesto del usuario.
    }
  }
  get terminado() { return this.indice >= this.etapas.length; }
  get etapa() { return this.etapas[this.indice] || null; }
  reiniciar() {
    this.indice = 0;
    this.restanteMs = (this.etapas[0]?.segundos || 0) * 1000;
    this.transcurridoMs = 0;
    this.enMarcha = false;
    this.ultimo = null;
    this.descansoSerie = false;
  }
  iniciar(ahora) {
    if (this.terminado || this.enMarcha) return;
    this.enMarcha = true;
    this.ultimo = ahora;
  }
  actualizar(ahora) {
    if (!this.enMarcha) return false;
    let delta = Math.max(0, ahora - this.ultimo);
    this.ultimo = ahora;
    let cambio = false;
    while (!this.terminado && delta >= this.restanteMs) {
      delta -= this.restanteMs;
      this.transcurridoMs += this.restanteMs;
      this.avanzarInterno();
      cambio = true;
    }
    if (!this.terminado) { this.restanteMs -= delta; this.transcurridoMs += delta; }
    return cambio;
  }
  pausar(ahora) { this.actualizar(ahora); this.enMarcha = false; this.ultimo = null; }
  avanzarInterno() {
    this.indice++;
    this.descansoSerie = false;
    this.restanteMs = (this.etapa?.segundos || 0) * 1000;
    if (this.terminado) { this.enMarcha = false; this.ultimo = null; }
  }
  siguiente(ahora) { this.actualizar(ahora); if (!this.terminado) this.avanzarInterno(); }
  terminarSerie(ahora) {
    const indice = this.indice;
    this.actualizar(ahora);
    if (this.indice === indice && this.etapa?.clase === 'serie') this.descansoSerie = true;
  }
  guardar() { return { indice: this.indice, restanteMs: this.restanteMs, transcurridoMs: this.transcurridoMs, descansoSerie: this.descansoSerie }; }
}

export function textoReloj(segundos) {
  const s = Math.max(0, Math.ceil(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
