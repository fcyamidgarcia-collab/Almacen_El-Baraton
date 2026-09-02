// ========== DASHBOARD VENDEDOR JS ==========

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo del menú activo en la barra-lateral
    const elementosMenu = document.querySelectorAll('.elemento-menu');
    
    elementosMenu.forEach(item => {
        item.addEventListener('click', function(e) {
            // Prevenir acción por defecto si es un enlace simulado
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }

            // Ignorar los botones del footer (volver a tienda, cerrar sesión)
            if (this.closest('.pie-lateral')) return;

            // Remover clase activo de todos
            elementosMenu.forEach(mi => {
                if(!mi.closest('.pie-lateral')) {
                    mi.classList.remove('activo');
                }
            });

            // Añadir activo al clickeado
            this.classList.add('activo');
        });
    });

    // 2. Notificaciones Simuladas
    const notifBtn = document.querySelector('.btn-notificacion');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            alert('Tienes 1 cotización por vencer y 3 pedidos pendientes.');
        });
    }
});
