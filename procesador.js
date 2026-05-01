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

        // Aquí quitamos el[cite: 2] que causaba el error
        const snapshot = await db.collection('respuestas_brutas').get();
        
        if (snapshot.empty) {
            console.log("❌ No hay datos para procesar.");
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

        // Ordenar con desempate: Lectura > Matemáticas
        estudiantes.sort((a, b) => {
            if (b.global !== a.global) return b.global - a.global;
            if (b.puntajes.Lectura !== a.puntajes.Lectura) return b.puntajes.Lectura - a.puntajes.Lectura;
            return b.puntajes.Matematicas - a.puntajes.Matematicas;
        });

        // Guardar resultados procesados
        const batch = db.batch();
        estudiantes.forEach((est, index) => {
            const refReporte = db.collection('detalles_reporte').doc(est.id);
            batch.set(refReporte, {
                ...est,
                puesto: index + 1
            });
        });

        await batch.commit();
        console.log(`✅ ¡Hecho! Se procesaron ${estudiantes.length} estudiantes.`);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

procesarRankingTerminal();