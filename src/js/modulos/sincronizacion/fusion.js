// Fusión a tres bandas: respeta eliminaciones y cambios en campos distintos.
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const objeto = (v) => v && typeof v === "object" && !Array.isArray(v);
export function fusionarRegistro(base, local, remoto) {
  if (igual(local, base)) return structuredClone(remoto);
  if (igual(remoto, base) || igual(local, remoto))
    return structuredClone(local);
  if (objeto(local) && objeto(remoto)) {
    const resultado = {};
    for (const k of new Set([
      ...Object.keys(base || {}),
      ...Object.keys(local),
      ...Object.keys(remoto),
    ])) {
      const v = fusionarRegistro(base?.[k], local[k], remoto[k]);
      if (v !== undefined) resultado[k] = v;
    }
    return resultado;
  }
  if (
    Array.isArray(local) &&
    Array.isArray(remoto) &&
    [...local, ...remoto, ...(base || [])].every(
      (v) => objeto(v) && typeof v.id === "string",
    )
  ) {
    const b = new Map((base || []).map((v) => [v.id, v])),
      l = new Map(local.map((v) => [v.id, v])),
      r = new Map(remoto.map((v) => [v.id, v]));
    return [...new Set([...l.keys(), ...r.keys(), ...b.keys()])]
      .map((id) => fusionarRegistro(b.get(id), l.get(id), r.get(id)))
      .filter((v) => v !== undefined);
  }
  // Si ambos modificaron el mismo valor, prevalece el cambio local; el controlador conserva un respaldo.
  return structuredClone(local);
}
export function perfilCoincidente(perfil, remotos, leer) {
  const normal = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  const candidatos = [...remotos].filter(([, r]) => {
    const p = leer(r.perfil);
    return (
      p &&
      normal(p.nombre) === normal(perfil.nombre) &&
      (!p.sexo || !perfil.sexo || p.sexo === perfil.sexo)
    );
  });
  return candidatos.length === 1 ? candidatos[0][0] : null;
}
