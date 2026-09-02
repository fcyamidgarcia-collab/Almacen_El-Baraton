// ========== DASHBOARD ADMIN JS (ESPAÑOL) ==========

document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo del menú activo en la barra lateral
    const elementosMenu = document.querySelectorAll('.item-menu');
    
    elementosMenu.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }

            if (this.closest('.pie-barra-lateral')) return;

            elementosMenu.forEach(mi => {
                if(!mi.closest('.pie-barra-lateral')) {
                    mi.classList.remove('activo');
                }
            });

            this.classList.add('activo');
        });
    });

    // 2. Conmutadores de vista
    const botonesConmutador = document.querySelectorAll('.conmutadores-vista .boton-conmutador');
    botonesConmutador.forEach(btn => {
        btn.addEventListener('click', function() {
            botonesConmutador.forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');
        });
    });
});
