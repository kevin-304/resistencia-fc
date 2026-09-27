// El plan de entrenamiento y ayuno (secciones 2–8 del documento), en forma de datos,
// y las funciones que dicen "qué toca" un día cualquiera.

import { diaSemana, diasEntre, sumarDias } from './util.js';

export const INICIO_POR_DEFECTO = '2026-09-28';

// ---------- Rutina semanal (sección 4) ----------
// Clave = día de la semana de JavaScript (0 = domingo).
export const RUTINA = {
  1: { tipo: 'intervalos', titulo: 'Intervalos caminar/trotar', complemento: 'superior' },
  2: { tipo: 'caminata', titulo: 'Caminata rápida continua', detalle: 'Zona 2: puedes hablar con frases completas.', complemento: 'core' },
  3: { tipo: 'subidas', titulo: 'Subidas', detalle: 'Trota las subidas cortas, camina las bajadas.', complemento: 'inferior' },
  4: { tipo: 'suave', titulo: 'Suave / recuperación', detalle: 'Ritmo cómodo, sin forzar.', complemento: 'estiramientos' },
  5: { tipo: 'intervalos', titulo: 'Intervalos', complemento: 'cardio' },
  6: { tipo: 'larga', titulo: 'Larga', detalle: 'Trote lo más continuo posible.', complemento: 'core' },
  0: { tipo: 'descanso', titulo: 'Descanso total', detalle: 'O caminata ligera de 20–30 min.', complemento: null },
};

export const TIPOS_SESION = [
  { id: 'intervalos', nombre: 'Intervalos' },
  { id: 'caminata', nombre: 'Caminata rápida' },
  { id: 'subidas', nombre: 'Subidas' },
  { id: 'suave', nombre: 'Suave / recuperación' },
  { id: 'larga', nombre: 'Larga' },
  { id: 'series', nombre: 'Series en pista' },
  { id: 'gradas', nombre: 'Gradas / escaleras' },
  { id: 'ligera', nombre: 'Caminata ligera' },
  { id: 'otra', nombre: 'Otra' },
];

export const nombreTipo = (id) => TIPOS_SESION.find((t) => t.id === id)?.nombre || id || '—';

export const REGLAS_RUTA = [
  'Los primeros 5 minutos de la ruta siempre son caminando.',
  'Las bajadas se caminan las primeras semanas (protege las rodillas).',
  'Dolor punzante localizado (canilla, rodilla, tobillo) → ese día solo caminas.',
];

// ---------- Progresión de intervalos (4.1) ----------
export function intervaloDeSemana(semana) {
  if (semana <= 2) return '4 min caminando / 1 min trotando';
  if (semana <= 4) return '3 min caminando / 2 min trotando';
  if (semana <= 8) return '2 min caminando / 3–4 min trotando + tramos cortos más rápidos en lo plano';
  if (semana <= 12) return 'Trote continuo, pausas solo en subidas fuertes';
  return 'Trote continuo; ya puedes trabajar ritmo (meta 10K)';
}

// ---------- Ayuno (5.1 y 5.2) ----------
export function ayunoDelDia(semana, ds) {
  if (semana < 1) return null;
  if (ds === 0) {
    return { protocolo: '12–14 h', horas: 12, ventana: ['08:00', '19:00'], flexible: true, texto: 'Domingo flexible: se relaja el horario, no el tipo de comida.' };
  }
  if (semana === 1) return { protocolo: '12:12', horas: 12, ventana: ['07:00', '19:00'], texto: 'Semana 1 de entrada gradual.' };
  if (semana === 2) return { protocolo: '14:10', horas: 14, ventana: ['08:00', '18:00'], texto: 'Semana 2 de entrada gradual.' };
  return { protocolo: '16:8', horas: 16, ventana: ['10:00', '18:00'], texto: 'No alargues el ayuno más de 16 h.' };
}

export const DURANTE_AYUNO = ['Agua (mínimo 2,5–3 L en el día)', 'Café negro sin azúcar', 'Té o infusiones sin azúcar', 'Agua con una pizca de sal o limón si hace calor'];

// ---------- Complementos (4.2) ----------
export const COMPLEMENTOS = {
  superior: {
    nombre: 'Tren superior', formato: '3 vueltas · 45 s de descanso', usaPeso: true,
    ejercicios: [
      { nombre: 'Flexiones', meta: '8–12 (rodillas apoyadas si no salen)' },
      { nombre: 'Remo con mancuerna', meta: '12 por brazo' },
      { nombre: 'Fondos de tríceps en silla', meta: '10–12' },
      { nombre: 'Press de hombro', meta: '12' },
      { nombre: 'Plancha', meta: '30–45 s' },
    ],
  },
  inferior: {
    nombre: 'Tren inferior', formato: '3 vueltas',
    ejercicios: [
      { nombre: 'Sentadillas', meta: '15–20' },
      { nombre: 'Zancadas alternas', meta: '10 por pierna' },
      { nombre: 'Puente de glúteo', meta: '15' },
      { nombre: 'Step-ups en banca o grada', meta: '10 por pierna' },
      { nombre: 'Elevación de talones', meta: '20' },
    ],
  },
  cardio: {
    nombre: 'Circuito cardio cuerpo completo', formato: '40 s trabajo / 20 s descanso · 3–4 vueltas',
    ejercicios: [
      { nombre: 'Jumping jacks', meta: '40 s' },
      { nombre: 'Escaladores (mountain climbers)', meta: '40 s' },
      { nombre: 'Sentadilla rápida', meta: '40 s', desdeSemana5: 'Sentadilla con salto' },
      { nombre: 'Burpee sin salto', meta: '40 s' },
      { nombre: 'Plancha con toque de hombros', meta: '40 s' },
    ],
  },
  core: {
    nombre: 'Core', formato: '3 vueltas',
    ejercicios: [
      { nombre: 'Plancha frontal', meta: '30–45 s' },
      { nombre: 'Plancha lateral', meta: '20–30 s por lado' },
      { nombre: 'Dead bug', meta: '10 por lado' },
      { nombre: 'Superman', meta: '12' },
    ],
  },
  estiramientos: {
    nombre: 'Estiramientos', formato: '15 min · 30 s por zona',
    ejercicios: [
      { nombre: 'Pantorrillas', meta: '30 s' },
      { nombre: 'Cuádriceps', meta: '30 s' },
      { nombre: 'Isquiotibiales', meta: '30 s' },
      { nombre: 'Glúteo (figura 4)', meta: '30 s' },
      { nombre: 'Flexores de cadera', meta: '30 s' },
      { nombre: 'Espalda baja', meta: '30 s' },
    ],
  },
};

export const TIPOS_COMPLEMENTO = Object.entries(COMPLEMENTOS).map(([id, c]) => ({ id, nombre: c.nombre }));

export function ejerciciosDe(tipo, semana) {
  const c = COMPLEMENTOS[tipo];
  if (!c) return [];
  return c.ejercicios.map((e) => ({ nombre: semana >= 5 && e.desdeSemana5 ? e.desdeSemana5 : e.nombre, meta: e.meta }));
}

// ---------- Calentamiento y enfriamiento (sección 3) ----------
export const CALENTAMIENTO = [
  {
    grupo: 'Movilidad articular (3 min) · 10 repeticiones',
    items: ['Círculos de cuello', 'Círculos de hombros adelante y atrás', 'Círculos de cadera', 'Círculos de rodillas', 'Círculos de tobillos'],
  },
  {
    grupo: 'Dinámico (5 min)',
    items: ['Marcha subiendo rodillas – 30 s', 'Balanceo de pierna adelante/atrás – 10 por pierna', 'Balanceo de pierna lateral – 10 por pierna', 'Zancadas con giro de tronco – 8 por pierna', 'Sentadillas lentas – 10', 'Talones al glúteo – 30 s', 'Skipping suave – 30 s'],
  },
  {
    grupo: 'Activación (2 min)',
    items: ['Elevación de talones – 15', 'Puente de glúteo – 10', 'Plancha – 20 s'],
  },
];

export const ENFRIAMIENTO = ['Pantorrillas', 'Cuádriceps', 'Isquiotibiales', 'Glúteo (figura 4)', 'Flexores de cadera', 'Espalda baja'];

// Ilustración de cada ejercicio (src/img/ejercicios/<nombre>.webp). Se busca por el inicio del texto.
const IMAGENES = [
  ['Círculos de cuello', 'cuello'], ['Círculos de hombros', 'hombros'], ['Círculos de cadera', 'cadera'],
  ['Círculos de rodillas', 'rodillas'], ['Círculos de tobillos', 'tobillos'],
  ['Marcha subiendo rodillas', 'marcha'], ['Balanceo de pierna adelante', 'balanceo-frontal'], ['Balanceo de pierna lateral', 'balanceo-lateral'],
  ['Zancadas con giro', 'zancadas-giro'], ['Sentadillas lentas', 'sentadillas'], ['Talones al glúteo', 'talones-gluteo'],
  ['Skipping', 'skipping'], ['Elevación de talones', 'elevacion-talones'], ['Puente de glúteo', 'puente-gluteo'], ['Plancha', 'plancha'],
  ['Pantorrillas', 'est-pantorrillas'], ['Cuádriceps', 'est-cuadriceps'], ['Isquiotibiales', 'est-isquiotibiales'],
  ['Glúteo (figura 4)', 'est-gluteo'], ['Flexores de cadera', 'est-flexores'], ['Espalda baja', 'est-espalda'],
];

export function imagenEjercicio(texto) {
  const f = IMAGENES.find(([inicio]) => texto.startsWith(inicio));
  return f ? `img/ejercicios/${f[1]}.webp` : null;
}

// ---------- Pista plana (8.2) ----------
export const PISTA = {
  1: { titulo: 'Intervalos en pista', km: 9, vueltas: '22–23' },
  2: { titulo: 'Caminata rápida / trote suave', km: 8.5, vueltas: '20–22', detalle: '8–9 km' },
  3: { titulo: 'Gradas o graderío 15–20 min + 5 km de trote', km: 5, vueltas: '12–13 + gradas', tipo: 'gradas' },
  4: { titulo: 'Suave', km: 7.5, vueltas: '18–20', detalle: '7–8 km' },
  5: { titulo: 'Series: 6–8 × 400 m rápido / 200 m caminando', km: 8, vueltas: '~20', tipo: 'series', detalle: 'Con calentamiento y enfriamiento (~8 km en total).' },
  6: { titulo: 'Larga continua', km: 10, vueltas: '25' },
};

export const ZONAS_MOLESTIA = ['Canilla', 'Rodilla', 'Tobillo', 'Pie', 'Cadera', 'Espalda', 'Otra'];

// ---------- Cálculos del plan ----------

export function semanaDelPlan(fecha, inicio) {
  const d = diasEntre(inicio, fecha);
  return d < 0 ? 0 : Math.floor(d / 7) + 1;
}

// km-esfuerzo = distancia + desnivel positivo / 100 (cada 100 m de subida ≈ 1 km plano)
export function kmEsfuerzo(distancia, desnivel) {
  if (distancia == null) return null;
  return distancia + (desnivel || 0) / 100;
}

// Qué toca un día: ruta, complemento, ayuno.
// terreno = { actual: 'montana' | 'plano', desde: 'AAAA-MM-DD' }; rutaPrincipal = ruta guardada por defecto
export function planDelDia(fecha, inicio, terreno, rutaPrincipal) {
  const semana = semanaDelPlan(fecha, inicio);
  const ds = diaSemana(fecha);
  const base = RUTINA[ds];
  const enPlano = terreno?.actual === 'plano' && terreno.desde && fecha >= terreno.desde;

  const plan = {
    fecha, semana, ds,
    antesDelPlan: semana < 1,
    descanso: ds === 0,
    ayuno: ayunoDelDia(semana, ds),
    ruta: null,
    complemento: null,
  };
  if (plan.antesDelPlan) return plan;

  if (!plan.descanso) {
    const ruta = { tipo: base.tipo, titulo: base.titulo, detalle: base.detalle || '', terreno: enPlano ? 'plano' : 'montana' };
    if (['intervalos', 'larga'].includes(base.tipo)) {
      ruta.intervalo = base.tipo === 'larga' && semana >= 9 ? 'Ruta completa trotando' : intervaloDeSemana(semana);
    }
    if (enPlano) {
      const adaptacion = diasEntre(terreno.desde, fecha) < 14;
      const p = PISTA[ds];
      if (adaptacion) {
        ruta.titulo = `${base.titulo} (adaptación a plano)`;
        ruta.metaKm = 8;
        ruta.vueltas = '20';
        ruta.detalle = 'Primeras 2 semanas en plano: 8 km todos los días. Cambia el sentido de giro cada cierto número de vueltas.';
      } else {
        ruta.titulo = p.titulo;
        ruta.tipo = p.tipo || base.tipo;
        ruta.metaKm = p.km;
        ruta.vueltas = p.vueltas;
        ruta.detalle = p.detalle || 'Cambia el sentido de giro cada cierto número de vueltas.';
      }
    } else {
      ruta.metaKm = rutaPrincipal?.distancia || 8;
      ruta.nombreRuta = rutaPrincipal?.nombre;
    }
    plan.ruta = ruta;
  }

  if (base.complemento) {
    const c = COMPLEMENTOS[base.complemento];
    plan.complemento = { tipo: base.complemento, nombre: c.nombre, formato: c.formato, ejercicios: ejerciciosDe(base.complemento, semana) };
  }
  return plan;
}

// ---------- Peso: meta y proyección (1.1) ----------

export const imc = (peso, estatura) => (peso && estatura ? peso / (estatura * estatura) : null);

// Meta sugerida: IMC 25 (el límite superior del peso saludable).
export const pesoMetaSugerido = (estatura) => (estatura ? Math.round(25 * estatura * estatura) : null);

// Ritmos: la 1.ª semana baja más (agua e hinchazón); después 0,7–1 kg por semana.
export const RITMOS = {
  ambiciosa: { primeraSemana: 2, porSemana: 0.85, nombre: 'Meta ambiciosa' },
  segura: { primeraSemana: 1.5, porSemana: 0.75, nombre: 'Ritmo seguro' },
};

// Proyección semanal (cada lunes) desde el inicio del plan hasta llegar a la meta.
export function proyeccion(pesoInicial, pesoMeta, inicio, ritmo) {
  const r = RITMOS[ritmo];
  const puntos = [{ fecha: inicio, peso: pesoInicial }];
  if (!pesoInicial || !pesoMeta || pesoInicial <= pesoMeta) return puntos;
  let peso = pesoInicial;
  let semana = 0;
  while (peso > pesoMeta && semana < 104) {
    semana++;
    peso = Math.max(pesoMeta, peso - (semana === 1 ? r.primeraSemana : r.porSemana));
    puntos.push({ fecha: sumarDias(inicio, semana * 7), peso: Math.round(peso * 10) / 10 });
  }
  return puntos;
}

// Peso proyectado en una fecha dada (interpolación lineal entre semanas).
export function pesoProyectadoEn(puntos, fecha) {
  if (!puntos.length) return null;
  if (fecha <= puntos[0].fecha) return puntos[0].peso;
  for (let i = 1; i < puntos.length; i++) {
    if (fecha <= puntos[i].fecha) {
      const t = diasEntre(puntos[i - 1].fecha, fecha) / diasEntre(puntos[i - 1].fecha, puntos[i].fecha);
      return puntos[i - 1].peso + t * (puntos[i].peso - puntos[i - 1].peso);
    }
  }
  return puntos.at(-1).peso;
}

export const HITOS_CARRERA = [
  { id: '10k', nombre: 'Primer 10K', km: 10, cuando: 'meses 3–4' },
  { id: 'media', nombre: 'Media maratón (21,1 km)', km: 21.1, cuando: 'meses 6–8' },
  { id: 'maraton', nombre: 'Maratón (42,2 km)', km: 42.2, cuando: '~12 meses' },
];
