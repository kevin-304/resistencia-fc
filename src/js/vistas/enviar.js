// (Celular) Enviar días a la PC: se arma un archivo y se comparte por WhatsApp.
import { estado, contexto, guardarTodoYa } from '../estado.js';
import { metricasDia } from '../metricas.js';
import { crearPaqueteDias, nombreArchivoDias } from '../paquetes.js';
import { aviso } from '../nav.js';
import { I } from '../iconos.js';
import { hoyISO, sumarDias, fechaLarga, escapar, num, formatoHoras } from '../util.js';

export async function mostrarEnviar(cont) {
  guardarTodoYa();
  await new Promise((r) => setTimeout(r, 400)); // deja terminar el último guardado
  const pendientes = new Set(await window.api.pendientes());
  const hoy = hoyISO();
  // Días con datos: los pendientes y los últimos 21 días.
  const fechas = [...new Set([...pendientes, ...Array.from({ length: 21 }, (_, i) => sumarDias(hoy, -i))])]
    .filter((f) => estado.dias[f] && Object.keys(estado.dias[f]).length)
    .sort()
    .reverse();

  const ctx = contexto();
  const resumenDia = (f) => {
    const m = metricasDia(f, estado.dias, ctx);
    const p = [];
    if (m.rutaKm) p.push(`${num(m.rutaKm, 2)} km`);
    if (m.sueno != null) p.push(`${formatoHoras(m.sueno)} de sueño`);
    if (m.comidas) p.push(`${m.comidas} comida${m.comidas > 1 ? 's' : ''}`);
    if (m.peso) p.push(`${num(m.peso, 1)} kg`);
    return p.join(' · ') || 'con datos';
  };

  cont.innerHTML = `
    <div class="cabecera"><div class="titulo"><h1>Enviar a la PC</h1><p>Marca los días y compártelos por WhatsApp. En la PC se añaden solos al abrir el programa.</p></div></div>
    ${fechas.length ? `
    <section class="tarjeta">
      <div class="tarjeta-cab"><h2>Días</h2><button class="boton fantasma" id="todos">Marcar todos</button></div>
      ${fechas.map((f) => `<label class="dia-envio">
        <input type="checkbox" value="${f}" ${pendientes.has(f) ? 'checked' : ''}>
        <span><b>${fechaLarga(f)}</b><small>${escapar(resumenDia(f))}</small></span>
        ${pendientes.has(f) ? '<span class="estado-pill aviso-pill">Sin enviar</span>' : '<span class="estado-pill ok">Enviado</span>'}
      </label>`).join('')}
    </section>
    <button class="boton primario grande boton-fijo" id="enviar">${I.descargar} Enviar por WhatsApp</button>`
    : '<section class="tarjeta"><p class="suave">Todavía no hay días registrados en este celular.</p></section>'}`;

  cont.querySelector('#todos')?.addEventListener('click', () => cont.querySelectorAll('.dia-envio input').forEach((c) => { c.checked = true; }));
  cont.querySelector('#enviar')?.addEventListener('click', async () => {
    const elegidas = [...cont.querySelectorAll('.dia-envio input:checked')].map((c) => c.value);
    if (!elegidas.length) { aviso('Marca al menos un día.'); return; }
    // Fotos de esos días (van dentro del archivo)
    const fotos = {};
    for (const f of elegidas) {
      const rel = estado.dias[f]?.medidas?.foto;
      if (rel) fotos[rel] = await window.api.urlArchivo(rel);
    }
    const paquete = crearPaqueteDias(estado.perfil, estado.dias, elegidas, fotos);
    const nombre = nombreArchivoDias(estado.perfil, elegidas);
    const archivo = new File([JSON.stringify(paquete)], nombre, { type: 'text/plain' });
    try {
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: nombre, text: `Registro de ${elegidas.length} día(s) – Resistencia f'c` });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(archivo);
        a.download = nombre;
        a.click();
        aviso('Se descargó el archivo: envíalo por WhatsApp desde tus Descargas.');
      }
      await window.api.marcarEnviados(elegidas);
      aviso('Listo. En la PC, guarda el archivo en Descargas y abre el programa.', 'ok');
      mostrarEnviar(cont);
    } catch (e) {
      if (e.name !== 'AbortError') aviso('No se pudo compartir: ' + e.message, 'error');
    }
  });
}
