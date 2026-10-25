import { montarResumenCuenta } from "../modulos/perfiles/cuenta-resumen.js";
import { imagenPerfilSegura } from "../modulos/perfiles/identidad-perfil.js";
// Pantalla "¿Quién va a registrar?": elegir, crear o importar un perfil.
import { estado } from "../modulos/datos/estado.js";
import { navegar, aviso } from "../nav.js";
import { recargarEnPerfil, importarYAbrir } from "./perfil.js";
import { I } from "../modulos/ilustraciones/iconos.js";
import { nubeConfigurada } from "../modulos/sincronizacion/nube.js";
import { escapar, num } from "../util.js";

export async function mostrarPerfiles(cont) {
  const [lista, u] = await Promise.all([
    window.api.listarPerfiles(),
    window.api.ubicacion(),
  ]);
  const iniciales = (n) =>
    n
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0].toUpperCase())
      .join("");

  cont.innerHTML = `<div class="bienvenida perfiles-pagina" style="max-width:900px">
    <header class="perfiles-cab"><img src="../build/icon.png" alt=""><div><h1>Perfiles</h1><p class="suave">Resistencia f’c</p></div></header>
    ${nubeConfigurada() ? "<div data-resumen-cuenta></div>" : ""}
    <div class="perfiles-titulo"><h2>Perfiles de entrenamiento</h2></div>
    <div class="perfiles-rejilla">
      ${lista
        .map(
          (
            p,
          ) => `<button class="perfil-tarjeta perfil-seleccion ${p.id === u.perfil ? "actual" : ""}" data-id="${escapar(p.id)}">
        <span class="avatar">${imagenPerfilSegura(p.fotoPerfil) ? `<img src="${p.fotoPerfil}" alt="">` : escapar(iniciales(p.nombre))}</span><span class="perfil-seleccion-texto">
        <b>${escapar(p.nombre)}</b>
        <span class="suave pequeño">${p.pesoMeta ? `Meta: ${num(p.pesoMeta, 1)} kg` : "Perfil personal"}</span>
        ${p.id === u.perfil ? '<span class="perfil-usado">Último usado</span>' : ""}</span>
      </button>`,
        )
        .join("")}
      <button class="perfil-tarjeta perfil-seleccion nuevo" id="crear"><span class="avatar">${I.mas}</span><span class="perfil-seleccion-texto"><b>Crear perfil</b><span class="suave pequeño">Datos y rutina propios</span></span></button>
    </div>
    <div class="bienvenida-pie">
      ${estado.perfil ? `<button class="boton fantasma" id="volver">${I.izquierda} Volver</button>` : "<span></span>"}
      <div class="grupo-botones">
        
        <button class="boton" id="importar">${I.carpeta} Importar perfil</button>
      </div>
    </div>
    ${window.api.esCelular ? "" : `<details class="perfiles-ubicacion"><summary>Carpeta de perfiles</summary><p class="suave pequeño">${escapar(u.carpeta)}\\perfiles</p></details>`}
  </div>`;

  const resumenCuenta = cont.querySelector("[data-resumen-cuenta]");
  if (resumenCuenta) montarResumenCuenta(resumenCuenta);
  cont.querySelectorAll(".perfil-tarjeta[data-id]").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await window.api.abrirPerfil(b.dataset.id);
        recargarEnPerfil();
      } catch (e) {
        aviso(e.message, "error");
      }
    }),
  );
  cont
    .querySelector("#crear")
    .addEventListener("click", () => navegar("bienvenida"));
  cont
    .querySelector("#importar")
    .addEventListener("click", () => importarYAbrir());
  cont
    .querySelector("#volver")
    ?.addEventListener("click", () => navegar("calendario"));
}
