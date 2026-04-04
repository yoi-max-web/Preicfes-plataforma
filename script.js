import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// Configuración de Tailwind
if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    bgDark: '#09090b',
                    cardDark: '#121214',
                    cardBorder: '#27272a',
                    sidebar: '#000000',
                    sidebarHover: '#18181b',
                    accent: '#3b82f6',
                    accentHover: '#2563eb',
                    textLight: '#f4f4f5',
                    textMuted: '#a1a1aa'
                },
                fontFamily: {
                    sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                }
            }
        }
    };
}

// Inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCxQK1xwBqKOjwq9YKI0-vqJrvF-lwPeV0",
    authDomain: "pre-icfes-saber-11-mpb.firebaseapp.com",
    projectId: "pre-icfes-saber-11-mpb",
    storageBucket: "pre-icfes-saber-11-mpb.firebasestorage.app",
    messagingSenderId: "1032568451031",
    appId: "1:1032568451031:web:ff572fdee598fb1041a592"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Variables globales de estado
let isInitialAuthCheck = true; 

// Lógica de UI - Datos y Renderizado
const sectionTitles = {
    'dashboard': 'Panel Principal Saber 11',
    'simulacro': 'Biblioteca de Simulacros',
    'clases': 'Tutorías y Clases en Vivo',
    'grabaciones': 'Archivo de Grabaciones',
    'tutores': 'Nuestro Equipo de Tutores',
    'contacto': 'Contacto'
};

const simulacrosData = [
    { titulo: "Inglés", preguntas: 30, tagClass: "bg-purple-500/10 text-purple-400", borderHover: "hover:border-purple-500", btnClass: "bg-purple-600 hover:bg-purple-700 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]", iconClass: "text-purple-400", desc: "Siete partes que evalúan desde avisos y diálogos cotidianos hasta gramática y lectura inferencial", linkCuadernillo: "https://drive.google.com/file/d/1mjoz2lMTj-vZu4XP37D9HuGy1MPDcndy/view?usp=sharing", linkFormulario: "https://forms.gle/oRnbY9JZzB8b1ke69" },
    { titulo: "Matemáticas", preguntas: 25, tagClass: "bg-red-500/10 text-red-400", borderHover: "hover:border-red-500", btnClass: "bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]", iconClass: "text-red-400", desc: "Evaluación de razonamiento cuantitativo y resolución de problemas mediante geometría, estadística y cálculo aplicado", linkCuadernillo: "https://drive.google.com/file/d/1y62qqRcMhh724mPvjVe555bvJys8acfm/view?usp=drive_link", linkFormulario: "https://forms.gle/8D67XoCWM7Km2LHZ8" },
    { titulo: "Lectura Crítica", preguntas: 25, tagClass: "bg-orange-500/10 text-orange-500", borderHover: "hover:border-orange-500", btnClass: "bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]", iconClass: "text-orange-400", desc: "Análisis y evaluación de diversos tipos de textos mediante la interpretación de sentidos, intenciones y posturas", linkCuadernillo: "https://drive.google.com/file/d/100LpXbFntTZn8WTzrzsEdJqybUdu0G0b/view?usp=sharing", linkFormulario: "AQUI_TU_LINK_DE_FORMS_LECTURA" },
    { titulo: "Sociales", preguntas: 25, tagClass: "bg-blue-500/10 text-blue-500", borderHover: "hover:border-blue-500", btnClass: "bg-accent hover:bg-accentHover shadow-[0_0_10px_rgba(59,130,246,0.2)]", iconClass: "text-blue-400", desc: "Análisis de contextos históricos, geográficos y políticos, enfatizando la comprensión de derechos y deberes ciudadanos.", linkCuadernillo: "https://drive.google.com/file/d/130ODrXb93wkg7tXX5pPiddZO3MuRmwuX/view?usp=drive_link", linkFormulario: "AQUI_TU_LINK_DE_FORMS_SOCIALES" },
    { titulo: "Ciencias Naturales", preguntas: 25, tagClass: "bg-emerald-500/20 text-emerald-400", borderHover: "hover:border-emerald-500", btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]", iconClass: "text-green-400", desc: "Comprensión de fenómenos biológicos, químicos y físicos, junto con el análisis de la investigación científica.", linkCuadernillo: "https://drive.google.com/file/d/1WODHoGHCl-QyM3tUVOdQoVvr1U6tV7h7/view?usp=drive_link", linkFormulario: "AQUI_TU_LINK_DE_FORMS_NATURALES" }
];

const clasesData = [
    { titulo: "Ciencias Naturales", horario: "10:00AM-12:00PM | Pepito Pérez", emoji: "🧬", colorText: "text-green-500", colorBg: "bg-green-500/10", colorBorder: "border-green-500/20", borderHover: "hover:border-green-500", btnClass: "bg-green-500 hover:bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]" },
    { titulo: "Inglés", horario: "8:00 AM - 10:00 AM | Yoimar Serrano", emoji: "🗽", colorText: "text-purple-600", colorBg: "bg-purple-500/10", colorBorder: "border-purple-500/20", borderHover: "hover:border-purple-500", btnClass: "bg-purple-600 hover:bg-purple-700 shadow-[0_0_10px_rgba(147,51,234,0.3)]" },
    { titulo: "Matemáticas", horario: "6:00AM-8:00AM | Firulais Chupamecha", emoji: "📐", colorText: "text-red-500", colorBg: "bg-red-500/10", colorBorder: "border-red-500/20", borderHover: "hover:border-red-500", btnClass: "bg-red-600 hover:bg-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)]" },
    { titulo: "Sociales y Ciudadanas", horario: "3:00 PM - 6:00 PM | Daniela Montoya", emoji: "🌎", colorText: "text-accent", colorBg: "bg-blue-500/10", colorBorder: "border-blue-500/20", borderHover: "hover:border-accent", btnClass: "bg-accent hover:bg-accentHover shadow-[0_0_10px_rgba(59,130,246,0.3)]" },
    { titulo: "Lectura Crítica", horario: "12:00 PM - 03:00 PM | Maria José", emoji: "📚", colorText: "text-orange-500", colorBg: "bg-orange-500/10", colorBorder: "border-orange-500/20", borderHover: "hover:border-orange-500", btnClass: "bg-orange-500 hover:bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]" }
];

const grabacionesDataLectura = [{ num: "01", titulo: "Tipologías Textuales", desc: "Niveles de lectura inicial." }, { num: "02", titulo: "Textos Continuos", desc: "Análisis de columnas." }, { num: "03", titulo: "Textos Discontinuos", desc: "Infografías y tablas." }, { num: "04", titulo: "Argumentación", desc: "Tesis y premisas." }, { num: "05", titulo: "Inferencia", desc: "Lectura profunda." }, { num: "06", titulo: "Evaluación Crítica", desc: "Posturas del autor." }];
const grabacionesDataNaturales = [{ num: "01", titulo: "Método Científico", desc: "Bases de investigación." }, { num: "02", titulo: "Célula y Ecosistemas", desc: "Biología fundamental." }, { num: "03", titulo: "Leyes de Newton", desc: "Mecánica clásica." }, { num: "04", titulo: "Termodinámica", desc: "Calor y energía." }, { num: "05", titulo: "Estequiometría", desc: "Reacciones químicas." }, { num: "06", titulo: "Química Orgánica", desc: "Carbono y compuestos." }];
const grabacionesDataMatematicas = [{ num: "01", titulo: "Aritmética Básica", desc: "Proporciones y porcentajes." }, { num: "02", titulo: "Álgebra", desc: "Ecuaciones y funciones." }, { num: "03", titulo: "Geometría Plana", desc: "Áreas y perímetros." }, { num: "04", titulo: "Trigonometría", desc: "Senos y cosenos." }, { num: "05", titulo: "Estadística Descriptiva", desc: "Promedios y gráficas." }, { num: "06", titulo: "Probabilidad", desc: "Sucesos y azar." }];
const grabacionesDataIngles = [{ num: "01", titulo: "Avisos y Señales", desc: "Interpretación visual." }, { num: "02", titulo: "Vocabulario Básico", desc: "Palabras clave." }, { num: "03", titulo: "Conversaciones Cortas", desc: "Diálogos cotidianos." }, { num: "04", titulo: "Gramática I", desc: "Tiempos verbales." }, { num: "05", titulo: "Lectura Literal", desc: "Textos informativos." }, { num: "06", titulo: "Lectura Inferencial", desc: "Sentidos implícitos." }];
const grabacionesDataSociales = [{ num: "01", titulo: "Constitución Política", desc: "Derechos y deberes." }, { num: "02", titulo: "Mecanismos de Participación", desc: "Democracia activa." }, { num: "03", titulo: "Historia de Colombia I", desc: "Siglo XIX y XX." }, { num: "04", titulo: "Conflicto Armado", desc: "Orígenes y consecuencias." }, { num: "05", titulo: "Geografía Económica", desc: "Recursos y población." }, { num: "06", titulo: "Modelos Políticos", desc: "Conceptos globales." }];

const tutoresData = [
    { nombre: "Yoimar Serrano", materia: "Inglés", desc: "Especialista en bilingüismo y comprensión lectora en segunda lengua.", img: "https://ui-avatars.com/api/?name=Yoimar+Serrano&background=9333ea&color=fff", borderHover: "hover:border-purple-500", badgeBg: "bg-purple-500/10", badgeBorder: "border-purple-500/30", badgeText: "text-purple-400", gradient: "from-purple-500/10" },
    { nombre: "Pepito Pérez", materia: "Ciencias Naturales", desc: "Apasionado por la biología y la investigación científica aplicada.", img: "https://ui-avatars.com/api/?name=Pepito+Perez&background=10b981&color=fff", borderHover: "hover:border-emerald-500", badgeBg: "bg-emerald-500/10", badgeBorder: "border-emerald-500/30", badgeText: "text-emerald-400", gradient: "from-emerald-500/10" },
    { nombre: "Firulais Chupamecha", materia: "Matemáticas", desc: "Experto en razonamiento cuantitativo y lógica matemática.", img: "https://ui-avatars.com/api/?name=Firulais+Chupamecha&background=ef4444&color=fff", borderHover: "hover:border-red-500", badgeBg: "bg-red-500/10", badgeBorder: "border-red-500/30", badgeText: "text-red-400", gradient: "from-red-500/10" },
    { nombre: "Daniela Montoya", materia: "Sociales y Ciudadanas", desc: "Analista de contextos históricos y ciencias políticas.", img: "https://ui-avatars.com/api/?name=Daniela+Montoya&background=3b82f6&color=fff", borderHover: "hover:border-blue-500", badgeBg: "bg-blue-500/10", badgeBorder: "border-blue-500/30", badgeText: "text-blue-400", gradient: "from-blue-500/10" },
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
            <button class="w-full md:w-auto ${item.btnClass} text-white px-6 py-2.5 rounded-lg font-medium transition whitespace-nowrap">
                Unirse a Meet
            </button>
        </div>
    `).join('');
}

function renderGrabacionesList(containerId, data, color) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = data.map(item => `
        <div class="bg-cardDark rounded-2xl border border-cardBorder p-5 flex items-center gap-4 hover:border-${color}-500 transition duration-300">
            <div class="w-14 h-14 rounded-xl bg-sidebar flex items-center justify-center border border-cardBorder shrink-0">
                <i class="fa-solid fa-play text-${color}-500 text-xl"></i>
            </div>
            <div class="flex-1 min-w-0">
                <span class="text-[10px] text-${color}-500 font-bold uppercase">Clase ${item.num}</span>
                <h4 class="text-white font-semibold text-base leading-tight mt-1 truncate">${item.titulo}</h4>
                <p class="text-textMuted text-xs truncate mt-1">${item.desc}</p>
            </div>
            <a href="#" class="text-textMuted hover:text-white bg-sidebar p-2.5 rounded-full border border-cardBorder hover:border-${color}-500 transition">
                <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i>
            </a>
        </div>
    `).join('');
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
        'matematicas': 'https://formspree.io/f/endpoint_matematicas',
        'lectura': 'https://formspree.io/f/endpoint_lectura',
        'sociales': 'https://formspree.io/f/endpoint_sociales',
        'naturales': 'https://formspree.io/f/endpoint_naturales'
    };

    form.addEventListener('submit', function(e) {
        const selectedArea = document.getElementById('tutor-select').value;
        if(endpoints[selectedArea]) {
            this.action = endpoints[selectedArea];
        }
    });
}

// Lógica de Navegación y Sidebar
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

// Event Listeners principales
function setupEventListeners() {
    document.getElementById('sidebar-overlay')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-open')?.addEventListener('click', toggleSidebar);
    document.getElementById('btn-sidebar-close')?.addEventListener('click', toggleSidebar);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        // Ignorar el botón de cerrar sesión en la navegación principal
        if(btn.id !== 'btn-logout') {
            btn.addEventListener('click', () => {
                const sectionId = btn.id.replace('nav-', '');
                navigate(sectionId);
            });
        }
    });

    // Evento de Login
    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) {
        // Guardamos el HTML original para el estado de carga
        btnLogin.setAttribute('data-original-html', btnLogin.innerHTML);
        
        btnLogin.addEventListener('click', async () => {
            try {
                // Indicamos que ya no es carga inicial, el usuario interactuó
                isInitialAuthCheck = false; 
                
                // Efecto de carga en el botón
                btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-lg"></i> <span>Verificando...</span>';
                btnLogin.disabled = true;
                btnLogin.classList.add('opacity-70', 'cursor-not-allowed');

                // Llamamos a Google. Si todo va bien, onAuthStateChanged tomará el control
                await signInWithPopup(auth, provider);
                
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                // Si el usuario cancela, restauramos el botón
                btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
                btnLogin.disabled = false;
                btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

    // Evento de Cerrar Sesión
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
                // No es necesario recargar, onAuthStateChanged bloqueará la UI inmediatamente
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            }
        });
    }
}

// LÓGICA DE BLOQUEO ESTRICTO DE LA UI
function unlockApp() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    
    if (authScreen) authScreen.classList.add('hidden');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.classList.add('flex');
    }
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
    
    // Si el botón estaba cargando, lo restauramos al bloquear
    if(btnLogin && btnLogin.hasAttribute('data-original-html')) {
        btnLogin.innerHTML = btnLogin.getAttribute('data-original-html');
        btnLogin.disabled = false;
        btnLogin.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderSimulacros();
    renderClases();
    renderGrabaciones();
    renderTutores();
    setupContactForm();
    setupEventListeners();
});

// ESCUCHADOR DE SESIÓN - EL ÚNICO LUGAR DE LA VERDAD
// Esta es la autoridad final. Ningún otro lugar de la app debe redirigir.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Validación de Dominio estricta
        if (user.email && user.email.endsWith("@gmail.com")) {
            console.log("Sesión activa válida detectada:", user.email);
            unlockApp();
        } else {
            console.log("Correo no válido, cerrando sesión preventiva.");
            await signOut(auth); // Lo sacamos silenciosamente
            lockApp();
            
            // Si el usuario intentó logearse (no es carga de F5), mostramos alerta
            if (!isInitialAuthCheck) {
                alert("Acceso denegado: Por favor usa una cuenta de Google finalizada en @gmail.com");
            }
        }
    } else {
        // No hay sesión (o acaba de cerrar sesión)
        lockApp();
    }
    
    // Una vez ejecutada la primera comprobación, marcamos como falso
    isInitialAuthCheck = false;
});