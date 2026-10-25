import { fotoParaNube } from "./fotos.js";
import { fusionarRegistro, perfilCoincidente } from "./fusion.js";
import { crearColaLocal, confirmaciones } from "./cola-local.js";
import { leerDatoNube, fechaNubeValida, emuladorLocal } from "./validacion.js";
// Sincronización automática entre la PC y los celulares (Firebase, plan gratuito).
//
// Cada app guarda sus datos en su propio equipo (funciona sin internet). Cuando hay sesión
// iniciada y conexión, cada cambio se sube a la cuenta y las demás apps lo reciben al momento.
//
// En la nube:  cuentas/{uid}/perfiles/{nubeId}            → perfil, config, rutas, frecuentes (+ fechas de cambio)
//              cuentas/{uid}/perfiles/{nubeId}/dias/{fecha} → { v: día en JSON, mod }
//              cuentas/{uid}/perfiles/{nubeId}/fotos/{id}   → { v: foto en dataURL }
// Las reglas de seguridad solo dejan leer y escribir "cuentas/{uid}" a quien inició sesión con esa cuenta.
//
// Conflictos: gana el cambio más reciente de cada día; si llega un cambio de otro equipo mientras
// este tenía cambios sin subir del mismo día, se combinan (las comidas se suman).

import {
  estado,
  ganchos,
  diaCambiado,
  guardarPerfil,
  guardarConfig,
  guardarRutas,
  guardarFrecuentes,
} from "../datos/estado.js";
import { NUBE_CONFIG } from "./nube-config.js";
import { retrasar } from "../../util.js";

const colaLocal = crearColaLocal({
  leer: (id) => window.api.perfilLeer(id, "sincro.json"),
  escribir: (id, meta) => window.api.perfilEscribir(id, "sincro.json", meta),
});
const CONFIG_EMULADOR = {
  apiKey: "demo-clave",
  authDomain: "demo-rfc.firebaseapp.com",
  projectId: "demo-rfc",
};
const emulador = (() => {
  try {
    return emuladorLocal(localStorage.getItem("rfc-emulador"));
  } catch {
    return null;
  }
})();
const CONFIG = emulador ? CONFIG_EMULADOR : NUBE_CONFIG;
const DATOS = ["perfil", "config", "rutas", "frecuentes"];

let fb = null;
let auth = null;
let db = null;
let usuario = null;
let activo = null; // { localId, nid, meta }
let aplicandoRemoto = false;
let desuscribir = [];

const info = {
  configurada: !!CONFIG,
  emulador: !!emulador,
  conectado: false,
  enLinea: navigator.onLine,
  pendiente: false,
  email: null,
  sincronizando: false,
  ultima: null,
  error: null,
};
const oyentes = new Set();
function avisar(cambios) {
  Object.assign(info, cambios);
  oyentes.forEach((fn) => {
    try {
      fn({ ...info });
    } catch (e) {
      console.error(e);
    }
  });
}
export function alCambiarNube(fn) {
  oyentes.add(fn);
  fn({ ...info });
  return () => oyentes.delete(fn);
}
export const nubeConfigurada = () => !!CONFIG;

const json = (v) => (v == null ? null : JSON.stringify(v));
const deJson = leerDatoNube;
const idFoto = (rel) => rel.replace(/[/\\]/g, "_");
const nuevoId = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const mensaje = (e) => {
  const c = e?.code || "";
  if (
    c.includes("invalid-credential") ||
    c.includes("wrong-password") ||
    c.includes("user-not-found")
  )
    return "Correo o contraseña incorrectos.";
  if (c.includes("email-already-in-use"))
    return "Ya existe una cuenta con ese correo: inicia sesión.";
  if (c.includes("weak-password"))
    return "Usa una contraseña de al menos 12 caracteres.";
  if (c.includes("invalid-email")) return "El correo no es válido.";
  if (c.includes("network")) return "Sin conexión a internet.";
  if (c.includes("permission-denied"))
    return "Permiso denegado: revisa las reglas de seguridad de Firestore.";
  if (c.includes("too-many-requests"))
    return "Demasiados intentos: espera unos minutos.";
  return e?.message || String(e);
};

// ---------- Inicio y sesión ----------
export async function iniciarNube() {
  if (!CONFIG || fb) return;
  fb = await import("../../vendor/firebase.js");
  const app = fb.initializeApp(CONFIG);
  auth = fb.initializeAuth(app, {
    persistence: [fb.indexedDBLocalPersistence, fb.browserLocalPersistence],
  });
  try {
    db = fb.initializeFirestore(app, {
      localCache: fb.persistentLocalCache({
        tabManager: fb.persistentMultipleTabManager(),
      }),
    });
  } catch {
    db = fb.initializeFirestore(app, {});
  }
  if (emulador) {
    const [h, p] = emulador.split(",");
    fb.connectAuthEmulator(auth, `http://${h}`, { disableWarnings: true });
    const [host, puerto] = p.split(":");
    fb.connectFirestoreEmulator(db, host, Number(puerto));
    if (localStorage.getItem("rfc-emulador-sin-red") === "1")
      await fb.disableNetwork(db);
  }
  ganchos.cambio = cambioLocal;
  fb.onAuthStateChanged(auth, async (u) => {
    usuario = u;
    avisar({ conectado: !!u, email: u?.email || null, error: null });
    detenerEscucha();
    if (u) await sincronizarTodo();
  });
  window.addEventListener("offline", () => avisar({ enLinea: false }));
  window.addEventListener("online", () => {
    avisar({ enLinea: true });
    if (usuario) sincronizarTodo();
  });
}

export async function entrar(email, clave) {
  try {
    await fb.signInWithEmailAndPassword(auth, email.trim(), clave);
    return null;
  } catch (e) {
    return mensaje(e);
  }
}
export async function crearCuenta(email, clave) {
  try {
    await fb.createUserWithEmailAndPassword(auth, email.trim(), clave);
    return null;
  } catch (e) {
    return mensaje(e);
  }
}
export async function recuperarClave(email) {
  try {
    await fb.sendPasswordResetEmail(auth, email.trim());
    return null;
  } catch (e) {
    return mensaje(e);
  }
}
export async function salir() {
  detenerEscucha();
  activo = null;
  await fb.signOut(auth);
}

// ---------- Acceso a los perfiles locales ----------
async function idActivoLocal() {
  return (await window.api.ubicacion()).perfil;
}

// Archivos de un perfil; si es el abierto se toman de la memoria (estado).
async function archivosDe(localId, esActivo) {
  if (esActivo) {
    const meta = await window.api.leer("sincro.json");
    return {
      perfil: estado.perfil,
      config: estado.config,
      rutas: estado.rutas,
      frecuentes: estado.frecuentes,
      dias: estado.dias,
      sincro: meta,
    };
  }
  return window.api.perfilArchivos(localId);
}

// Aplica en el equipo un valor que llegó de la nube.
async function aplicarDatoLocal(localId, esActivo, clave, valor) {
  if (esActivo) {
    aplicandoRemoto = true;
    try {
      estado[clave] = valor;
      if (clave === "perfil") await guardarPerfil();
      if (clave === "config") await guardarConfig.ya();
      if (clave === "rutas") await guardarRutas();
      if (clave === "frecuentes") await guardarFrecuentes();
    } finally {
      aplicandoRemoto = false;
    }
  } else {
    await window.api.perfilEscribir(localId, `${clave}.json`, valor);
  }
}

function aplicarDiaActivo(fecha, valor) {
  aplicandoRemoto = true;
  try {
    if (valor) estado.dias[fecha] = valor;
    else delete estado.dias[fecha];
    diaCambiado(fecha);
  } finally {
    aplicandoRemoto = false;
  }
}

// ---------- Sincronización completa (al iniciar sesión, al abrir la app o al volver internet) ----------
let enCurso = null;
export function sincronizarTodo() {
  if (!usuario) return Promise.resolve();
  if (!enCurso)
    enCurso = sincronizarTodoReal().finally(() => {
      enCurso = null;
    });
  return enCurso;
}

async function sincronizarTodoReal() {
  avisar({ sincronizando: true, error: null });
  try {
    await colaSucios;
    const uid = usuario.uid;
    const remotos = new Map();
    (await fb.getDocs(fb.collection(db, "cuentas", uid, "perfiles"))).forEach(
      (d) => remotos.set(d.id, d.data()),
    );
    const idAbierto = await idActivoLocal();
    let huboCambiosLista = false;

    for (const local of await window.api.listarPerfiles()) {
      const esActivo = local.id === idAbierto && !!estado.perfil;
      const arch = await archivosDe(local.id, esActivo);
      if (!arch.perfil) continue;
      let nid = arch.perfil.nubeId;
      if (!nid) {
        nid = perfilCoincidente(arch.perfil, remotos, deJson) || nuevoId();
        if (remotos.has(nid)) {
          arch.sincro ||= {};
          arch.sincro.respaldoInicial ||= structuredClone({
            perfil: arch.perfil,
            config: arch.config,
            rutas: arch.rutas,
            frecuentes: arch.frecuentes,
            dias: arch.dias,
          });
          arch.sincro.sucios = [
            ...new Set([
              ...(arch.sincro.sucios || []),
              ...Object.keys(arch.dias || {}),
            ]),
          ];
        }
        arch.perfil = { ...arch.perfil, nubeId: nid };
        if (esActivo) {
          estado.perfil.nubeId = nid;
          await window.api.escribir("perfil.json", estado.perfil);
        } else
          await window.api.perfilEscribir(local.id, "perfil.json", arch.perfil);
      }
      const meta = await sincronizarPerfil(
        uid,
        local.id,
        esActivo,
        nid,
        arch,
        remotos.get(nid),
      );
      if (esActivo) activo = { localId: local.id, nid, meta };
      remotos.delete(nid);
    }

    // Perfiles que están en la nube pero no en este equipo → se descargan.
    for (const [nid, r] of remotos) {
      const nombre = deJson(r.perfil)?.nombre || r.nombre || "Perfil";
      const localId = await window.api.perfilCrearVacio(nombre);
      await sincronizarPerfil(
        uid,
        localId,
        false,
        nid,
        { perfil: null, dias: {}, sincro: null },
        r,
      );
      huboCambiosLista = true;
    }

    if (activo) {
      escucharActivo(uid);
      // Cambios hechos mientras se sincronizaba: se suben ahora.
      suciosMemoria.dia.forEach((f) => pendientes.add(f));
      suciosMemoria.datos.forEach((k) => pendientesDatos.add(k));
      suciosMemoria.dia.clear();
      suciosMemoria.datos.clear();
      if (pendientes.size || pendientesDatos.size) subirPendientes();
    }
    const restante = activo ? await colaLocal.leer(activo.localId) : {};
    avisar({
      sincronizando: false,
      ultima: new Date(),
      error: null,
      pendiente: !!(restante.sucios?.length || restante.suciosDatos?.length),
    });
    if (huboCambiosLista) window.dispatchEvent(new Event("nube-perfiles"));
  } catch (e) {
    console.error(e);
    avisar({ sincronizando: false, error: mensaje(e) });
  }
}

async function sincronizarPerfil(uid, localId, esActivo, nid, arch, remoto) {
  const base = fb.doc(db, "cuentas", uid, "perfiles", nid);
  const sucios = new Set(arch.sincro?.sucios || []);
  const suciosDatos = new Set(arch.sincro?.suciosDatos || []);
  let meta =
    arch.sincro && arch.sincro.cuenta === uid && arch.sincro.nubeId === nid
      ? arch.sincro
      : null;
  meta = meta || { cuenta: uid, nubeId: nid, datos: {}, dias: {}, fotos: {} };
  if (arch.sincro?.respaldoInicial)
    meta.respaldoInicial = arch.sincro.respaldoInicial;
  meta.basesDias ||= {};
  delete meta.sucios;
  delete meta.suciosDatos;
  const r = remoto || {};
  // Lo cambiado sin sesión cuenta como lo más reciente de este equipo.
  const ahora = Date.now();
  for (const k of suciosDatos)
    meta.datos[k] = Math.max(ahora, (r[`mod_${k}`] || 0) + 1);

  // Datos del perfil (perfil, config, rutas, frecuentes)
  const subir = {};
  for (const k of DATOS) {
    const lm = meta.datos[k] || 0;
    const rm = r[`mod_${k}`] || 0;
    if (r[k] != null && rm > lm) {
      let valor = deJson(r[k]);
      if (k === "perfil") valor = { ...valor, nubeId: nid };
      await aplicarDatoLocal(localId, esActivo, k, valor);
      meta.datos[k] = rm;
    } else if (arch[k] != null && (lm > rm || r[k] == null)) {
      const mod = lm || Date.now();
      subir[k] = json(arch[k]);
      subir[`mod_${k}`] = mod;
      meta.datos[k] = mod;
    }
  }
  if (Object.keys(subir).length) {
    subir.nombre = (arch.perfil || deJson(r.perfil) || {}).nombre || "";
    await fb.setDoc(base, subir, { merge: true });
  }

  // Días
  const remDias = new Map();
  (await fb.getDocs(fb.collection(base, "dias"))).forEach((d) =>
    remDias.set(d.id, d.data()),
  );
  const dias = { ...(arch.dias || {}) };
  const mesesCambiados = new Set();
  let lote = fb.writeBatch(db);
  let enLote = 0;
  const confirmar = async () => {
    if (enLote) {
      await lote.commit();
      lote = fb.writeBatch(db);
      enLote = 0;
    }
  };

  for (const fecha of new Set([
    ...Object.keys(dias),
    ...remDias.keys(),
    ...Object.keys(meta.dias),
  ])) {
    if (!fechaNubeValida(fecha)) continue;
    const rd = remDias.get(fecha);
    const rm = rd?.mod || 0;
    if (sucios.has(fecha)) {
      // Cambiado aquí sin sesión: si en la nube también cambió, se combinan; luego se sube.
      let valor = dias[fecha] || null;
      if (rd && rm > (meta.dias[fecha] || 0) && rd.v) {
        const remotoDia = deJson(rd.v);
        if (JSON.stringify(valor) !== JSON.stringify(remotoDia)) {
          meta.conflictos = [
            ...(meta.conflictos || []),
            { fecha, local: valor, remoto: remotoDia, instante: Date.now() },
          ].slice(-20);
        }
        valor =
          valor === null
            ? null
            : fusionarRegistro(meta.basesDias[fecha], valor, remotoDia);
        if (esActivo) aplicarDiaActivo(fecha, valor);
        else {
          if (valor) dias[fecha] = valor;
          else delete dias[fecha];
          mesesCambiados.add(fecha.slice(0, 7));
        }
      }
      const mod = Math.max(ahora, rm + 1);
      lote.set(fb.doc(base, "dias", fecha), { v: json(valor), mod });
      meta.dias[fecha] = mod;
      meta.basesDias[fecha] = structuredClone(valor);
      if (++enLote >= 400) await confirmar();
      continue;
    }
    const lm = meta.dias[fecha] || 0;
    if (rd && rm > lm) {
      const valor = deJson(rd.v);
      if (esActivo) aplicarDiaActivo(fecha, valor);
      else {
        if (valor) dias[fecha] = valor;
        else delete dias[fecha];
        mesesCambiados.add(fecha.slice(0, 7));
      }
      meta.dias[fecha] = rm;
      meta.basesDias[fecha] = structuredClone(valor);
    } else if (
      (dias[fecha] && (lm > rm || !rd)) ||
      (!dias[fecha] && lm > rm && rd)
    ) {
      const mod = lm || Date.now();
      lote.set(fb.doc(base, "dias", fecha), {
        v: json(dias[fecha] || null),
        mod,
      });
      meta.dias[fecha] = mod;
      meta.basesDias[fecha] = structuredClone(dias[fecha] || null);
      if (++enLote >= 400) await confirmar();
    }
  }
  await confirmar();

  if (!esActivo) {
    for (const mes of mesesCambiados) {
      const contenido = Object.fromEntries(
        Object.entries(dias)
          .filter(([f]) => f.startsWith(mes))
          .sort(),
      );
      await window.api.perfilEscribir(localId, `dias/${mes}.json`, contenido);
    }
  }

  // Fotos de las medidas
  const diasFinales = esActivo ? estado.dias : dias;
  for (const d of Object.values(diasFinales)) {
    const rel = d?.medidas?.foto;
    if (!rel) continue;
    const local = await window.api.perfilFoto(localId, rel);
    if (local && !meta.fotos[rel]) {
      await fb.setDoc(fb.doc(base, "fotos", idFoto(rel)), {
        v: await fotoParaNube(local),
      });
      meta.fotos[rel] = true;
    } else if (!local) {
      const snap = await fb.getDoc(fb.doc(base, "fotos", idFoto(rel)));
      if (snap.exists()) {
        await window.api.perfilGuardarFoto(localId, rel, snap.data().v);
        meta.fotos[rel] = true;
      }
    }
  }

  await colaLocal.guardar(
    localId,
    meta,
    confirmaciones(arch.sincro || {}, [...sucios], [...suciosDatos]),
  );
  return meta;
}

// ---------- Tiempo real para el perfil abierto ----------
function detenerEscucha() {
  desuscribir.forEach((f) => f());
  desuscribir = [];
}

const refrescarPantalla = retrasar(
  () => window.dispatchEvent(new Event("datos-importados")),
  300,
);
const guardarMeta = retrasar(() => {
  if (activo)
    colaLocal
      .guardar(activo.localId, activo.meta)
      .catch((e) => avisar({ error: mensaje(e) }));
}, 1000);

function escucharActivo(uid) {
  detenerEscucha();
  const { nid } = activo;
  const base = fb.doc(db, "cuentas", uid, "perfiles", nid);

  desuscribir.push(
    fb.onSnapshot(
      fb.collection(base, "dias"),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        let cambio = false;
        for (const c of snap.docChanges()) {
          if (c.type === "removed") continue;
          const fecha = c.doc.id;
          if (!fechaNubeValida(fecha)) continue;
          const { v, mod } = c.doc.data();
          if (!mod || mod <= (activo.meta.dias[fecha] || 0)) continue;
          let valor = deJson(v);
          if (pendientes.has(fecha) && valor && estado.dias[fecha])
            valor = fusionarRegistro(
              activo.meta.basesDias?.[fecha],
              estado.dias[fecha],
              valor,
            ); // cambios cruzados
          aplicarDiaActivo(fecha, valor);
          activo.meta.dias[fecha] = mod;
          activo.meta.basesDias ||= {};
          activo.meta.basesDias[fecha] = deJson(v);
          cambio = true;
          const rel = valor?.medidas?.foto;
          if (rel) bajarFoto(base, rel);
        }
        if (cambio) {
          guardarMeta();
          refrescarPantalla();
        }
      },
      (e) => avisar({ error: mensaje(e) }),
    ),
  );

  desuscribir.push(
    fb.onSnapshot(
      base,
      async (snap) => {
        if (snap.metadata.hasPendingWrites || !snap.exists()) return;
        const r = snap.data();
        let cambio = false;
        for (const k of DATOS) {
          const rm = r[`mod_${k}`] || 0;
          if (r[k] == null || rm <= (activo.meta.datos[k] || 0)) continue;
          let valor = deJson(r[k]);
          if (k === "perfil") valor = { ...valor, nubeId: nid };
          await aplicarDatoLocal(activo.localId, true, k, valor);
          activo.meta.datos[k] = rm;
          cambio = true;
        }
        if (cambio) {
          guardarMeta();
          window.dispatchEvent(new Event("nube-config"));
          refrescarPantalla();
        }
      },
      (e) => avisar({ error: mensaje(e) }),
    ),
  );
}

async function bajarFoto(base, rel) {
  if (await window.api.perfilFoto(activo.localId, rel)) return;
  const snap = await fb.getDoc(fb.doc(base, "fotos", idFoto(rel)));
  if (snap.exists()) {
    await window.api.perfilGuardarFoto(activo.localId, rel, snap.data().v);
    activo.meta.fotos[rel] = true;
    guardarMeta();
  }
}

// ---------- Subida de cambios locales ----------
const pendientes = new Set(); // días
const pendientesDatos = new Set();

function cambioLocal(tipo, clave) {
  if (aplicandoRemoto) return;
  anotarSucio(tipo, clave);
  if (!usuario || !activo || enCurso) {
    return;
  }
  if (tipo === "dia") pendientes.add(clave);
  else pendientesDatos.add(clave);
  subirPendientes();
}

// Cambios hechos sin sesión (o mientras se sincroniza): se anotan en sincro.json y se suben después.
let colaSucios = Promise.resolve();
const suciosMemoria = { dia: new Set(), datos: new Set() };
function anotarSucio(tipo, clave) {
  if (!estado.perfil) return;
  avisar({ pendiente: true });
  if (!usuario || !activo || enCurso)
    suciosMemoria[tipo === "dia" ? "dia" : "datos"].add(clave);
  const ubicacion = window.api.ubicacion();
  colaSucios = colaSucios
    .then(async () => {
      const { perfil } = await ubicacion;
      if (perfil) await colaLocal.marcar(perfil, tipo, clave);
    })
    .catch((e) => avisar({ error: mensaje(e) }));
}

const subirPendientes = retrasar(async () => {
  if (!usuario || !activo) return;
  await colaSucios;
  const destino = activo;
  if (!destino || !usuario) return;
  const revisionEnviada = await colaLocal.leer(destino.localId);
  const diasEnviados = [...pendientes],
    datosEnviados = [...pendientesDatos];
  const base = fb.doc(db, "cuentas", usuario.uid, "perfiles", destino.nid);
  const ahora = Date.now();
  try {
    const lote = fb.writeBatch(db);
    const basesEnviadas = {};
    for (const fecha of pendientes) {
      basesEnviadas[fecha] = structuredClone(estado.dias[fecha] || null);
      lote.set(fb.doc(base, "dias", fecha), {
        v: json(estado.dias[fecha] || null),
        mod: ahora,
      });
      activo.meta.dias[fecha] = ahora;
    }
    if (pendientesDatos.size) {
      const datos = { nombre: estado.perfil?.nombre || "" };
      for (const k of pendientesDatos) {
        datos[k] = json(estado[k]);
        datos[`mod_${k}`] = ahora;
        activo.meta.datos[k] = ahora;
      }
      lote.set(base, datos, { merge: true });
    }
    const fotos = [...pendientes]
      .map((f) => estado.dias[f]?.medidas?.foto)
      .filter((rel) => rel && !activo.meta.fotos[rel]);
    pendientes.clear();
    pendientesDatos.clear();
    // Solo confirmar la cola durable después de recibir acuse de registros y fotos.
    avisar({ sincronizando: true });
    const subirFotos = async () => {
      for (const rel of fotos) {
        const data = await window.api.perfilFoto(destino.localId, rel);
        if (data) {
          await fb.setDoc(fb.doc(base, "fotos", idFoto(rel)), {
            v: await fotoParaNube(data),
          });
          destino.meta.fotos[rel] = true;
        }
      }
    };
    lote
      .commit()
      .then(subirFotos)
      .then(async () => {
        destino.meta.basesDias = {
          ...(destino.meta.basesDias || {}),
          ...basesEnviadas,
        };
        const meta = await colaLocal.guardar(
          destino.localId,
          destino.meta,
          confirmaciones(revisionEnviada, diasEnviados, datosEnviados),
        );
        avisar({
          ultima: new Date(),
          error: null,
          sincronizando: false,
          pendiente: !!(meta.sucios?.length || meta.suciosDatos?.length),
        });
      })
      .catch((e) =>
        avisar({ error: mensaje(e), sincronizando: false, pendiente: true }),
      );
    guardarMeta();
  } catch (e) {
    avisar({ error: mensaje(e) });
  }
}, 1200);

// Prueba local: usa la desconexión oficial del SDK, nunca modifica el firewall.
export async function conexionEmulador(activa) {
  if (!emulador || !db) throw Error("Disponible solo en el emulador local.");
  localStorage.setItem("rfc-emulador-sin-red", activa ? "0" : "1");
  await (activa ? fb.enableNetwork(db) : fb.disableNetwork(db));
  avisar({ enLinea: activa });
  if (activa && usuario) sincronizarTodo();
}
