const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// CONFIGURACIÓN - PEGA TUS CLAVES AQUÍ
const CLAVE_MAESTRA = {
  sesion_1: "ABCDA BCDAB CDABC DABCA BCDAB", // Pon la tuya exacta
  sesion_2: "DDCBA ABCCB DDAAC BBCDA ABADC"  // Pon la tuya exacta
};

const MATERIAS = {
  Matematicas: { sesion: "sesion_1", inicio: 0, fin: 25 },
  Lectura: { sesion: "sesion_1", inicio: 25, fin: 50 },
  Sociales: { sesion: "sesion_1", inicio: 50, fin: 75 },
  Ciencias: { sesion: "sesion_2", inicio: 0, fin: 25 },
  Ingles: { sesion: "sesion_2", inicio: 25, fin: 50 }
};

async function ejecutarGauss() {
  console.log("🚀 Iniciando procesamiento estadístico...");
  // Filtro de seguridad
  const snapshot = await db.collection('respuestas_brutas')
                   .where('procesado', '==', false)
                   .get();
  
  if (snapshot.empty) {
    console.log("❌ No hay datos para procesar.");
    return;
  }

  let estudiantes = [];
  let puntajesBrutos = { Matematicas: [], Lectura: [], Sociales: [], Ciencias: [], Ingles: [] };

  snapshot.forEach(doc => {
    const data = doc.data();
    const s1 = (data.sesion_1 || "").replace(/\s+/g, "");
    const s2 = (data.sesion_2 || "").replace(/\s+/g, "");
    
    let aciertos = {};
    Object.entries(MATERIAS).forEach(([materia, config]) => {
      const respuestas = config.sesion === "sesion_1" ? s1 : s2;
      const clave = (config.sesion === "sesion_1" ? CLAVE_MAESTRA.sesion_1 : CLAVE_MAESTRA.sesion_2).replace(/\s+/g, "");
      
      let correctas = 0;
      for (let i = config.inicio; i < config.fin; i++) {
        if (respuestas[i] && respuestas[i] === clave[i]) correctas++;
      }
      aciertos[materia] = correctas;
      puntajesBrutos[materia].push(correctas);
    });

    estudiantes.push({ id: doc.id, nombre: data.nombre, grado: data.grado, aciertos });
  });

  // ESTADÍSTICA
  const estadisticas = {};
  Object.keys(MATERIAS).forEach(materia => {
    const notas = puntajesBrutos[materia];
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    const stdDev = Math.sqrt(notas.reduce((a, b) => a + Math.pow(b - media, 2), 0) / notas.length) || 1;
    estadisticas[materia] = { media, stdDev };
  });

  // RANKING Y NORMALIZACIÓN
  estudiantes.sort((a, b) => {
    const totalA = Object.values(a.aciertos).reduce((x, y) => x + y, 0);
    const totalB = Object.values(b.aciertos).reduce((x, y) => x + y, 0);

    // Si los aciertos totales son iguales, desempata por Inglés
    if (totalB === totalA) {
      return b.aciertos.Ingles - a.aciertos.Ingles;
    }
    
    return totalB - totalA;
  });

  const batch = db.batch();
  estudiantes.forEach((est, index) => {
    let sumaGlobal = 0;
    let puntajesNormalizados = {};

    // 1. Calcula los puntajes de las materias (se mantienen sobre 100)
    Object.keys(MATERIAS).forEach(materia => {
      const { media, stdDev } = estadisticas[materia];
      const z = (est.aciertos[materia] - media) / stdDev;
      
      // Escala ICFES: Media de 50, Desviación de 15
      const puntajeMateria = Math.round(Math.max(0, Math.min(100, (z * 15) + 50)));
      puntajesNormalizados[materia] = puntajeMateria;
      sumaGlobal += puntajeMateria;
    });

    // 2. CÁLCULO SOBRE 500
    // El puntaje global es la suma de las 5 materias (cada una vale 100)
    const globalSobre500 = Math.round(sumaGlobal);
    const puesto = index + 1;

    batch.set(db.collection('detalles_reporte').doc(est.id), {
      nombre: est.nombre, grado: est.grado, puntajes: puntajesNormalizados, global: globalSobre500, puesto
    });
    batch.set(db.collection('resultados_simulacro').doc(est.id), {
      nombre: est.nombre, grado: est.grado, puntajeGlobal: globalSobre500, puesto
    });

    // Marcar el documento original como procesado
    const respuestasRef = db.collection('respuestas_brutas').doc(est.id);
    batch.update(respuestasRef, { procesado: true });
  });

  await batch.commit();
  console.log("✅ ¡Procesamiento completado con éxito!");
}

ejecutarGauss().catch(console.error);