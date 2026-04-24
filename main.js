import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const rankingBody = document.getElementById('ranking-body');

// Función que llena la tabla
onSnapshot(query(collection(db, "resultados_simulacro"), orderBy("puntajeGlobal", "desc"), limit(10)), (snapshot) => {
    rankingBody.innerHTML = ''; // Borra todo antes de pintar lo nuevo
    snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        // Insertamos la fila con los datos reales
        rankingBody.innerHTML += `
            <tr class="border-b border-slate-800 hover:bg-emerald-500/5">
                <td class="p-4">#${index + 1}</td>
                <td class="p-4">${data.nombre}</td>
                <td class="p-4 text-center font-mono text-emerald-400">${data.puntajeGlobal}</td>
                <td class="p-4 text-right">${data.grado || 'N/A'}</td>
            </tr>`;
    });
});

// Lógica de validación
window.validarYDescargar = async function() {
    const inputId = document.getElementById('input-id-modal').value.trim();
    const inputGrado = document.getElementById('input-grado-modal').value.trim();

    // Validación básica de campos vacíos
    if (!inputId || !inputGrado) {
        alert('Por favor, ingresa tu número de documento y grado.');
        return;
    }

    try {
        // Apuntamos directamente al documento usando el ID ingresado
        const docRef = doc(db, "resultados_simulacro", inputId);
        const docSnap = await getDoc(docRef);

        // Verificamos si el documento existe
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Verificamos si el grado coincide (ignora mayúsculas/minúsculas)
            if (data.grado.toUpperCase() === inputGrado.toUpperCase()) {
                alert('¡Validación exitosa!');
                // Guardamos los datos globalmente
                window.usuarioValidado = {
                    id: docSnap.id,
                    ...data
                };
                
                // Aquí puedes agregar la lógica para cerrar el modal o generar el PDF
            } else {
                alert('Datos no encontrados o grado incorrecto');
            }
        } else {
            // El documento con ese ID no existe
            alert('Datos no encontrados o grado incorrecto');
        }
    } catch (error) {
        console.error("Error al obtener el documento:", error);
        alert('Ocurrió un error de conexión al intentar validar.');
    }
};