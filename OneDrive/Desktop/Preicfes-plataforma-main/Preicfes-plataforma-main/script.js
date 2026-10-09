import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
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
    'material': 'Material de estudio'
};

// Tonos de verde para diferenciar áreas sin salirse de la paleta
const COLORES_AREA = {
    lectura:     '#10b981', // esmeralda
    naturales:   '#22c55e', // verde
    matematicas: '#14b8a6', // verde azulado
    ingles:      '#65a30d', // lima oscuro
    sociales:    '#15803d'  // verde bosque
};

// =========================================================================
// DATOS: CLASES GRABADAS
// =========================================================================
const grabacionesAreas = [
    {
        key: 'lectura',
        titulo: 'Lectura crítica',
        items: [
            { num: "01", titulo: "Resolviendo Preguntitas", desc: "Estrategias de Lectura.", url: "https://www.awesomescreenshot.com/video/53388742?key=be7edf0891791da963f51dcbffb6d66b", desafio: "Pausa el video y responde por ti mismo antes de ver la explicación" }
        ]
    },
    {
        key: 'naturales',
        titulo: 'Ciencias naturales',
        items: [
            { num: "01", titulo: "Método Científico", desc: "Bases de investigación.", url: "", desafio: "" }
        ]
    },
    {
        key: 'matematicas',
        titulo: 'Matemáticas',
        items: [
            { num: "01", titulo: "Análisis de Gráficas", desc: "Variables dependientes e independientes.", url: "https://www.youtube.com/watch?v=xmpyi87fYAE", desafio: "DESAFÍO: Encontra un error en la clase. ¿Puedes hallarlo? deja tu cometario" },
            { num: "02", titulo: "Clase Teórica", desc: "Resolviendo preguntitas y repasando ejercicios.", url: "https://www.awesomescreenshot.com/video/52876365?key=ede01d375bc5abae2b734d2b2f6f4f4c", desafio: "DESAFÍO: ¿Qué parte te costó más entender? ¡Déjalo en los comentarios y lo revisamos!" },
            { num: "03", titulo: "Porcentajes, Regla de tres y Cálculo mental", desc: "Clase 3: aprende a calcular porcentajes, usar la regla de tres y resolver operaciones rápidas con cálculo mental.", url: "https://www.awesomescreenshot.com/video/53111384?key=22292bc93f3a777758bb4de4c67d3a05", desafio: "DESAFÍO: Calcula mentalmente el 15% de 260 y comparte tu resultado. Revisa si lo hiciste bien." }
        ]
    },
    {
        key: 'ingles',
        titulo: 'Inglés',
        items: [
            { num: "01", titulo: "Avisos y Señales", desc: "Interpretación visual.", url: "https://www.youtube.com/watch?v=o2wPAkryCAM", desafio: "DESAFÍO: Identifica qué contexto específico representa cada señal. ¿Cuál te parece más confusa? ¡Déjalo en los comentarios!" },
            { num: "02", titulo: "Resolviendo Cuadernillo", desc: "Estrategias de descarte y verbos clave.", url: "https://www.awesomescreenshot.com/video/52361095?key=e813f9fc168a2343d2ad3dcf8b9725f9", desafio: "DESAFÍO: De los ejemplos del video (como 'Enjoy this with milk'), ¿qué otra palabra clave usarías para identificar un restaurante? ¡Escríbela!" },
            { num: "03", titulo: "Relaciona palabras con sus descripciones", desc: "Actividad para unir vocabulario inglés con su significado.", url: "https://www.awesomescreenshot.com/video/52894460?key=a6b0c4c8934c5f7420513587b0354b83", desafio: "DESAFÍO: Practica asociando cada palabra con su definición en tu cuaderno." }
        ]
    },
    {
        key: 'sociales',
        titulo: 'Sociales',
        items: [
            { num: "01", titulo: "Constitución Política", desc: "Derechos y deberes.", url: "", desafio: "" }
        ]
    }
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
const materialAreas = [
    { id: 'ingles',      titulo: 'Inglés',               color: COLORES_AREA.ingles },
    { id: 'matematicas', titulo: 'Matemáticas',          color: COLORES_AREA.matematicas },
    { id: 'espanol',     titulo: 'Lectura Crítica',      color: COLORES_AREA.lectura },
    { id: 'sociales',    titulo: 'Sociales y Ciudadanas', color: COLORES_AREA.sociales },
    { id: 'naturales',   titulo: 'Ciencias Naturales',   color: COLORES_AREA.naturales }
];

// Cada área tiene dos carpetas: "cuadernillos" y "respuestas".
// Para agregar un archivo, añade una línea { nombre: '...', url: '...' } y pega tu enlace en "url".
// Si "url" está vacío, el archivo aparece como "Enlace pendiente" (sin clic).
const SUBCARPETAS = [
    { id: 'cuadernillos', titulo: 'Cuadernillos', icono: 'fa-book-open',    desc: 'Material y cuadernillos de práctica' },
    { id: 'respuestas',   titulo: 'Respuestas',   icono: 'fa-circle-check', desc: 'Claves y soluciones' }
];

const datosMaterial = {
    'ingles': {
        cuadernillos: [
            { nombre: 'Cuadernillo ICFES Inglés 2023', url: '' },
            { nombre: 'Lista de Verbos Irregulares B1', url: '' }
        ],
        respuestas: []
    },
    'matematicas': {
        cuadernillos: [
            { nombre: 'Formulario Razonamiento Cuantitativo', url: '' }
        ],
        respuestas: []
    },
    'espanol': {
        cuadernillos: [
            { nombre: 'Guía de Tipologías Textuales', url: '' }
        ],
        respuestas: []
    },
    'sociales': {
        cuadernillos: [
            { nombre: 'Resumen Constitución Política', url: '' }
        ],
        respuestas: []
    },
    'naturales': {
        cuadernillos: [
            { nombre: 'Esquema Método Científico', url: '' }
        ],
        respuestas: []
    }
};

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
function renderLeccion(item, color) {
    const tieneUrl = item.url && item.url.trim() !== '';
    const boton = tieneUrl
        ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-3d btn-3d--block">
               <i class="fa-solid fa-play"></i> Ver clase
           </a>`
        : `<span class="btn-3d btn-3d--block is-disabled">
               <i class="fa-regular fa-clock"></i> Próximamente
           </span>`;

    return `
        <article class="lesson-card" style="--c:${color}">
            <div class="flex items-center gap-3">
                <div class="folder-icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-play"></i>
                </div>
                <span class="text-sm font-extrabold" style="color:${color}">Clase ${item.num}</span>
            </div>
            <div class="flex-1">
                <h4 class="text-ink font-extrabold text-base leading-snug">${item.titulo}</h4>
                <p class="text-muted text-sm mt-1">${item.desc}</p>
            </div>
            ${item.desafio ? `<p class="lesson-challenge"><i class="fa-solid fa-bolt mr-1" style="color:${color}"></i>${item.desafio}</p>` : ''}
            ${boton}
        </article>
    `;
}

function renderGrabaciones() {
    const container = document.getElementById('grabaciones-list');
    if (!container) return;

    container.innerHTML = grabacionesAreas.map(area => {
        const color = COLORES_AREA[area.key];
        const total = area.items.length;
        return `
            <details class="folder-card" style="--c:${color}">
                <summary class="flex items-center justify-between p-5">
                    <div class="flex items-center gap-4">
                        <div class="folder-icon w-14 h-14 rounded-2xl flex items-center justify-center text-2xl">
                            <i class="fa-solid fa-folder ico-closed"></i>
                            <i class="fa-solid fa-folder-open ico-open"></i>
                        </div>
                        <div>
                            <h3 class="text-ink font-black text-xl">${area.titulo}</h3>
                            <p class="text-muted text-xs font-bold mt-0.5">${total} ${total === 1 ? 'lección disponible' : 'lecciones disponibles'}</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-down chev text-xl" style="color:${color}"></i>
                </summary>
                <div class="folder-body p-5 border-t-2 border-line bg-bgMain/60">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-1">
                        ${area.items.map(item => renderLeccion(item, color)).join('')}
                    </div>
                </div>
            </details>
        `;
    }).join('');
}

// =========================================================================
// RENDER: MATERIAL  (área → Cuadernillos / Respuestas → archivos con enlace)
// =========================================================================
let areaActual = null;   // { id, titulo, color }

const VISTAS_MATERIAL = ['vista-carpetas', 'vista-subcarpetas', 'vista-archivos'];

function mostrarVistaMaterial(id) {
    VISTAS_MATERIAL.forEach(v => document.getElementById(v)?.classList.toggle('hidden', v !== id));
    document.getElementById('content-area')?.scrollTo({ top: 0 });
}

function escapeAttr(texto) {
    return String(texto).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function tieneEnlace(url) {
    return typeof url === 'string' && url.trim() !== '' && url.trim() !== '#';
}

function contarArchivos(areaId) {
    const d = datosMaterial[areaId] || {};
    return SUBCARPETAS.reduce((total, sc) => total + (d[sc.id] || []).length, 0);
}

function renderMaterialCarpetas() {
    const container = document.getElementById('material-carpetas');
    if (!container) return;

    container.innerHTML = materialAreas.map(area => {
        const total = contarArchivos(area.id);
        return `
            <button type="button" data-area="${area.id}"
                    class="card-3d card-3d--hover p-6 text-left" style="--c:${area.color}">
                <div class="folder-icon w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <i class="fa-solid fa-folder-open text-3xl"></i>
                </div>
                <h4 class="text-xl font-black text-ink mb-1">${area.titulo}</h4>
                <p class="text-muted text-sm font-bold">
                    <span style="color:${area.color}">${total}</span> ${total === 1 ? 'archivo' : 'archivos'}
                </p>
            </button>
        `;
    }).join('');

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-area]');
        if (btn) abrirArea(btn.dataset.area);
    });

    document.getElementById('material-subcarpetas')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sub]');
        if (btn) abrirSubcarpeta(btn.dataset.sub);
    });
}

// Nivel 2: las dos carpetas del área (Cuadernillos y Respuestas)
function abrirArea(areaId) {
    areaActual = materialAreas.find(a => a.id === areaId);
    if (!areaActual) return;

    document.getElementById('titulo-subcarpetas').textContent = areaActual.titulo;

    const datos = datosMaterial[areaId] || {};
    document.getElementById('material-subcarpetas').innerHTML = SUBCARPETAS.map(sc => {
        const total = (datos[sc.id] || []).length;
        return `
            <button type="button" data-sub="${sc.id}"
                    class="card-3d card-3d--hover p-6 text-left" style="--c:${areaActual.color}">
                <div class="folder-icon w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <i class="fa-solid ${sc.icono} text-3xl"></i>
                </div>
                <h4 class="text-xl font-black text-ink mb-1">${sc.titulo}</h4>
                <p class="text-muted text-sm mb-2">${sc.desc}</p>
                <p class="text-muted text-sm font-bold">
                    <span style="color:${areaActual.color}">${total}</span> ${total === 1 ? 'archivo' : 'archivos'}
                </p>
            </button>
        `;
    }).join('');

    mostrarVistaMaterial('vista-subcarpetas');
}

// Nivel 3: archivos de la subcarpeta; cada uno abre su enlace al hacer clic
function abrirSubcarpeta(subId) {
    const sub = SUBCARPETAS.find(s => s.id === subId);
    if (!areaActual || !sub) return;

    document.getElementById('titulo-area-material').textContent = sub.titulo;
    document.getElementById('subtitulo-material').textContent = areaActual.titulo;

    const contenedor = document.getElementById('lista-archivos-container');
    const archivos = (datosMaterial[areaActual.id] || {})[subId] || [];

    if (archivos.length === 0) {
        contenedor.innerHTML = `<p class="text-muted text-center py-8 font-bold">No hay archivos disponibles por el momento.</p>`;
    } else {
        contenedor.innerHTML = archivos.map(archivo => {
            const interior = `
                <div class="flex items-center gap-4 min-w-0">
                    <div class="folder-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style="--c:${areaActual.color}">
                        <i class="fa-solid ${sub.icono}"></i>
                    </div>
                    <h5 class="text-ink font-extrabold text-sm md:text-base min-w-0 break-words">${archivo.nombre}</h5>
                </div>
            `;
            if (tieneEnlace(archivo.url)) {
                return `
                    <a href="${escapeAttr(archivo.url.trim())}" target="_blank" rel="noopener noreferrer"
                       class="file-card p-4 flex items-center justify-between gap-4 cursor-pointer">
                        ${interior}
                        <span class="btn-3d btn-3d--round text-sm" aria-hidden="true">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </span>
                    </a>
                `;
            }
            return `
                <div class="file-card p-4 flex items-center justify-between gap-4 opacity-60" style="pointer-events:none">
                    ${interior}
                    <span class="text-muted text-xs font-bold shrink-0">Enlace pendiente</span>
                </div>
            `;
        }).join('');
    }

    mostrarVistaMaterial('vista-archivos');
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
    document.getElementById('header-brand')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(SECCION_INICIAL);
    });
    document.getElementById('btn-volver-areas')?.addEventListener('click', () => mostrarVistaMaterial('vista-carpetas'));
    document.getElementById('btn-volver-subcarpetas')?.addEventListener('click', () => mostrarVistaMaterial('vista-subcarpetas'));

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
            try {
                isInitialAuthCheck = false;
                btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> <span>Verificando...</span>';
                btnLogin.disabled = true;

                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
                btnLogin.disabled = false;
            }
        });
    }

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
    renderMaterialCarpetas();
    setupEventListeners();
});