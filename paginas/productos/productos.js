document.addEventListener('DOMContentLoaded', () => {
    // Interacciones básicas para los filtros y botones

    // Filtros collapse/expand toggle
    const filterTitles = document.querySelectorAll('.titulo-filtro');
    filterTitles.forEach(title => {
        title.addEventListener('click', () => {
            const icon = title.querySelector('.icon');
            const options = title.nextElementSibling;

            if (options) {
                if (options.style.display === 'none') {
                    options.style.display = 'flex';
                    icon.textContent = '^';
                } else {
                    options.style.display = 'none';
                    icon.textContent = 'v';
                }
            }
        });
    });

    // Botón Limpiar
    const btnClear = document.querySelector('.btn-limpiar');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            // Reset price inputs
            const priceInputs = document.querySelectorAll('.entradas-precio input');
            if (priceInputs.length === 2) {
                priceInputs[0].value = 0;
                priceInputs[1].value = 1000;
            }
        });
    }

    // Botones de paginación
    const pageBtns = document.querySelectorAll('.btn-pagina');
    pageBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remover activo de todos que son solo numeros
            if (!isNaN(this.textContent)) {
                pageBtns.forEach(b => {
                    if (!isNaN(b.textContent)) {
                        b.classList.remove('activo');
                    }
                });
                this.classList.add('activo');
            }
        });
    });

    // Botones agregar al carrito
    const cartBtns = document.querySelectorAll('.btn-agregar-carrito');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Producto agregado al carrito exitosamente');
        });
    });
});
