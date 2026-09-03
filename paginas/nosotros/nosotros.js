// Lógica de animaciones y validaciones para la página Nosotros
document.addEventListener('DOMContentLoaded', () => {

    // 1. Animación de entrada para tarjetas del timeline, valores y líderes
    const animatedElements = document.querySelectorAll(
        '.timeline-card, .valor-card, .lider-card, .mision-header, .cta-contenido'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const delay = Array.from(animatedElements).indexOf(entry.target) % 4 * 100;
                setTimeout(() => {
                    entry.target.classList.add('animado');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Clase de animación
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .animado {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        </style>
    `);

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
