import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Definir la clave de respuestas correctas (String de 50 caracteres)
// IMPORTANTE: Reemplaza esta cadena con las respuestas correctas reales de tu prueba
const CLAVE_RESPUESTAS = "ABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDABCDAB"; 

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
      const respuestas = data.sesion_1; // Leemos solo sesion_1, ignoramos sesion_2

      // Validar que la sesión 1 exista y tenga exactamente 50 caracteres
      if (!respuestas || respuestas.length !== 50) {
          console.warn(`El documento ${doc.id} no tiene una sesion_1 válida.`);
          return;
      }

      // Inicializar puntajes por área
      let matematicas = 0;
      let lecturaCritica = 0;
      let cienciasNaturales = 0;
      let cienciasSociales = 0;
      let ingles = 0;

      // 3. Cálculo Ponderado Lineal (10 puntos por acierto)
      for (let i = 0; i < 50; i++) {
        const esCorrecta = respuestas[i].toUpperCase() === CLAVE_RESPUESTAS[i].toUpperCase();
        
        if (esCorrecta) {
          // Bloque 1: Matemáticas (0 - 9)
          if (i >= 0 && i < 10) matematicas += 10;
          // Bloque 2: Lectura Crítica (10 - 19)
          else if (i >= 10 && i < 20) lecturaCritica += 10;
          // Bloque 3: Ciencias Naturales (20 - 29)
          else if (i >= 20 && i < 30) cienciasNaturales += 10;
          // Bloque 4: Ciencias Sociales (30 - 39)
          else if (i >= 30 && i < 40) cienciasSociales += 10;
          // Bloque 5: Inglés (40 - 49)
          else if (i >= 40 && i < 50) ingles += 10;
        }
      }

      // Calcular el Puntaje Global (Suma de las 5 áreas, Máx: 500)
      const global = matematicas + lecturaCritica + cienciasNaturales + cienciasSociales + ingles;

      // Añadir al arreglo temporal
      estudiantes.push({
        id: doc.id,
        nombre: data.nombre || "Estudiante", // Asume que guardas el nombre, ajústalo según tu BD
        puntajes: {
          Lectura: lecturaCritica,
          Matematicas: matematicas,
          Ciencias: cienciasNaturales,
          Sociales: cienciasSociales,
          Ingles: ingles
        },
        global: global
      });
    });

    // 4. Lógica de Ranking y Desempate
    estudiantes.sort((a, b) => {
      // Prioridad 0: Puntaje Global de mayor a menor
      if (b.global !== a.global) {
          return b.global - a.global;
      }
      
      // CRÍTICO - Prioridad 1: Lectura Crítica
      if (b.puntajes.Lectura !== a.puntajes.Lectura) {
          return b.puntajes.Lectura - a.puntajes.Lectura;
      }
      
      // CRÍTICO - Prioridad 2: Matemáticas
      if (b.puntajes.Matematicas !== a.puntajes.Matematicas) {
          return b.puntajes.Matematicas - a.puntajes.Matematicas;
      }
      
      // CRÍTICO - Prioridad 3: Ciencias Naturales
      if (b.puntajes.Ciencias !== a.puntajes.Ciencias) {
          return b.puntajes.Ciencias - a.puntajes.Ciencias;
      }
      
      // CRÍTICO - Prioridad 4: Ciencias Sociales
      if (b.puntajes.Sociales !== a.puntajes.Sociales) {
          return b.puntajes.Sociales - a.puntajes.Sociales;
      }
      
      // CRÍTICO - Prioridad 5: Inglés
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