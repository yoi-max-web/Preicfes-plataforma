import { db } from "./firebase-config.js";
import { doc, getDoc } from "firebase/firestore";

export const descargarReportePDF = async (input_ti, input_grado) => {
  const docRef = doc(db, "detalles_reporte", input_ti);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error("NOT_FOUND");
  
  const data = docSnap.data();
  
  if (data.grado.toUpperCase() !== input_grado.toUpperCase()) throw new Error("MISMATCH");

  document.getElementById("pdf-nombre").innerText = data.nombre;
  document.getElementById("pdf-puesto").innerText = data.puesto;
  document.getElementById("pdf-global").innerText = data.global;
  document.getElementById("pdf-mates").innerText = data.puntajes.Matematicas;
  document.getElementById("pdf-lectura").innerText = data.puntajes.Lectura;
  document.getElementById("pdf-sociales").innerText = data.puntajes.Sociales;
  document.getElementById("pdf-ciencias").innerText = data.puntajes.Ciencias;
  document.getElementById("pdf-ingles").innerText = data.puntajes.Ingles;

  const elementoPdf = document.getElementById("area-reporte");
  elementoPdf.style.display = "block";

  const opciones = {
    margin: 0,
    filename: `Reporte_${data.nombre.replace(/\s+/g, "_")}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  await html2pdf().set(opciones).from(elementoPdf).save();
  
  elementoPdf.style.display = "none";
};
const btnDescargar = document.getElementById("btn-descargar");

btnDescargar.addEventListener("click", async () => {
    btnDescargar.disabled = true;
    btnDescargar.innerText = "Generando...";
    
    await descargarReportePDF(); 
    
    btnDescargar.disabled = false;
    btnDescargar.innerText = "Descargar Reporte";
});