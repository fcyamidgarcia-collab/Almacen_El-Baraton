// ========== CONTACTO JS - PREMIUM ==========

// --- Formulario de contacto ---
const formContacto = document.getElementById('formContacto');
if (formContacto) {
    formContacto.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombreCompleto').value;
        const email = document.getElementById('emailCorporativo').value;
        const asunto = document.getElementById('asunto').value;
        const mensaje = document.getElementById('mensaje').value;

        if (nombre && email && mensaje) {
            // Animación del botón premium
            const btn = formContacto.querySelector('.btn-enviar');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>¡Enviado con Éxito!</span>';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.35)';
            btn.disabled = true;

            // Efecto de partículas en el botón
            btn.style.transform = 'scale(1.05)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 200);

            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.style.background = '';
                btn.style.boxShadow = '';
                btn.disabled = false;
                formContacto.reset();
            }, 3000);
        }
    });
}

// --- Animación de entrada Intersection Observer ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Delay escalonado para cada elemento
            const delay = index * 100;
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, delay);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Aplicar animación a elementos
document.addEventListener('DOMContentLoaded', () => {
    const elementos = document.querySelectorAll(
        '.canal-tarjeta, .formulario-tarjeta, .soporte-tarjeta, .horario-tarjeta, .ubicacion-tarjeta, .faq-item, .seccion-header, .mapa-contenedor, .cta-contacto-contenido'
    );

    elementos.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`;
        observer.observe(el);
    });

    // Efecto parallax suave en el hero
    const hero = document.querySelector('.hero-contacto-bg');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < 600) {
                hero.style.transform = `translateY(${scrolled * 0.15}px)`;
            }
        }, { passive: true });
    }

    // Animar los campos del formulario al hacer focus
    const campos = document.querySelectorAll('.campo-grupo input, .campo-grupo select, .campo-grupo textarea');
    campos.forEach(campo => {
        campo.addEventListener('focus', () => {
            const grupo = campo.closest('.campo-grupo');
            if (grupo) {
                grupo.style.transform = 'translateX(4px)';
                setTimeout(() => {
                    grupo.style.transform = 'translateX(0)';
                }, 200);
            }
        });
    });
});

// --- Efecto de tipeo en el hero ---
const heroTexto = document.querySelector('.hero-contacto-contenido h1');
if (heroTexto) {
    heroTexto.style.opacity = '0';
    heroTexto.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        heroTexto.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        heroTexto.style.opacity = '1';
        heroTexto.style.transform = 'translateY(0)';
    }, 300);
}

// --- Smooth scroll para enlaces internos ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
