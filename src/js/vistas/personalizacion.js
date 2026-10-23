// Panel de personalización: temas, colores de cada elemento, fondo, tamaño de letra y esquinas.
import { estado, guardarConfig } from '../estado.js';
import { PRESETS, VARIABLES, aplicarTema, coloresActuales } from '../tema.js';
import { confirmar } from '../nav.js';
import { I } from '../iconos.js';

export async function mostrarPersonalizacion(cont) {
  const t = estado.config.tema;
  const preset = PRESETS[t.preset] || PRESETS.oscuro;
  const colores = coloresActuales();
  const personal = t.personal?.[t.preset] || {};
  const f = t.fondo || { tipo: 'tema' };
  const urlImagen = f.imagen ? await window.api.urlArchivo(f.imagen) : null;

  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Personalización</h1><p>Elige un tema y ajusta cada color a tu gusto. Los cambios se ven al instante y se guardan solos.</p></div></div>

    <section class="tarjeta" style="margin-bottom:16px">
      <div class="tarjeta-cab"><h2>Tema</h2></div>
      <div class="presets">
        ${Object.entries(PRESETS).map(([id, p]) => {
          const c = { ...p.colores, ...(t.personal?.[id] || {}) };
          return `<button class="preset ${id === t.preset ? 'activo' : ''}" data-preset="${id}">
            <div class="muestra" style="background:${c.fondo}"><div class="b" style="background:${c.barra}"></div>
              <div class="c"><i style="background:${c.superficie};width:90%"></i><i style="background:${c.acento};width:45%"></i><i style="background:${c['c-ayuno']};width:65%"></i></div></div>
            <div class="nombre"><span>${p.nombre}</span><span class="suave">${p.modo === 'oscuro' ? '☾' : '☀'}</span></div>
          </button>`;
        }).join('')}
      </div>
    </section>

    <div class="rejilla rejilla-2" style="align-items:start">
      <section class="tarjeta">
        <div class="tarjeta-cab"><h2>Colores del tema "${preset.nombre}"</h2>
          <button class="boton fantasma" id="restaurar-todo" ${Object.keys(personal).length ? '' : 'disabled'}>Restaurar colores</button></div>
        ${VARIABLES.map((g) => `<h3 style="margin:14px 0 4px" class="suave">${g.grupo}</h3>
          ${g.vars.map(([v, nombre]) => `<div class="fila-color ${personal[v] ? 'cambiado' : ''}">
            <input type="color" data-var="${v}" value="${aHex(colores[v])}"><span>${nombre}</span>
            <button class="restaurar" data-restaurar="${v}">restaurar</button></div>`).join('')}`).join('')}
      </section>

      <div class="dia-columna">
        <section class="tarjeta">
          <div class="tarjeta-cab"><h2>Fondo del programa</h2></div>
          <div class="segmentado" id="tipo-fondo">
            ${[['tema', 'Color del tema'], ['degradado', 'Degradado'], ['imagen', 'Imagen']].map(([v, n]) => `<button data-fondo="${v}" class="${f.tipo === v ? 'activo' : ''}">${n}</button>`).join('')}
          </div>
          ${f.tipo === 'degradado' ? `<div style="display:flex;gap:16px;align-items:center;margin-top:14px;flex-wrap:wrap">
              <label class="fila-color"><input type="color" data-deg="color1" value="${aHex(f.color1 || colores.fondo)}"><span>Color 1</span></label>
              <label class="fila-color"><input type="color" data-deg="color2" value="${aHex(f.color2 || colores.acento)}"><span>Color 2</span></label>
            </div>
            <label class="campo" style="margin-top:8px"><span>Ángulo: <b id="val-ang">${f.angulo ?? 135}°</b></span><input type="range" min="0" max="360" step="5" data-deg="angulo" value="${f.angulo ?? 135}"></label>` : ''}
          ${f.tipo === 'imagen' ? `<div style="margin-top:14px">
              <div class="vista-previa-fondo" style="${urlImagen ? `background-image:url('${urlImagen}')` : ''}"></div>
              <button class="boton" id="elegir-imagen" style="margin-top:10px">${I.imagen} ${f.imagen ? 'Cambiar imagen' : 'Elegir imagen'}</button>
              <label class="campo" style="margin-top:12px"><span>Visibilidad de la imagen: <b id="val-op">${f.opacidad ?? 35}%</b></span><input type="range" min="5" max="100" step="5" data-img="opacidad" value="${f.opacidad ?? 35}"></label>
              <label class="campo" style="margin-top:8px"><span>Desenfoque: <b id="val-des">${f.desenfoque ?? 0} px</b></span><input type="range" min="0" max="20" step="1" data-img="desenfoque" value="${f.desenfoque ?? 0}"></label>
              <p class="suave pequeño" style="margin-top:8px">La imagen se copia a tu carpeta de datos (subcarpeta "fondos"). Las tarjetas siguen siendo sólidas para que todo se lea bien.</p>
            </div>` : ''}
        </section>

        <section class="tarjeta">
          <div class="tarjeta-cab"><h2>Texto y forma</h2></div>
          <label class="campo"><span>Tamaño de letra: <b id="val-letra">${t.escalaLetra || 100}%</b></span><input type="range" min="85" max="130" step="5" id="letra" value="${t.escalaLetra || 100}"></label>
          <label class="campo" style="margin-top:12px"><span>Redondeo de esquinas: <b id="val-radio">${t.radio ?? 12} px</b></span><input type="range" min="0" max="22" step="1" id="radio" value="${t.radio ?? 12}"></label>
          <div style="margin-top:16px"><button class="boton" id="restaurar-general">Volver a los valores por defecto</button></div>
        </section>
      </div>
    </div>`;

  const aplicar = async () => { await aplicarTema(); window.dispatchEvent(new Event('marca-cambiada')); guardarConfig(); };

  cont.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', async () => {
    t.preset = b.dataset.preset;
    await aplicar();
    mostrarPersonalizacion(cont);
  }));

  cont.querySelectorAll('[data-var]').forEach((inp) => inp.addEventListener('input', async () => {
    t.personal = t.personal || {};
    t.personal[t.preset] = { ...(t.personal[t.preset] || {}), [inp.dataset.var]: inp.value };
    inp.closest('.fila-color').classList.add('cambiado');
    cont.querySelector('#restaurar-todo').disabled = false;
    await aplicar();
  }));

  cont.querySelectorAll('[data-restaurar]').forEach((b) => b.addEventListener('click', async () => {
    delete t.personal?.[t.preset]?.[b.dataset.restaurar];
    await aplicar();
    mostrarPersonalizacion(cont);
  }));

  cont.querySelector('#restaurar-todo').addEventListener('click', async () => {
    if (!(await confirmar('¿Restaurar colores?', `Se quitarán todos tus colores personalizados del tema "${preset.nombre}".`, 'Restaurar'))) return;
    if (t.personal) delete t.personal[t.preset];
    await aplicar();
    mostrarPersonalizacion(cont);
  });

  cont.querySelectorAll('[data-fondo]').forEach((b) => b.addEventListener('click', async () => {
    t.fondo = { ...f, tipo: b.dataset.fondo };
    await aplicar();
    mostrarPersonalizacion(cont);
  }));

  cont.querySelectorAll('[data-deg]').forEach((inp) => inp.addEventListener('input', async () => {
    t.fondo = { ...t.fondo, [inp.dataset.deg]: inp.dataset.deg === 'angulo' ? Number(inp.value) : inp.value };
    if (inp.dataset.deg === 'angulo') cont.querySelector('#val-ang').textContent = inp.value + '°';
    await aplicar();
  }));

  cont.querySelectorAll('[data-img]').forEach((inp) => inp.addEventListener('input', async () => {
    t.fondo = { ...t.fondo, [inp.dataset.img]: Number(inp.value) };
    cont.querySelector(inp.dataset.img === 'opacidad' ? '#val-op' : '#val-des').textContent = inp.value + (inp.dataset.img === 'opacidad' ? '%' : ' px');
    await aplicar();
  }));

  cont.querySelector('#elegir-imagen')?.addEventListener('click', async () => {
    const rel = await window.api.importarImagen('fondos');
    if (!rel) return;
    t.fondo = { ...t.fondo, tipo: 'imagen', imagen: rel };
    await aplicar();
    mostrarPersonalizacion(cont);
  });

  cont.querySelector('#letra').addEventListener('input', async (e) => {
    t.escalaLetra = Number(e.target.value);
    cont.querySelector('#val-letra').textContent = e.target.value + '%';
    await aplicar();
  });
  cont.querySelector('#radio').addEventListener('input', async (e) => {
    t.radio = Number(e.target.value);
    cont.querySelector('#val-radio').textContent = e.target.value + ' px';
    await aplicar();
  });
  cont.querySelector('#restaurar-general').addEventListener('click', async () => {
    t.escalaLetra = 100;
    t.radio = 12;
    t.fondo = { tipo: 'tema' };
    await aplicar();
    mostrarPersonalizacion(cont);
  });
}

function aHex(c) {
  if (!c) return '#000000';
  if (/^#[0-9a-f]{6}$/i.test(c)) return c;
  if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c.slice(1).split('').map((x) => x + x).join('');
  return '#000000';
}
