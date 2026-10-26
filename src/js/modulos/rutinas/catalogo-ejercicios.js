import {
  GUIAS_VECTOR,
  guiaVector,
} from "../ilustraciones/guias/catalogo-svg.js";
export { guiaVector as fichaEjercicio } from "../ilustraciones/guias/catalogo-svg.js";
import { COMPLEMENTOS, ACTIVIDADES } from "./plan.js";
const extras = {
  ruta: [
    "Caminata suave",
    "Caminata rápida",
    "Trote suave",
    "Carrera continua",
    "Intervalos de caminata y trote",
    "Caminata en subida",
  ],
  cardio: [
    "Marcha activa",
    "Jumping jacks sin salto",
    "Paso lateral con brazos",
    "Boxeo de sombra",
    "Rodillas arriba",
    "Talones al glúteo",
    "Escaladores",
    "Burpee sin salto",
    "Salto de cuerda",
    "Step en escalón",
  ],
  casa: [
    "Sentadilla a silla",
    "Sentadilla",
    "Zancada atrás",
    "Puente de glúteos",
    "Flexiones en pared",
    "Flexiones con rodillas apoyadas",
    "Remo con mancuerna",
    "Peso muerto con mancuernas",
    "Elevación de talones",
    "Plancha frontal",
    "Dead bug",
    "Bird dog",
  ],
  pilates: [
    "Respiración lateral costal",
    "Basculación pélvica",
    "Hundred modificado",
    "Toe taps",
    "Single leg stretch",
    "Clamshell",
    "Elevación lateral de pierna",
    "Swimming de pilates",
    "Roll down",
    "Puente articulado",
    "Spine stretch",
    "Side kick",
  ],
  gimnasio: [
    "Press de banca",
    "Press inclinado con mancuernas",
    "Jalón al pecho",
    "Remo sentado en polea",
    "Prensa de piernas",
    "Sentadilla goblet",
    "Curl femoral",
    "Extensión de cuádriceps",
    "Hip thrust",
    "Press de hombros",
    "Elevaciones laterales",
    "Curl de bíceps",
    "Extensión de tríceps en polea",
    "Face pull",
    "Peso muerto rumano",
  ],
  crossfit: [
    "Sentadilla al aire",
    "Step-up",
    "Farmer carry",
    "Remo ergómetro",
    "Thruster con mancuernas",
    "Peso muerto con kettlebell",
    "Wall ball",
    "Cuerda de batalla",
  ],
  movilidad: [
    "Círculos de hombros adelante y atrás",
    "Círculos de cadera",
    "Círculos de tobillos",
    "Balanceo de pierna adelante/atrás",
    "Balanceo de pierna lateral",
    "Gato y vaca",
    "Rotación torácica",
    "Estiramiento de pectoral",
    "Estiramiento de flexores de cadera",
    "Glúteo en figura 4",
    "Postura del niño",
  ],
  ciclismo: [
    "Pedaleo suave",
    "Pedaleo continuo",
    "Pedaleo de recuperación",
    "Bicicleta estática",
    "Cadencia controlada",
    "Técnica de pedaleo",
  ],
  natacion: [
    "Técnica de respiración en piscina",
    "Nado libre",
    "Nado suave",
    "Patada con tabla",
    "Nado espalda",
    "Nado pecho",
    "Deslizamiento en piscina",
  ],
  deportes: [
    "Coordinación de pies",
    "Práctica de técnica deportiva",
    "Conducción de balón",
    "Pases de fútbol",
    "Lanzamientos de baloncesto",
    "Desplazamientos de tenis",
    "Recepción de voleibol",
  ],
};
export const CATALOGO_EJERCICIOS = ACTIVIDADES.map((a) => ({
  id: a.id,
  nombre: a.nombre,
  ejercicios: [
    ...new Set([
      ...(extras[a.id] || []),
      ...GUIAS_VECTOR.filter((g) => g.categorias.includes(a.id)).flatMap(
        (g) => g.nombres,
      ),
      ...Object.values(COMPLEMENTOS)
        .filter((r) => r.actividad === a.id)
        .flatMap((r) => (r.ejercicios || []).map((e) => e.nombre)),
    ]),
  ],
}));
export function ejerciciosCatalogo(categoria = "", actividades = []) {
  const grupos = CATALOGO_EJERCICIOS.filter((g) =>
    categoria
      ? g.id === categoria
      : !actividades.length ||
        actividades.includes(g.id) ||
        g.id === "movilidad",
  );
  return [...new Set(grupos.flatMap((g) => g.ejercicios))];
}
