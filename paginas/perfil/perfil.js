// ========== PERFIL JS (CONECTADO A MYSQL) ==========

document.addEventListener('DOMContentLoaded', async () => {
    // --- Navbar scroll effect ---
    const barraNav = document.getElementById('barraNav');
    if (barraNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) barraNav.classList.add('scrolled');
            else barraNav.classList.remove('scrolled');
        });
    }

    // --- Menú hamburguesa (Mobile) ---
    const btnMenu = document.getElementById('btnMenu');
    const navEnlaces = document.getElementById('navEnlaces');
    if (btnMenu && navEnlaces) {
        btnMenu.addEventListener('click', () => {
            navEnlaces.classList.toggle('nav-abierto');
            btnMenu.classList.toggle('activo');
        });
    }

    // --- Cargar datos del usuario desde MySQL / Sesión ---
    const usuario = API.getUsuarioActual();
    if (usuario) {
        // Nombre del encabezado del perfil
        const nombrePerfil = document.querySelector('.tarjeta-perfil h2') || document.querySelector('.perfil-usuario h2');
        if (nombrePerfil) nombrePerfil.textContent = usuario.nombre;

        const emailPerfil = document.querySelector('.tarjeta-perfil p') || document.querySelector('.perfil-usuario p');
        if (emailPerfil) emailPerfil.textContent = `${usuario.email} • Rol: ${usuario.rol_nombre || usuario.rol || 'Cliente'}`;

        // Cargar pedidos del usuario en la pestaña de historial
        try {
            const pedidos = await API.getPedidos({ id_usuario: usuario.id_usuario });
            const tablaHistorial = document.querySelector('#historial tbody, #pedidos-usuario tbody');
            if (tablaHistorial && pedidos.length > 0) {
                tablaHistorial.innerHTML = '';
                pedidos.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${p.id}</strong></td>
                        <td>${p.fecha}</td>
                        <td>$ ${Number(p.total).toLocaleString('es-CO')}</td>
                        <td><span class="estado estado-enviado">● ${p.estado}</span></td>
                        <td><a href="../pago/pago.html" style="color: #ea580c; font-weight: 600;">Ver Factura</a></td>
                    `;
                    tablaHistorial.appendChild(tr);
                });
            }
        } catch (e) {
            console.warn('No se pudo cargar historial de pedidos:', e.message);
        }
    }

    // --- Lógica de Pestañas (Sidebar) ---
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.seccion-tab');

    if (menuItems.length > 0 && tabs.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = item.getAttribute('data-target');
                if(!targetId) return;
                e.preventDefault();

                menuItems.forEach(link => link.classList.remove('activo'));
                item.classList.add('activo');

                tabs.forEach(tab => tab.classList.remove('activa'));
                const targetTab = document.getElementById(targetId);
                if(targetTab) targetTab.classList.add('activa');
            });
        });
    }

    // Botón Cerrar Sesión
    const btnSalir = document.querySelector('.menu-item.texto-peligro, .btn-cerrar-sesion');
    if (btnSalir) {
        btnSalir.addEventListener('click', (e) => {
            e.preventDefault();
            API.cerrarSesion();
        });
    }
});
