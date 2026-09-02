// Lógica de animaciones para la página Nosotros
document.addEventListener('DOMContentLoaded', () => {

    // 1. Animación de entrada para tarjetas del timeline, valores y líderes
    const animatedElements = document.querySelectorAll(
        '.timeline-card, .valor-card, .lider-card, .mision-header, .cta-contenido'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay escalonado para efecto cascada
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
});
