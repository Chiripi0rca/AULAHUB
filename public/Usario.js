import { auth} from "./Firebase-Config.js";
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// --- Inicio de sesión ---
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

  