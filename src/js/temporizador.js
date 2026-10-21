import { alSalir } from './nav.js';
import { construirSesion, RelojRutina, textoReloj } from './reloj-rutina.js';

const leer = clave => { try { return JSON.parse(sessionStorage.getItem(clave)); } catch { return null; } };
const escribir = (clave, valor) => { try { sessionStorage.setItem(clave, JSON.stringify(valor)); } catch { /* El reloj funciona aunque no haya almacenamiento disponible. */ } };

export function montarTemporizador(caja, { rutina, ejercicios, perfil, fecha, tipo }) {
  if (!caja || !ejercicios.length) return;
  const clave = `rfc-reloj:${perfil}:${fecha}:${tipo}`;
  const preferencias = leer(clave + ':opciones') || {};
  let modo = ['completa', 'principal', 'abdomen', 'cardio'].includes(preferencias.modo) ? preferencias.modo : 'completa';
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

  function preparar(recuperar = true) {
    sesion = construirSesion(rutina, ejercicios, { modo, trabajo, descanso });
    if (!sesion.es60) modo = 'completa';
    firma = JSON.stringify(sesion.etapas);
    const guardado = recuperar ? leer(clave) : null;
    reloj = new RelojRutina(sesion.etapas, guardado?.firma === firma ? guardado.reloj : null);
    if (guardado?.firma === firma && reloj.transcurridoMs > 0 && !reloj.terminado) mensaje = 'Tu reloj se conservó en pausa. Pulsa Continuar cuando estés listo.';
  }
  preparar();

  caja.innerHTML = `<section class="temporizador" aria-label="Temporizador guiado de la rutina">
    <div class="reloj-cabecera"><h3>Temporizador de la rutina</h3><span data-reloj-total></span></div>
    <div class="reloj-opciones">
      <label class="campo"><span>Qué vas a hacer</span><select data-reloj-modo>
        <option value="completa">Rutina completa</option>
        ${sesion.es60 ? '<option value="principal">Solo bloque principal</option><option value="abdomen">Solo abdomen · 12 min</option><option value="cardio">Solo cierre cardio · 5 min</option>' : ''}
      </select></label>
      ${!sesion.es60 ? `<label class="campo"><span>Ventana para repeticiones</span><select data-reloj-trabajo>${[20,30,40,45,60,90,120].map(s=>`<option value="${s}">${s} s</option>`).join('')}</select></label>
        <label class="campo"><span>Descanso</span><select data-reloj-descanso>${[10,15,20,30,45,60,90,120].map(s=>`<option value="${s}">${s} s</option>`).join('')}</select></label>` : ''}
      <label class="check"><input type="checkbox" data-reloj-sonido ${sonido ? 'checked' : ''}><span>Avisos sonoros</span></label>
    </div>
    <div class="reloj-panel" data-reloj-panel>
      <div class="reloj-etiqueta" data-reloj-etiqueta aria-live="polite"></div>
      <div class="reloj-nombre" data-reloj-nombre></div>
      <div class="reloj-vuelta" data-reloj-vuelta></div>
      <div class="reloj-cuenta" data-reloj-cuenta role="timer" aria-label="Tiempo restante del paso actual" aria-live="off">00:00</div>
      <p class="reloj-indicacion" data-reloj-indicacion></p>
      <p class="reloj-siguiente" data-reloj-siguiente></p>
    </div>
    <div class="reloj-progreso"><progress data-reloj-progreso max="100" value="0" aria-label="Avance de la sesión"></progress><span data-reloj-transcurrido></span></div>
    <div class="reloj-botones">
      <button type="button" class="boton primario" data-reloj-iniciar>Iniciar</button>
      <button type="button" class="boton" data-reloj-serie>Terminé la serie · descansar</button>
      <button type="button" class="boton" data-reloj-saltar>Siguiente paso</button>
      <button type="button" class="boton fantasma" data-reloj-reiniciar>Reiniciar reloj</button>
    </div>
    <p class="suave pequeño reloj-mensaje" data-reloj-mensaje role="status"></p>
    <p class="suave pequeño">El reloj no registra repeticiones ni marca ejercicios como hechos: anota abajo lo que realmente hiciste. «Siguiente paso» omite el paso actual. Cambiar de bloque reinicia solo el reloj.</p>
    <p class="suave pequeño">Mantén la app abierta y visible para oír los avisos. En el celular se pausa si cambias de app o bloqueas la pantalla.</p>
  </section>`;
  const el = nombre => caja.querySelector(`[data-reloj-${nombre}]`);
  el('modo').value = modo;
  if (el('trabajo')) el('trabajo').value = trabajo;
  if (el('descanso')) el('descanso').value = descanso;
  const guardar = () => { escribir(clave, { firma, reloj: reloj.guardar() }); ultimaPersistencia = Date.now(); };
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
  function avisar(final = false) {
    if (!sonido || !audio || audio.state !== 'running') return;
    try {
      const tono = audio.createOscillator();
      const ganancia = audio.createGain();
      tono.frequency.value = final ? 1046 : reloj.etapa?.clase === 'descanso' || reloj.descansoSerie ? 440 : 880;
      ganancia.gain.setValueAtTime(0.0001, audio.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (final ? 0.65 : 0.2));
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
    const enDescanso = e?.clase === 'descanso' || reloj.descansoSerie;
    const faltan = reloj.terminado ? 0 : reloj.restanteMs / 1000 + sesion.etapas.slice(reloj.indice + 1).reduce((n, p) => n + p.segundos, 0);
    const resumen = JSON.stringify([reloj.indice, reloj.enMarcha, reloj.descansoSerie, Math.ceil(reloj.restanteMs / 1000), Math.floor(reloj.transcurridoMs / 1000), mensaje]);
    if (resumen === ultimaPintada) return;
    ultimaPintada = resumen;
    el('total').textContent = `Programado: ${textoReloj(sesion.totalSegundos)}`;
    el('panel').classList.toggle('reloj-descanso', !!enDescanso);
    const etiqueta = reloj.terminado ? 'Sesión terminada' : `${e.bloque} · ${enDescanso ? 'Descanso' : e.clase === 'serie' ? 'Serie por repeticiones' : 'Trabajo'}${!reloj.enMarcha ? ' · En pausa' : ''}`;
    if (el('etiqueta').textContent !== etiqueta) el('etiqueta').textContent = etiqueta;
    el('nombre').textContent = reloj.terminado ? '¡Terminaste el recorrido!' : reloj.descansoSerie ? `Descansa tras ${e.nombre}` : e.nombre;
    el('vuelta').textContent = e ? [e.vuelta ? `Vuelta ${e.vuelta} de ${e.vueltas}` : '', !enDescanso && e.lado || '', !enDescanso && e.clase === 'serie' ? `Sugerido: ${e.objetivo}` : ''].filter(Boolean).join(' · ') : '';
    el('cuenta').textContent = textoReloj(reloj.restanteMs / 1000);
    el('indicacion').textContent = reloj.terminado ? 'Revisa tus casillas y registra lo que realmente hiciste.' : reloj.descansoSerie ? 'Recupera y prepara el siguiente ejercicio. El bloque conserva su duración.' : e.indicacion || (enDescanso ? 'Recupera y prepara el siguiente movimiento.' : 'Mantén el control; puedes pausar si lo necesitas.');
    const siguiente = sesion.etapas[reloj.indice + 1];
    el('siguiente').textContent = siguiente ? `Después: ${siguiente.nombre}${siguiente.lado ? ' · ' + siguiente.lado : ''}` : reloj.terminado ? '' : 'Después: fin de la sesión';
    el('transcurrido').textContent = `Transcurrido sin pausas: ${textoReloj(reloj.transcurridoMs / 1000)} · Restante: ${textoReloj(faltan)}`;
    el('progreso').value = sesion.totalSegundos ? 100 * (1 - faltan / sesion.totalSegundos) : 100;
    el('iniciar').textContent = reloj.enMarcha ? 'Pausar' : reloj.transcurridoMs > 0 || reloj.indice > 0 ? 'Continuar' : 'Iniciar';
    el('iniciar').disabled = reloj.terminado;
    el('saltar').disabled = reloj.terminado;
    el('serie').hidden = !e || e.clase !== 'serie' || reloj.descansoSerie;
    el('serie').disabled = !reloj.enMarcha;
    for (const n of ['modo', 'trabajo', 'descanso']) if (el(n)) el(n).disabled = reloj.enMarcha;
    el('mensaje').textContent = mensaje;
  }
  function pausar(texto = '') {
    reloj.pausar(Date.now());
    if (texto) mensaje = texto;
    liberarPantalla(); guardar(); pintar();
  }
  el('iniciar').addEventListener('click', () => {
    if (reloj.enMarcha) { pausar('Reloj en pausa.'); return; }
    despertarAudio().then(() => { if (!desmontado && reloj.enMarcha) avisar(); });
    reloj.iniciar(Date.now()); ultimoTick = Date.now(); mensaje = '';
    mantenerPantalla(); guardar(); pintar();
  });
  el('serie').addEventListener('click', () => { reloj.terminarSerie(Date.now()); avisar(); guardar(); pintar(); });
  el('saltar').addEventListener('click', () => {
    reloj.siguiente(Date.now()); mensaje = 'Paso omitido. No se registró como realizado.';
    if (reloj.terminado) liberarPantalla();
    avisar(reloj.terminado); guardar(); pintar();
  });
  el('reiniciar').addEventListener('click', () => { reloj.reiniciar(); liberarPantalla(); mensaje = 'Reloj reiniciado. Tus registros siguen igual.'; guardar(); pintar(); });
  el('sonido').addEventListener('change', e => { sonido = e.target.checked; guardarOpciones(); if (sonido) despertarAudio().then(() => avisar()); });
  for (const n of ['modo', 'trabajo', 'descanso']) el(n)?.addEventListener('change', () => {
    modo = el('modo').value;
    trabajo = Number(el('trabajo')?.value) || 40;
    descanso = Number(el('descanso')?.value) || 20;
    mensaje = 'Reloj preparado con la nueva selección.';
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
