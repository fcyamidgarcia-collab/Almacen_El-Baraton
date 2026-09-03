// Términos y Condiciones - Validaciones y utilidades
document.addEventListener('DOMContentLoaded', () => {

    // Validar formulario boletín del pie de página
    const formBoletin = document.querySelector('.formulario-boletin');
    if (formBoletin) {
        const input = formBoletin.querySelector('input[type="email"]');
        const btn = formBoletin.querySelector('button');

        if (input) {
            input.addEventListener('input', () => { input.style.outline = ''; });
        }

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const email = input?.value.trim() || '';
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!email || !emailRegex.test(email)) {
                    if (input) {
                        input.style.outline = '2px solid #ef4444';
                        input.focus();
                    }
                    return;
                }

                const originalText = btn.textContent;
                btn.textContent = '✓ ¡Suscrito!';
                btn.style.backgroundColor = '#10b981';
                btn.disabled = true;

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '';
                    btn.disabled = false;
                    if (input) input.value = '';
                }, 3000);
            });
        }
    }

    // Buscador en encabezado con validación
    const inputBusquedaGlobal = document.querySelector('.barra-busqueda input');
    if (inputBusquedaGlobal) {
        inputBusquedaGlobal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = inputBusquedaGlobal.value.trim();
                if (!query) {
                    inputBusquedaGlobal.style.outline = '2px solid #ef4444';
                    setTimeout(() => { inputBusquedaGlobal.style.outline = ''; }, 1500);
                    return;
                }
                window.location.href = `../productos/productos.html?buscar=${encodeURIComponent(query)}`;
            }
        });
    }
});
