// "Mi plan": cada perfil arma su semana, sus rutinas de ejercicio, su ayuno, los alimentos
// que quiere contar y sus metas. Parte del plan sugerido o de un plan en blanco.
import { estado, guardarConfig, guardarFrecuentes, contexto } from '../estado.js';
import {
  TIPOS_SESION, COMPLEMENTOS, FINALIZADOR, normalizarPlan, planSugerido, planVacio, tiposComplemento,
  ejerciciosDe, semanaDelPlan, faseDeSemana, textoMeta, ayunoConPlan, ACTIVIDADES, planDesdeActividades,
} from '../plan.js';
import { aviso, confirmar } from '../nav.js';
import { I } from '../iconos.js';
import { tarjetaSeccion, conectarTarjetas, plegarBloque, tablaEnTarjetas } from '../tarjetas.js';
import { escapar, hoyISO, idUnico, aNumero, DIAS } from '../util.js';

const PESTANAS = [
  { id: 'actividades', nombre: 'Actividades' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'rutinas', nombre: 'Rutinas de ejercicio' },
  { id: 'ayuno', nombre: 'Ayuno' },
  { id: 'alimentos', nombre: 'Alimentos' },
  { id: 'metas', nombre: 'Metas' },
];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

let pestana = null;

export function mostrarMiPlan(cont, opciones = {}) {
  pestana = opciones.abierta || null;
  const pu = normalizarPlan(estado.config.plan);
  const semanaActual = Math.max(1, semanaDelPlan(hoyISO(), contexto().inicio));

  const guardar = () => { estado.config.plan = pu; guardarConfig(); };
  const repintar = () => { const y = document.getElementById('vista').scrollTop; mostrarMiPlan(cont, {abierta:pestana}); document.getElementById('vista').scrollTop = y; };
  const guardarYRepintar = () => { guardar(); repintar(); };

  cont.innerHTML = `
    <div class="cabecera">
      <div class="titulo"><h1>Mi plan</h1><p>Configura solo lo que necesitas.</p></div>
      <details class="acciones-secundarias"><summary>Opciones del plan</summary><div class="grupo-botones">
        <button class="boton" id="sugerido">Usar plan sugerido</button>
        <button class="boton" id="blanco">Empezar en blanco</button>
      </div></details>
    </div>
    <div class="secciones-grid">${PESTANAS.map(t=>{
      const datos={actividades:['Elige cómo entrenas',I.comp],semana:['Organiza los días',I.calendario],rutinas:['Crea y adapta ejercicios',I.plan],ayuno:['Tu ventana de comida',I.ayuno],alimentos:['Lo que quieres registrar',I.comida],metas:['Objetivos personales',I.balanza]};
      return tarjetaSeccion(t.id,t.nombre,datos[t.id][0],datos[t.id][1],`<div data-panel-plan="${t.id}"></div>`,pestana===t.id?'open':'');
    }).join('')}</div>`;

  const dibujar=(tarjeta)=>{
    const id=tarjeta.dataset.seccion,panel=tarjeta.querySelector('[data-panel-plan]');
    if(panel.dataset.cargado)return;
    panel.dataset.cargado='si';
    ({ actividades: panelActividades, semana: panelSemana, rutinas: panelRutinas, ayuno: panelAyuno, alimentos: panelAlimentos, metas: panelMetas })[id](panel, pu, { guardar, guardarYRepintar, semanaActual });
    panel.querySelectorAll('.tabla-plan').forEach(tablaEnTarjetas);
    panel.querySelectorAll(':scope > section.tarjeta').forEach((s,i)=>{if(i>0)plegarBloque(s,s.querySelector('h2')?.textContent||'Más opciones');});
    panel.querySelectorAll('.rutina-propia').forEach((s,i)=>plegarBloque(s,pu.rutinas[Object.keys(pu.rutinas)[i]]?.nombre||`Rutina ${i+1}`));
  };
  cont.querySelectorAll('.secciones-grid > details').forEach(t=>{t.addEventListener('toggle',()=>{if(t.open){pestana=t.dataset.seccion;dibujar(t);}else if(pestana===t.dataset.seccion)pestana=null;});if(t.open)dibujar(t);});
  conectarTarjetas(cont);
  cont.querySelector('#sugerido').addEventListener('click', async () => {
    if (!(await confirmar('¿Usar el plan sugerido?', 'Tu semana, ayuno, alimentos y metas vuelven al plan de Resistencia f\'c. Tus rutinas propias se conservan y tus registros no se tocan.', 'Usar sugerido'))) return;
    estado.config.plan = { ...planSugerido(), rutinas: pu.rutinas };
    guardarConfig();
    aviso('Plan sugerido activado.', 'ok');
    repintar();
  });
  cont.querySelector('#blanco').addEventListener('click', async () => {
    if (!(await confirmar('¿Empezar en blanco?', 'Se desactiva todo (rutas, ejercicios, ayuno y alimentos) para que armes tu plan desde cero. Tus registros no se tocan.', 'Empezar en blanco', true))) return;
    estado.config.plan = { ...planVacio(), rutinas: pu.rutinas };
    guardarConfig();
    repintar();
  });

}

// ---------- Actividades ----------
function panelActividades(panel, pu, { guardar, guardarYRepintar }) {
  const elegidas = new Set(pu.actividades || []);
  panel.innerHTML = `
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>¿Qué entrenamiento haces?</h2></div>
      <p class="suave pequeño" style="margin-bottom:14px">Elige tus actividades y ajusta tu semana.</p>
      <div class="actividades">${ACTIVIDADES.map((a) => `<button type="button" class="actividad ${elegidas.has(a.id) ? 'activo' : ''}" data-act="${a.id}">
        <span class="emoji">${a.emoji}</span><b>${a.nombre}</b><small>${a.desc}</small></button>`).join('')}</div>
      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;align-items:center">
        <button class="boton primario" id="rearmar">Rearmar mi semana con estas actividades</button>
      </div>
    </section>`;
  panel.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.act;
    if (elegidas.has(id)) elegidas.delete(id); else elegidas.add(id);
    b.classList.toggle('activo', elegidas.has(id));
    pu.actividades = [...elegidas];
    guardar();
  }));
  panel.querySelector('#rearmar').addEventListener('click', async () => {
    if (!(await confirmar('¿Rearmar la semana?', 'Se reemplaza lo que toca cada día (rutas y rutinas) según tus actividades.', 'Rearmar'))) return;
    const nuevo = planDesdeActividades([...elegidas]);
    Object.assign(pu, { semana: nuevo.semana, intervalos: nuevo.intervalos, calentamiento: nuevo.calentamiento, finalizador: nuevo.finalizador, actividades: [...elegidas] });
    aviso('Semana rearmada. Revísala en la pestaña Semana.', 'ok');
    guardarYRepintar();
  });
}

// ---------- Semana ----------
function panelSemana(panel, pu, { guardar, guardarYRepintar }) {
  const rutinas = [{ id: '', nombre: '— Sin ejercicio —' }, ...tiposComplemento(pu)];
  panel.innerHTML = `
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Rutina semanal</h2></div>
      <div class="contenedor-tabla">
      <table class="tabla tabla-plan">
        <thead><tr><th>Día</th><th>Ruta / cardio</th><th>Tipo</th><th>Título (opcional)</th><th>Meta km</th><th>Ejercicio</th></tr></thead>
        <tbody>${ORDEN_DIAS.map((ds) => {
          const d = pu.semana[ds];
          return `<tr>
            <td><b>${DIAS[ds]}</b></td>
            <td><label class="check"><input type="checkbox" data-d="${ds}" data-k="activa" ${d.ruta.activa ? 'checked' : ''}><span>${d.ruta.activa ? 'Sí' : 'No'}</span></label></td>
            <td><select data-d="${ds}" data-k="tipo" ${d.ruta.activa ? '' : 'disabled'}>${TIPOS_SESION.map((t) => `<option value="${t.id}" ${t.id === d.ruta.tipo ? 'selected' : ''}>${t.nombre}</option>`).join('')}</select></td>
            <td><input data-d="${ds}" data-k="titulo" value="${escapar(d.ruta.titulo || '')}" placeholder="Ej. Trote en el parque" ${d.ruta.activa ? '' : 'disabled'}></td>
            <td><input data-d="${ds}" data-k="metaKm" inputmode="decimal" style="width:80px" value="${d.ruta.metaKm ?? ''}" placeholder="ruta" ${d.ruta.activa ? '' : 'disabled'}></td>
            <td><select data-d="${ds}" data-k="complemento">${rutinas.map((r) => `<option value="${r.id}" ${(d.complemento || '') === r.id ? 'selected' : ''}>${escapar(r.nombre)}</option>`).join('')}</select></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      </div>
      <p class="suave pequeño" style="margin-top:10px">Un día sin ruta y sin ejercicio cuenta como <b>descanso</b>. Si dejas "Meta km" vacío se usa la distancia de tu ruta principal.</p>
    </section>
    <section class="tarjeta" style="margin-top:16px">
      <div class="tarjeta-cab"><h2>Opciones</h2></div>
      <label class="check"><input type="checkbox" data-g="intervalos" ${pu.intervalos ? 'checked' : ''}><span><b>Progresión de intervalos sugerida</b> (4/1 → 3/2 → 2/3–4 → trote continuo) en los días de intervalos y larga</span></label>
      <label class="check"><input type="checkbox" data-g="calentamiento" ${pu.calentamiento ? 'checked' : ''}><span><b>Calentamiento y enfriamiento</b> con ilustraciones (pestaña del día)</span></label>
      <label class="check"><input type="checkbox" data-g="finalizador" ${pu.finalizador ? 'checked' : ''}><span><b>Finalizador abdominal</b> en las rutinas que lo incluyen</span></label>
    </section>`;

  panel.querySelectorAll('[data-d]').forEach((el) => el.addEventListener('change', () => {
    const d = pu.semana[el.dataset.d];
    const k = el.dataset.k;
    if (k === 'activa') { d.ruta.activa = el.checked; guardarYRepintar(); return; }
    if (k === 'complemento') d.complemento = el.value || null;
    else if (k === 'metaKm') d.ruta.metaKm = aNumero(el.value);
    else d.ruta[k] = el.value;
    guardar();
  }));
  panel.querySelectorAll('[data-g]').forEach((el) => el.addEventListener('change', () => { pu[el.dataset.g] = el.checked; guardar(); }));
}

// ---------- Rutinas ----------
function panelRutinas(panel, pu, { guardar, guardarYRepintar, semanaActual }) {
  const fase = faseDeSemana(semanaActual);
  const enFase = (v) => (Array.isArray(v) ? v[fase] : v);
  const tarjetaSugerida = (id, r) => {
    const fuera = new Set(pu.desactivados[id] || []);
    return `<details class="tarjeta rutina">
      <summary><b>${escapar(r.nombre)}</b> <span class="estado-pill nada">Sugerida</span><span class="suave pequeño" style="margin-left:auto">${r.ejercicios.length - fuera.size} de ${r.ejercicios.length} ejercicios activos</span></summary>
      <p class="suave pequeño" style="margin:8px 0">${escapar(r.formato || '')}. Valores de tu semana ${semanaActual}; suben solos cada fase.</p>
      ${r.ejercicios.map((e) => `<label class="check"><input type="checkbox" data-sug="${id}" data-ej="${e.id}" ${fuera.has(e.id) ? '' : 'checked'}><span>${escapar(e.nombre)} <span class="suave">· ${textoMeta({ ...e, series: e.series[fase], valor: e.valor[fase] })}</span></span></label>`).join('')}
      ${id !== 'finalizador' ? `<button class="boton" data-copiar="${id}" style="margin-top:10px">Copiar como rutina mía para editarla</button>` : ''}
    </details>`;
  };
  const filaEj = (rid, e, i) => `<tr>
    <td><input data-r="${rid}" data-i="${i}" data-k="nombre" value="${escapar(e.nombre)}" placeholder="Nombre del ejercicio"></td>
    <td><select data-r="${rid}" data-i="${i}" data-k="unidad"><option value="reps" ${e.unidad !== 's' ? 'selected' : ''}>repeticiones</option><option value="s" ${e.unidad === 's' ? 'selected' : ''}>segundos</option></select></td>
    <td><input data-r="${rid}" data-i="${i}" data-k="series" inputmode="numeric" style="width:64px" value="${enFase(e.series)}"></td>
    <td><input data-r="${rid}" data-i="${i}" data-k="valor" inputmode="numeric" style="width:72px" value="${enFase(e.valor)}">${Array.isArray(e.valor) ? '<small class="suave" title="Sube solo cada fase del plan; si lo editas queda fijo"> ↗ sube por fases</small>' : ''}</td>
    <td><label class="check"><input type="checkbox" data-r="${rid}" data-i="${i}" data-k="lado" ${e.lado ? 'checked' : ''}><span>por lado</span></label></td>
    <td><button class="boton icono fantasma" data-quitar-ej="${rid}" data-i="${i}" title="Quitar ejercicio">${I.basura}</button></td>
  </tr>`;
  const propias = Object.entries(pu.rutinas);

  panel.innerHTML = `
    <section class="tarjeta" style="margin-bottom:16px">
      <div class="tarjeta-cab"><h2>Mis rutinas</h2><button class="boton primario" id="nueva-rutina">${I.mas} Nueva rutina</button></div>
      ${propias.length ? '' : '<p class="suave">Todavía no tienes rutinas propias. Crea una nueva o copia una sugerida para modificarla.</p>'}
      ${propias.map(([rid, r]) => `<div class="rutina-propia">
        <div class="campos" style="grid-template-columns:2fr 3fr auto">
          <label class="campo"><span>Nombre</span><input data-rn="${rid}" data-k="nombre" value="${escapar(r.nombre)}"></label>
          <label class="campo"><span>Indicaciones (descansos, peso…)</span><input data-rn="${rid}" data-k="formato" value="${escapar(r.formato || '')}"></label>
          <label class="check" style="align-self:end"><input type="checkbox" data-rn="${rid}" data-k="finalizador" ${r.finalizador ? 'checked' : ''}><span>+ finalizador abdominal</span></label>
        </div>
        <div class="contenedor-tabla"><table class="tabla tabla-plan" style="margin-top:10px">
          <thead><tr><th>Ejercicio</th><th>Unidad</th><th>Series</th><th>Valor</th><th></th><th></th></tr></thead>
          <tbody>${r.ejercicios.map((e, i) => filaEj(rid, e, i)).join('')}</tbody>
        </table></div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="boton" data-agregar-ej="${rid}">${I.mas} Ejercicio</button>
          <button class="boton fantasma peligro" data-borrar-rutina="${rid}">${I.basura} Eliminar rutina</button>
        </div>
      </div>`).join('')}
    </section>
    <h3 class="ej-grupo">Rutinas sugeridas · desmarca los ejercicios que no quieras hacer</h3>
    <div class="dia-columna">
      ${Object.entries(COMPLEMENTOS).map(([id, r]) => tarjetaSugerida(id, r)).join('')}
      ${tarjetaSugerida('finalizador', FINALIZADOR)}
    </div>`;

  // Activar / desactivar ejercicios sugeridos
  panel.querySelectorAll('[data-sug]').forEach((el) => el.addEventListener('change', () => {
    const lista = new Set(pu.desactivados[el.dataset.sug] || []);
    if (el.checked) lista.delete(el.dataset.ej); else lista.add(el.dataset.ej);
    pu.desactivados[el.dataset.sug] = [...lista];
    guardar();
  }));
  // Copiar una sugerida con los valores de la semana actual
  panel.querySelectorAll('[data-copiar]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.copiar;
    const r = COMPLEMENTOS[id];
    const nueva = `mia-${idUnico()}`;
    pu.rutinas[nueva] = {
      nombre: `${r.nombre} (copia)`, formato: r.formato, usaPeso: !!r.usaPeso, finalizador: !!r.finalizador,
      ejercicios: ejerciciosDe(id, semanaActual, { ...pu, finalizador: false, desactivados: {} }).map((e) => ({ id: idUnico(), nombre: e.nombre, unidad: e.unidad, lado: e.lado, series: e.series, valor: e.valor })),
    };
    aviso('Rutina copiada en "Mis rutinas". Ya puedes editarla y asignarla a un día en la pestaña Semana.', 'ok');
    guardarYRepintar();
  }));
  panel.querySelector('#nueva-rutina').addEventListener('click', () => {
    pu.rutinas[`mia-${idUnico()}`] = { nombre: 'Mi rutina', formato: '', finalizador: false, ejercicios: [{ id: idUnico(), nombre: '', unidad: 'reps', lado: false, series: 3, valor: 12 }] };
    guardarYRepintar();
  });
  panel.querySelectorAll('[data-rn]').forEach((el) => el.addEventListener('change', () => {
    const r = pu.rutinas[el.dataset.rn];
    r[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
    guardar();
  }));
  panel.querySelectorAll('[data-r]').forEach((el) => el.addEventListener('change', () => {
    const e = pu.rutinas[el.dataset.r].ejercicios[Number(el.dataset.i)];
    const k = el.dataset.k;
    if (k === 'lado') e.lado = el.checked;
    else if (k === 'series' || k === 'valor') e[k] = Math.max(1, parseInt(el.value, 10) || 1);
    else e[k] = el.value;
    guardar();
  }));
  panel.querySelectorAll('[data-agregar-ej]').forEach((b) => b.addEventListener('click', () => {
    pu.rutinas[b.dataset.agregarEj].ejercicios.push({ id: idUnico(), nombre: '', unidad: 'reps', lado: false, series: 3, valor: 12 });
    guardarYRepintar();
  }));
  panel.querySelectorAll('[data-quitar-ej]').forEach((b) => b.addEventListener('click', () => {
    pu.rutinas[b.dataset.quitarEj].ejercicios.splice(Number(b.dataset.i), 1);
    guardarYRepintar();
  }));
  panel.querySelectorAll('[data-borrar-rutina]').forEach((b) => b.addEventListener('click', async () => {
    const rid = b.dataset.borrarRutina;
    if (!(await confirmar('¿Eliminar rutina?', `Se elimina "${pu.rutinas[rid].nombre}". Los días que la usaban quedan sin ejercicio. Lo que ya registraste no se borra.`, 'Eliminar', true))) return;
    delete pu.rutinas[rid];
    for (const d of Object.values(pu.semana)) if (d.complemento === rid) d.complemento = null;
    guardarYRepintar();
  }));
}

// ---------- Ayuno ----------
function panelAyuno(panel, pu, { guardar, guardarYRepintar, semanaActual }) {
  const a = pu.ayuno;
  const hoy = ayunoConPlan(Math.max(3, semanaActual), 1, pu);
  panel.innerHTML = `
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Ayuno intermitente</h2></div>
      <label class="check"><input type="checkbox" data-a="activo" ${a.activo ? 'checked' : ''}><span><b>Hago ayuno intermitente</b></span></label>
      ${a.activo ? `
      <div class="campos" style="margin-top:12px">
        <label class="campo"><span>Primera comida (abre la ventana)</span><input type="time" data-v="0" value="${a.ventana[0]}"></label>
        <label class="campo"><span>Última comida (cierra la ventana)</span><input type="time" data-v="1" value="${a.ventana[1]}"></label>
      </div>
      <p style="margin-top:10px">Tu protocolo: <b>${hoy ? hoy.protocolo : '—'}</b> <span class="suave">(${hoy ? `${hoy.horas} h de ayuno` : ''})</span></p>
      <label class="check" style="margin-top:8px"><input type="checkbox" data-a="gradual" ${a.gradual ? 'checked' : ''}><span><b>Entrada gradual</b>: la semana 1 la ventana es 3 h más temprano y 1 h más tarde; la semana 2, 2 h más temprano.</span></label>
      <label class="check"><input type="checkbox" data-a="domingo" ${a.domingo.activo ? 'checked' : ''}><span><b>Domingo flexible</b> (meta de 12–14 h)</span></label>
      ${a.domingo.activo ? `<div class="campos" style="margin-top:8px">
        <label class="campo"><span>Domingo: primera comida</span><input type="time" data-vd="0" value="${a.domingo.ventana[0]}"></label>
        <label class="campo"><span>Domingo: última comida</span><input type="time" data-vd="1" value="${a.domingo.ventana[1]}"></label>
      </div>` : ''}` : '<p class="suave" style="margin-top:8px">Sin ayuno: el día no tendrá ventana de comida, cuenta regresiva ni meta de horas de ayuno.</p>'}
    </section>`;
  panel.querySelectorAll('[data-a]').forEach((el) => el.addEventListener('change', () => {
    if (el.dataset.a === 'domingo') a.domingo.activo = el.checked; else a[el.dataset.a] = el.checked;
    guardarYRepintar();
  }));
  panel.querySelectorAll('[data-v]').forEach((el) => el.addEventListener('change', () => { if (el.value) { a.ventana[Number(el.dataset.v)] = el.value; guardarYRepintar(); } }));
  panel.querySelectorAll('[data-vd]').forEach((el) => el.addEventListener('change', () => { if (el.value) { a.domingo.ventana[Number(el.dataset.vd)] = el.value; guardar(); } }));
}

// ---------- Alimentos ----------
function panelAlimentos(panel, pu, { guardar, guardarYRepintar }) {
  panel.innerHTML = `
    <section class="tarjeta" style="margin-bottom:16px">
      <div class="tarjeta-cab"><h2>Alimentos que cuento cada día</h2><button class="boton primario" id="nuevo-alimento">${I.mas} Alimento</button></div>
      <p class="suave pequeño" style="margin-bottom:10px">Aparecen como botones +1 en la pestaña Comidas. Si pones un máximo, te aviso cuando lo pases.</p>
      ${pu.alimentos.length ? `<div class="contenedor-tabla"><table class="tabla tabla-plan">
        <thead><tr><th>Ícono</th><th>Nombre</th><th>Máximo al día</th><th>Nota / recomendación</th><th></th></tr></thead>
        <tbody>${pu.alimentos.map((al, i) => `<tr>
          <td><input data-al="${i}" data-k="emoji" value="${escapar(al.emoji || '')}" style="width:60px;text-align:center" maxlength="4"></td>
          <td><input data-al="${i}" data-k="nombre" value="${escapar(al.nombre)}"></td>
          <td><input data-al="${i}" data-k="max" inputmode="numeric" style="width:90px" value="${al.max ?? ''}" placeholder="sin límite"></td>
          <td><input data-al="${i}" data-k="nota" value="${escapar(al.nota || '')}" placeholder="Ej. 2–3 al día"></td>
          <td><button class="boton icono fantasma" data-quitar-al="${i}" title="Quitar">${I.basura}</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="suave">No estás contando ningún alimento.</p>'}
    </section>
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Comidas frecuentes</h2></div>
      <p class="suave pequeño" style="margin-bottom:10px">Se agregan con un toque en la pestaña Comidas. Para crear una nueva, registra la comida en un día y pulsa "☆ Guardar como frecuente".</p>
      ${estado.frecuentes.length ? `<div class="contenedor-tabla"><table class="tabla tabla-plan">
        <thead><tr><th>Descripción</th><th>Calorías</th><th></th></tr></thead>
        <tbody>${estado.frecuentes.map((f, i) => `<tr>
          <td><input data-fr="${i}" data-k="desc" value="${escapar(f.desc)}"></td>
          <td><input data-fr="${i}" data-k="kcal" inputmode="numeric" style="width:100px" value="${f.kcal ?? ''}"></td>
          <td><button class="boton icono fantasma" data-quitar-fr="${i}" title="Quitar">${I.basura}</button></td>
        </tr>`).join('')}</tbody></table></div>` : '<p class="suave">Aún no tienes comidas frecuentes.</p>'}
    </section>`;

  panel.querySelector('#nuevo-alimento').addEventListener('click', () => {
    pu.alimentos.push({ id: idUnico(), nombre: 'Nuevo alimento', emoji: '🥗', max: null, nota: '' });
    guardarYRepintar();
  });
  panel.querySelectorAll('[data-al]').forEach((el) => el.addEventListener('change', () => {
    const al = pu.alimentos[Number(el.dataset.al)];
    al[el.dataset.k] = el.dataset.k === 'max' ? (parseInt(el.value, 10) || null) : el.value;
    guardar();
  }));
  panel.querySelectorAll('[data-quitar-al]').forEach((b) => b.addEventListener('click', () => { pu.alimentos.splice(Number(b.dataset.quitarAl), 1); guardarYRepintar(); }));
  panel.querySelectorAll('[data-fr]').forEach((el) => el.addEventListener('change', () => {
    const f = estado.frecuentes[Number(el.dataset.fr)];
    f[el.dataset.k] = el.dataset.k === 'kcal' ? aNumero(el.value) : el.value;
    guardarFrecuentes();
  }));
  panel.querySelectorAll('[data-quitar-fr]').forEach((b) => b.addEventListener('click', async () => {
    estado.frecuentes.splice(Number(b.dataset.quitarFr), 1);
    await guardarFrecuentes();
    guardarYRepintar();
  }));
}

// ---------- Metas ----------
function panelMetas(panel, pu, { guardar }) {
  const m = pu.metas;
  const campo = (k, etiqueta, unidad, ayuda) => `<label class="campo"><span>${etiqueta}</span><div class="con-unidad"><input data-m="${k}" inputmode="decimal" value="${m[k] ?? ''}"><em>${unidad}</em></div>${ayuda ? `<small class="suave">${ayuda}</small>` : ''}</label>`;
  panel.innerHTML = `
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Metas diarias</h2></div>
      <div class="campos">
        ${campo('aguaVasos', 'Agua', 'vasos', 'Vasos de 250 ml (10 vasos = 2,5 L)')}
        ${campo('suenoHoras', 'Sueño', 'h', 'La marca verde de sueño se da desde esta cantidad')}
        ${campo('kcalMin', 'Calorías mínimas', 'kcal', 'Aviso si comes menos en día de entrenamiento (vacío = sin aviso)')}
        ${campo('kcalMax', 'Calorías de referencia', 'kcal', 'Tope de referencia para bajar de peso')}
      </div>
      <p class="suave pequeño" style="margin-top:12px">El peso meta y la fecha de inicio del plan se cambian en <b>Perfil</b>.</p>
    </section>`;
  panel.querySelectorAll('[data-m]').forEach((el) => el.addEventListener('change', () => { m[el.dataset.m] = aNumero(el.value); guardar(); }));
}
