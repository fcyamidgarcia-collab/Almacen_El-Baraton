// ========== DASHBOARD VENDEDOR JS ==========

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo del menú activo en la sidebar
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Prevenir acción por defecto si es un enlace simulado
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

    // 2. Notificaciones Simuladas
    const notifBtn = document.querySelector('.notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert('Tienes 1 cotización por vencer y 3 pedidos pendientes.');
        });
    }
});
