import * as nube from "../sincronizacion/nube.js";
import { normalizarIdentidad, validarRegistro } from "./cuenta-datos.js";
import { alSalir, confirmar } from "../../nav.js";
import { escapar } from "../../util.js";

const ojo =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ojoCerrado =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M9.5 5.3Q10.7 5 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.3 4.1M6 6.5A21 21 0 0 0 2 12s3.5 7 10 7q2.6 0 4.8-1.3M10 10a3 3 0 0 0 4 4"/></svg>';
const campo = (nombre, titulo, valor = "", extra = "") =>
  `<label class="campo"><span>${titulo}</span><input name="${nombre}" value="${escapar(valor)}" ${extra}></label>`;
const clave = (nombre, titulo, nueva = false) =>
  `<label class="campo"><span>${titulo}</span><div class="cuenta-clave"><input name="${nombre}" type="password" autocomplete="${nueva ? "new-password" : "current-password"}" required ${nueva ? 'minlength="12"' : ""}><button type="button" data-ver-clave aria-label="Mostrar ${titulo.toLowerCase()}" aria-pressed="false">${ojo}</button></div></label>`;
const email = (valor = "") =>
  campo(
    "email",
    "Correo",
    valor,
    'type="email" autocomplete="username" required maxlength="254"',
  );
const identidad = (d = {}) =>
  campo(
    "nombre",
    "Nombre",
    d.nombre,
    'autocomplete="given-name" required maxlength="80"',
  ) +
  campo(
    "apellido",
    "Apellido",
    d.apellido,
    'autocomplete="family-name" required maxlength="80"',
  ) +
  campo(
    "apodo",
    "Apodo (opcional)",
    d.apodo,
    'autocomplete="nickname" maxlength="80"',
  );

export function tarjetaNube(caja, servicios = nube) {
  caja.classList.add("cuenta-panel");
  let modo = "login",
    montada = "",
    actual = {},
    correoRecordado = "",
    ocupado = false,
    ultimoEnvio = 0,
    vivo = true;
  const mensaje = (texto, error = false) => {
    const e = caja.querySelector("[data-cuenta-mensaje]");
    if (e) {
      e.textContent = texto || "";
      e.classList.toggle("es-error", error);
    }
  };
  function cambiar(vista) {
    correoRecordado =
      caja.querySelector('[name="email"]')?.value ||
      correoRecordado ||
      actual.email ||
      "";
    modo = vista;
    montada = "";
    pintar(actual);
  }
  function formulario(vista) {
    if (vista === "registrar")
      return `<header class="cuenta-cab"><h2>Crear cuenta</h2><p>Para sincronizar tus dispositivos.</p></header><form data-cuenta-form="registrar"><div class="cuenta-campos">${identidad()}${email(correoRecordado)}${clave("clave", "Contraseña", true)}${clave("confirmacion", "Confirmar contraseña", true)}</div><p class="cuenta-ayuda">Al menos 12 caracteres. Te enviaremos un enlace para verificar tu correo.</p><div class="cuenta-acciones"><button class="boton cuenta-principal" type="submit">Crear cuenta</button><button class="boton fantasma" type="button" data-cuenta-accion="login">Ya tengo cuenta</button></div><p data-cuenta-mensaje role="status"></p></form>`;
    if (vista === "recuperar")
      return `<header class="cuenta-cab"><h2>Recuperar acceso</h2><p>Recibe un enlace para elegir una contraseña nueva.</p></header><form data-cuenta-form="recuperar">${email(correoRecordado || actual.email || "")}<div class="cuenta-acciones"><button class="boton cuenta-principal" type="submit">Enviar enlace</button><button class="boton fantasma" type="button" data-cuenta-accion="login">Volver</button></div><p data-cuenta-mensaje role="status"></p></form>`;
    return `<header class="cuenta-cab"><h2>Iniciar sesión</h2><p>Tu cuenta en todos tus dispositivos.</p></header><form data-cuenta-form="login"><div class="cuenta-campos">${email(correoRecordado)}${clave("clave", "Contraseña")}</div><div class="cuenta-acciones"><button class="boton cuenta-principal" type="submit">Iniciar sesión</button><button class="boton fantasma" type="button" data-cuenta-accion="recuperar">Olvidé mi contraseña</button></div><p data-cuenta-mensaje role="status"></p></form><div class="cuenta-pie"><span>¿Primera vez?</span><button type="button" class="boton" data-cuenta-accion="registrar">Crear cuenta</button></div>`;
  }
  function pintar(n) {
    actual = n;
    if (!vivo || !caja.isConnected) return;
    if (!n.configurada) {
      caja.innerHTML =
        '<h2>Sincronización</h2><p class="suave">Servicio sin configurar.</p>';
      return;
    }
    const vista =
      modo === "recuperar" ? "recuperar" : n.conectado ? "cuenta" : modo;
    if (vista !== montada) {
      montada = vista;
      if (vista !== "cuenta") caja.innerHTML = formulario(vista);
      else
        caja.innerHTML = `<div class="cuenta-identidad"><span class="cuenta-avatar" data-cuenta-iniciales></span><div><h2 data-cuenta-nombre></h2><p data-cuenta-correo></p></div></div><p class="cuenta-verificado" data-cuenta-verificado></p><div class="cuenta-verificar" data-cuenta-verificar><button type="button" class="boton" data-cuenta-accion="verificar">Enviar verificación</button><button type="button" class="boton fantasma" data-cuenta-accion="comprobar">Ya verifiqué</button></div><p class="cuenta-estado" data-cuenta-estado role="status"></p><p class="cuenta-ayuda" data-cuenta-ultima></p><p data-cuenta-mensaje role="status"></p><div data-cuenta-editor hidden></div><div class="cuenta-acciones"><button type="button" class="boton" data-cuenta-accion="editar">Editar datos</button><button type="button" class="boton" data-cuenta-accion="sincronizar">Sincronizar</button><button type="button" class="boton fantasma" data-cuenta-accion="recuperar">Restablecer contraseña</button><button type="button" class="boton fantasma" data-cuenta-accion="cambiar">Cambiar cuenta</button></div>`;
    }
    if (vista === "cuenta") {
      const poner = (selector, texto) => {
        caja.querySelector(selector).textContent = texto;
      };
      poner("[data-cuenta-nombre]", n.nombreCuenta || "Mi cuenta");
      poner("[data-cuenta-correo]", n.email || "");
      poner(
        "[data-cuenta-iniciales]",
        (n.nombreCuenta || n.email || "")
          .split(/\s+/)
          .slice(0, 2)
          .map((x) => x[0] || "")
          .join("")
          .toUpperCase(),
      );
      poner(
        "[data-cuenta-verificado]",
        n.verificado ? "Correo verificado" : "Correo pendiente de verificar",
      );
      caja.querySelector("[data-cuenta-verificar]").hidden = !!n.verificado;
      poner(
        "[data-cuenta-estado]",
        n.perfilAjeno
          ? "Este perfil está vinculado a otra cuenta. Puedes elegir otro perfil de entrenamiento."
          : !n.enLinea
            ? "Sin conexión · guardado en este dispositivo"
            : n.error
              ? "No se pudo sincronizar"
              : n.sincronizando || n.pendiente
                ? "Sincronizando…"
                : "Sincronización al día",
      );
      poner(
        "[data-cuenta-ultima]",
        n.ultima
          ? "Última sincronización: " +
              n.ultima.toLocaleTimeString("es", {
                hour: "2-digit",
                minute: "2-digit",
              })
          : "Los cambios se envían al conectar.",
      );
      if (n.error || n.avisoCuenta)
        mensaje(n.error || n.avisoCuenta, !!n.error);
    }
  }
  function ocupadoForm(form, estado) {
    for (const b of form.querySelectorAll("button,input")) b.disabled = estado;
    form.setAttribute("aria-busy", String(estado));
  }
  async function enviar(e) {
    const form = e.target.closest("[data-cuenta-form]");
    if (!form || ocupado) return;
    e.preventDefault();
    if (!form.reportValidity()) return;
    const datos = Object.fromEntries(new FormData(form)),
      tipo = form.dataset.cuentaForm;
    if (tipo === "registrar") {
      const error = validarRegistro(datos);
      if (error) {
        mensaje(error, true);
        return;
      }
    }
    ocupado = true;
    ocupadoForm(form, true);
    mensaje("");
    try {
      let error = null;
      if (tipo === "login")
        error = await servicios.entrar(datos.email, datos.clave);
      if (tipo === "registrar")
        error = await servicios.crearCuenta(
          datos.email,
          datos.clave,
          normalizarIdentidad(datos),
        );
      if (tipo === "recuperar") {
        error = await servicios.recuperarClave(datos.email);
        if (!error)
          mensaje(
            "Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña. Revisa también el correo no deseado.",
          );
      }
      if (tipo === "editar") {
        error = await servicios.guardarIdentidad(datos);
        if (!error) {
          caja.querySelector("[data-cuenta-editor]").hidden = true;
          mensaje("Datos guardados.");
        }
      }
      if (error) mensaje(error, true);
    } catch {
      mensaje("No se pudo completar la solicitud. Inténtalo de nuevo.", true);
    } finally {
      ocupado = false;
      if (form.isConnected) ocupadoForm(form, false);
    }
  }
  async function pulsar(e) {
    const ojoBoton = e.target.closest("[data-ver-clave]");
    if (ojoBoton) {
      const input = ojoBoton.parentElement.querySelector("input"),
        visible = input.type === "password";
      input.type = visible ? "text" : "password";
      ojoBoton.innerHTML = visible ? ojoCerrado : ojo;
      ojoBoton.setAttribute("aria-pressed", String(visible));
      ojoBoton.setAttribute(
        "aria-label",
        visible ? "Ocultar contraseña" : "Mostrar contraseña",
      );
      return;
    }
    const b = e.target.closest("[data-cuenta-accion]");
    if (!b || ocupado) return;
    const accion = b.dataset.cuentaAccion;
    if (["login", "registrar", "recuperar"].includes(accion)) {
      cambiar(accion);
      return;
    }
    if (accion === "editar") {
      const editor = caja.querySelector("[data-cuenta-editor]");
      editor.innerHTML = `<form data-cuenta-form="editar"><div class="cuenta-campos">${identidad(actual.identidad)}</div><div class="cuenta-acciones"><button class="boton cuenta-principal" type="submit">Guardar cambios</button><button type="button" class="boton fantasma" data-cuenta-accion="cancelar">Cancelar</button></div></form>`;
      editor.hidden = false;
      editor.querySelector("input").focus();
      return;
    }
    if (accion === "cancelar") {
      caja.querySelector("[data-cuenta-editor]").hidden = true;
      return;
    }
    if (accion === "cambiar") {
      if (
        !(await confirmar(
          "Cambiar de cuenta",
          "Tus perfiles seguirán guardados en este dispositivo.",
          "Cerrar sesión",
        ))
      )
        return;
      await servicios.salir();
      modo = "login";
      montada = "";
      pintar({ ...actual, conectado: false });
      return;
    }
    b.disabled = true;
    try {
      if (accion === "sincronizar") await servicios.sincronizarTodo();
      if (accion === "verificar") {
        if (Date.now() - ultimoEnvio < 60000) {
          mensaje("Espera un minuto antes de reenviar el correo.");
          return;
        }
        const error = await servicios.enviarVerificacion();
        if (!error) ultimoEnvio = Date.now();
        mensaje(
          error ||
            "Enlace enviado. Revisa tu correo y vuelve para comprobarlo.",
          !!error,
        );
      }
      if (accion === "comprobar") {
        const error = await servicios.comprobarVerificacion();
        if (error) mensaje(error, true);
        else if (!actual.verificado)
          mensaje(
            "El correo aún no figura como verificado. Abre el enlace recibido e inténtalo de nuevo.",
          );
      }
    } catch {
      mensaje("No se pudo completar la solicitud. Inténtalo de nuevo.", true);
    } finally {
      if (b.isConnected) b.disabled = false;
    }
  }
  caja.addEventListener("submit", enviar);
  caja.addEventListener("click", pulsar);
  let quitar = () => {};
  quitar = servicios.alCambiarNube(pintar);
  const limpiar = () => {
    vivo = false;
    quitar();
    caja.removeEventListener("submit", enviar);
    caja.removeEventListener("click", pulsar);
    caja.replaceChildren();
  };
  alSalir(limpiar);
  return limpiar;
}
