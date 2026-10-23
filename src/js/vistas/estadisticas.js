// Estadísticas: progreso de peso con proyección a la meta, entrenamiento, sueño, comida y hitos.
import { estado, contexto } from '../estado.js';
import { metricasRango, resumen, semanas, serieDePeso, serieDeCintura, rachas, alertaRitmoPeso } from '../metricas.js';
import { proyeccion, imc, HITOS_CARRERA, RITMOS } from '../plan.js';
import { configPeso, configBarrasSemana, configLineaDiaria, configLineaFechas, alfa } from '../graficos.js';
import { grafico, navegar } from '../nav.js';
import { color } from '../tema.js';
import { I } from '../iconos.js';
import { hoyISO, sumarDias, num, fechaMedia, fechaCorta, formatoRitmo, formatoDuracion, escapar, lunesDe } from '../util.js';

let rangoElegido = '8';

export function coloresGraficos() {
  return {
    texto: color('texto'), suave: color('texto-suave'), borde: color('borde'), rejilla: alfa(color('texto-suave'), 0.14), tooltip: color('superficie'),
    peso: color('g-peso'), ambiciosa: color('g-ambiciosa'), segura: color('g-segura'), meta: color('g-meta'), km: color('g-km'), kmesf: color('g-kmesf'),
    ruta: color('c-ruta'), ayuno: color('c-ayuno'), comp: color('c-comp'), sueno: color('c-sueno'), peligro: color('peligro'), aviso: color('aviso'),
    fuente: getComputedStyle(document.body).fontFamily,
  };
}

// Datos de progreso de peso (compartido con el reporte)
export function datosPeso(perfil, dias) {
  const serie = serieDePeso(dias, perfil);
  const inicio = perfil.fechaInicio;
  const pesoIni = perfil.pesoInicial;
  const meta = perfil.pesoMeta;
  return {
    serie,
    ambiciosa: proyeccion(pesoIni, meta, inicio, 'ambiciosa'),
    segura: proyeccion(pesoIni, meta, inicio, 'segura'),
    meta, inicio,
    actual: serie.length ? serie.at(-1).peso : pesoIni,
  };
}

export function mostrarEstadisticas(cont) {
  const ctx = contexto();
  const perfil = estado.perfil;
  const hoy = hoyISO();
  const inicio = ctx.inicio;
  const hasta = hoy < inicio ? inicio : hoy;
  const desde = rangoElegido === 'todo' ? inicio : [lunesDe(sumarDias(hasta, -7 * (Number(rangoElegido) - 1))), inicio].sort().at(-1);

  const lista = metricasRango(desde, hasta, estado.dias, ctx).filter((m) => !m.plan.antesDelPlan || m.registrado);
  const r = resumen(lista);
  const sem = semanas(desde, hasta, estado.dias, ctx);
  const p = datosPeso(perfil, estado.dias);
  const cintura = serieDeCintura(estado.dias, perfil);
  const racha = rachas(estado.dias, ctx);
  const perdido = perfil.pesoInicial - p.actual;
  const total = perfil.pesoInicial - perfil.pesoMeta;
  const avance = total > 0 ? Math.min(1, Math.max(0, perdido / total)) : 0;
  const alertaRitmo = alertaRitmoPeso(p.serie, inicio);
  const llegadaAmb = p.ambiciosa.at(-1)?.fecha;
  const llegadaSeg = p.segura.at(-1)?.fecha;
  const conRuta = lista.filter((m) => m.rutaHecha);

  cont.innerHTML = `
    <div class="cabecera">
      <div class="titulo"><h1>Estadísticas</h1><p>Del ${fechaMedia(desde)} al ${fechaMedia(hasta)}</p></div>
      <div class="segmentado" id="rango">
        ${[['4', '4 semanas'], ['8', '8 semanas'], ['12', '12 semanas'], ['todo', 'Todo el plan']].map(([v, t]) => `<button data-rango="${v}" class="${v === rangoElegido ? 'activo' : ''}">${t}</button>`).join('')}
      </div>
      <button class="boton primario" data-ir-reporte>${I.descargar} ${window.api?.esCelular ? 'Exportar días' : 'Reporte PDF'}</button>
    </div>
    ${alertaRitmo ? `<div class="alerta aviso" style="margin-bottom:16px">${I.alerta}<div>${escapar(alertaRitmo.texto)}</div></div>` : ''}

    <div class="rejilla rejilla-4" style="margin-bottom:16px">
      <div class="tarjeta kpi"><span class="etiqueta">Peso actual</span><span class="valor">${num(p.actual, 1)}<small>kg</small></span>
        <span class="nota ${perdido > 0 ? 'bien' : ''}">${perdido > 0 ? '−' : perdido < 0 ? '+' : ''}${num(Math.abs(perdido), 1)} kg desde el inicio · IMC ${num(imc(p.actual, perfil.estatura), 1)}</span></div>
      <div class="tarjeta kpi"><span class="etiqueta">Camino a ${num(perfil.pesoMeta, 1)} kg</span><span class="valor">${num(Math.max(0, p.actual - perfil.pesoMeta), 1)}<small>kg por bajar</small></span>
        <div class="progreso-meta"><div style="width:${avance * 100}%"></div></div><span class="nota">${Math.round(avance * 100)} % del camino</span></div>
      <div class="tarjeta kpi"><span class="etiqueta">Racha de días cumplidos</span><span class="valor">${racha.actual}<small>días</small></span><span class="nota">Mejor racha: ${racha.mejor} días (domingos no cuentan)</span></div>
      <div class="tarjeta kpi"><span class="etiqueta">Distancia en el período</span><span class="valor">${num(r.km, 1)}<small>km</small></span><span class="nota">${num(r.kmEsf, 1)} km-esfuerzo · ${r.diasRuta} salidas</span></div>
    </div>

    <div class="tarjeta" style="margin-bottom:16px">
      <div class="tarjeta-cab"><h2>Peso y proyección hacia ${num(perfil.pesoMeta, 1)} kg</h2></div>
      <div class="grafico alto"><canvas id="g-peso"></canvas></div>
      <p class="suave pequeño" style="margin-top:10px">Proyección desde ${num(perfil.pesoInicial, 1)} kg el ${fechaMedia(inicio)}.
        ${RITMOS.ambiciosa.nombre}: llegas cerca del <b>${llegadaAmb ? fechaMedia(llegadaAmb) : '—'}</b>. ${RITMOS.segura.nombre}: cerca del <b>${llegadaSeg ? fechaMedia(llegadaSeg) : '—'}</b>.
        La 1.ª semana baja más (agua); después el ritmo sano es 0,7–1 kg por semana.</p>
    </div>

    <div class="rejilla rejilla-2" style="margin-bottom:16px">
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Kilómetros por semana</h2></div><div class="grafico"><canvas id="g-km"></canvas></div></div>
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Cumplimiento semanal</h2><span class="suave pequeño">días de 6</span></div><div class="grafico"><canvas id="g-cumpl"></canvas></div></div>
    </div>
    <div class="rejilla rejilla-2" style="margin-bottom:16px">
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Tiempo de ruta y minutos trotando</h2></div><div class="grafico"><canvas id="g-tiempo"></canvas></div>
        <p class="suave pequeño" style="margin-top:8px">Ritmo promedio del período: <b>${formatoRitmo(r.ritmo)}</b> · Tiempo total: <b>${formatoDuracion(r.minRuta)}</b></p></div>
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Horas de sueño</h2></div><div class="grafico"><canvas id="g-sueno"></canvas></div>
        <p class="suave pequeño" style="margin-top:8px">Promedio: <b>${r.sueno != null ? num(r.sueno, 1) + ' h' : '—'}</b> · ${r.diasSuenoOk} noches de 7 h o más</p></div>
    </div>
    <div class="rejilla rejilla-2" style="margin-bottom:16px">
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Calorías consumidas por día</h2></div><div class="grafico"><canvas id="g-kcal"></canvas></div>
        <p class="suave pequeño" style="margin-top:8px">Promedio: <b>${r.kcalProm != null ? Math.round(r.kcalProm) + ' kcal' : '—'}</b> ${ctx.plan.metas.kcalMin ? `· tu mínimo: ${ctx.plan.metas.kcalMin} kcal${ctx.plan.metas.kcalMax ? `, referencia hasta ${ctx.plan.metas.kcalMax}` : ''}` : ''}</p></div>
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Alimentos contados y comidas a limitar</h2></div><div class="grafico"><canvas id="g-frutas"></canvas></div>
        <p class="suave pequeño" style="margin-top:8px">${ctx.plan.alimentos.map((a) => `${r.alimentos[a.id] || 0} ${escapar(a.nombre.toLowerCase())}`).join(' · ')}${ctx.plan.alimentos.length ? ' · ' : ''}${r.limitar} comidas con fritura, harina, azúcar o gaseosa</p></div>
    </div>
    <div class="rejilla rejilla-2" style="margin-bottom:16px">
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Cintura</h2></div>${cintura.length ? '<div class="grafico"><canvas id="g-cintura"></canvas></div>' : '<p class="suave">Aún no hay medidas de cintura. Regístralas los lunes en el día correspondiente.</p>'}</div>
      <div class="tarjeta"><div class="tarjeta-cab"><h2>Hitos</h2></div>${hitos(p, conRuta, racha)}</div>
    </div>

    <div class="tarjeta">
      <div class="tarjeta-cab"><h2>Resumen semanal</h2></div>
      <div class="contenedor-tabla">${tablaSemanal(sem)}</div>
    </div>`;

  cont.querySelectorAll('[data-rango]').forEach((b) => b.addEventListener('click', () => { rangoElegido = b.dataset.rango; mostrarEstadisticas(cont); }));
  cont.querySelector('[data-ir-reporte]').addEventListener('click', () => navegar(window.api?.esCelular ? 'enviar' : 'reporte'));

  const c = coloresGraficos();
  grafico(cont.querySelector('#g-peso'), configPeso({ ...p, hasta }, c));
  grafico(cont.querySelector('#g-km'), configBarrasSemana(sem, [
    { nombre: 'Km', color: c.km, valor: (s) => s.km },
    { nombre: 'Km-esfuerzo', color: c.kmesf, valor: (s) => s.kmEsf },
  ], c, { unidad: 'km' }));
  grafico(cont.querySelector('#g-cumpl'), configBarrasSemana(sem, [
    { nombre: 'Ruta', color: c.ruta, valor: (s) => s.diasRuta },
    { nombre: 'Ayuno', color: c.ayuno, valor: (s) => s.diasAyuno },
    { nombre: 'Complemento', color: c.comp, valor: (s) => s.diasComp },
  ], c, { max: 7 }));
  grafico(cont.querySelector('#g-tiempo'), configBarrasSemana(sem, [
    { nombre: 'Minutos de ruta', color: c.ruta, valor: (s) => Math.round(s.minRuta) },
    { nombre: 'Minutos trotando', color: c.kmesf, valor: (s) => Math.round(s.minTrote) },
  ], c, { unidad: 'min' }));
  grafico(cont.querySelector('#g-sueno'), configLineaDiaria(lista, { nombre: 'Horas de sueño', color: c.sueno, valor: (m) => m.sueno }, c, { unidad: 'h', referencia: { nombre: `Meta ${ctx.plan.metas.suenoHoras} h`, valor: ctx.plan.metas.suenoHoras }, min: 4 }));
  grafico(cont.querySelector('#g-kcal'), configLineaDiaria(lista, { nombre: 'kcal consumidas', color: c.peso, valor: (m) => m.kcalIngeridas }, c, { barras: true, referencia: ctx.plan.metas.kcalMin ? { nombre: `Mínimo ${ctx.plan.metas.kcalMin}`, valor: ctx.plan.metas.kcalMin } : null }));
  grafico(cont.querySelector('#g-frutas'), configBarrasSemana(sem, [
    ...ctx.plan.alimentos.map((a, i) => ({ nombre: a.nombre, color: [c.aviso, c.ruta, c.sueno, c.ayuno, c.comp, c.kmesf][i % 6], valor: (s) => s.alimentos[a.id] || 0 })),
    { nombre: 'A limitar', color: c.peligro, valor: (s) => s.limitar },
  ], c));
  if (cintura.length) grafico(cont.querySelector('#g-cintura'), configLineaFechas(cintura, 'cintura', inicio, 'Cintura', c.segura, c, { unidad: 'cm' }));
}

export function listaHitos(p, conRuta, racha) {
  const perfil = estado.perfil;
  const inicio = perfil.pesoInicial;
  const mejorDist = Math.max(0, ...conRuta.map((m) => m.rutaKm || 0), ...Object.values(estado.dias).map((d) => d.ruta?.distancia || 0));
  const minimo = p.serie.length ? Math.min(...p.serie.map((x) => x.peso)) : inicio;
  const cuando = (fn) => p.serie.find(fn)?.fecha;
  return [
    { nombre: 'Primeros −2 kg', logrado: minimo <= inicio - 2, fecha: cuando((x) => x.peso <= inicio - 2) },
    { nombre: '−5 kg (la meta del primer mes)', logrado: minimo <= inicio - 5, fecha: cuando((x) => x.peso <= inicio - 5) },
    { nombre: `Llegar a ${num(perfil.pesoMeta, 1)} kg`, logrado: minimo <= perfil.pesoMeta, fecha: cuando((x) => x.peso <= perfil.pesoMeta) },
    { nombre: 'Racha de 6 días cumplidos (una semana completa)', logrado: racha.mejor >= 6 },
    ...HITOS_CARRERA.map((h) => ({ nombre: `${h.nombre}`, detalle: `plan: ${h.cuando}`, logrado: mejorDist >= h.km })),
  ];
}

function hitos(p, conRuta, racha) {
  return listaHitos(p, conRuta, racha).map((h) => `<div class="hito ${h.logrado ? 'logrado' : ''}"><span class="icono-hito">${h.logrado ? I.check : I.trofeo}</span>
    <div class="detalle"><div>${escapar(h.nombre)}</div>${h.detalle ? `<div class="suave pequeño">${h.detalle}</div>` : ''}</div>
    <span class="suave pequeño">${h.logrado ? (h.fecha ? fechaCorta(h.fecha) : '¡Logrado!') : 'Pendiente'}</span></div>`).join('');
}

export function tablaSemanal(sem) {
  return `<table class="tabla"><thead><tr><th>Semana</th><th>Ruta</th><th>Ayuno</th><th>Compl.</th><th>Km</th><th>Km-esf.</th><th>Ritmo</th><th>Sueño prom.</th><th>kcal prom.</th><th>Peso</th></tr></thead>
    <tbody>${sem.slice().reverse().map((s) => `<tr>
      <td>${s.semana > 0 ? `S${s.semana} · ` : ''}${fechaCorta(s.lunes)}</td>
      <td>${s.diasRuta}/6</td><td>${s.diasAyuno}/6</td><td>${s.diasComp}/6</td>
      <td>${num(s.km, 1)}</td><td>${num(s.kmEsf, 1)}</td><td>${formatoRitmo(s.ritmo)}</td>
      <td>${s.sueno != null ? num(s.sueno, 1) + ' h' : '—'}</td><td>${s.kcalProm != null ? Math.round(s.kcalProm) : '—'}</td><td>${s.peso != null ? num(s.peso, 1) + ' kg' : '—'}</td>
    </tr>`).join('')}</tbody></table>`;
}
