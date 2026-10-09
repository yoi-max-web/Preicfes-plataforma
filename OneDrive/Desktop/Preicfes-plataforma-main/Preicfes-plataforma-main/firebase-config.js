import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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
const db = getFirestore(app);

export { auth, provider, db };

