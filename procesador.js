const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Inicialización
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// 🔥 TU CLAVE OFICIAL AJUSTADA A 47 PREGUNTAS Exactas
// Asegúrate de cambiar estas letras por las respuestas correctas del examen (deben ser 47)
const CLAVE_OFICIAL = "CCABDCDCCCBBABCCBDCCADACAADCCDBCCBDADBACCDAABBC"; 

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
            // Quitamos cualquier espacio extraño
            const respuestas = (data.sesion_1 || "").replace(/\s+/g, ""); 

            // Validamos que el estudiante tenga al menos respuestas para procesar
            if (respuestas.length === 0) return;

            let mates = 0, lc = 0, cn = 0, cs = 0, ing = 0;

            // Recorremos las 47 preguntas de la clave oficial
            for (let i = 0; i < CLAVE_OFICIAL.length; i++) {
                if (!respuestas[i]) continue; // Por si dejó alguna en blanco al final

                if (respuestas[i].toUpperCase() === CLAVE_OFICIAL[i].toUpperCase()) {
                    // Distribución de las 47 preguntas en los 5 componentes del ICFES:
                    // Puedes ajustar estos rangos según cuántas preguntas reales asignaste a cada materia
                    if (i < 10) mates += 10;         // Preguntas 1 a 10
                    else if (i < 20) lc += 10;       // Preguntas 11 a 20
                    else if (i < 30) cn += 10;       // Preguntas 21 a 30
                    else if (i < 40) cs += 10;       // Preguntas 31 a 40
                    else if (i < 47) ing += 10;      // Preguntas 41 a 47 (Últimas 7)
                }
            }

            estudiantes.push({
                id: doc.id,
                nombre: data.nombre || "Estudiante",
                grado: data.curso || data.grado || "11", // Lee el 'curso' unificado (ej: 10C)
                puntajes: { Matematicas: mates, Lectura: lc, Ciencias: cn, Sociales: cs, Ingles: ing },
                global: (mates + lc + cn + cs + ing)
            });
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
            // 1. Guardar en 'detalles_reporte'
            const refReporte = db.collection('detalles_reporte').doc(est.id);
            batch.set(refReporte, {
                ...est,
                puesto: index + 1
            });

            // 2. Guardar en 'resultados_simulacro' para el ranking de la web
            const refRanking = db.collection('resultados_simulacro').doc(est.id);
            batch.set(refRanking, {
                nombre: est.nombre,
                grado: est.grado,
                puesto: index + 1,
                puntajeGlobal: est.global
            });
        });

        await batch.commit();
        console.log(`✅ ¡Hecho! Se procesaron exitosamente los ${estudiantes.length} estudiantes.`);
        console.log("👉 Se actualizaron las colecciones en Firebase.");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

procesarRankingTerminal();