// Tres golpes breves en 3, 2 y 1; señales distintas de descanso y actividad.
export function patronAviso({final=false,cuenta=false,descanso=false}={}) {
  if(cuenta)return [{frecuencia:descanso?740:620,inicio:0,duracion:.11}];
  const frecuencias=final?[880,1046,1318]:descanso?[600,420]:[784,1046,1318];
  return frecuencias.map((frecuencia,i)=>({frecuencia,inicio:i*.13,duracion:final?.26:.16}));
}
