import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";  
import { auth, db } from "./Firebase-Config.js";

document.addEventListener("DOMContentLoaded", () => {
  // LOGIN
  const loginBtn = document.getElementById("login");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      if (!email || !password) {
        alert("Por favor ingrese ambos campos.");
        return;
      }
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
     }

  // LOGOUT (solo en aulas.html)
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        alert("Sesión cerrada");
        window.location.href = "index.html";
      }).catch((error) => {
        alert("Error al cerrar sesión: " + error.message);
      });
    });
  }

  // ROLES + AULAS (principalmente útil en aulas.html)
  const userInfo = document.getElementById("userinfo");

   onAuthStateChanged(auth, (user) => {

  if (userInfo) {
      userInfo.textContent = user ? user.email : "No hay usuario conectado";
    }

    if (!user) return;
    const uid = user.uid;
    const userRef = doc(db, "roles", uid);

     getDoc(userRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const isAdmin = docSnapshot.data().admin;
          const Aula = docSnapshot.data().Aula;
          aplicarRestricciones(isAdmin, Aula);
        } 
        else {
          console.error("No se encontró el documento para el usuario. Lo trato como maestro.");
          aplicarRestricciones(false, null);
        }
        })
      .catch((error) => {
        console.error("Error al obtener datos del usuario:", error);
        aplicarRestricciones(false, null);
      });
    });
   });
  
   function aplicarRestricciones(isAdminRaw, AulaRaw) {
  console.log("aplicarRestricciones →", { isAdminRaw, AulaRaw });

  const isAdmin = isAdminRaw === true || isAdminRaw === "true";
  const Aula = (AulaRaw || "").trim();

  const cardLabA = document.querySelector(".card[data-aula='labA']");
  const cardLabB = document.querySelector(".card[data-aula='labB']");
  const cardCentro = document.querySelector(".card[data-aula='centro']");
  const cardAuditorio = document.querySelector(".card[data-aula='auditorio']");
  const cards = [cardLabA, cardLabB, cardCentro, cardAuditorio];
   // Maestro → mostrar todo
  if (!isAdmin) {
      console.log("Usuario NO admin → mostrar todas las aulas");
    cards.forEach(card => {
      if (card) card.style.visibility = "visible";
    });
    return;
  }

  console.log("Usuario ADMIN, aplicando restricciones para Aula:", Aula);

  cards.forEach(card => {
    if (card) card.style.visibility = "hidden";
  });

  switch (Aula) {
    case "AB":
      if (cardLabA) cardLabA.style.visibility = "visible";
      if (cardLabB) cardLabB.style.visibility = "visible";
      break;
    case "C":
      if (cardCentro) cardCentro.style.visibility = "visible";
      break;
    case "Auditorio":
      if (cardAuditorio) cardAuditorio.style.visibility = "visible";
      break;
    default:
      console.error("Aula no reconocida para admin:", AulaRaw);
  }
}