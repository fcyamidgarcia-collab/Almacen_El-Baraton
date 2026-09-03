
// SESION.JS - Módulo global de gestión de sesión

(function () {
    'use strict';

    // ---- Utilidades ----
    function getUsuario() {
        try {
            const data = localStorage.getItem('baraton_user');
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }

    function getToken() {
        return localStorage.getItem('baraton_token') || null;
    }

    function cerrarSesion() {
        localStorage.removeItem('baraton_user');
        localStorage.removeItem('baraton_token');
        window.location.href = '../sesion/index.html';
    }

    // ---- Inyectar estilos del menú de sesión ----
    function inyectarEstilos() {
        if (document.getElementById('sesion-styles')) return;
        const style = document.createElement('style');
        style.id = 'sesion-styles';
        style.textContent = `
            .sesion-menu-wrapper {
                position: relative;
                display: inline-flex;
                align-items: center;
            }
            .sesion-avatar-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #f97316, #ea580c);
                border: none;
                border-radius: 24px;
                padding: 6px 14px 6px 8px;
                cursor: pointer;
                color: #fff;
                font-size: 13px;
                font-weight: 600;
                font-family: inherit;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(249,115,22,0.35);
                text-decoration: none;
            }
            .sesion-avatar-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 14px rgba(249,115,22,0.5);
            }
            .sesion-avatar-icon {
                width: 28px;
                height: 28px;
                background: rgba(255,255,255,0.25);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
            }
            .sesion-nombre {
                max-width: 110px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .sesion-dropdown {
                position: absolute;
                top: calc(100% + 10px);
                right: 0;
                background: #1a1a2e;
                border: 1px solid rgba(249,115,22,0.2);
                border-radius: 12px;
                padding: 8px;
                min-width: 200px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                display: none;
                z-index: 9999;
                animation: fadeInDown 0.2s ease;
            }
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-8px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .sesion-dropdown.visible {
                display: block;
            }
            .sesion-dropdown-header {
                padding: 10px 12px 12px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                margin-bottom: 6px;
            }
            .sesion-dropdown-header .sd-nombre {
                font-weight: 700;
                color: #fff;
                font-size: 14px;
            }
            .sesion-dropdown-header .sd-rol {
                font-size: 11px;
                color: #f97316;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 2px;
            }
            .sesion-dropdown-header .sd-correo {
                font-size: 11px;
                color: #9ca3af;
                margin-top: 2px;
                word-break: break-all;
            }
            .sd-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 9px 12px;
                border-radius: 8px;
                color: #d1d5db;
                text-decoration: none;
                font-size: 13px;
                font-weight: 500;
                transition: background 0.15s, color 0.15s;
                cursor: pointer;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                font-family: inherit;
            }
            .sd-item:hover {
                background: rgba(249,115,22,0.12);
                color: #f97316;
            }
            .sd-item i {
                width: 16px;
                text-align: center;
                font-size: 12px;
            }
            .sd-divider {
                height: 1px;
                background: rgba(255,255,255,0.07);
                margin: 6px 0;
            }
            .sd-item.peligro:hover {
                background: rgba(239,68,68,0.12);
                color: #ef4444;
            }
            /* Badge de carrito */
            .carrito-badge {
                position: absolute;
                top: -6px;
                right: -6px;
                background: #f97316;
                color: #fff;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 10px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    // ---- Determinar ruta de perfil/panel según página actual ----
    function obtenerRutas() {
        const path = window.location.pathname.replace(/\\/g, '/');

        const base = path.includes('/admin/') || path.includes('/perfil/') ||
            path.includes('/sesion/') || path.includes('/inicio/') ||
            path.includes('/productos/') || path.includes('/carrito/') ||
            path.includes('/pago/') || path.includes('/registro/') ||
            path.includes('/nosotros/') || path.includes('/contacto/') ||
            path.includes('/vendedor/') || path.includes('/detalle_producto/') ||
            path.includes('/confirmacion/')
            ? '../' : './';

        return {
            perfil: base + 'perfil/perfil.html',
            admin: base + 'admin/dashboard.html',
            vendedor: base + 'vendedor/dashboard.html',
            inicio: base + 'inicio/inicio.html',
            sesion: base + 'sesion/index.html',
            carrito: base + 'carrito/carrito.html'
        };
    }

    // ---- Construir menú de usuario logueado ----
    function construirMenuUsuario(enlaceIcono, usuario) {
        const rutas = obtenerRutas();
        const rol = (usuario.rol_nombre || usuario.nombre_rol || usuario.rol || '').toLowerCase();
        const esAdmin = rol.includes('admin') || usuario.id_rol === 1;
        const esEmpleado = rol.includes('empleado') || rol.includes('vendedor') || usuario.id_rol === 2;
        const tienePanel = esAdmin || esEmpleado;
        const iniciales = (usuario.nombre || 'U').substring(0, 1).toUpperCase();
        const nombreCorto = (usuario.nombre || 'Usuario').split(' ')[0];

        const wrapper = document.createElement('div');
        wrapper.className = 'sesion-menu-wrapper';

        const btn = document.createElement('button');
        btn.className = 'sesion-avatar-btn';
        btn.id = 'sesion-avatar-btn';
        btn.innerHTML = `
            <span class="sesion-avatar-icon">${iniciales}</span>
            <span class="sesion-nombre">${nombreCorto}</span>
            <i class="fas fa-chevron-down" style="font-size:10px;opacity:0.7;"></i>
        `;

        const dropdown = document.createElement('div');
        dropdown.className = 'sesion-dropdown';
        dropdown.id = 'sesion-dropdown';

        let panelEnlace = '';
        if (esAdmin) {
            panelEnlace = `<a href="${rutas.admin}" class="sd-item"><i class="fas fa-th-large"></i>Panel Admin</a>`;
        } else if (esEmpleado) {
            panelEnlace = `<a href="${rutas.vendedor}" class="sd-item"><i class="fas fa-store"></i>Panel Vendedor</a>`;
        } else {
            panelEnlace = `<a href="${rutas.perfil}" class="sd-item"><i class="fas fa-user-circle"></i>Mi Perfil</a>`;
        }

        dropdown.innerHTML = `
            <div class="sesion-dropdown-header">
                <div class="sd-nombre">${usuario.nombre || 'Usuario'}</div>
                <div class="sd-rol">${usuario.rol_nombre || usuario.rol || 'cliente'}</div>
                <div class="sd-correo">${usuario.email || usuario.correo || ''}</div>
            </div>
            ${panelEnlace}
            ${esAdmin ? `<a href="${rutas.perfil}" class="sd-item"><i class="fas fa-user"></i>Mi Perfil</a>` : ''}
            <a href="${rutas.carrito}" class="sd-item"><i class="fas fa-shopping-cart"></i>Mi Carrito</a>
            <div class="sd-divider"></div>
            <button class="sd-item peligro" id="btn-cerrar-sesion"><i class="fas fa-sign-out-alt"></i>Cerrar Sesión</button>
        `;

        wrapper.appendChild(btn);
        wrapper.appendChild(dropdown);

        // Reemplazar el enlace de usuario con el wrapper
        enlaceIcono.parentNode.replaceChild(wrapper, enlaceIcono);

        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('visible');
            const chevron = btn.querySelector('.fa-chevron-down');
            if (chevron) chevron.style.transform = dropdown.classList.contains('visible') ? 'rotate(180deg)' : '';
        });

        // Cerrar al hacer clic afuera
        document.addEventListener('click', () => {
            dropdown.classList.remove('visible');
            const chevron = btn.querySelector('.fa-chevron-down');
            if (chevron) chevron.style.transform = '';
        });

        // Botón cerrar sesión
        document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    }

    // ---- Actualizar Insignia de Carrito ----
    async function actualizarInsigniaCarrito() {
        const enlaceCarrito = document.querySelector('.iconos-encabezado a[href*="carrito/carrito.html"]') || document.querySelector('a[title="Carrito"]');
        if (!enlaceCarrito) return;
        
        let badge = enlaceCarrito.querySelector('.carrito-badge');
        if (!badge) {
            enlaceCarrito.style.position = 'relative';
            badge = document.createElement('span');
            badge.className = 'carrito-badge';
            enlaceCarrito.appendChild(badge);
        }

        let totalItems = 0;
        try {
            const user = getUsuario();
            if (user && getToken() && window.API && window.API.getCarrito) {
                const data = await window.API.getCarrito();
                if (data && data.items) {
                    totalItems = data.items.reduce((sum, item) => sum + Number(item.cantidad), 0);
                }
            } else {
                const items = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
                totalItems = items.reduce((sum, item) => sum + Number(item.cantidad), 0);
            }
        } catch (e) {
            console.warn('No se pudo cargar la cantidad del carrito', e);
        }

        if (totalItems > 0) {
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    // Exponer globalmente si se necesita actualizar desde otro script
    window.actualizarInsigniaCarrito = actualizarInsigniaCarrito;

    // ---- Inicializar ----
    function init() {
        inyectarEstilos();
        const usuario = getUsuario();

        // Buscar el enlace del ícono de usuario en el header
        const enlaceIconoUsuario = document.querySelector('.iconos-encabezado a[href*="sesion"]') ||
            document.querySelector('.iconos-encabezado a[title="Mi Cuenta"]') ||
            document.querySelector('header .fa-user')?.closest('a');

        if (!enlaceIconoUsuario) return;

        if (usuario && getToken()) {
            // Hay sesión activa → reemplazar ícono por menú de usuario
            construirMenuUsuario(enlaceIconoUsuario, usuario);

            // Si estamos en la página de sesión y hay login activo, redirigir
            if (window.location.pathname.includes('/sesion/')) {
                const rol = (usuario.rol_nombre || usuario.rol || '').toLowerCase();
                const rutas = obtenerRutas();
                if (rol.includes('admin') || rol.includes('empleado')) {
                    window.location.href = rutas.admin;
                } else {
                    window.location.href = rutas.perfil;
                }
            }
        }
        // Garantizar carga del buscador global si aún no está presente
        if (!window.__buscadorInicializado && !document.querySelector('script[src*="buscador.js"]')) {
            const s = document.createElement('script');
            s.src = '../js/buscador.js';
            document.head.appendChild(s);
        }

        actualizarInsigniaCarrito();
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
