// Generado por scripts/construir-web.js — versión 2026-10-21T14:38:20.002Z
const CACHE = 'rfc-1792593500003';
const ARCHIVOS = [
  "./",
  "estilos.css",
  "img/ejercicios/balanceo-frontal.webp",
  "img/ejercicios/balanceo-lateral.webp",
  "img/ejercicios/cadera.webp",
  "img/ejercicios/cuello.webp",
  "img/ejercicios/elevacion-talones.webp",
  "img/ejercicios/est-cuadriceps.webp",
  "img/ejercicios/est-espalda.webp",
  "img/ejercicios/est-flexores.webp",
  "img/ejercicios/est-gluteo.webp",
  "img/ejercicios/est-isquiotibiales.webp",
  "img/ejercicios/est-pantorrillas.webp",
  "img/ejercicios/hombros.webp",
  "img/ejercicios/marcha.webp",
  "img/ejercicios/plancha.webp",
  "img/ejercicios/puente-gluteo.webp",
  "img/ejercicios/rodillas.webp",
  "img/ejercicios/sentadillas.webp",
  "img/ejercicios/skipping.webp",
  "img/ejercicios/talones-gluteo.webp",
  "img/ejercicios/tobillos.webp",
  "img/ejercicios/zancadas-giro.webp",
  "img/icono-192.png",
  "img/icono-512.png",
  "img/icono-maskable.png",
  "img/rutina-60min/01-lunes-rutina-60min.png",
  "img/rutina-60min/02-martes-rutina-60min.png",
  "img/rutina-60min/03-miercoles-rutina-60min.png",
  "img/rutina-60min/04-jueves-rutina-60min.png",
  "img/rutina-60min/05-viernes-rutina-60min.png",
  "img/rutina-60min/06-sabado-rutina-60min.png",
  "img/rutina-60min/07-domingo-rutina-60min.png",
  "js/api-web.js",
  "js/estado.js",
  "js/guias-rutina.js",
  "js/iconos.js",
  "js/metricas.js",
  "js/movil.js",
  "js/nav.js",
  "js/nube-config.js",
  "js/nube.js",
  "js/paquetes.js",
  "js/plan.js",
  "js/reloj-rutina.js",
  "js/tema.js",
  "js/temporizador.js",
  "js/util.js",
  "js/vendor/firebase.js",
  "js/vistas/calendario.js",
  "js/vistas/dia.js",
  "js/vistas/enviar.js",
  "js/vistas/movil-ajustes.js",
  "js/vistas/nube.js",
  "js/vistas/perfil.js",
  "js/vistas/perfiles.js",
  "manifest.webmanifest",
  "movil.css",
  "movil.html",
  "../build/icon.png"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Primero la copia guardada (rápido y sin internet); si hay internet, se actualiza por detrás.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardado = await c.match(e.request, { ignoreSearch: true });
    const red = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => guardado);
    return guardado || red;
  }));
});
