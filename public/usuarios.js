import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { auth, db, storage} from "./Firebase-Config.js";

let currentUid = null;

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
  const preview = document.getElementById("preview");
  const AVATAR_DEFAULT = "img/usuario.png";

  if (preview) {
    const cached = localStorage.getItem("avatarURL");
    preview.src = (cached && cached.trim() !== "") ? cached : AVATAR_DEFAULT;
    preview.style.display = "block";

    preview.onerror = () => {
      console.warn("Error cargando imagen, usando avatar por defecto");
      preview.onerror = null;
      preview.src = AVATAR_DEFAULT;
      localStorage.removeItem("avatarURL");
    };
  }

  onAuthStateChanged(auth, async (user) => {
    if (userInfo) {
      userInfo.textContent = user ? user.email : "No hay usuario conectado";
    }

    if (!user) {
      currentUid = null;
      return;
    }

    currentUid = user.uid;

    // Leer documento de roles (donde ya tienes admin, Aula, etc.)
    const userRef = doc(db, "roles", currentUid);

    try {
      const docSnapshot = await getDoc(userRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const isAdmin = data.admin;
        const Aula = data.Aula;
        aplicarRestricciones(isAdmin, Aula);

        if (preview) {
          const url = (typeof data.fotoURL === "string") ? data.fotoURL.trim() : "";
          console.log("fotoURL leída de Firestore:", url || "(vacía)");

          if (url !== "") {
            // Solo reasigna si es distinta a lo que ya se está mostrando
            if (preview.src !== url) {
              preview.src = url;
            }
            localStorage.setItem("avatarURL", url);
          } else {
            preview.src = AVATAR_DEFAULT;
            localStorage.removeItem("avatarURL");
          }

          preview.style.display = "block";
        }
      } else {
        console.error("No se encontró el doc de roles, trato como maestro.");
        aplicarRestricciones(false, null);

        if (preview) {
          preview.src = AVATAR_DEFAULT;
          preview.style.display = "block";
          localStorage.removeItem("avatarURL");
        }
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      aplicarRestricciones(false, null);
    }
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

// FOTO FireBase
const fileInput   = document.getElementById('fileInput');
const uploadBtn   = document.getElementById('uploadBtn');
const status      = document.getElementById('status');

if (uploadBtn && fileInput) {
  // 1) El botón SOLO abre el selector de archivos
  uploadBtn.addEventListener('click', () => {
    fileInput.click();      // ← esto hace que el botón “imite” al input
  });

  // 2) Cuando el usuario elige un archivo, aquí sí subimos
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];

    if (!currentUid) {
      alert("Primero inicia sesión para subir una foto.");
      return;
    }

    if (!file) {
      if (status) status.textContent = 'Selecciona una imagen primero.';
      return;
    }

    // Ruta tipo "usuarios/{uid}/perfil.jpg"
    const fileExt = file.name.split('.').pop();
    const storageRef = ref(storage, `${currentUid}/perfil.${fileExt}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (status) status.textContent = 'Subiendo... ' + progress.toFixed(0) + '%';
      },
      (error) => {
        console.error(error);
        if (status) status.textContent = 'Error al subir: ' + error.message;
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        const userRef = doc(db, "roles", currentUid);
        try {
          await setDoc(userRef, { fotoURL: downloadURL }, { merge: true });
          if (status) status.textContent = 'Subida completa.';

          // Guardar en caché para próximas recargas
          localStorage.setItem("avatarURL", downloadURL);

          if (preview) {
            preview.src = downloadURL;
            preview.style.display = 'block';
          }
        } catch (e) {
          console.error("Error guardando fotoURL en Firestore:", e);
          if (status) status.textContent = 'Error guardando la URL en Firestore.';
        }
      }
    );
  });
}
});