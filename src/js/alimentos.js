// Catálogo local para registro manual; no estima calorías ni impone metas.
export const ALIMENTOS = [
  ['naranja','Naranja','🍊'], ['manzana','Manzana','🍎'], ['guineo','Guineo / banana','🍌'],
  ['mandarina','Mandarina','🍊'], ['pera','Pera','🍐'], ['uva','Uvas','🍇'], ['sandia','Sandía','🍉'],
  ['melon','Melón','🍈'], ['papaya','Papaya','🥭'], ['pina','Piña','🍍'], ['mango','Mango','🥭'],
  ['fresa','Fresas','🍓'], ['kiwi','Kiwi','🥝'], ['durazno','Durazno','🍑'], ['cereza','Cerezas','🍒'],
  ['coco','Coco','🥥'], ['limon','Limón','🍋'], ['maracuya','Maracuyá','🟡'], ['granadilla','Granadilla','🟠'],
  ['pitahaya','Pitahaya','🌵'], ['mora','Moras','🫐'], ['arandano','Arándanos','🫐'], ['guayaba','Guayaba','🍈'],
  ['aguacate','Aguacate','🥑'], ['tomate','Tomate','🍅'], ['zanahoria','Zanahoria','🥕'],
  ['brocoli','Brócoli','🥦'], ['pepino','Pepino','🥒'], ['lechuga','Lechuga','🥬'],
  ['huevo','Huevo','🥚'], ['pollo','Pollo','🍗'], ['pescado','Pescado','🐟'], ['atun','Atún','🐟'],
  ['carne','Carne','🥩'], ['arroz','Arroz','🍚'], ['avena','Avena','🥣'], ['pan','Pan','🍞'],
  ['papa','Papa','🥔'], ['yuca','Yuca','🥔'], ['platano','Plátano','🍌'], ['lenteja','Lentejas','🫘'],
  ['frejol','Fréjoles','🫘'], ['yogur','Yogur','🥛'], ['leche','Leche','🥛'], ['queso','Queso','🧀'],
  ['mani','Maní','🥜'], ['nuez','Nueces','🌰'],
].map(([id,nombre,emoji])=>({id,nombre,emoji}));

export function alimentosDelDia(plan, dia) {
  const lista = [...(plan.alimentos || [])];
  for (const id of dia.alimentosContados || []) {
    const alimento = ALIMENTOS.find(a=>a.id===id);
    if (alimento && !lista.some(a=>a.id===id)) lista.push(alimento);
  }
  return lista;
}
