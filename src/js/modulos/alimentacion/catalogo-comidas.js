// Catálogo de nombres para registrar comidas. No implica equivalencia nutricional.
const grupos = [
  [
    "carbohidratos",
    "Carbohidratos",
    `Arroz|Arroz integral|Arroz con verduras|Arroz con menestra|Arroz con pollo|Arroz con camarón|Arroz con atún|Arroz frito|Arroz con leche|Papa|Papa al horno|Puré de papa|Papas fritas|Yuca|Yuca hervida|Yuca frita|Puré de yuca|Choclo|Mote|Canguil|Avena|Avena en hojuelas|Avena cocida|Granola|Quinua|Cuscús|Cebada|Trigo cocido|Pan|Pan integral|Pan de centeno|Pan de molde|Pan de yuca|Pan de guineo|Tostada|Galletas de soda|Galletas integrales|Pasta|Fideos|Fideos cocidos|Fideos secos|Espaguetis|Espaguetis cocidos|Tallarines|Tallarines cocidos|Macarrones cocidos|Pasta integral cocida|Lasaña|Ravioles|Fideos de arroz|Plátano cocido|Plátano frito|Plátano asado|Patacones|Chifles|Maduro al horno|Camote|Camote al horno|Tortilla de maíz|Tortilla de harina de trigo|Tortilla integral|Tortilla de yuca|Tortilla de harina de yuca|Tortilla de linaza (flax)|Tortilla de avena|Tortilla de harina de almendras|Arepa|Casabe|Tapioca|Harina de maíz|Harina de yuca|Harina de trigo|Harina de linaza (flax)|Harina de avena|Harina de almendras`,
  ],
  [
    "proteinas",
    "Proteínas",
    `Pollo|Pechuga de pollo|Pollo a la plancha|Pollo al horno|Pollo guisado|Pollo frito|Pavo|Pechuga de pavo|Carne de res|Carne molida|Bistec|Carne asada|Carne guisada|Cerdo|Lomo de cerdo|Chuleta de cerdo|Costilla de cerdo|Cordero|Pescado|Tilapia|Corvina|Dorado|Salmón|Sardina|Atún|Atún en aceite|Atún fresco|Camarón|Calamar|Pulpo|Concha|Mejillones|Huevo|Huevo duro|Huevo revuelto|Huevo frito|Claras de huevo|Lentejas|Fréjoles|Fréjoles negros|Fréjoles blancos|Garbanzos|Habas|Arvejas|Chocho|Soya|Tofu|Tempeh|Queso|Queso fresco|Queso mozzarella|Queso cottage|Requesón|Yogur|Yogur griego|Yogur sin azúcar|Kéfir|Jamón|Jamón de pavo|Proteína en polvo`,
  ],
  [
    "frutas",
    "Frutas",
    `Guineo / banana|Manzana|Manzana verde|Naranja|Mandarina|Pera|Uvas|Uvas verdes|Uvas moradas|Sandía|Melón|Papaya|Piña|Mango|Fresas|Kiwi|Durazno|Cerezas|Coco|Limón|Maracuyá|Granadilla|Pitahaya|Moras|Arándanos|Guayaba|Naranjilla|Tomate de árbol|Guanábana|Chirimoya|Zapote|Mamey|Ciruela|Higo|Dátil|Pasas|Tamarindo|Toronja|Pomelo|Frambuesas|Frutillas congeladas|Mango congelado|Piña congelada|Fruta picada|Ensalada de frutas|Manzana cocida|Compota sin azúcar`,
  ],
  [
    "verduras",
    "Verduras",
    `Lechuga|Tomate|Zanahoria|Brócoli|Pepino|Cebolla|Espinaca|Col|Pimiento|Zapallo|Coliflor|Ensalada mixta|Lechuga romana|Tomate cherry|Cebolla paiteña|Cebolla blanca|Cebollín|Ajo|Apio|Acelga|Rúcula|Col morada|Coles de Bruselas|Calabacín|Zucchini|Berenjena|Remolacha|Rábano|Nabo|Espárragos|Alcachofa|Champiñones|Hongos|Vainitas|Puerro|Palmito|Pepinillo|Culantro|Perejil|Albahaca|Ensalada de pepino|Ensalada de tomate|Ensalada de col|Verduras al vapor|Verduras salteadas|Vegetales al horno|Sopa de verduras|Crema de zapallo|Crema de brócoli|Puré de verduras`,
  ],
  [
    "bebidas",
    "Bebidas",
    `Agua|Agua con gas|Agua con limón|Café|Café con leche|Café descafeinado|Café con azúcar|Té|Té verde|Té de manzanilla|Té de hierbaluisa|Infusión sin azúcar|Leche|Leche descremada|Leche sin lactosa|Leche de soya|Leche de almendras|Leche de avena|Bebida vegetal|Jugo de naranja|Jugo de mora|Jugo de maracuyá|Jugo de piña|Jugo de papaya|Jugo de naranjilla|Jugo de tomate de árbol|Batido de frutas|Batido de banana|Batido de papaya|Batido de proteína|Yogur bebible|Chocolate con leche|Agua de coco|Colada de avena|Colada de maíz|Gaseosa|Gaseosa sin azúcar|Bebida isotónica|Bebida energética|Cerveza|Vino|Limonada`,
  ],
  [
    "otros",
    "Otros y platos",
    `Aguacate|Maní|Nueces|Almendras|Pistachos|Marañón|Avellanas|Semillas de chía|Semillas de linaza|Semillas de girasol|Semillas de zapallo|Ajonjolí|Mantequilla de maní|Mantequilla de almendras|Aceite|Aceite de oliva|Aceite de girasol|Aceite de coco|Mantequilla|Margarina|Mayonesa|Mostaza|Salsa|Salsa de tomate|Salsa de yogur|Ají|Guacamole|Hummus|Miel|Azúcar|Panela|Mermelada|Chocolate negro|Chocolate con leche|Gelatina|Helado|Pastel|Galletas dulces|Encebollado|Ceviche de pescado|Ceviche de camarón|Sopa de pollo|Caldo de pescado|Caldo de gallina|Sopa de fideos|Locro de papa|Menestra|Seco de pollo|Seco de carne|Guatita|Corviche|Bolón de verde|Tigrillo|Humita|Tamal|Hayaca|Empanada de verde|Empanada de viento|Burrito|Taco|Quesadilla|Sándwich de pollo|Sándwich de atún|Hamburguesa|Pizza|Ensalada con pollo|Ensalada con atún|Estofado de verduras|Bowl de arroz y pollo`,
  ],
];
// Preparaciones cotidianas y gastronomía ecuatoriana; las recetas varían entre hogares.
// Referencias de nombres tradicionales: ecuador.travel/what-to-eat-gastronomia/
// y historicomintur.produccion.gob.ec/la-gastronomia-ecuatoriana-al-alcance-de-todos/.
const ampliacionEcuador = {
  carbohidratos: `Tortilla de yuca con queso|Tortilla de verde|Tortilla de verde con queso|Tortilla de maduro con queso|Tortilla de tiesto|Tortilla de maíz con queso|Tortilla de papa|Tortilla de quinua|Tortilla de arroz|Tortilla de avena con banana|Tostado de maíz|Mote cocido|Mellocos cocidos|Ocas cocidas|Papa china cocida|Verde majado|Majado de yuca|Puré de verde|Arroz amarillo|Arroz con choclo|Arroz con fréjol|Arroz con lentejas|Arroz con zanahoria|Arroz con arvejas|Fideos con queso|Espaguetis con salsa de tomate|Tallarín con pollo|Tallarín con carne|Tallarín con atún|Pan enrollado|Pan de almidón|Pan de queso|Pan de maíz|Rosca de sal|Bizcochos de Cayambe|Cascarita de pan`,
  proteinas: `Gallina criolla|Pollo criollo|Hígado de res|Lengua de res|Cuy asado|Conejo guisado|Chicharrón|Cuajada|Quesillo|Queso manaba|Queso de hoja|Longaniza|Morcilla|Chorizo|Carne de chancho|Pescado frito|Pescado al vapor|Pescado a la plancha|Banderilla de pollo|Huevo pasado|Huevo tibio|Huevo con tomate|Huevo con cebolla|Huevos con queso|Habas cocidas|Arvejas cocidas`,
  frutas: `Uvilla|Taxo|Babaco|Capulí|Arazá|Badea|Achotillo|Pechiche|Grosella|Fruta de pan cocida|Chontaduro cocido|Borojó|Guaba`,
  verduras: `Cebolla encurtida|Encurtido de tomate y cebolla|Ensalada de aguacate y tomate|Ensalada de remolacha|Ensalada de zanahoria y arveja|Ensalada rusa|Ensalada de chochos|Habas con mellocos|Mellocos con cebolla|Ají de tomate de árbol|Ají de maní|Salprieta|Sofrito de cebolla y tomate`,
  bebidas: `Café pasado|Café de olla|Café con leche sin azúcar|Chocolate de tableta|Colada de machica|Colada de quinua|Colada de plátano|Colada de arroz|Colada de maicena|Colada morada|Morocho|Colada de avena con naranjilla|Agua de horchata|Agua de cedrón|Agua de toronjil|Agua de guayusa|Jugo de guanábana|Jugo de guayaba|Jugo de tamarindo|Jugo de mango|Jugo de sandía|Jugo de taxo|Jugo de babaco|Jugo de arazá|Batido de mora|Batido de naranjilla|Batido de guanábana|Batido de mango|Avena con leche|Chicha de jora|Chicha de yuca|Chicha de chontaduro|Rosero|Come y bebe`,
  otros: `Pan con queso|Tortilla de huevo|Aguado de pollo|Aguado de gallina|Aguado de chancho|Aguado de arroz con pollo|Aguado de pollo con arveja y zanahoria|Tiras de harina de yuca con queso|Tiras de yuca con queso|Muchines de yuca|Muchines de yuca con queso|Bolón de queso|Bolón de chicharrón|Bolón mixto|Bolón de maní|Bolón con huevo|Tigrillo con queso|Tigrillo mixto|Majado de verde con huevo|Majado de verde con queso|Majado de verde con chicharrón|Molloco|Mote pillo|Mote sucio|Mote con chicharrón|Mote pata|Humita con queso|Tamal de pollo|Tamal de chancho|Hayaca de pollo|Quimbolito|Empanada de yuca con queso|Empanada de maíz|Empanada de morocho|Empanada de pollo|Empanada de carne|Pastelillo de pollo|Pastelillo de queso|Pescado con yuca|Pescado con verde|Corviche de pescado|Corviche de camarón|Bollo de pescado|Bollo de chancho|Bollo de pollo|Bollo de camarón|Tonga de gallina|Tonga de pollo|Tonga de pescado|Viche de pescado|Viche de camarón|Viche mixto|Cazuela de pescado|Cazuela de camarón|Cazuela mixta|Cazuela de verde|Encocado de pescado|Encocado de camarón|Encocado mixto|Ceviche de concha|Ceviche mixto|Ceviche de chochos|Ceviche de palmito|Encebollado mixto|Bandera ecuatoriana|Guatita con arroz|Seco de gallina|Seco de chivo|Seco de chancho|Seco de pato|Estofado de pollo|Estofado de carne|Pollo al jugo|Arroz con menestra y carne|Arroz con menestra y pollo|Arroz con menestra y chuleta|Arroz con menestra y pescado|Arroz marinero|Arroz con concha|Arroz con cangrejo|Arroz con calamar|Chaulafán de pollo|Chaulafán mixto|Bandeja de mariscos|Camarones apanados|Camarones al ajillo|Calamares apanados|Pescado apanado|Pescado sudado|Sudado de pollo|Hornado con mote|Hornado con llapingachos|Fritada con mote|Fritada con papa|Llapingachos con huevo|Llapingachos con chorizo|Papas con cuero|Papas con queso|Papas con salsa de maní|Cuy con papas|Trucha con papas|Churrasco ecuatoriano|Bistec de res con arroz|Bistec de hígado|Lengua en salsa|Yapingacho con ensalada|Repe lojano|Sancocho de res|Sancocho de gallina|Sancocho de pescado|Caldo de bola|Caldo de salchicha|Caldo de manguera|Caldo de pata|Caldo de bagre|Caldo de albóndigas|Caldo de verde|Sopa de arroz con pollo|Sopa de arroz de cebada|Sopa de quinua|Sopa de lentejas|Sopa de fréjol|Sopa de arvejas|Sopa de arveja con cuero|Sopa de fideo con queso|Sopa de fideo con pollo|Sopa de fideo con papa|Sopa de verduras con pollo|Sopa de morocho|Sopa de avena|Locro de queso|Locro de acelga|Yaguarlocro|Fanesca|Crema de choclo|Crema de zanahoria|Crema de papa|Ensalada de fideos con pollo|Ensalada de atún con papa|Sánduche de pernil|Sánduche de chancho|Sánduche de queso|Sánduche de huevo|Sánduche de mortadela|Hamburguesa casera|Salchipapa|Salchipollo|Patacones con queso|Patacones con huevo|Patacones con pescado|Maduro con queso|Maduro con salprieta|Tostada con queso|Tostada con huevo|Avena con banana|Avena con fruta|Yogur con granola|Yogur con fruta|Fruta con queso|Arroz con huevo|Arroz con atún y tomate|Arroz con queso|Pasta con pollo y verduras|Maito de pescado|Maito de pollo|Ayampaco de pescado|Ayampaco de pollo|Casabe con pescado|Mazamorra de maíz|Mazamorra de plátano|Pristiño|Buñuelo de yuca|Buñuelo de maíz|Dulce de higo con queso|Dulce de pechiche|Dulce de guayaba|Natilla|Espumilla|Quesadilla quiteña|Queso de leche|Flan casero|Torta de maduro|Torta de choclo|Bizcochuelo|Suspiro|Alfajor|Cocada|Manjar de leche`,
};
for (const [id, nombres] of Object.entries(ampliacionEcuador)) {
  const g = grupos.find((g) => g[0] === id);
  g[2] += "|" + nombres;
}
export const CATEGORIAS_COMIDA = grupos.map(([id, nombre, texto]) => ({
  id,
  nombre,
  alimentos: [...new Set(texto.split("|"))],
}));
export const normalizarAlimento = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function catalogoAlimentos(personales = []) {
  const mapa = new Map();
  for (const cat of CATEGORIAS_COMIDA)
    for (const nombre of cat.alimentos)
      mapa.set(normalizarAlimento(nombre), { nombre, categoria: cat.id });
  for (const p of Array.isArray(personales) ? personales : [])
    if (
      p &&
      typeof p.nombre === "string" &&
      p.nombre.trim() &&
      !mapa.has(normalizarAlimento(p.nombre))
    )
      mapa.set(normalizarAlimento(p.nombre), {
        nombre: p.nombre.trim(),
        categoria: CATEGORIAS_COMIDA.some((c) => c.id === p.categoria)
          ? p.categoria
          : "otros",
      });
  return [...mapa.values()];
}
export function buscarAlimento(nombre, personales = []) {
  const n = normalizarAlimento(nombre),
    clave = ["banana", "guineo", "banano"].includes(n) ? "guineo / banana" : n;
  return catalogoAlimentos(personales).find(
    (a) => normalizarAlimento(a.nombre) === clave,
  );
}
