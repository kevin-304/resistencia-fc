import { estado, guardarPerfil, guardarConfig } from "../datos/estado.js";
import { normalizarPlan } from "../rutinas/plan.js";
import { escapar, aNumero } from "../../util.js";
import { aviso } from "../../nav.js";
export const imagenPerfilSegura = (s) =>
  typeof s === "string" &&
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) &&
  s.length < 250000
    ? s
    : null;
export async function comprimirFotoPerfil(archivo, portada = false) {
  if (!archivo.type.startsWith("image/") || archivo.size > 20 * 1024 * 1024)
    throw Error("Elige una imagen de hasta 20 MB.");
  const url = await new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(Error("No se pudo leer la imagen."));
    lector.readAsDataURL(archivo);
  });
  const img = new Image();
  img.src = url;
  await img.decode();
  const maxW = portada ? 1200 : 400,
    maxH = portada ? 500 : 400,
    escala = Math.min(1, maxW / img.width, maxH / img.height),
    c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * escala));
  c.height = Math.max(1, Math.round(img.height * escala));
  const ctx = c.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  let calidad = 0.85,
    s = c.toDataURL("image/jpeg", calidad);
  while (s.length > 180000 && calidad > 0.25) {
    calidad -= 0.1;
    s = c.toDataURL("image/jpeg", calidad);
  }
  if (s.length > 230000)
    throw Error("La imagen sigue siendo demasiado grande.");
  return s;
}
export function montarExtrasPerfil(cont, alCambiar = () => {}) {
  const p = estado.perfil,
    m = normalizarPlan(estado.config.plan).metas;
  cont.innerHTML = `<section class="tarjeta perfil-imagenes"><div class="perfil-portada">${imagenPerfilSegura(p.fotoPortada) ? `<img src="${p.fotoPortada}" alt="Portada">` : ""}</div><div class="perfil-identidad"><div class="perfil-foto">${imagenPerfilSegura(p.fotoPerfil) ? `<img src="${p.fotoPerfil}" alt="Foto de perfil">` : `<span>${escapar(p.nombre?.slice(0, 1) || "")}</span>`}</div><b>${escapar(p.nombre || "")}</b></div><div class="perfil-fotos-acciones">${[
    ["fotoPerfil", "Foto de perfil"],
    ["fotoPortada", "Portada"],
  ]
    .map(
      ([k, n]) =>
        `<label class="boton">${n}<input type="file" accept="image/*" data-foto-perfil="${k}" hidden></label>${p[k] ? `<button class="boton fantasma" data-quitar-foto="${k}">Quitar ${n.toLowerCase()}</button>` : ""}`,
    )
    .join("")}</div></section>
 <details class="tarjeta perfil-metas"><summary>Metas diarias</summary><div class="campos">${[
   ["aguaVasos", "Agua (vasos)"],
   ["suenoHoras", "Sueño (horas)"],
   ["kcalMin", "Calorías mínimas"],
   ["kcalMax", "Calorías de referencia"],
 ]
   .map(
     ([k, n]) =>
       `<label class="campo"><span>${n}</span><input type="number" min="0" step="0.1" data-meta-perfil="${k}" value="${m[k] ?? ""}"></label>`,
   )
   .join("")}</div></details>`;
  cont.querySelectorAll("[data-foto-perfil]").forEach(
    (i) =>
      (i.onchange = async () => {
        if (!i.files[0]) return;
        try {
          const campo = i.dataset.fotoPerfil,
            valor = await comprimirFotoPerfil(
              i.files[0],
              campo === "fotoPortada",
            );
          if (estado.perfil !== p)
            throw Error("El perfil cambió; selecciona la foto de nuevo.");
          estado.perfil[campo] = valor;
          alCambiar(campo, valor);
          await guardarPerfil();
          window.dispatchEvent(new Event("marca-cambiada"));
          montarExtrasPerfil(cont, alCambiar);
        } catch (e) {
          aviso(e.message, "error");
        }
      }),
  );
  cont.querySelectorAll("[data-quitar-foto]").forEach(
    (b) =>
      (b.onclick = async () => {
        const campo = b.dataset.quitarFoto;
        delete estado.perfil[campo];
        alCambiar(campo, null);
        await guardarPerfil();
        window.dispatchEvent(new Event("marca-cambiada"));
        montarExtrasPerfil(cont, alCambiar);
      }),
  );
  cont.querySelectorAll("[data-meta-perfil]").forEach(
    (i) =>
      (i.onchange = () => {
        estado.config.plan = normalizarPlan(estado.config.plan);
        estado.config.plan.metas[i.dataset.metaPerfil] = aNumero(i.value);
        guardarConfig();
      }),
  );
}
