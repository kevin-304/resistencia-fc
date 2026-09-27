// Temas de color. Cada color de la interfaz es una "variable" que el panel de
// personalización puede cambiar. Los cambios se guardan por tema.

import { estado } from './estado.js';

export const VARIABLES = [
  { grupo: 'Interfaz', vars: [
    ['fondo', 'Fondo del programa'],
    ['superficie', 'Tarjetas y paneles'],
    ['superficie-2', 'Campos y cajas internas'],
    ['borde', 'Bordes'],
    ['texto', 'Texto'],
    ['texto-suave', 'Texto secundario'],
    ['acento', 'Botones y resaltados'],
    ['acento-texto', 'Texto sobre botones'],
  ] },
  { grupo: 'Barra lateral', vars: [
    ['barra', 'Fondo de la barra'],
    ['barra-texto', 'Texto de la barra'],
    ['barra-activo', 'Opción seleccionada'],
  ] },
  { grupo: 'Calendario', vars: [
    ['cal-celda', 'Cuadritos del calendario'],
    ['cal-hoy', 'Marco del día de hoy'],
    ['cal-descanso', 'Cuadrito del domingo'],
    ['c-ruta', 'Marca de ruta'],
    ['c-ayuno', 'Marca de ayuno'],
    ['c-comp', 'Marca de complemento'],
    ['c-sueno', 'Marca de sueño'],
  ] },
  { grupo: 'Gráficos', vars: [
    ['g-peso', 'Peso real'],
    ['g-ambiciosa', 'Proyección ambiciosa'],
    ['g-segura', 'Proyección segura'],
    ['g-meta', 'Línea de meta'],
    ['g-km', 'Kilómetros'],
    ['g-kmesf', 'Km-esfuerzo'],
  ] },
  { grupo: 'Avisos', vars: [
    ['ok', 'Cumplido'],
    ['aviso', 'Advertencia'],
    ['peligro', 'Peligro'],
  ] },
];

const OSCURO = {
  fondo: '#14161b', superficie: '#1d2027', 'superficie-2': '#262a33', borde: '#323743', texto: '#e8eaef', 'texto-suave': '#9aa1b0',
  acento: '#ff7a1a', 'acento-texto': '#1a0e04', barra: '#101217', 'barra-texto': '#c7ccd6', 'barra-activo': '#ff7a1a',
  'cal-celda': '#1d2027', 'cal-hoy': '#ff7a1a', 'cal-descanso': '#181b21',
  'c-ruta': '#ff7a1a', 'c-ayuno': '#38bdf8', 'c-comp': '#a78bfa', 'c-sueno': '#34d399',
  'g-peso': '#ff7a1a', 'g-ambiciosa': '#f472b6', 'g-segura': '#38bdf8', 'g-meta': '#34d399', 'g-km': '#ff7a1a', 'g-kmesf': '#a78bfa',
  ok: '#34d399', aviso: '#fbbf24', peligro: '#f87171',
};

const CLARO = {
  fondo: '#f2f3f6', superficie: '#ffffff', 'superficie-2': '#f4f5f8', borde: '#dfe2e8', texto: '#1b1e25', 'texto-suave': '#646b7a',
  acento: '#e8640c', 'acento-texto': '#ffffff', barra: '#1d2027', 'barra-texto': '#d9dde5', 'barra-activo': '#ff8a33',
  'cal-celda': '#ffffff', 'cal-hoy': '#e8640c', 'cal-descanso': '#f7f8fa',
  'c-ruta': '#e8640c', 'c-ayuno': '#0284c7', 'c-comp': '#7c3aed', 'c-sueno': '#059669',
  'g-peso': '#e8640c', 'g-ambiciosa': '#db2777', 'g-segura': '#0284c7', 'g-meta': '#059669', 'g-km': '#e8640c', 'g-kmesf': '#7c3aed',
  ok: '#059669', aviso: '#d97706', peligro: '#dc2626',
};

export const PRESETS = {
  oscuro: { nombre: 'Oscuro', modo: 'oscuro', colores: OSCURO },
  claro: { nombre: 'Claro', modo: 'claro', colores: CLARO },
  hormigon: { nombre: 'Hormigón', modo: 'claro', colores: {
    ...CLARO, fondo: '#e4e4e1', superficie: '#f6f6f4', 'superficie-2': '#ecebe8', borde: '#cfcfca', acento: '#f59e0b', 'acento-texto': '#1f1a0e',
    barra: '#3a3d42', 'barra-activo': '#fbbf24', 'cal-celda': '#f6f6f4', 'cal-hoy': '#f59e0b', 'cal-descanso': '#eeeeeb', 'c-ruta': '#d97706', 'g-peso': '#d97706', 'g-km': '#d97706',
  } },
  cerro: { nombre: 'Cerro', modo: 'oscuro', colores: {
    ...OSCURO, fondo: '#0f1a14', superficie: '#16241c', 'superficie-2': '#1d2f25', borde: '#2a4034', acento: '#84cc16', 'acento-texto': '#0f1a05',
    barra: '#0b140f', 'barra-activo': '#a3e635', 'cal-celda': '#16241c', 'cal-hoy': '#a3e635', 'cal-descanso': '#122019', 'c-ruta': '#a3e635', 'g-peso': '#a3e635', 'g-km': '#84cc16',
  } },
  oceano: { nombre: 'Océano', modo: 'oscuro', colores: {
    ...OSCURO, fondo: '#0b1622', superficie: '#112233', 'superficie-2': '#172c42', borde: '#223b55', acento: '#22d3ee', 'acento-texto': '#03151a',
    barra: '#08111b', 'barra-activo': '#22d3ee', 'cal-celda': '#112233', 'cal-hoy': '#22d3ee', 'cal-descanso': '#0e1d2c', 'c-ruta': '#22d3ee', 'c-ayuno': '#60a5fa', 'g-peso': '#22d3ee', 'g-km': '#22d3ee', 'g-segura': '#60a5fa',
  } },
  atardecer: { nombre: 'Atardecer', modo: 'oscuro', colores: {
    ...OSCURO, fondo: '#1b1220', superficie: '#261a2d', 'superficie-2': '#31223a', borde: '#43304f', acento: '#fb7185', 'acento-texto': '#1f050a',
    barra: '#140d18', 'barra-activo': '#fb7185', 'cal-celda': '#261a2d', 'cal-hoy': '#fbbf24', 'cal-descanso': '#20162a', 'c-ruta': '#fb7185', 'c-ayuno': '#fbbf24', 'g-peso': '#fb7185', 'g-km': '#fb7185', 'g-ambiciosa': '#fbbf24',
  } },
};

export function coloresActuales() {
  const t = estado.config.tema;
  const preset = PRESETS[t.preset] || PRESETS.oscuro;
  return { ...preset.colores, ...(t.personal?.[t.preset] || {}) };
}

export const modoActual = () => (PRESETS[estado.config.tema.preset] || PRESETS.oscuro).modo;

export const color = (nombre) => getComputedStyle(document.documentElement).getPropertyValue('--' + nombre).trim();

// Aplica el tema a toda la ventana.
export async function aplicarTema() {
  const t = estado.config.tema;
  const raiz = document.documentElement;
  const colores = coloresActuales();
  for (const [k, v] of Object.entries(colores)) raiz.style.setProperty('--' + k, v);
  raiz.dataset.modo = modoActual();
  raiz.style.setProperty('--escala', (t.escalaLetra || 100) / 100);
  raiz.style.setProperty('--radio', (t.radio ?? 12) + 'px');

  const f = t.fondo || { tipo: 'tema' };
  const capa = document.getElementById('fondo-app');
  capa.style.backgroundImage = '';
  capa.style.opacity = '';
  capa.style.filter = '';
  if (f.tipo === 'degradado') {
    capa.style.backgroundImage = `linear-gradient(${f.angulo ?? 135}deg, ${f.color1 || colores.fondo}, ${f.color2 || colores.superficie})`;
  } else if (f.tipo === 'imagen' && f.imagen) {
    const url = await window.api.urlArchivo(f.imagen);
    if (url) {
      capa.style.backgroundImage = `url("${url}")`;
      capa.style.opacity = (f.opacidad ?? 35) / 100;
      capa.style.filter = f.desenfoque ? `blur(${f.desenfoque}px)` : '';
    }
  }
  document.body.classList.toggle('con-fondo', f.tipo !== 'tema');
  window.dispatchEvent(new CustomEvent('tema-cambiado'));
}
