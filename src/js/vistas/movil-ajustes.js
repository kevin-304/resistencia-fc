import { montarResumenCuenta } from "../modulos/perfiles/cuenta-resumen.js";
import { montarExtrasPerfil } from "../modulos/perfiles/identidad-perfil.js";
// (Celular) Perfil y ajustes: actualizar el perfil desde la PC, modo claro/oscuro, borrar datos.
import { estado, guardarConfig } from "../modulos/datos/estado.js";
import { aplicarTema, PRESETS } from "../modulos/interfaz/tema.js";
import { aviso, confirmar, navegar } from "../nav.js";
import { recargarEnPerfil } from "./perfil.js";
import { I } from "../modulos/ilustraciones/iconos.js";
import { escapar } from "../util.js";

export async function mostrarMovilAjustes(cont) {
  const p = estado.perfil;
  const oscuro = PRESETS[estado.config.tema.preset]?.modo !== "claro";
  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>${escapar(p.nombre)}</h1><p>Tu perfil de entrenamiento</p></div></div>
    <div data-resumen-cuenta></div><div data-extras-perfil></div><button class="boton" data-editar-perfil style="margin-bottom:10px;width:100%">Editar datos personales</button><button class="boton" id="cambiar-perfil" style="margin-bottom:14px;width:100%">${I.perfil} Cambiar de perfil</button>

    <details class="tarjeta perfil-transferir" style="margin-bottom:14px"><summary>Importar una copia de perfil</summary>
      <p class="suave" style="margin-top:12px">También puedes importar una copia manual. Los registros existentes se conservan.</p>
      <button class="boton" id="importar" style="margin-top:12px">${I.carpeta} Cargar perfil de la PC</button>
    </details>
    <section class="tarjeta" style="margin-bottom:14px">
      <div class="tarjeta-cab"><h2>Apariencia</h2></div>
      <button class="boton" id="modo">${oscuro ? I.sol : I.luna} ${oscuro ? "Modo claro" : "Modo oscuro"}</button>
    </section>
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Datos de este celular</h2></div>
      <p class="suave">Tus registros se guardan aquí y se sincronizan al iniciar sesión. Conserva una copia antes de borrarlos.</p>
      <button class="boton peligro" id="borrar" style="margin-top:12px">${I.basura} Borrar los datos de este celular</button>
    </section>`;

  montarResumenCuenta(cont.querySelector("[data-resumen-cuenta]"));
  cont.querySelector("[data-editar-perfil]").onclick = () => navegar("perfil");
  montarExtrasPerfil(cont.querySelector("[data-extras-perfil]"));
  cont
    .querySelector("#cambiar-perfil")
    .addEventListener("click", () => navegar("perfiles"));
  cont.querySelector("#importar").addEventListener("click", async () => {
    try {
      if (await window.api.importarPerfil()) {
        aviso("Perfil actualizado.", "ok");
        recargarEnPerfil();
      }
    } catch (e) {
      aviso(e.message, "error");
    }
  });
  cont.querySelector("#modo").addEventListener("click", async () => {
    estado.config.tema.preset = oscuro ? "claro" : "oscuro";
    await aplicarTema();
    await guardarConfig.ya();
    mostrarMovilAjustes(cont);
  });
  cont.querySelector("#borrar").addEventListener("click", async () => {
    const texto =
      "Se eliminarán los registros locales. Comprueba antes que estén sincronizados o exporta una copia.";
    if (
      !(await confirmar(
        "¿Borrar los datos del celular?",
        `${texto}\nEsto no afecta a la PC.`,
        "Borrar",
        true,
      ))
    )
      return;
    await window.api.borrarTodo();
    location.reload();
  });
}
