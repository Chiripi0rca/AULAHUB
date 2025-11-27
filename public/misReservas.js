import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { auth, db } from "./Firebase-Config.js";

// Esperar a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
    
    // Verificar sesión
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario detectado:", user.uid);
            cargarReservas(user.uid);
        } else {
            // Si entra directo sin login, lo mandamos fuera (opcional)
            // window.location.href = "index.html";
            console.log("No hay usuario logueado");
        }
    });
});

async function cargarReservas(uid) {
    const container = document.getElementById('reservas-container');
    const loading = document.getElementById('loading');
    const emptyMsg = document.getElementById('empty-message');

    try {
        // Consulta simple: Traer reservas donde yo sea el profesor
        const reservasRef = collection(db, "reservas");
        const q = query(reservasRef, where("ProfesorUID", "==", uid));

        console.log("Consultando Firestore...");
        const querySnapshot = await getDocs(q);
        console.log("Reservas encontradas:", querySnapshot.size);

        // Ocultar cargando
        if(loading) loading.style.display = 'none';

        // Si no hay datos
        if (querySnapshot.empty) {
            if(emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        let htmlContent = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Datos:", data); // Para depurar en consola

            const statusClass = getStatusClass(data.status); 
            
            // Icono dinámico
            let icono = "computer"; 
            if (data.aula && data.aula.toLowerCase().includes("auditorio")) {
                icono = "podium";
            }

            htmlContent += `
                <div class="card reserva-card">
                    <div class="reserva-header">
                        <div class="aula-icon-small">
                            <span class="material-symbols-outlined">${icono}</span>
                        </div>
                        <div class="reserva-title">
                            <h3>${data.materia || "Sin materia"}</h3>
                            <span>${data.aula || "Aula desconocida"}</span>
                        </div>
                        <span class="status-badge ${statusClass}">${data.status || "Pendiente"}</span>
                    </div>
                    
                    <div class="reserva-details">
                        <p><strong>Horario:</strong> ${data.horario}</p>
                        <p><strong>Grupo:</strong> ${data.grupo}</p>
                        <p><strong>Turno:</strong> ${data.turno}</p>
                    </div>
                </div>
            `;
        });

        if(container) container.innerHTML = htmlContent;

    } catch (error) {
        console.error("Error GRAVE al cargar reservas:", error);
        if(loading) loading.innerText = "Error: " + error.message;
        
        // Si el error es de índices, Firebase te dará un link en la consola (F12)
        if(error.message.includes("index")) {
            alert("Falta crear un índice en Firebase. Revisa la consola (F12) para el link.");
        }
    }
}

function getStatusClass(status) {
    if (status === "Aceptada") return "status-success";
    if (status === "Rechazada") return "status-error";
    return "status-pending"; 
}