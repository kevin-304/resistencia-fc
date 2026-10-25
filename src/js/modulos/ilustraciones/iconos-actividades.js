// Pictogramas dibujados en SVG: contornos continuos y poses específicas.
// Se conservan las mismas proporciones y el mismo peso visual en toda la serie.
const linea = (d, w = 6) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cabeza = (x, y, r = 6.5) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const dibujos = {
  ruta: () =>
    cabeza(58, 13) +
    `<path d="M48 23Q51 20 56 24L63 37L73 31Q77 29 78 33Q79 35 76 37L63 45Q60 47 58 43L54 37L50 49L62 60Q64 62 65 66L72 85Q73 89 69 90Q65 91 63 86L56 68L43 58Q39 55 41 49L46 32L38 35L36 47Q36 51 32 50Q29 50 30 46L32 30Q32 27 36 26Z"/>` +
    linea("M44 57L36 70L18 66", 8),
  cardio: () =>
    cabeza(46, 12) +
    `<path d="M41 23Q46 19 51 24Q55 30 54 40L50 50Q48 55 42 54Q36 53 37 46L39 34L34 39L31 51Q30 55 27 54Q24 53 25 49L28 34Q29 31 33 28Z"/>` +
    linea("M51 29L58 38L64 20", 6) +
    linea("M46 53L49 67L44 83L48 88", 7) +
    linea("M49 51L63 45L63 63L69 67", 8),
  casa: () =>
    cabeza(51, 22) +
    `<path d="M43 33Q47 30 52 33L58 37L72 38Q76 38 76 41Q76 44 72 44L53 43L49 53Q47 58 40 58L49 59Q55 60 54 66L47 79L55 82Q57 85 53 86L42 85Q37 84 39 79L45 66L33 65Q27 64 28 58Q28 53 33 46L37 37Q39 33 43 33Z"/>` +
    linea("M49 38L65 40L80 39", 5) +
    linea("M41 62L59 62L54 76L62 80", 6),
  pilates: () =>
    cabeza(61, 17, 6) +
    `<path d="M54 27Q58 23 63 28L62 39Q60 45 53 48L48 55L48 81L53 85Q55 87 51 88H44Q41 88 41 84L40 57L33 52L14 51Q8 51 7 47Q7 44 12 44L34 46L46 37L49 29Z"/>` +
    linea("M53 29L37 28L19 24", 4) +
    linea("M59 30L73 32L88 30", 4),
  gimnasio: () =>
    cabeza(47, 13) +
    `<path d="M38 24Q47 20 55 25Q59 28 58 34L56 52L59 84Q60 89 55 90Q51 90 51 85L47 60L43 85Q42 90 38 89Q34 89 35 84L39 51L38 35L35 43L35 59Q35 63 31 62Q28 62 28 58L29 39Q31 27 38 24Z"/>` +
    linea("M55 29L63 39L67 25", 6) +
    linea("M61 24H78", 3) +
    `<rect x="61" y="18" width="4" height="12" rx="1.5"/><rect x="73" y="18" width="4" height="12" rx="1.5"/>`,
  crossfit: () =>
    cabeza(48, 36, 6) +
    `<path d="M40 46Q48 43 56 46L55 61L62 85Q63 89 59 90Q55 91 54 87L48 68L42 87Q41 91 37 90Q33 89 34 85L41 61Z"/>` +
    linea("M41 48L33 40L28 23M55 48L63 40L68 23", 6) +
    linea("M14 22H82", 3) +
    `<rect x="17" y="13" width="5" height="18" rx="1.5"/><rect x="23" y="16" width="4" height="12" rx="1"/><rect x="74" y="13" width="5" height="18" rx="1.5"/><rect x="69" y="16" width="4" height="12" rx="1"/>`,
  ciclismo: () =>
    `<g fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="23" cy="73" r="17"/><circle cx="76" cy="73" r="17"/><path d="M23 73L35 47L48 73H23L63 48L76 73M35 47H63L67 42H73M29 47H40"/></g>` +
    cabeza(61, 18, 6) +
    `<path d="M47 25Q51 22 55 26L61 37L71 42Q75 44 73 47Q72 49 68 47L56 42L51 35L40 46L52 51Q56 53 54 57L46 70Q44 74 41 72Q38 70 41 66L46 57L34 53Q28 50 32 43Z"/>` +
    linea("M37 49L32 60L43 72", 5),
  natacion: () =>
    cabeza(66, 42, 6.5) +
    `<path d="M34 54L49 44Q55 43 60 49L65 56Q55 53 48 57Q41 52 34 56Z"/>` +
    linea("M53 46L43 29L59 23", 7) +
    linea(
      "M12 64Q17 60 23 64T35 64T47 64T59 64T71 64T83 64M12 73Q17 69 23 73T35 73T47 73T59 73T71 73T83 73M12 82Q17 78 23 82T35 82T47 82T59 82T71 82T83 82",
      2.7,
    ),
  deportes: () =>
    cabeza(53, 17) +
    `<path d="M42 27Q48 23 53 28L60 39L72 40Q76 40 76 44Q76 47 72 47L58 46Q55 46 54 43L50 38L46 52L56 63Q58 65 57 70L54 86Q53 90 49 89Q46 88 47 84L49 69L38 58Q35 54 37 49L41 35L32 39L28 50Q27 54 24 53Q21 52 22 49L26 34Q27 32 30 31Z"/>` +
    linea("M39 57L30 68H15", 8) +
    `<circle cx="76" cy="82" r="8"/>`,
  movilidad: () =>
    `<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="48" cy="20" rx="6" ry="8"/><path d="M19 60Q29 57 31 47L34 36Q37 31 48 31Q59 31 62 36L65 47Q67 57 77 60M40 43Q40 54 36 59M56 43Q56 54 60 59M44 68L30 63Q23 61 22 67Q20 72 27 75L44 80L69 72Q76 69 73 65Q71 61 65 64L38 74"/></g>`,
};
const peinados = {
  ruta: [58, 13],
  cardio: [46, 12],
  casa: [51, 22],
  pilates: [61, 17],
  gimnasio: [47, 13],
  crossfit: [48, 36],
  ciclismo: [61, 18],
  natacion: [66, 42],
  deportes: [53, 17],
};
export function iconoActividad(id, sexo = "H") {
  const clave = dibujos[id] ? id : "cardio",
    mujer = sexo === "M",
    p = peinados[clave];
  // Variante de perfil sin alterar la mecánica ni las articulaciones de la pose.
  const pelo =
    mujer && p
      ? `<path d="M${p[0] - 4} ${p[1] - 4}q-9 -4 -9 5q0 5 -4 7q8 0 8 -7q0 -3 5 -2Z"/>`
      : "";
  return `<svg class="actividad-silueta" viewBox="0 0 96 96" role="img" aria-label="${mujer ? "Figura femenina" : "Figura masculina"}"><g fill="currentColor">${dibujos[clave]()}${pelo}</g></svg>`;
}
