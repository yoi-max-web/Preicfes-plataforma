import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Clave oficial ajustada a 47 preguntas exactas
const CLAVE_RESPUESTAS = "CCABDCDCCCBBABCCBDCCADACAADCCDBCCBDADBACCDAABBC";

// CONFIGURACIÓN DE DIFICULTAD POR PREGUNTA (47 en total para emparejar con procesador.js)
// 1 = Fácil, 2 = Medio, 3 = Difícil.
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

// Cálculo automático del puntaje máximo acumulable por pesos para cada materia
const MAX_PESOS = { mates: 0, lc: 0, cn: 0, cs: 0, ing: 0 };
for (let i = 0; i < PESOS_PREGUNTAS.length; i++) {
    const peso = PESOS_PREGUNTAS[i];
    if (i < 10) MAX_PESOS.mates += peso;
    else if (i < 20) MAX_PESOS.lc += peso;
    else if (i < 30) MAX_PESOS.cn += peso;
    else if (i < 40) MAX_PESOS.cs += peso;
    else if (i < 47) MAX_PESOS.ing += peso;
}

/**
 * Motor de procesamiento y ranking para el Pre-ICFES Saber 11
 * @returns {Array} Un arreglo de objetos con los estudiantes ordenados por puesto.
 */
export const generarRankingEstudiantes = async () => {
  try {
    // 1. Obtener los documentos de la colección
    const querySnapshot = await getDocs(collection(db, "respuestas_brutas"));
    const estudiantes = [];

    // 2. Procesar cada estudiante
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Leemos sesion_1 y limpiamos espacios en blanco
      const respuestas = (data.sesion_1 || "").replace(/\s+/g, ""); 

      // Validar que la sesión 1 exista y tenga exactamente 47 caracteres
      if (!respuestas || respuestas.length !== 47) {
          console.warn(`El documento ${doc.id} no tiene una sesion_1 válida.`);
          return;
      }

      // Inicializar acumuladores de puntos por dificultad
      let puntosMates = 0;
      let puntosLc = 0;
      let puntosCn = 0;
      let puntosCs = 0;
      let puntosIng = 0;

      // 3. Recorrer las 47 preguntas reales evaluando según el peso asignado
      for (let i = 0; i < CLAVE_RESPUESTAS.length; i++) {
        const esCorrecta = respuestas[i].toUpperCase() === CLAVE_RESPUESTAS[i].toUpperCase();
        
        if (esCorrecta) {
          const pesoPregunta = PESOS_PREGUNTAS[i];

          if (i >= 0 && i < 10) puntosMates += pesoPregunta;
          else if (i >= 10 && i < 20) puntosLc += pesoPregunta;
          else if (i >= 20 && i < 30) puntosCn += pesoPregunta;
          else if (i >= 30 && i < 40) puntosCs += pesoPregunta;
          else if (i >= 40 && i < 47) puntosIng += pesoPregunta; // Acotado rigurosamente a 47
        }
      }

      // Escalar cada materia de 0 a 100 según los pesos acumulados
      const puntajesEscalados = {
        Matematicas: Math.round((puntosMates / MAX_PESOS.mates) * 100),
        Lectura: Math.round((puntosLc / MAX_PESOS.lc) * 100),
        Ciencias: Math.round((puntosCn / MAX_PESOS.cn) * 100),
        Sociales: Math.round((puntosCs / MAX_PESOS.cs) * 100),
        Ingles: Math.round((puntosIng / MAX_PESOS.ing) * 100)
      };

      // Calcular el Puntaje Global Ponderado Oficial del ICFES (Pesos: 3, 3, 3, 3, 1)
      const sumaPonderada = (
          (puntajesEscalados.Matematicas * 3) + 
          (puntajesEscalados.Lectura * 3) + 
          (puntajesEscalados.Ciencias * 3) + 
          (puntajesEscalados.Sociales * 3) + 
          (puntajesEscalados.Ingles * 1)
      );
      const global = Math.round((sumaPonderada / 13) * 5);

      // Añadir al arreglo temporal mapeando las variables de manera idéntica
      estudiantes.push({
        id: doc.id,
        nombre: data.nombre || "Estudiante",
        grado: data.curso || data.grado || "11",
        puntajes: puntajesEscalados,
        global: global
      });
    });

    if (estudiantes.length === 0) {
        return [];
    }

    // 4. Lógica de Ranking y Desempate Cruzado (Global -> Lectura -> Matemáticas -> Ciencias -> Sociales -> Inglés)
    estudiantes.sort((a, b) => {
      if (b.global !== a.global) return b.global - a.global;
      if (b.puntajes.Lectura !== a.puntajes.Lectura) return b.puntajes.Lectura - a.puntajes.Lectura;
      if (b.puntajes.Matematicas !== a.puntajes.Matematicas) return b.puntajes.Matematicas - a.puntajes.Matematicas;
      if (b.puntajes.Ciencias !== a.puntajes.Ciencias) return b.puntajes.Ciencias - a.puntajes.Ciencias;
      if (b.puntajes.Sociales !== a.puntajes.Sociales) return b.puntajes.Sociales - a.puntajes.Sociales;
      return b.puntajes.Ingles - a.puntajes.Ingles;
    });

    // 5. Asignar el Puesto (Posición final) y retornar el arreglo listo para el frontend
    return estudiantes.map((estudiante, index) => ({
      puesto: index + 1,
      ...estudiante
    }));

  } catch (error) {
    console.error("Error al procesar los datos de las respuestas:", error);
    throw error;
  }
};