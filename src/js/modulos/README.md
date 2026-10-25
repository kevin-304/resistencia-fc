# Módulos de Resistencia f’c

Cada carpeta contiene una función de la aplicación compartida entre escritorio y celular. Son módulos ES con dependencias explícitas: se importan, no se copian. No son aplicaciones independientes. Las pantallas coordinan los módulos y no deben volver a implementar sus cálculos.

| Carpeta           | Responsabilidad y archivos principales                                                                                                                                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reloj/`          | `selector-hora.js` y su CSS: campos, AM/PM, horas, minutos y hora actual. `reloj-rutina.js`: motor puro de tiempos. `temporizador.js`: controles y sesión guiada. Avisos sonoros y pulsación prolongada.                                                   |
| `alimentacion/`   | `catalogo-comidas.js`: nombres y categorías. `comidas.js`: registros y límites del día. `comidas-vista.js`: formulario diario. `nutricion.js` y `nutricion-datos.js`: estimaciones. `ayuno-nocturno.js`: cálculo entre días. `orden-comidas.js`: arrastre. |
| `sueno/`          | `sueno.js`: tramos y cálculo neto; `sueno-vista.js`: formulario, sin almacenamiento propio.                                                                                                                                                                |
| `rutinas/`        | Planes, programación por fechas, semana editable, catálogo de ejercicios y preparación de sesiones.                                                                                                                                                        |
| `rutas/`          | Formulario de rutas; consume tipos del plan y controles compartidos.                                                                                                                                                                                       |
| `ilustraciones/`  | Iconos SVG, ilustraciones de ejercicios y guías.                                                                                                                                                                                                           |
| `interfaz/`       | Controles de formulario reutilizables, tarjetas, tema, botones y avisos. `avisos.js` y `avisos.css` son el único lugar del aviso flotante.                                                                                                                 |
| `datos/`          | Estado, guardado, cambio de día e intercambio de paquetes. Usa `window.api` como contrato de almacenamiento.                                                                                                                                               |
| `sincronizacion/` | Sincronización y configuración de nube; no implementar guardado alternativo dentro de una pantalla.                                                                                                                                                        |
| `reportes/`       | Métricas compartidas por calendario, estadísticas y reportes; PDF semanal y gráficos.                                                                                                                                                                      |
| `perfiles/`       | Fotos e identidad visual del perfil.                                                                                                                                                                                                                       |

## Puntos de entrada y plataformas

- `src/js/app.js`: arranque de Windows.
- `src/js/movil.js`: arranque móvil.
- `src/js/api-web.js`: implementación de almacenamiento móvil.
- `main/`: Electron, archivos locales, integración de Windows y puente de acceso a datos.
- `src/js/vistas/`: pantallas y coordinación de eventos. `dia.js` usa los formularios de los módulos, conserva sus manejadores y conecta el guardado.
- `src/js/nav.js`: navegación y limpieza de recursos al salir; reexporta avisos para conservar su interfaz pública sin duplicar implementación.
- `src/js/util.js`: utilidades generales, sin estado de pantalla.
- `src/js/vendor/`: dependencias generadas; no modificarlas a mano.
- `src/estilos.css`: diseño general e integración entre secciones; importa las hojas específicas del reloj y los avisos. Los estilos de distribución compartida siguen aquí para mantener la misma presentación en ambas plataformas.

## Ejemplo de reutilización del reloj

```js
import { campoHora, conectarHoras } from "./reloj/selector-hora.js";
// Crear el campo con campoHora(valor, atributos, etiqueta).
// Conectar una vez al contenedor con conectarHoras(contenedor).
// Registrar su función de limpieza al salir de la pantalla.
```

Usar las mismas funciones en sueño, comida, ruta y cualquier otro formulario. No copiar el reloj ni su conversión AM/PM. La hoja `reloj/selector-hora.css` define su aspecto.

## Mantenimiento y verificación

1. Modificar el módulo correspondiente; mantener las funciones puras separadas del DOM cuando sea posible.
2. Ejecutar `npm test` para cálculos, planes, fechas, ayuno, sueño, nutrición y motor de sesión.
3. Ejecutar `npm run check`: valida los grafos de importación de PC, móvil y reporte sin generar paquetes; también detecta módulos sin consumidores.
4. Ejecutar `npm run format` para conservar un formato uniforme. Prettier es una dependencia de desarrollo, no se ejecuta en la aplicación.
5. Las pruebas de interfaz se ejecutan con Electron y `RFC_PRUEBA` apuntando a datos de prueba separados; nunca usar los perfiles reales. `test/qa-modulos.cjs` comprueba ocho pantallas en ambas plataformas y el aspecto neutral de los avisos. `test/qa-comida-compacta.cjs` comprueba comidas y reloj.
6. `npm run web` regenera la versión móvil desde los mismos módulos; no editar `web/src` a mano. `npm run dist` construye Windows.

`rutas-de-migracion.json` relaciona los nombres anteriores con sus nuevas ubicaciones. Los archivos eliminados del catálogo antiguo con emojis y de las figuras vectoriales antiguas no tienen sustituto directo: los módulos vigentes son `catalogo-comidas.js` e `ilustraciones-personas.js`.

## Alcance de la limpieza

Se reorganiza el código compartido, se extraen los formularios de sueño, rutas y alimentación, se centralizan controles de formulario y avisos, y se eliminan interfaces y manejadores de series antiguas sin productores de controles. Se conserva la lectura de datos históricos. No se modifican archivos de perfiles ni el formato de los registros. Las dependencias de estado y plan que ya eran compartidas permanecen explícitas: esta organización no promete que cada carpeta funcione sin las demás.
