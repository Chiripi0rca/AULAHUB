/*Función para mostrar/ocultar el submenu*/

    // Función para mostrar/ocultar el submenu
    function toggleMenu() {
      const submenu = document.getElementById('submenu');
      // Debug: Comprobar si la función está siendo llamada
      console.log("toggleMenu() llamada");

      if (submenu.style.display === 'block') {
        submenu.style.display = 'none'; // Ocultar submenu
        console.log("Submenu oculto");
      } else {
        submenu.style.display = 'block'; // Mostrar submenu
        console.log("Submenu mostrado");
      }
    }

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
            notificaciones.innerText = 'No hay respuesta';

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
