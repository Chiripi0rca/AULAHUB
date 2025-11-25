import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { auth, db, storage } from "./Firebase-Config.js";
import { cargarFooter, cargarHeader } from "./layout.js";

document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Cargar UI
  cargarHeader();
  cargarFooter();

  // --- NUEVO: CARGA INSTANTÁNEA DESDE CACHÉ (localStorage) ---
  // Esto elimina el "pop" porque no espera a Firebase
  const cachedPhoto = localStorage.getItem("user_photo");
  const imgPreview = document.getElementById('preview');
  if (cachedPhoto && imgPreview) {
      imgPreview.src = cachedPhoto;
  }
  // -------------------------------------------------------------

  // 2. Elementos del DOM
  const fileInput = document.getElementById('fileInput');
  const btnSubir = document.getElementById('btnSubirFoto');
  const btnBorrar = document.getElementById('btnBorrarFoto');
  const userInfo = document.getElementById("userinfo");

  // --- EVENT LISTENERS ---
  if(btnSubir && fileInput){
      btnSubir.addEventListener('click', () => fileInput.click());
  }

  if(fileInput){
      fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if(file && auth.currentUser) subirFoto(file, auth.currentUser.uid);
      });
  }

  if(btnBorrar){
      btnBorrar.addEventListener('click', () => {
          if(auth.currentUser && confirm("¿Eliminar foto de perfil?")) borrarFoto(auth.currentUser.uid);
      });
  }

  // --- LOGIN ---
  const loginBtn = document.getElementById("login");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      if (!email || !password) return alert("Ingrese ambos campos.");
      
      signInWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = "aulas.html")
        .catch((error) => alert("Error: " + error.message));
      });
  }

  // --- LOGOUT ---
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // --- NUEVO: LIMPIAR CACHÉ AL SALIR ---
      localStorage.removeItem("user_photo"); 
      signOut(auth).then(() => window.location.href = "index.html");
    });
  }

  // --- MONITOR DE USUARIO ---
  onAuthStateChanged(auth, (user) => {
    if (userInfo) userInfo.textContent = user ? user.email : "Invitado";

    if (!user) {
        if (!window.location.pathname.includes("index.html")) {
             // window.location.href = "index.html"; 
        }
        return;
    }

    // Cargar foto de Firebase (para asegurar que esté actualizada)
    cargarFotoPerfil(user.uid);

    // Roles
    const userRef = doc(db, "roles", user.uid);
    getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          aplicarRestricciones(docSnapshot.data().admin, docSnapshot.data().Aula);
        } else {
          aplicarRestricciones(false, null);
        }
      });
  });
});

// --- FUNCIONES OPTIMIZADAS CON CACHÉ ---

async function subirFoto(file, uid) {
    const imgPreview = document.getElementById('preview');
    const storageRef = ref(storage, `${uid}/fotos_perfil.jpg`);

    try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await setDoc(doc(db, "users", uid), { FotoPerfil: url }, { merge: true });

        // --- NUEVO: ACTUALIZAR CACHÉ ---
        localStorage.setItem("user_photo", url);
        
        if(imgPreview) imgPreview.src = url;
        alert("Foto actualizada");

    } catch (error) {
        console.error(error);
        alert("Error al subir imagen.");
    }
}

async function cargarFotoPerfil(uid) {
    const imgPreview = document.getElementById('preview');
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.FotoPerfil) {
                // Actualizamos la imagen
                if(imgPreview) imgPreview.src = data.FotoPerfil;
                
                // --- NUEVO: Sincronizar Caché ---
                // Si la foto en la base de datos es diferente a la del caché, actualizamos el caché
                if (localStorage.getItem("user_photo") !== data.FotoPerfil) {
                    localStorage.setItem("user_photo", data.FotoPerfil);
                }
            }
        }
    } catch (error) {
        console.error("Error al cargar foto:", error);
    }
}

async function borrarFoto(uid) {
    const imgPreview = document.getElementById('preview');
    const storageRef = ref(storage, `${uid}/fotos_perfil.jpg`);

    try {
        await deleteObject(storageRef).catch(e => console.log("No había imagen en storage"));
        
        const docRef = doc(db, "users", uid);
        await updateDoc(docRef, { FotoPerfil: deleteField() });

        // --- NUEVO: LIMPIAR CACHÉ ---
        localStorage.removeItem("user_photo");

        if(imgPreview) imgPreview.src = "img/usuario.png"; 
        alert("Foto eliminada.");

    } catch (error) {
        console.error(error);
        alert("Error al eliminar foto.");
    }
}

function aplicarRestricciones(isAdminRaw, AulaRaw) {
  const isAdmin = isAdminRaw === true || isAdminRaw === "true";
  const Aula = (AulaRaw || "").trim();
  const cardLabA = document.querySelector(".card[data-aula='labA']");
  const cardLabB = document.querySelector(".card[data-aula='labB']");
  const cardCentro = document.querySelector(".card[data-aula='centro']");
  const cardAuditorio = document.querySelector(".card[data-aula='auditorio']");
  const cards = [cardLabA, cardLabB, cardCentro, cardAuditorio];

  // IMPORTANTE: Modificamos esto para que no oculte las cartas en la página de Ayuda
  // Si estamos en aulas.html (donde existen las cartas con onclick), aplicamos lógica.
  // Si las cartas son solo visuales (como en ayuda), no hacemos nada.
  
  if(document.querySelector('.aula-list') || document.querySelector('.grid-container')) {
      if (!isAdmin) {
        cards.forEach(card => { if (card) card.style.visibility = "visible"; });
        return;
      }
      
      // Si es admin, ocultamos y mostramos solo la suya
      cards.forEach(card => { if (card) card.style.visibility = "hidden"; });

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
      }
  }
}