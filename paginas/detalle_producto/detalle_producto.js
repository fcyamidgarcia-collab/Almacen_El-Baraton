document.addEventListener('DOMContentLoaded', () => {
    // Lógica para cambiar la imagen principal al hacer clic en miniaturas
    window.changeImage = function (element, newSrc) {
        // Remover activo de todos
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        // Agregar activo al seleccionado
        element.classList.add('active');
        // Cambiar imagen principal
        document.getElementById('mainImage').src = newSrc;
    };

    // Selector de cantidad
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const qtyInput = document.getElementById('qtyInput');

    if (btnMinus && btnPlus && qtyInput) {
        btnMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        });

        btnPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value) || 1;
            qtyInput.value = val + 1;
        });

        qtyInput.addEventListener('change', () => {
            if (qtyInput.value < 1 || isNaN(qtyInput.value)) {
                qtyInput.value = 1;
            }
        });
    }

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover activo
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Agregar activo
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Botones de agregar al carrito (Feedback visual)
    const cartBtns = document.querySelectorAll('.btn-add-cart, .btn-fbt-add');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Producto añadido al carrito.');
        });
    });
});
