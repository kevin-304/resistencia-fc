// Cuenta en la nube: iniciar sesión / crear cuenta y ver el estado de la sincronización.
import { alCambiarNube, entrar, crearCuenta, recuperarClave, salir, sincronizarTodo } from '../nube.js';
import { estado } from '../estado.js';
import { navegar, aviso, alSalir } from '../nav.js';
import { I } from '../iconos.js';
import { escapar, dos } from '../util.js';

const hora = (d) => (d ? `${dos(d.getHours())}:${dos(d.getMinutes())}` : '—');

// Pinta la tarjeta dentro de "caja" y la mantiene al día.
export function tarjetaNube(caja) {
  const quitar = alCambiarNube((n) => pintar(n));
  alSalir(quitar);

  function pintar(n) {
    if (!caja.isConnected) { quitar(); return; }
    if (!n.configurada) {
      caja.innerHTML = `<div class="tarjeta-cab"><h2>☁ Sincronización</h2><span class="estado-pill nada">Sin configurar</span></div>
        <p class="suave">Falta conectar el proyecto de Firebase. Cuando esté listo, aquí podrás iniciar sesión y tus datos se sincronizarán solos entre la PC y el celular.</p>`;
      return;
    }
    if (!n.conectado) {
      caja.innerHTML = `<div class="tarjeta-cab"><h2>☁ Sincronización</h2><span class="estado-pill nada">Sin sesión</span></div>
        <p class="suave" style="margin-bottom:12px">Inicia sesión con tu cuenta y tus perfiles se mantienen iguales en la PC y en el celular, solos. Usa la misma cuenta en todos tus equipos.</p>
        <div class="campos">
          <label class="campo"><span>Correo</span><input type="email" id="n-correo" autocomplete="username"></label>
          <label class="campo"><span>Contraseña</span><input type="password" id="n-clave" autocomplete="current-password"></label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="boton primario" id="n-entrar">Iniciar sesión</button>
          <button class="boton" id="n-crear">Crear cuenta</button>
          <button class="boton fantasma" id="n-olvido">¿Olvidaste tu contraseña?</button>
        </div>
        <p class="suave pequeño" id="n-msg" style="margin-top:10px">${n.error ? `<span style="color:var(--peligro)">${escapar(n.error)}</span>` : ''}</p>`;
      const datos = () => [caja.querySelector('#n-correo').value, caja.querySelector('#n-clave').value];
      const msg = (t, error = true) => { caja.querySelector('#n-msg').innerHTML = `<span style="color:var(${error ? '--peligro' : '--ok'})">${escapar(t)}</span>`; };
      caja.querySelector('#n-entrar').addEventListener('click', async () => { const [c, k] = datos(); const e = await entrar(c, k); if (e) msg(e); });
      caja.querySelector('#n-crear').addEventListener('click', async () => {
        const [c, k] = datos();
        if (k.length < 6) { msg('La contraseña debe tener al menos 6 caracteres.'); return; }
        const e = await crearCuenta(c, k);
        if (e) msg(e); else aviso('Cuenta creada. Tus perfiles se están subiendo a la nube.', 'ok');
      });
      caja.querySelector('#n-olvido').addEventListener('click', async () => {
        const [c] = datos();
        if (!c) { msg('Escribe tu correo arriba.'); return; }
        const e = await recuperarClave(c);
        msg(e || 'Te enviamos un correo para cambiar la contraseña.', !!e);
      });
      caja.querySelector('#n-clave').addEventListener('keydown', (e) => { if (e.key === 'Enter') caja.querySelector('#n-entrar').click(); });
      return;
    }
    const estadoTexto = n.error ? `<span class="estado-pill no">Error</span>` : n.sincronizando ? '<span class="estado-pill nada">Sincronizando…</span>' : '<span class="estado-pill ok">✓ Sincronizado</span>';
    caja.innerHTML = `<div class="tarjeta-cab"><h2>☁ Sincronización</h2>${estadoTexto}</div>
      <p>Sesión: <b>${escapar(n.email)}</b>${n.emulador ? ' <span class="suave">(emulador de prueba)</span>' : ''}</p>
      <p class="suave pequeño" style="margin-top:4px">Última sincronización: ${hora(n.ultima)}. Los cambios se suben y bajan solos mientras haya internet; sin conexión se guardan y se envían al volver.</p>
      ${n.error ? `<p class="pequeño" style="margin-top:6px;color:var(--peligro)">${escapar(n.error)}</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="boton" id="n-ahora">Sincronizar ahora</button>
        <button class="boton fantasma" id="n-salir">Cerrar sesión</button>
      </div>`;
    caja.querySelector('#n-ahora').addEventListener('click', () => sincronizarTodo());
    caja.querySelector('#n-salir').addEventListener('click', () => salir());
  }
}

// Pantalla completa (cuando aún no hay perfil en este equipo, p. ej. un celular nuevo).
export function mostrarNube(cont) {
  cont.innerHTML = `<div class="bienvenida">
    <div class="logo-grande"><img src="../build/icon.png" alt=""><div class="titulo-logo">Resistencia <span class="fc">f'c</span></div></div>
    <section class="tarjeta" id="caja-nube"></section>
    <div class="bienvenida-pie"><button class="boton fantasma" id="volver">${I.izquierda} Volver</button><span></span></div>
  </div>`;
  tarjetaNube(cont.querySelector('#caja-nube'));
  cont.querySelector('#volver').addEventListener('click', () => navegar(estado.perfil ? 'calendario' : 'perfiles'));
}
