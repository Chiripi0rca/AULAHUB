import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { auth, db, storage } from "./Firebase-Config.js";
import { cargarFooter, cargarHeader } from "./layout.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Cargar UI Global
  cargarHeader();
  cargarFooter();

  // 2. Cargar caché de foto inmediatamente (sin esperar a Firebase)
  const cachedPhoto = localStorage.getItem("user_photo");
  const imgPreview = document.getElementById('preview');
  if (cachedPhoto && imgPreview) {
      imgPreview.src = cachedPhoto;
  }

  // --- ELEMENTOS DEL DOM PARA PERFIL ---
  const fileInput = document.getElementById('fileInput');
  const btnSubir = document.getElementById('btnSubirFoto');
  const btnBorrar = document.getElementById('btnBorrarFoto');
  const userInfo = document.getElementById("userinfo");

  // Eventos Foto de Perfil
  if(btnSubir && fileInput) btnSubir.addEventListener('click', () => fileInput.click());
  if(fileInput) fileInput.addEventListener('change', (e) => { if(e.target.files[0] && auth.currentUser) subirFoto(e.target.files[0], auth.currentUser.uid); });
  if(btnBorrar) btnBorrar.addEventListener('click', () => { if(auth.currentUser && confirm("¿Eliminar foto?")) borrarFoto(auth.currentUser.uid); });

  // ======================================================
  // --- LÓGICA DE LOGIN ---
  // ======================================================
  const loginBtn = document.getElementById("login");
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");

  if (loginBtn && emailInput && passInput) {
    
    // Función reutilizable para iniciar sesión
    const realizarLogin = () => {
      const email = emailInput.value;
      const pass = passInput.value;
      if (!email || !pass) return alert("Ingrese ambos campos.");
      
      // Feedback visual (opcional)
      loginBtn.innerText = "Entrando...";
      loginBtn.disabled = true;

      signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            window.location.href = "aulas.html";
        })
        .catch((e) => {
            alert("Error: " + e.message);
            loginBtn.innerText = "Entrar";
            loginBtn.disabled = false;
        });
    };

    // 1. Evento Clic en el botón
    loginBtn.addEventListener("click", realizarLogin);

    // 2. Evento Tecla Enter en los inputs
    const verificarEnter = (e) => {
        if (e.key === "Enter") {
            realizarLogin();
        }
    };

    emailInput.addEventListener("keypress", verificarEnter);
    passInput.addEventListener("keypress", verificarEnter);
  }
  // ======================================================

  // --- LOGOUT ---
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user_photo"); // Limpiar caché al salir
      signOut(auth).then(() => window.location.href = "index.html");
    });
  }

  // --- MONITOR DE AUTENTICACIÓN ---
  onAuthStateChanged(auth, (user) => {
    // Si hay elemento userInfo (en el menú), poner el correo
    if (userInfo) userInfo.textContent = user ? user.email : "Invitado";

    // Si no hay usuario, no hacemos nada más
    if (!user) return;

    // Si hay usuario, cargamos su foto y roles
    cargarFotoPerfil(user.uid);

    const userRef = doc(db, "roles", user.uid);
    getDoc(userRef).then((snap) => {
        if (snap.exists()) aplicarRestricciones(snap.data().admin, snap.data().Aula);
        else aplicarRestricciones(false, null);
    });
  });
});

// --- FUNCIONES DE FOTO DE PERFIL ---

async function subirFoto(file, uid) {
    const imgPreview = document.getElementById('preview');
    const storageRef = ref(storage, `${uid}/fotos_perfil.jpg`);
    try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await setDoc(doc(db, "users", uid), { FotoPerfil: url }, { merge: true });
        localStorage.setItem("user_photo", url); // Actualizar caché
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
            // Sincronizar caché si es diferente
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
        localStorage.removeItem("user_photo"); // Borrar caché
        if(imgPreview) imgPreview.src = "img/usuario.png";
        alert("Foto eliminada.");
    } catch (e) { console.error(e); alert("Error al eliminar."); }
}

// --- FUNCIONES DE ROLES ---

function aplicarRestricciones(isAdminRaw, AulaRaw) {
  const isAdmin = isAdminRaw === true || isAdminRaw === "true";
  const Aula = (AulaRaw || "").trim();
  const cardLabA = document.querySelector(".card[data-aula='labA']");
  const cardLabB = document.querySelector(".card[data-aula='labB']");
  const cardCentro = document.querySelector(".card[data-aula='centro']");
  const cardAuditorio = document.querySelector(".card[data-aula='auditorio']");
  const cards = [cardLabA, cardLabB, cardCentro, cardAuditorio];

  // Solo aplicar si estamos en la página de aulas (donde existen las cartas)
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