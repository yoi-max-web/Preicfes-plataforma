const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Inicialización
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Clave de respuestas (Asegúrate de que sean 50)
const CLAVE_OFICIAL = "ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDAB"; 

async function procesarRankingTerminal() {
    try {
        console.log("🚀 Iniciando motor de procesamiento...");

        const snapshot = await db.collection('respuestas_brutas').get();
        
        if (snapshot.empty) {
            console.log("❌ No hay datos en 'respuestas_brutas' para procesar.");
            return;
        }

        let estudiantes = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const respuestas = (data.sesion_1 || "").replace(/\s+/g, ""); 

            if (respuestas.length === 50) {
                let mates = 0, lc = 0, cn = 0, cs = 0, ing = 0;

                for (let i = 0; i < 50; i++) {
                    if (respuestas[i].toUpperCase() === CLAVE_OFICIAL[i].toUpperCase()) {
                        if (i < 10) mates += 10;
                        else if (i < 20) lc += 10;
                        else if (i < 30) cn += 10;
                        else if (i < 40) cs += 10;
                        else if (i < 50) ing += 10;
                    }
                }

                estudiantes.push({
                    id: doc.id,
                    nombre: data.nombre || "Estudiante",
                    grado: data.grado || "11",
                    puntajes: { Matematicas: mates, Lectura: lc, Ciencias: cn, Sociales: cs, Ingles: ing },
                    global: (mates + lc + cn + cs + ing)
                });
            }
        });

        // Ordenar con desempate: Global DESC, Lectura DESC, Matemáticas DESC
        estudiantes.sort((a, b) => {
            if (b.global !== a.global) return b.global - a.global;
            if (b.puntajes.Lectura !== a.puntajes.Lectura) return b.puntajes.Lectura - a.puntajes.Lectura;
            return b.puntajes.Matematicas - a.puntajes.Matematicas;
        });

        // Guardar resultados procesados
        const batch = db.batch();
        
        estudiantes.forEach((est, index) => {
            // 1. Guardar en 'detalles_reporte' para tus futuros PDFs manuales
            const refReporte = db.collection('detalles_reporte').doc(est.id);
            batch.set(refReporte, {
                ...est,
                puesto: index + 1
            });

            // 2. Guardar en 'resultados_simulacro' para el RANKING de la web
            // Usamos 'puntajeGlobal' para que coincida con lo que tu web espera
            const refRanking = db.collection('resultados_simulacro').doc(est.id);
            batch.set(refRanking, {
                nombre: est.nombre,
                grado: est.grado,
                puesto: index + 1,
                puntajeGlobal: est.global
            });
        });

        await batch.commit();
        console.log(`✅ ¡Hecho! Se procesaron ${estudiantes.length} estudiantes.`);
        console.log("👉 Ambas colecciones han sido actualizadas.");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

procesarRankingTerminal();