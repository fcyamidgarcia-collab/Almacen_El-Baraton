// PROTEGIDAS-RUTAS.JS - Protección de rutas del frontend
// Verifica autenticación y autorización antes de permitir acceso

(function () {
    'use strict';

    /**
      Configuración de rutas protegidas
      Especifica qué rol(es) pueden acceder a cada ruta
     */
    const RUTAS_PROTEGIDAS = {
        'admin': ['administrador', 'admin'],
        'vendedor': ['empleado', 'vendedor'],
        'perfil': ['administrador', 'admin', 'empleado', 'vendedor', 'cliente']
    };

    /**
      Obtener el rol de ruta actual basado en la URL
     */
    function obtenerRutaActual() {
        const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
        
        if (path.includes('/admin/')) return 'admin';
        if (path.includes('/vendedor/')) return 'vendedor';
        if (path.includes('/perfil/')) return 'perfil';
        
        return null;
    }

    /**
      Obtener usuario autenticado de localStorage
     */
    function obtenerUsuario() {
        try {
            const data = localStorage.getItem('baraton_user');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    /**
      Obtener token de autenticación
     */
    function obtenerToken() {
        return localStorage.getItem('baraton_token') || null;
    }

    /**
      Normalizar nombre de rol para comparación
     */
    function normalizarRol(rol) {
        if (!rol) return '';
        return rol.toLowerCase().trim();
    }

    /**
      Verificar si el usuario tiene permiso para acceder a la ruta actual
     */
    function verificarAcceso() {
        const rutaActual = obtenerRutaActual();
        
        // Si no es una ruta protegida, permitir acceso
        if (!rutaActual || !RUTAS_PROTEGIDAS[rutaActual]) {
            return true;
        }

        const usuario = obtenerUsuario();
        const token = obtenerToken();

        // No hay sesión activa
        if (!usuario || !token) {
            console.warn(`[PROTEGIDAS-RUTAS] Acceso denegado a /${rutaActual}: Usuario no autenticado`);
            return false;
        }

        // Obtener rol del usuario y normalizarlo
        const rolUsuario = normalizarRol(
            usuario.rol_nombre || usuario.nombre_rol || usuario.rol || ''
        );

        // Obtener roles permitidos para esta ruta
        const rolesPermitidos = RUTAS_PROTEGIDAS[rutaActual].map(r => r.toLowerCase());

        // Verificar si el rol del usuario está en la lista de roles permitidos
        const tieneAcceso = rolesPermitidos.includes(rolUsuario);

        if (!tieneAcceso) {
            console.warn(
                `[PROTEGIDAS-RUTAS] Acceso denegado a /${rutaActual}: ` +
                `Rol "${rolUsuario}" no autorizado. Roles permitidos: ${rolesPermitidos.join(', ')}`
            );
            return false;
        }

        return true;
    }

    /**
      Redirigir a la página de login
     */
    function redirigirAlLogin() {
        // Detectar la ruta base según la ubicación actual
        const path = window.location.pathname.replace(/\\/g, '/');
        let rutaBase = '../';
        
        if (path.includes('/admin/') || path.includes('/vendedor/') || path.includes('/perfil/')) {
            rutaBase = '../';
        }

        window.location.href = `${rutaBase}sesion/index.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    }

    /**
      Redirigir a página de acceso denegado
     */
    function redirigirAccesoDenegado() {
        const rutaBase = '../';
        window.location.href = `${rutaBase}inicio/inicio.html`;
    }

    /**
     * Inicializar protección de rutas
      Se ejecuta cuando el DOM está listo
     */
    function inicializarProteccion() {
        const rutaActual = obtenerRutaActual();

        if (!rutaActual) {
            // No es una ruta protegida
            return;
        }

        // Verificar acceso
        if (!verificarAcceso()) {
            // Mostrar feedback visual durante la redirección
            document.body.style.opacity = '0.5';
            document.body.style.pointerEvents = 'none';

            const usuario = obtenerUsuario();
            
            if (!usuario) {
                // Usuario no autenticado: ir a login
                setTimeout(() => {
                    redirigirAlLogin();
                }, 300);
            } else {
                // Usuario sin permisos: ir a inicio
                setTimeout(() => {
                    redirigirAccesoDenegado();
                }, 300);
            }
        }
    }

    // Ejecutar protección cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarProteccion);
    } else {
        // El documento ya está cargado
        inicializarProteccion();
    }

    // Exponer funciones globales para uso en scripts
    window.ProtegidaRutas = {
        verificarAcceso,
        obtenerUsuario,
        obtenerToken,
        obtenerRutaActual,
        normalizarRol
    };

})();
