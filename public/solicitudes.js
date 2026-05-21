/* solicitudes.js - Con Sistema de Notificaciones */
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
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
    try {
        const roleSnap = await getDoc(doc(db, "roles", uid));
        if (!roleSnap.exists() || !roleSnap.data().admin) return;
        const data = roleSnap.data();
        currentAulaAdmin = data.Aula || data.aula;
        currentTurnoAdmin = data.Horario || data.horario || data.Turno || data.turno;
        if (currentTurnoAdmin && currentAulaAdmin) {
            cargarSolicitudes(currentAulaAdmin, currentTurnoAdmin, "Pendiente");
        }
    } catch (e) { console.error(e); }
}

async function cargarSolicitudes(aulaAdmin, turnoAdmin, statusFilter) {
    const container = document.getElementById('solicitudes-container');
    const loading = document.getElementById('loading');
    const emptyMsg = document.getElementById('empty-message');
    
    if(container) container.innerHTML = "";
    if(emptyMsg) emptyMsg.style.display = 'none';
    if(loading) loading.style.display = 'block';

    let aulasAFiltrar = [];
    const aulaStr = String(aulaAdmin).trim();
    if (aulaStr === "AB") aulasAFiltrar = ["Laboratorio de Cómputo A", "Laboratorio de Cómputo B"];
    else if (aulaStr === "C") aulasAFiltrar = ["Laboratorio de Cómputo C"];
    else if (aulaStr === "Auditorio") aulasAFiltrar = ["Auditorio FIC"];
    else if (aulaStr === "CD") aulasAFiltrar = ["Laboratorio de Ciencia de Datos"];
    else if (aulaStr === "Posgrado") aulasAFiltrar = ["Laboratorio de Posgrado"];
    else if (aulaStr === "Todas") aulasAFiltrar = ["Laboratorio de Cómputo A", "Laboratorio de Cómputo B", "Laboratorio de Cómputo C", "Auditorio FIC", "Laboratorio de Ciencia de Datos", "Laboratorio de Posgrado"];
    else aulasAFiltrar = [aulaStr];

    try {
        const q = query(
            collection(db, "reservas"),
            where("status", "==", statusFilter),
            where("turno", "==", turnoAdmin)
        );

        const snapshot = await getDocs(q);
        if(loading) loading.style.display = 'none';

        if (snapshot.empty) {
            if(emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        let html = "";
        snapshot.forEach(doc => {
            const r = doc.data();
            const id = doc.id;
            const icono = (r.aula && r.aula.toLowerCase().includes("auditorio")) ? "podium" : "computer";
            const nombreMostrar = r.profesorName || "Profesor";

            let botonesHtml = "";
            if (statusFilter === "Pendiente") {
                const safeMateria = (r.materia || "").replace(/'/g, "\\'");
                const safeFecha = (r.fecha || "").replace(/'/g, "\\'");
                const safeHora = (r.horario || "").replace(/'/g, "\\'");
                const uidProf = r.ProfesorUID || "";
                const esAulaPropia = aulasAFiltrar.includes(r.aula);

                if (esAulaPropia) {
                    botonesHtml = `
                    <div class="solicitud-actions">
                        <button onclick="responderSolicitud('${id}', 'Rechazada', '${uidProf}', '${safeMateria}', '${safeFecha}', '${safeHora}')" class="btn-rechazar">Rechazar</button>
                        <button onclick="responderSolicitud('${id}', 'Aceptada', '${uidProf}', '${safeMateria}', '${safeFecha}', '${safeHora}', '${r.aula}')" class="btn-aceptar">Aceptar</button>
                    </div>`;
                } else {
                    botonesHtml = `<div class="solicitud-actions"><span class="badge-solo-vista">Solo visualización</span></div>`;
                }
            } else {
                let colorClass = statusFilter === "Aceptada" ? "text-green" : "text-red";
                botonesHtml = `<div class="solicitud-actions"><span class="${colorClass}">Estado: ${statusFilter}</span></div>`;
            }

            html += `
            <div class="card solicitud-card" id="card-${id}">
                <div class="solicitud-header">
                    <div class="aula-icon-small"><span class="material-symbols-outlined">${icono}</span></div>
                    <div class="solicitud-info">
                        <h3>${r.materia || "Sin materia"}</h3>
                        <span class="profesor-name">${nombreMostrar}</span>
                    </div>
                </div>
                <div class="solicitud-body">
                    <p><strong>Aula:</strong> ${r.aula}</p>
                    <p><strong>Grupo:</strong> ${r.grupo}</p>
                    <p><strong>Horario:</strong> ${r.horario}</p>
                    <p><strong>Fecha:</strong> ${r.fecha || "N/A"}</p>
                </div>
                ${botonesHtml}
            </div>`;
        });
        if(container) container.innerHTML = html;

    } catch (error) { console.error("Error:", error); }
}


window.responderSolicitud = async (id, nuevoStatus, uidProfesor, materia, fecha, horario, aula) => {
    const card = document.getElementById(`card-${id}`);
    if(card) { card.style.opacity = "0.5"; card.style.pointerEvents = "none"; }

    try {
        await updateDoc(doc(db, "reservas", id), { status: nuevoStatus });
        await enviarNotificacion(uidProfesor, materia, nuevoStatus, fecha, horario);

        if (nuevoStatus === "Aceptada" && aula && horario) {
            await rechazarConflictos(aula, horario, id);
        }

        if(currentAulaAdmin && currentTurnoAdmin) {
            const filterSelect = document.getElementById("statusFilter");
            cargarSolicitudes(currentAulaAdmin, currentTurnoAdmin, filterSelect ? filterSelect.value : "Pendiente");
        }

    } catch (e) {
        console.error(e);
        alert("Error al procesar.");
        if(card) { card.style.opacity = "1"; card.style.pointerEvents = "all"; }
    }
};

async function enviarNotificacion(uidDestino, materia, status, fecha, horario) {
    if (!uidDestino) return;
    try {
        await addDoc(collection(db, "notificaciones"), {
            destinatarioUid: uidDestino,
            titulo: `Reserva ${status}`,
            mensaje: `Tu solicitud para ${materia} (${horario}) ha sido ${status.toLowerCase()}.`,
            leido: false,
            fecha: serverTimestamp(),
            tipo: "estado_reserva"
        });
        console.log("Notificación enviada web");
    } catch (e) {
        console.error("Error enviando notificación:", e);
    }
}

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
                const data = d.data();
                updates.push(updateDoc(doc(db, "reservas", d.id), { status: "Rechazada" }));

                updates.push(enviarNotificacion(
                    data.ProfesorUID,
                    data.materia,
                    "Rechazada",
                    data.fecha,
                    data.horario
                ));
            }
        });

        if(updates.length > 0) {
            await Promise.all(updates);
            console.log("Conflictos rechazados y notificados.");
        }
    } catch (error) { console.error("Error conflictos:", error); }
}