document.addEventListener('DOMContentLoaded', () => {
    // Interacciones básicas para los filtros y botones

    // Filtros collapse/expand toggle
    const filterTitles = document.querySelectorAll('.filter-title');
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
    const btnClear = document.querySelector('.btn-clear');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            // Reset price inputs
            const priceInputs = document.querySelectorAll('.price-inputs input');
            if (priceInputs.length === 2) {
                priceInputs[0].value = 0;
                priceInputs[1].value = 1000;
            }
        });
    }

    // Botones de paginación
    const pageBtns = document.querySelectorAll('.page-btn');
    pageBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remover active de todos que son solo numeros
            if (!isNaN(this.textContent)) {
                pageBtns.forEach(b => {
                    if (!isNaN(b.textContent)) {
                        b.classList.remove('active');
                    }
                });
                this.classList.add('active');
            }
        });
    });

    // Botones agregar al carrito
    const cartBtns = document.querySelectorAll('.btn-add-cart');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Producto agregado al carrito exitosamente');
        });
    });
});
