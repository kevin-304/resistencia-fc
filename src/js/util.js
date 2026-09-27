// Utilidades de fechas, horas, números y HTML. Las fechas se manejan como texto "AAAA-MM-DD"
// en hora local, para evitar líos de zonas horarias.

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const dos = (n) => String(n).padStart(2, '0');

export function aISO(d) {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function deISO(s) {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export const hoyISO = () => aISO(new Date());

export function sumarDias(iso, n) {
  const d = deISO(iso);
  d.setDate(d.getDate() + n);
  return aISO(d);
}

// Diferencia en días enteros (b - a), inmune a cambios de horario.
export function diasEntre(a, b) {
  const [x, y] = [deISO(a), deISO(b)];
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
}

export const diaSemana = (iso) => deISO(iso).getDay();

// Lunes de la semana a la que pertenece la fecha.
export function lunesDe(iso) {
  const ds = diaSemana(iso);
  return sumarDias(iso, ds === 0 ? -6 : 1 - ds);
}

export function proximoLunes(iso = hoyISO()) {
  const ds = diaSemana(iso);
  return ds === 1 ? iso : sumarDias(iso, ds === 0 ? 1 : 8 - ds);
}

export function fechaLarga(iso) {
  const d = deISO(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function fechaCorta(iso) {
  const d = deISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

export function fechaMedia(iso) {
  const d = deISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// "HH:MM" -> minutos desde medianoche
export function aMinutos(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function deMinutos(min) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${dos(Math.floor(m / 60))}:${dos(m % 60)}`;
}

// Horas entre dos horas del reloj; si la segunda es menor, se asume que cruza la medianoche.
export function horasEntre(desde, hasta) {
  const a = aMinutos(desde);
  const b = aMinutos(hasta);
  if (a == null || b == null) return null;
  let d = b - a;
  if (d <= 0) d += 1440;
  return d / 60;
}

// Duración escrita como "45", "45:30" (min:seg) o "1:05:30" (h:min:seg) -> minutos
export function duracionAMinutos(texto) {
  if (texto == null || texto === '') return null;
  const t = String(texto).trim().replace(',', '.');
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  const partes = t.split(':').map(Number);
  if (partes.some((p) => Number.isNaN(p))) return null;
  if (partes.length === 2) return partes[0] + partes[1] / 60;
  if (partes.length === 3) return partes[0] * 60 + partes[1] + partes[2] / 60;
  return null;
}

export function formatoDuracion(min) {
  if (min == null || Number.isNaN(min)) return '—';
  const totalSeg = Math.round(min * 60);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return h > 0 ? `${h} h ${dos(m)} min` : s ? `${m}:${dos(s)} min` : `${m} min`;
}

export function formatoHoras(h) {
  if (h == null || Number.isNaN(h)) return '—';
  const hh = Math.floor(h + 1e-9);
  const mm = Math.round((h - hh) * 60);
  return mm === 60 ? `${hh + 1} h` : mm ? `${hh} h ${dos(mm)} min` : `${hh} h`;
}

// Ritmo en min/km -> "6:30 /km"
export function formatoRitmo(minPorKm) {
  if (!minPorKm || !Number.isFinite(minPorKm)) return '—';
  const m = Math.floor(minPorKm);
  const s = Math.round((minPorKm - m) * 60);
  return s === 60 ? `${m + 1}:00 /km` : `${m}:${dos(s)} /km`;
}

// Número con coma decimal, como en el plan (1,61 m).
export function num(v, dec = 1) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: dec });
}

// Convierte lo que se escribe en un campo ("1,61" o "1.61") en número.
export function aNumero(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function escapar(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function retrasar(fn, ms) {
  let t;
  const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  f.ya = (...a) => { clearTimeout(t); return fn(...a); };
  return f;
}

export const idUnico = () => Math.random().toString(36).slice(2, 10);

// Acceso a propiedades anidadas: obtener(obj, "ruta.distancia")
export function obtener(obj, camino) {
  return camino.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function fijar(obj, camino, valor) {
  const partes = camino.split('.');
  let o = obj;
  for (let i = 0; i < partes.length - 1; i++) {
    if (o[partes[i]] == null || typeof o[partes[i]] !== 'object') o[partes[i]] = {};
    o = o[partes[i]];
  }
  if (valor === undefined || valor === null || valor === '') delete o[partes.at(-1)];
  else o[partes.at(-1)] = valor;
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const promedio = (arr) => {
  const v = arr.filter((x) => x != null && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export const suma = (arr) => arr.filter((x) => x != null && Number.isFinite(x)).reduce((a, b) => a + b, 0);
