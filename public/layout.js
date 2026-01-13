// layout.js - Con Dropdown de Notificaciones Funcional
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { db } from "./Firebase-Config.js";

let currentUid = null;

export function cargarHeader() {
    cargarFavicon();

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
                <div class="notificacion" id="btnNotificacion">
                    <span class="material-symbols-outlined">notifications</span>
                </div>
                
                <div class="notificaciones-menu" id="menuNotificaciones">
                    <div class="noti-header">Notificaciones</div>
                    <ul class="noti-list" id="listaNotificaciones">
                        <li class="noti-vacio">Cargando...</li>
                    </ul>
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

export function iniciarEscuchaNotificaciones(uid) {
    currentUid = uid; // Guardar para usar al abrir el menú
    const btnNoti = document.getElementById('btnNotificacion');
    if (!btnNoti || !uid) return;

    const q = query(
        collection(db, "notificaciones"),
        where("destinatarioUid", "==", uid),
        where("leido", "==", false)
    );

    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            btnNoti.classList.add('con-novedades');
        } else {
            btnNoti.classList.remove('con-novedades');
        }
    });
}

async function cargarYMostrarNotificaciones() {
    const lista = document.getElementById('listaNotificaciones');
    if(!currentUid || !lista) return;

    lista.innerHTML = '<li class="noti-vacio">Cargando...</li>';

    try {
        const q = query(
            collection(db, "notificaciones"),
            where("destinatarioUid", "==", currentUid),
            orderBy("fecha", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            lista.innerHTML = '<li class="noti-vacio">Sin notificaciones recientes</li>';
            return;
        }

        let html = '';
        const batchUpdates = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const fecha = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleDateString() : "";
            const claseNoLeido = !data.leido ? 'sin-leer' : '';

            html += `
            <li class="noti-item ${claseNoLeido}">
                <span class="noti-titulo">${data.titulo || "Aviso"}</span>
                <span class="noti-mensaje">${data.mensaje || ""}</span>
                <span class="noti-fecha">${fecha}</span>
            </li>`;

            if (!data.leido) {
                updateDoc(doc(db, "notificaciones", docSnap.id), { leido: true }).catch(console.error);
            }
        });

        lista.innerHTML = html;

    } catch (error) {
        console.error("Error cargando notificaciones web:", error);
        lista.innerHTML = '<li class="noti-vacio">Error al cargar. Revisa la consola.</li>';
    }
}

function inicializarEventosHeader() {
    const subMenu = document.querySelector('.submenu');
    const openSubMenu = document.querySelector('.abrirmenu');

    if (openSubMenu && subMenu) {
        openSubMenu.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            subMenu.classList.toggle('show'); 
            // Cerrar otros menús
            document.getElementById('menuNotificaciones')?.classList.remove('show');
            document.querySelector('.subusuario')?.classList.remove('show');
        });
    }

    const menuUsuario = document.querySelector('.subusuario');
    const abrirUsuario = document.querySelector('.usuario');
    if (abrirUsuario && menuUsuario) {
        abrirUsuario.addEventListener('click', (e) => {
            e.stopPropagation(); 
            menuUsuario.classList.toggle('show');
            subMenu?.classList.remove('show');
            document.getElementById('menuNotificaciones')?.classList.remove('show');
        });
    }

    const btnNoti = document.getElementById('btnNotificacion');
    const menuNoti = document.getElementById('menuNotificaciones');

    if(btnNoti && menuNoti) {
        btnNoti.addEventListener('click', (e) => {
            e.stopPropagation();
            const estaAbierto = menuNoti.classList.contains('show');

            subMenu?.classList.remove('show');
            menuUsuario?.classList.remove('show');

            if (estaAbierto) {
                menuNoti.classList.remove('show');
            } else {
                menuNoti.classList.add('show');
                cargarYMostrarNotificaciones();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if(subMenu && !subMenu.contains(e.target) && !openSubMenu.contains(e.target)) subMenu.classList.remove('show');
        if(menuUsuario && !menuUsuario.contains(e.target) && !abrirUsuario.contains(e.target)) menuUsuario.classList.remove('show');
        if(menuNoti && !menuNoti.contains(e.target) && !btnNoti.contains(e.target)) menuNoti.classList.remove('show');
    });
}

function cargarFavicon() {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = 'img/logofic.png';
    link.type = 'image/png';
}

export function actualizarMenu(esAdmin) {
    const menuLista = document.getElementById('menu-lista');
    if (!menuLista) return;
    let html = '';
    html += `<li><a href="aulas.html">Menu Principal</a></li>`;
    html += `<li><a href="configuraciones.html">Configuraciones</a></li>`;
    if (esAdmin) {
        html += `<li><a href="solicitudes.html" style="color: #164B8A; font-weight: bold;">Solicitudes (Admin)</a></li>`;
        html += `<li><a href="reglamento.html">Reglamento</a></li>`;
    } else {
        html += `<li><a href="misReservas.html">Mis reservas</a></li>`;
        html += `<li><a href="ayuda.html">Ayuda</a></li>`;
        html += `<li><a href="reglamento.html">Reglamento</a></li>`;
    }
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

export function mostrarToast(mensaje) {
    let contenedor = document.querySelector('.toasts');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.classList.add('toasts');
        document.body.appendChild(contenedor);
    }
    const noti = document.createElement('div');
    noti.classList.add('toast');
    noti.innerText = mensaje;
    contenedor.appendChild(noti);
    setTimeout(() => {
        noti.style.opacity = '0';
        noti.style.transform = 'translateX(100%)';
        setTimeout(() => noti.remove(), 300);
    }, 3000);
}