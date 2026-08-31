// ========== CONTACTO JS ==========

// --- Navbar scroll effect ---
const barraNav = document.getElementById('barraNav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        barraNav.classList.add('scrolled');
    } else {
        barraNav.classList.remove('scrolled');
    }
});

// --- Menú hamburguesa ---
const btnMenu = document.getElementById('btnMenu');
const navEnlaces = document.getElementById('navEnlaces');

if (btnMenu) {
    btnMenu.addEventListener('click', () => {
        navEnlaces.classList.toggle('nav-abierto');
        btnMenu.classList.toggle('activo');
    });
}

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
            // Animación del botón
            const btn = formContacto.querySelector('.btn-enviar');
            const textoOriginal = btn.textContent;
            btn.textContent = '✓ Enviado';
            btn.style.background = '#10b981';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = textoOriginal;
                btn.style.background = '';
                btn.disabled = false;
                formContacto.reset();
            }, 3000);
        }
    });
}

// --- Formulario boletín ---
const formBoletin = document.getElementById('formBoletin');
if (formBoletin) {
    formBoletin.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('inputEmail');
        const btn = formBoletin.querySelector('.btn-suscribir');
        const textoOriginal = btn.textContent;

        btn.textContent = '✓ Suscrito';
        btn.style.background = '#10b981';

        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = '';
            input.value = '';
        }, 3000);
    });
}

// --- Animación de entrada para tarjetas ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Aplicar animación a elementos
document.addEventListener('DOMContentLoaded', () => {
    const elementos = document.querySelectorAll(
        '.formulario-tarjeta, .soporte-tarjeta, .horario-tarjeta, .ubicacion-tarjeta, .faq-item'
    );

    elementos.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
