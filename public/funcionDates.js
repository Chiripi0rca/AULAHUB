/* funcionDates.js */
import { addDoc, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { auth, db } from "./Firebase-Config.js";

const HORAS_MATUTINO = ["07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00"];
const HORAS_VESPERTINO = ["14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00"];

let aulaNombreReal = ""; 
let aulaCodigo = "";     

// Elementos
const calendarBody = document.getElementById('calendarBody');
const currentMonthElement = document.getElementById('currentMonth');
const selectedDatesElement = document.getElementById('selectedDates');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const containerHoras = document.getElementById('containerHoras');
const selectTurno = document.getElementById('turno');
const aulaDisplay = document.getElementById('aulaDisplay');

// Variables Calendario
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let startDate = null;
let endDate = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    aulaCodigo = urlParams.get('aula');
    aulaNombreReal = getNombreAula(aulaCodigo);

    if(aulaDisplay) aulaDisplay.value = aulaNombreReal;
    
    renderCalendar();
    updateSelectedDates();
    renderHoras("Matutino");
});

function renderCalendar(){
    if (!calendarBody || !currentMonthElement) return;

    const jsFirstDay = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayIndex = (jsFirstDay - 1 + 7) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    currentMonthElement.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-MX',{month: 'long', year: 'numeric'});

    let days = '';
    for (let i = 0; i < firstDayIndex; i++) days += `<div class="calendar-day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        days += `<div class="calendar-day ${getDayClassName(date)}" onclick="selectDate(${i})">${i}</div>`;
    }
    calendarBody.innerHTML = days;
}

function getDayClassName(date){
    if (startDate && date.toDateString() === startDate.toDateString()) return 'selected';
    if (endDate && date.toDateString() === endDate.toDateString()) return 'selected';
    if (startDate && endDate && date > startDate && date < endDate) return 'range';
    return '';
}

function formatDate(date){
    const d = String(date.getDate()).padStart(2,'0');
    const m = String(date.getMonth()+1).padStart(2,'0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function updateSelectedDates(){
    if (!selectedDatesElement) return;
    if(startDate && endDate) selectedDatesElement.textContent = `Fechas: ${formatDate(startDate)} al ${formatDate(endDate)}`;
    else if (startDate) selectedDatesElement.textContent = `Fecha: ${formatDate(startDate)}`;
    else selectedDatesElement.textContent = `Selecciona una fecha`;
}

if(prevBtn) prevBtn.addEventListener('click',()=>{ currentMonth--; renderCalendar(); });
if(nextBtn) nextBtn.addEventListener('click',()=>{ currentMonth++; renderCalendar(); });

window.selectDate = function(day){
    const clickedDate = new Date(currentYear, currentMonth, day);
    if (!startDate || endDate){ startDate = clickedDate; endDate = null; }
    else if (clickedDate < startDate) startDate = clickedDate;
    else if (clickedDate > startDate) endDate = clickedDate;
    renderCalendar();
    updateSelectedDates();
}

function renderHoras(turno) {
    if(!containerHoras) return;
    containerHoras.innerHTML = ""; 
    const listaHoras = (turno === "Matutino") ? HORAS_MATUTINO : HORAS_VESPERTINO;

    listaHoras.forEach((hora, index) => {
        const wrapper = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox"; checkbox.id = `hora-${index}`; checkbox.name = "horaSeleccionada"; checkbox.value = hora;
        const label = document.createElement('label');
        label.htmlFor = `hora-${index}`; label.className = "hora-chip"; label.innerText = hora;
        wrapper.appendChild(checkbox); wrapper.appendChild(label);
        containerHoras.appendChild(wrapper);
    });
}

if(selectTurno) selectTurno.addEventListener('change', (e) => renderHoras(e.target.value));

const btnPreReservar = document.getElementById('btnPreReservar');
const modal = document.getElementById('modalConfirmacion');
const btnCancelar = document.getElementById('btnCancelar');
const btnEnviar = document.getElementById('btnEnviarReserva');

if(btnPreReservar) {
    btnPreReservar.addEventListener('click', () => {
        const turno = document.getElementById('turno').value;
        const materia = document.getElementById('materia').value;
        const grupo = document.getElementById('grupo').value;

        if(!aulaNombreReal) { alert("Error: Aula no detectada."); return; }
        if(!materia || !grupo) { alert("Completa Materia y Grupo."); return; }
        if(!startDate) { alert("Selecciona una fecha."); return; }

        const checkboxes = document.querySelectorAll('input[name="horaSeleccionada"]:checked');
        if(checkboxes.length === 0) { alert("Selecciona al menos una hora."); return; }

        document.getElementById('confAula').innerText = aulaNombreReal;
        document.getElementById('confMateria').innerText = materia;
        document.getElementById('confGrupo').innerText = grupo;
        document.getElementById('confTurno').innerText = turno;
        
        const horasElegidas = Array.from(checkboxes).map(cb => cb.value).join(", ");
        document.getElementById('confHoras').innerText = horasElegidas;
        document.getElementById('confFechas').innerText = endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : formatDate(startDate);

        if(modal) modal.classList.add('active');
    });
}

if(btnCancelar && modal) btnCancelar.addEventListener('click', () => modal.classList.remove('active'));

if(btnEnviar) {
    btnEnviar.addEventListener('click', async () => {
        if(!auth.currentUser) { alert("Inicia sesión."); return; }
        btnEnviar.innerText = "Enviando..."; btnEnviar.disabled = true;

        try {
            let nombreProfesor = auth.currentUser.email; 
            const profSnap = await getDoc(doc(db, "profesores", auth.currentUser.uid));
            if (profSnap.exists() && profSnap.data().Nombre) nombreProfesor = profSnap.data().Nombre;
            else {
                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userSnap.exists() && userSnap.data().Nombre) nombreProfesor = userSnap.data().Nombre;
            }

            const turno = document.getElementById('turno').value;
            const materia = document.getElementById('materia').value;
            const grupo = document.getElementById('grupo').value;
            const checkboxes = document.querySelectorAll('input[name="horaSeleccionada"]:checked');
            const horasElegidas = Array.from(checkboxes).map(cb => cb.value);

            const promesas = [];
            let fechaIterador = new Date(startDate);
            let fechaFin = endDate ? new Date(endDate) : new Date(startDate);
            
            while (fechaIterador <= fechaFin) {
                const fStr = `${fechaIterador.getFullYear()}-${String(fechaIterador.getMonth()+1).padStart(2,'0')}-${String(fechaIterador.getDate()).padStart(2,'0')}`;
                horasElegidas.forEach(hora => {
                    promesas.push(addDoc(collection(db, "reservas"), {
                        ProfesorUID: auth.currentUser.uid, profesorName: nombreProfesor, aula: aulaNombreReal,
                        materia: materia, grupo: grupo, turno: turno, fecha: fStr, horario: `${fStr} ${hora}`,
                        status: "Pendiente", timestamp: new Date()
                    }));
                });
                fechaIterador.setDate(fechaIterador.getDate() + 1);
            }

            await Promise.all(promesas);
            alert("¡Solicitudes enviadas con éxito!");
            window.location.href = "aulas.html"; 
        } catch (error) {
            console.error(error); alert("Error al guardar.");
            btnEnviar.innerText = "Confirmar"; btnEnviar.disabled = false;
        }
    });
}

function getNombreAula(codigo) {
    switch(codigo) {
        case "labA": return "Laboratorio de Cómputo A";
        case "labB": return "Laboratorio de Cómputo B";
        case "centro": return "Laboratorio de Cómputo C";
        case "auditorio": return "Auditorio FIC";
        default: return "Aula desconocida";
    }
}