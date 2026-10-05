// Versión celular: reemplaza al proceso principal de Electron. Guarda todo en el
// almacenamiento del teléfono (IndexedDB) con los mismos nombres de "archivo" que la PC,
// así las pantallas del día y del calendario funcionan igual.

import { leerPaquete } from './paquetes.js';

const BD = 'resistencia-fc';
const TABLA = 'archivos';
let conexion = null;

function abrirBD() {
  if (conexion) return conexion;
  conexion = new Promise((resolve, reject) => {
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(TABLA);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return conexion;
}

async function operar(modo, fn) {
  const bd = await abrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(TABLA, modo);
    const req = fn(tx.objectStore(TABLA));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export const leer = (clave) => operar('readonly', (t) => t.get(clave)).then((v) => v ?? null);
export const escribir = (clave, valor) => operar('readwrite', (t) => t.put(valor, clave));
const borrar = (clave) => operar('readwrite', (t) => t.delete(clave));
const claves = () => operar('readonly', (t) => t.getAllKeys());

// Pide al navegador que no borre los datos aunque falte espacio.
navigator.storage?.persist?.();

// ---------- Selección de archivos e imágenes ----------
function elegirArchivo(accept, capture) {
  return new Promise((resolve) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = accept;
    if (capture) i.capture = 'environment';
    i.onchange = () => resolve(i.files[0] || null);
    i.click();
  });
}

// Reduce la foto (máx. 1280 px) para que no pese en el teléfono ni en WhatsApp.
async function comprimirImagen(archivo) {
  const url = URL.createObjectURL(archivo);
  const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
  const escala = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.8);
}

// ---------- Varios perfiles en el celular ----------
// Cada perfil guarda sus "archivos" con el prefijo  p/<id>/  (p/Nati/perfil.json, p/Nati/dias/2026-10.json…)
const CLAVE_ACTIVO = 'rfc-perfil-activo';
const leerActivo = () => { try { return localStorage.getItem(CLAVE_ACTIVO); } catch { return null; } };
const fijarActivo = (id) => { try { localStorage.setItem(CLAVE_ACTIVO, id); } catch { /* nada */ } };
const ruta = (id, rel) => `p/${id}/${rel}`;
const limpiarId = (n) => String(n || 'Mi perfil').replace(/[/\\:*?"<>|]/g, '').trim().slice(0, 60) || 'Mi perfil';

async function idsPerfiles() {
  return [...new Set((await claves()).map((k) => /^p\/(.+)\/perfil\.json$/.exec(k)?.[1]).filter(Boolean))];
}

async function idLibre(base) {
  const ids = new Set(await idsPerfiles());
  let id = base;
  let i = 2;
  while (ids.has(id)) id = `${base} (${i++})`;
  return id;
}

// Versión anterior: un solo perfil sin prefijo → se mueve a p/<nombre>/
async function migrarPerfilUnico() {
  const viejo = await leer('perfil.json');
  if (!viejo) return;
  const id = await idLibre(limpiarId(viejo.nombre));
  for (const k of await claves()) {
    if (k.startsWith('p/') || k === CLAVE_ACTIVO) continue;
    await escribir(ruta(id, k), await leer(k));
    await borrar(k);
  }
  fijarActivo(id);
}
const migracion = migrarPerfilUnico();

async function activo() {
  await migracion;
  let id = leerActivo();
  const ids = await idsPerfiles();
  if (!id || !ids.includes(id)) { id = ids.length === 1 ? ids[0] : null; if (id) fijarActivo(id); }
  return id;
}

// Días que cambiaron desde el último envío por WhatsApp (pantalla "Enviar").
async function marcarCambios(id, mes, nuevos) {
  const anteriores = (await leer(ruta(id, `dias/${mes}.json`))) || {};
  const pendientes = new Set((await leer(ruta(id, 'pendientes.json'))) || []);
  const fechas = new Set([...Object.keys(anteriores), ...Object.keys(nuevos)]);
  for (const f of fechas) if (JSON.stringify(anteriores[f]) !== JSON.stringify(nuevos[f])) pendientes.add(f);
  await escribir(ruta(id, 'pendientes.json'), [...pendientes].sort());
}

async function diasDe(id) {
  const dias = {};
  const prefijo = `p/${id}/dias/`;
  for (const k of await claves()) {
    if (k.startsWith(prefijo) && /^\d{4}-\d{2}\.json$/.test(k.slice(prefijo.length))) Object.assign(dias, await leer(k));
  }
  return dias;
}

async function escribirEn(id, rel, valor) {
  const m = /^dias\/(\d{4}-\d{2})\.json$/.exec(rel);
  if (m) await marcarCambios(id, m[1], valor);
  await escribir(ruta(id, rel), valor);
}

window.api = {
  esCelular: true,
  ubicacion: async () => {
    const id = await activo();
    return { carpeta: 'celular', perfil: id, carpetaPerfil: id ? `celular/${id}` : null, sugerida: 'celular' };
  },
  leer: async (rel) => { const id = await activo(); return id ? leer(ruta(id, rel)) : null; },
  escribir: async (rel, valor) => { const id = await activo(); if (!id) throw new Error('No hay perfil abierto'); await escribirEn(id, rel, valor); return true; },
  leerDias: async () => { const id = await activo(); return id ? diasDe(id) : {}; },
  listarPerfiles: async () => {
    await migracion;
    const lista = [];
    for (const id of await idsPerfiles()) {
      const p = (await leer(ruta(id, 'perfil.json'))) || {};
      lista.push({ id, nombre: p.nombre || id, sexo: p.sexo, fechaInicio: p.fechaInicio, pesoMeta: p.pesoMeta, nubeId: p.nubeId });
    }
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },
  crearPerfil: async (nombre) => { await migracion; const id = await idLibre(limpiarId(nombre)); await escribir(ruta(id, 'perfil.json'), { nombre }); fijarActivo(id); return id; },
  abrirPerfil: async (id) => { fijarActivo(id); return id; },
  // Carga el perfil enviado desde la PC. Si ya existe uno con ese nombre se actualiza (sus días no se tocan).
  importarPerfil: async () => {
    const archivo = await elegirArchivo('.txt,.json,text/plain,application/json');
    if (!archivo) return null;
    const paquete = leerPaquete(await archivo.text());
    if (paquete.tipo !== 'rfc-perfil') throw new Error('Ese archivo contiene días, no un perfil. En la PC usa "Enviar perfil al celular".');
    await migracion;
    const id = limpiarId(paquete.perfil?.nombre);
    await escribir(ruta(id, 'perfil.json'), paquete.perfil);
    await escribir(ruta(id, 'config.json'), paquete.config || {});
    await escribir(ruta(id, 'rutas.json'), paquete.rutas || []);
    await escribir(ruta(id, 'frecuentes.json'), paquete.frecuentes || []);
    fijarActivo(id);
    return id;
  },
  importarImagen: async () => {
    const archivo = await elegirArchivo('image/*');
    if (!archivo) return null;
    const id = await activo();
    const clave = `fotos/${Date.now()}.jpg`;
    await escribir(ruta(id, clave), await comprimirImagen(archivo));
    return clave;
  },
  urlArchivo: async (rel) => { const id = await activo(); return rel && id ? leer(ruta(id, rel)) : null; },
  notificar: async (titulo, cuerpo) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(titulo, { body: cuerpo, icon: 'img/icono-192.png' });
    return true;
  },
  alNavegar: () => {},
  version: async () => 'celular',
  // ----- Para la sincronización (cualquier perfil, no solo el abierto) -----
  perfilArchivos: async (id) => ({
    perfil: await leer(ruta(id, 'perfil.json')),
    config: await leer(ruta(id, 'config.json')),
    rutas: await leer(ruta(id, 'rutas.json')),
    frecuentes: await leer(ruta(id, 'frecuentes.json')),
    sincro: await leer(ruta(id, 'sincro.json')),
    dias: await diasDe(id),
  }),
  perfilEscribir: async (id, rel, valor) => escribirEn(id, rel, valor),
  perfilCrearVacio: async (nombre) => { await migracion; const id = await idLibre(limpiarId(nombre)); await escribir(ruta(id, 'perfil.json'), { nombre }); return id; },
  perfilFoto: async (id, rel) => leer(ruta(id, rel)),
  perfilGuardarFoto: async (id, rel, dataURL) => escribir(ruta(id, rel), dataURL),
  // ----- Envío por WhatsApp -----
  pendientes: async () => { const id = await activo(); return (await leer(ruta(id, 'pendientes.json'))) || []; },
  marcarEnviados: async (fechas) => {
    const id = await activo();
    const p = new Set((await leer(ruta(id, 'pendientes.json'))) || []);
    fechas.forEach((f) => p.delete(f));
    await escribir(ruta(id, 'pendientes.json'), [...p]);
  },
  borrarTodo: async () => { for (const k of await claves()) await borrar(k); try { localStorage.removeItem(CLAVE_ACTIVO); } catch { /* nada */ } },
};
