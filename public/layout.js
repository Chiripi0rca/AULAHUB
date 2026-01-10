// layout.js - Optimizado y Auto-suficiente

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
                        <ul id="menu-lista">
                            <li><a href="#">Cargando...</a></li> 
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

export function actualizarMenu(esAdmin) {
    const menuLista = document.getElementById('menu-lista');
    if (!menuLista) return;

    let html = '';
    // Menú común
    html += `<li><a href="aulas.html">Menu Principal</a></li>`;
    html += `<li><a href="configuraciones.html">Configuraciones</a></li>`;

    if (esAdmin) {
        // Admin
        html += `<li><a href="solicitudes.html" style="color: #164B8A; font-weight: bold;">Solicitudes (Admin)</a></li>`;
        html += `<li><a href="reglamento.html">Reglamento</a></li>`;
    } else {
        // Profesor
        html += `<li><a href="misReservas.html">Mis reservas</a></li>`;
        html += `<li><a href="ayuda.html">Ayuda</a></li>`;
        html += `<li><a href="reglamento.html">Reglamento</a></li>`;
    }
    // Logout
    html += `<li><a href="#" id="logout">Cerrar sesion</a></li>`;
    menuLista.innerHTML = html;
}

export function cargarFooter() {
    const footerElement = document.querySelector('footer');
    if (footerElement) {
        const currentYear = new Date().getFullYear();
        footerElement.innerHTML = `Facultad de Informática Culiacán - ${currentYear}`;
    }
}

function inicializarEventosHeader() {
    // 1. Submenú (Hamburguesa)
    const subMenu = document.querySelector('.submenu');
    const openSubMenu = document.querySelector('.abrirmenu');
    
    if (openSubMenu && subMenu) {
        openSubMenu.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            subMenu.classList.toggle('show'); 
        });
        document.addEventListener('click', (e) => {
             if(subMenu.classList.contains('show') && !subMenu.contains(e.target) && !openSubMenu.contains(e.target)) {
                 subMenu.classList.remove('show');
             }
        });
    }

    // 2. Menú Usuario (Perfil)
    const menuUsuario = document.querySelector('.subusuario');
    const abrirUsuario = document.querySelector('.usuario');
    if (abrirUsuario && menuUsuario) {
        abrirUsuario.addEventListener('click', (e) => { e.stopPropagation(); menuUsuario.classList.toggle('show'); });
        document.addEventListener('click', (e) => {
            if(menuUsuario.classList.contains('show') && !menuUsuario.contains(e.target) && !abrirUsuario.contains(e.target)) menuUsuario.classList.remove('show');
        });
    }

    // 3. Notificaciones (Toast Inteligente)
    const btnNoti = document.querySelector('.notificacion');
    if(btnNoti) {
        btnNoti.addEventListener('click', () => {
            mostrarToast("No hay notificaciones nuevas");
        });
    }
}

// --- FUNCIÓN GLOBAL DE TOAST ---
// Puedes llamar a esta función desde cualquier otro archivo JS si importas layout.js
export function mostrarToast(mensaje) {
    let contenedor = document.querySelector('.toasts');
    
    // Si no existe el contenedor, lo creamos al vuelo
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.classList.add('toasts');
        document.body.appendChild(contenedor);
    }

    const noti = document.createElement('div');
    noti.classList.add('toast');
    noti.innerText = mensaje;
    
    // Icono opcional
    // noti.innerHTML = `<span class="material-symbols-outlined" style="margin-right:8px">info</span> ${mensaje}`;

    contenedor.appendChild(noti);
    
    // Sonido suave opcional (si quisieras)
    // const audio = new Audio('pop.mp3'); audio.play().catch(() => {});

    setTimeout(() => {
        noti.style.opacity = '0';
        noti.style.transform = 'translateX(100%)';
        setTimeout(() => noti.remove(), 300);
    }, 3000);
}