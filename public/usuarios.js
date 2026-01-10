import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { auth, db, storage } from "./Firebase-Config.js";
import { actualizarMenu, cargarFooter, cargarHeader } from "./layout.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarHeader();
  cargarFooter();

  // Caché de foto
  const cachedPhoto = localStorage.getItem("user_photo");
  const imgPreview = document.getElementById('preview');
  if (cachedPhoto && imgPreview) {
      imgPreview.src = cachedPhoto;
  }

  // --- ELEMENTOS DEL DOM ---
  const fileInput = document.getElementById('fileInput');
  const btnSubir = document.getElementById('btnSubirFoto');
  const btnBorrar = document.getElementById('btnBorrarFoto');
  const userInfo = document.getElementById("userinfo");

  // Eventos Foto
  if(btnSubir && fileInput) btnSubir.addEventListener('click', () => fileInput.click());
  if(fileInput) fileInput.addEventListener('change', (e) => { if(e.target.files[0] && auth.currentUser) subirFoto(e.target.files[0], auth.currentUser.uid); });
  if(btnBorrar) btnBorrar.addEventListener('click', () => { if(auth.currentUser && confirm("¿Eliminar foto?")) borrarFoto(auth.currentUser.uid); });

  // --- LOGIN ---
  const loginBtn = document.getElementById("login");
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");

  if (loginBtn && emailInput && passInput) {
    const realizarLogin = () => {
      const email = emailInput.value;
      const pass = passInput.value;
      if (!email || !pass) return alert("Ingrese ambos campos.");
      
      loginBtn.innerText = "Entrando...";
      loginBtn.disabled = true;

      signInWithEmailAndPassword(auth, email, pass)
        .then(() => window.location.href = "aulas.html")
        .catch((e) => {
            alert("Error: " + e.message);
            loginBtn.innerText = "Entrar";
            loginBtn.disabled = false;
        });
    };

    loginBtn.addEventListener("click", realizarLogin);
    const verificarEnter = (e) => { if (e.key === "Enter") realizarLogin(); };
    emailInput.addEventListener("keypress", verificarEnter);
    passInput.addEventListener("keypress", verificarEnter);
  }

  // --- MONITOR DE AUTENTICACIÓN ---
  onAuthStateChanged(auth, (user) => {
    if (userInfo) userInfo.textContent = user ? user.email : "Invitado";

    if (!user) {
        // Si no hay usuario, menú básico
        actualizarMenu(false);
        activarLogout(); // <--- IMPORTANTE: Activamos el botón aquí
        return;
    }

    cargarFotoPerfil(user.uid);

    // Verificar Rol
    const userRef = doc(db, "roles", user.uid);
    getDoc(userRef).then((snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const esAdmin = data.admin === true;
            
            // 1. Pintamos el menú correcto
            actualizarMenu(esAdmin);
            
            // 2. Activamos el botón de Logout (justo después de pintarlo)
            activarLogout(); 

            // 3. Restricciones visuales
            aplicarRestricciones(esAdmin, data.Aula);
        } else {
            actualizarMenu(false);
            activarLogout();
            aplicarRestricciones(false, null);
        }
    }).catch(e => {
        console.error(e);
        actualizarMenu(false);
        activarLogout();
    });
  });
});

// --- FUNCIÓN PARA ACTIVAR EL LOGOUT ---
// Esta función busca el botón y le pega el evento directamente
function activarLogout() {
    const btnLogout = document.getElementById("logout");
    if (btnLogout) {
        // Quitamos listeners previos para no duplicar (por si acaso)
        const newBtn = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(newBtn, btnLogout);

        newBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // Borrar caché y salir
            localStorage.removeItem("user_photo");
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        });
    }
}

// --- FUNCIONES AUXILIARES ---

async function subirFoto(file, uid) {
    const imgPreview = document.getElementById('preview');
    const storageRef = ref(storage, `${uid}/fotos_perfil.jpg`);
    try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await setDoc(doc(db, "users", uid), { FotoPerfil: url }, { merge: true });
        localStorage.setItem("user_photo", url);
        if(imgPreview) imgPreview.src = url;
        alert("Foto actualizada");
    } catch (e) { console.error(e); alert("Error al subir."); }
}

async function cargarFotoPerfil(uid) {
    const imgPreview = document.getElementById('preview');
    try {
        const docSnap = await getDoc(doc(db, "users", uid));
        if (docSnap.exists() && docSnap.data().FotoPerfil) {
            const url = docSnap.data().FotoPerfil;
            if(imgPreview) imgPreview.src = url;
            if (localStorage.getItem("user_photo") !== url) localStorage.setItem("user_photo", url);
        }
    } catch (e) { console.error(e); }
}

async function borrarFoto(uid) {
    const imgPreview = document.getElementById('preview');
    const storageRef = ref(storage, `${uid}/fotos_perfil.jpg`);
    try {
        await deleteObject(storageRef).catch(() => {});
        await updateDoc(doc(db, "users", uid), { FotoPerfil: deleteField() });
        localStorage.removeItem("user_photo");
        if(imgPreview) imgPreview.src = "img/usuario.png";
        alert("Foto eliminada.");
    } catch (e) { console.error(e); alert("Error al eliminar."); }
}

function aplicarRestricciones(isAdminRaw, AulaRaw) {
  const isAdmin = isAdminRaw === true || isAdminRaw === "true";
  const Aula = (AulaRaw || "").trim();
  const cardLabA = document.querySelector(".card[data-aula='labA']");
  const cardLabB = document.querySelector(".card[data-aula='labB']");
  const cardCentro = document.querySelector(".card[data-aula='centro']");
  const cardAuditorio = document.querySelector(".card[data-aula='auditorio']");
  const cards = [cardLabA, cardLabB, cardCentro, cardAuditorio];

  if(document.querySelector('.aula-list')) {
      if (!isAdmin) {
        cards.forEach(c => { if (c) c.style.visibility = "visible"; });
        return;
      }
      cards.forEach(c => { if (c) c.style.visibility = "hidden"; });
      switch (Aula) {
        case "AB": if (cardLabA) cardLabA.style.visibility = "visible"; if (cardLabB) cardLabB.style.visibility = "visible"; break;
        case "C": if (cardCentro) cardCentro.style.visibility = "visible"; break;
        case "Auditorio": if (cardAuditorio) cardAuditorio.style.visibility = "visible"; break;
      }
  }
}