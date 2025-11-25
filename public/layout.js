// layout.js

export function cargarHeader() {
    const headerElement = document.querySelector('header');
    
    // Si no hay etiqueta <header> en el HTML, no hacemos nada
    if (!headerElement) return;

    // 1. Inyectamos el HTML
    headerElement.innerHTML = `
        <nav>
            <ul>
                <li class="abrirmenu">
                    <a href="#">
                        <span class="material-symbols-outlined">menu_open</span>
                    </a>
                    <div class="submenu">
                        <ul>
                            <li><a href="aulas.html">Menu Principal</a></li>
                            <li><a href="#">Configuraciones</a></li>
                            <li><a href="#">Mis reservas</a></li>
                            <li><a href="ayuda.html">Ayuda</a></li>
                            <li><a href="reglamento.html">Reglamento</a></li>
                            <li><a href="#" id="logout">Cerrar sesion</a></li>
                        </ul>
                    </div>
                </li>
            </ul>
        </nav>
        <nav>
            <ul>
                <div class="notificacion">
                    <span class="material-symbols-outlined">notifications</span>
                </div>
            </ul>
        </nav>
        <nav>
            <ul>
                <li class="usuario">
                    <a href="#">
                        <img src="img/usuario.png" id="preview" alt="avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #000;">
                    </a>
                    <div class="subusuario">
                        <ul>
                            <li><div id="userinfo" style="font-weight:bold; padding:5px;">Cargando...</div></li>
                            
                            <input type="file" id="fileInput" accept="image/*" style="display:none;">
                            
                            <li><button id="btnSubirFoto">Subir Foto</button></li>
                            <li><button id="btnBorrarFoto" style="color: red;">Borrar Foto</button></li>
                        </ul>
                    </div>
                </li>
            </ul>
        </nav>
    `;

    // 2. Activamos los eventos (Lógica que antes tenías en laboratorio.js y funcionDates.js)
    inicializarEventosHeader();
}

export function cargarFooter() {
    const footerElement = document.querySelector('footer');
    
    if (footerElement) {
        // Obtenemos el año actual automáticamente del sistema
        const currentYear = new Date().getFullYear();
        
        footerElement.innerHTML = `
            Facultad de Informática Culiacán - ${currentYear}
        `;
    }
}

function inicializarEventosHeader() {
    // --- Lógica del Menú Principal ---
    const subMenu = document.querySelector('.submenu');
    const openSubMenu = document.querySelector('.abrirmenu');

    if (openSubMenu && subMenu) {
        openSubMenu.addEventListener('click', function(e) {
            e.stopPropagation(); // Evita que el click se propague al document
            subMenu.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if(subMenu.classList.contains('show') && !subMenu.contains(e.target) && !openSubMenu.contains(e.target)){
                subMenu.classList.remove('show');
            }
        });
    }

    // --- Lógica de Notificaciones ---
    const btnNoti = document.querySelector('.notificacion');
    const toasts = document.querySelector('.toasts');

    if (btnNoti && toasts) {
        btnNoti.addEventListener('click', () => {
            const notificacion = document.createElement('div');
            notificacion.classList.add('toast');
            notificacion.innerText = 'No hay respuesta'; // Tu mensaje original
            toasts.appendChild(notificacion);
            setTimeout(() => notificacion.remove(), 3000);
        });
    }

    // --- Lógica del Menú Usuario ---
    const menuUsuario = document.querySelector('.subusuario');
    const abrirUsuario = document.querySelector('.usuario');

    if (abrirUsuario && menuUsuario) {
        abrirUsuario.addEventListener('click', function(e) {
            e.stopPropagation();
            menuUsuario.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if(menuUsuario.classList.contains('show') && !menuUsuario.contains(e.target) && !abrirUsuario.contains(e.target)){
                menuUsuario.classList.remove('show');
            }
        });
    }
}