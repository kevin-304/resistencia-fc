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

// ---------- Complementos de fuerza (intensidad alta, progresiva) ----------
// Cada ejercicio tiene series y valor sugeridos por FASE del plan:
//   fase 1 = semanas 1–2 · fase 2 = semanas 3–4 · fase 3 = semanas 5–8 · fase 4 = semana 9 en adelante
// unidad: 'reps' (repeticiones) o 's' (segundos). lado: el valor es por lado / pierna / brazo.
export function faseDeSemana(semana) {
  if (semana <= 2) return 0;
  if (semana <= 4) return 1;
  if (semana <= 8) return 2;
  return 3;
}

const ej = (id, nombre, series, valor, extra = {}) => ({ id, nombre, series, valor, unidad: 'reps', ...extra });
const seg = (id, nombre, series, valor, extra = {}) => ({ id, nombre, series, valor, unidad: 's', ...extra });

export const COMPLEMENTOS = {
  superior: {
    nombre: 'Tren superior + abdomen', formato: 'Descanso de 45 s entre series · mancuernas de 10 lb', usaPeso: true, finalizador: true,
    ejercicios: [
      ej('flexiones', 'Flexiones', [4, 4, 4, 5], [12, 15, 18, 20], { nota: 'Con rodillas apoyadas si no salen completas' }),
      ej('remo', 'Remo con mancuerna', [4, 4, 4, 4], [15, 15, 18, 20], { lado: true }),
      ej('fondos', 'Fondos de tríceps en silla', [4, 4, 4, 4], [12, 15, 18, 20]),
      ej('press', 'Press de hombro con mancuernas', [4, 4, 4, 4], [12, 15, 15, 18]),
      ej('curl', 'Curl de bíceps con mancuernas', [3, 3, 4, 4], [15, 15, 15, 18]),
      ej('remo-alto', 'Remo alto con mancuernas', [3, 3, 3, 4], [12, 15, 15, 15]),
    ],
  },
  core: {
    nombre: 'Core y abdomen intenso', formato: 'Descanso de 30 s entre series',
    ejercicios: [
      seg('plancha', 'Plancha frontal', [4, 4, 4, 4], [40, 45, 50, 60]),
      seg('plancha-lat', 'Plancha lateral', [3, 3, 4, 4], [25, 30, 35, 45], { lado: true }),
      ej('crunch-bici', 'Crunch bicicleta', [4, 4, 4, 4], [20, 25, 30, 30], { lado: true }),
      ej('elev-piernas', 'Elevación de piernas acostado', [4, 4, 4, 4], [12, 15, 18, 20]),
      ej('dead-bug', 'Dead bug', [3, 3, 4, 4], [12, 12, 15, 15], { lado: true }),
      ej('escaladores', 'Escaladores (mountain climbers)', [4, 4, 4, 4], [30, 40, 45, 50], { lado: true }),
      ej('superman', 'Superman', [3, 3, 3, 4], [15, 15, 20, 20]),
    ],
  },
  inferior: {
    nombre: 'Tren inferior + abdomen', formato: 'Descanso de 45 s entre series', finalizador: true,
    ejercicios: [
      ej('sentadillas', 'Sentadillas', [4, 4, 4, 5], [20, 25, 25, 30], { desdeFase: [2, 'Sentadillas con salto'] }),
      ej('zancadas', 'Zancadas alternas', [4, 4, 4, 4], [12, 12, 15, 15], { lado: true }),
      ej('puente', 'Puente de glúteo', [4, 4, 4, 4], [20, 25, 25, 30]),
      ej('step-ups', 'Step-ups en banca o grada', [3, 4, 4, 4], [12, 12, 15, 15], { lado: true }),
      seg('isometrica', 'Sentadilla isométrica en pared', [3, 3, 3, 4], [30, 40, 45, 60]),
      ej('talones', 'Elevación de talones', [4, 4, 4, 4], [25, 30, 30, 35]),
    ],
  },
  estiramientos: {
    nombre: 'Estiramientos + abdomen', formato: 'Recuperación: 30 s por zona, sin rebotes', finalizador: true,
    ejercicios: [
      seg('e-pantorrillas', 'Pantorrillas', [1, 1, 1, 1], [30, 30, 30, 30], { lado: true }),
      seg('e-cuadriceps', 'Cuádriceps', [1, 1, 1, 1], [30, 30, 30, 30], { lado: true }),
      seg('e-isquios', 'Isquiotibiales', [1, 1, 1, 1], [30, 30, 30, 30], { lado: true }),
      seg('e-gluteo', 'Glúteo (figura 4)', [1, 1, 1, 1], [30, 30, 30, 30], { lado: true }),
      seg('e-flexores', 'Flexores de cadera', [1, 1, 1, 1], [30, 30, 30, 30], { lado: true }),
      seg('e-espalda', 'Espalda baja', [1, 1, 1, 1], [30, 30, 30, 30]),
    ],
  },
  cardio: {
    nombre: 'Circuito HIIT cuerpo completo + abdomen', formato: 'Ejercicios seguidos con 20 s de descanso · 1 min entre vueltas', finalizador: true,
    ejercicios: [
      seg('jacks', 'Jumping jacks', [4, 4, 5, 5], [40, 40, 45, 45]),
      seg('climbers', 'Escaladores (mountain climbers)', [4, 4, 5, 5], [40, 40, 45, 45]),
      seg('sentadilla-rapida', 'Sentadilla rápida', [4, 4, 5, 5], [40, 40, 45, 45], { desdeFase: [2, 'Sentadilla con salto'] }),
      seg('burpee', 'Burpee sin salto', [4, 4, 5, 5], [40, 40, 45, 45], { desdeFase: [2, 'Burpee con salto'] }),
      seg('rodillas-arriba', 'Rodillas arriba (skipping rápido)', [4, 4, 5, 5], [40, 40, 45, 45]),
      seg('plancha-toques', 'Plancha con toque de hombros', [4, 4, 5, 5], [40, 40, 45, 45]),
    ],
  },

  // ----- Pilates y postura -----
  'pilates-core': {
    actividad: 'pilates', nombre: 'Pilates: core y postura',
    formato: 'En esterilla, lento y controlado · exhala en el esfuerzo · ombligo hacia la columna · 30 s de descanso',
    ejercicios: [
      ej('cien', 'The Hundred (los cien)', [1, 1, 1, 1], [50, 70, 100, 100], { nota: 'Boca arriba, piernas en mesa, cabeza y hombros despegados; bombea los brazos 5 veces al inhalar y 5 al exhalar' }),
      ej('roll-up', 'Roll up (enrollarse vértebra a vértebra)', [2, 2, 3, 3], [6, 8, 10, 10], { nota: 'Si cuesta, dobla las rodillas o ayúdate con las manos en los muslos' }),
      ej('una-pierna', 'Estiramiento de una pierna', [2, 3, 3, 3], [8, 10, 12, 12], { lado: true, nota: 'Abdomen activo, espalda baja pegada al suelo' }),
      ej('criss-cross', 'Criss-cross (oblicuos)', [2, 3, 3, 3], [8, 10, 12, 15], { lado: true, nota: 'Gira desde las costillas, no tires del cuello' }),
      ej('cisne', 'Cisne (extensión de espalda)', [2, 3, 3, 3], [8, 10, 12, 12], { nota: 'Boca abajo, sube el pecho mirando al suelo y baja los hombros lejos de las orejas: corrige la espalda encorvada' }),
      seg('natacion', 'Natación (swimming)', [2, 3, 3, 3], [20, 30, 40, 45], { nota: 'Boca abajo, brazo y pierna contrarios suben a la vez, cuello largo' }),
      seg('plancha-pil', 'Plancha en antebrazos', [2, 3, 3, 3], [20, 30, 40, 45], { nota: 'Con rodillas apoyadas las primeras semanas si hace falta' }),
    ],
  },
  'pilates-gluteos': {
    actividad: 'pilates', nombre: 'Pilates: glúteos, piernas y espalda', formato: 'En esterilla · controla la bajada · 30 s de descanso',
    ejercicios: [
      ej('puente-pil', 'Puente de hombros', [3, 3, 3, 4], [10, 12, 15, 15], { nota: 'Sube vértebra a vértebra y aprieta glúteos arriba 2 s' }),
      ej('patada-lateral', 'Elevación lateral de pierna acostada', [2, 3, 3, 3], [10, 12, 15, 15], { lado: true }),
      ej('almeja', 'Almeja (clamshell)', [2, 3, 3, 3], [12, 15, 15, 20], { lado: true, nota: 'De lado, rodillas dobladas; abre la rodilla sin mover la cadera' }),
      ej('patada-glute', 'Patada de glúteo en cuatro apoyos', [2, 3, 3, 3], [10, 12, 15, 15], { lado: true }),
      ej('bird-dog', 'Bird dog (brazo y pierna contrarios)', [2, 3, 3, 3], [8, 10, 12, 12], { lado: true, nota: 'Espalda recta como una mesa: fortalece la postura' }),
      ej('sentadilla-pil', 'Sentadilla lenta con pausa', [2, 3, 3, 3], [10, 12, 15, 15], { nota: 'Baja en 3 segundos, pausa 1 s abajo, pecho erguido' }),
      seg('natacion-2', 'Natación (swimming)', [2, 2, 3, 3], [20, 30, 40, 45]),
    ],
  },
  postura: {
    actividad: 'pilates', nombre: 'Postura y movilidad (10–15 min)', formato: 'Suave, sin dolor · ideal también al terminar el día después de estar sentada',
    ejercicios: [
      ej('retraccion', 'Juntar omóplatos (retracción escapular)', [2, 3, 3, 3], [12, 15, 15, 20], { nota: 'Sentada o de pie: lleva los hombros atrás y abajo, sostén 2 s' }),
      ej('angeles', 'Ángeles en la pared', [2, 3, 3, 3], [8, 10, 12, 12], { nota: 'Espalda, cabeza y brazos tocando la pared; sube y baja los brazos despacio' }),
      ej('menton', 'Mentón hacia atrás (doble mentón)', [2, 3, 3, 3], [10, 12, 15, 15], { nota: 'Corrige la cabeza adelantada al estar sentada' }),
      ej('gato-vaca', 'Gato–vaca', [2, 2, 3, 3], [8, 10, 10, 12]),
      seg('cobra', 'Cobra suave (extensión torácica)', [2, 2, 3, 3], [20, 30, 30, 40]),
      seg('pecho', 'Estiramiento de pecho en el marco de una puerta', [2, 2, 2, 2], [20, 30, 30, 30], { lado: true }),
    ],
  },
  'cardio-suave': {
    actividad: 'cardio', nombre: 'Cardio suave en casa (bajo impacto)', formato: 'Sin saltos · ritmo en el que puedas hablar · 30–60 s de pausa entre series',
    ejercicios: [
      seg('marcha', 'Marcha en el sitio subiendo rodillas', [3, 3, 4, 4], [60, 90, 120, 120]),
      seg('step-touch', 'Paso lateral con brazos (step touch)', [3, 3, 4, 4], [45, 60, 60, 90]),
      seg('jacks-suave', 'Jumping jacks sin salto', [2, 3, 3, 4], [30, 40, 45, 60], { nota: 'Un pie sale al lado y los brazos suben, sin saltar' }),
      seg('boxeo', 'Boxeo de sombra', [2, 3, 3, 4], [30, 40, 45, 60]),
      seg('rodilla-codo', 'Rodilla al codo contrario de pie', [2, 3, 3, 4], [30, 40, 45, 60]),
    ],
  },

  // ----- Gimnasio (ganar músculo): empuje / tirón / piernas -----
  'gym-empuje': {
    actividad: 'gimnasio', nombre: 'Gimnasio: pecho, hombros y tríceps', usaPeso: true,
    formato: 'Elige un peso con el que las 2 últimas repeticiones cuesten · 90 s de descanso · sube el peso cuando completes todas las series',
    ejercicios: [
      ej('banca', 'Press de banca con barra', [3, 4, 4, 4], [10, 10, 8, 8]),
      ej('inclinado', 'Press inclinado con mancuernas', [3, 3, 4, 4], [12, 10, 10, 8]),
      ej('militar', 'Press militar', [3, 3, 4, 4], [10, 10, 8, 8]),
      ej('laterales', 'Elevaciones laterales', [3, 3, 4, 4], [15, 12, 12, 12]),
      ej('fondos-gym', 'Fondos en paralelas (o en máquina)', [3, 3, 3, 4], [10, 10, 12, 12]),
      ej('triceps-polea', 'Extensión de tríceps en polea', [3, 3, 4, 4], [12, 12, 10, 10]),
    ],
  },
  'gym-tiron': {
    actividad: 'gimnasio', nombre: 'Gimnasio: espalda y bíceps', usaPeso: true,
    formato: 'Peso exigente con buena técnica · 90 s de descanso',
    ejercicios: [
      ej('jalon', 'Jalón al pecho', [3, 4, 4, 4], [12, 10, 10, 8]),
      ej('remo-barra', 'Remo con barra', [3, 4, 4, 4], [10, 10, 8, 8]),
      ej('remo-polea', 'Remo en polea baja', [3, 3, 4, 4], [12, 12, 10, 10]),
      ej('face-pull', 'Face pull', [3, 3, 3, 4], [15, 15, 15, 12]),
      ej('curl-barra', 'Curl con barra', [3, 3, 4, 4], [12, 10, 10, 8]),
      ej('martillo', 'Curl martillo', [3, 3, 3, 4], [12, 12, 12, 10]),
    ],
  },
  'gym-piernas': {
    actividad: 'gimnasio', nombre: 'Gimnasio: piernas y core', usaPeso: true,
    formato: 'Calienta con series ligeras · 2 min de descanso en los básicos',
    ejercicios: [
      ej('sentadilla-barra', 'Sentadilla con barra', [3, 4, 4, 4], [10, 10, 8, 8]),
      ej('rumano', 'Peso muerto rumano', [3, 3, 4, 4], [10, 10, 8, 8]),
      ej('prensa', 'Prensa de piernas', [3, 3, 4, 4], [12, 12, 10, 10]),
      ej('femoral', 'Curl femoral', [3, 3, 4, 4], [12, 12, 10, 10]),
      ej('cuadriceps', 'Extensión de cuádriceps', [3, 3, 3, 4], [12, 12, 12, 10]),
      ej('gemelos', 'Elevación de talones de pie', [3, 4, 4, 4], [15, 15, 12, 12]),
      seg('plancha-gym', 'Plancha', [3, 3, 3, 3], [30, 40, 45, 60]),
    ],
  },

  // ----- CrossFit / funcional (series = rondas) -----
  'wod-a': {
    actividad: 'crossfit', nombre: 'WOD A: cuerpo completo', formato: 'Cada serie es una ronda: hazla seguida y con buena técnica · 1 min de descanso entre rondas',
    ejercicios: [
      ej('burpees', 'Burpees', [3, 4, 5, 5], [8, 10, 12, 15]),
      ej('swings', 'Kettlebell swings (o con mancuerna)', [3, 4, 5, 5], [12, 15, 15, 20]),
      ej('air-squat', 'Air squats', [3, 4, 5, 5], [15, 20, 20, 25]),
      ej('push-ups', 'Push-ups', [3, 4, 5, 5], [8, 10, 12, 15]),
      ej('sit-ups', 'Sit-ups', [3, 4, 5, 5], [12, 15, 20, 20]),
    ],
  },
  'wod-b': {
    actividad: 'crossfit', nombre: 'WOD B: potencia', formato: 'Rondas seguidas · 1 min entre rondas',
    ejercicios: [
      ej('thrusters', 'Thrusters con mancuernas', [3, 4, 4, 5], [10, 10, 12, 12]),
      ej('box-jumps', 'Box jumps (o step-ups rápidos)', [3, 4, 4, 5], [10, 12, 12, 15]),
      ej('wall-balls', 'Wall balls (o sentadilla con lanzamiento)', [3, 4, 4, 5], [12, 15, 15, 20]),
      ej('remo-renegado', 'Remo renegado', [3, 3, 4, 4], [8, 10, 10, 12], { lado: true }),
      seg('hollow', 'Hollow hold', [3, 3, 4, 4], [20, 30, 30, 40]),
    ],
  },
  'wod-c': {
    actividad: 'crossfit', nombre: 'WOD C: metabólico', formato: 'Rondas seguidas, ritmo alto pero constante · 1 min entre rondas',
    ejercicios: [
      seg('cuerda', 'Saltos de cuerda (o simulados)', [3, 4, 4, 5], [45, 60, 60, 90]),
      ej('lunges-peso', 'Zancadas con peso', [3, 4, 4, 5], [10, 12, 12, 14], { lado: true }),
      ej('push-press', 'Push press con mancuernas', [3, 4, 4, 5], [10, 10, 12, 12]),
      ej('climbers-wod', 'Mountain climbers', [3, 4, 4, 5], [20, 25, 30, 30], { lado: true }),
      seg('plancha-wod', 'Plancha', [3, 3, 4, 4], [30, 40, 45, 60]),
    ],
  },
};

// A qué actividad pertenece cada rutina del plan original.
Object.assign(COMPLEMENTOS.superior, { actividad: 'casa' });
Object.assign(COMPLEMENTOS.core, { actividad: 'casa' });
Object.assign(COMPLEMENTOS.inferior, { actividad: 'casa' });
Object.assign(COMPLEMENTOS.estiramientos, { actividad: 'movilidad' });
Object.assign(COMPLEMENTOS.cardio, { actividad: 'cardio' });

// ---------- Actividades que una persona elige al crear su perfil ----------
export const ACTIVIDADES = [
  { id: 'ruta', nombre: 'Ruta: correr, trotar o caminar', emoji: '🏃', desc: 'Salidas al aire libre con progresión de intervalos' },
  { id: 'cardio', nombre: 'Cardio y HIIT', emoji: '🔥', desc: 'Circuitos para quemar grasa y mejorar la condición' },
  { id: 'casa', nombre: 'Fuerza en casa', emoji: '🏠', desc: 'Peso corporal y mancuernas: tren superior, inferior y core' },
  { id: 'pilates', nombre: 'Pilates y postura', emoji: '🧘', desc: 'Core, glúteos, espalda y postura en esterilla' },
  { id: 'gimnasio', nombre: 'Gimnasio (ganar músculo)', emoji: '🏋️', desc: 'Empuje / tirón / piernas con pesas y máquinas' },
  { id: 'crossfit', nombre: 'CrossFit / funcional', emoji: '⚡', desc: 'WODs por rondas de alta intensidad' },
  { id: 'movilidad', nombre: 'Yoga / estiramientos', emoji: '🌿', desc: 'Movilidad y recuperación' },
];

// Qué rutina toca cada día (1 = lunes … 6 = sábado) según la actividad.
const SEMANA_POR_ACTIVIDAD = {
  casa: { 1: 'superior', 2: 'core', 3: 'inferior', 5: 'core', 6: 'core' },
  cardio: { 2: 'cardio', 4: 'cardio', 5: 'cardio' },
  pilates: { 1: 'pilates-core', 2: 'postura', 3: 'pilates-gluteos', 4: 'postura', 5: 'pilates-core', 6: 'pilates-gluteos' },
  gimnasio: { 1: 'gym-empuje', 2: 'gym-tiron', 3: 'gym-piernas', 4: 'gym-empuje', 5: 'gym-tiron', 6: 'gym-piernas' },
  crossfit: { 1: 'wod-a', 3: 'wod-b', 5: 'wod-c' },
  movilidad: { 4: 'estiramientos', 6: 'postura' },
};

// Finalizador abdominal: se añade los días que no son de core (lunes, miércoles, jueves y viernes).
export const FINALIZADOR = {
  nombre: 'Finalizador abdominal', formato: 'Seguido, casi sin pausa · 30 s entre series',
  ejercicios: [
    ej('f-crunch', 'Crunch abdominal', [3, 3, 3, 4], [20, 25, 30, 30]),
    ej('f-piernas', 'Elevación de piernas acostado', [3, 3, 3, 4], [12, 15, 18, 20]),
    ej('f-giros', 'Giros rusos', [3, 3, 3, 4], [15, 20, 20, 25], { lado: true }),
    seg('f-plancha', 'Plancha frontal', [3, 3, 3, 3], [30, 40, 45, 60]),
  ],
};

export const TIPOS_COMPLEMENTO = Object.entries(COMPLEMENTOS).map(([id, c]) => ({ id, nombre: c.nombre }));

export const textoMeta = (e) => `${e.series} × ${e.valor}${e.unidad === 's' ? ' s' : ''}${e.lado ? ' por lado' : ''}`;

// Ejercicios sugeridos para un tipo de complemento en una semana del plan:
// [{ id, nombre, series, valor, unidad, lado, bloque ('principal' | 'abdomen'), meta }]
// pu = plan del perfil: quita los ejercicios desactivados, usa rutinas propias y el interruptor del finalizador.
export function ejerciciosDe(tipo, semana, pu = null) {
  const c = rutinaDe(tipo, pu);
  if (!c) return [];
  const f = faseDeSemana(Math.max(1, semana || 1));
  const fuera = new Set(pu?.desactivados?.[tipo] || []);
  const fueraFin = new Set(pu?.desactivados?.finalizador || []);
  const valorFase = (v) => (Array.isArray(v) ? v[f] : v);
  const armar = (e, bloque) => {
    const x = {
      id: e.id, bloque, unidad: e.unidad || 'reps', lado: !!e.lado, nota: e.nota || '',
      nombre: e.desdeFase && f >= e.desdeFase[0] ? e.desdeFase[1] : e.nombre,
      series: Number(valorFase(e.series)) || 1, valor: Number(valorFase(e.valor)) || 1,
    };
    x.meta = textoMeta(x);
    return x;
  };
  const lista = c.ejercicios.filter((e) => !fuera.has(e.id)).map((e) => armar(e, 'principal'));
  const conFinalizador = c.finalizador && (pu ? pu.finalizador !== false : true);
  if (conFinalizador) lista.push(...FINALIZADOR.ejercicios.filter((e) => !fueraFin.has(e.id)).map((e) => armar(e, 'abdomen')));
  return lista;
}

// Cuánto se hizo: registro = { idEjercicio: [valor de la serie 1, serie 2, …] }
export function resumenComplemento(ejercicios, registro = {}) {
  let sugerido = 0;
  let hecho = 0;
  let reps = 0;
  let segundos = 0;
  let completos = 0;
  let conDatos = 0;
  for (const e of ejercicios) {
    const valores = (registro[e.id] || []).map(Number).filter((v) => v > 0);
    const lados = e.lado ? 2 : 1;
    const total = valores.reduce((a, b) => a + b, 0) * lados;
    const meta = e.series * e.valor * lados;
    sugerido += meta;
    hecho += Math.min(total, meta);
    if (e.unidad === 's') segundos += total; else reps += total;
    if (valores.length) conDatos++;
    if (valores.length >= e.series) completos++;
  }
  return { reps, segundos, completos, conDatos, total: ejercicios.length, porcentaje: sugerido ? Math.round((hecho / sugerido) * 100) : 0 };
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

// ---------- Plan de cada perfil (editable en "Mi plan") ----------
// El plan sugerido reproduce el documento original; el plan en blanco no trae nada activado.

export const ALIMENTOS_SUGERIDOS = [
  { id: 'guineo', nombre: 'Guineo', emoji: '🍌', max: 2, nota: '1 al día, 2 en días fuertes' },
  { id: 'naranja', nombre: 'Naranja / mandarina', emoji: '🍊', max: null, nota: '2–3 al día' },
  { id: 'otra', nombre: 'Otra fruta', emoji: '🍎', max: null, nota: '' },
];

export const METAS_SUGERIDAS = { aguaVasos: 10, suenoHoras: 7, kcalMin: 1500, kcalMax: 1900 };

export function planSugerido() {
  const semana = {};
  for (const ds of [0, 1, 2, 3, 4, 5, 6]) {
    const r = RUTINA[ds];
    semana[ds] = {
      ruta: { activa: ds !== 0, tipo: ds === 0 ? 'ligera' : r.tipo, titulo: ds === 0 ? '' : r.titulo, detalle: ds === 0 ? '' : r.detalle || '', metaKm: null },
      complemento: r.complemento,
    };
  }
  return {
    version: 1,
    semana,
    intervalos: true,
    calentamiento: true,
    finalizador: true,
    ayuno: { activo: true, gradual: true, ventana: ['10:00', '18:00'], domingo: { activo: true, ventana: ['08:00', '19:00'] } },
    rutinas: {},
    desactivados: {},
    alimentos: structuredClone(ALIMENTOS_SUGERIDOS),
    metas: { ...METAS_SUGERIDAS },
  };
}

export function planVacio() {
  const p = planSugerido();
  for (const ds of Object.keys(p.semana)) p.semana[ds] = { ruta: { activa: false, tipo: 'otra', titulo: '', detalle: '', metaKm: null }, complemento: null };
  return { ...p, intervalos: false, calentamiento: false, finalizador: false, ayuno: { ...p.ayuno, activo: false }, alimentos: [] };
}

export const ALIMENTOS_GENERICOS = [
  { id: 'fruta', nombre: 'Fruta', emoji: '🍎', max: null, nota: '2–3 al día' },
  { id: 'verdura', nombre: 'Porción de verduras', emoji: '🥦', max: null, nota: '3 o más al día' },
  { id: 'proteina', nombre: 'Porción de proteína', emoji: '🍗', max: null, nota: 'en cada comida' },
  { id: 'dulce', nombre: 'Dulces / postres', emoji: '🍰', max: 1, nota: 'máximo 1 al día' },
];

// Arma un plan a partir de las actividades elegidas (lista de ids de ACTIVIDADES).
export function planDesdeActividades(actividades = [], { ayuno = false } = {}) {
  const set = new Set(actividades);
  const sugerido = planSugerido();
  let p;
  // Ruta + cardio + fuerza en casa = exactamente el plan original de Resistencia f'c.
  if (set.has('casa') && set.has('cardio') && [...set].every((a) => ['ruta', 'casa', 'cardio'].includes(a))) {
    p = sugerido;
    if (!set.has('ruta')) for (const ds of [1, 2, 3, 4, 5, 6]) p.semana[ds].ruta.activa = false;
  } else {
    p = planVacio();
    const otras = ACTIVIDADES.map((a) => a.id).filter((a) => a !== 'ruta' && set.has(a));
    for (const ds of [1, 2, 3, 4, 5, 6]) {
      const opciones = otras.map((a) => SEMANA_POR_ACTIVIDAD[a]?.[ds]).filter(Boolean);
      p.semana[ds].complemento = opciones.length ? opciones[ds % opciones.length] : null;
      if (set.has('ruta')) p.semana[ds].ruta = { ...sugerido.semana[ds].ruta };
    }
    p.calentamiento = ['ruta', 'casa', 'cardio', 'gimnasio', 'crossfit'].some((a) => set.has(a));
    p.finalizador = set.has('casa') || set.has('cardio');
    p.alimentos = structuredClone(ALIMENTOS_GENERICOS);
  }
  p.intervalos = set.has('ruta');
  p.actividades = [...set];
  p.ayuno = { ...sugerido.ayuno, activo: !!ayuno };
  return p;
}

// Completa lo que falte con el plan sugerido (perfiles antiguos no tienen "plan").
export function normalizarPlan(p) {
  const base = planSugerido();
  if (!p) return base;
  const r = { ...base, ...p };
  r.semana = {};
  for (const ds of [0, 1, 2, 3, 4, 5, 6]) {
    const d = p.semana?.[ds] || base.semana[ds];
    r.semana[ds] = { ...base.semana[ds], ...d, ruta: { ...base.semana[ds].ruta, ...(d.ruta || {}) } };
  }
  r.ayuno = { ...base.ayuno, ...(p.ayuno || {}), domingo: { ...base.ayuno.domingo, ...(p.ayuno?.domingo || {}) } };
  r.metas = { ...base.metas, ...(p.metas || {}) };
  r.rutinas = p.rutinas || {};
  r.desactivados = p.desactivados || {};
  r.alimentos = Array.isArray(p.alimentos) ? p.alimentos : base.alimentos;
  return r;
}

const aMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const aHora = (m) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

// Ayuno de un día según el plan del perfil.
export function ayunoConPlan(semana, ds, pu) {
  const a = pu.ayuno;
  if (semana < 1 || !a?.activo) return null;
  const armar = (ventana, texto, flexible = false) => {
    const horasVentana = (aMin(ventana[1]) - aMin(ventana[0]) + 1440) % 1440 / 60;
    const horas = Math.round((24 - horasVentana) * 10) / 10;
    return { protocolo: `${horas}:${Math.round((24 - horas) * 10) / 10}`, horas, ventana, texto, flexible };
  };
  if (ds === 0 && a.domingo?.activo) {
    // Domingo flexible: la meta es solo 12 h (con 12–14 h está bien).
    const d = armar(a.domingo.ventana, 'Domingo flexible: se relaja el horario, no el tipo de comida.', true);
    return { ...d, horas: Math.min(12, d.horas), protocolo: '12–14 h' };
  }
  const [ini, fin] = a.ventana;
  // Entrada gradual: semana 1 ventana 3 h antes y 1 h después; semana 2, 2 h antes.
  if (a.gradual && semana === 1) return armar([aHora(aMin(ini) - 180), aHora(aMin(fin) + 60)], 'Semana 1 de entrada gradual.');
  if (a.gradual && semana === 2) return armar([aHora(aMin(ini) - 120), fin], 'Semana 2 de entrada gradual.');
  const n = armar([ini, fin], '');
  n.texto = `No alargues el ayuno más de ${n.horas} h.`;
  return n;
}

// Rutinas disponibles para el selector: las sugeridas + las creadas por la persona.
// Si el perfil eligió actividades, solo se ofrecen las rutinas de esas actividades (más las propias).
export function tiposComplemento(pu) {
  const propias = Object.entries(pu?.rutinas || {}).map(([id, r]) => ({ id, nombre: `${r.nombre} (mía)` }));
  const act = pu?.actividades?.length ? new Set([...pu.actividades, 'movilidad']) : null;
  const usadas = new Set(Object.values(pu?.semana || {}).map((d) => d.complemento));
  const sugeridas = TIPOS_COMPLEMENTO.filter((t) => !act || act.has(COMPLEMENTOS[t.id].actividad) || usadas.has(t.id));
  return [...sugeridas, ...propias];
}

export function rutinaDe(tipo, pu) {
  return COMPLEMENTOS[tipo] || pu?.rutinas?.[tipo] || null;
}

// Qué toca un día: ruta, complemento, ayuno.
// terreno = { actual: 'montana' | 'plano', desde: 'AAAA-MM-DD' }; rutaPrincipal = ruta guardada por defecto
// pu = plan del perfil (si no se pasa, el plan sugerido)
export function planDelDia(fecha, inicio, terreno, rutaPrincipal, pu = planSugerido()) {
  const semana = semanaDelPlan(fecha, inicio);
  const ds = diaSemana(fecha);
  const dia = pu.semana[ds];
  const base = { ...dia.ruta, complemento: dia.complemento };
  const enPlano = terreno?.actual === 'plano' && terreno.desde && fecha >= terreno.desde;

  const plan = {
    fecha, semana, ds,
    antesDelPlan: semana < 1,
    descanso: !dia.ruta.activa && !rutinaDe(dia.complemento, pu),
    ayuno: ayunoConPlan(semana, ds, pu),
    calentamiento: !!pu.calentamiento,
    ruta: null,
    complemento: null,
  };
  if (plan.antesDelPlan) return plan;

  if (dia.ruta.activa) {
    const ruta = { tipo: base.tipo, titulo: base.titulo || nombreTipo(base.tipo), detalle: base.detalle || '', terreno: enPlano ? 'plano' : (rutaPrincipal?.terreno === 'plano' ? 'plano' : rutaPrincipal?.terreno === 'mixto' ? 'mixto' : 'montana') };
    if (pu.intervalos && ['intervalos', 'larga'].includes(base.tipo)) {
      ruta.intervalo = base.tipo === 'larga' && semana >= 9 ? 'Ruta completa trotando' : intervaloDeSemana(semana);
    }
    if (enPlano) {
      const adaptacion = diasEntre(terreno.desde, fecha) < 14;
      const p = PISTA[ds] || PISTA[4];
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
      ruta.metaKm = base.metaKm || rutaPrincipal?.distancia || 8;
      ruta.nombreRuta = rutaPrincipal?.nombre;
    }
    plan.ruta = ruta;
  }

  const c = rutinaDe(base.complemento, pu);
  if (c) {
    plan.complemento = { tipo: base.complemento, nombre: c.nombre, formato: c.formato || '', ejercicios: ejerciciosDe(base.complemento, semana, pu) };
  }
  return plan;
}

// Texto corto de lo que toca un día ("Caminata · Pilates", "Descanso"…)
export function resumenPlan(plan) {
  if (!plan || plan.antesDelPlan) return '';
  if (plan.descanso) return 'Descanso';
  return [plan.ruta?.titulo, plan.complemento?.nombre].filter(Boolean).join(' · ');
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
