// Archivos que viajan entre el celular y la PC (por WhatsApp).
// Son texto (.txt con JSON adentro) porque Android solo deja compartir ciertos tipos de archivo.
//   · "rfc-dias":   días registrados en el celular (con sus fotos) → se añaden en la PC.
//   · "rfc-perfil": perfil, rutas y colores de la PC → se cargan en el celular.

export const PREFIJO_ARCHIVO = 'Resistencia fc';

const limpiar = (t) => String(t || '').replace(/[<>:"/\\|?*]/g, '').trim();

export function nombreArchivoDias(perfil, fechas) {
  const f = [...fechas].sort();
  const rango = f.length === 1 ? f[0] : `${f[0]} a ${f.at(-1)}`;
  return `${PREFIJO_ARCHIVO} - ${limpiar(perfil?.nombre) || 'perfil'} - ${rango}.txt`;
}

export function crearPaqueteDias(perfil, dias, fechas, fotos = {}) {
  return {
    tipo: 'rfc-dias',
    version: 1,
    generado: new Date().toISOString(),
    perfil: { nombre: perfil?.nombre || '' },
    dias: Object.fromEntries(fechas.filter((f) => dias[f]).map((f) => [f, dias[f]])),
    fotos,
  };
}

export function crearPaquetePerfil(estado) {
  return {
    tipo: 'rfc-perfil',
    version: 1,
    generado: new Date().toISOString(),
    perfil: estado.perfil,
    config: estado.config,
    rutas: estado.rutas,
    frecuentes: estado.frecuentes,
  };
}

// Lee el texto de un archivo recibido y dice qué es.
export function leerPaquete(texto) {
  let datos;
  try { datos = JSON.parse(texto); } catch { throw new Error('El archivo no es de Resistencia f\'c (no se pudo leer).'); }
  if (!datos || !['rfc-dias', 'rfc-perfil'].includes(datos.tipo)) throw new Error('El archivo no es de Resistencia f\'c.');
  return datos;
}

// Une lo que ya había ese día con lo que llega: lo nuevo manda, y las comidas se suman
// (si una comida ya existía con el mismo identificador, se actualiza).
export function combinarDia(actual, nuevo) {
  const r = structuredClone(actual || {});
  for (const [k, v] of Object.entries(nuevo || {})) {
    if (k === 'comidas') {
      const mapa = new Map((r.comidas || []).map((c) => [c.id, c]));
      for (const c of v || []) mapa.set(c.id, c);
      r.comidas = [...mapa.values()].sort((a, b) => ((a.hora || '99') < (b.hora || '99') ? -1 : 1));
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      r[k] = { ...(r[k] && typeof r[k] === 'object' ? r[k] : {}), ...v };
    } else {
      r[k] = v;
    }
  }
  return r;
}

// Huella corta de un día, para saber si cambió desde la última vez que se envió.
export function huella(obj) {
  const t = JSON.stringify(obj || {});
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return h.toString(36);
}
