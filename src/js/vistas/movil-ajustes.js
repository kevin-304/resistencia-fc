// (Celular) Perfil y ajustes: actualizar el perfil desde la PC, modo claro/oscuro, borrar datos.
import { estado, guardarConfig } from '../estado.js';
import { aplicarTema, PRESETS } from '../tema.js';
import { aviso, confirmar, navegar } from '../nav.js';
import { recargarEnPerfil } from './perfil.js';
import { I } from '../iconos.js';
import { tarjetaNube } from './nube.js';
import { escapar, fechaMedia, num } from '../util.js';

export async function mostrarMovilAjustes(cont) {
  const p = estado.perfil;
  const pendientes = await window.api.pendientes();
  const oscuro = PRESETS[estado.config.tema.preset]?.modo !== 'claro';
  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Perfil</h1><p>${escapar(p.nombre)} · plan desde el ${fechaMedia(p.fechaInicio)} · meta ${num(p.pesoMeta, 1)} kg</p></div></div>
    <button class="boton" id="cambiar-perfil" style="margin-bottom:14px;width:100%">${I.perfil} Cambiar de perfil</button>
    <section class="tarjeta" id="caja-nube" style="margin-bottom:14px"></section>
    <section class="tarjeta" style="margin-bottom:14px">
      <div class="tarjeta-cab"><h2>Actualizar desde la PC (por WhatsApp)</h2></div>
      <p class="suave">Si cambiaste tu perfil, rutas o colores en la PC, envíalo de nuevo (Perfil → <b>Enviar perfil al celular</b>) y cárgalo aquí. Tus días del celular no se tocan.</p>
      <button class="boton" id="importar" style="margin-top:12px">${I.carpeta} Cargar perfil de la PC</button>
    </section>
    <section class="tarjeta" style="margin-bottom:14px">
      <div class="tarjeta-cab"><h2>Apariencia</h2></div>
      <button class="boton" id="modo">${oscuro ? I.sol : I.luna} ${oscuro ? 'Modo claro' : 'Modo oscuro'}</button>
    </section>
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Datos de este celular</h2></div>
      <p class="suave">Los datos viven solo en este teléfono hasta que los envías a la PC. ${pendientes.length ? `<b>Tienes ${pendientes.length} día(s) sin enviar.</b>` : 'Todo está enviado.'}</p>
      <button class="boton peligro" id="borrar" style="margin-top:12px">${I.basura} Borrar los datos de este celular</button>
    </section>`;

  tarjetaNube(cont.querySelector('#caja-nube'));
  cont.querySelector('#cambiar-perfil').addEventListener('click', () => navegar('perfiles'));
  cont.querySelector('#importar').addEventListener('click', async () => {
    try {
      if (await window.api.importarPerfil()) { aviso('Perfil actualizado.', 'ok'); recargarEnPerfil(); }
    } catch (e) { aviso(e.message, 'error'); }
  });
  cont.querySelector('#modo').addEventListener('click', async () => {
    estado.config.tema.preset = oscuro ? 'claro' : 'oscuro';
    await aplicarTema();
    await guardarConfig.ya();
    mostrarMovilAjustes(cont);
  });
  cont.querySelector('#borrar').addEventListener('click', async () => {
    const texto = pendientes.length ? `Hay ${pendientes.length} día(s) que todavía no enviaste a la PC y se perderían.` : 'Todo ya fue enviado a la PC.';
    if (!(await confirmar('¿Borrar los datos del celular?', `${texto}\nEsto no afecta a la PC.`, 'Borrar', true))) return;
    await window.api.borrarTodo();
    location.reload();
  });
}
