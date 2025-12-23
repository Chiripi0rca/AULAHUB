import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { auth } from "./Firebase-Config.js";

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Mostrar email del usuario actual
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const emailText = document.getElementById("user-email");
            if(emailText) emailText.innerText = user.email;
        } else {
            window.location.href = "index.html";
        }
    });

    // 2. Lógica del botón Cambiar Contraseña
    const btnReset = document.getElementById("btnResetPassword");
    
    if(btnReset) {
        btnReset.addEventListener("click", async () => {
            const user = auth.currentUser;
            if(!user) return;

            if(confirm(`¿Enviar correo de restablecimiento a ${user.email}?`)) {
                try {
                    btnReset.innerText = "Enviando...";
                    btnReset.disabled = true;

                    auth.languageCode = 'es'; 

                    await sendPasswordResetEmail(auth, user.email);

                    alert("Correo enviado. Revisa tu bandeja de entrada.");
                    btnReset.innerText = "Correo Enviado";
                    
                } catch (error) {
                    console.error(error);
                    alert("Error: " + error.message);
                    btnReset.innerText = "Reintentar";
                    btnReset.disabled = false;
                }
            }
        });
    }
});