// Creación del perfil la primera vez (bienvenida) y edición del perfil después.
import { estado, guardarPerfil, guardarRutas, guardarConfig, nuevaRuta, subtitulo, reiniciarEstado } from '../estado.js';
import { pesoMetaSugerido, imc, INICIO_POR_DEFECTO, planSugerido, planVacio } from '../plan.js';
import { aviso, navegar } from '../nav.js';
import { I } from '../iconos.js';
import { aNumero, escapar, num, hoyISO, proximoLunes, fechaLarga, diasEntre } from '../util.js';

const inicioSugerido = () => {
  const lunes = proximoLunes(hoyISO());
  return lunes < INICIO_POR_DEFECTO ? INICIO_POR_DEFECTO : lunes;
};

// ---------- Formulario de datos personales (compartido) ----------
function formularioPerfil(p) {
  const v = (x) => (x == null ? '' : String(x).replace('.', ','));
  return `
    <div class="campos" style="grid-template-columns:1fr">
      <label class="campo"><span>Nombre</span><input id="p-nombre" value="${escapar(p.nombre || '')}"></label>
    </div>
    <div class="campos" style="margin-top:12px">
      <label class="campo"><span>Sexo</span><select id="p-sexo">
        <option value="" ${p.sexo ? '' : 'selected'} disabled>Elegir…</option>
        <option value="H" ${p.sexo === 'H' ? 'selected' : ''}>Hombre</option>
        <option value="M" ${p.sexo === 'M' ? 'selected' : ''}>Mujer</option>
      </select></label>
      <label class="campo"><span>Fecha de nacimiento</span><input type="date" id="p-nac" value="${p.nacimiento || ''}"></label>
      <label class="campo"><span>Estatura</span><div class="con-unidad"><input id="p-estatura" inputmode="decimal" value="${v(p.estatura)}"><em>m</em></div></label>
      <label class="campo"><span>Peso inicial</span><div class="con-unidad"><input id="p-peso" inputmode="decimal" value="${v(p.pesoInicial)}"><em>kg</em></div></label>
      <label class="campo"><span>Cintura inicial (opcional)</span><div class="con-unidad"><input id="p-cintura" inputmode="decimal" value="${v(p.cinturaInicial)}"><em>cm</em></div></label>
      <label class="campo"><span>Peso meta</span><div class="con-unidad"><input id="p-meta" inputmode="decimal" value="${v(p.pesoMeta)}"><em>kg</em></div></label>
      <label class="campo"><span>Inicio del plan (lunes)</span><input type="date" id="p-inicio" value="${p.fechaInicio || ''}"></label>
    </div>
    <p class="suave pequeño" id="p-info" style="margin-top:10px"></p>`;
}

function conectarFormulario(raiz, p, alCambiarSexo) {
  raiz.querySelector('#p-sexo').addEventListener('change', (e) => {
    p.sexo = e.target.value;
    alCambiarSexo?.();
  });
  const info = () => {
    const est = aNumero(raiz.querySelector('#p-estatura').value);
    const peso = aNumero(raiz.querySelector('#p-peso').value);
    const sug = pesoMetaSugerido(est);
    const partes = [];
    if (est && peso) partes.push(`IMC inicial: <b>${num(imc(peso, est), 1)}</b>`);
    if (sug) partes.push(`Meta sugerida (IMC 25): <b>${sug} kg</b>`);
    const ini = raiz.querySelector('#p-inicio').value;
    if (ini) partes.push(`El plan arranca el <b>${fechaLarga(ini)}</b>`);
    raiz.querySelector('#p-info').innerHTML = partes.join(' · ');
  };
  raiz.querySelectorAll('input').forEach((i) => i.addEventListener('input', info));
  info();
}

function leerFormulario(raiz, p) {
  const n = (id) => aNumero(raiz.querySelector(id).value);
  const est = n('#p-estatura');
  const r = {
    ...p,
    nombre: raiz.querySelector('#p-nombre').value.trim(),
    nacimiento: raiz.querySelector('#p-nac').value || null,
    estatura: est && est > 3 ? est / 100 : est, // si escriben 161 (cm) se convierte a 1,61 m
    pesoInicial: n('#p-peso'),
    cinturaInicial: n('#p-cintura'),
    pesoMeta: n('#p-meta') || pesoMetaSugerido(est && est > 3 ? est / 100 : est),
    fechaInicio: raiz.querySelector('#p-inicio').value || inicioSugerido(),
  };
  const faltan = [];
  if (!r.nombre) faltan.push('nombre');
  if (!r.sexo) faltan.push('sexo');
  if (!r.estatura) faltan.push('estatura');
  if (!r.pesoInicial) faltan.push('peso inicial');
  if (!r.pesoMeta) faltan.push('peso meta');
  if (!raiz.querySelector('#p-inicio').value) faltan.push('inicio del plan');
  return { perfil: r, faltan };
}

// ---------- Bienvenida (primera vez) ----------
export async function mostrarBienvenida(cont) {
  const hayPerfiles = (await window.api.listarPerfiles()).length > 0;
  let paso = 1; // 1 = datos personales, 2 = ruta principal y plan
  let tipoPlan = 'sugerido';
  const p = {};
  const ruta = { nombre: '', ciudad: '', terreno: '', distancia: null, desnivel: null };

  const pintar = () => {
    cont.innerHTML = `<div class="bienvenida">
      <div class="logo-grande"><img src="../build/icon.png" alt=""><div class="titulo-logo">Resistencia <span class="fc">f'c</span></div><div class="sub-logo" id="sub">${escapar(subtitulo(p.sexo))}</div></div>
      <div class="pasos">${[1, 2].map((i) => `<i class="${i <= paso ? 'activo' : ''}"></i>`).join('')}</div>
      <section class="tarjeta" id="paso"></section>
      <div class="bienvenida-pie">
        ${hayPerfiles ? `<button class="boton fantasma" id="a-perfiles">${I.izquierda} Volver a los perfiles</button>` : '<span></span>'}
        <button class="boton fantasma" id="importar">${I.carpeta} ¿Ya tienes un perfil? Importarlo</button>
      </div>
    </div>`;
    const caja = cont.querySelector('#paso');
    cont.querySelector('#a-perfiles')?.addEventListener('click', () => navegar('perfiles'));
    cont.querySelector('#importar').addEventListener('click', () => importarYAbrir());

    if (paso === 1) {
      caja.innerHTML = `<div class="tarjeta-cab"><h2>Crea tu perfil</h2></div>
        <p class="suave" style="margin-bottom:14px">Tus datos de partida. Podrás cambiarlos cuando quieras en <b>Perfil</b>.</p>
        ${formularioPerfil(p)}
        <div style="display:flex;justify-content:flex-end;margin-top:18px">
          <button class="boton primario grande" id="seguir">Continuar ${I.derecha}</button>
        </div>`;
      conectarFormulario(caja, p, () => { cont.querySelector('#sub').textContent = subtitulo(p.sexo); });
      caja.querySelector('#seguir').addEventListener('click', () => {
        const { perfil, faltan } = leerFormulario(caja, p);
        if (faltan.length) { aviso('Falta: ' + faltan.join(', '), 'error'); return; }
        Object.assign(p, perfil);
        paso = 2;
        pintar();
      });
    }

    if (paso === 2) {
      caja.innerHTML = `<div class="tarjeta-cab"><h2>Tu ruta principal</h2></div>
        <p class="suave" style="margin-bottom:14px">La ruta donde entrenas normalmente. El desnivel (metros de subida) puedes dejarlo vacío y ponerlo después, cuando lo midas con una app de GPS.</p>
        <div class="campos">
          <label class="campo"><span>Nombre</span><input id="r-nombre" value="${escapar(ruta.nombre)}"></label>
          <label class="campo"><span>Ciudad</span><input id="r-ciudad" value="${escapar(ruta.ciudad)}"></label>
          <label class="campo"><span>Terreno</span><select id="r-terreno"><option value="" ${ruta.terreno ? '' : 'selected'} disabled>Elegir…</option>${[['montana', 'Montaña'], ['plano', 'Plano'], ['mixto', 'Mixto']].map(([v, t]) => `<option value="${v}" ${ruta.terreno === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="campo"><span>Distancia ida y vuelta</span><div class="con-unidad"><input id="r-km" inputmode="decimal" value="${ruta.distancia != null ? String(ruta.distancia).replace('.', ',') : ''}"><em>km</em></div></label>
          <label class="campo"><span>Desnivel positivo</span><div class="con-unidad"><input id="r-desnivel" inputmode="decimal" value="${ruta.desnivel ?? ''}"><em>m</em></div></label>
        </div>
        <p class="suave pequeño" style="margin:18px 0 8px;font-weight:600">¿Con qué plan empiezas?</p>
        <div class="sexo-opciones">
          <button type="button" data-plan="sugerido" class="${tipoPlan === 'sugerido' ? 'activo' : ''}">Plan sugerido<small>Rutina semanal, ejercicios, ayuno 16:8 y metas listas para usar</small></button>
          <button type="button" data-plan="blanco" class="${tipoPlan === 'blanco' ? 'activo' : ''}">Plan en blanco<small>Lo armo yo desde cero en "Mi plan"</small></button>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:18px">
          <button class="boton fantasma" id="atras">${I.izquierda} Atrás</button>
          <button class="boton primario grande" id="terminar">${I.check} Empezar</button>
        </div>`;
      const leerRuta = () => Object.assign(ruta, {
        nombre: caja.querySelector('#r-nombre').value.trim() || 'Mi ruta',
        ciudad: caja.querySelector('#r-ciudad').value.trim(),
        terreno: caja.querySelector('#r-terreno').value || 'montana',
        distancia: aNumero(caja.querySelector('#r-km').value),
        desnivel: aNumero(caja.querySelector('#r-desnivel').value),
      });
      caja.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => {
        tipoPlan = b.dataset.plan;
        caja.querySelectorAll('[data-plan]').forEach((x) => x.classList.toggle('activo', x === b));
      }));
      caja.querySelector('#atras').addEventListener('click', () => { leerRuta(); paso = 1; pintar(); });
      caja.querySelector('#terminar').addEventListener('click', async () => {
        leerRuta();
        await window.api.crearPerfil(p.nombre);
        reiniciarEstado();
        const r = nuevaRuta({ ...ruta });
        estado.perfil = { ...p, creado: hoyISO() };
        estado.rutas = [r];
        estado.config.rutaPrincipal = r.id;
        estado.config.plan = tipoPlan === 'blanco' ? planVacio() : planSugerido();
        estado.config.terreno = { actual: r.terreno === 'plano' ? 'plano' : 'montana', desde: r.terreno === 'plano' ? estado.perfil.fechaInicio : null };
        await guardarPerfil();
        await guardarRutas();
        await guardarConfig.ya();
        recargarEnPerfil();
      });
    }
  };
  pintar();
}

// Recarga el programa ya dentro del perfil activo (sin pasar por la pantalla de perfiles).
export function recargarEnPerfil() {
  try { sessionStorage.setItem('saltarSelector', '1'); } catch { /* nada */ }
  location.reload();
}

export async function importarYAbrir() {
  try {
    const id = await window.api.importarPerfil();
    if (id) recargarEnPerfil();
  } catch (e) {
    aviso(e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'error');
  }
}

// ---------- Perfil (edición) ----------
export function mostrarPerfil(cont) {
  const p = { ...estado.perfil };
  const edad = p.nacimiento ? Math.floor(diasEntre(p.nacimiento, hoyISO()) / 365.25) : null;
  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Perfil</h1><p>Tus datos de partida y metas.</p></div></div>
    <div class="rejilla rejilla-2" style="align-items:start">
      <section class="tarjeta" id="form">
        ${formularioPerfil(p)}
        <div style="display:flex;justify-content:flex-end;margin-top:18px"><button class="boton primario" id="guardar">${I.guardar} Guardar cambios</button></div>
      </section>
      <section class="tarjeta">
        <div class="tarjeta-cab"><h2>Resumen</h2></div>
        <div class="rejilla rejilla-2">
          <div class="kpi"><span class="etiqueta">Edad</span><span class="valor">${edad ?? '—'}<small>años</small></span></div>
          <div class="kpi"><span class="etiqueta">Estatura</span><span class="valor">${num(p.estatura, 2)}<small>m</small></span></div>
          <div class="kpi"><span class="etiqueta">Peso inicial</span><span class="valor">${num(p.pesoInicial, 1)}<small>kg</small></span><span class="nota">IMC ${num(imc(p.pesoInicial, p.estatura), 1)}</span></div>
          <div class="kpi"><span class="etiqueta">Meta</span><span class="valor">${num(p.pesoMeta, 1)}<small>kg</small></span><span class="nota">IMC ${num(imc(p.pesoMeta, p.estatura), 1)}</span></div>
        </div>
        <p class="suave pequeño" style="margin-top:16px">Cambiar la fecha de inicio mueve las semanas del plan (entrada gradual del ayuno y progresión de intervalos). Tus registros no se pierden.</p>
      </section>
    </div>
    <section class="tarjeta" style="margin-top:16px">
      <div class="tarjeta-cab"><h2>Compartir o llevar tu perfil</h2></div>
      <div class="rejilla rejilla-2">
        <div>
          <p><b>Exportar</b> crea una carpeta <span class="num">"Perfil - ${escapar(p.nombre || '')}"</span> con todo lo tuyo: días, comidas, rutas, medidas, fotos y colores.</p>
          <p class="suave pequeño" style="margin-top:6px">Pásala por USB, Drive o correo (comprimida en .zip). En la otra PC, con el programa instalado, se abre con <b>Importar perfil</b>.</p>
          <button class="boton primario" id="exportar" style="margin-top:12px">${I.descargar} Exportar mi perfil</button>
        </div>
        <div>
          <p><b>Otros perfiles</b>: cada persona tiene sus propios datos en esta PC. Puedes crear uno nuevo, importar uno que te pasaron o cambiar de perfil.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button class="boton" id="importar">${I.carpeta} Importar perfil</button>
            <button class="boton" id="al-celular">📱 Enviar perfil al celular</button>
            <button class="boton" id="cambiar">${I.perfil} Cambiar / crear perfil</button>
          </div>
        </div>
      </div>
    </section>`;
  cont.querySelector('#exportar').addEventListener('click', async () => {
    try {
      const ruta = await window.api.exportarPerfil();
      if (ruta) aviso('Perfil exportado en: ' + ruta, 'ok');
    } catch (e) { aviso('No se pudo exportar: ' + e.message, 'error'); }
  });
  cont.querySelector('#importar').addEventListener('click', () => importarYAbrir());
  cont.querySelector('#cambiar').addEventListener('click', () => navegar('perfiles'));
  cont.querySelector('#al-celular').addEventListener('click', async () => {
    const { enviarPerfilAlCelular } = await import('../celular.js');
    enviarPerfilAlCelular();
  });
  const form = cont.querySelector('#form');
  conectarFormulario(form, p);
  cont.querySelector('#guardar').addEventListener('click', async () => {
    const { perfil, faltan } = leerFormulario(form, p);
    if (faltan.length) { aviso('Falta: ' + faltan.join(', '), 'error'); return; }
    estado.perfil = perfil;
    await guardarPerfil();
    window.dispatchEvent(new Event('marca-cambiada'));
    aviso('Perfil guardado.', 'ok');
    mostrarPerfil(cont);
  });
}
