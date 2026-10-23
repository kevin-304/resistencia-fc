import { alSalir } from './nav.js';
import { construirSesion, RelojRutina, textoReloj, avisoCuenta } from './reloj-rutina.js';
import { figuraReloj } from './figura-reloj.js';

const leer = clave => { try { return JSON.parse(sessionStorage.getItem(clave)); } catch { return null; } };
const escribir = (clave, valor) => { try { sessionStorage.setItem(clave, JSON.stringify(valor)); } catch { /* El reloj funciona aunque no haya almacenamiento disponible. */ } };

export function montarTemporizador(caja, { rutina, ejercicios, perfil, fecha, tipo, alComenzar, alTerminar }) {
  if (!caja || !ejercicios.length) return;
  const clave = `rfc-reloj:${perfil}:${fecha}:${tipo}`;
  const preferencias = leer(clave + ':opciones') || {};
  let modo = ['completa', 'entrenamiento', 'calentamiento', 'principal', 'abdomen', 'cardio'].includes(preferencias.modo) ? preferencias.modo : 'entrenamiento';
  let trabajo = Number(preferencias.trabajo) || 40;
  let descanso = Number(preferencias.descanso) || 20;
  let sonido = preferencias.sonido !== false;
  let sesion;
  let reloj;
  let firma;
  let mensaje = '';
  let audio = null;
  let bloqueo = null;
  let peticionPantalla = 0;
  let desmontado = false;
  let ultimaPintada = '';
  let ultimaPersistencia = 0;
  let ultimoTick = Date.now();
  let ultimoAviso = null;
  let ultimaFigura = '';
  let iniciadoEn = null;
  let finalNotificado = false;

  function preparar(recuperar = true) {
    ultimaPintada = '';
    ultimaFigura = '';
    ultimoAviso = null;
    sesion = construirSesion(rutina, ejercicios, { modo, trabajo, descanso });
    if (!sesion.es60 && modo !== 'calentamiento') modo = 'entrenamiento';
    firma = JSON.stringify(sesion.etapas);
    const guardado = recuperar ? leer(clave) : null;
    reloj = new RelojRutina(sesion.etapas, guardado?.firma === firma ? guardado.reloj : null);
    iniciadoEn = guardado?.firma === firma && Number.isFinite(guardado.iniciadoEn) ? guardado.iniciadoEn : null;
    finalNotificado = guardado?.firma === firma && !!guardado.finalNotificado;
    if (guardado?.firma === firma && reloj.transcurridoMs > 0 && !reloj.terminado) mensaje = 'En pausa.';
  }
  preparar();

  caja.innerHTML = `<section class="temporizador" aria-label="Temporizador guiado de la rutina">
    <div class="reloj-cabecera"><h3 data-reloj-titulo>Rutina</h3><span data-reloj-total></span></div>
    <div class="reloj-inicio" data-reloj-inicio><button type="button" class="boton" data-reloj-calentar>Comenzar calentamiento</button></div>
    <div class="reloj-botones">
      <button type="button" class="boton comenzar-verde" data-reloj-iniciar>Comenzar rutina</button>
      <button type="button" class="boton" data-reloj-serie>Terminé la serie</button>
      <button type="button" class="boton" data-reloj-anterior aria-label="Paso anterior" title="Paso anterior">←</button>
      <button type="button" class="boton" data-reloj-extra>+30 s</button>
      <button type="button" class="boton" data-reloj-saltar aria-label="Paso siguiente" title="Paso siguiente">→</button>
      <button type="button" class="boton fantasma" data-reloj-finalizar>Finalizar</button>
      <button type="button" class="boton fantasma" data-reloj-reiniciar>Reiniciar</button>
    </div>
    <details class="reloj-ajustes" data-reloj-ajustes><summary>Detalles</summary><div class="reloj-opciones">
      <label class="campo"><span>Qué vas a hacer</span><select data-reloj-modo>
        <option value="entrenamiento">Rutina</option><option value="calentamiento">Calentamiento</option><option value="completa">Calentamiento + rutina</option>
        ${sesion.es60 ? '<option value="principal">Solo bloque principal</option><option value="abdomen">Solo abdomen · 12 min</option><option value="cardio">Solo cierre cardio · 5 min</option>' : ''}
      </select></label>
      ${!sesion.es60 ? `<label class="campo"><span>Ventana para repeticiones</span><select data-reloj-trabajo>${[20,30,40,45,60,90,120].map(s=>`<option value="${s}">${s} s</option>`).join('')}</select></label>
        <label class="campo"><span>Descanso</span><select data-reloj-descanso>${[10,15,20,30,45,60,90,120].map(s=>`<option value="${s}">${s} s</option>`).join('')}</select></label>` : ''}
      <label class="check"><input type="checkbox" data-reloj-sonido ${sonido ? 'checked' : ''}><span>Avisos sonoros</span></label>
    </div><p class="suave pequeño">Horario automático. Registra tus series al terminar.</p></details>
    <div data-reloj-sesion>
    <div class="reloj-panel" data-reloj-panel>
      <div class="reloj-etiqueta" data-reloj-etiqueta aria-live="polite"></div>
      <div class="reloj-nombre" data-reloj-nombre></div>
      <div class="reloj-vuelta" data-reloj-vuelta></div>
      <div class="reloj-visual" data-reloj-visual></div>
      <div class="reloj-cuenta" data-reloj-cuenta role="timer" aria-label="Tiempo restante del paso actual" aria-live="off">00:00</div>
      <p class="reloj-indicacion" data-reloj-indicacion></p>
      <p class="reloj-siguiente" data-reloj-siguiente></p>
    </div>
    <div class="reloj-progreso"><progress data-reloj-progreso max="100" value="0" aria-label="Avance de la sesión"></progress><span data-reloj-transcurrido></span></div>
    </div>
    <p class="suave pequeño reloj-mensaje" data-reloj-mensaje role="status"></p>
  </section>`;
  const el = nombre => caja.querySelector(`[data-reloj-${nombre}]`);
  el('modo').value = modo;
  if (el('trabajo')) el('trabajo').value = trabajo;
  if (el('descanso')) el('descanso').value = descanso;
  const guardar = () => { escribir(clave, { firma, reloj: reloj.guardar(), iniciadoEn, finalNotificado }); ultimaPersistencia = Date.now(); };
  const guardarOpciones = () => escribir(clave + ':opciones', { modo, trabajo, descanso, sonido });

  async function despertarAudio() {
    if (!sonido) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio ||= new Audio();
      await audio.resume();
    } catch { /* Se conserva la señal visual si el equipo no permite sonido. */ }
  }
  function avisar(final = false, cuenta = false) {
    if (!sonido || !audio || audio.state !== 'running') return;
    try {
      const tono = audio.createOscillator();
      const ganancia = audio.createGain();
      tono.frequency.value = cuenta ? 660 : final ? 1046 : reloj.etapa?.clase === 'descanso' || reloj.descansoSerie ? 440 : 880;
      ganancia.gain.setValueAtTime(0.0001, audio.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (cuenta ? 0.09 : final ? 0.65 : 0.2));
      tono.connect(ganancia); ganancia.connect(audio.destination);
      tono.start(); tono.stop(audio.currentTime + (final ? 0.7 : 0.25));
    } catch { /* sin sonido */ }
  }
  async function mantenerPantalla() {
    if (!navigator.wakeLock || document.hidden) return;
    if (bloqueo && !bloqueo.released) return;
    const peticion = ++peticionPantalla;
    try {
      const nuevo = await navigator.wakeLock.request('screen');
      if (peticion !== peticionPantalla || desmontado || !reloj.enMarcha || document.hidden) { await nuevo.release(); return; }
      bloqueo = nuevo;
    } catch { /* no todos los dispositivos admiten mantener la pantalla encendida */ }
  }
  function liberarPantalla() { peticionPantalla++; const anterior = bloqueo; bloqueo = null; anterior?.release().catch(() => {}); }

  function pintar() {
    if (desmontado) return;
    const e = reloj.etapa;
    if (reloj.terminado && iniciadoEn && !finalNotificado) { finalNotificado = true; if(modo!=='calentamiento')alTerminar?.(Date.now(), iniciadoEn); guardar(); }
    const enDescanso = e?.clase === 'descanso' || reloj.descansoSerie;
    const faltan = reloj.terminado ? 0 : reloj.restanteMs / 1000 + sesion.etapas.slice(reloj.indice + 1).reduce((n, p) => n + p.segundos, 0);
    const resumen = JSON.stringify([reloj.indice, reloj.enMarcha, reloj.descansoSerie, Math.ceil(reloj.restanteMs / 1000), Math.floor(reloj.transcurridoMs / 1000), mensaje]);
    if (resumen === ultimaPintada) return;
    ultimaPintada = resumen;
    el('total').textContent = `Programado: ${textoReloj(sesion.totalSegundos)}${reloj.extraMs ? ` + ${textoReloj(reloj.extraMs / 1000)} extra` : ''}`;
    el('panel').classList.toggle('reloj-descanso', !!enDescanso);
    const etiqueta = reloj.terminado ? 'Sesión terminada' : `${e.bloque}${enDescanso ? ' · Descanso' : ''}${!reloj.enMarcha ? ' · En pausa' : ''}`;
    if (el('etiqueta').textContent !== etiqueta) el('etiqueta').textContent = etiqueta;
    el('nombre').textContent = reloj.terminado ? '¡Terminaste el recorrido!' : reloj.descansoSerie ? `Descansa tras ${e.nombre}` : e.nombre;
    const visual = enDescanso ? sesion.etapas.slice(reloj.indice + 1).find(p => p.clase !== 'descanso') : e;
    const firmaFigura = JSON.stringify([visual?.ejercicioId, visual?.imagen, visual?.nombre, enDescanso]);
    if (firmaFigura !== ultimaFigura) {
      ultimaFigura = firmaFigura;
      el('visual').innerHTML = figuraReloj(visual, tipo, ejercicios);
      el('visual').setAttribute('aria-label', enDescanso ? 'Próximo ejercicio' : 'Ejercicio actual');
    }
    el('vuelta').textContent = e ? [e.vuelta ? `Vuelta ${e.vuelta} de ${e.vueltas}` : '', !enDescanso && e.lado || '', !enDescanso && e.clase === 'serie' ? `Sugerido: ${e.objetivo}` : ''].filter(Boolean).join(' · ') : '';
    el('cuenta').textContent = textoReloj(reloj.restanteMs / 1000);
    el('indicacion').textContent = reloj.terminado ? 'Sesión terminada.' : reloj.descansoSerie ? 'Descansa.' : e.indicacion || (enDescanso ? 'Recupera y prepara el siguiente movimiento.' : 'Mantén el control; puedes pausar si lo necesitas.');
    const siguiente = sesion.etapas[reloj.indice + 1];
    el('siguiente').textContent = siguiente ? `Después: ${siguiente.nombre}${siguiente.lado ? ' · ' + siguiente.lado : ''}` : reloj.terminado ? '' : 'Después: fin de la sesión';
    el('transcurrido').textContent = `Tiempo: ${textoReloj(reloj.transcurridoMs / 1000)} · Restante: ${textoReloj(faltan)}`;
    const totalReal = sesion.totalSegundos + reloj.extraMs / 1000;
    el('progreso').value = totalReal ? Math.max(0, 100 * (1 - faltan / totalReal)) : 100;
    el('iniciar').textContent = reloj.enMarcha ? 'Pausar' : reloj.transcurridoMs > 0 || reloj.indice > 0 ? 'Continuar' : 'Comenzar rutina';
    if(reloj.terminado && modo==='calentamiento')el('iniciar').textContent='Comenzar rutina';
    el('iniciar').disabled = reloj.terminado && modo!=='calentamiento';
    el('sesion').hidden = !iniciadoEn && !reloj.terminado;
    for (const n of ['saltar','reiniciar','finalizar']) el(n).hidden = !iniciadoEn;
    el('finalizar').disabled = reloj.terminado;
    el('saltar').disabled = reloj.terminado;
    el('serie').hidden = !iniciadoEn || !e || e.clase !== 'serie' || reloj.descansoSerie;
    el('serie').disabled = !reloj.enMarcha;
    el('extra').hidden = !iniciadoEn;
    el('extra').disabled = reloj.terminado;
    el('extra').textContent = enDescanso ? '+30 s descanso' : '+30 s';
    el('anterior').hidden = !iniciadoEn;
    el('anterior').disabled = reloj.indice === 0;
    el('inicio').hidden = !!iniciadoEn;
    caja.classList.toggle('reloj-activo',!!iniciadoEn);
    el('titulo').textContent = modo === 'calentamiento' ? 'Calentamiento' : 'Rutina';
    for (const n of ['modo', 'trabajo', 'descanso']) if (el(n)) el(n).disabled = reloj.enMarcha;
    el('mensaje').textContent = mensaje;
  }
  function pausar(texto = '') {
    reloj.pausar(Date.now());
    if (texto) mensaje = texto;
    liberarPantalla(); guardar(); pintar();
  }
  caja.addEventListener('pausar-rutina',()=>{if(reloj.enMarcha)pausar('Rutina en pausa.');});
  el('iniciar').addEventListener('click', () => {
    if(reloj.terminado && modo==='calentamiento'){modo='entrenamiento';preparar(false);el('modo').value=modo;guardarOpciones();}
    if (reloj.enMarcha) { pausar('En pausa.'); return; }
    despertarAudio().then(() => { if (!desmontado && reloj.enMarcha) avisar(); });
    if (!iniciadoEn) { iniciadoEn = Date.now(); alComenzar?.(iniciadoEn); }
    reloj.iniciar(Date.now()); ultimoTick = Date.now(); mensaje = '';
    const lamina = caja.closest('section.tarjeta')?.querySelector('[data-rutina-completa] details');
    if (lamina) lamina.open = false;
    el('ajustes')?.removeAttribute('open');
    mantenerPantalla(); guardar(); pintar();
    el('sesion').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  el('serie').addEventListener('click', () => { reloj.terminarSerie(Date.now()); avisar(); guardar(); pintar(); });
  el('extra').addEventListener('click', () => {
    if (reloj.ampliarTiempo(30, Date.now())) { ultimoAviso = null; mensaje = '+30 s'; guardar(); pintar(); }
  });
  el('saltar').addEventListener('click', () => {
    reloj.siguiente(Date.now()); mensaje = '';
    if (reloj.terminado) liberarPantalla();
    avisar(reloj.terminado); guardar(); pintar();
  });
  el('anterior').addEventListener('click', () => { reloj.anterior(Date.now()); finalNotificado = false; mensaje = ''; ultimoAviso = null; guardar(); pintar(); });
  el('calentar').addEventListener('click', () => { modo = 'calentamiento'; preparar(false); el('modo').value=modo; guardarOpciones(); el('iniciar').click(); });
  el('finalizar').addEventListener('click', () => {
    reloj.pausar(Date.now()); reloj.indice = sesion.etapas.length; reloj.restanteMs = 0;
    liberarPantalla(); mensaje = 'Sesión finalizada.'; pintar(); guardar();
  });
  el('reiniciar').addEventListener('click', () => { if(modo==='calentamiento'){modo='entrenamiento';preparar(false);el('modo').value=modo;guardarOpciones();} reloj.reiniciar(); iniciadoEn = null; finalNotificado = false; liberarPantalla(); mensaje = ''; guardar(); pintar(); const lamina = caja.closest('section.tarjeta')?.querySelector('[data-rutina-completa] details'); if(lamina)lamina.open=false; });
  el('sonido').addEventListener('change', e => { sonido = e.target.checked; guardarOpciones(); if (sonido) despertarAudio().then(() => avisar()); });
  for (const n of ['modo', 'trabajo', 'descanso']) el(n)?.addEventListener('change', () => {
    modo = el('modo').value;
    trabajo = Number(el('trabajo')?.value) || 40;
    descanso = Number(el('descanso')?.value) || 20;
    mensaje = '';
    liberarPantalla(); preparar(false); guardarOpciones(); guardar(); pintar();
  });

  const ocultar = () => {
    if (document.hidden && window.api?.esCelular && reloj.enMarcha) pausar('Se pausó al salir de la app o apagar la pantalla. Pulsa Continuar al volver.');
    if (!document.hidden && reloj.enMarcha) mantenerPantalla();
  };
  const salir = () => pausar();
  document.addEventListener('visibilitychange', ocultar);
  window.addEventListener('pagehide', salir);
  window.addEventListener('beforeunload', salir);
  const intervalo = setInterval(() => {
    const ahora = Date.now();
    // Si el equipo suspendió la ejecución, no saltar ejercicios que no vio el usuario.
    if (reloj.enMarcha && ahora - ultimoTick > 5000) {
      reloj.pausar(ultimoTick);
      mensaje = 'El equipo interrumpió el reloj. Continúa cuando estés listo.';
      liberarPantalla(); guardar();
    } else if (reloj.actualizar(ahora)) {
      avisar(reloj.terminado); guardar();
      if (reloj.terminado) liberarPantalla();
    }
    ultimoTick = ahora;
    const cuenta = avisoCuenta(reloj);
    if (cuenta && cuenta !== ultimoAviso) { ultimoAviso = cuenta; avisar(false, true); }
    if (!cuenta) ultimoAviso = null;
    if (reloj.enMarcha && ahora - ultimaPersistencia >= 1000) guardar();
    pintar();
  }, 250);
  alSalir(() => {
    pausar(); desmontado = true; clearInterval(intervalo);
    document.removeEventListener('visibilitychange', ocultar);
    window.removeEventListener('pagehide', salir);
    window.removeEventListener('beforeunload', salir);
    audio?.close().catch(() => {});
  });
  pintar();
}
