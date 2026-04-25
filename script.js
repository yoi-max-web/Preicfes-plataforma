import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

window.validarYDescargar = async function() {
    const documento = document.getElementById('input-id-modal')?.value.trim();
    const grado = document.getElementById('input-grado-modal')?.value.trim().toUpperCase();

    if (!documento || !grado) {
        alert('Por favor ingresa tu número de documento y tu grado.');
        return;
    }

    try {
        const resultadoRef = doc(db, 'resultados_simulacro', documento);
        const resultadoSnap = await getDoc(resultadoRef);

        if (!resultadoSnap.exists()) {
            alert('No se encontró un resultado con ese número de documento.');
            return;
        }

        const resultadoData = resultadoSnap.data();
        const gradoFirestore = resultadoData?.grado?.toString().trim().toUpperCase();

        if (gradoFirestore !== grado) {
            alert('El grado ingresado no coincide con el registro.');
            return;
        }

        alert('Validación correcta. Ahora puedes descargar tus resultados.');
        // TODO: aquí puedes llamar a la función que genera el PDF.
    } catch (error) {
        console.error('Error al validar el resultado:', error);
        alert('Ocurrió un error al validar. Intenta de nuevo más tarde.');
    }
};

// Variables globales de estado
let isInitialAuthCheck = true; 
// Configuración de Tailwind
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    bgDark: '#050a05',
                    cardDark: '#0a120a',
                    cardBorder: '#1a2e1a',
                    sidebar: '#020502',
                    sidebarHover: '#122012',
                    accent: '#10b981',
                    accentHover: '#059669',
                    textLight: '#f0fdf4',
                    textMuted: '#6b7280'
                },
                fontFamily: {
                    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                }
            }
        }
    };
}


// Lógica de UI - Datos y Renderizado
const sectionTitles = {
    'dashboard': 'Panel Principal Saber 11',
    'simulacro': 'Biblioteca de Simulacros',
    'clases': 'Tutorías y Clases en Vivo',
    'grabaciones': 'Archivo de Grabaciones',
    'ranking': 'Ranking Saber 11',
    'tutores': 'Nuestro Equipo de Tutores',
    'contacto': 'Contacto'
};

const simulacrosData = [
    { titulo: "Inglés", preguntas: 30, tagClass: "bg-purple-500/10 text-purple-400", borderHover: "hover:border-purple-500", btnClass: "bg-purple-600 hover:bg-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.3)]", iconClass: "text-purple-400", desc: "Siete partes que evalúan desde avisos y diálogos cotidianos hasta gramática y lectura inferencial", linkCuadernillo: "https://drive.google.com/file/d/1mjoz2lMTj-vZu4XP37D9HuGy1MPDcndy/view?usp=sharing", linkFormulario: "https://forms.gle/oRnbY9JZzB8b1ke69" },
    { titulo: "Mates", preguntas: 25, tagClass: "bg-red-500/10 text-red-400", borderHover: "hover:border-red-500", btnClass: "bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.3)]", iconClass: "text-red-400", desc: "Evaluación de razonamiento cuantitativo y resolución de problemas mediante geometría, estadística y cálculo aplicado", linkCuadernillo: "https://drive.google.com/file/d/1y62qqRcMhh724mPvjVe555bvJys8acfm/view?usp=drive_link", linkFormulario: "https://forms.gle/8D67XoCWM7Km2LHZ8" },
    { titulo: "Español", preguntas: 25, tagClass: "bg-orange-500/10 text-orange-500", borderHover: "hover:border-orange-500", btnClass: "bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)]", iconClass: "text-orange-400", desc: "Análisis y evaluación de diversos tipos de textos mediante la interpretación de sentidos, intenciones y posturas", linkCuadernillo: "https://drive.google.com/file/d/100LpXbFntTZn8WTzrzsEdJqybUdu0G0b/view?usp=sharing", linkFormulario: "https://forms.gle/Y12DuvXsL7bDQ7VT7" },
    { titulo: "Sociales", preguntas: 25, tagClass: "bg-blue-500/10 text-blue-500", borderHover: "hover:border-blue-500", btnClass: "bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.3)]", iconClass: "text-blue-400", desc: "Análisis de contextos históricos, geográficos y políticos, enfatizando la comprensión de derechos y deberes ciudadanos.", linkCuadernillo: "https://drive.google.com/file/d/130ODrXb93wkg7tXX5pPiddZO3MuRmwuX/view?usp=drive_link", linkFormulario: "https://forms.gle/sRmxhg543DyMAa6r6" },
    { titulo: "Naturales", preguntas: 25, tagClass: "bg-emerald-500/20 text-emerald-400", borderHover: "hover:border-emerald-500", btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]", iconClass: "text-green-400", desc: "Comprensión de fenómenos biológicos, químicos y físicos, junto con el análisis de la investigación científica.", linkCuadernillo: "https://drive.google.com/file/d/1WODHoGHCl-QyM3tUVOdQoVvr1U6tV7h7/view?usp=drive_link", linkFormulario: "https://forms.gle/Ny827LsnVP7HnEqo8" }
];

const simulacrosCompletosData = [
    { titulo: "S11-X", preguntas: 120, tagClass: "bg-emerald-500/10 text-emerald-400", borderHover: "hover:border-emerald-500", btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]", iconClass: "text-emerald-400", desc: "Prueba completa evaluando todas las áreas. Formato real ICFES, sesión mañana.", linkCuadernillo: "#", linkFormulario: "#" }
];

const clasesData = [
    { titulo: "Ciencias Naturales & Sociales", horario: "3:00PM-5:00PM | Ángel Sepúlveda", emoji: "🧬", colorText: "text-green-500", colorBg: "bg-green-500/10", colorBorder: "border-green-500/20", borderHover: "hover:border-green-500", btnClass: "bg-green-500 hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]", link: "https://meet.google.com/wwh-uuih-qrs" },
    { titulo: "Inglés & Matemáticas", horario: "10:00AM-12:00AM | Yoimar Serrano", emoji: "🗽", colorText: "text-purple-600", colorBg: "bg-purple-500/10", colorBorder: "border-purple-500/20", borderHover: "hover:border-purple-500", btnClass: "bg-purple-600 hover:bg-purple-700 shadow-[0_0_10px_rgba(147,51,234,0.3)]", link: "https://meet.google.com/crf-qfxc-wmi" },
    { titulo: "Lectura Crítica", horario: "12:00 PM - 03:00 PM | Maria José", emoji: "📚", colorText: "text-orange-500", colorBg: "bg-orange-500/10", colorBorder: "border-orange-500/20", borderHover: "hover:border-orange-500", btnClass: "bg-orange-500 hover:bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]", link: "https://meet.google.com/wys-kwhx-fnv" }
];

const grabacionesDataLectura = [{ num: "01", titulo: "Tipologías Textuales", desc: "Niveles de lectura inicial.", url: "", desafio: "" }];
const grabacionesDataNaturales = [{ num: "01", titulo: "Método Científico", desc: "Bases de investigación.", url: "", desafio: "" }];
const grabacionesDataMatematicas = [{ 
    num: "01", 
    titulo: "Análisis de Gráficas", 
    desc: "Variables dependientes e independientes.", 
    // Usamos la URL limpia para evitar errores de sintaxis
    url: "https://www.youtube.com/watch?v=xmpyi87fYAE", 
   
    desafio: "DESAFÍO: Encontra un error en la clase. ¿Puedes hallarlo? deja tu cometario" 
}];
const grabacionesDataIngles = [{ num: "01", titulo: "Avisos y Señales", desc: "Interpretación visual.", url: "", desafio: "" }];
const grabacionesDataSociales = [{ num: "01", titulo: "Constitución Política", desc: "Derechos y deberes.", url: "", desafio: "" }];
const tutoresData = [
    { nombre: "Yoimar Serrano", materia: "Inglés & Matemáticas", desc: "Hola, soy Yoimar. Mi enfoque son los idiomas y quiero que dominemos juntos matemáticas e inglés.", img: "/imgs/Yo.jpg", borderHover: "hover:border-purple-500", badgeBg: "bg-purple-500/10", badgeBorder: "border-purple-500/30", badgeText: "text-purple-400", gradient: "from-purple-500/10" },
    { nombre: "Ángel Sepúlveda", materia: "Ciencias Naturales & Sociales", desc: "Hola, soy Ángel. Como aspirante a medicina, quiero apoyar a jóvenes de 10° y 11° en biología, física, química.", img: "/imgs/Angel.jpeg", borderHover: "hover:border-emerald-500", badgeBg: "bg-emerald-500/10", badgeBorder: "border-emerald-500/30", badgeText: "text-emerald-400", gradient: "from-emerald-500/10" },
    { nombre: "Maria José", materia: "Lectura Crítica", desc: "Lingüista enfocada en análisis de textos y hermenéutica.", img: "https://ui-avatars.com/api/?name=Maria+Jose&background=f97316&color=fff", borderHover: "hover:border-orange-500", badgeBg: "bg-orange-500/10", badgeBorder: "border-orange-500/30", badgeText: "text-orange-400", gradient: "from-orange-500/10" }
];

function renderSimulacros() {
    const container = document.getElementById('simulacros-container');
    if(!container) return;
    container.innerHTML = simulacrosData.map(item => `
        <div class="bg-cardDark rounded-2xl border border-cardBorder ${item.borderHover} overflow-hidden flex flex-col transition-all duration-700 ease-in-out">
            <div class="bg-sidebar p-5 border-b border-cardBorder relative">
                <div class="absolute top-4 right-4 ${item.tagClass} text-xs font-bold px-2 py-1 rounded">${item.preguntas} PREGUNTAS</div>
                <h4 class="text-white font-bold text-lg">${item.titulo}</h4>
                <span class="text-textMuted text-xs uppercase tracking-wider">ENTRENAMIENTO</span>
            </div>
            <div class="p-6 flex-1 flex flex-col justify-between">
                <p class="text-textMuted text-sm mb-6">${item.desc}</p>
                <div class="space-y-3">
                    <a href="${item.linkCuadernillo}" target="_blank" class="w-full bg-sidebar hover:bg-gray-800 text-textLight py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-cardBorder">
                        <i class="fa-regular fa-file-pdf ${item.iconClass} text-lg"></i> Ver Cuadernillo
                    </a>
                    <a href="${item.linkFormulario}" target="_blank" class="w-full ${item.btnClass} text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-list-check text-lg"></i> Subir Respuestas
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderSimulacrosCompletos() {
    const container = document.getElementById('simulacros-completos-container');
    if(!container) return;
    container.innerHTML = simulacrosCompletosData.map(item => `
        <div class="bg-cardDark rounded-2xl border border-cardBorder ${item.borderHover} overflow-hidden flex flex-col transition-all duration-700 ease-in-out">
            <div class="bg-sidebar p-5 border-b border-cardBorder relative">
                <div class="absolute top-4 right-4 ${item.tagClass} text-xs font-bold px-2 py-1 rounded">${item.preguntas} PREGUNTAS</div>
                <h4 class="text-white font-bold text-lg">${item.titulo}</h4>
                <span class="text-textMuted text-xs uppercase tracking-wider">SIMULACRO GLOBAL</span>
            </div>
            <div class="p-6 flex-1 flex flex-col justify-between">
                <p class="text-textMuted text-sm mb-6">${item.desc}</p>
                <div class="space-y-3">
                    <a href="${item.linkCuadernillo}" target="_blank" class="w-full bg-sidebar hover:bg-gray-800 text-textLight py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-cardBorder">
                        <i class="fa-solid fa-book-open ${item.iconClass} text-lg"></i> Ver Cuadernillo
                    </a>
                    <a href="${item.linkFormulario}" target="_blank" class="w-full ${item.btnClass} text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-pen-nib text-lg"></i> Subir Respuestas
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function renderClases() {
    const container = document.getElementById('clases-container');
    if(!container) return;
    container.innerHTML = clasesData.map(item => `
        <div class="bg-cardDark p-4 md:p-6 rounded-2xl border border-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between ${item.borderHover} transition-colors gap-4">
            <div class="flex items-center gap-4 md:gap-6 w-full">
                <div class="${item.colorBg} ${item.colorText} border ${item.colorBorder} p-3 md:p-4 rounded-xl text-center min-w-[70px] md:min-w-[80px]">
                    <span class="block text-xl md:text-2xl font-black">SAB</span>
                    <span class="block text-xs uppercase font-semibold">${item.emoji}</span>
                </div>
                <div>
                    <h4 class="text-base md:text-lg font-bold text-white">${item.titulo}</h4>
                    <p class="text-textMuted text-xs md:text-sm mt-1"><i class="fa-regular fa-clock mr-1"></i> ${item.horario}</p>
                </div>
            </div>
            <a href="${item.link}" target="_blank" class="w-full md:w-auto ${item.btnClass} text-white px-6 py-2.5 rounded-lg font-medium transition whitespace-nowrap text-center inline-block">
                Unirse a Meet
            </a>
        </div>
    `).join('');
}
function renderGrabacionesList(containerId, data, color) {
    const container = document.getElementById(containerId);
    if(!container) return;

    container.innerHTML = data.map(item => {
        // Verificamos si hay URL para habilitar o deshabilitar el botón
        const tieneUrl = item.url && item.url.trim() !== "";
        const buttonClass = tieneUrl 
            ? `text-white bg-${color}-600 hover:bg-${color}-700 border-${color}-500` 
            : `text-textMuted bg-sidebar opacity-20 cursor-not-allowed pointer-events-none border-cardBorder`;

        return `
            <div class="bg-cardDark rounded-2xl border border-cardBorder p-5 flex items-center gap-4 hover:border-${color}-500/50 transition duration-300">
                <div class="w-14 h-14 rounded-xl bg-sidebar flex items-center justify-center border border-cardBorder shrink-0">
                    <i class="fa-solid fa-play text-${color}-500 text-xl ${tieneUrl ? 'animate-pulse' : ''}"></i>
                </div>

                <div class="flex-1 min-w-0">
                    <span class="text-[10px] text-${color}-500 font-bold uppercase tracking-wider">Clase ${item.num}</span>
                    <h4 class="text-white font-semibold text-base leading-tight mt-1 truncate">${item.titulo}</h4>
                    <p class="text-textMuted text-xs truncate mt-1">${item.desc}</p>
                    
                    ${item.desafio ? `<p class="text-${color}-400 text-[10px] mt-2 font-medium italic animate-bounce-subtle">${item.desafio}</p>` : ''}
                </div>

                <a href="${tieneUrl ? item.url : '#'}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   class="p-2.5 rounded-full border transition-all duration-300 ${buttonClass}">
                    <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                </a>
            </div>
        `;
    }).join('');
}


function renderGrabaciones() {
    renderGrabacionesList('grabaciones-grid-lectura', grabacionesDataLectura, 'orange');
    renderGrabacionesList('grabaciones-grid-naturales', grabacionesDataNaturales, 'emerald');
    renderGrabacionesList('grabaciones-grid-matematicas', grabacionesDataMatematicas, 'red');
    renderGrabacionesList('grabaciones-grid-ingles', grabacionesDataIngles, 'purple');
    renderGrabacionesList('grabaciones-grid-sociales', grabacionesDataSociales, 'blue');
}

function renderTutores() {
    const container = document.getElementById('tutors-grid');
    if(!container) return;
    
    container.innerHTML = tutoresData.map(tutor => `
        <div class="bg-cardDark rounded-3xl border border-cardBorder ${tutor.borderHover} transition-all duration-300 overflow-hidden flex flex-col group glow-card">
            <div class="p-8 flex flex-col items-center text-center flex-1 relative">
                <div class="absolute inset-0 bg-gradient-to-b ${tutor.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img src="${tutor.img}" alt="${tutor.nombre}" class="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-cardBorder mb-6 shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10">
                <h4 class="text-white font-bold text-xl md:text-2xl mb-2 relative z-10">${tutor.nombre}</h4>
                <span class="inline-block px-3 py-1 ${tutor.badgeBg} border ${tutor.badgeBorder} ${tutor.badgeText} rounded-full text-xs font-bold tracking-widest uppercase mb-4 relative z-10">${tutor.materia}</span>
                <p class="text-textMuted text-sm leading-relaxed relative z-10">${tutor.desc}</p>
            </div>
        </div>
    `).join('');
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    if(!form) return;
    
    const endpoints = {
        'ingles': 'https://formspree.io/f/xykbbjka',
        'lectura': 'https://formspree.io/f/xykbbjka',
        'naturales': 'https://formspree.io/f/mrerbdgz'
    };

    form.addEventListener('submit', function(e) {
        const selectedArea = document.getElementById('tutor-select').value;
        if(endpoints[selectedArea]) {
            this.action = endpoints[selectedArea];
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function navigate(sectionId) {
    document.querySelectorAll('.spa-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('section-title').textContent = sectionTitles[sectionId];

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-accent', 'text-white', 'shadow-[0_0_15px_rgba(59,130,246,0.3)]');
        btn.classList.add('hover:bg-sidebarHover', 'text-textMuted');
    });

    const activeBtn = document.getElementById('nav-' + sectionId);
    if(activeBtn) {
        activeBtn.classList.remove('hover:bg-sidebarHover', 'text-textMuted');
        activeBtn.classList.add('bg-accent', 'text-white', 'shadow-[0_0_15px_rgba(59,130,246,0.3)]');
    }

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
        }
    }
}

function setupFolders() {
    document.querySelectorAll('.folder-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const contentWrapper = document.getElementById(targetId);
            btn.classList.toggle('active');
            contentWrapper.classList.toggle('open');
        });
    });
}

function setupEventListeners() {
    document.getElementById('sidebar-overlay')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-open')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-close')?.addEventListener('click', toggleSidebar);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        if(btn.id !== 'btn-logout') {
            btn.addEventListener('click', () => {
                const sectionId = btn.id.replace('nav-', '');
                navigate(sectionId);
            });
        }
    });

    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) {
        btnLogin.setAttribute('data-original-html', btnLogin.innerHTML);
        
        btnLogin.addEventListener('click', async () => {
            try {
                isInitialAuthCheck = false; 
                btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> <span>Verificando...</span>';
                btnLogin.disabled = true;
                btnLogin.classList.add('opacity-70', 'cursor-not-allowed');

                await signInWithPopup(auth, provider);
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
                btnLogin.disabled = false;
                btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        });
    }
}

function unlockApp() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    const btnLogin = document.getElementById('btn-login');

    if (!authScreen || !appContainer) {
        document.addEventListener('DOMContentLoaded', unlockApp);
        return;
    }

    authScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    appContainer.classList.add('flex');

    if(btnLogin && btnLogin.hasAttribute('data-original-html')) {
        btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
        btnLogin.disabled = false;
        btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
    }

    navigate('dashboard');
}

function lockApp() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    const btnLogin = document.getElementById('btn-login');
    
    if (appContainer) {
        appContainer.classList.add('hidden');
        appContainer.classList.remove('flex');
    }
    if (authScreen) {
        authScreen.classList.remove('hidden');
    }
    
    stopCounterListener();

    if(btnLogin && btnLogin.hasAttribute('data-original-html')) {
        btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
        btnLogin.disabled = false;
        btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

// Inicialización de DOM
document.addEventListener('DOMContentLoaded', () => {
    renderSimulacros();
    renderSimulacrosCompletos();
    renderClases();
    renderGrabaciones();
    renderTutores();
    setupContactForm();
    setupEventListeners();
    setupFolders();
    createResultsChart();
});

function createResultsChart() {
    const canvas = document.getElementById('graficaResultados');
    if (!canvas) return;

    new Chart(canvas, {
        type: 'radar',
        data: {
            labels: ['Matemáticas', 'Lectura Crítica', 'Ciencias Naturales', 'Sociales', 'Inglés'],
            datasets: [{
                label: 'Desempeño',
                data: [72, 80, 68, 75, 85],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(16, 185, 129, 0.22)',
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#a7f3d0',
                pointHoverBackgroundColor: '#a7f3d0',
                pointHoverBorderColor: '#16a34a',
                borderWidth: 2,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: {
                        color: 'rgba(34, 197, 94, 0.25)'
                    },
                    angleLines: {
                        color: 'rgba(34, 197, 94, 0.35)'
                    },
                    pointLabels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12
                        }
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleColor: '#f8fafc',
                    bodyColor: '#d1fae5'
                }
            }
        }
    });
}

// =========================================================================
// SOLUCIÓN: CONTADOR REAL-TIME SINCRONIZADO CON EL ESTADO DE AUTH
// =========================================================================

// Variable global para guardar la suscripción y evitar memory leaks
let unsubscribeCounter = null;

// Función dedicada a arrancar el listener
const startCounterListener = () => {
    // Si ya existe un listener activo, lo matamos antes de crear uno nuevo
    if (unsubscribeCounter) {
        unsubscribeCounter();
    }

    const usuariosRef = collection(db, "usuarios");
    
    unsubscribeCounter = onSnapshot(usuariosRef, (snapshot) => {
        const count = snapshot.size;
        const el = document.getElementById("inscritos-count");
        if (el) {
            el.textContent = count;
            console.log("Contador actualizado:", count);
        }
    }, (error) => {
        console.error("Error en Snapshot del contador:", error);
    });
};

// Función para detener el listener al cerrar sesión
const stopCounterListener = () => {
    if (unsubscribeCounter) {
        unsubscribeCounter(); // Detiene la escucha en Firebase
        unsubscribeCounter = null;
    }
    // Opcional: Resetear la UI para el próximo usuario
    const el = document.getElementById("inscritos-count");
    if (el) el.textContent = "...";
};

// ESCUCHADOR DE SESIÓN
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (user.email && user.email.endsWith("@gmail.com")) {
            console.log("Sesión activa válida detectada:", user.email);
            
            unlockApp();
            startCounterListener();
            
            try {
                // Actualizamos los datos del usuario en Firestore, pero no bloqueamos el acceso si falla
                await setDoc(doc(db, 'usuarios', user.uid), {
                    nombre: user.displayName || "Usuario sin nombre",
                    email: user.email,
                    fechaRegistro: user.metadata?.creationTime || new Date().toISOString()
                }, { merge: true });
            } catch (error) {
                console.error("Error al registrar usuario en Firestore:", error);
            }
        } else {
            console.log("Correo no válido, cerrando sesión preventiva.");
            stopCounterListener(); // Detenemos el listener por seguridad
            await signOut(auth); 
            lockApp();
            
            if (!isInitialAuthCheck) {
                alert("Acceso denegado: Por favor usa una cuenta de Google finalizada en @gmail.com");
            }
        }
    } else {
        stopCounterListener(); // Limpiamos el listener si no hay sesión
        lockApp();
    }
    
    isInitialAuthCheck = false;
});
// =========================================================================
// LÓGICA DEL MODAL DE VALIDACIÓN DE RESULTADOS
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnAbrirValidacion = document.getElementById('btn-abrir-validacion');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const modalValidacion = document.getElementById('modal-validacion');
    const valDocumento = document.getElementById('input-id-modal');
    const valGrado = document.getElementById('input-grado-modal');
    const checkboxTerminos = document.getElementById('acepto-terminos');
    const btnDescargarPdf = document.getElementById('btn-descargar-pdf');

    // 1. Función para abrir el modal
    function abrirModal() {
        if (modalValidacion) {
            modalValidacion.classList.remove('hidden');
            // Pequeño timeout para animar la opacidad si fuera necesario
            setTimeout(() => {
                modalValidacion.classList.add('opacity-100');
            }, 10);
        }
    }

    // 2. Función para cerrar el modal
    function cerrarModal() {
        if (modalValidacion) {
            modalValidacion.classList.add('hidden');
            // Opcional: limpiar los campos al cerrar
            if (valDocumento) valDocumento.value = '';
            if (valGrado) valGrado.value = '';
            checkboxTerminos.checked = false;
            btnDescargarPdf.disabled = true;
        }
    }

    // 3. Listeners de apertura y cierre
    if (btnAbrirValidacion) {
        btnAbrirValidacion.addEventListener('click', abrirModal);
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    }

    // Cerrar el modal al hacer clic fuera de la tarjeta (en el fondo negro)
    if (modalValidacion) {
        modalValidacion.addEventListener('click', (e) => {
            if (e.target === modalValidacion) {
                cerrarModal();
            }
        });
    }

    // 4. Lógica del Checkbox para habilitar/deshabilitar el botón
    if (checkboxTerminos && btnDescargarPdf) {
        checkboxTerminos.addEventListener('change', (e) => {
            btnDescargarPdf.disabled = !e.target.checked;
        });
    }
});

const temasMateria = {
    'ingles': {
        titulo: 'Inglés',
        icono: 'fa-brain',
        colorTexto: 'text-purple-500',
        colorBorde: 'border-purple-500/30',
        colorSombra: 'rgba(168,85,247,0.3)',
        temas: [
            'Avisos y diálogos cotidianos',
            'Comprensión literal de textos',
            'Vocabulario en contexto',
            'Gramática básica e intermedia',
            'Lectura inferencial'
        ]
    },
    'naturales': {
        titulo: 'Ciencias Naturales',
        icono: 'fa-seedling',
        colorTexto: 'text-emerald-500',
        colorBorde: 'border-emerald-500/30',
        colorSombra: 'rgba(16,185,129,0.3)',
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
        colorTexto: 'text-red-500',
        colorBorde: 'border-red-500/30',
        colorSombra: 'rgba(239,68,68,0.3)',
        temas: [
            'Aritmética y proporcionalidad',
            'Álgebra y cálculo de funciones',
            'Geometría plana y espacial',
            'Estadística descriptiva',
            'Probabilidad'
        ]
    },
    'lectura': {
        titulo: 'Lectura Crítica',
        icono: 'fa-book',
        colorTexto: 'text-orange-500',
        colorBorde: 'border-orange-500/30',
        colorSombra: 'rgba(249,115,22,0.3)',
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
        colorTexto: 'text-blue-500',
        colorBorde: 'border-blue-500/30',
        colorSombra: 'rgba(59,130,246,0.3)',
        temas: [
            'Constitución Política de Colombia',
            'Derechos fundamentales y deberes',
            'Historia mundial y nacional (S. XX y XXI)',
            'Mecanismos de participación',
            'Geografía económica y política'
        ]
    }
};

window.abrirModalTemas = function(materiaKey) {
    const data = temasMateria[materiaKey];
    if (!data) return;

    const modal = document.getElementById('modal-temas');
    const modalContent = document.getElementById('modal-temas-content');
    const titulo = document.getElementById('modal-titulo');
    const icono = document.getElementById('modal-icono');
    const iconContainer = document.getElementById('modal-icon-container');
    const listaTemas = document.getElementById('modal-lista-temas');

    titulo.textContent = data.titulo;
    
    icono.className = `fa-solid ${data.icono} ${data.colorTexto}`;
    iconContainer.className = `w-14 h-14 rounded-full flex items-center justify-center bg-sidebar border ${data.colorBorde}`;
    modalContent.style.boxShadow = `0 0 40px ${data.colorSombra}`;
    modalContent.style.borderColor = data.colorBorde.replace('border-', '').replace('/30', '');

    listaTemas.innerHTML = data.temas.map(tema => `
        <li class="bg-sidebar p-3 rounded-xl border border-cardBorder flex items-center gap-3">
            <i class="fa-solid fa-check text-accent text-sm"></i>
            <span class="text-slate-200 text-sm font-medium">${tema}</span>
        </li>
    `).join('');

    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
};

window.cerrarModalTemas = function(event) {
    if (event && event.target.id !== 'modal-temas' && event.type === 'click') return;
    
    const modal = document.getElementById('modal-temas');
    const modalContent = document.getElementById('modal-temas-content');

    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

// 1. Añadir al objeto sectionTitles existente en tu código:
// sectionTitles['material'] = 'Material de Estudio';

// 2. Base de datos simulada de archivos (puedes expandirla)
const datosMaterial = {
    'ingles': [
        { nombre: 'Cuadernillo ICFES Inglés 2023', peso: '2.4 MB', url: '#' },
        { nombre: 'Lista de Verbos Irregulares B1', peso: '850 KB', url: '#' }
    ],
    'matematicas': [
        { nombre: 'Formulario Razonamiento Cuantitativo', peso: '1.2 MB', url: '#' }
    ],
    'espanol': [
        { nombre: 'Guía de Tipologías Textuales', peso: '3.1 MB', url: '#' }
    ],
    'sociales': [
        { nombre: 'Resumen Constitución Política', peso: '1.8 MB', url: '#' }
    ],
    'naturales': [
        { nombre: 'Esquema Método Científico', peso: '900 KB', url: '#' }
    ]
};

// 3. Funciones de navegación interna
window.abrirCarpeta = function(areaId, titulo) {
    const vistaCarpetas = document.getElementById('vista-carpetas');
    const vistaArchivos = document.getElementById('vista-archivos');
    const tituloElement = document.getElementById('titulo-area-material');
    const contenedorArchivos = document.getElementById('lista-archivos-container');

    // Cambiar título
    tituloElement.textContent = titulo;

    // Renderizar archivos
    const archivos = datosMaterial[areaId] || [];
    if (archivos.length === 0) {
        contenedorArchivos.innerHTML = `<p class="text-textMuted text-center py-8">No hay archivos disponibles por el momento.</p>`;
    } else {
        contenedorArchivos.innerHTML = archivos.map(archivo => `
            <div class="file-card bg-cardDark border border-cardBorder rounded-xl p-4 flex items-center justify-between transition-all duration-300">
                <div class="flex items-center gap-4 min-w-0">
                    <div class="text-red-500 text-3xl shrink-0">
                        <i class="fa-solid fa-file-pdf drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"></i>
                    </div>
                    <div class="min-w-0">
                        <h5 class="text-white font-semibold text-sm md:text-base truncate">${archivo.nombre}</h5>
                        <p class="text-textMuted text-xs font-medium uppercase tracking-wider">${archivo.peso}</p>
                    </div>
                </div>
                <a href="${archivo.url}" target="_blank" class="shrink-0 bg-sidebar border border-cardBorder hover:border-emerald-500 hover:text-emerald-500 text-textLight px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                    Descargar
                </a>
            </div>
        `).join('');
    }

    // Intercambiar vistas
    vistaCarpetas.classList.add('hidden');
    vistaArchivos.classList.remove('hidden');
};

window.volverCarpetas = function() {
    const vistaCarpetas = document.getElementById('vista-carpetas');
    const vistaArchivos = document.getElementById('vista-archivos');

    vistaArchivos.classList.add('hidden');
    vistaCarpetas.classList.remove('hidden');
};