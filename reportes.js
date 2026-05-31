import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const CLAVE_RESPUESTAS = "CCABDCDCCCBBABCCBDCCADACAADCCDBCCBDADBACCDAABBC";

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

export const generarRankingEstudiantes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "respuestas_brutas"));
    const estudiantes = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const respuestas = (data.sesion_1 || "").replace(/\s+/g, "");

      if (!respuestas || respuestas.length !== 47) {
          console.warn(`Documento ${doc.id} sin sesion_1 válida.`);
          return;
      }

      let puntosObtenidos = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };
      let aciertos = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };
      let pesosDificiles = 0;

      for (let i = 0; i < CLAVE_RESPUESTAS.length; i++) {
        if (respuestas[i].toUpperCase() === CLAVE_RESPUESTAS[i].toUpperCase()) {
          const pesoPregunta = PESOS_PREGUNTAS[i];
          if (i < 10) { puntosObtenidos.mates += pesoPregunta; aciertos.mates++; }
          else if (i < 20) { puntosObtenidos.lc += pesoPregunta; aciertos.lc++; }
          else if (i < 30) { puntosObtenidos.cn += pesoPregunta; aciertos.cn++; }
          else if (i < 40) { puntosObtenidos.cs += pesoPregunta; aciertos.cs++; }
          else if (i < 47) { puntosObtenidos.ing += pesoPregunta; aciertos.ing++; }
          if (pesoPregunta === 3) pesosDificiles++;
        }
      }

      // ✅ Decimal sin redondear — igual que procesador.js
      const puntajes = {
        Matematicas: parseFloat(((puntosObtenidos.mates / MAX_PESOS.mates) * 100).toFixed(2)),
        Lectura:     parseFloat(((puntosObtenidos.lc    / MAX_PESOS.lc)    * 100).toFixed(2)),
        Ciencias:    parseFloat(((puntosObtenidos.cn    / MAX_PESOS.cn)    * 100).toFixed(2)),
        Sociales:    parseFloat(((puntosObtenidos.cs    / MAX_PESOS.cs)    * 100).toFixed(2)),
        Ingles:      parseFloat(((puntosObtenidos.ing   / MAX_PESOS.ing)   * 100).toFixed(2))
      };

      const sumaPonderada = (
          (puntajes.Matematicas * 3) +
          (puntajes.Lectura     * 3) +
          (puntajes.Ciencias    * 3) +
          (puntajes.Sociales    * 3) +
          (puntajes.Ingles      * 1)
      );
      const global = parseFloat(((sumaPonderada / 13) * 5).toFixed(2));

      const totalAciertos = aciertos.mates + aciertos.lc + aciertos.cn + aciertos.cs + aciertos.ing;

      estudiantes.push({
        id: doc.id,
        ti: data.ti || "",           // ✅ guardamos el TI como campo separado
        nombre: data.nombre || "Estudiante",
        grado: data.curso || data.grado || "11",
        puntajes,
        global,
        totalAciertos,
        pesosDificiles
      });
    });

    if (estudiantes.length === 0) return [];

    // ✅ Sort sincronizado con procesador.js
    estudiantes.sort((a, b) => {
      if (b.global !== a.global)                             return b.global - a.global;
      if (b.totalAciertos !== a.totalAciertos)               return b.totalAciertos - a.totalAciertos;
      if (b.pesosDificiles !== a.pesosDificiles)             return b.pesosDificiles - a.pesosDificiles;
      if (b.puntajes.Matematicas !== a.puntajes.Matematicas) return b.puntajes.Matematicas - a.puntajes.Matematicas;
      if (b.puntajes.Lectura !== a.puntajes.Lectura)         return b.puntajes.Lectura - a.puntajes.Lectura;
      if (b.puntajes.Ciencias !== a.puntajes.Ciencias)       return b.puntajes.Ciencias - a.puntajes.Ciencias;
      if (b.puntajes.Sociales !== a.puntajes.Sociales)       return b.puntajes.Sociales - a.puntajes.Sociales;
      if (b.puntajes.Ingles !== a.puntajes.Ingles)           return b.puntajes.Ingles - a.puntajes.Ingles;
      return a.nombre.localeCompare(b.nombre);
    });

    return estudiantes.map((estudiante, index) => ({
      puesto: index + 1,
      ...estudiante
    }));

  } catch (error) {
    console.error("Error al procesar los datos:", error);
    throw error;
  }
};

// ✅ Busca estudiante por TI (campo) en vez de por ID del documento
export const buscarEstudiantePorTI = async (tiIngresado) => {
  try {
    const q = query(
      collection(db, "respuestas_brutas"),
      where("ti", "==", tiIngresado.toString().trim())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Si hay varios con el mismo TI, retorna el primero encontrado
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };

  } catch (error) {
    console.error("Error buscando por TI:", error);
    throw error;
  }
};