# Sincronización privada

Proyecto Firebase `resistencia-fc`, plan Spark. La configuración de cliente es pública; no incluye credenciales administrativas. El acceso a los registros se controla con Firebase Authentication y `codigo/firebase/firestore.rules`, publicadas en la consola.

## Uso

1. En la PC, abrir Ajustes → Sincronización. Crear una cuenta con correo y una contraseña exclusiva de al menos 12 caracteres. La contraseña la escribe el usuario dentro de la app; nunca se guarda en archivos del proyecto ni se introduce en el chat.
2. En el celular, abrir Cuenta y sincronización e iniciar sesión con esa misma cuenta. No crear otra cuenta diferente para el celular.
3. Se guarda primero en el dispositivo. Sin internet se conservan los registros y las revisiones pendientes en `sincro.json`; se envían al recuperar conexión. Al recibir la confirmación del servidor se limpia únicamente la revisión que fue enviada.
4. Windows puede sincronizar minimizado en la bandeja. En Android la sincronización se realiza con la app abierta y al volver a abrirla; el navegador puede suspenderla cuando está cerrada o en segundo plano.
5. No confundir sincronizar registros con actualizar el programa. GitHub Pages distribuye la aplicación móvil; Firebase guarda los datos de cada cuenta por separado.

## Componentes

- `nube.js`: cuenta, descargas, subidas y suscripciones en tiempo real para el perfil abierto.
- `cola-local.js`: cola persistente por perfil, serialización y confirmaciones por revisión. Una confirmación antigua nunca elimina una edición nueva.
- `fusion.js`: fusión a tres bandas. Conserva cambios en campos diferentes y eliminaciones; en conflictos en un mismo valor gana el local. Se conserva una copia de las versiones en `sincro.json` para los conflictos detectados durante reconciliación completa.
- `validacion.js`: JSON estructurado con límites, propiedades prohibidas y fechas; solo permite emuladores de loopback.
- `fotos.js`: prepara una copia reducida para los límites de Firestore, sin modificar la foto local.
- `nube-config.js`: identificadores del proyecto, no contraseñas ni claves de administración.

Primera conexión: si un perfil sin identificador de nube coincide de forma única en nombre normalizado y sexo con uno de la cuenta, se vincula al mismo identificador. Se conserva un respaldo inicial local antes de reconciliar. Los perfiles ambiguos permanecen separados para no unir personas diferentes.

## Seguridad y límites

Las reglas solo permiten acceder a `cuentas/{uid}/perfiles/...` al propietario autenticado. Restringen rutas, campos y formatos. No hay permiso público ni credenciales de administrador dentro de la aplicación. Los registros remotos son JSON y no se ejecutan como programas. Esto no equivale a cifrado de extremo a extremo: Firebase es el proveedor de almacenamiento y la seguridad también depende de proteger la cuenta y los dispositivos.

Spark tiene cuotas gratuitas; no se vinculó facturación ni tarjeta. Si se agotan, la sincronización puede quedar pendiente. Los registros siguen siendo locales y se conservan las opciones de exportación y respaldo. Los PDFs semanales se regeneran en cada equipo a partir de los registros sincronizados.

## Verificación

- `npm test`: incluye cola durable, confirmaciones, validación, fusión por campo, eliminaciones y vinculación.
- `test/nube-integracion.mjs`: comprobó en el servicio real, solo con identidades sintéticas temporales, acceso propio, rechazo de otra cuenta, rechazo de una ruta inválida y escritura offline confirmada al volver. Los documentos y usuarios de prueba se retiraron.
- `test/qa-nube-emulador.cjs`: dos clientes aislados con el emulador oficial. Verificó descarga inicial, recepción en tiempo real, edición sin conexión, recarga del cliente sin red, persistencia y envío posterior. Usa la desconexión oficial del SDK; no abre permisos de firewall.
- `conexionEmulador` está limitada a la configuración local `demo-rfc` con direcciones de loopback. No puede modificar la conexión de producción.

Para las pruebas locales, configurar `RFC_PRUEBA` en una carpeta de pruebas y arrancar los emuladores de Auth y Firestore. Java es únicamente una herramienta de pruebas: no se instala ni se necesita en los equipos que usan Resistencia f’c.
