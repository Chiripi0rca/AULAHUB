// layout.js

export function cargarHeader() {
    const headerElement = document.querySelector('header');
    if (!headerElement) return;

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
                            <li><a href="misReservas.html">Mis reservas</a></li>
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
                        <img src="img/usuario.png" id="preview" alt="avatar">
                    </a>
                    <div class="subusuario">
                        <ul>
                            <li><div id="userinfo">Cargando...</div></li>
                            <input type="file" id="fileInput" accept="image/*" style="display:none;">
                            <li><button id="btnSubirFoto">Subir Foto</button></li>
                            <li><button id="btnBorrarFoto">Borrar Foto</button></li>
                        </ul>
                    </div>
                </li>
            </ul>
        </nav>
    `;

    inicializarEventosHeader();
}

export function cargarFooter() {
    const footerElement = document.querySelector('footer');
    if (footerElement) {
        const currentYear = new Date().getFullYear();
        footerElement.innerHTML = `Facultad de Informática Culiacán - ${currentYear}`;
    }
}

function inicializarEventosHeader() {
    // Menú Principal
    const subMenu = document.querySelector('.submenu');
    const openSubMenu = document.querySelector('.abrirmenu');
    if (openSubMenu && subMenu) {
        openSubMenu.addEventListener('click', (e) => { e.stopPropagation(); subMenu.classList.toggle('show'); });
        document.addEventListener('click', (e) => {
             if(subMenu.classList.contains('show') && !subMenu.contains(e.target) && !openSubMenu.contains(e.target)) subMenu.classList.remove('show');
        });
    }

    // Menú Usuario
    const menuUsuario = document.querySelector('.subusuario');
    const abrirUsuario = document.querySelector('.usuario');
    if (abrirUsuario && menuUsuario) {
        abrirUsuario.addEventListener('click', (e) => { e.stopPropagation(); menuUsuario.classList.toggle('show'); });
        document.addEventListener('click', (e) => {
            if(menuUsuario.classList.contains('show') && !menuUsuario.contains(e.target) && !abrirUsuario.contains(e.target)) menuUsuario.classList.remove('show');
        });
    }

    // Notificación
    const btnNoti = document.querySelector('.notificacion');
    const toastsContainer = document.querySelector('.toasts'); // Asegúrate de tener este div en el HTML

    if(btnNoti) {
        btnNoti.addEventListener('click', () => {
            // Si no existe el contenedor, lo buscamos o no hacemos nada
            const contenedor = document.querySelector('.toasts');
            if(contenedor) {
                const noti = document.createElement('div');
                noti.classList.add('toast');
                noti.innerText = "No hay notificaciones nuevas";
                contenedor.appendChild(noti);
                
                // Eliminar después de 3 segundos
                setTimeout(() => {
                    noti.remove();
                }, 3000);
            } else {
                console.warn("Falta el div <div class='toasts'></div> en tu HTML");
            }
        });
    }
}