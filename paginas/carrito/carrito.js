/**
 * Lógica para la página del Carrito de Compras
 */

document.addEventListener('DOMContentLoaded', () => {
    // Manejo de la cantidad de productos
    const controlesCantidad = document.querySelectorAll('.control-cantidad');

    controlesCantidad.forEach(control => {
        const btnRestar = control.querySelector('.btn-restar');
        const btnSumar = control.querySelector('.btn-sumar');
        const inputCantidad = control.querySelector('input[type="number"]');

        btnRestar.addEventListener('click', () => {
            let valorActual = parseInt(inputCantidad.value);
            if (valorActual > 1) {
                inputCantidad.value = valorActual - 1;
                actualizarTotales();
            }
        });

        btnSumar.addEventListener('click', () => {
            let valorActual = parseInt(inputCantidad.value);
            inputCantidad.value = valorActual + 1;
            actualizarTotales();
        });
    });

    // Función para actualizar subtotales (simulación básica)
    function actualizarTotales() {
        console.log('Cantidades actualizadas. Recalculando totales...');
        // Aquí iría la lógica para recalcular el subtotal por fila y el total del pedido
        // leyendo los valores de los elementos .precio-valor, multiplicando por la cantidad, etc.
    }

    // Efecto scroll en nav
    const nav = document.getElementById('barraNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
});
