/**
 * SISTEMA GLOBAL DE MODO OSCURO (DARK MODE)
 * Industrial Supply Co. - El Baratón
 */

(function () {
    const STORAGE_KEY = 'almacen_tema';
    const DARK_CLASS = 'dark-mode';
    let memoriaTema = null;

    function leerPreferencia() {
        try {
            return localStorage.getItem(STORAGE_KEY) || memoriaTema;
        } catch (e) {
            return memoriaTema;
        }
    }

    function guardarPreferencia(valor) {
        memoriaTema = valor;
        try {
            localStorage.setItem(STORAGE_KEY, valor);
        } catch (e) {}
    }

    // 1. Aplicación inmediata para prevenir parpadeo (FOUC)
    function aplicarTemaInicial() {
        const temaGuardado = leerPreferencia();
        const prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (temaGuardado === 'dark' || (!temaGuardado && prefiereOscuro)) {
            document.documentElement.classList.add(DARK_CLASS);
        } else {
            document.documentElement.classList.remove(DARK_CLASS);
        }
    }

    aplicarTemaInicial();

    // 2. Sincronizar icono y accesibilidad de los botones
    function sincronizarBotones() {
        const esOscuro = document.documentElement.classList.contains(DARK_CLASS);
        const botones = document.querySelectorAll('.btn-modo-oscuro, #btn-modo-oscuro');

        botones.forEach(btn => {
            btn.setAttribute('aria-pressed', esOscuro ? 'true' : 'false');
            btn.setAttribute('title', esOscuro ? 'Activar modo claro' : 'Activar modo oscuro');
            btn.setAttribute('aria-label', esOscuro ? 'Activar modo claro' : 'Activar modo oscuro');

            const icono = btn.querySelector('i');
            if (icono) {
                icono.className = esOscuro ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }

    // 3. Alternar modo oscuro
    function alternarModoOscuro() {
        const esOscuro = document.documentElement.classList.toggle(DARK_CLASS);
        guardarPreferencia(esOscuro ? 'dark' : 'light');
        sincronizarBotones();
    }

    // 4. Delegación de evento global en fase de captura (inmune a interferencias de otros scripts)
    document.addEventListener('click', function (e) {
        const btn = e.target.closest && e.target.closest('.btn-modo-oscuro, #btn-modo-oscuro');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            alternarModoOscuro();
        }
    }, true);

    // 5. Inicializar cuando el DOM esté disponible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sincronizarBotones);
    } else {
        sincronizarBotones();
    }
})();
