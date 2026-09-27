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

// Días que cambiaron desde el último envío (se usa en la pantalla "Enviar").
async function marcarCambios(mes, nuevos) {
  const anteriores = (await leer(`dias/${mes}.json`)) || {};
  const pendientes = new Set((await leer('pendientes.json')) || []);
  const fechas = new Set([...Object.keys(anteriores), ...Object.keys(nuevos)]);
  for (const f of fechas) if (JSON.stringify(anteriores[f]) !== JSON.stringify(nuevos[f])) pendientes.add(f);
  await escribir('pendientes.json', [...pendientes].sort());
}

window.api = {
  esCelular: true,
  ubicacion: async () => {
    const p = await leer('perfil.json');
    return { carpeta: 'celular', perfil: p ? 'celular' : null, carpetaPerfil: 'celular', sugerida: 'celular' };
  },
  leer,
  escribir: async (clave, valor) => {
    const m = /^dias\/(\d{4}-\d{2})\.json$/.exec(clave);
    if (m) await marcarCambios(m[1], valor);
    await escribir(clave, valor);
    return true;
  },
  leerDias: async () => {
    const dias = {};
    for (const k of await claves()) if (/^dias\/\d{4}-\d{2}\.json$/.test(k)) Object.assign(dias, await leer(k));
    return dias;
  },
  listarPerfiles: async () => {
    const p = await leer('perfil.json');
    return p ? [{ id: 'celular', nombre: p.nombre, sexo: p.sexo, fechaInicio: p.fechaInicio, pesoMeta: p.pesoMeta }] : [];
  },
  crearPerfil: async () => 'celular',
  abrirPerfil: async () => 'celular',
  // Carga en el celular el perfil enviado desde la PC (conserva los días ya registrados aquí).
  importarPerfil: async () => {
    const archivo = await elegirArchivo('.txt,.json,text/plain,application/json');
    if (!archivo) return null;
    const paquete = leerPaquete(await archivo.text());
    if (paquete.tipo !== 'rfc-perfil') throw new Error('Ese archivo contiene días, no un perfil. En la PC usa "Enviar perfil al celular".');
    await escribir('perfil.json', paquete.perfil);
    await escribir('config.json', paquete.config || {});
    await escribir('rutas.json', paquete.rutas || []);
    await escribir('frecuentes.json', paquete.frecuentes || []);
    return 'celular';
  },
  importarImagen: async () => {
    const archivo = await elegirArchivo('image/*');
    if (!archivo) return null;
    const clave = `fotos/${Date.now()}.jpg`;
    await escribir(clave, await comprimirImagen(archivo));
    return clave;
  },
  urlArchivo: async (clave) => (clave ? leer(clave) : null),
  notificar: async (titulo, cuerpo) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(titulo, { body: cuerpo, icon: 'img/icono-192.png' });
    return true;
  },
  alNavegar: () => {},
  version: async () => 'celular',
  // Propios del celular
  pendientes: async () => (await leer('pendientes.json')) || [],
  marcarEnviados: async (fechas) => {
    const p = new Set((await leer('pendientes.json')) || []);
    fechas.forEach((f) => p.delete(f));
    await escribir('pendientes.json', [...p]);
  },
  borrarTodo: async () => { for (const k of await claves()) await borrar(k); },
};
