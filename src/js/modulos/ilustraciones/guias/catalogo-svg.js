import { POSES, persona, equipo, fondo } from "./persona-svg.js";
import { escapar } from "../../../util.js";
// Cada ficha define postura inicial/final, equipo e indicación propios.
const filas = `
remo-barra|casa,gimnasio|Remo inclinado con barra;Remo con barra;Remo inclinado con barra de 22 kg|bisagra|remo|barra||Lleva la barra hacia la cintura sin levantar el torso ni redondear la espalda.
rumano-barra|casa,gimnasio|Peso muerto rumano con barra;Peso muerto rumano con barra de 22 kg;Peso muerto rumano|pie|bisagra|barra||Desplaza la cadera hacia atrás; barra cerca de las piernas y rodillas ligeramente flexionadas.
muerto-barra|gimnasio|Peso muerto convencional con barra|agachado|pie|barra||Acerca la barra a las piernas y levántate extendiendo cadera y rodillas, sin dar tirones.
sumo-barra|gimnasio|Peso muerto sumo con barra|sentadilla|pie|barra||Pies abiertos y rodillas orientadas hacia los dedos; carga cerca del cuerpo.
remo-mancuernas|casa,gimnasio|Remo inclinado con dos mancuernas|bisagra|remo|mancuernas||Tira con los codos hacia atrás manteniendo el torso quieto.
rumano-mancuernas|casa,gimnasio|Peso muerto con mancuernas;Peso muerto rumano con mancuernas|pie|bisagra|mancuernas||Cadera atrás y mancuernas próximas a las piernas; evita curvar la zona lumbar.
remo-apoyo|casa,gimnasio|Remo unilateral con apoyo;Remo con mancuerna|bisagra|remo|mancuernas|banco|Apoya la mano libre en un banco firme y lleva el codo hacia la cadera.
remo-alto|casa,gimnasio|Remo alto con mancuernas|pie|curl|mancuernas||Eleva los codos solo hasta una altura cómoda, sin encoger hombros ni forzar las muñecas.
remo-polea|gimnasio|Remo sentado en polea;Remo en polea baja|sentado|sentadoRemo|poleaBaja|banco|Tira hacia el abdomen sin balancearte hacia atrás.
jalon|gimnasio|Jalón al pecho;Jalón al pecho con agarre neutro|jalon|jalonBajo|barra|maquina|Baja la barra delante de la cara hacia la parte alta del pecho; nunca detrás del cuello.
dominada|gimnasio|Dominadas;Dominadas asistidas|jalon|jalonBajo|barra|maquina|Desde el apoyo colgado, lleva el pecho hacia la barra sin impulso; usa asistencia si hace falta.
facepull|gimnasio|Face pull|frontal|press|polea||Tira de la cuerda hacia la cara separando los codos y sin arquear la espalda.
press-banca|gimnasio|Press de banca;Press de banca con barra|banco|bancaArriba|barra|banco|Muñecas sobre los codos, pies firmes; empuja hacia arriba sin rebotar en el pecho.
press-banca-db|gimnasio|Press de pecho con mancuernas en banco|banco|bancaArriba|mancuernas|banco|Baja de forma controlada con los codos ligeramente por debajo de los hombros.
press-inclinado|gimnasio|Press inclinado con mancuernas|banco|bancaArriba|mancuernas|banco|Usa un respaldo inclinado unos 30 grados y mantén los pies apoyados.
press-suelo|casa,gimnasio|Press de pecho con mancuernas en el suelo|suelo|sueloArriba|mancuernas|colchoneta|Baja hasta apoyar suavemente los brazos en el suelo y empuja sin golpear los codos.
press-hombro|casa,gimnasio|Press de hombro con mancuernas;Press de hombros|press|arriba|mancuernas||Empuja encima de los hombros sin echar el tronco hacia atrás.
press-sentado|gimnasio|Press de hombros sentado con mancuernas|sentadoPress|sentadoArriba|mancuernas|silla|Espalda apoyada, abdomen firme; termina con las manos sobre los hombros.
press-barra|gimnasio|Press militar;Press militar con barra|press|arriba|barra||Empuja sobre la cabeza sin arquear la espalda; requiere barra y técnica adecuadas.
press-maquina|gimnasio|Press de pecho en máquina|sentadoPress|frontal||maquina|Ajusta el asiento para que los agarres queden a la altura del pecho.
aperturas-banco|gimnasio|Aperturas de pecho con mancuernas|banco|bancaArriba|mancuernas|banco|Abre los brazos con codos suaves y ciérralos en un arco; no bajes más allá del control del hombro.
cruce-poleas|gimnasio|Cruce de poleas para pecho|lateral|frontal|polea||Une las manos delante del pecho manteniendo una ligera flexión en los codos.
elevacion-frontal|casa,gimnasio|Elevación frontal con mancuernas|pie|frontal|mancuernas||Eleva hasta la altura de los hombros sin balancear el tronco.
elevacion-lateral|casa,gimnasio|Elevaciones laterales|pie|lateral|mancuernas||Eleva de lado sin encoger los hombros; elige una carga que puedas controlar.
aperturas-inversas|casa,gimnasio|Aperturas inversas con mancuernas;Pájaros con mancuernas|bisagra|aperturas|mancuernas||Abre los brazos con el torso inclinado y quieto, sin lanzar las mancuernas.
encogimientos|casa,gimnasio|Encogimientos de hombros con mancuernas|pie|gemelo|mancuernas||Eleva y baja solo los hombros; mantén los pies apoyados y no hagas círculos.
curl-db|casa,gimnasio|Curl de bíceps;Curl de bíceps con mancuernas|pie|curl|mancuernas||Flexiona los codos con los brazos pegados al cuerpo, sin impulso del tronco.
curl-martillo|casa,gimnasio|Curl martillo|pie|curl|martillo||Mantén las palmas mirando hacia dentro durante todo el recorrido.
curl-barra|gimnasio|Curl con barra;Curl de bíceps con barra|pie|curl|barra||Codos junto al tronco; evita inclinarte hacia atrás para subir la barra.
curl-concentrado|casa,gimnasio|Curl concentrado sentado|sillon|sentadoRemo|mancuernas|silla|Apoya el codo en la cara interna del muslo y flexiona sin mover el hombro.
triceps-polea|gimnasio|Extensión de tríceps en polea;Tríceps en polea con cuerda|tricepsPolea|tricepsBajo|polea||Extiende los codos manteniéndolos junto al cuerpo; hombros quietos.
triceps-patada|casa,gimnasio|Patada de tríceps con mancuerna|remo|triceps|mancuernas||Mantén el brazo junto al torso y mueve únicamente el antebrazo.
triceps-arriba|casa,gimnasio|Extensión de tríceps sobre la cabeza con mancuerna|arriba|press|goblet||Sujeta la mancuerna con ambas manos; flexiona los codos sin arquear la espalda.
flexion-pared|casa|Flexiones en pared|pared|paredBaja||pared|Cuerpo alineado, manos a la altura del pecho; acerca el pecho a la pared.
flexion-rodillas|casa|Flexiones con rodillas apoyadas|rodillasFlex|flexionBaja||colchoneta|Mantén alineados hombros y cadera, con apoyo en las rodillas.
flexion-inclinada|casa|Flexiones con apoyo elevado;Flexiones inclinadas|pared|paredBaja||banco|Apoya las manos en una superficie fija; baja el pecho entre las manos.
flexion-normal|casa,crossfit|Flexiones;Push-ups|flexion|flexionBaja||colchoneta|Baja el cuerpo en bloque; codos en diagonal, sin hundir la cintura.
flexion-estrecha|casa|Flexiones con manos juntas|flexion|flexionBaja||colchoneta|Manos algo más cerca y codos próximos al cuerpo; usa rodillas si hace falta.
fondos-silla|casa|Fondos de tríceps en silla|sillon|fondos||silla|Usa una silla fija; baja poco y detente si hay molestia en el hombro.
fondos-paralelas|gimnasio|Fondos en paralelas (o en máquina)|sillon|fondos||maquina|Codos hacia atrás; utiliza asistencia y un recorrido cómodo.
sentadilla|casa,crossfit|Sentadilla;Sentadillas;Sentadilla al aire;Air squats;Sentadilla lenta con pausa;Sentadilla rápida;Sentadilla sin salto;Sentadilla con alcance de brazos|pie|sentadilla|||Cadera atrás, rodillas siguen a los pies; baja solo hasta donde controles la espalda.
sentadilla-db|casa,gimnasio|Sentadilla con mancuernas|pie|sentadilla|mancuernas||Mancuernas a los lados; apoya toda la planta del pie y sube sin colapsar las rodillas.
sentadilla-goblet|casa,gimnasio|Sentadilla goblet|press|goblet|goblet||Sujeta el peso junto al pecho y baja entre las piernas con el tronco firme.
sentadilla-silla|casa|Sentadilla a silla|pie|sillon||silla|Toca la silla suavemente sin dejarte caer; vuelve a levantarte con los pies apoyados.
sentadilla-barra|gimnasio|Sentadilla con barra|pie|sentadilla|barra||Barra sobre la parte muscular alta de la espalda; necesita soporte seguro y técnica.
sentadilla-pared|casa|Sentadilla isométrica en pared|pie|sillon||pared|Apoya la espalda en la pared; desliza hasta una altura cómoda y mantén.
sentadilla-sumo|casa,gimnasio|Sentadilla sumo con mancuerna|pie|sentadilla|kettlebell||Pies algo más abiertos y rodillas en dirección a los dedos.
zancada-atras|casa|Zancada atrás;Zancadas hacia atrás;Zancadas alternas|pie|zancada|||Da un paso atrás y baja ambas rodillas; recupera el apoyo inicial con control.
zancada-peso|casa,crossfit|Zancadas con peso;Zancadas caminando con mancuernas|pie|zancada|mancuernas||Paso estable, torso vertical y rodilla delantera siguiendo la dirección del pie.
zancada-estatica|casa|Zancadas estáticas;Sentadilla dividida|pie|zancada|||Mantén los pies en su sitio y flexiona ambas rodillas; puedes apoyarte para equilibrarte.
zancada-lateral|casa|Zancada lateral|pie|patinar|||Da un paso de lado, flexiona esa rodilla y lleva la cadera atrás; vuelve al centro.
bulgara|casa,gimnasio|Sentadilla búlgara|pie|zancada||banco|Pie trasero sobre un banco bajo y firme; baja flexionando la rodilla delantera.
step|casa,cardio,crossfit|Step en escalón;Step-up;Step-ups en banca o grada|pie|rodillaArriba||cajon|Apoya el pie entero en un escalón estable y sube empujando con esa pierna.
puente|casa,pilates|Puente de glúteos;Puente de glúteo;Puente articulado;Puente de hombros|supino|puente||colchoneta|Eleva la cadera hasta alinear hombros, cadera y rodillas; no arquees la espalda.
puente-una|casa|Puente de glúteo a una pierna|supino|puente||colchoneta|Mantén una pierna elevada y sube la pelvis sin girarla; cambia de lado.
hipthrust|gimnasio|Hip thrust;Hip thrust con barra|supino|puente|barra|banco|Apoya la parte alta de la espalda en un banco y protege la cadera del contacto con la barra.
abduccion-banda|casa|Abducción de cadera con banda;Pasos laterales con banda|pie|patinar|banda||Banda por encima de las rodillas; pasos pequeños manteniendo tensión.
gemelos|casa,gimnasio|Elevación de talones;Elevación de talones de pie|pie|gemelo|mancuernas||Eleva talones y baja lentamente; no rebotes.
gemelos-sentado|casa,gimnasio|Elevación de talones sentado|sillon|sillon|mancuernas|silla|Sentado, eleva los talones manteniendo las puntas apoyadas.
prensa|gimnasio|Prensa de piernas|prensaBaja|prensa||maquina|Empuja la plataforma sin bloquear las rodillas ni despegar la pelvis.
extension-cuadriceps|gimnasio|Extensión de cuádriceps|femoral|extension||maquina|Alinea la rodilla con el eje de la máquina y extiende sin dar patadas.
curl-femoral|gimnasio|Curl femoral;Curl femoral sentado|extension|femoral||maquina|Flexiona las rodillas sin mover la pelvis ni dar tirones.
abduccion-maquina|gimnasio|Abducción de cadera en máquina|sillon|zancada||maquina|Abre las rodillas de forma controlada manteniendo la espalda apoyada.
plancha|casa,pilates|Plancha;Plancha frontal;Plancha en antebrazos|plancha|plancha||colchoneta|Codos debajo de hombros; mantén el cuerpo alineado y respira.
plancha-lateral|casa|Plancha lateral|ladoBajo|lateralSuelo||colchoneta|Codo debajo del hombro; eleva la cadera sin girar el tronco.
plancha-rodillas|casa|Plancha lateral con rodillas apoyadas|ladoBajo|lateralSuelo||colchoneta|Apoya las rodillas flexionadas y eleva la cadera manteniendo hombro y pelvis alineados.
plancha-toque|casa,cardio|Plancha con toque de hombros|flexion|escalador||colchoneta|Separa un poco los pies y toca el hombro contrario sin girar la cadera.
deadbug|casa,pilates|Dead bug|mesa|deadbug||colchoneta|Extiende brazo y pierna contrarios sin despegar la zona lumbar.
birddog|casa,pilates|Bird dog;Bird dog (brazo y pierna contrarios)|cuatro|bird||colchoneta|Extiende brazo y pierna contrarios sin girar ni arquear la espalda.
crunch|casa|Crunch abdominal|supino|crunch||colchoneta|Eleva ligeramente los hombros con el abdomen; no tires de la cabeza.
inverso|casa|Crunch inverso|mesa|invertido||colchoneta|Acerca rodillas al pecho elevando suavemente la pelvis, sin impulso.
bicicleta-core|casa|Crunch bicicleta;Criss-cross (oblicuos)|mesa|deadbug||colchoneta|Alterna la rodilla hacia el codo contrario con una rotación pequeña y controlada.
elevacion-piernas|casa|Elevación de piernas acostado|supino|piernas||colchoneta|Baja las piernas solo hasta donde puedas mantener el abdomen y la espalda controlados.
hollow|casa,crossfit|Hollow hold|supino|hollow||colchoneta|Eleva ligeramente brazos y piernas; reduce la palanca si se arquea la espalda.
situp|casa,crossfit|Sit-ups|supino|abdominalSentado||colchoneta|Sube el tronco de manera controlada, sin tirar del cuello ni lanzar los brazos.
superman|casa|Superman|prono|superman||colchoneta|Eleva poco brazos y piernas, evitando forzar la zona lumbar.
patada-gluteo|casa,pilates|Patada de glúteo en cuatro apoyos|cuatro|patada||colchoneta|Eleva el muslo con la rodilla flexionada, sin arquear ni girar la cintura.
clamshell|pilates|Clamshell;Almeja (clamshell)|ladoBajo|almeja||colchoneta|De lado, pies juntos y rodillas flexionadas; abre la rodilla superior sin girar la pelvis.
elevacion-lateral-pierna|pilates|Elevación lateral de pierna;Elevación lateral de pierna acostada|ladoBajo|piernaLateral||colchoneta|Eleva la pierna superior sin inclinar la pelvis hacia atrás.
sidekick|pilates|Side kick|ladoBajo|piernaLateral||colchoneta|Mueve la pierna superior hacia delante y vuelve, con el tronco estable.
hundred|pilates|Hundred modificado;The Hundred (los cien)|supino|hollow||colchoneta|Bombea los brazos suavemente y respira; deja la cabeza apoyada si carga el cuello.
toetaps|pilates|Toe taps|mesa|deadbug||colchoneta|Desde piernas en mesa, toca el suelo con un pie y vuelve sin arquear la espalda.
singleleg|pilates|Single leg stretch;Estiramiento de una pierna|mesa|deadbug||colchoneta|Acerca una rodilla mientras alargas la otra pierna y alterna sin balancearte.
rollup|pilates|Roll up (enrollarse vértebra a vértebra)|supino|sentadoSuelo||colchoneta|Sube progresivamente con control; flexiona rodillas si hace falta y evita el impulso.
rolldown|pilates|Roll down|pie|bisagra|||Flexiona el tronco lentamente desde arriba; recorrido cómodo, sin peso.
spinestretch|pilates|Spine stretch|sentadoSuelo|tocarPies||colchoneta|Sentado con piernas extendidas, alarga la espalda y avanza sin forzar.
swimming|pilates|Swimming de pilates;Natación (swimming)|prono|superman||colchoneta|Eleva poco brazo y pierna contrarios y alterna sin comprimir la zona lumbar.
cisne|pilates|Cisne (extensión de espalda);Cobra suave (extensión torácica)|prono|cobra||colchoneta|Abre el pecho con una extensión pequeña; no empujes hasta molestar la espalda.
basculacion|pilates|Basculación pélvica|supino|supino||colchoneta|Rota suavemente la pelvis al exhalar sin levantar las nalgas del suelo.
respiracion|pilates|Respiración lateral costal|yoga|yoga|||Inhala abriendo las costillas hacia los lados y exhala sin elevar los hombros.
retraccion|pilates|Juntar omóplatos (retracción escapular)|pie|press|||Acerca suavemente los omóplatos sin encoger hombros; no muevas los brazos por encima de la cabeza.
menton|pilates|Mentón hacia atrás (doble mentón)|pie|pie|||Desliza la cabeza unos centímetros hacia atrás, sin mirar al suelo ni levantar la barbilla.
marcha|ruta,cardio|Marcha activa;Marcha en el sitio subiendo rodillas;Rodillas arriba;Rodillas arriba sin salto;Rodillas arriba (skipping rápido)|pie|rodillaArriba|||Alterna elevando las rodillas; mantén una postura erguida y adapta la altura.
caminata|ruta|Caminata suave;Caminata rápida|pie|correr|||Alterna pasos con un pie siempre apoyado; acompaña con los brazos.
trote|ruta|Trote suave;Carrera continua;Intervalos de caminata y trote|pie|correr|||Apoya bajo el cuerpo con pasos cómodos; ajusta el ritmo a tu condición.
subida|ruta|Caminata en subida|pie|rodillaArriba||cajon|Acorta la zancada y evita inclinarte desde la cintura.
jacks|cardio|Jumping jacks|pie|abierto|||Abre y cierra brazos y piernas con aterrizajes suaves.
jackssin|cardio|Jumping jacks sin salto|pie|lateral|||Abre una pierna cada vez mientras elevas los brazos; sin saltar.
pasolateral|cardio|Paso lateral con brazos;Paso lateral con brazos (step touch)|pie|patinar|||Da un paso lateral y junta el otro pie mientras acompañas con los brazos.
boxeo|cardio|Boxeo de sombra|press|frontal|||Alterna golpes sin bloquear los codos; muñecas rectas y sin mancuernas.
talones|cardio|Talones al glúteo;Talones al glúteo sin salto|pie|talon|||Alterna acercando el talón al glúteo sin arquear la espalda.
escaladores|cardio,crossfit|Escaladores;Escaladores (mountain climbers);Mountain climbers|flexion|escalador||colchoneta|Desde apoyo de manos, acerca una rodilla y alterna manteniendo la cadera estable.
burpee|cardio,crossfit|Burpee sin salto;Burpees|pie|flexion||colchoneta|Flexiona, apoya manos y lleva los pies atrás; vuelve de uno en uno si necesitas menos impacto.
cuerda|cardio,crossfit|Salto de cuerda;Saltos de cuerda (o simulados)|pie|gemelo|cuerda||Saltos bajos con rodillas suaves; gira la cuerda desde las muñecas.
patinador|cardio|Patinador lateral sin salto|pie|patinar|||Desplázate de lado llevando la pierna libre detrás; mantén el equilibrio.
sentadilla-salto|cardio|Sentadilla con salto|sentadilla|pie|||Salta poco y aterriza suave; usa sentadilla normal si no controlas el impacto.
rodilla-codo|cardio|Rodilla al codo contrario de pie|pie|rodillaArriba|||Acerca rodilla y codo contrarios sin tirar del cuello.
farmer|crossfit,casa|Farmer carry;Paseo del granjero con mancuernas|pie|correr|mancuernas||Camina erguido con las cargas a los lados, sin inclinarte ni encoger los hombros.
kettlebell-muerto|crossfit|Peso muerto con kettlebell|agachado|pie|kettlebell||Peso entre los pies; empuja el suelo manteniendo la espalda neutra.
swing|crossfit|Kettlebell swings (o con mancuerna);Swing con kettlebell|bisagra|swing|kettlebell||Impulsa desde la cadera, no desde los brazos; aprende la bisagra antes de añadir velocidad.
thruster|crossfit|Thruster con mancuernas;Thrusters con mancuernas|goblet|arriba|mancuernas||Desde sentadilla, extiende piernas y luego empuja; requiere control de ambos movimientos.
pushpress|crossfit|Push press con mancuernas|press|arriba|mancuernas||Usa una pequeña flexión de rodillas y después extiende piernas y brazos.
wallball|crossfit|Wall ball;Wall balls (o sentadilla con lanzamiento)|goblet|arriba|balon|pared|Desde sentadilla, extiende piernas y lanza el balón a una zona segura de pared.
renegado|crossfit|Remo renegado|flexion|escalador|mancuernas|colchoneta|En apoyo sobre mancuernas estables, eleva una sin girar la cadera; necesita una base segura.
boxjump|crossfit|Box jumps (o step-ups rápidos)|sentadilla|rodillaArriba||cajon|Usa una plataforma estable; empieza subiendo de un pie en vez de saltar.
ergometro|crossfit|Remo ergómetro|sentado|sentadoRemo|poleaBaja|maquina|Empuja con piernas, abre cadera y termina tirando de brazos; vuelve en orden inverso.
batalla|crossfit|Cuerda de batalla|press|tricepsBajo|cuerda||Alterna brazos creando ondas con rodillas suaves; no tires con la espalda.
banda-remo|casa|Remo con banda elástica|frontal|sentadoRemo|banda||Fija la banda de forma segura y lleva los codos hacia atrás.
banda-press|casa|Press de pecho con banda|press|frontal|banda||Ancla detrás a la altura del pecho y empuja sin arquear el tronco.
banda-pullapart|casa|Aperturas de banda frente al pecho|frontal|lateral|banda||Separa las manos a la altura del pecho, con hombros bajos.
banda-curl|casa|Curl de bíceps con banda|pie|curl|banda||Pisa la banda firmemente y flexiona los codos sin balancearte.
banda-lateral|casa|Elevación lateral con banda|pie|lateral|banda||Pisa la banda y eleva los brazos de lado con control.
step-db|casa,gimnasio|Subida al escalón con mancuernas|pie|rodillaArriba|mancuernas|cajon|Usa un escalón firme y apoya el pie entero antes de subir con las mancuernas a los lados.
banda-triceps|casa|Extensión de tríceps con banda|tricepsPolea|tricepsBajo|banda||Sujeta la banda con un anclaje seguro y extiende los codos junto al cuerpo.
banda-gluteo|casa|Patada de glúteo con banda|cuatro|patada|banda|colchoneta|Mantén el abdomen firme y mueve la cadera sin arquear la espalda.
mov-hombro|movilidad|Círculos de hombros adelante y atrás|pie|press|||Dibuja círculos pequeños con los hombros, sin forzar.
mov-cadera|movilidad|Círculos de cadera|pie|patinar|||Manos en caderas y círculos cómodos con la pelvis; rodillas suaves.
mov-tobillo|movilidad|Círculos de tobillos|pie|gemelo|||Con apoyo firme, libera un pie y gira el tobillo despacio.
balanceo|movilidad|Balanceo de pierna adelante/atrás|pie|rodillaArriba|||Sujétate y balancea una pierna con amplitud cómoda, sin mover el tronco.
balanceo-lateral|movilidad|Balanceo de pierna lateral|pie|equilibrio|||Con apoyo firme, mueve una pierna de lado sin girar la pelvis.
gato|movilidad,pilates|Gato y vaca;Gato–vaca|gato|vaca||colchoneta|Alterna redondear y alargar suavemente la espalda mientras respiras.
rotacion|movilidad|Rotación torácica;Rotación torácica de lado|ladoBajo|rotacion||colchoneta|Abre el brazo superior girando el pecho; mantén las rodillas juntas.
pectoral|movilidad,pilates|Estiramiento de pectoral;Estiramiento de pecho en el marco de una puerta|pie|puerta||pared|Apoya antebrazo en el marco y gira el pecho suavemente, sin dolor.
flexores|movilidad|Estiramiento de flexores de cadera;Flexores de cadera|pie|estocada||colchoneta|Una rodilla apoyada; lleva la pelvis un poco hacia delante sin arquear la cintura.
figura4|movilidad|Glúteo en figura 4;Glúteo (figura 4)|supino|figura4||colchoneta|Tobillo sobre el muslo contrario; acerca el muslo de apoyo al pecho sin empujar la rodilla.
nino|movilidad|Postura del niño|cuatro|nino||colchoneta|Lleva la cadera hacia los talones y alarga los brazos con comodidad.
gemelo-est|movilidad|Pantorrillas|pie|zancada||pared|Pierna posterior estirada y talón apoyado; inclínate suavemente hacia delante.
cuadriceps-est|movilidad|Cuádriceps|pie|talon|||Sujeta el pie detrás con apoyo para equilibrarte; rodillas próximas, sin arquear la cintura.
isquios-est|movilidad|Isquiotibiales|sentadoSuelo|tocarPies||colchoneta|Inclina desde la cadera con espalda larga; no fuerces el alcance.
espalda-baja|movilidad|Espalda baja|supino|invertido||colchoneta|Acerca ambas rodillas al pecho y respira sin tirar con fuerza.
angeles|movilidad,pilates|Ángeles en la pared|press|arriba||pared|Desliza los brazos por la pared sin arquear la espalda ni forzar hombros.
movilidad-suave|deportes,movilidad|Movilidad suave|pie|lateral|||Movimientos lentos dentro de un recorrido cómodo, sin forzar articulaciones.
bici|ciclismo|Pedaleo suave;Pedaleo continuo;Pedaleo de recuperación;Cadencia controlada;Técnica de pedaleo|bici|bici||bici|Pedalea con cadera estable y rodillas alineadas; casco en exteriores.
bici-estatica|ciclismo|Bicicleta estática|bici|bici||bici|Ajusta el sillín para dejar la rodilla ligeramente flexionada al bajar el pedal.
nado-libre|natacion|Nado libre;Nado suave|nadar|nadar||agua|Alterna brazos y respira de lado; practica en una piscina supervisada.
nado-pecho|natacion|Nado pecho|pecho|pecho||agua|Coordina apertura de brazos, respiración y patada; evita levantar excesivamente el cuello.
nado-espalda|natacion|Nado espalda|nadar|nadar||agua|Boca arriba, alterna brazos y mantén la cabeza tranquila; práctica supervisada.
nado-tabla|natacion|Patada con tabla|nadar|nadar|tabla|agua|Sujeta una tabla de flotación y practica patadas pequeñas con supervisión.
nado-deslizamiento|natacion|Deslizamiento en piscina|nadar|nadar||agua|Brazos extendidos y cuerpo alineado; nunca practiques apnea prolongada a solas.
nado-respiracion|natacion|Técnica de respiración en piscina|pie|bisagra||agua|Con apoyo en el borde, exhala dentro del agua y toma aire fuera, sin hiperventilar.
futbol|deportes|Conducción de balón;Pases de fútbol|pie|rodillaArriba|balon||Toques suaves con el pie, cabeza levantada y control del equilibrio.
basket|deportes|Lanzamientos de baloncesto|press|arriba|balon||Flexiona un poco las piernas y acompaña el balón extendiendo los brazos.
tenis|deportes|Desplazamientos de tenis|pie|patinar|||Pasos laterales cortos en posición preparada; evita cruzar los pies al ajustar la posición.
voley|deportes|Recepción de voleibol|sentadilla|frontal|balon||Rodillas flexionadas, antebrazos juntos y recepción con las piernas, sin golpear con los brazos.
coordinacion|deportes|Coordinación de pies|pie|rodillaArriba|||Alterna apoyos cortos y controlados; aumenta el ritmo solo cuando domines el patrón.
tecnica|deportes|Práctica de técnica deportiva|pie|frontal|||Este nombre es general: elige un ejercicio específico de tu deporte para una guía precisa.
`;
const normalizar = (n) =>
  String(n || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
export const GUIAS_VECTOR = filas
  .trim()
  .split("\n")
  .map((f) => {
    const [id, grupos, nombres, inicio, fin, carga, escena, nota] =
      f.split("|");
    return {
      id,
      categorias: grupos.split(","),
      nombres: nombres.split(";"),
      inicio,
      fin,
      carga,
      escena,
      nota,
    };
  });
const indice = new Map(
  GUIAS_VECTOR.flatMap((g) => g.nombres.map((n) => [normalizar(n), g])),
);
export const guiaVector = (n) => indice.get(normalizar(n)) || null;
export function dibujoGuia(nombre) {
  const g = guiaVector(nombre);
  if (!g) return "";
  const A = poseGuia(g, 0),
    B = poseGuia(g, 1);
  if (!A || !B) return "";
  return `<svg class="reloj-figura ilustracion-persona guia-vector" data-guia-id="${g.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" role="img" aria-label="${escapar(nombre)}: inicio y movimiento"><title>${escapar(nombre)}: inicio y movimiento</title><rect width="600" height="320" fill="white"/><g transform="translate(12,15)">${fondoGuia(g)}${persona(A)}${cargaGuia(g, A, 0)}</g><g transform="translate(330,15)">${fondoGuia(g)}${persona(B)}${cargaGuia(g, B, 1)}</g><path d="M282,148H316m-8,-8 8,8-8,8" fill="none" stroke="#a14b4d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><g fill="#363b40" font-family="Arial,sans-serif" font-size="13" text-anchor="middle"><text x="138" y="308">Inicio</text><text x="455" y="308">${g.inicio === g.fin ? "Mantén / alterna" : "Movimiento"}</text></g></svg>`;
}

function poseGuia(g, f) {
  const p = structuredClone(POSES[f ? g.fin : g.inicio]);
  if (!p) return null;
  if (g.id === "press-inclinado") {
    const a = (25 * Math.PI) / 180,
      rot = ([x, y]) => [
        p.h[0] + (x - p.h[0]) * Math.cos(a) - (y - p.h[1]) * Math.sin(a),
        p.h[1] + (x - p.h[0]) * Math.sin(a) + (y - p.h[1]) * Math.cos(a),
      ];
    p.s = rot(p.s);
    p.e = [...rot(p.e.slice(0, 2)), ...rot(p.e.slice(2))];
    p.w = [...rot(p.w.slice(0, 2)), ...rot(p.w.slice(2))];
  }
  if (g.id === "sentadilla-barra") {
    p.e = [p.s[0] - 38, p.s[1] + 18, p.s[0] + 38, p.s[1] + 18];
    p.w = [p.s[0] - 35, p.s[1] - 5, p.s[0] + 35, p.s[1] - 5];
  }
  if (g.id === "encogimientos") {
    Object.assign(p, structuredClone(POSES.pie));
    if (f) {
      p.s[1] -= 9;
      p.e[1] -= 6;
      p.e[3] -= 6;
      p.w[1] -= 6;
      p.w[3] -= 6;
    }
  }
  if (g.id === "aperturas-banco" && !f) {
    p.e = [42, 176, 120, 176];
    p.w = [8, 176, 158, 176];
  }
  if (g.id === "hipthrust") {
    p.s = [70, 196];
    p.h = f ? [142, 186] : [142, 233];
    p.k = [183, 204, 194, 210];
    p.a = [189, 254, 209, 254];
    p.e = [102, 216, 113, 215];
    p.w = [p.h[0] - 10, p.h[1] - 5, p.h[0] + 10, p.h[1] - 5];
  }
  if (g.id === "puente-una") {
    p.k[2] = 164;
    p.k[3] = p.h[1] - 34;
    p.a[2] = 196;
    p.a[3] = p.h[1] - 65;
  }
  if (g.id === "sentadilla-goblet" && !f) {
    p.e = [100, 135, 150, 135];
    p.w = [113, 115, 137, 115];
  }
  if (g.id === "remo-apoyo") {
    p.e[2] = 187;
    p.e[3] = 179;
    p.w[2] = 190;
    p.w[3] = 196;
  }
  if (g.id === "flexion-rodillas") {
    p.k = [181, 248, 191, 248];
    p.a = [218, 212, 229, 214];
    if (f) {
      p.s = [78, 208];
      p.h = [139, 225];
    }
  }
  if (g.id === "curl-concentrado") {
    p.s = [130, 132];
    p.h = [106, 190];
    p.e = [157, 187, 91, 177];
    p.w = f ? [155, 145, 90, 202] : [188, 228, 90, 202];
    p.k = [160, 204, 85, 207];
    p.a = [172, 254, 68, 254];
  }
  if (g.id === "fondos-paralelas") {
    p.s = [125, f ? 137 : 97];
    p.h = [125, f ? 211 : 174];
    p.e = [90, f ? 160 : 143, 160, f ? 160 : 143];
    p.w = [90, 186, 160, 186];
    p.k = [151, f ? 231 : 214, 160, f ? 231 : 214];
    p.a = [180, f ? 210 : 242, 191, f ? 210 : 242];
  }
  if (g.id === "step" || g.id === "step-db") {
    if (f) {
      p.s = [179, 40];
      p.h = [179, 119];
      p.k = [170, 164, 215, 133];
      p.a = [170, 206, 230, 170];
      p.e = [153, 85, 203, 85];
      p.w = [160, 129, 208, 129];
    } else {
      p.k = [108, 208, 174, 165];
      p.a = [106, 254, 179, 206];
    }
  }
  if (g.id === "bulgara") {
    p.a[2] = 55;
    p.a[3] = 205;
  }
  if (g.id === "sentadilla-pared" && f) {
    p.s = [221, 111];
    p.h = [220, 183];
    p.e = [185, 139, 191, 146];
    p.w = [165, 128, 174, 135];
    p.k = [158, 192, 173, 198];
    p.a = [155, 254, 180, 254];
  }
  if (g.id === "zancada-lateral" && f) {
    p.s = [121, 113];
    p.h = [117, 183];
    p.e = [105, 147, 139, 147];
    p.w = [113, 130, 132, 130];
    p.k = [92, 203, 170, 219];
    p.a = [67, 254, 221, 254];
  }
  if (g.id === "abduccion-banda" && f) {
    p.a[3] = 254;
  }
  if (g.id === "sentadilla-salto" && f) {
    for (const k of ["s", "h", "e", "w", "k", "a"])
      p[k] = p[k].map((v, i) => (i % 2 ? v - 24 : v));
  }
  if (g.id === "gemelos-sentado") {
    p.s = [103, 108];
    p.h = [104, 183];
    p.e = [130, 151, 141, 156];
    p.w = [151, 186, 167, 190];
    p.k = [166, 190, 177, 195];
    p.a = f ? [182, 236, 202, 244] : [182, 254, 202, 261];
  }
  if (g.id === "abduccion-maquina") {
    p.s = [125, 95];
    p.h = [125, 177];
    p.e = [98, 139, 152, 139];
    p.w = [100, 177, 150, 177];
    p.k = f ? [65, 205, 185, 205] : [104, 210, 146, 210];
    p.a = f ? [54, 254, 196, 254] : [103, 254, 147, 254];
  }
  if (g.id === "plancha-rodillas") {
    p.k = [165, 244, 172, 244];
    p.a = [205, 250, 215, 248];
  }
  if (g.id === "plancha-toque" && f) {
    p.k = structuredClone(POSES.flexion.k);
    p.a = structuredClone(POSES.flexion.a);
    p.e = [88, 185, 79, 203];
    p.w = [95, 165, 89, 252];
  }
  if (g.id === "renegado" && f) {
    p.k = structuredClone(POSES.flexion.k);
    p.a = structuredClone(POSES.flexion.a);
    p.e = [124, 147, 79, 203];
    p.w = [116, 178, 89, 252];
  }
  if (g.id === "toetaps") {
    p.e = [91, 245, 99, 242];
    p.w = [122, 251, 130, 247];
    if (f) {
      p.k = [170, 207, 161, 180];
      p.a = [194, 251, 217, 185];
    }
  }
  if (g.id === "singleleg") {
    p.e = [100, 210, 110, 215];
    p.w = [137, 179, 146, 188];
    if (f) {
      p.k = [180, 234, 154, 180];
      p.a = [226, 246, 211, 181];
    }
  }
  if (g.id === "hundred") {
    p.s = f ? [74, 215] : [65, 230];
    p.e = [104, f ? 218 : 232, 112, f ? 225 : 240];
    p.w = [133, f ? 220 : 242, 141, f ? 226 : 247];
    p.k = [150, 180, 161, 180];
    p.a = [204, 180, 217, 185];
  }
  if (g.id === "bicicleta-core") {
    p.s = [84, 211];
    p.e = [90, 185, 94, 198];
    p.w = [59, 189, 64, 194];
    p.k = f ? [180, 234, 137, 174] : [137, 174, 180, 234];
    p.a = f ? [226, 246, 189, 178] : [189, 178, 226, 246];
  }
  if (g.id === "swimming") {
    p.e = f ? [38, 203, 46, 244] : [38, 239, 46, 213];
    p.w = f ? [10, 190, 19, 252] : [10, 244, 19, 205];
    p.k = f ? [188, 244, 198, 220] : [188, 220, 198, 246];
    p.a = f ? [231, 254, 241, 209] : [231, 209, 241, 254];
  }
  if (g.id === "retraccion") {
    Object.assign(p, structuredClone(POSES.pie));
    p.e = [102, 137, 148, 137];
    p.w = [106, 167, 144, 167];
    if (f) {
      p.s = [125, 85];
      p.e = [95, 134, 155, 134];
    }
  }
  if (g.id === "remo-alto" && f) {
    p.e = [83, 109, 167, 109];
    p.w = [108, 130, 142, 130];
  }
  if (g.id === "jackssin" && f) {
    p.e = [84, 57, 166, 57];
    p.w = [65, 23, 185, 23];
    p.k = [108, 208, 170, 208];
    p.a = [106, 254, 190, 254];
  }
  if (g.id === "caminata" && f) {
    p.e = [101, 131, 152, 131];
    p.w = [109, 171, 159, 164];
    p.k = [99, 211, 148, 211];
    p.a = [80, 254, 163, 254];
  }
  if (g.id === "menton" && f) p.s = [120, 88];
  if (g.id === "bici" || g.id === "bici-estatica") {
    if (f) {
      p.k = [115, 223, 158, 177];
      p.a = [152, 245, 136, 221];
    }
  }
  if (g.id === "nado-tabla") {
    p.e = [47, 168, 51, 176];
    p.w = [9, 168, 13, 176];
    p.k = f ? [195, 162, 200, 177] : [195, 177, 200, 162];
    p.a = f ? [238, 150, 242, 186] : [238, 186, 242, 150];
  }
  if (g.id === "nado-deslizamiento") {
    p.e = [45, 165, 49, 174];
    p.w = [8, 165, 13, 174];
    p.k = [195, 171, 200, 178];
    p.a = [238, 171, 242, 178];
  }
  if (g.id === "futbol") {
    p.w = [103, 177, 147, 177];
    if (f) {
      p.k = [147, 204, 112, 210];
      p.a = [190, 232, 110, 254];
    }
  }
  return p;
}
function cargaGuia(g, p, f) {
  if (g.id === "banda-gluteo")
    return `<path d="M${p.k[0] - 8},${p.k[1] - 12}L${p.k[2] + 6},${p.k[3] - 12}" stroke="#a14b4d" stroke-width="6" fill="none"/>`;
  if (g.id === "banda-curl" || g.id === "banda-lateral")
    return `<path d="M${p.w[0]},${p.w[1]}L${p.a[0]},${p.a[1]}L${p.a[2]},${p.a[3]}L${p.w[2]},${p.w[3]}" stroke="#a14b4d" stroke-width="4" fill="none"/>`;
  if (
    g.id === "banda-remo" ||
    g.id === "banda-press" ||
    g.id === "banda-triceps"
  )
    return `<path d="M${p.w[0]},${p.w[1]}L238,${g.id === "banda-triceps" ? 20 : 140}L${p.w[2]},${p.w[3]}" stroke="#a14b4d" stroke-width="4" fill="none"/><path d="M240,15V260" stroke="#aaa" stroke-width="4"/>`;
  if (g.id === "abduccion-banda")
    return `<path d="M${p.k[0]},${p.k[1] - 12}Q125,${p.k[1] + 2} ${p.k[2]},${p.k[3] - 12}" stroke="#a14b4d" stroke-width="6" fill="none"/>`;
  if (g.id === "curl-concentrado")
    return equipo(
      { ...p, w: [p.w[0], p.w[1], p.w[0], p.w[1]] },
      "mancuernas",
      f,
    );
  if (g.id === "remo-apoyo")
    return equipo(
      { ...p, w: [p.w[0], p.w[1], p.w[0], p.w[1]] },
      "mancuernas",
      f,
    );
  if (g.id === "futbol")
    return '<circle cx="210" cy="248" r="15" fill="white" stroke="#555" stroke-width="2"/>';
  if (g.id === "hipthrust")
    return equipo(
      { ...p, w: [p.h[0] - 8, p.h[1], p.h[0] + 8, p.h[1]] },
      "barra",
      f,
    );
  if (g.id === "sentadilla-barra")
    return equipo(
      { ...p, w: [p.s[0] - 35, p.s[1] - 5, p.s[0] + 35, p.s[1] - 5] },
      "barra",
      f,
    );
  if (g.carga === "tabla")
    return `<rect x="0" y="164" width="44" height="15" rx="6" fill="#ddd" stroke="#666" stroke-width="2"/>`;
  return equipo(p, g.carga, f);
}
function fondoGuia(g) {
  if (g.id === "fondos-paralelas")
    return '<path d="M72,186H106M144,186H178M80,186V264M170,186V264" fill="none" stroke="#aaa" stroke-width="5"/>';
  if (g.id === "prensa")
    return '<path d="M25,150L111,230M25,264H240M155,91L239,178" fill="none" stroke="#aaa" stroke-width="5"/>';
  if (g.id === "press-inclinado")
    return '<path d="M32,133L133,193H180M65,158V264M166,193V264" fill="none" stroke="#aeb3b8" stroke-width="4"/>';
  if (g.id === "bulgara")
    return '<path d="M25,210H82M30,210V264M76,210V264" fill="none" stroke="#aeb3b8" stroke-width="4"/>';
  if (g.id === "hipthrust")
    return '<path d="M18,215H85M24,215V264M78,215V264" fill="none" stroke="#aeb3b8" stroke-width="4"/>';
  return fondo(g.escena);
}
