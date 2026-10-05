// Estado de la aplicación: todo lo leído de la carpeta de datos vive aquí en memoria
// y cada cambio se guarda solo, a los pocos milisegundos, en su archivo .json.

import { retrasar, idUnico } from './util.js';
import { INICIO_POR_DEFECTO, normalizarPlan } from './plan.js';

export const CONFIG_BASE = {
  tema: { preset: 'oscuro', personal: {}, fondo: { tipo: 'tema' }, escalaLetra: 100, radio: 12 },
  terreno: { actual: 'montana', desde: null },
  rutaPrincipal: null,
  recordatorios: {
    pesarse: { activo: true, hora: '05:00' },
    cerrarVentana: { activo: true, minutosAntes: 15 },
    dormir: { activo: true, hora: '21:30' },
    registro: { activo: true, hora: '20:30' },
  },
};

export const estado = {
  carpeta: null,
  perfil: null,
  config: structuredClone(CONFIG_BASE),
  rutas: [],
  frecuentes: [],
  dias: {},
};

// ---------- Aviso de "guardando / guardado" ----------
const oyentes = new Set();
export const alGuardar = (fn) => oyentes.add(fn);
const avisar = (s, detalle) => oyentes.forEach((fn) => fn(s, detalle));

function mezclar(base, extra) {
  const r = structuredClone(base);
  for (const [k, v] of Object.entries(extra || {})) {
    r[k] = v && typeof v === 'object' && !Array.isArray(v) && r[k] && typeof r[k] === 'object' ? mezclar(r[k], v) : v;
  }
  return r;
}

export async function cargar() {
  const u = await window.api.ubicacion();
  estado.carpeta = u.carpetaPerfil;
  if (!u.perfil) return false;
  const [perfil, config, rutas, frecuentes, dias] = await Promise.all([
    window.api.leer('perfil.json'),
    window.api.leer('config.json'),
    window.api.leer('rutas.json'),
    window.api.leer('frecuentes.json'),
    window.api.leerDias(),
  ]);
  estado.perfil = perfil;
  estado.config = mezclar(CONFIG_BASE, config);
  estado.rutas = rutas || [];
  estado.frecuentes = frecuentes || [];
  estado.dias = dias || {};
  return !!perfil;
}

// Deja el estado limpio para un perfil nuevo.
export function reiniciarEstado() {
  estado.perfil = null;
  estado.config = structuredClone(CONFIG_BASE);
  estado.rutas = [];
  estado.frecuentes = [];
  estado.dias = {};
}

// ---------- Guardado ----------
async function escribir(rel, obj) {
  avisar('guardando');
  try {
    await window.api.escribir(rel, obj);
    avisar('guardado');
  } catch (e) {
    console.error(e);
    avisar('error', e.message);
  }
}

// La sincronización con la nube se entera de cada cambio local por aquí (ver nube.js).
export const ganchos = { cambio: null };
const avisarCambio = (tipo, clave) => { try { ganchos.cambio?.(tipo, clave); } catch (e) { console.error(e); } };

export const guardarPerfil = () => { avisarCambio('datos', 'perfil'); return escribir('perfil.json', estado.perfil); };
const guardarConfigRetrasado = retrasar(() => escribir('config.json', estado.config), 300);
export const guardarConfig = Object.assign(
  () => { avisarCambio('datos', 'config'); guardarConfigRetrasado(); },
  { ya: () => { avisarCambio('datos', 'config'); return guardarConfigRetrasado.ya(); } },
);
export const guardarRutas = () => { avisarCambio('datos', 'rutas'); return escribir('rutas.json', estado.rutas); };
export const guardarFrecuentes = () => { avisarCambio('datos', 'frecuentes'); return escribir('frecuentes.json', estado.frecuentes); };

const mesesPendientes = new Set();

const guardarDias = retrasar(async () => {
  const meses = [...mesesPendientes];
  mesesPendientes.clear();
  for (const mes of meses) {
    const contenido = {};
    for (const f of Object.keys(estado.dias).sort()) {
      if (f.startsWith(mes)) contenido[f] = estado.dias[f];
    }
    await escribir(`dias/${mes}.json`, contenido);
  }
}, 350);

function vacio(v) {
  if (v == null || v === '' || v === false) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.values(v).every(vacio);
  return false;
}

export function diaDe(fecha) {
  return estado.dias[fecha] || {};
}

export function diaEditable(fecha) {
  if (!estado.dias[fecha]) estado.dias[fecha] = {};
  return estado.dias[fecha];
}

export function diaCambiado(fecha) {
  avisarCambio('dia', fecha);
  if (estado.dias[fecha] && vacio(estado.dias[fecha])) delete estado.dias[fecha];
  mesesPendientes.add(fecha.slice(0, 7));
  avisar('pendiente');
  guardarDias();
}

export function guardarTodoYa() {
  if (mesesPendientes.size) guardarDias.ya();
}

window.addEventListener('beforeunload', guardarTodoYa);

// ---------- Contexto del plan ----------
export function rutaPrincipal() {
  return estado.rutas.find((r) => r.id === estado.config.rutaPrincipal) || estado.rutas[0] || null;
}

export function contexto() {
  return {
    inicio: estado.perfil?.fechaInicio || INICIO_POR_DEFECTO,
    terreno: estado.config.terreno,
    rutaPrincipal: rutaPrincipal(),
    plan: normalizarPlan(estado.config.plan),
  };
}

export function nuevaRuta(datos) {
  return { id: idUnico(), nombre: '', ciudad: '', terreno: 'montana', distancia: null, desnivel: null, notas: '', ...datos };
}

// Texto del título según el perfil: "del ingeniero" / "de la ingeniera"
export function subtitulo(sexo = estado.perfil?.sexo) {
  if (sexo === 'M') return 'Resistencia a la fuerza y cuerpazo de la ingeniera';
  if (sexo === 'H') return 'Resistencia a la fuerza y cuerpazo del ingeniero';
  return ''; // aún no se elige: no se muestra nada
}
