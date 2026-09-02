document.addEventListener('DOMContentLoaded', () => {
    // Lógica para cambiar la imagen principal al hacer clic en miniaturas
    window.changeImage = function (element, newSrc) {
        // Remover activo de todos
        document.querySelectorAll('.miniaturanail').forEach(t => t.classList.remove('activo'));
        // Agregar activo al seleccionado
        element.classList.add('activo');
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
    const tabBtns = document.querySelectorAll('.btn-pestana');
    const tabContents = document.querySelectorAll('.contenido-pestana');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover activo
            tabBtns.forEach(b => b.classList.remove('activo'));
            tabContents.forEach(c => c.classList.remove('activo'));

            // Agregar activo
            btn.classList.add('activo');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('activo');
        });
    });

    // Botones de agregar al carrito (Feedback visual)
    const cartBtns = document.querySelectorAll('.btn-agregar-carrito, .btn-fbt-add');
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Producto añadido al carrito.');
        });
    });
});
