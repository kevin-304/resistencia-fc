// Configuraciones de gráficos (Chart.js), compartidas por Estadísticas y el reporte PDF.
import { diasEntre, sumarDias, fechaCorta, num } from "../../util.js";

function base(c, { leyenda = true, animacion = true } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: animacion ? { duration: 450 } : false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: leyenda,
        position: "bottom",
        labels: {
          color: c.texto,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { family: c.fuente, size: 12 },
        },
      },
      tooltip: {
        backgroundColor: c.tooltip,
        titleColor: c.texto,
        bodyColor: c.texto,
        borderColor: c.borde,
        borderWidth: 1,
        padding: 10,
        titleFont: { family: c.fuente },
        bodyFont: { family: c.fuente },
      },
    },
    scales: {
      x: {
        ticks: { color: c.suave, font: { family: c.fuente, size: 11 } },
        grid: { display: false },
        border: { color: c.borde },
      },
      y: {
        ticks: { color: c.suave, font: { family: c.fuente, size: 11 } },
        grid: { color: c.rejilla },
        border: { display: false },
      },
    },
  };
}

const alfa = (hex, a) => {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h,
    16,
  );
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Peso real + proyecciones + meta. Eje X = días desde el inicio del plan.
export function configPeso(
  { serie, ambiciosa, segura, meta, inicio, hasta },
  c,
  opc,
) {
  const x = (f) => diasEntre(inicio, f);
  const fin = Math.max(
    x(hasta),
    ...(segura.length ? [x(segura.at(-1).fecha)] : [0]),
    ...serie.map((p) => x(p.fecha)),
  );
  const o = base(c, opc);
  o.scales.x = {
    ...o.scales.x,
    type: "linear",
    min: Math.min(0, ...serie.map((p) => x(p.fecha))),
    max: fin + 3,
    ticks: {
      ...o.scales.x.ticks,
      stepSize: 7,
      callback: (v) => fechaCorta(sumarDias(inicio, v)),
      maxRotation: 0,
      autoSkip: true,
      maxTicksLimit: 12,
    },
  };
  o.scales.y.ticks.callback = (v) => `${num(v, 1)} kg`;
  o.plugins.tooltip.callbacks = {
    title: (items) =>
      fechaCorta(sumarDias(inicio, Math.round(items[0].parsed.x))),
    label: (it) => `${it.dataset.label}: ${num(it.parsed.y, 1)} kg`,
  };
  o.interaction = { mode: "nearest", intersect: false, axis: "x" };
  return {
    type: "line",
    data: {
      datasets: [
        {
          label: "Peso real",
          data: serie.map((p) => ({ x: x(p.fecha), y: p.peso })),
          borderColor: c.peso,
          backgroundColor: alfa(c.peso, 0.12),
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          order: 0,
        },
        {
          label: "Meta ambiciosa",
          data: ambiciosa.map((p) => ({ x: x(p.fecha), y: p.peso })),
          borderColor: c.ambiciosa,
          borderDash: [6, 5],
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: "Ritmo seguro",
          data: segura.map((p) => ({ x: x(p.fecha), y: p.peso })),
          borderColor: c.segura,
          borderDash: [2, 4],
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        },
        {
          label: `Meta ${num(meta, 1)} kg`,
          data: [
            { x: 0, y: meta },
            { x: fin + 3, y: meta },
          ],
          borderColor: c.meta,
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false,
        },
      ],
    },
    options: o,
  };
}

// Barras por semana (km, km-esfuerzo…)
export function configBarrasSemana(semanas, series, c, opc = {}) {
  const o = base(c, opc);
  if (opc.max) o.scales.y.max = opc.max;
  if (opc.unidad)
    o.scales.y.ticks.callback = (v) => `${num(v, 1)} ${opc.unidad}`;
  if (opc.apilado) {
    o.scales.x.stacked = true;
    o.scales.y.stacked = true;
  }
  return {
    type: "bar",
    data: {
      labels: semanas.map((s) =>
        s.semana > 0 ? `S${s.semana}` : fechaCorta(s.lunes),
      ),
      datasets: series.map((s) => ({
        label: s.nombre,
        data: semanas.map((x) => s.valor(x)),
        backgroundColor: s.color,
        borderRadius: 5,
        maxBarThickness: 34,
      })),
    },
    options: o,
  };
}

// Línea diaria (sueño, calorías…) con una línea de referencia opcional.
export function configLineaDiaria(dias, serie, c, opc = {}) {
  const o = base(c, { ...opc, leyenda: opc.leyenda ?? !!opc.referencia });
  if (opc.unidad)
    o.scales.y.ticks.callback = (v) => `${num(v, 1)} ${opc.unidad}`;
  if (opc.min != null) o.scales.y.min = opc.min;
  o.scales.x.ticks.maxTicksLimit = 10;
  o.scales.x.ticks.maxRotation = 0;
  const ds = [
    {
      type: opc.barras ? "bar" : "line",
      label: serie.nombre,
      data: dias.map(serie.valor),
      borderColor: serie.color,
      backgroundColor: opc.barras
        ? alfa(serie.color, 0.75)
        : alfa(serie.color, 0.1),
      fill: !opc.barras,
      tension: 0.3,
      pointRadius: 2.5,
      spanGaps: true,
      borderWidth: 2,
      borderRadius: 4,
      maxBarThickness: 18,
    },
  ];
  if (opc.referencia)
    ds.push({
      type: "line",
      label: opc.referencia.nombre,
      data: dias.map(() => opc.referencia.valor),
      borderColor: c.meta,
      borderDash: [5, 4],
      pointRadius: 0,
      borderWidth: 1.5,
      fill: false,
    });
  return {
    type: opc.barras ? "bar" : "line",
    data: { labels: dias.map((d) => fechaCorta(d.fecha)), datasets: ds },
    options: o,
  };
}

// Línea sobre fechas irregulares (cintura)
export function configLineaFechas(
  puntos,
  clave,
  inicio,
  etiqueta,
  colorLinea,
  c,
  opc = {},
) {
  const o = base(c, { ...opc, leyenda: false });
  const x = (f) => diasEntre(inicio, f);
  o.scales.x = {
    ...o.scales.x,
    type: "linear",
    ticks: {
      ...o.scales.x.ticks,
      stepSize: 7,
      callback: (v) => fechaCorta(sumarDias(inicio, v)),
      maxTicksLimit: 8,
      maxRotation: 0,
    },
  };
  o.scales.y.ticks.callback = (v) => `${num(v, 1)} ${opc.unidad || ""}`;
  o.plugins.tooltip.callbacks = {
    title: (it) => fechaCorta(sumarDias(inicio, Math.round(it[0].parsed.x))),
    label: (it) => `${etiqueta}: ${num(it.parsed.y, 1)} ${opc.unidad || ""}`,
  };
  return {
    type: "line",
    data: {
      datasets: [
        {
          label: etiqueta,
          data: puntos.map((p) => ({ x: x(p.fecha), y: p[clave] })),
          borderColor: colorLinea,
          backgroundColor: alfa(colorLinea, 0.12),
          fill: true,
          tension: 0.25,
          pointRadius: 4,
          borderWidth: 2.5,
        },
      ],
    },
    options: o,
  };
}

export { alfa };
