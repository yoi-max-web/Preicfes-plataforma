const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Inicialización de Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// 🔥 TU CLAVE OFICIAL AJUSTADA A 47 PREGUNTAS Exactas
const CLAVE_OFICIAL = "CCABDCDCCCBBABCCBDCCADACAADCCDBCCBDADBACCDAABBC"; 

// 📊 CONFIGURACIÓN DE DIFICULTAD POR PREGUNTA (47 en total)
// 1 = Fácil, 2 = Medio, 3 = Difícil. ¡Puedes ajustar estos números a tu gusto!
const PESOS_PREGUNTAS = [
    // Matemáticas (Preguntas 1 a 10)
    1, 2, 3, 1, 2, 1, 3, 2, 1, 2,
    // Lectura Crítica (Preguntas 11 a 20)
    2, 1, 2, 3, 1, 2, 3, 1, 2, 1,
    // Ciencias Naturales (Preguntas 21 a 30)
    1, 3, 2, 1, 2, 3, 1, 2, 1, 2,
    // Sociales y Ciudadanas (Preguntas 31 a 40)
    2, 2, 1, 3, 1, 2, 1, 3, 2, 1,
    // Inglés (Preguntas 41 a 47)
    1, 2, 1, 2, 3, 1, 2
];

// Calcular automáticamente el puntaje máximo posible por materia sumando sus pesos
const MAX_PESOS = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };
for (let i = 0; i < PESOS_PREGUNTAS.length; i++) {
    const peso = PESOS_PREGUNTAS[i];
    if (i < 10) MAX_PESOS.mates += peso;
    else if (i < 20) MAX_PESOS.lc += peso;
    else if (i < 30) MAX_PESOS.cn += peso;
    else if (i < 40) MAX_PESOS.cs += peso;
    else if (i < 47) MAX_PESOS.ing += peso;
}

async function procesarRankingTerminal() {
    try {
        console.log("🚀 Iniciando motor de calificación lineal ponderada por dificultad...");

        const snapshot = await db.collection('respuestas_brutas').get();
        
        if (snapshot.empty) {
            console.log("❌ No hay datos en 'respuestas_brutas' para procesar.");
            return;
        }

        let estudiantesFinales = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const respuestas = (data.sesion_1 || "").replace(/\s+/g, ""); 

            if (respuestas.length === 0) return;

            // Aquí acumulamos los PUNTOS (pesos), no solo la cantidad de aciertos
            let puntosObtenidos = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };

            // Recorrer las 47 preguntas de la clave oficial
            for (let i = 0; i < CLAVE_OFICIAL.length; i++) {
                if (!respuestas[i]) continue;

                if (respuestas[i].toUpperCase() === CLAVE_OFICIAL[i].toUpperCase()) {
                    const pesoPregunta = PESOS_PREGUNTAS[i];

                    if (i < 10) puntosObtenidos.mates += pesoPregunta;         
                    else if (i < 20) puntosObtenidos.lc += pesoPregunta;       
                    else if (i < 30) puntosObtenidos.cn += pesoPregunta;       
                    else if (i < 40) puntosObtenidos.cs += pesoPregunta;       
                    else if (i < 47) puntosObtenidos.ing += pesoPregunta;      
                }
            }

            // Escalar cada materia de 0 a 100 según los pesos obtenidos vs el máximo posible
            const puntajes = {
                Matematicas: Math.round((puntosObtenidos.mates / MAX_PESOS.mates) * 100),
                Lectura: Math.round((puntosObtenidos.lc / MAX_PESOS.lc) * 100),
                Ciencias: Math.round((puntosObtenidos.cn / MAX_PESOS.cn) * 100),
                Sociales: Math.round((puntosObtenidos.cs / MAX_PESOS.cs) * 100),
                Ingles: Math.round((puntosObtenidos.ing / MAX_PESOS.ing) * 100)
            };

            // Calcular el Global Ponderado Oficial del ICFES (Pesos: 3, 3, 3, 3, 1)
            const sumaPonderada = (
                (puntajes.Matematicas * 3) + 
                (puntajes.Lectura * 3) + 
                (puntajes.Ciencias * 3) + 
                (puntajes.Sociales * 3) + 
                (puntajes.Ingles * 1)
            );
            const global = Math.round((sumaPonderada / 13) * 5);

            estudiantesFinales.push({
                id: doc.id,
                nombre: data.nombre || "Estudiante",
                grado: data.curso || data.grado || "11",
                puntajes: puntajes,
                global: global
            });
        });

        if (estudiantesFinales.length === 0) {
            console.log("❌ No se encontraron respuestas válidas para evaluar.");
            return;
        }

        // Ordenar: Global DESC, Lectura DESC, Matemáticas DESC
        estudiantesFinales.sort((a, b) => {
            if (b.global !== a.global) return b.global - a.global;
            if (b.puntajes.Lectura !== a.puntajes.Lectura) return b.puntajes.Lectura - a.puntajes.Lectura;
            return b.puntajes.Matematicas - a.puntajes.Matematicas;
        });

        // Guardado por lotes (Batch) en Firestore
        const batch = db.batch();
        
        estudiantesFinales.forEach((est, index) => {
            const refReporte = db.collection('detalles_reporte').doc(est.id);
            batch.set(refReporte, {
                nombre: est.nombre,
                grado: est.grado,
                puntajes: est.puntajes,
                global: est.global,
                puesto: index + 1
            });

            const refRanking = db.collection('resultados_simulacro').doc(est.id);
            batch.set(refRanking, {
                nombre: est.nombre,
                grado: est.grado,
                puesto: index + 1,
                puntajeGlobal: est.global
            });
        });

        await batch.commit();
        console.log(`✅ ¡Hecho! Se procesaron ${estudiantesFinales.length} estudiantes usando pesos fijos de dificultad.`);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO DURANTE EL PROCESAMIENTO:", error);
    }
}

procesarRankingTerminal();