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
