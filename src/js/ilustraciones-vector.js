// Ilustraciones SVG originales: silueta gris, contorno oscuro y flecha de movimiento.
// Cada pose se dibuja por articulaciones; no contiene recortes ni imágenes raster.
import { escapar } from './util.js';
const P = {
 pie: [[120,36],[120,70],[120,126],[92,78],[82,116],[79,147],[148,78],[158,116],[161,147],[104,132],[99,173],[94,205],[136,132],[141,173],[146,205]],
 jacks: [[120,36],[120,70],[120,126],[92,78],[65,48],[47,20],[148,78],[175,48],[193,20],[104,132],[81,170],[59,205],[136,132],[159,170],[181,205]],
 marcha: [[120,36],[120,70],[120,126],[92,78],[78,109],[101,121],[148,78],[163,107],[146,124],[104,132],[83,151],[110,174],[136,132],[140,174],[143,205]],
 boxeo: [[122,36],[120,70],[115,126],[92,78],[68,94],[91,56],[148,78],[173,69],[202,66],[100,132],[81,169],[66,205],[130,132],[146,168],[163,205]],
 lateral: [[120,36],[120,70],[120,126],[92,78],[66,88],[38,88],[148,78],[174,88],[202,88],[104,132],[82,167],[61,202],[136,132],[143,170],[151,205]],
 sentadilla: [[135,57],[125,88],[96,132],[104,91],[132,91],[164,91],[144,94],[166,95],[189,95],[89,136],[139,155],[126,203],[108,139],[157,159],[150,203]],
 zancada: [[119,36],[118,70],[113,126],[92,78],[83,111],[88,143],[144,78],[154,108],[150,139],[100,132],[64,151],[57,201],[129,132],[159,170],[190,199]],
 remo: [[175,65],[147,86],[103,132],[141,91],[129,125],[135,159],[156,97],[155,131],[162,159],[99,134],[79,173],[72,205],[116,140],[126,173],[135,205]],
 apertura: [[175,65],[147,86],[103,132],[141,91],[112,74],[84,57],[156,97],[182,118],[209,134],[99,134],[79,173],[72,205],[116,140],[126,173],[135,205]],
 curl: [[120,36],[120,70],[120,126],[92,78],[80,115],[95,86],[148,78],[160,115],[145,86],[104,132],[99,173],[94,205],[136,132],[141,173],[146,205]],
 press: [[120,42],[120,76],[120,132],[92,84],[78,54],[80,19],[148,84],[162,54],[160,19],[104,138],[99,176],[94,207],[136,138],[141,176],[146,207]],
 triceps: [[175,65],[147,86],[103,132],[141,91],[116,100],[86,91],[156,97],[139,110],[109,112],[99,134],[79,173],[72,205],[116,140],[126,173],[135,205]],
 plancha: [[48,100],[74,119],[153,151],[71,121],[61,159],[40,185],[79,125],[82,158],[90,185],[151,150],[180,168],[210,185],[158,147],[186,166],[217,185]],
 flexion: [[45,110],[72,128],[148,155],[69,130],[49,154],[70,184],[80,132],[98,157],[90,184],[148,153],[180,170],[210,185],[155,151],[187,169],[218,185]],
 elevado: [[55,68],[81,88],[150,127],[80,91],[64,119],[52,145],[89,95],[87,120],[88,145],[148,127],[179,157],[210,186],[156,127],[187,157],[218,186]],
 escalador: [[45,87],[74,106],[147,140],[71,108],[66,147],[61,185],[82,112],[91,151],[93,185],[144,140],[115,158],[140,185],[153,140],[184,162],[214,185]],
 bird: [[52,94],[79,112],[148,130],[80,115],[49,111],[19,107],[85,120],[91,153],[97,185],[144,132],[153,163],[181,185],[153,128],[182,121],[216,115]],
 suelo: [[43,164],[73,170],[142,174],[73,168],[91,147],[111,125],[82,176],[101,160],[119,145],[143,173],[168,135],[192,174],[147,180],[175,143],[204,180]],
 pecho: [[43,174],[73,174],[142,174],[73,170],[82,134],[83,96],[82,178],[106,139],[107,100],[143,173],[168,135],[192,174],[147,180],[175,143],[204,180]],
 puente: [[43,176],[76,174],[136,133],[75,175],[97,184],[120,186],[83,174],[105,182],[128,185],[136,134],[175,145],[195,186],[140,142],[178,153],[205,186]],
 dead: [[43,177],[73,177],[140,180],[74,173],[83,138],[94,105],[81,180],[61,148],[34,119],[141,177],[158,141],[189,141],[148,184],[182,185],[214,187]],
 crunch: [[52,137],[78,151],[141,178],[80,150],[62,128],[49,130],[86,156],[104,130],[80,124],[142,177],[168,139],[195,181],[149,183],[177,147],[208,185]],
 inverso: [[43,177],[73,177],[140,169],[74,175],[94,184],[117,185],[80,181],[104,188],[129,187],[140,167],[144,128],[178,120],[149,174],[157,133],[191,127]],
 bicicleta: [[48,148],[76,160],[140,180],[77,157],[57,132],[45,133],[86,163],[107,139],[80,135],[140,178],[120,142],[154,139],[147,185],[184,178],[217,180]],
 talon: [[47,150],[77,162],[140,180],[77,164],[102,184],[137,190],[84,170],[111,176],[150,179],[142,178],[168,141],[194,182],[149,185],[176,149],[206,188]],
 lado: [[53,98],[76,122],[141,153],[73,122],[53,157],[74,185],[83,123],[110,89],[135,61],[141,152],[178,168],[211,185],[148,148],[183,164],[218,180]],
 ladoRodillas: [[53,98],[76,122],[141,153],[73,122],[53,157],[74,185],[83,123],[110,89],[135,61],[141,152],[175,180],[147,199],[148,148],[183,177],[156,201]],
 gato: [[52,117],[78,126],[148,119],[79,129],[83,158],[84,188],[87,130],[99,158],[100,188],[145,122],[148,159],[180,188],[153,126],[162,161],[193,188]],
 sentado: [[120,57],[120,91],[120,145],[93,99],[83,132],[108,152],[147,99],[158,132],[135,153],[107,147],[75,173],[111,190],[133,147],[166,173],[130,190]],
 tumbado: [[43,177],[73,177],[140,177],[74,173],[96,183],[121,185],[81,180],[107,189],[132,190],[141,175],[176,177],[213,179],[148,182],[182,185],[219,187]],
 pared: [[120,36],[120,70],[120,126],[92,78],[64,78],[64,39],[148,78],[176,78],[176,39],[104,132],[99,173],[94,205],[136,132],[141,173],[146,205]],
 rotacion: [[46,168],[75,169],[140,171],[75,166],[105,136],[128,104],[81,175],[110,185],[143,187],[140,170],[164,150],[181,185],[147,178],[171,157],[190,190]],
};
function elegir(n) {
 if(/plancha lateral/.test(n))return /rodillas/.test(n)?'ladoRodillas':'lado';
 if(/toque.*hombro/.test(n))return 'escalador';
 if(/flexion/.test(n))return /elevado/.test(n)?'elevado':'flexion';
 if(/escalador/.test(n))return /elevado/.test(n)?'elevado':'escalador';
 if(/burpee/.test(n))return 'flexion';
 if(/plancha/.test(n))return 'plancha';
 if(/press de pecho/.test(n))return 'pecho';
 if(/press de hombro/.test(n))return 'press';
 if(/elevaciones laterales/.test(n))return 'lateral';
 if(/patada.*triceps/.test(n))return 'triceps';
 if(/aperturas inversas/.test(n))return 'apertura';
 if(/remo|peso muerto/.test(n))return 'remo';
 if(/curl/.test(n))return 'curl';
 if(/sentadilla/.test(n))return 'sentadilla';
 if(/zancada/.test(n))return 'zancada';
 if(/puente/.test(n))return 'puente';
 if(/dead bug/.test(n))return 'dead';
 if(/bird dog/.test(n))return 'bird';
 if(/bicicleta/.test(n))return 'bicicleta';
 if(/crunch inverso|elevacion.*pierna/.test(n))return 'inverso';
 if(/crunch/.test(n))return 'crunch';
 if(/toques de talon/.test(n))return 'talon';
 if(/boxeo/.test(n))return 'boxeo';
 if(/jumping/.test(n))return /sin salto/.test(n)?'lateral':'jacks';
 if(/paso lateral/.test(n))return 'lateral';
 if(/marcha|rodillas arriba|rodilla al codo/.test(n))return 'marcha';
 if(/elevacion de talones/.test(n))return 'pie';
 if(/gato/.test(n))return 'gato';
 if(/rotacion toracica/.test(n))return 'rotacion';
 if(/angeles/.test(n))return 'pared';
 if(/cadera sentado/.test(n))return 'sentado';
 if(/respiracion|deslizamientos de talon/.test(n))return 'tumbado';
 if(/tobillos/.test(n))return 'pie';
 return null;
}
export function ilustracionVector(nombre) {
 const n=(nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const tipo=elegir(n);if(!tipo)return '';
 const p=P[tipo],xy=i=>p[i].join(','),linea=ids=>`<polyline points="${ids.map(xy).join(' ')}"/>`;
 const suelo=['plancha','flexion','elevado','escalador','bird','suelo','pecho','puente','dead','crunch','inverso','bicicleta','talon','lado','ladoRodillas','gato','tumbado','rotacion'].includes(tipo);
 const pesas=/mancuerna|curl|press|remo|peso muerto|elevaciones laterales/.test(n);
 const tronco=`M${xy(3)} Q${xy(1)} ${xy(6)} L${xy(12)} Q${p[2][0]},${p[2][1]+8} ${xy(9)} Z`;
 const miembros=[linea([3,4,5]),linea([6,7,8]),linea([9,10,11]),linea([12,13,14])].join('');
 const mancuerna=i=>`<g transform="translate(${p[i][0]},${p[i][1]})"><path d="M-12 0H12" stroke="#30343a" stroke-width="4"/><rect x="-15" y="-8" width="6" height="16" rx="2" fill="#646970"/><rect x="9" y="-8" width="6" height="16" rx="2" fill="#646970"/></g>`;
 return `<svg class="reloj-figura figura-vector" viewBox="0 0 240 225" role="img" aria-label="${escapar(nombre)}"><title>${escapar(nombre)}</title>${suelo?'<path d="M20 207H225" stroke="#c8cbd0" stroke-width="3"/>':''}${tipo==='elevado'?'<path d="M27 146H103V201M32 146V201" fill="none" stroke="#858a91" stroke-width="4"/>':''}<g fill="none" stroke="#30343a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">${miembros}</g><g fill="none" stroke="#e6e7e9" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${miembros}</g><path d="${tronco}" fill="#aeb2b7" stroke="#30343a" stroke-width="2.5"/><path d="M${xy(0)} L${xy(1)}" stroke="#30343a" stroke-width="10"/><ellipse cx="${p[0][0]}" cy="${p[0][1]}" rx="13" ry="16" fill="#f6f6f6" stroke="#30343a" stroke-width="2.5"/>${pesas?mancuerna(5)+mancuerna(8):''}<path d="M200 54Q222 76 203 97M203 97L204 86M203 97L214 94" fill="none" stroke="#a34b4b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
