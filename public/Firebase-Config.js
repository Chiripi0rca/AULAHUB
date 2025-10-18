// --- Importaciones ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getAuth} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
// --- Configuración ---
const firebaseConfig = {
  apiKey: "AIzaSyAOQEKEfqjdqhEpeUJhXTlV1xsAhlWLnuk",
  authDomain: "aulahub-1f738.firebaseapp.com",
  databaseURL: "https://aulahub-1f738-default-rtdb.firebaseio.com",
  projectId: "aulahub-1f738",
  storageBucket: "aulahub-1f738.firebasestorage.app",
  messagingSenderId: "789863629023",
  appId: "1:789863629023:web:1a680bea2d7a0082f4696a",
  measurementId: "G-F6MN9Y3SHY"
};

// --- Inicialización ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);


// --- Exportaciones ---
export {auth};