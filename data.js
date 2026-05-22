/*
  Humanidades Quiz - datos editables

  Como añadir una pregunta manual:
  1. Copia un objeto dentro de CONCEPT_QUESTIONS.
  2. Usa un id unico, un tema, el texto de la pregunta, 4 respuestas cortas
     y el indice de la correcta en "correcta" empezando por 0.
  3. Si la pregunta necesita imagen, añade imagen: "nombre-del-archivo.jpg".
     La app buscara ese archivo dentro de la carpeta /img.

  Ejemplo:
  {
    id: "mi-pregunta-1",
    tema: "Arquitectura",
    pregunta: "¿Que elemento sostiene el entablamento clasico?",
    respuestas: ["Columna", "Boveda", "Tambor", "Pinaculo"],
    correcta: 0,
    imagen: "templo.jpg"
  }

  Como añadir una ficha de obra:
  1. Copia un objeto dentro de ARTWORKS.
  2. Completa id, tema, disciplina, imagen, obra, autor, fecha,
     movimiento y notas.
  3. La app generara automaticamente 4 preguntas por ficha:
     autor, titulo de la obra, fecha aproximada y movimiento.
*/

window.HQ_DATA = {
  conceptQuestions: [
    {
      id: "democracia-ateniense-1",
      tema: "Democracia ateniense",
      pregunta: "¿Que institucion reunia a los ciudadanos atenienses para votar leyes y decisiones politicas?",
      respuestas: ["Ekklesia", "Senado", "Areopago", "Gerusia"],
      correcta: 0
    },
    {
      id: "democracia-ateniense-2",
      tema: "Democracia ateniense",
      pregunta: "¿Que procedimiento ateniense podia expulsar temporalmente a un ciudadano considerado peligroso?",
      respuestas: ["Ostracismo", "Clientelismo", "Censo", "Triunfo"],
      correcta: 0
    },
    {
      id: "democracia-ateniense-3",
      tema: "Democracia ateniense",
      pregunta: "¿Quienes quedaban excluidos de la participacion politica plena en Atenas clasica?",
      respuestas: ["Mujeres, metecos y esclavos", "Hoplitias", "Magistrados", "Ciudadanos varones"],
      correcta: 0
    },
    {
      id: "sistemas-politicos-1",
      tema: "Sistemas politicos",
      pregunta: "¿Como se llama el gobierno ejercido por una sola persona con poder hereditario o vitalicio?",
      respuestas: ["Monarquia", "Oligarquia", "Democracia", "Tecnocracia"],
      correcta: 0
    },
    {
      id: "sistemas-politicos-2",
      tema: "Sistemas politicos",
      pregunta: "¿Que sistema concentra el poder en un grupo reducido de personas?",
      respuestas: ["Oligarquia", "Republica", "Federalismo", "Democracia directa"],
      correcta: 0
    },
    {
      id: "sistemas-politicos-3",
      tema: "Sistemas politicos",
      pregunta: "¿Que principio reparte el poder entre ejecutivo, legislativo y judicial?",
      respuestas: ["Separacion de poderes", "Soberania dinastica", "Centralismo fiscal", "Sufragio censitario"],
      correcta: 0
    },
    {
      id: "imperialismo-1",
      tema: "Imperialismo",
      pregunta: "¿Que concepto describe el dominio politico, economico o militar de un territorio por una potencia externa?",
      respuestas: ["Imperialismo", "Autarquia", "Feudalismo", "Municipalismo"],
      correcta: 0
    },
    {
      id: "imperialismo-2",
      tema: "Imperialismo",
      pregunta: "¿Que motivacion economica impulso el imperialismo europeo del siglo XIX?",
      respuestas: ["Materias primas y mercados", "Retirada industrial", "Aislamiento comercial", "Desurbanizacion"],
      correcta: 0
    },
    {
      id: "hegemonia-1",
      tema: "Hegemonia",
      pregunta: "¿Que significa hegemonia en historia politica?",
      respuestas: ["Predominio de un actor", "Ausencia de poder", "Gobierno asambleario", "Equilibrio perfecto"],
      correcta: 0
    },
    {
      id: "hegemonia-2",
      tema: "Hegemonia",
      pregunta: "¿Que polis ejercio una clara hegemonia naval tras las Guerras Medicas?",
      respuestas: ["Atenas", "Esparta", "Corinto", "Tebas"],
      correcta: 0
    },
    {
      id: "arquitectura-1",
      tema: "Arquitectura",
      pregunta: "¿Que orden griego se reconoce por capiteles sencillos y fuste robusto?",
      respuestas: ["Dorico", "Jonico", "Corintio", "Compuesto"],
      correcta: 0
    },
    {
      id: "arquitectura-2",
      tema: "Arquitectura",
      pregunta: "¿Que elemento arquitectonico semicircular permite cubrir espacios mediante compresion?",
      respuestas: ["Arco", "Arquitrabe", "Friso", "Fronton"],
      correcta: 0
    },
    {
      id: "arquitectura-3",
      tema: "Arquitectura",
      pregunta: "¿Como se llama la parte triangular superior de la fachada de un templo clasico?",
      respuestas: ["Fronton", "Abside", "Tambor", "Nave"],
      correcta: 0
    },
    {
      id: "escultura-1",
      tema: "Escultura",
      pregunta: "¿Que recurso clasico desplaza el peso del cuerpo sobre una pierna para crear naturalidad?",
      respuestas: ["Contrapposto", "Tenebrismo", "Perspectiva", "Claroscuro"],
      correcta: 0
    },
    {
      id: "escultura-2",
      tema: "Escultura",
      pregunta: "¿Que material fue muy usado en la escultura griega original, aunque muchas copias sean romanas en marmol?",
      respuestas: ["Bronce", "Adobe", "Hierro colado", "Vidrio"],
      correcta: 0
    },
    {
      id: "pintura-1",
      tema: "Pintura",
      pregunta: "¿Que tecnica crea profundidad mediante lineas que convergen en un punto?",
      respuestas: ["Perspectiva lineal", "Mosaico", "Encaje", "Esgrafiado"],
      correcta: 0
    },
    {
      id: "pintura-2",
      tema: "Pintura",
      pregunta: "¿Que recurso pictorico usa contrastes intensos entre luz y sombra?",
      respuestas: ["Claroscuro", "Isocefalia", "Aparejo", "Canon"],
      correcta: 0
    }
  ],

  artworks: [
    {
      id: "partenon",
      tema: "Arquitectura",
      disciplina: "Arquitectura",
      imagen: "partenon.svg",
      obra: "Partenon",
      autor: "Ictino y Calicrates",
      fecha: "447-432 a. C.",
      movimiento: "Arte griego clasico",
      notas: "Templo dorico dedicado a Atenea en la Acropolis de Atenas."
    },
    {
      id: "discobolo",
      tema: "Escultura",
      disciplina: "Escultura",
      imagen: "discobolo.svg",
      obra: "Discobolo",
      autor: "Miron",
      fecha: "c. 450 a. C.",
      movimiento: "Arte griego clasico",
      notas: "Ejemplo de interes por el movimiento y la anatomia idealizada."
    },
    {
      id: "nacimiento-venus",
      tema: "Pintura",
      disciplina: "Pintura",
      imagen: "nacimiento-venus.svg",
      obra: "El nacimiento de Venus",
      autor: "Sandro Botticelli",
      fecha: "c. 1485",
      movimiento: "Renacimiento",
      notas: "Obra mitologica ligada al humanismo florentino."
    },
    {
      id: "meninas",
      tema: "Pintura",
      disciplina: "Pintura",
      imagen: "meninas.svg",
      obra: "Las meninas",
      autor: "Diego Velazquez",
      fecha: "1656",
      movimiento: "Barroco",
      notas: "Juego complejo de miradas, espacio pictorico y representacion cortesana."
    },
    {
      id: "giralda",
      tema: "Arquitectura",
      disciplina: "Arquitectura",
      imagen: "giralda.svg",
      obra: "La Giralda",
      autor: "Ahmad Ben Baso y Hernan Ruiz el Joven",
      fecha: "1184-1198; remate 1568",
      movimiento: "Almohade y Renacimiento",
      notas: "Antiguo alminar convertido en campanario de la catedral de Sevilla."
    }
  ]
};
