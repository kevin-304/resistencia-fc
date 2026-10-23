import { alSalir } from './nav.js';
import { construirSesion, RelojRutina, textoReloj, avisoCuenta } from './reloj-rutina.js';
import { figuraReloj } from './figura-reloj.js';
import { patronAviso } from './avisos-reloj.js';
import { montarPreparacion } from './editor-sesion.js';
import { crearPreparacion } from './preparacion-sesion.js';
import { escapar } from './util.js';

const leer = clave => { try { return JSON.parse(sessionStorage.getItem(clave)); } catch { return null; } };
const escribir = (clave, valor) => { try { sessionStorage.setItem(clave, JSON.stringify(valor)); } catch { /* El reloj funciona aunque no haya almacenamiento disponible. */ } };

export function montarTemporizador(caja, { rutina, ejercicios, perfil, fecha, tipo, alComenzar, alTerminar, ajustes: ajustesIniciales, alEditar, actividades=[] }) {
  if (!caja || !ejercicios.length) return;
  const clave = `rfc-reloj:${perfil}:${fecha}:${tipo}`;
  let ajustes=ajustesIniciales||(!construirSesion(rutina,ejercicios).es60?crearPreparacion(rutina,ejercicios):null),previsualizando=false;
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
  let finalNotificado = false,finalManual=false,saltados=0;
  let calentamiento = construirSesion(rutina,ejercicios,{modo:'calentamiento',ajustes});
  let resumenCal = leer(clave + ':calentamiento');
  if(resumenCal?.firma !== JSON.stringify(calentamiento.etapas) || resumenCal?.reloj?.indice !== calentamiento.etapas.length)resumenCal=null;

  function preparar(recuperar = true) {
    ultimaPintada = '';
    ultimaFigura = '';
    ultimoAviso = null;
    sesion = construirSesion(rutina, ejercicios, { modo, trabajo, descanso, ajustes });
    if (!sesion.es60 && modo !== 'calentamiento') modo = 'entrenamiento';
    firma = JSON.stringify(sesion.etapas);
    const guardado = recuperar ? (leer(clave + ':' + modo) || leer(clave)) : null;
    reloj = new RelojRutina(sesion.etapas, guardado?.firma === firma ? guardado.reloj : null);
    iniciadoEn = guardado?.firma === firma && Number.isFinite(guardado.iniciadoEn) ? guardado.iniciadoEn : null;
    finalNotificado = guardado?.firma === firma && !!guardado.finalNotificado;
    finalManual=guardado?.firma===firma&&!!guardado.finalManual;saltados=guardado?.firma===firma?Number(guardado.saltados)||0:0;
    if (guardado?.firma === firma && reloj.transcurridoMs > 0 && !reloj.terminado) mensaje = 'En pausa.';
  }
  preparar();

  caja.innerHTML = `<section class="temporizador" aria-label="Temporizador guiado de la rutina">
    <div class="reloj-eleccion" data-reloj-inicio-cal>
      <button type="button" class="boton" data-reloj-modificar-cal>Modificar calentamiento</button><button type="button" class="boton comenzar-verde" data-reloj-calentar>Comenzar calentamiento</button>
    </div>
    <details class="reloj-cal-resumen" data-reloj-resumen-cal hidden><summary>Calentamiento <small>Finalizado</small></summary><ul>${[...new Set(calentamiento.etapas.filter(e=>e.clase!=='descanso').map(e=>e.nombre))].map(n=>`<li>${escapar(n)}</li>`).join('')}</ul></details>
    <div class="reloj-preparacion" data-reloj-preparacion hidden></div>
    <div class="reloj-botones" data-reloj-controles>
      <span class="reloj-contexto" data-reloj-contexto></span>
      <button type="button" class="boton comenzar-verde" data-reloj-iniciar>Pausar</button>
      <button type="button" class="boton" data-reloj-anterior aria-label="Paso anterior" title="Paso anterior">←</button>
      <button type="button" class="boton" data-reloj-saltar aria-label="Paso siguiente" title="Paso siguiente">→</button>
      <button type="button" class="boton fantasma" data-reloj-finalizar>Finalizar</button>
      <button type="button" class="boton fantasma" data-reloj-reiniciar>Reiniciar</button>
    </div>
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
    <div class="reloj-inicio-rutina" data-reloj-inicio-rutina><button type="button" class="boton" data-reloj-modificar-rutina>Modificar rutina</button><button type="button" class="boton comenzar-verde" data-reloj-rutina>Comenzar rutina</button></div>
    <p class="suave pequeño reloj-mensaje" data-reloj-mensaje role="status"></p>
  </section>`;
  const el = nombre => caja.querySelector(`[data-reloj-${nombre}]`);

  if (el('trabajo')) el('trabajo').value = trabajo;
  if (el('descanso')) el('descanso').value = descanso;
  const guardar = () => { escribir(clave + ':' + modo, { firma, reloj: reloj.guardar(), iniciadoEn, finalNotificado,finalManual,saltados }); ultimaPersistencia = Date.now(); };
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
      const descansoActual = reloj.etapa?.clase === 'descanso' || reloj.descansoSerie;
      for(const nota of patronAviso({final,cuenta,descanso:descansoActual})){
        const tono=audio.createOscillator(),ganancia=audio.createGain(),inicio=audio.currentTime+nota.inicio;
        tono.type='sine';tono.frequency.value=nota.frecuencia;
        ganancia.gain.setValueAtTime(0.0001,inicio);
        ganancia.gain.exponentialRampToValueAtTime(0.14,inicio+0.012);
        ganancia.gain.exponentialRampToValueAtTime(0.0001,inicio+nota.duracion);
        tono.connect(ganancia);ganancia.connect(audio.destination);
        tono.onended=()=>{tono.disconnect();ganancia.disconnect();};
        tono.start(inicio);tono.stop(inicio+nota.duracion+0.02);
      }
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
    if (reloj.terminado && iniciadoEn && !finalNotificado) { finalNotificado = true; alTerminar?.(Date.now(),iniciadoEn,{modo,activoMs:reloj.transcurridoMs,completa:!finalManual&&!saltados}); guardar(); if(modo==='calentamiento'){resumenCal={firma,reloj:reloj.guardar()};el('resumen-cal').open=false;} }
    const enDescanso = e?.clase === 'descanso' || reloj.descansoSerie;
    const faltan = reloj.terminado ? 0 : reloj.restanteMs / 1000 + sesion.etapas.slice(reloj.indice + 1).reduce((n, p) => n + p.segundos, 0);
    const resumen = JSON.stringify([modo,iniciadoEn,!!resumenCal,previsualizando,reloj.indice, reloj.enMarcha, reloj.descansoSerie, Math.ceil(reloj.restanteMs / 1000), Math.floor(reloj.transcurridoMs / 1000), mensaje]);
    if (resumen === ultimaPintada) return;
    ultimaPintada = resumen;
    el('panel').classList.toggle('reloj-descanso', !!enDescanso);
    const etiqueta = reloj.terminado ? 'Sesión terminada' : `${e.bloque}${enDescanso ? ' · Descanso' : ''}${!reloj.enMarcha ? ' · En pausa' : ''}`;
    if (el('etiqueta').textContent !== etiqueta) el('etiqueta').textContent = etiqueta;
    el('nombre').textContent = reloj.terminado ? 'Sesión terminada' : enDescanso ? 'Descanso' : e.nombre;
    const visual = enDescanso || reloj.terminado ? null : e;
    const firmaFigura = JSON.stringify([visual?.ejercicioId, visual?.imagen, visual?.nombre, enDescanso]);
    if (firmaFigura !== ultimaFigura) {
      ultimaFigura = firmaFigura;
      el('visual').innerHTML = figuraReloj(visual, tipo, ejercicios);
      el('visual').setAttribute('aria-label', enDescanso ? 'Próximo ejercicio' : 'Ejercicio actual');
    }
    el('visual').hidden = !!enDescanso || reloj.terminado;
    el('indicacion').hidden = !!enDescanso || reloj.terminado;
    el('vuelta').textContent = e ? [e.vuelta ? `Vuelta ${e.vuelta} de ${e.vueltas}` : '', !enDescanso && e.lado || '', !enDescanso && e.clase === 'serie' ? `Sugerido: ${e.objetivo}` : ''].filter(Boolean).join(' · ') : '';
    el('cuenta').textContent = textoReloj(reloj.restanteMs / 1000);
    el('indicacion').textContent = reloj.terminado ? 'Sesión terminada.' : reloj.descansoSerie ? 'Descansa.' : e.indicacion || (enDescanso ? 'Recupera y prepara el siguiente movimiento.' : 'Mantén el control; puedes pausar si lo necesitas.');
    el('indicacion').textContent = el('indicacion').textContent.replace(/^BLOQUE\s+[^·•–—]+[·•–—]\s*/i,'').replace(/^BLOQUE PRINCIPAL\s*[·•–—-]?\s*/i,'');
    const siguiente = sesion.etapas[reloj.indice + 1];
    el('siguiente').textContent = siguiente ? `Después: ${siguiente.nombre}${siguiente.lado ? ' · ' + siguiente.lado : ''}` : reloj.terminado ? '' : 'Después: fin de la sesión';
    el('transcurrido').textContent = `Tiempo: ${textoReloj(reloj.transcurridoMs / 1000)} · Restante: ${textoReloj(faltan)}`;
    const totalReal = sesion.totalSegundos + reloj.extraMs / 1000;
    el('progreso').value = totalReal ? Math.max(0, 100 * (1 - faltan / totalReal)) : 100;
    el('iniciar').textContent = reloj.enMarcha ? 'Pausar' : 'Continuar';

    el('iniciar').disabled = reloj.terminado;
    el('sesion').hidden = !iniciadoEn && !reloj.terminado;
    for (const n of ['saltar','reiniciar','finalizar']) el(n).hidden = !iniciadoEn;
    el('finalizar').disabled = reloj.terminado;
    el('saltar').disabled = reloj.terminado;
    const calTerminada = modo==='calentamiento' && reloj.terminado;
    const activa=!!iniciadoEn && !calTerminada && !previsualizando;
    el('controles').hidden = !activa;
    el('sesion').hidden = !activa;
    el('inicio-cal').hidden = activa || (!!resumenCal && !(previsualizando && modo==='calentamiento'));
    el('inicio-rutina').hidden = activa;
    for(const [n,m] of [['modificar-cal','calentamiento'],['modificar-rutina','entrenamiento']])el(n).setAttribute('aria-expanded',String(previsualizando&&modo===m));
    caja.querySelector('.temporizador').classList.toggle('reloj-editando',previsualizando);
    el('preparacion').hidden = !previsualizando;
    el('resumen-cal').hidden = !resumenCal;
    el('anterior').hidden = !iniciadoEn;
    el('anterior').disabled = reloj.indice === 0;
    caja.classList.toggle('reloj-activo',!!iniciadoEn);
    caja.querySelector('.temporizador').classList.toggle('reloj-activo',!!iniciadoEn);
    el('contexto').textContent = modo === 'calentamiento' ? 'Calentamiento' : e?.bloque || 'Rutina';
    el('calentar').textContent = 'Comenzar calentamiento';
    el('rutina').textContent = 'Comenzar rutina';
    for(const [n,m] of [['calentar','calentamiento'],['rutina','entrenamiento']])el(n).setAttribute('aria-pressed',String(modo===m && !!iniciadoEn));
    el('mensaje').textContent = mensaje;
  }
  function pausar(texto = '') {
    reloj.pausar(Date.now());
    if (texto) mensaje = texto;
    liberarPantalla(); guardar(); pintar();
  }
  caja.addEventListener('pausar-rutina',()=>{if(reloj.enMarcha)pausar('Rutina en pausa.');});
  el('iniciar').addEventListener('click', () => {

    if (reloj.enMarcha) { pausar('En pausa.'); return; }
    despertarAudio().then(() => { if (!desmontado && reloj.enMarcha) avisar(); });
    if (!iniciadoEn) { iniciadoEn = Date.now(); alComenzar?.(iniciadoEn,{modo}); }
    reloj.iniciar(Date.now()); ultimoTick = Date.now(); mensaje = '';
    const lamina = caja.closest('section.tarjeta')?.querySelector('[data-rutina-completa] details');
    if (lamina) lamina.open = false;
    el('ajustes')?.removeAttribute('open');
    mantenerPantalla(); guardar(); pintar();
    el('sesion').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  el('saltar').addEventListener('click', () => {
    if(reloj.etapa?.clase!=='descanso'&&reloj.restanteMs>100)saltados++;
    reloj.siguiente(Date.now()); mensaje = '';
    if (reloj.terminado) liberarPantalla();
    avisar(reloj.terminado); guardar(); pintar();
  });
  el('anterior').addEventListener('click', () => { reloj.anterior(Date.now()); finalNotificado = false; mensaje = ''; ultimoAviso = null; guardar(); pintar(); });
  function elegirSesion(nuevo) {
    if(previsualizando&&modo===nuevo){previsualizando=false;preparar(true);pintar();return;}
    pausar();modo=nuevo;previsualizando=true;ultimaPintada='';
    el(nuevo==='calentamiento'?'inicio-cal':'inicio-rutina').after(el('preparacion'));pintar();
    montarPreparacion(el('preparacion'),{modo,rutina,ejercicios,ajustes,editarAlInicio:true,controlesExternos:true,actividades,
      alCambiar:p=>{ajustes=p;alEditar?.(p);},
      alCancelar:()=>{previsualizando=false;preparar(true);pintar();},
      alComenzar:p=>{
        if(p){ajustes=p;alEditar?.(p);}
        calentamiento=construirSesion(rutina,ejercicios,{modo:'calentamiento',ajustes});
        el('resumen-cal').querySelector('ul').innerHTML=[...new Set(calentamiento.etapas.filter(e=>e.clase!=='descanso').map(e=>e.nombre))].map(n=>`<li>${escapar(n)}</li>`).join('');
        previsualizando=false;preparar(!p);if(reloj.terminado)preparar(false);guardarOpciones();pintar();el('iniciar').click();
      }
    });
  }
  el('modificar-cal').addEventListener('click',()=>elegirSesion('calentamiento'));
  el('calentar').addEventListener('click',()=>comenzarDirecto('calentamiento'));
  el('modificar-rutina').addEventListener('click',()=>elegirSesion('entrenamiento'));
  el('rutina').addEventListener('click',()=>comenzarDirecto('entrenamiento'));
  function comenzarDirecto(nuevo){pausar();modo=nuevo;previsualizando=false;preparar(true);if(reloj.terminado)preparar(false);guardarOpciones();pintar();el('iniciar').click();}
  el('finalizar').addEventListener('click', () => {
    finalManual=true;reloj.pausar(Date.now()); reloj.indice = sesion.etapas.length; reloj.restanteMs = 0;
    liberarPantalla(); mensaje = 'Sesión finalizada.'; pintar(); guardar();
  });
  el('reiniciar').addEventListener('click', () => { if(modo==='calentamiento')resumenCal=null; reloj.reiniciar();finalManual=false;saltados=0; iniciadoEn = null; finalNotificado = false; liberarPantalla(); mensaje = ''; guardar(); pintar(); const lamina = caja.closest('section.tarjeta')?.querySelector('[data-rutina-completa] details'); if(lamina)lamina.open=false; });
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
