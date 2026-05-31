const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const CLAVE_OFICIAL = "CCABDCDCCCBBABCCBDCCADACAADCCDBCCBDADBACCDAABBC"; 

const PESOS_PREGUNTAS = [
    1, 2, 3, 1, 2, 1, 3, 2, 1, 2,
    2, 1, 2, 3, 1, 2, 3, 1, 2, 1,
    1, 3, 2, 1, 2, 3, 1, 2, 1, 2,
    2, 2, 1, 3, 1, 2, 1, 3, 2, 1,
    1, 2, 1, 2, 3, 1, 2
];

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
        console.log("🚀 Iniciando motor de calificación...");

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

            let puntosObtenidos = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };
            let aciertos = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };

            for (let i = 0; i < CLAVE_OFICIAL.length; i++) {
                if (!respuestas[i]) continue;

                if (respuestas[i].toUpperCase() === CLAVE_OFICIAL[i].toUpperCase()) {
                    const pesoPregunta = PESOS_PREGUNTAS[i];

                    if (i < 10) { puntosObtenidos.mates += pesoPregunta; aciertos.mates++; }
                    else if (i < 20) { puntosObtenidos.lc += pesoPregunta; aciertos.lc++; }
                    else if (i < 30) { puntosObtenidos.cn += pesoPregunta; aciertos.cn++; }
                    else if (i < 40) { puntosObtenidos.cs += pesoPregunta; aciertos.cs++; }
                    else if (i < 47) { puntosObtenidos.ing += pesoPregunta; aciertos.ing++; }
                }
            }

            // Puntaje por materia 0-100
            const puntajes = {
                Matematicas: Math.round((puntosObtenidos.mates / MAX_PESOS.mates) * 100),
                Lectura:     Math.round((puntosObtenidos.lc    / MAX_PESOS.lc)    * 100),
                Ciencias:    Math.round((puntosObtenidos.cn    / MAX_PESOS.cn)    * 100),
                Sociales:    Math.round((puntosObtenidos.cs    / MAX_PESOS.cs)    * 100),
                Ingles:      Math.round((puntosObtenidos.ing   / MAX_PESOS.ing)   * 100)
            };

            // Global ponderado ICFES (pesos 3,3,3,3,1)
            const sumaPonderada = (
                (puntajes.Matematicas * 3) +
                (puntajes.Lectura     * 3) +
                (puntajes.Ciencias    * 3) +
                (puntajes.Sociales    * 3) +
                (puntajes.Ingles      * 1)
            );
            const global = Math.round((sumaPonderada / 13) * 5);

            // ✅ Puntaje RAW decimal para desempate (sin redondear)
            const globalRaw = (
                (puntosObtenidos.mates / MAX_PESOS.mates * 3) +
                (puntosObtenidos.lc    / MAX_PESOS.lc    * 3) +
                (puntosObtenidos.cn    / MAX_PESOS.cn    * 3) +
                (puntosObtenidos.cs    / MAX_PESOS.cs    * 3) +
                (puntosObtenidos.ing   / MAX_PESOS.ing   * 1)
            ) / 13 * 500;

            // ✅ Total de aciertos para desempate secundario
            const totalAciertos = aciertos.mates + aciertos.lc + aciertos.cn + aciertos.cs + aciertos.ing;

            // ✅ Suma de pesos de preguntas difíciles acertadas (desempate terciario)
            let pesosDificiles = 0;
            for (let i = 0; i < CLAVE_OFICIAL.length; i++) {
                if (respuestas[i] && respuestas[i].toUpperCase() === CLAVE_OFICIAL[i].toUpperCase()) {
                    if (PESOS_PREGUNTAS[i] === 3) pesosDificiles++;
                }
            }

            estudiantesFinales.push({
                id: doc.id,
                nombre: data.nombre || "Estudiante",
                grado: data.curso || data.grado || "11",
                puntajes,
                global,
                globalRaw,       // decimal sin redondear
                totalAciertos,   // total de respuestas correctas
                pesosDificiles   // cuántas difíciles acertó
            });
        });

        if (estudiantesFinales.length === 0) {
            console.log("❌ No se encontraron respuestas válidas.");
            return;
        }

        // ✅ Orden con 4 niveles de desempate:
        // 1. Global redondeado DESC
        // 2. GlobalRaw decimal DESC
        // 3. Total aciertos DESC
        // 4. Preguntas difíciles acertadas DESC
        estudiantesFinales.sort((a, b) => {
            if (b.global !== a.global)               return b.global - a.global;
            if (b.globalRaw !== a.globalRaw)         return b.globalRaw - a.globalRaw;
            if (b.totalAciertos !== a.totalAciertos) return b.totalAciertos - a.totalAciertos;
            return b.pesosDificiles - a.pesosDificiles;
        });

        // Guardado en Firestore
        const batch = db.batch();
        
        estudiantesFinales.forEach((est, index) => {
            console.log(`#${index + 1} ${est.nombre} → Global: ${est.global} | Raw: ${est.globalRaw.toFixed(4)} | Aciertos: ${est.totalAciertos} | Difíciles: ${est.pesosDificiles}`);

            // Extraer TI del ID (parte antes del primer "_")
            const tiExtraido = est.id.split('_')[0];

            const refReporte = db.collection('detalles_reporte').doc(est.id);
            batch.set(refReporte, {
                nombre:        est.nombre,
                grado:         est.grado,
                puntajes:      est.puntajes,
                global:        est.global,
                puesto:        index + 1,
                ti:             tiExtraido
            });

            const refRanking = db.collection('resultados_simulacro').doc(est.id);
            batch.set(refRanking, {
                nombre:        est.nombre,
                grado:         est.grado,
                puesto:        index + 1,
                puntajeGlobal: est.global,
                ti:             tiExtraido
            });
        });

        await batch.commit();
        console.log(`\n✅ ¡Hecho! Se procesaron ${estudiantesFinales.length} estudiantes.`);

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    }
}

procesarRankingTerminal();