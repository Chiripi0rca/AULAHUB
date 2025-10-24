import { auth} from "./Firebase-Config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// --- Inicio de sesión ---
document.addEventListener("DOMContentLoaded", () => { 

document.getElementById("login").addEventListener("click", () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Inicio de sesión exitoso");
      console.log("Usuario logueado:", userCredential.user);
      window.location.href = "aulas.html"; 
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
});

});

// Cerrar sesión
document.addEventListener("DOMContentLoaded", () => { 

document.getElementById("logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Sesión cerrada");
    window.location.href = "index.html"; // Recargar la página para aplicar cambios
  }).catch((error) => {
    alert("Error al cerrar sesión: " + error.message);
  });
});

});

// Verificar si hay un usuario autenticado
document.addEventListener("DOMContentLoaded", () => { 

onAuthStateChanged(auth, (user) => {
  const userInfo = document.getElementById("userinfo");
  userInfo.textContent = user ? user.email : "No hay usuario conectado";
});

});