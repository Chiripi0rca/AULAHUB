                /* Funcion de la lista */

        var subMenu = document.querySelector('.submenu');
        var openSubMenu = document.querySelector('.abrirmenu');

        openSubMenu.addEventListener('click', function() {
            subMenu.classList.toggle('show');
        })

        document.addEventListener('click', function(e) {
            if(subMenu.classList.contains('show') && !subMenu.contains(e.target)
            && !openSubMenu.contains(e.target)){

                subMenu.classList.remove('show');
            }
        })

                /* Funcion de las notificaciones */

        const btn = document.querySelector('.notificacion')
        const toasts = document.querySelector('.toasts')

        btn.addEventListener('click', showToast);

        function showToast(){
            const notificaciones = document.createElement('div');

            notificaciones.classList.add('toast');
            notificaciones.innerText = 'Vacio';

            toasts.appendChild(notificaciones);

            setTimeout( () => notificaciones.remove(), 3000);
        }
        
                /* Funcion de la usuario */

        var menuUsuario = document.querySelector('.subusuario');
        var abrirUsuario = document.querySelector('.usuario');

        abrirUsuario.addEventListener('click', function() {
            menuUsuario.classList.toggle('show');
        })

        document.addEventListener('click', function(e) {
            if(menuUsuario.classList.contains('show') && !menuUsuario.contains(e.target)
            && !abrirUsuario.contains(e.target)){

                menuUsuario.classList.remove('show');
            }
        })
                /* Funcion del calendario*/
        const currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        let startDate = null;
        let endDate = null;

        const calendarDaysHeader = document.querySelector('.calendar-days')
        const calendarBody = document.getElementById('calendarBody');
        const currentMonthElement = document.getElementById('currentMonth');
        const selectedDatesElement = document.getElementById('selectedDates');

        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        const weekdaynames = ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'];

        function renderCalendar(){
            const jsFirstDay = new Date(currentYear, currentMonth, 1).getDay();
            const firstDayIndex = (jsFirstDay - 1 + 7) % 7;

            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            currentMonthElement.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-MX',{month: 'long', year: 'numeric'});

            let days = '';

            for (let i = 0; i < firstDayIndex; i++) {
                days += `<div class="calendar-day empty"></div>`;
            }

            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(currentYear, currentMonth, i);
                const className = getDayClassName(date);
                days += `<div class="calendar-day ${className}" onclick="selectDate(${i})">${i}</div>`;
            }

            calendarBody.innerHTML = days;
        }

    function changeMonth(delta){
      currentMonth += delta;
      if (currentMonth < 0){
        currentMonth = 11;
        currentYear -= 1;
      } else if (currentMonth > 11){
        currentMonth = 0;
        currentYear += 1;
      }
      renderCalendar();
    }

    function renderWeekdays(){
        calendarDaysHeader.innerHTML = weekdaynames
        .map(name => `<div class="calendar-weekday">${name}</div>`).join('');
    }

        prevBtn.addEventListener('click',()=>{
            currentMonth--;
            renderCalendar();
        });
        nextBtn.addEventListener('click',()=>{
            currentMonth++;
            renderCalendar();
        });

        window.selectDate = function(day){
            const clickedDate = new Date(currentYear, currentMonth, day);
            if (!startDate || endDate){
                startDate = clickedDate;
                endDate = null;
            } else if (clickedDate < startDate){
                startDate = clickedDate;
            } else if (clickedDate > startDate){
                endDate = clickedDate;
            }

            renderCalendar();
            updateSelectedDates();
        }

        function updateSelectedDates(){
            if(startDate && endDate){
                selectedDatesElement.textContent = `Fechas seleccionadas: ${formatDate(startDate)} - ${formatDate(endDate)}`;
            } else if (startDate){
                selectedDatesElement.textContent = `Fechas seleccionadas: ${formatDate(startDate)}`;
            } else {
                selectedDatesElement.textContent = `Fechas seleccionadas:`;
            }
        }

        function getDayClassName(date){
            if (startDate && date.toDateString() === startDate.toDateString()){
                return 'selected';
            }
            if (endDate && date.toDateString() === endDate.toDateString()){
                return 'selected';
            }
            if (startDate && endDate && date > startDate && date < endDate){
                return 'range';
            }
            return '';
        }

        function formatDate(date){
            const d = String(date.getDate()).padStart(2,'0');
            const m = String(date.getMonth()+1).padStart(2,'0');
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        }

        renderWeekdays();
        renderCalendar();
        updateSelectedDates();