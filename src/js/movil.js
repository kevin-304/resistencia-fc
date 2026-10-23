import {mostrarSemanales} from './vistas/semanales.js';
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
import { mostrarMiRutina } from './vistas/mirutina.js';
import { mostrarEstadisticas } from './vistas/estadisticas.js';
import { mostrarRutas } from './vistas/rutas.js';
import { mostrarPersonalizacion } from './vistas/personalizacion.js';
import { iniciarNube } from './nube.js';

const MENU = [
  { id: 'hoy', nombre: 'Hoy', icono: I.hoy },
  { id: 'calendario', nombre: 'Calendario', icono: I.calendario },
  { id: 'mirutina', nombre: 'Mi rutina', icono: I.comp },
  { id: 'estadisticas', nombre: 'Estadísticas', icono: I.estadisticas },
  { id:'reporte',nombre:'Reportes PDF',icono:I.reporte },
  { id: 'rutas', nombre: 'Rutas y terreno', icono: I.rutas },
  { id: 'enviar', nombre: 'Enviar', icono: I.descargar },
  { id: 'ajustes', nombre: 'Perfil', icono: I.perfil },
  { id: 'personalizacion', nombre: 'Personalización', icono: I.colores },
  { id: 'perfiles', nombre: 'Cambiar de perfil', icono: I.perfil },
];

const VISTAS = {
  reporte:mostrarSemanales,
  dia: mostrarDia,
  calendario: mostrarCalendario,
  enviar: mostrarEnviar,
  ajustes: mostrarMovilAjustes,
  bienvenida: mostrarBienvenida,
  perfiles: mostrarPerfiles,
  nube: mostrarNube,
  mirutina: mostrarMiRutina,
  miplan: mostrarMiRutina,
  estadisticas: mostrarEstadisticas,
  rutas: mostrarRutas,
  personalizacion: mostrarPersonalizacion,
};
const SIN_MENU = ['bienvenida', 'perfiles', 'nube'];
let actual = null;
function cerrarMenu() { document.getElementById('menu-lateral').close(); }
function abrirMenu() {
  const menu=document.getElementById('menu-lateral');
  if(menu.open || document.getElementById('cabecera-movil').classList.contains('oculto'))return;
  document.getElementById('perfil-menu').textContent=estado.perfil?.nombre || '';
  menu.showModal();document.body.classList.add('menu-abierto');document.getElementById('abrir-menu').setAttribute('aria-expanded','true');
}

function irA(destino) {
  cerrarMenu();
  let { vista, ...params } = destino;
  if (vista === 'hoy') { vista = 'dia'; params.fecha = hoyISO(); }
  if (vista === 'dia' && params.fecha === 'hoy') params.fecha = hoyISO();
  if (!estado.perfil && !SIN_MENU.includes(vista)) vista = 'bienvenida';
  if (!VISTAS[vista]) vista = 'calendario';
  limpiarPantalla();
  const vistaPrincipal = document.getElementById('vista');
  const cont = document.createElement('div');
  vistaPrincipal.replaceChildren(cont);
  window.scrollTo(0, 0);
  vistaPrincipal.scrollTop = 0;
  const activo = vista === 'dia' && params.fecha === hoyISO() ? 'hoy' : vista === 'dia' ? 'calendario' : vista;
  document.querySelectorAll('#menu-movil button').forEach((b) => b.classList.toggle('activo', b.dataset.ir === activo));
  document.getElementById('cabecera-movil').classList.toggle('oculto', SIN_MENU.includes(vista));
  document.getElementById('titulo-movil').textContent=MENU.find(m=>m.id===activo)?.nombre || '';
  document.querySelectorAll('#menu-movil button').forEach(b=>b.setAttribute('aria-current',b.dataset.ir===activo?'page':'false'));
  actual = { vista, params };
  VISTAS[vista](cont, params);
}

async function iniciar() {
  const menu = document.getElementById('menu-movil');
  const grupo=(titulo,ids)=>`<details class="menu-grupo" open><summary>${titulo}</summary>${MENU.filter(m=>ids.includes(m.id)).map(m=>`<button type="button" data-ir="${m.id}">${m.icono}<span>${m.nombre}</span></button>`).join('')}</details>`;
  menu.innerHTML = grupo('Mi entrenamiento',['hoy','calendario','mirutina','estadisticas'])+grupo('Plan y datos',['rutas','reporte','enviar'])+grupo('Mi cuenta',['ajustes','personalizacion','perfiles']);
  menu.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => navegar(b.dataset.ir)));
  const lateral=document.getElementById('menu-lateral');
  document.getElementById('abrir-menu').addEventListener('click',abrirMenu);
  document.getElementById('cerrar-menu').addEventListener('click',cerrarMenu);
  lateral.addEventListener('close',()=>{document.body.classList.remove('menu-abierto');document.getElementById('abrir-menu').setAttribute('aria-expanded','false');});
  lateral.addEventListener('click',e=>{const r=lateral.getBoundingClientRect();if(e.target===lateral && (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom))cerrarMenu();});
  let gesto=null;
  document.addEventListener('pointerdown',e=>{gesto=e.pointerType==='touch'?{x:e.clientX,y:e.clientY}:null;});
  document.addEventListener('pointerup',e=>{if(!gesto)return;const dx=e.clientX-gesto.x,dy=e.clientY-gesto.y;if(Math.abs(dy)<45){if(lateral.open && dx < -80)cerrarMenu();else if(!lateral.open && gesto.x<24 && dx>80)abrirMenu();}gesto=null;});
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
