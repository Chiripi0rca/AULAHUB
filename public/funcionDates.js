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

// Vista semanal (nombres neutrales, no-Android)
const weekContainer   = document.getElementById('weekContainer');
const weekRangeText   = document.getElementById('weekRangeText');
const weekTable       = document.getElementById('weekTable');
const prevWeekButton  = document.getElementById('prevWeekButton');
const nextWeekButton  = document.getElementById('nextWeekButton');

// Variables Calendario
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Seguimos usando esto para pintar el rango en el calendario mensual
let startDate = null;
let endDate = null;

// Semana actual y slots seleccionados
let currentWeekStart = getStartOfWeek(new Date());
const selectedSlots = new Set(); // clave "YYYY-MM-DD|07:00 - 08:00"

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    aulaCodigo = urlParams.get('aula');
    aulaNombreReal = getNombreAula(aulaCodigo);

    if (aulaDisplay) aulaDisplay.value = aulaNombreReal;
    
    renderCalendar();

    // Mostrar la vista semanal y pintarla
    if (weekContainer) weekContainer.style.display = 'block';
    renderSemana();
    updateSelectedDatesFromSlots(); // muestra "Selecciona una fecha" al inicio
});

function renderCalendar() {
    if (!calendarBody || !currentMonthElement) return;

    const jsFirstDay = new Date(currentYear, currentMonth, 1).getDay();
    const firstDayIndex = (jsFirstDay - 1 + 7) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    currentMonthElement.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric'
    });

    let days = '';
    for (let i = 0; i < firstDayIndex; i++) {
        days += `<div class="calendar-day empty"></div>`;
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i);
        days += `<div class="calendar-day ${getDayClassName(date)}" onclick="selectDate(${i})">${i}</div>`;
    }
    calendarBody.innerHTML = days;
}

function getDayClassName(date) {
    if (startDate && date.toDateString() === startDate.toDateString()) return 'selected';
    if (endDate && date.toDateString() === endDate.toDateString()) return 'selected';
    if (startDate && endDate && date > startDate && date < endDate) return 'range';
    return '';
}

function formatDate(date) {
    const d = String(date.getDate()).padStart(2,'0');
    const m = String(date.getMonth() + 1).padStart(2,'0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

// Helpers para fechas / semana
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 domingo, 1 lunes...
    const diff = (day === 0 ? -6 : 1 - day); // mover a lunes
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDateShort(d) {
    return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
    });
}

function fechaToISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
}

function parseISODate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function getHorasTurnoActual() {
    const turno = selectTurno ? selectTurno.value : "Matutino";
    return (turno === "Matutino") ? HORAS_MATUTINO : HORAS_VESPERTINO;
}

// Pintar la tabla semanal
function renderSemana() {
    if (!weekTable || !weekRangeText) return;

    const horas = getHorasTurnoActual();
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    weekRangeText.textContent = `${formatDateShort(start)} - ${formatDateShort(end)}`;

    weekTable.innerHTML = '';

    const diasLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']; // Puedes meter sábado/domingo si quieres
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thVacio = document.createElement('th');
    thVacio.textContent = '';
    headerRow.appendChild(thVacio);

    diasLabels.forEach((label, idx) => {
        const th = document.createElement('th');
        const fechaCol = new Date(start);
        fechaCol.setDate(start.getDate() + idx);
        th.textContent = `${label} ${fechaCol.getDate()}`;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    weekTable.appendChild(thead);

    const tbody = document.createElement('tbody');

    horas.forEach(hora => {
        const tr = document.createElement('tr');

        const thHora = document.createElement('th');
        thHora.textContent = hora;
        tr.appendChild(thHora);

        diasLabels.forEach((_, idx) => {
            const td = document.createElement('td');
            td.classList.add('time-slot-cell'); // antes: 'celda-hora'

            const fechaCelda = new Date(start);
            fechaCelda.setDate(start.getDate() + idx);
            const fechaStr = fechaToISO(fechaCelda);
            const key = `${fechaStr}|${hora}`;

            td.dataset.fecha = fechaStr;
            td.dataset.hora  = hora;

            if (selectedSlots.has(key)) {
                td.classList.add('selected');
            }

            td.addEventListener('click', () => {
                if (selectedSlots.has(key)) {
                    selectedSlots.delete(key);
                    td.classList.remove('selected');
                } else {
                    selectedSlots.add(key);
                    td.classList.add('selected');
                }
                updateSelectedDatesFromSlots();
            });

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    weekTable.appendChild(tbody);
}

// Obtener lista ordenada de slots seleccionados
function getSelectedSlots() {
    const slots = [];
    selectedSlots.forEach(key => {
        const [fecha, hora] = key.split('|');
        slots.push({ fecha, hora });
    });
    slots.sort((a, b) => {
        if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
        return a.fecha.localeCompare(b.fecha);
    });
    return slots;
}

// Actualizar texto "Fechas seleccionadas" en base a la tabla
function updateSelectedDatesFromSlots() {
    if (!selectedDatesElement) return;

    const slots = getSelectedSlots();
    if (slots.length === 0) {
        selectedDatesElement.textContent = `Selecciona una fecha`;
        startDate = null;
        endDate = null;
        return;
    }

    const fechasUnicas = [...new Set(slots.map(s => s.fecha))].sort();
    const primera = parseISODate(fechasUnicas[0]);
    const ultima  = parseISODate(fechasUnicas[fechasUnicas.length - 1]);

    startDate = primera;
    endDate   = (fechasUnicas.length > 1) ? ultima : null;

    if (!endDate) {
        selectedDatesElement.textContent = `Fecha: ${formatDate(primera)}`;
    } else {
        selectedDatesElement.textContent = `Fechas: ${formatDate(primera)} al ${formatDate(ultima)}`;
    }

    // Para que el calendario mensual se pinte con la "franja"
    renderCalendar();
}

// Navegación de mes
if (prevBtn) prevBtn.addEventListener('click', () => {
    currentMonth--; 
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
});
if (nextBtn) nextBtn.addEventListener('click', () => {
    currentMonth++; 
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
});

// Ahora al hacer click en un día solo movemos la semana
window.selectDate = function(day) {
    const clickedDate = new Date(currentYear, currentMonth, day);
    currentWeekStart = getStartOfWeek(clickedDate);
    renderCalendar();
    renderSemana();
};

// Al cambiar turno, se repinta la tabla y se limpian selecciones
if (selectTurno) selectTurno.addEventListener('change', () => {
    selectedSlots.clear();
    updateSelectedDatesFromSlots();
    renderSemana();
});

// Botones semana anterior / siguiente
if (prevWeekButton) {
    prevWeekButton.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderSemana();
    });
}

if (nextWeekButton) {
    nextWeekButton.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderSemana();
    });
}

// ----------------- MODAL Y FIREBASE -----------------

const btnPreReservar = document.getElementById('btnPreReservar');
const modal = document.getElementById('modalConfirmacion');
const btnCancelar = document.getElementById('btnCancelar');
const btnEnviar = document.getElementById('btnEnviarReserva');

if (btnPreReservar) {
    btnPreReservar.addEventListener('click', () => {
        const turno = document.getElementById('turno').value;
        const materia = document.getElementById('materia').value;
        const grupo = document.getElementById('grupo').value;

        const slots = getSelectedSlots();

        if (!aulaNombreReal) { alert("Error: Aula no detectada."); return; }
        if (!materia || !grupo) { alert("Completa Materia y Grupo."); return; }
        if (slots.length === 0) { alert("Selecciona al menos un horario en la tabla semanal."); return; }

        // Actualizamos rango para el texto superior
        updateSelectedDatesFromSlots();

        document.getElementById('confAula').innerText = aulaNombreReal;
        document.getElementById('confMateria').innerText = materia;
        document.getElementById('confGrupo').innerText = grupo;
        document.getElementById('confTurno').innerText = turno;
        
        const horasUnicas = [...new Set(slots.map(s => s.hora))];
        document.getElementById('confHoras').innerText = horasUnicas.join(", ");

        const fechasUnicas = [...new Set(slots.map(s => s.fecha))].sort();
        const fechasFormateadas = fechasUnicas.map(f => formatDate(parseISODate(f)));
        document.getElementById('confFechas').innerText = fechasFormateadas.join(", ");

        if (modal) modal.classList.add('active');
    });
}

if (btnCancelar && modal) {
    btnCancelar.addEventListener('click', () => modal.classList.remove('active'));
}

if (btnEnviar) {
    btnEnviar.addEventListener('click', async () => {
        if (!auth.currentUser) { alert("Inicia sesión."); return; }
        btnEnviar.innerText = "Enviando..."; 
        btnEnviar.disabled = true;

        try {
            let nombreProfesor = auth.currentUser.email; 
            const profSnap = await getDoc(doc(db, "profesores", auth.currentUser.uid));
            if (profSnap.exists() && profSnap.data().Nombre) {
                nombreProfesor = profSnap.data().Nombre;
            } else {
                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
                if (userSnap.exists() && userSnap.data().Nombre) {
                    nombreProfesor = userSnap.data().Nombre;
                }
            }

            const turno = document.getElementById('turno').value;
            const materia = document.getElementById('materia').value;
            const grupo = document.getElementById('grupo').value;

            const slots = getSelectedSlots();
            if (slots.length === 0) {
                alert("No hay horarios seleccionados.");
                btnEnviar.innerText = "Confirmar"; 
                btnEnviar.disabled = false;
                return;
            }

            const promesas = [];

            slots.forEach(({fecha, hora}) => {
                promesas.push(addDoc(collection(db, "reservas"), {
                    ProfesorUID: auth.currentUser.uid,
                    profesorName: nombreProfesor,
                    aula: aulaNombreReal,
                    materia: materia,
                    grupo: grupo,
                    turno: turno,
                    fecha: fecha,
                    horario: `${fecha} ${hora}`,
                    status: "Pendiente",
                    timestamp: new Date()
                }));
            });

            await Promise.all(promesas);
            alert("¡Solicitudes enviadas con éxito!");
            window.location.href = "aulas.html"; 
        } catch (error) {
            console.error(error); 
            alert("Error al guardar.");
            btnEnviar.innerText = "Confirmar"; 
            btnEnviar.disabled = false;
        }
    });
}

function getNombreAula(codigo) {
    switch (codigo) {
        case "labA": return "Laboratorio de Cómputo A";
        case "labB": return "Laboratorio de Cómputo B";
        case "centro": return "Laboratorio de Cómputo C";
        case "auditorio": return "Auditorio FIC";
        default: return "Aula desconocida";
    }
}
