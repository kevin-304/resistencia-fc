// Pantalla "¿Quién va a registrar?": elegir, crear o importar un perfil.
import { estado } from '../estado.js';
import { navegar, aviso } from '../nav.js';
import { recargarEnPerfil, importarYAbrir } from './perfil.js';
import { I } from '../iconos.js';
import { nubeConfigurada } from '../nube.js';
import { escapar, fechaMedia, num } from '../util.js';

export async function mostrarPerfiles(cont) {
  const [lista, u] = await Promise.all([window.api.listarPerfiles(), window.api.ubicacion()]);
  const iniciales = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('');

  cont.innerHTML = `<div class="bienvenida" style="max-width:900px">
    <div class="logo-grande"><img src="../build/icon.png" alt=""><div class="titulo-logo">Resistencia <span class="fc">f'c</span></div></div>
    <h2 style="text-align:center;margin-bottom:18px">¿Quién va a registrar?</h2>
    <div class="perfiles-rejilla">
      ${lista.map((p) => `<button class="perfil-tarjeta ${p.id === u.perfil ? 'actual' : ''}" data-id="${escapar(p.id)}">
        <span class="avatar">${escapar(iniciales(p.nombre))}</span>
        <b>${escapar(p.nombre)}</b>
        <span class="suave pequeño">${p.sexo === 'M' ? 'Ingeniera' : 'Ingeniero'}${p.pesoMeta ? ` · meta ${num(p.pesoMeta, 1)} kg` : ''}</span>
        ${p.fechaInicio ? `<span class="suave pequeño">Plan desde el ${fechaMedia(p.fechaInicio)}</span>` : ''}
        ${p.id === u.perfil ? '<span class="estado-pill ok">Último usado</span>' : ''}
      </button>`).join('')}
      <button class="perfil-tarjeta nuevo" id="crear"><span class="avatar">${I.mas}</span><b>Crear perfil nuevo</b><span class="suave pequeño">Empieza desde cero</span></button>
    </div>
    <div class="bienvenida-pie">
      ${estado.perfil ? `<button class="boton fantasma" id="volver">${I.izquierda} Volver</button>` : '<span></span>'}
      <div class="grupo-botones">
        ${nubeConfigurada() ? '<button class="boton" id="nube">☁ Cuenta y sincronización</button>' : ''}
        <button class="boton" id="importar">${I.carpeta} Importar perfil</button>
      </div>
    </div>
    <p class="suave pequeño ${window.api.esCelular ? 'oculto' : ''}" style="text-align:center;margin-top:14px">También puedes pegar la carpeta de un perfil en<br><span class="num">${escapar(u.carpeta)}\\perfiles</span><br>y aparecerá aquí al abrir el programa.</p>
  </div>`;

  cont.querySelectorAll('.perfil-tarjeta[data-id]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await window.api.abrirPerfil(b.dataset.id);
      recargarEnPerfil();
    } catch (e) { aviso(e.message, 'error'); }
  }));
  cont.querySelector('#crear').addEventListener('click', () => navegar('bienvenida'));
  cont.querySelector('#importar').addEventListener('click', () => importarYAbrir());
  cont.querySelector('#nube')?.addEventListener('click', () => navegar('nube'));
  cont.querySelector('#volver')?.addEventListener('click', () => navegar('calendario'));
}
