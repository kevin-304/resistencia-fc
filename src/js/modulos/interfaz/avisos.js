import { escapar } from "../../util.js";
export function aviso(texto, tipo = "") {
  const cont = document.getElementById("avisos-flotantes");
  const div = document.createElement("div");
  div.className = "aviso-flotante " + tipo;
  div.textContent = texto;
  div.setAttribute("role", tipo === "error" ? "alert" : "status");
  cont.appendChild(div);
  setTimeout(() => div.remove(), 3800);
}

// Diálogo de confirmación simple.
export function confirmar(titulo, texto, textoSi = "Sí", peligro = false) {
  return new Promise((resolve) => {
    const d = document.createElement("dialog");
    d.innerHTML = `<h2>${escapar(titulo)}</h2><p class="suave">${escapar(texto)}</p>
      <div class="acciones"><button class="boton fantasma" value="no">Cancelar</button><button class="boton ${peligro ? "peligro" : "primario"}" value="si">${escapar(textoSi)}</button></div>`;
    document.body.appendChild(d);
    d.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        d.close();
        resolve(b.value === "si");
      }),
    );
    d.addEventListener("close", () => {
      d.remove();
      resolve(false);
    });
    d.showModal();
  });
}
