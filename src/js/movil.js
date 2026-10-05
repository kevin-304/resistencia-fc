// Arranque de la versión celular. Primero se instala window.api (almacenamiento del teléfono).
import './api-web.js';
import { estado, cargar, alGuardar, guardarTodoYa } from './estado.js';
import { aplicarTema } from './tema.js';
import { fijarManejador, navegar, limpiarPantalla, aviso } from './nav.js';
import { I } from './iconos.js';
import { hoyISO } from './util.js';
import { mostrarCalendario } from './vistas/calendario.js';
import { mostrarDia } from './vistas/dia.js';
import { mostrarBienvenida } from './vistas/perfil.js';
import { mostrarEnviar } from './vistas/enviar.js';
import { mostrarMovilAjustes } from './vistas/movil-ajustes.js';
import { mostrarPerfiles } from './vistas/perfiles.js';
import { mostrarNube } from './vistas/nube.js';
import { iniciarNube } from './nube.js';

const MENU = [
  { id: 'hoy', nombre: 'Hoy', icono: I.hoy },
  { id: 'calendario', nombre: 'Calendario', icono: I.calendario },
  { id: 'enviar', nombre: 'Enviar', icono: I.descargar },
  { id: 'ajustes', nombre: 'Perfil', icono: I.perfil },
];

const VISTAS = {
  dia: mostrarDia,
  calendario: mostrarCalendario,
  enviar: mostrarEnviar,
  ajustes: mostrarMovilAjustes,
  bienvenida: mostrarBienvenida,
  perfiles: mostrarPerfiles,
  nube: mostrarNube,
};
const SIN_MENU = ['bienvenida', 'perfiles', 'nube'];
let actual = null;

function irA(destino) {
  let { vista, ...params } = destino;
  if (vista === 'hoy') { vista = 'dia'; params.fecha = hoyISO(); }
  if (vista === 'dia' && params.fecha === 'hoy') params.fecha = hoyISO();
  if (!estado.perfil && !SIN_MENU.includes(vista)) vista = 'bienvenida';
  if (!VISTAS[vista]) vista = 'calendario';
  limpiarPantalla();
  const cont = document.getElementById('vista');
  cont.innerHTML = '';
  window.scrollTo(0, 0);
  cont.scrollTop = 0;
  const activo = vista === 'dia' && params.fecha === hoyISO() ? 'hoy' : vista === 'dia' ? 'calendario' : vista;
  document.querySelectorAll('#menu-movil button').forEach((b) => b.classList.toggle('activo', b.dataset.ir === activo));
  document.getElementById('menu-movil').classList.toggle('oculto', SIN_MENU.includes(vista));
  actual = { vista, params };
  VISTAS[vista](cont, params);
}

async function iniciar() {
  const menu = document.getElementById('menu-movil');
  menu.innerHTML = MENU.map((m) => `<button data-ir="${m.id}">${m.icono}<span>${m.nombre}</span></button>`).join('');
  menu.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => navegar(b.dataset.ir)));
  fijarManejador(irA);
  alGuardar((s, detalle) => { if (s === 'error') aviso('No se pudo guardar: ' + (detalle || ''), 'error'); });
  // Al salir de la app (o bloquear el teléfono) se guarda lo pendiente.
  document.addEventListener('visibilitychange', () => { if (document.hidden) guardarTodoYa(); });

  let tienePerfil = false;
  let lista = [];
  try { tienePerfil = await cargar(); lista = await window.api.listarPerfiles(); } catch (e) { aviso('Error al leer los datos: ' + e.message, 'error'); }
  await aplicarTema();

  // Nube: datos de otros equipos
  window.addEventListener('nube-perfiles', () => { if (!actual || SIN_MENU.includes(actual.vista)) navegar('perfiles'); });
  window.addEventListener('nube-config', () => aplicarTema());
  window.addEventListener('datos-importados', () => {
    if (!actual || !['dia', 'calendario'].includes(actual.vista)) return;
    const foco = document.activeElement;
    if (foco && ['INPUT', 'TEXTAREA', 'SELECT'].includes(foco.tagName)) return; // no interrumpir mientras escribes
    irA({ vista: actual.vista, ...actual.params });
  });
  iniciarNube().catch((e) => console.error('Nube:', e));

  let saltarSelector = false;
  try { saltarSelector = !!sessionStorage.getItem('saltarSelector'); sessionStorage.removeItem('saltarSelector'); } catch { /* nada */ }
  if (!lista.length) navegar('bienvenida');
  else if (!tienePerfil || (lista.length > 1 && !saltarSelector)) navegar('perfiles');
  else navegar('hoy');

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

iniciar();
