// ========== DASHBOARD ADMIN JS ==========

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo del menú activo en la barra-lateral
    const elementosMenu = document.querySelectorAll('.elemento-menu');
    
    elementosMenu.forEach(item => {
        item.addEventListener('click', function(e) {
            // Prevenir acción por defecto si es un enlace simulado (href="#")
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

    // 2. Simulación de Modo Oscuro (Placeholder)
    const btnModoOscuro = document.querySelector('.acciones-cabecera .btn-icono');
    if (btnModoOscuro) {
        btnModoOscuro.addEventListener('click', () => {
            document.body.classList.toggle('modo-oscuro-simulado');
            // Aquí iría la lógica real de cambio de variables CSS para el modo oscuro
            console.log('Toggle Dark Mode');
        });
    }

    // 3. Toggles de vista en "Relación de productos"
    const alternadoresVista = document.querySelectorAll('.alternadores-vista .btn-alternar');
    alternadoresVista.forEach(btn => {
        btn.addEventListener('click', function() {
            alternadoresVista.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
        });
    });
});
