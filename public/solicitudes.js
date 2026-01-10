/* solicitudes.js - Con Rechazo Automático de Conflictos */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { auth, db } from "./Firebase-Config.js";

let currentAulaAdmin = "";
let currentTurnoAdmin = "";

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            verificarAdminYCargar(user.uid);
        } else {
            window.location.href = "index.html";
        }
    });

    const filterSelect = document.getElementById("statusFilter");
    if(filterSelect) {
        filterSelect.addEventListener("change", () => {
            if(currentAulaAdmin && currentTurnoAdmin) {
                cargarSolicitudes(currentAulaAdmin, currentTurnoAdmin, filterSelect.value);
            }
        });
    }
});

async function verificarAdminYCargar(uid) {
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    
    try {
        const roleSnap = await getDoc(doc(db, "roles", uid));
        
        if (!roleSnap.exists() || !roleSnap.data().admin) {
            if(loading) loading.style.display = 'none';
            if(errorMsg) errorMsg.style.display = 'block';
            return;
        }

        const data = roleSnap.data();
        
        // Lectura robusta
        currentAulaAdmin = data.Aula || data.aula; 
        currentTurnoAdmin = data.Horario || data.horario || data.Turno || data.turno; 

        if (!currentTurnoAdmin || !currentAulaAdmin) {
            if(loading) loading.innerText = "Error: Faltan datos de Aula o Horario en tu usuario.";
            return;
        }

        // Cargar pendientes por defecto
        cargarSolicitudes(currentAulaAdmin, currentTurnoAdmin, "Pendiente");

    } catch (e) {
        console.error(e);
        if(loading) loading.innerText = "Error: " + e.message;
    }
}

async function cargarSolicitudes(aulaAdmin, turnoAdmin, statusFilter) {
    const container = document.getElementById('solicitudes-container');
    const loading = document.getElementById('loading');
    const emptyMsg = document.getElementById('empty-message');
    
    if(container) container.innerHTML = "";
    if(emptyMsg) emptyMsg.style.display = 'none';
    if(loading) {
        loading.style.display = 'block';
        loading.innerText = `Cargando solicitudes (${statusFilter})...`;
    }

    let aulasAFiltrar = [];
    const aulaStr = String(aulaAdmin).trim();

    if (aulaStr === "AB") {
        aulasAFiltrar = ["Laboratorio de Cómputo A", "Laboratorio de Cómputo B"];
    } else if (aulaStr === "C") {
        aulasAFiltrar = ["Laboratorio de Cómputo C"];
    } else if (aulaStr === "Auditorio") {
        aulasAFiltrar = ["Auditorio FIC"];
    } else {
        aulasAFiltrar = [aulaStr];
    }

    try {
        const q = query(
            collection(db, "reservas"),
            where("status", "==", statusFilter),
            where("turno", "==", turnoAdmin),
            where("aula", "in", aulasAFiltrar)
        );

        const snapshot = await getDocs(q);
        if(loading) loading.style.display = 'none';

        if (snapshot.empty) {
            if(emptyMsg) {
                emptyMsg.style.display = 'block';
                if (statusFilter === "Pendiente") {
                    emptyMsg.innerHTML = `
                        <span class="material-symbols-outlined" style="font-size: 48px; display:block; margin: 0 auto 10px; color: #16a34a;">check_circle</span>
                        ¡Todo limpio! No hay solicitudes pendientes.
                    `;
                } else {
                    emptyMsg.innerHTML = `
                        <span class="material-symbols-outlined" style="font-size: 48px; display:block; margin: 0 auto 10px; color: #9ca3af;">folder_off</span>
                        No hay solicitudes <b>${statusFilter}s</b>.
                    `;
                }
            }
            return;
        }

        let html = "";
        snapshot.forEach(doc => {
            const r = doc.data();
            const id = doc.id;
            
            let icono = "computer";
            if(r.aula && r.aula.toLowerCase().includes("auditorio")) icono = "podium";
            const nombreMostrar = r.profesorName || r.emailUsuario || "Profesor";

            let botonesHtml = "";
            if (statusFilter === "Pendiente") {
                // Pasamos AULA y HORARIO para poder rechazar conflictos
                botonesHtml = `
                <div class="solicitud-actions">
                    <button onclick="responderSolicitud('${id}', 'Rechazada')" class="btn-rechazar">Rechazar</button>
                    <button onclick="responderSolicitud('${id}', 'Aceptada', '${r.aula}', '${r.horario}')" class="btn-aceptar">Aceptar</button>
                </div>`;
            } else {
                let colorClass = statusFilter === "Aceptada" ? "text-green" : "text-red";
                botonesHtml = `
                <div class="solicitud-actions" style="border-top: 1px solid #eee; padding-top: 10px; justify-content: center;">
                    <span style="font-weight: bold; font-size: 14px;" class="${colorClass}">Estado: ${statusFilter}</span>
                </div>`;
            }

            html += `
            <div class="card solicitud-card" id="card-${id}">
                <div class="solicitud-header">
                    <div class="aula-icon-small">
                        <span class="material-symbols-outlined">${icono}</span>
                    </div>
                    <div class="solicitud-info">
                        <h3>${r.materia || "Sin materia"}</h3>
                        <span class="profesor-name">${nombreMostrar}</span>
                    </div>
                </div>

                <div class="solicitud-body">
                    <p><strong>Aula:</strong> ${r.aula}</p>
                    <p><strong>Grupo:</strong> ${r.grupo} - ${r.turno}</p>
                    <p><strong>Horario:</strong> ${r.horario}</p>
                    <p><strong>Fecha:</strong> ${r.fecha || "N/A"}</p>
                </div>
                
                ${botonesHtml}
            </div>
            `;
        });

        if(container) container.innerHTML = html;

    } catch (error) {
        console.error("Error:", error);
        if(loading) loading.innerText = "Error: " + error.message;
    }
}

// --- FUNCIÓN INTELIGENTE: Responder y Limpiar Conflictos ---
window.responderSolicitud = async (id, nuevoStatus, aula, horario) => {
    const card = document.getElementById(`card-${id}`);
    
    try {
        if(card) {
            card.style.opacity = "0.5";
            card.style.pointerEvents = "none";
        }
        
        // 1. Actualizar la reserva principal
        await updateDoc(doc(db, "reservas", id), { status: nuevoStatus });

        // 2. Si se ACEPTÓ, buscar y rechazar conflictos (Igual que en Android)
        if (nuevoStatus === "Aceptada" && aula && horario) {
            await rechazarConflictos(aula, horario, id);
        }

        // 3. Recargar la lista completa (para que desaparezcan los rechazados automáticos)
        if(currentAulaAdmin && currentTurnoAdmin) {
            const filterSelect = document.getElementById("statusFilter");
            const status = filterSelect ? filterSelect.value : "Pendiente";
            cargarSolicitudes(currentAulaAdmin, currentTurnoAdmin, status);
        } else {
            // Fallback visual si no se recarga
            if(card) card.remove();
        }

    } catch (e) {
        console.error(e);
        alert("Error al actualizar.");
        if(card) { card.style.opacity = "1"; card.style.pointerEvents = "all"; }
    }
};

// Busca otras solicitudes pendientes para el mismo AULA y HORA y las rechaza
async function rechazarConflictos(aula, horario, idExcluido) {
    try {
        const q = query(
            collection(db, "reservas"),
            where("aula", "==", aula),
            where("horario", "==", horario),
            where("status", "==", "Pendiente")
        );
        
        const snapshot = await getDocs(q);
        const updates = [];

        snapshot.forEach(d => {
            if (d.id !== idExcluido) {
                console.log(`Auto-rechazando conflicto: ${d.id}`);
                updates.push(updateDoc(doc(db, "reservas", d.id), { status: "Rechazada" }));
            }
        });

        if(updates.length > 0) {
            await Promise.all(updates);
            alert(`Se aceptó la solicitud y se rechazaron automáticamente ${updates.length} conflicto(s) de horario.`);
        } else {
            // Solo feedback simple
             console.log("Solicitud aceptada sin conflictos.");
        }

    } catch (error) {
        console.error("Error al rechazar conflictos:", error);
    }
}