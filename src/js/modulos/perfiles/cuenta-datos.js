// Datos públicos dentro de la cuenta privada. Nunca incluye contraseñas.
export function normalizarIdentidad(d = {}) {
  const texto = (v) =>
    String(v || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
  return {
    nombre: texto(d.nombre),
    apellido: texto(d.apellido),
    apodo: texto(d.apodo),
  };
}
export function validarRegistro(d) {
  const identidad = normalizarIdentidad(d);
  if (!identidad.nombre || !identidad.apellido)
    return "Escribe tu nombre y apellido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email || "").trim()))
    return "Escribe un correo válido.";
  if (String(d.clave || "").length < 12)
    return "Usa una contraseña de al menos 12 caracteres.";
  if (d.clave !== d.confirmacion) return "Las contraseñas no coinciden.";
  return null;
}
export function nombreCuenta(d = {}, alternativo = "Mi cuenta") {
  return (
    d.apodo || [d.nombre, d.apellido].filter(Boolean).join(" ") || alternativo
  );
}
