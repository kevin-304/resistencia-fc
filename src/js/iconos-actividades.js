// Pictogramas SVG originales: siluetas sin rostro, contornos redondeados
// y posturas específicas para cada actividad, legibles también a 34 px.
const n=v=>Math.round(v*100)/100;
function miembro(a,b,r1,r2){
 const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,u=[dx/l,dy/l],v=[-u[1],u[0]];
 const p=(t,r)=>`${n(a[0]+dx*t+v[0]*r)} ${n(a[1]+dy*t+v[1]*r)}`;
 return `<path d="M${p(0,r1)} C${p(.33,r1*1.12)} ${p(.72,r2*1.18)} ${p(1,r2)} Q${p(1.07,0)} ${p(1,-r2)} C${p(.72,-r2*1.18)} ${p(.33,-r1*1.12)} ${p(0,-r1)} Q${p(-.09,0)} ${p(0,r1)}Z"/>`;
}
function cadena(puntos,radios){return puntos.slice(1).map((p,i)=>miembro(puntos[i],p,radios[i],radios[i+1])+`<circle cx="${p[0]}" cy="${p[1]}" r="${radios[i+1]}"/>`).join('');}
function pie(tobillo,direccion=1){return `<g transform="translate(${tobillo}) scale(${direccion},1)"><path d="M-2 -3Q0 -3 2 -1L6 1Q9 2 7 3.5H-2Q-3 2 -2 -3Z"/></g>`;}
const poses={
 ruta:{s:[49,29],h:[42,50],b:[[[43,29],[32,40],[23,33]],[[54,32],[65,24],[70,30]]],p:[[[39,49],[27,62],[17,56]],[[46,51],[59,63],[52,81]]],pies:[-1,1],perfil:true},
 cardio:{s:[48,29],h:[48,51],b:[[[38,30],[27,21],[19,9]],[[58,30],[69,21],[77,9]]],p:[[[42,51],[31,66],[20,83]],[[54,51],[65,66],[76,83]]],pies:[-1,1]},
 casa:{s:[48,36],h:[48,56],b:[[[38,36],[28,31],[28,20]],[[58,36],[68,31],[68,20]]],p:[[[42,56],[25,63],[24,82]],[[54,56],[71,63],[72,82]]],pies:[-1,1]},
 pilates:{s:[45,28],h:[47,49],b:[[[36,29],[23,29],[10,29]],[[54,29],[68,29],[82,29]]],p:[[[42,49],[41,66],[39,83]],[[52,49],[68,49],[80,39]]],pies:[1,1]},
 gimnasio:{s:[48,35],h:[48,56],b:[[[38,35],[28,24],[24,13]],[[58,35],[68,24],[72,13]]],p:[[[42,56],[40,70],[38,85]],[[54,56],[56,70],[58,85]]],pies:[-1,1]},
 crossfit:{s:[48,39],h:[48,60],b:[[[38,39],[27,26],[24,13]],[[58,39],[69,26],[72,13]]],p:[[[42,60],[28,68],[29,84]],[[54,60],[68,68],[67,84]]],pies:[-1,1]},
 ciclismo:{s:[51,31],h:[35,48],b:[[[48,29],[60,38],[69,41]],[[55,35],[64,39],[69,41]]],p:[[[32,46],[49,55],[37,70]],[[38,51],[29,63],[41,73]]],pies:[1,1],perfil:true},
 natacion:{s:[61,38],h:[40,46],b:[[[59,33],[43,20],[30,24]],[[64,43],[77,50],[86,45]]],p:[[[39,42],[25,46],[10,43]],[[42,50],[29,54],[14,51]]],pies:[-1,-1],perfil:true},
 deportes:{s:[43,29],h:[43,51],b:[[[34,30],[23,40],[15,33]],[[52,31],[66,29],[70,23]]],p:[[[38,51],[29,65],[29,83]],[[49,51],[62,60],[76,55]]],pies:[-1,1],perfil:true},
 movilidad:{s:[48,31],h:[48,53],b:[[[39,32],[31,44],[20,53]],[[57,32],[65,44],[76,53]]],p:[[[42,53],[27,64],[53,69]],[[54,53],[69,64],[43,69]]],pies:[1,-1],sentado:true},
};
function equipo(id){
 const trazo='fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"';
 if(id==='ciclismo')return `<g ${trazo}><circle cx="20" cy="73" r="15"/><circle cx="76" cy="73" r="15"/><path d="M20 73L35 49L48 73H20M35 49H64L76 73M48 73L64 49L69 41H76M29 48H42"/></g>`;
 const mancuerna=(x,y)=>`<g transform="translate(${x} ${y})" fill="currentColor"><rect x="-9" y="-1.5" width="18" height="3" rx="1"/><rect x="-8" y="-6" width="4" height="12" rx="1"/><rect x="4" y="-6" width="4" height="12" rx="1"/></g>`;
 if(id==='casa')return mancuerna(28,18)+mancuerna(68,18);
 if(id==='gimnasio'||id==='crossfit')return '<g fill="currentColor"><rect x="9" y="10" width="78" height="3" rx="1.5"/><rect x="12" y="4" width="5" height="15" rx="1"/><rect x="18" y="6" width="4" height="11" rx="1"/><rect x="79" y="4" width="5" height="15" rx="1"/><rect x="74" y="6" width="4" height="11" rx="1"/></g>';
 if(id==='natacion')return `<g ${trazo}><path d="M7 68Q15 62 23 68T39 68T55 68T71 68T87 68M13 78Q21 72 29 78T45 78T61 78T77 78"/></g>`;
 if(id==='deportes')return `<g ${trazo}><circle cx="81" cy="78" r="9"/><path d="M78 73L84 74L86 79L81 83L76 79Z"/></g>`;
 if(id==='pilates'||id==='movilidad')return `<path d="M10 ${id==='pilates'?91:77}H86" fill="none" stroke="currentColor" stroke-width="2" opacity=".3"/>`;
 return '';
}
export function iconoActividad(id,sexo='H'){
 const p=poses[id]||poses.cardio,mujer=sexo==='M',factor=mujer?.88:1;
 if(id==='natacion')return `<svg class="actividad-silueta" viewBox="0 0 96 96" role="img" aria-label="${mujer?'Figura femenina':'Figura masculina'} nadando"><g fill="currentColor"><circle cx="73" cy="28" r="6"/><path d="M65 34Q69 34 69 39L57 49Q51 52 43 49L31 44L37 38L49 41Z"/><path d="M53 37L39 24Q37 22 34 23L19 29Q16 30 17 33Q18 35 21 34L35 30L47 43Z"/>${mujer?'<path d="M77 23Q84 21 85 27L90 29Q82 33 79 28Z"/>':''}</g><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M8 56Q18 49 28 56T48 56T68 56T88 56M8 70Q18 63 28 70T48 70T68 70T88 70"/></g></svg>`;

 const angulo=Math.atan2(p.h[1]-p.s[1],p.h[0]-p.s[0])*180/Math.PI-90,l=Math.hypot(p.h[0]-p.s[0],p.h[1]-p.s[1]),hombro=mujer?8.6:10.5,cintura=mujer?5.6:6.5,cadera=mujer?8.4:7.6;
 const torso=`<g transform="translate(${p.s}) rotate(${n(angulo)})"><path d="M-2.5 -9H2.5L3.3 -3Q${hombro} -2 ${hombro} 2Q${hombro-1} 7 ${cintura} ${n(l*.63)}Q${cintura} ${n(l*.83)} ${cadera} ${n(l-1)}Q0 ${n(l+5)} ${-cadera} ${n(l-1)}Q${-cintura} ${n(l*.83)} ${-cintura} ${n(l*.63)}Q${-hombro+1} 7 ${-hombro} 2Q${-hombro} -2 -3.3 -3Z"/>
 <circle cx="0" cy="-13.5" r="5.5"/>
 ${mujer?'<path d="M-4 -16Q-9 -18 -10 -13Q-10 -10 -13 -9Q-7 -8 -6 -12Q-6 -15 -3 -14Z"/>':''}</g>`;
 const piernas=p.p.map((ps,i)=>`<g${''}>${cadena(ps,[4.7*factor,3.1*factor,1.8])}${p.sentado?'':pie(ps[2],p.pies[i])}</g>`).join('');
 const brazos=p.b.map((ps,i)=>`<g${''}>${cadena(ps,[3.4*factor,2.3*factor,1.45])}<ellipse cx="${ps[2][0]}" cy="${ps[2][1]}" rx="2.1" ry="2.8"/></g>`).join('');
 return `<svg class="actividad-silueta" viewBox="0 0 96 96" role="img" aria-label="${mujer?'Figura femenina':'Figura masculina'}"><g fill="currentColor">${equipo(id)}${piernas}${torso}${brazos}</g></svg>`;
}
