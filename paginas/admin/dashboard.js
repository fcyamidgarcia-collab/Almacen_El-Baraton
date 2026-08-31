// ========== DASHBOARD ADMIN JS ==========

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo del menú activo en la sidebar
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Prevenir acción por defecto si es un enlace simulado (href="#")
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }

            // Ignorar los botones del footer (volver a tienda, cerrar sesión)
            if (this.closest('.sidebar-footer')) return;

            // Remover clase active de todos
            menuItems.forEach(mi => {
                if(!mi.closest('.sidebar-footer')) {
                    mi.classList.remove('active');
                }
            });

            // Añadir active al clickeado
            this.classList.add('active');
        });
    });

    // 2. Simulación de Modo Oscuro (Placeholder)
    const darkModeBtn = document.querySelector('.header-actions .icon-btn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode-simulated');
            // Aquí iría la lógica real de cambio de variables CSS para el modo oscuro
            console.log('Toggle Dark Mode');
        });
    }

    // 3. Toggles de vista en "Relación de productos"
    const viewToggles = document.querySelectorAll('.view-toggles .toggle-btn');
    viewToggles.forEach(btn => {
        btn.addEventListener('click', function() {
            viewToggles.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
