import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { auth, db } from "./Firebase-Config.js"; // Importamos 'auth' y 'db' de Firebase-Config.js

// --- Inicio de sesión ---
document.addEventListener("DOMContentLoaded", () => { 
  document.getElementById("login").addEventListener("click", () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // Validación de campos vacíos
    if (!email || !password) {
      alert("Por favor ingrese ambos campos.");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("Inicio de sesión exitoso");
        console.log("Usuario logueado:", userCredential.user);
        window.location.href = "aulas.html";  // Redirigir a aulas.html después de iniciar sesión
      })
      .catch((error) => {
        alert("Error: " + error.message);  // Mostrar error si no se puede iniciar sesión
      });
  });
});

// Cerrar sesión
document.addEventListener("DOMContentLoaded", () => { 
  document.getElementById("logout").addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Sesión cerrada");
      window.location.href = "index.html"; // Redirigir a la página de inicio
    }).catch((error) => {
      alert("Error al cerrar sesión: " + error.message);
    });
  });
});

// Verificar si hay un usuario autenticado y aplicar restricciones
document.addEventListener("DOMContentLoaded", () => { 
  onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById("userinfo");
    userInfo.textContent = user ? user.email : "No hay usuario conectado";

    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "roles", uid);  // Obtener referencia al documento del usuario

      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const isAdmin = docSnapshot.data().admin; // Verifica si es administrador
          const Aula = docSnapshot.data().Aula; // Obtiene el aula asignada al usuario
          
          // Aplicamos las restricciones de aulas
          aplicarRestricciones(isAdmin, Aula);
        } else {
          console.error("No se encontró el documento para el usuario.");
        }
      }).catch((error) => {
        console.error("Error al obtener datos del usuario:", error);
      });
    }
  });
});

// Función para aplicar restricciones basadas en el rol
function aplicarRestricciones(isAdmin, Aula) {
  const cardLabA = document.querySelector(".card[data-aula='labA']");
  const cardLabB = document.querySelector(".card[data-aula='labB']");
  const cardCentro = document.querySelector(".card[data-aula='centro']");
  const cardAuditorio = document.querySelector(".card[data-aula='auditorio']");

  // Si el usuario no es administrador, mostramos todas las tarjetas
  if (!isAdmin) {
    cardLabA.style.visibility = 'visible';
    cardLabB.style.visibility = 'visible';
    cardCentro.style.visibility = 'visible';
    cardAuditorio.style.visibility = 'visible';
  } else {
    // Si es administrador, solo mostramos las aulas asignadas en `Aula`
    cardLabA.style.visibility = 'hidden';
    cardLabB.style.visibility = 'hidden';
    cardCentro.style.visibility = 'hidden';
    cardAuditorio.style.visibility = 'hidden';
    
    if (Aula === "AB") {
      cardLabA.style.visibility = 'visible';
      cardLabB.style.visibility = 'visible';
    } else if (Aula === "C") {
      cardCentro.style.visibility = 'visible';
    } else if (Aula === "Auditorio") {
      cardAuditorio.style.visibility = 'visible';
    } else {
      console.error("Aula no reconocida: " + Aula);
    }
  }
}
