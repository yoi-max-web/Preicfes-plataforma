import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, onSnapshot, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// =========================================================================
// ESTADO Y CONSTANTES
// =========================================================================
let isInitialAuthCheck = true;

const SECCION_INICIAL = 'inicio';

const sectionTitles = {
    'inicio': 'Inicio',
    'sobre-mi': 'Sobre mí',
    'grabaciones': 'Clases grabadas',
    'material': 'Material de estudio',
    'calculadora': 'Calculadora ICFES'
};

// Un color distinto por materia (se usa en Inicio, Clases grabadas, Material y el temario)
const COLORES_AREA = {
    ingles:      '#7c3aed', // morado
    matematicas: '#dc2626', // rojo
    lectura:     '#ea580c', // naranja
    naturales:   '#15803d', // verde bosque
    sociales:    '#2563eb'  // azul
};

// =========================================================================
// DATOS: CLASES GRABADAS
// =========================================================================
// Lista simple de clases. Para agregar una, copia una línea y pega tu enlace en "url".
//   titulo : nombre de la clase (obligatorio)
//   url    : enlace de la grabación (si queda vacío, la clase no se muestra)
//   area   : (opcional) etiqueta de color: 'lectura' | 'naturales' | 'matematicas' | 'ingles' | 'sociales'
//   desc / desafio : (opcionales) texto corto
const grabaciones = [
    { area: 'lectura',     titulo: 'Resolviendo Preguntitas', desc: 'Estrategias de Lectura.', url: 'https://www.awesomescreenshot.com/video/53388742?key=be7edf0891791da963f51dcbffb6d66b', desafio: 'Pausa el video y responde por ti mismo antes de ver la explicación' },
    { area: 'matematicas', titulo: 'Análisis de Gráficas', desc: 'Variables dependientes e independientes.', url: 'https://www.youtube.com/watch?v=xmpyi87fYAE', desafio: 'DESAFÍO: Encontra un error en la clase. ¿Puedes hallarlo? deja tu cometario' },
    { area: 'matematicas', titulo: 'Clase Teórica', desc: 'Resolviendo preguntitas y repasando ejercicios.', url: 'https://www.awesomescreenshot.com/video/52876365?key=ede01d375bc5abae2b734d2b2f6f4f4c', desafio: 'DESAFÍO: ¿Qué parte te costó más entender? ¡Déjalo en los comentarios y lo revisamos!' },
    { area: 'matematicas', titulo: 'Porcentajes, Regla de tres y Cálculo mental', desc: 'Aprende a calcular porcentajes, usar la regla de tres y resolver operaciones rápidas con cálculo mental.', url: 'https://www.awesomescreenshot.com/video/53111384?key=22292bc93f3a777758bb4de4c67d3a05', desafio: 'DESAFÍO: Calcula mentalmente el 15% de 260 y comparte tu resultado. Revisa si lo hiciste bien.' },
    { area: 'ingles',      titulo: 'Avisos y Señales', desc: 'Interpretación visual.', url: 'https://www.youtube.com/watch?v=o2wPAkryCAM', desafio: 'DESAFÍO: Identifica qué contexto específico representa cada señal. ¿Cuál te parece más confusa? ¡Déjalo en los comentarios!' },
    { area: 'ingles',      titulo: 'Resolviendo Cuadernillo', desc: 'Estrategias de descarte y verbos clave.', url: 'https://www.awesomescreenshot.com/video/52361095?key=e813f9fc168a2343d2ad3dcf8b9725f9', desafio: "DESAFÍO: De los ejemplos del video (como 'Enjoy this with milk'), ¿qué otra palabra clave usarías para identificar un restaurante? ¡Escríbela!" },
    { area: 'ingles',      titulo: 'Relaciona palabras con sus descripciones', desc: 'Actividad para unir vocabulario inglés con su significado.', url: 'https://www.awesomescreenshot.com/video/52894460?key=a6b0c4c8934c5f7420513587b0354b83', desafio: 'DESAFÍO: Practica asociando cada palabra con su definición en tu cuaderno.' },
    { area: 'ingles',      titulo: 'Clase de Inglés 1', url: 'https://drive.google.com/file/d/15d6Lv-gryMrILl9mvySWLn_TY1SCBNQi/view?usp=sharing' },
    { area: 'ingles',      titulo: 'Clase de Inglés 2', url: 'https://drive.google.com/file/d/1c4HabQuTePkYNfNo6fqwzryxL4YsT7yT/view?usp=sharing' },
    { area: 'ingles',      titulo: 'Clase de Inglés 3', url: 'https://drive.google.com/file/d/1dUFSqfOM83EyWwMuWzcgiGax6ZXcRTCj/view?usp=sharing' },
    { area: 'ingles',      titulo: 'Clase de Inglés 4', url: 'https://drive.google.com/file/d/1t_pmv-ayrD3rSnFi-bcDJU6mhzjhoPyN/view?usp=sharing' },
    { area: 'lectura',     titulo: 'Clase de Lectura Crítica 1', url: 'https://drive.google.com/file/d/14ru4VdsKDqiErBlU-mApuC1A0DUyUvOC/view?usp=drive_link' },
    { area: 'lectura',     titulo: 'Clase de Lectura Crítica 2', url: 'https://drive.google.com/file/d/1Jwv4uzoh7HbaWPqmd694_T9B2J9a9W2i/view?usp=drive_link' },
    { area: 'lectura',     titulo: 'Clase de Lectura Crítica 3', url: 'https://drive.google.com/file/d/1UGdnqZo_I1O_iFL76sC0YWF_nGrdKPnf/view?usp=drive_link' },
    { area: 'lectura',     titulo: 'Clase de Lectura Crítica 4', url: 'https://drive.google.com/file/d/1_2ZtejTd02BqIUy6azaFAFE6gBIfyuoG/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 1', url: 'https://drive.google.com/file/d/1ECS0EctNNcc2dGkT0HUw12IaYYSfVfVi/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 2', url: 'https://drive.google.com/file/d/1GyrAEnn8l3HvEcL3FQLrUrroB47O0g11/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 3', url: 'https://drive.google.com/file/d/1KAu8dXsW1T8QRb_39RwCMysqX1oNcn3H/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 4', url: 'https://drive.google.com/file/d/1LGRHn5iBmZzAmi8tUfKjP0sikk0QOwAO/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 5', url: 'https://drive.google.com/file/d/1YVF8ifm3BUNZZA8EvphutMnBPdDWUgfU/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 6', url: 'https://drive.google.com/file/d/1cc7JEDwpNoZ48y6UZ52o5tZlT8JxAYBi/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 7', url: 'https://drive.google.com/file/d/1hIOaybIkx4-WWP5M0CyumwJQQxgGYIbB/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 8', url: 'https://drive.google.com/file/d/1rjW14mPycr63l6AYRgErti09EaCD0Fnl/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 9', url: 'https://drive.google.com/file/d/1smuPLL1lE-MIf6CkwjNadY-OSJbKxD1F/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 10', url: 'https://drive.google.com/file/d/1u40_h7f5ZRq1SSEG4if5hKlHor7ZX-q1/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 11', url: 'https://drive.google.com/file/d/1xpUiVYw_TMngqCqS-95Lmy9GxfoYKhl8/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 1', url: 'https://drive.google.com/file/d/1C86Hcn6GY3wp8vygNsyhN5IrR4uAhhOl/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 2', url: 'https://drive.google.com/file/d/1CaYJoz3YPAib1R5aIkrAXrsXq33fwF92/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 3', url: 'https://drive.google.com/file/d/1DwgMFDPJTM4BRCRfjnggZNAypo1AZWOp/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 4', url: 'https://drive.google.com/file/d/1GfKqv9nDUNeDlNb18Yi3awl-phCNfT86/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 5', url: 'https://drive.google.com/file/d/1OD4Vb0mmtBISwWTf60K_Y7JZOTdopxhn/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 6', url: 'https://drive.google.com/file/d/1R_GYCaDpB_2tSM5abatabp2irpq-q8Wa/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 7', url: 'https://drive.google.com/file/d/1YWPX1uxrCA8YX0F5__kE3mbYUeM8pRR5/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 8', url: 'https://drive.google.com/file/d/1ZXSAF7pbr2_t54-xLxB2ZNachdJebmYd/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 9', url: 'https://drive.google.com/file/d/1f7D7UHINl3luOplk4GpIZbVyC2VUss2N/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 10', url: 'https://drive.google.com/file/d/1fTupIkuT5IOivbMDLMHQre50yrpVdgUJ/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 11', url: 'https://drive.google.com/file/d/1hjb7Ti0VYNvBk2SKzIR-9kZK_X86btBb/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 12', url: 'https://drive.google.com/file/d/1k1yhL8EFyGm3TDniJICkyZHedK7TzvO3/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 13', url: 'https://drive.google.com/file/d/1qF94nIxtjO5Z4KJESoWX90I6y4UNNvyy/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 14', url: 'https://drive.google.com/file/d/1tBIDe1yR67WLu8pi78MjkzRC5tGGkQ6y/view?usp=drive_link' },
    { area: 'sociales',    titulo: 'Clase de Sociales 15', url: 'https://drive.google.com/file/d/1uWGLuCfUvpnmBXbOQuQpz-uwblIdaJRv/view?usp=drive_link' },
    { area: 'lectura', titulo: 'Clase de Lectura Crítica 5', url: 'https://drive.google.com/file/d/1Ude8ffFb0ZSlI1EZPS7JGh_Hb4Sz7nGN/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 1', url: 'https://drive.google.com/file/d/1qYr7Te5vD8XgLVD-9AJb1jqmonD8SrvH/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 2', url: 'https://drive.google.com/file/d/1nqrtaio6NZiDKW3xbG5HFK7tnJgzd8Q2/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 3', url: 'https://drive.google.com/file/d/11gf-xwwlpa99RN2sslDVVg0TCJCUqBuc/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 4', url: 'https://drive.google.com/file/d/1x27Vh7W_oVdhFWgpgzfB3WxlZMk6h9O1/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 5', url: 'https://drive.google.com/file/d/1mAmcCOxLTt64MqCx5kAEBqIyF2wmPimD/view?usp=drive_link' },
    { area: 'matematicas', titulo: 'Clase de Matemáticas 15', url: 'https://drive.google.com/file/d/11nguTWVOQ9w9K7vvkSrQBk6h4Jj9ea5V/view?usp=drive_link' },
    { area: 'ingles', titulo: 'Clase de Inglés 8', url: 'https://drive.google.com/file/d/15uGKjynG-szkVqwdETxMUXnCM_8NHpWY/view?usp=drive_link' },
    { area: 'ingles', titulo: 'Clase de Inglés 9', url: 'https://drive.google.com/file/d/1BDz10uEJC84qiMq_jnN7kJgNKHBUndmj/view?usp=drive_link' },
    { area: 'ingles', titulo: 'Clase de Inglés 10', url: 'https://drive.google.com/file/d/1_GvOSg8fz5W1ziTE5SejkIWsgz5diUQ5/view?usp=drive_link' },
    { area: 'naturales', titulo: 'Clase de Biología 6', url: 'https://youtu.be/8589oN5D4eU' },
    { area: 'naturales', titulo: 'Clase de Biología 7', url: 'https://youtu.be/6Mvaf5vZIbs' },
    { area: 'naturales', titulo: 'Clase de Biología 8', url: 'https://youtu.be/Dh1V43N3U2c' },
    { area: 'naturales', titulo: 'Clase de Biología 9', url: 'https://youtu.be/wvc8lcdk2LM' },
    { area: 'naturales', titulo: 'Clase de Biología 10', url: 'https://youtu.be/xy6m3HaKbDY' },
    { area: 'lectura', titulo: 'Clase de Lectura Crítica 6', url: 'https://youtu.be/0tu7_0V13Sc' },
    { area: 'lectura', titulo: 'Clase de Lectura Crítica 7', url: 'https://youtu.be/shqxDVJbZp0' },
    { area: 'lectura', titulo: 'Clase de Lectura Crítica 8', url: 'https://youtu.be/DXgscumaoRw' },
    { area: 'lectura', titulo: 'Clase de Lectura Crítica 9', url: 'https://youtu.be/EtjMXloli_w' }
];

// =========================================================================
// DATOS: TEMARIO POR ÁREA (Inicio)
// =========================================================================
const temasMateria = {
    'ingles': {
        titulo: 'Inglés',
        icono: 'fa-brain',
        temas: [
            'Avisos y Lugares',
            'Relaciona palabras con sus descripciones',
            'Conversaciones Cortas',
            'Preposiciones (In, On, At)',
            'Relativos (Who, Which, That)',
            'Conectores y Adverbios',
            'Pasado vs. Presente Perfecto',
            'Verbos Modales',
            'Comparativos y Superlativos',
            'Comprensión de Inferencial'
        ]
    },
    'naturales': {
        titulo: 'Ciencias Naturales',
        icono: 'fa-seedling',
        temas: [
            'Método científico e investigación',
            'Mecánica clásica y termodinámica',
            'Estequiometría y enlaces químicos',
            'Genética y evolución',
            'Ecología y medio ambiente'
        ]
    },
    'matematicas': {
        titulo: 'Matemáticas',
        icono: 'fa-superscript',
        temas: [
            'Análisis de Gráficas Y Proporcionalidad',
            'Porcentajes, Regla de tres y Cálculo mental',
            'Despejes Y álgebra Básica',
            'Operaciones con números Reales',
            'Áreas Y Volúmenes',
            'Medidas de Tendencia Central Y dispersión',
            'Triángulos Y teorema de pitágoras',
            'Razones Trigonométricas,Leyes del seno y coseno',
            'Funciones',
            'Probabilidad'
        ]
    },
    'lectura': {
        titulo: 'Lectura Crítica',
        icono: 'fa-book',
        temas: [
            'Identificación de tipologías textuales',
            'Hermenéutica y análisis de argumentos',
            'Coherencia y cohesión local',
            'Figuras literarias',
            'Intención comunicativa del autor'
        ]
    },
    'sociales': {
        titulo: 'Sociales y Ciudadanas',
        icono: 'fa-earth-americas',
        temas: [
            'Constitución Política de Colombia',
            'Derechos fundamentales y deberes',
            'Historia mundial y nacional (S. XX y XXI)',
            'Mecanismos de participación',
            'Geografía económica y política'
        ]
    }
};

// =========================================================================
// DATOS: MATERIAL DE ESTUDIO
// =========================================================================
// Pega tu enlace en "url" de cada línea. Mientras "url" esté vacío, la tarjeta se ve
// atenuada con "Enlace pendiente"; al pegar el link se vuelve clicable.
//   nombre : nombre del archivo (obligatorio)
//   url    : enlace (Drive, PDF, etc.)
//   area   : (opcional) 'lectura' | 'naturales' | 'matematicas' | 'ingles' | 'sociales'
// Número aproximado de preguntas tipo ICFES en toda la plataforma.
// Pon el número aquí (ej. 1500). Si lo dejas en null, el aviso no se muestra.
// Opcional: en cualquier archivo puedes agregar  preguntas: 120  y se mostrará en su tarjeta.
const PREGUNTAS_APROX = null;

const material = [
    { area: 'ingles',      nombre: 'Compilado Inglés 2026', url: 'https://drive.google.com/file/d/1YJIY6k59zXspB-Bmxd1hn5E7uKz23Ze7/view?usp=sharing' },
    { area: 'matematicas', nombre: 'Compilado Matemáticas 2026', url: 'https://drive.google.com/file/d/1QOeX_jAb0sm1xjAhroyiYuMB28IvTD82/view?usp=sharing' },
    { area: 'lectura',     nombre: 'Compilado Lectura Crítica 2026', url: 'https://drive.google.com/file/d/1s2MzldfzN15ggT7HgZbt5q0ZlfgR9BFw/view?usp=sharing' },
    { area: 'naturales',   nombre: 'Compilado Ciencias Naturales 2026', url: 'https://drive.google.com/file/d/1B6df4BWEfHNbVcGReNk6QnvcvRQ0XY3D/view?usp=sharing' },
    { area: 'sociales',    nombre: 'Compilado Sociales y Ciudadanas 2026', url: 'https://drive.google.com/file/d/19U7Cn-Hu9hoELoo_rE8ufQ4l3o2wjDp1/view?usp=sharing' },
    { nombre: 'Compilado Todas las Materias 2026', url: 'https://drive.google.com/file/d/1PCEfkm2xyCF5QTbb0HmbXdY_RBauUYck/view?usp=sharing' },

    // ---- Carpetas de cuadernillos ----
    // Cada carpeta tiene "items". Pega el enlace en url de cada archivo.
    // Para agregar más archivos, copia una línea { nombre: '...', url: '' } dentro de items.
    { carpeta: true, nombre: 'Entrenando Z', color: '#8b5cf6', items: [
        { nombre: 'Z1', url: 'https://drive.google.com/file/d/1u9N6Yqi4msoX-Q9wl7e-EqYEZqBGJsDK/view?usp=drive_link' },
        { nombre: 'Z2', url: 'https://drive.google.com/file/d/1BDlbO1LOhmzVjCVDT9Gjr6_UzGO7M5YH/view?usp=sharing' }
    ] },
    { carpeta: true, nombre: 'Entrenando X', color: '#f59e0b', items: [
        { nombre: 'X1', url: 'https://drive.google.com/file/d/1Ra8Jbsie_sda1YRIbu7aTQCLG8AXqKPh/view?usp=sharing' },
        { nombre: 'X2', url: 'https://drive.google.com/file/d/16ziidkS9eguAzcSiyU_B7OfzbndP1h-a/view?usp=drive_link' }
    ] },
    { carpeta: true, nombre: 'Entrenando Y', color: '#ec4899', items: [
        { nombre: 'Y1', url: 'https://drive.google.com/file/d/17sEtnsCkqpxtHFPjjfSIAXc-jnrWt4Wj/view?usp=sharing' },
        { nombre: 'Y2', url: 'https://drive.google.com/file/d/15iJ8kLusacOeCcFcre2cSlBW3pf5MvD4/view?usp=sharing' }
    ] }
];

// =========================================================================
// MODAL DE TEMARIO (las tarjetas están en index.html)
// =========================================================================
function abrirModalTemas(materiaKey) {
    const data = temasMateria[materiaKey];
    if (!data) return;

    const color = COLORES_AREA[materiaKey];
    const modal = document.getElementById('modal-temas');
    const modalContent = document.getElementById('modal-temas-content');

    document.getElementById('modal-titulo').textContent = data.titulo;
    document.getElementById('modal-icono').className = `fa-solid ${data.icono}`;
    document.getElementById('modal-icon-container').style.setProperty('--c', color);
    modalContent.style.borderColor = color;
    modalContent.style.boxShadow = `0 4px 0 ${color}`;

    document.getElementById('modal-lista-temas').innerHTML = data.temas.map(tema => `
        <li class="bg-bgMain p-3 rounded-xl border-2 border-line flex items-center gap-3">
            <i class="fa-solid fa-check text-sm" style="color:${color}"></i>
            <span class="text-ink text-sm font-bold">${tema}</span>
        </li>
    `).join('');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}

window.abrirModalTemas = abrirModalTemas;

function cerrarModalTemas() {
    const modal = document.getElementById('modal-temas');
    const modalContent = document.getElementById('modal-temas-content');

    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}
window.cerrarModalTemas = cerrarModalTemas;

// =========================================================================
// RENDER: CLASES GRABADAS
// =========================================================================
const NOMBRES_AREA = {
    lectura: 'Lectura crítica',
    naturales: 'Ciencias naturales',
    matematicas: 'Matemáticas',
    ingles: 'Inglés',
    sociales: 'Sociales'
};

// ---- Clases ya vistas (se guardan por usuario en este navegador) ----
let usuarioId = 'anonimo';
let vistas = new Set();            // enlaces de clases que el usuario ya abrió
const vistasEstaSesion = new Set(); // las que abrió desde que cargó la página

const claveVistas = () => `saber11_vistas_${usuarioId}`;

function cargarVistas() {
    try {
        return new Set(JSON.parse(localStorage.getItem(claveVistas()) || '[]'));
    } catch (e) {
        return new Set();
    }
}

function guardarVistas() {
    try {
        localStorage.setItem(claveVistas(), JSON.stringify([...vistas]));
    } catch (e) {
        console.warn('No se pudo guardar el progreso de clases vistas:', e);
    }
}

function htmlBadgeVisto(texto) {
    return `<p class="visto-badge"><i class="fa-solid fa-circle-check"></i> ${texto}</p>`;
}

const HTML_BOTON_VISTO = '<i class="fa-solid fa-rotate-right"></i> Ver de nuevo';

// Marca la tarjeta en el momento del clic (sin volver a dibujar la lista,
// para no interrumpir la apertura de la clase en la otra pestaña)
function marcarVista(enlace) {
    const url = enlace.dataset.url;
    if (!url) return;

    if (!vistas.has(url)) {
        vistas.add(url);
        vistasEstaSesion.add(url);
        guardarVistas();
    }

    const tarjeta = enlace.closest('article');
    if (tarjeta && !tarjeta.classList.contains('is-visto')) {
        tarjeta.classList.add('is-visto');
        tarjeta.firstElementChild?.insertAdjacentHTML('afterend', htmlBadgeVisto('Ya la viste'));
        enlace.innerHTML = HTML_BOTON_VISTO;
    }
}

let filtroGrabaciones = 'todas';
const ORDEN_AREAS = ['ingles', 'matematicas', 'lectura', 'naturales', 'sociales'];

// Botones de filtro: "Todas" + una por cada materia que tenga clases
function renderFiltrosGrabaciones(conEnlace) {
    const cont = document.getElementById('grabaciones-filtros');
    if (!cont) return;

    const conteo = {};
    conEnlace.forEach(i => { if (i.area) conteo[i.area] = (conteo[i.area] || 0) + 1; });
    const areas = ORDEN_AREAS.filter(a => conteo[a]);

    // Si hay una sola materia, un filtro no aporta nada
    if (areas.length < 2) { cont.innerHTML = ''; return; }

    const chip = (key, label, color, total) => `
        <button type="button" data-filtro="${key}" aria-pressed="${filtroGrabaciones === key}"
                class="chip btn-3d btn-3d--outline text-sm ${filtroGrabaciones === key ? 'is-active' : ''}"
                style="--c:${color}">
            ${label} <span class="chip-count">${total}</span>
        </button>`;

    cont.innerHTML =
        chip('todas', 'Todas', '#10b981', conEnlace.length) +
        areas.map(a => chip(a, NOMBRES_AREA[a], COLORES_AREA[a], conteo[a])).join('');
}

function renderGrabaciones() {
    const container = document.getElementById('grabaciones-list');
    if (!container) return;

    const conEnlace = grabaciones.filter(item => tieneEnlace(item.url));

    // Si el filtro elegido ya no tiene clases, volver a "Todas"
    if (filtroGrabaciones !== 'todas' && !conEnlace.some(i => i.area === filtroGrabaciones)) {
        filtroGrabaciones = 'todas';
    }
    renderFiltrosGrabaciones(conEnlace);

    const visibles = filtroGrabaciones === 'todas'
        ? conEnlace
        : conEnlace.filter(i => i.area === filtroGrabaciones);

    if (visibles.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-8 font-bold col-span-full">Aún no hay clases grabadas.</p>`;
        return;
    }

    container.innerHTML = visibles.map(item => {
        const color = COLORES_AREA[item.area] || '#10b981';
        const etiqueta = NOMBRES_AREA[item.area] || 'Clase';

        const url = item.url.trim();
        const visto = vistas.has(url);
        const textoVisto = vistasEstaSesion.has(url) ? 'Ya la viste' : 'Ya la habías visto antes';

        return `
            <article class="lesson-card ${visto ? 'is-visto' : ''}" style="--c:${color}">
                <div class="flex items-center gap-3">
                    <div class="folder-icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-play"></i>
                    </div>
                    <span class="text-sm font-extrabold" style="color:${color}">${etiqueta}</span>
                </div>
                ${visto ? htmlBadgeVisto(textoVisto) : ''}
                <div>
                    <h4 class="text-ink font-extrabold text-base leading-snug">${item.titulo}</h4>
                    ${item.desc ? `<p class="text-muted text-sm mt-1">${item.desc}</p>` : ''}
                </div>
                ${item.desafio ? `<p class="lesson-challenge"><i class="fa-solid fa-bolt mr-1" style="color:${color}"></i>${item.desafio}</p>` : ''}
                <a href="${escapeAttr(url)}" data-url="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="btn-3d btn-3d--block">
                    ${visto ? HTML_BOTON_VISTO : '<i class="fa-solid fa-play"></i> Ver clase'}
                </a>
            </article>
        `;
    }).join('');
}

// =========================================================================
// RENDER: MATERIAL (lista simple; sin enlace = "Enlace pendiente")
// =========================================================================
function escapeAttr(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function tieneEnlace(url) {
    return typeof url === 'string' && url.trim() !== '' && url.trim() !== '#';
}

let rutaCarpetas = []; // camino de índices hasta la carpeta abierta ([] = lista principal)

function tarjetaArchivo(item, colorPadre) {
    const color = item.color || colorPadre || COLORES_AREA[item.area] || '#10b981';
    const etiqueta = NOMBRES_AREA[item.area];

    const interior = `
        <div class="flex items-center gap-4 min-w-0">
            <div class="folder-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0">
                <i class="fa-solid fa-file-lines"></i>
            </div>
            <div class="min-w-0">
                ${etiqueta ? `<p class="text-xs font-extrabold" style="color:${color}">${etiqueta}</p>` : ''}
                <h5 class="text-ink font-extrabold text-sm md:text-base break-words">${item.nombre}</h5>
                ${item.preguntas ? `<p class="text-muted text-xs font-bold">≈ ${item.preguntas} preguntas</p>` : ''}
            </div>
        </div>
    `;

    if (tieneEnlace(item.url)) {
        return `
            <a href="${escapeAttr(item.url.trim())}" target="_blank" rel="noopener noreferrer"
               class="file-card p-4 flex items-center justify-between gap-4 cursor-pointer" style="--c:${color}">
                ${interior}
                <span class="btn-3d btn-3d--round text-sm" aria-hidden="true">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </span>
            </a>
        `;
    }

    return `
        <div class="file-card p-4 flex items-center justify-between gap-4 opacity-60" style="--c:${color}; pointer-events:none">
            ${interior}
            <span class="text-muted text-xs font-bold shrink-0">Enlace pendiente</span>
        </div>
    `;
}

function tarjetaCarpeta(item, idx, colorPadre) {
    const color = item.color || colorPadre || '#10b981';
    const total = item.items.length;
    return `
        <button type="button" data-carpeta="${idx}"
                class="file-card p-4 flex items-center justify-between gap-4 cursor-pointer w-full text-left"
                style="--c:${color}">
            <div class="flex items-center gap-4 min-w-0">
                <div class="folder-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    <i class="fa-solid fa-folder"></i>
                </div>
                <div class="min-w-0">
                    <p class="text-xs font-extrabold" style="color:${color}">Carpeta · ${total} ${total === 1 ? 'archivo' : 'archivos'}</p>
                    <h5 class="text-ink font-extrabold text-sm md:text-base break-words">${item.nombre}</h5>
                </div>
            </div>
            <span class="btn-3d btn-3d--round text-sm" style="--btn-bg:${color}; --btn-shadow:color-mix(in srgb, ${color} 62%, black)" aria-hidden="true">
                <i class="fa-solid fa-chevron-right"></i>
            </span>
        </button>
    `;
}

function renderMaterialStats() {
    const caja = document.getElementById('material-stats');
    const texto = document.getElementById('material-stats-text');
    if (!caja || !texto) return;

    const suma = (lista) => lista.reduce((t, i) => t + (i.carpeta ? suma(i.items) : (Number(i.preguntas) || 0)), 0);
    const total = PREGUNTAS_APROX || suma(material);

    if (!total) { caja.classList.add('hidden'); caja.classList.remove('flex'); return; }
    texto.innerHTML = `<strong>En la plataforma:</strong> hay aproximadamente <strong>${total.toLocaleString('es-CO')}</strong> preguntas tipo ICFES para practicar.`;
    caja.classList.remove('hidden');
    caja.classList.add('flex');
}

function renderMaterial() {
    const container = document.getElementById('material-list');
    if (!container) return;
    renderMaterialStats();

    if (material.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-8 font-bold col-span-full">Aún no hay material disponible.</p>`;
        return;
    }

    // Recorrer la ruta hasta la carpeta abierta (color heredado de la carpeta madre)
    let lista = material;
    let actual = null;
    let color = null;
    for (const i of rutaCarpetas) {
        actual = lista[i];
        if (!actual || !actual.carpeta) { rutaCarpetas = []; actual = null; lista = material; color = null; break; }
        color = actual.color || color;
        lista = actual.items;
    }

    const tarjetas = lista
        .map((item, idx) => item.carpeta ? tarjetaCarpeta(item, idx, color) : tarjetaArchivo(item, color))
        .join('');

    if (actual) {
        container.innerHTML = `
            <div class="col-span-full flex items-center gap-3 mb-2">
                <button type="button" data-volver class="btn-3d btn-3d--outline text-sm">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
                <h4 class="text-xl font-black text-ink">${actual.nombre}</h4>
            </div>
            ${tarjetas}
        `;
        return;
    }

    container.innerHTML = tarjetas;
}

// Abrir carpeta / volver (un solo listener sobre el contenedor)
document.getElementById('material-list')?.addEventListener('click', (e) => {
    const carpeta = e.target.closest('[data-carpeta]');
    if (carpeta) {
        rutaCarpetas.push(Number(carpeta.dataset.carpeta));
        renderMaterial();
        return;
    }
    if (e.target.closest('[data-volver]')) {
        rutaCarpetas.pop();
        renderMaterial();
    }
});

// =========================================================================
// CALCULADORA ICFES (versión simple: elige universidad y carrera → Calcular)
// =========================================================================
// Puntaje global Saber 11 = 5 × (3·LC + 3·Mat + 3·Soc + 3·Nat + 1·Ing) / 13   (0 - 500)
//
// Cada carrera tiene:
//   n : nombre
//   w : ponderación OFICIAL en %, en este orden → [Lectura, Matemáticas, Sociales, Naturales, Inglés]
//   c : [mínimo, máximo] histórico del puntaje ponderado de corte (escala 0-100). Si no hay corte
//       publicado, déjalo en null y se usa la "metaEstimada" de la universidad.
// Para agregar una carrera: copia una línea dentro de "carreras" de su facultad.
const AREAS_CALC = ['lectura', 'matematicas', 'sociales', 'naturales', 'ingles'];
const COEF_GLOBAL = { lectura: 3, matematicas: 3, sociales: 3, naturales: 3, ingles: 1 };

const UNIVERSIDADES = [
    {
        id: 'uis',
        nombre: 'UIS · Universidad Industrial de Santander (Bucaramanga)',
        nota: 'Ponderaciones y cortes oficiales de la UIS (cortes históricos 2021-2026). En cada facultad aparecen las carreras con mayor corte, que son las más disputadas.',
        facultades: [
            { nombre: 'Facultad de Ciencias', carreras: [
                { n: 'Biología',                w: [20, 25, 10, 35, 10], c: [69.65, 75.60] },
                { n: 'Química',                 w: [15, 25, 10, 40, 10], c: [54.75, 71.70] },
                { n: 'Física',                  w: [25, 25, 20, 20, 10], c: [57.95, 76.05] },
                { n: 'Matemáticas',             w: [20, 50, 10, 10, 10], c: [54.60, 67.00] },
                { n: 'Lic. en Matemáticas',     w: [20, 50, 10, 10, 10], c: [46.10, 67.00] }
            ] },
            { nombre: 'Facultad de Ingenierías Fisicomecánicas', carreras: [
                { n: 'Ingeniería en Inteligencia Artificial', w: [25, 30, 10, 20, 15], c: [71.85, 78.70] },
                { n: 'Ingeniería de Sistemas',                w: [20, 35, 10, 25, 10], c: [65.85, 78.25] },
                { n: 'Ingeniería Biomédica',                  w: [20, 30, 10, 30, 10], c: [71.10, 77.80] },
                { n: 'Ingeniería Mecánica',                   w: [10, 40, 10, 30, 10], c: [60.00, 76.70] },
                { n: 'Ingeniería en Ciencia de Datos',        w: [20, 30, 10, 25, 15], c: [58.90, 74.85] }
            ] },
            { nombre: 'Facultad de Ingenierías Fisicoquímicas', carreras: [
                { n: 'Ingeniería Química',    w: [20, 30, 10, 30, 10], c: [62.20, 76.60] },
                { n: 'Ingeniería de Petróleos', w: [20, 30, 10, 30, 10], c: [41.40, 71.40] },
                { n: 'Geología',              w: [20, 30, 10, 30, 10], c: [60.70, 70.80] },
                { n: 'Ingeniería Metalúrgica', w: [20, 30, 10, 30, 10], c: [43.20, 67.10] }
            ] },
            { nombre: 'Facultad de Ciencias Humanas', carreras: [
                { n: 'Lic. en Lenguas Extranjeras (inglés)', w: [25, 10, 20, 10, 35], c: [70.60, 76.10] },
                { n: 'Derecho',                               w: [40, 20, 20, 10, 10], c: [68.00, 74.50] },
                { n: 'Economía',                              w: [25, 30, 25, 10, 10], c: [65.15, 72.15] },
                { n: 'Lic. en Literatura y Lengua Castellana', w: [40, 15, 20, 10, 15], c: [61.50, 69.20] },
                { n: 'Trabajo Social',                        w: [40, 10, 30, 10, 10], c: [64.60, 67.70] }
            ] },
            { nombre: 'Facultad de Salud', carreras: [
                { n: 'Medicina',                    w: [25, 20, 15, 30, 10], c: [80.80, 96.25] },
                { n: 'Enfermería',                  w: [20, 15, 20, 30, 15], c: [69.10, 86.30] },
                { n: 'Nutrición y Dietética',       w: [20, 20, 20, 30, 10], c: [69.60, 84.70] },
                { n: 'Microbiología y Bioanálisis', w: [20, 20, 10, 40, 10], c: [71.30, 83.60] },
                { n: 'Fisioterapia',                w: [20, 15, 15, 40, 10], c: [67.85, 76.85] }
            ] }
        ]
    }
];

const clamp100 = (x) => Math.max(0, Math.min(100, x));
const puntajeGlobal = (s) =>
    (5 * AREAS_CALC.reduce((t, a) => t + COEF_GLOBAL[a] * s[a], 0)) / 13;

// Notas por área que llevan justo al puntaje ponderado P (escala 0-100) dando más nota
// a las áreas que más pesan en la carrera.
function notasParaPonderado(w, P) {
    const frac = w.map(x => x / 100);
    const armar = (b) => frac.map(f => clamp100(b + 14 * (5 * f - 1)));
    const pond = (t) => t.reduce((s, v, i) => s + frac[i] * v, 0);
    let lo = -80, hi = 200;
    for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        if (pond(armar(mid)) < P) lo = mid; else hi = mid;
    }
    const t = armar(hi).map(v => Math.min(100, Math.ceil(v - 1e-9)));
    const notas = {};
    AREAS_CALC.forEach((a, i) => notas[a] = t[i]);
    return notas;
}

// =========================================================================
// SELECTOR DE CARRERA (hoja inferior con facultades desplegables)
// Reemplaza el desplegable nativo, que en celulares no deja ver toda la lista.
// El <select> original sigue existiendo (oculto) como fuente de verdad.
// =========================================================================
function crearPickerCarrera(sel) {
    sel.classList.add('hidden');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'picker-trigger';
    trigger.innerHTML = '<span class="picker-trigger__text"></span><i class="fa-solid fa-chevron-down"></i>';
    sel.insertAdjacentElement('afterend', trigger);
    const triggerText = trigger.querySelector('.picker-trigger__text');

    const overlay = document.createElement('div');
    overlay.className = 'picker-overlay hidden';
    overlay.innerHTML =
        '<div class="picker-sheet" role="dialog" aria-modal="true" aria-label="Elige tu carrera">' +
            '<div class="picker-head">' +
                '<h3>Elige tu carrera</h3>' +
                '<button type="button" class="picker-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="picker-body"></div>' +
        '</div>';
    document.body.appendChild(overlay);
    const body = overlay.querySelector('.picker-body');

    function textoActual() {
        const opt = sel.options[sel.selectedIndex];
        return opt ? opt.textContent : 'Selecciona una carrera';
    }

    function render() {
        triggerText.textContent = textoActual();
        trigger.disabled = sel.disabled;
        trigger.classList.toggle('is-disabled', sel.disabled);

        body.innerHTML = '';
        const grupos = sel.querySelectorAll('optgroup');
        grupos.forEach((g) => {
            const opciones = Array.from(g.querySelectorAll('option'));
            const contieneActual = opciones.some(o => o.value === sel.value);

            const grupo = document.createElement('div');
            grupo.className = 'picker-group' + (contieneActual ? ' is-open' : '');

            const cab = document.createElement('button');
            cab.type = 'button';
            cab.className = 'picker-group__head';
            cab.innerHTML = '<span></span><i class="fa-solid fa-chevron-down"></i>';
            cab.firstChild.textContent = g.label;
            cab.addEventListener('click', () => grupo.classList.toggle('is-open'));

            const lista = document.createElement('div');
            lista.className = 'picker-group__list';
            opciones.forEach((o) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'picker-option' + (o.value === sel.value ? ' is-selected' : '');
                b.textContent = o.textContent;
                b.addEventListener('click', () => {
                    sel.value = o.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    render();
                    cerrar();
                });
                lista.appendChild(b);
            });

            grupo.appendChild(cab);
            grupo.appendChild(lista);
            body.appendChild(grupo);
        });
    }

    function abrir() {
        if (sel.disabled) return;
        overlay.classList.remove('hidden');
        document.body.classList.add('picker-lock');
        const sel1 = body.querySelector('.picker-option.is-selected');
        if (sel1) setTimeout(() => sel1.scrollIntoView({ block: 'center' }), 30);
    }
    function cerrar() {
        overlay.classList.add('hidden');
        document.body.classList.remove('picker-lock');
        trigger.focus({ preventScroll: true });
    }

    trigger.addEventListener('click', abrir);
    overlay.querySelector('.picker-close').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) cerrar();
    });

    render();
    return { refresh: render };
}

function setupCalculadora() {
    const selUni = document.getElementById('calc-uni');
    const selCar = document.getElementById('calc-carrera');
    const aviso = document.getElementById('calc-aviso-uni');
    const btn = document.getElementById('calc-btn');
    const salida = document.getElementById('calc-resultado');
    if (!selUni || !selCar || !btn || !salida) return;

    selUni.innerHTML = UNIVERSIDADES.map((u, i) => `<option value="${i}">${u.nombre}</option>`).join('');
    const uniActual = () => UNIVERSIDADES[Number(selUni.value)];
    const picker = crearPickerCarrera(selCar);

    function cargarCarreras() {
        const u = uniActual();
        salida.innerHTML = '';
        if (u.pendiente) {
            selCar.innerHTML = '<option>Próximamente</option>';
            selCar.disabled = true;
            btn.disabled = true;
        } else {
            selCar.innerHTML = u.facultades.map((f, fi) =>
                `<optgroup label="${f.nombre}">` +
                f.carreras.map((c, ci) => `<option value="${fi}-${ci}">${c.n}</option>`).join('') +
                `</optgroup>`
            ).join('');
            selCar.disabled = false;
            btn.disabled = false;
        }
        aviso.textContent = u.nota || '';
        aviso.classList.toggle('hidden', !u.nota);
        picker.refresh();
    }
    selUni.addEventListener('change', cargarCarreras);
    selCar.addEventListener('change', () => { salida.innerHTML = ''; });
    cargarCarreras();

    btn.addEventListener('click', () => {
        const u = uniActual();
        if (u.pendiente) return;
        const [fi, ci] = selCar.value.split('-').map(Number);
        const carrera = u.facultades[fi].carreras[ci];

        const estimada = !carrera.c;
        const pMin = estimada ? u.metaEstimada : carrera.c[0];
        const pMax = estimada ? u.metaEstimada : carrera.c[1];

        // "Pasar sobrado" = alcanzar la parte alta del corte histórico
        const notas = notasParaPonderado(carrera.w, pMax);
        const globalSobrado = Math.ceil(puntajeGlobal(notas));
        const globalMinimo = Math.ceil(puntajeGlobal(notasParaPonderado(carrera.w, pMin)));

        // Pesos y prioridades
        const peso = {};
        AREAS_CALC.forEach((a, i) => peso[a] = carrera.w[i]);
        const orden = [...AREAS_CALC].sort((x, y) => peso[y] - peso[x] || notas[y] - notas[x]);
        const dif = peso[orden[0]] - peso[orden[AREAS_CALC.length - 1]];
        const top = dif >= 10 ? orden.filter(a => peso[a] === peso[orden[0]] || peso[a] === peso[orden[1]]).slice(0, 2) : [];
        const maxPeso = Math.max(...AREAS_CALC.map(a => peso[a]));

        const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
        const rango = estimada ? `${pMax}` : `${fmt(pMin)} - ${fmt(pMax)}`;

        const nombresTop = top.map(a => `<strong>${NOMBRES_AREA[a]}</strong>`).join(' y ');
        const resumen = `Para <strong>${carrera.n}</strong> en la <strong>${u.id.toUpperCase()}</strong>, para pasar sobrado apunta a un global de ` +
            `<strong>≈ ${globalSobrado}</strong> (ponderado ${estimada ? 'estimado' : 'de corte'} ${fmt(pMax)}). ` +
            (top.length
                ? `Saca la mejor nota en ${nombresTop}, que son las que más pesan en esta carrera.`
                : `En esta carrera todas las áreas pesan parecido, así que reparte tu esfuerzo por igual.`);

        const tarjeta = (titulo, valor, sub, destacada) => `
            <div class="card-3d p-4 text-center" ${destacada ? 'style="border-color:#10b981; box-shadow:0 4px 0 #10b981"' : ''}>
                <p class="text-muted text-xs font-extrabold uppercase tracking-wide">${titulo}</p>
                <p class="text-ink text-3xl font-black my-1">${valor}</p>
                <p class="text-muted text-xs font-bold">${sub}</p>
            </div>`;

        const tarjetas =
            tarjeta('Global para pasar sobrado', `≈ ${globalSobrado}`, 'sobre 500', true) +
            tarjeta(estimada ? 'Ponderado meta (estimado)' : 'Corte histórico (ponderado)', rango, 'escala 0 a 100') +
            (estimada
                ? tarjeta('Global con la meta', `≈ ${globalMinimo}`, 'misma meta, sin margen extra')
                : tarjeta('Global en el corte más bajo', `≈ ${globalMinimo}`, 'el semestre más fácil'));

        const filas = orden.map((a) => {
            const color = COLORES_AREA[a];
            const esTop = top.includes(a);
            const pct = maxPeso ? Math.max(4, Math.round((peso[a] / maxPeso) * 100)) : 4;
            return `
                <div class="card-3d p-4" style="${esTop ? `border-color:${color}; box-shadow:0 4px 0 ${color}` : ''}">
                    <div class="flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                            <span class="inline-block w-3 h-3 rounded-full" style="background:${color}"></span>
                            <h5 class="text-ink font-extrabold">${NOMBRES_AREA[a]}</h5>
                            ${esTop ? `<span class="text-xs font-black px-2 py-0.5 rounded-full text-white" style="background:${color}">Prioridad</span>` : ''}
                        </div>
                        <p class="text-ink text-sm font-bold">Meta: <strong>${notas[a]}</strong> / 100</p>
                    </div>
                    <div class="mt-3 h-2.5 rounded-full overflow-hidden" style="background:color-mix(in srgb, ${color} 15%, white)">
                        <div class="h-full rounded-full" style="width:${pct}%; background:${color}"></div>
                    </div>
                    <p class="text-muted text-xs font-bold mt-1">Pesa ${peso[a]}% en el puntaje de esta carrera</p>
                </div>`;
        }).join('');

        const avisoEstimado = estimada
            ? `<div class="flex items-start gap-3 mb-4 p-4 rounded-2xl border-2" style="background:#fffbeb;border-color:#fde68a">
                   <i class="fa-solid fa-triangle-exclamation text-xl mt-0.5 shrink-0" style="color:#d97706"></i>
                   <p class="text-ink text-sm leading-relaxed">La UFPS no publica puntajes de corte. Usé un ponderado de <strong>${pMax}</strong> como meta
                   estimada; confirma en el portal de admisiones cómo quedó el último corte de tu carrera.</p>
               </div>`
            : '';

        salida.innerHTML = `
            <div class="animate-fade-in">
                <div class="flex items-start gap-3 mb-4 p-4 rounded-2xl bg-sidebarHover border-2 border-line">
                    <i class="fa-solid fa-bullseye text-accent text-xl mt-0.5 shrink-0"></i>
                    <p class="text-ink text-sm leading-relaxed">${resumen}</p>
                </div>
                ${avisoEstimado}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">${tarjetas}</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${filas}</div>
                <p class="text-muted text-xs font-bold mt-4">
                    El global es una estimación: depende de cómo repartas tus notas por área. Las ponderaciones son las oficiales de la
                    universidad; los cortes cambian cada semestre según los aspirantes. Confirma siempre en el portal de admisiones.
                </p>
            </div>`;
    });
}

// =========================================================================
// NAVEGACIÓN SPA
// =========================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function navigate(sectionId) {
    if (!sectionTitles[sectionId]) sectionId = SECCION_INICIAL;

    document.querySelectorAll('.spa-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('is-active'));
    document.getElementById('nav-' + sectionId)?.classList.add('is-active');

    // Volver al inicio del scroll al cambiar de sección
    document.getElementById('content-area')?.scrollTo({ top: 0 });

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
        }
    }
}

function setupEventListeners() {
    document.getElementById('sidebar-overlay')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-open')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-close')?.addEventListener('click', toggleSidebar);
    // Marcar clases como vistas al hacer clic en "Ver clase"
    const listaGrabaciones = document.getElementById('grabaciones-list');
    const alAbrirClase = (e) => {
        const enlace = e.target.closest('a[data-url]');
        if (enlace) marcarVista(enlace);
    };
    listaGrabaciones?.addEventListener('click', alAbrirClase);
    listaGrabaciones?.addEventListener('auxclick', alAbrirClase); // clic con la rueda

    // Filtros de Clases grabadas
    document.getElementById('grabaciones-filtros')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filtro]');
        if (!btn) return;
        filtroGrabaciones = btn.dataset.filtro;
        renderGrabaciones();
    });

    document.getElementById('header-brand')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(SECCION_INICIAL);
    });


    // Modal de temario: botón, clic fuera de la tarjeta y tecla Escape
    const modalTemas = document.getElementById('modal-temas');
    document.getElementById('btn-cerrar-temas')?.addEventListener('click', cerrarModalTemas);
    modalTemas?.addEventListener('click', (e) => {
        if (e.target === modalTemas) cerrarModalTemas();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalTemas && !modalTemas.classList.contains('hidden')) cerrarModalTemas();
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.id !== 'btn-logout') {
            btn.addEventListener('click', () => navigate(btn.id.replace('nav-', '')));
        }
    });

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.setAttribute('data-original-html', btnLogin.innerHTML);

        btnLogin.addEventListener('click', async () => {
            if (btnLogin.disabled) return;
            isInitialAuthCheck = false;
            btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> <span>Verificando...</span>';
            btnLogin.disabled = true;

            try {
                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Error al iniciar sesión:", error.code, error.message);

                // Si el popup falla (bloqueado, cerrado solo, sin storage), usamos redirección
                const usarRedirect = [
                    'auth/popup-blocked',
                    'auth/popup-closed-by-user',
                    'auth/cancelled-popup-request',
                    'auth/web-storage-unsupported',
                    'auth/operation-not-supported-in-this-environment'
                ].includes(error.code);

                if (usarRedirect) {
                    try {
                        await signInWithRedirect(auth, provider);
                        return; // la página se recarga al volver de Google
                    } catch (e2) {
                        console.error("Error en redirect:", e2.code, e2.message);
                    }
                }

                if (error.code === 'auth/unauthorized-domain') {
                    alert("Este dominio no está autorizado en Firebase.\n\nAgrega '" + location.hostname +
                          "' en Firebase Console → Authentication → Settings → Authorized domains.");
                } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                    alert("No se pudo iniciar sesión (" + (error.code || 'error') + "). Intenta de nuevo.");
                }

                btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
                btnLogin.disabled = false;
            }
        });
    }

    // Resultado de signInWithRedirect (cuando el popup no funcionó)
    getRedirectResult(auth).catch((error) => {
        console.error("Error en getRedirectResult:", error.code, error.message);
        if (error.code === 'auth/unauthorized-domain') {
            alert("Dominio no autorizado en Firebase: " + location.hostname);
        }
        resetBotonLogin();
    });

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        });
    }
}

// =========================================================================
// BLOQUEO / DESBLOQUEO DE LA APP
// =========================================================================
function resetBotonLogin() {
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin && btnLogin.hasAttribute('data-original-html')) {
        btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
        btnLogin.disabled = false;
    }
}

function unlockApp() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');

    if (!authScreen || !appContainer) {
        document.addEventListener('DOMContentLoaded', unlockApp);
        return;
    }

    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    appContainer.classList.add('flex');

    resetBotonLogin();
    navigate(SECCION_INICIAL);
}

function lockApp() {
    usuarioId = 'anonimo';
    vistas = new Set();
    vistasEstaSesion.clear();
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');

    if (appContainer) {
        appContainer.classList.add('hidden');
        appContainer.classList.remove('flex');
    }
    if (authScreen) {
        authScreen.classList.remove('hidden');
    }

    stopCounterListener();
    resetBotonLogin();
}

// =========================================================================
// CONTADOR DE ESTUDIANTES (tiempo real)
// =========================================================================
let unsubscribeCounter = null;

const startCounterListener = () => {
    if (unsubscribeCounter) unsubscribeCounter();

    const usuariosRef = collection(db, "usuarios");

    unsubscribeCounter = onSnapshot(usuariosRef, (snapshot) => {
        const el = document.getElementById("inscritos-count");
        if (el) el.textContent = snapshot.size;
    }, (error) => {
        console.error("Error en Snapshot del contador:", error);
    });
};

function stopCounterListener() {
    if (unsubscribeCounter) {
        unsubscribeCounter();
        unsubscribeCounter = null;
    }
    const el = document.getElementById("inscritos-count");
    if (el) el.textContent = "...";
}

// =========================================================================
// AUTENTICACIÓN
// =========================================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. Cualquier usuario con Gmail válido entra a la página
        if (user.email && user.email.endsWith("@gmail.com")) {
            usuarioId = user.uid;
            vistas = cargarVistas();
            renderGrabaciones();
            unlockApp();
            startCounterListener();
            try {
                await setDoc(doc(db, 'usuarios', user.uid), {
                    nombre: user.displayName || "Usuario",
                    email: user.email,
                    fechaRegistro: new Date().toISOString()
                }, { merge: true });
            } catch (e) {
                console.error("Error al guardar usuario en Firestore:", e);
            }
        } else {
            // 2. Cuenta no autorizada
            await signOut(auth);
            lockApp();
            alert("Acceso denegado: Usa una cuenta @gmail.com autorizada.");
        }
    } else {
        // 3. Sin sesión
        lockApp();
    }
    isInitialAuthCheck = false;
});

// =========================================================================
// INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    renderGrabaciones();
    renderMaterial();
    setupCalculadora();
    setupEventListeners();
});