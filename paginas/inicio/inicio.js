
// ===== Efecto scroll en la barra de navegación =====
const barraNav = document.getElementById('barraNav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        barraNav.classList.add('scrolled');
    } else {
        barraNav.classList.remove('scrolled');
    }
});

// ===== Menú hamburguesa (móvil) =====
const btnMenu = document.getElementById('btnMenu');
const navEnlaces = document.getElementById('navEnlaces');
let menuAbierto = false;

btnMenu.addEventListener('click', () => {
    menuAbierto = !menuAbierto;

    if (menuAbierto) {
        navEnlaces.style.display = 'flex';
        navEnlaces.style.position = 'absolute';
        navEnlaces.style.top = '64px';
        navEnlaces.style.left = '0';
        navEnlaces.style.right = '0';
        navEnlaces.style.flexDirection = 'column';
        navEnlaces.style.backgroundColor = '#111827';
        navEnlaces.style.padding = '16px';
        navEnlaces.style.borderBottom = '1px solid #1f2937';
    } else {
        navEnlaces.style.display = 'none';
    }
});

// ===== Animación de contadores =====
function animarContadores() {
    const contadores = document.querySelectorAll('.estadistica-numero');

    contadores.forEach(contador => {
        const valorFinal = parseInt(contador.getAttribute('data-valor'));
        const duracion = 2000;
        const inicio = performance.now();

        function actualizar(tiempoActual) {
            const progreso = Math.min((tiempoActual - inicio) / duracion, 1);
            // Desaceleración al final
            const easing = 1 - Math.pow(1 - progreso, 3);
            const valorActual = Math.floor(easing * valorFinal);

            contador.textContent = valorActual;

            if (progreso < 1) {
                requestAnimationFrame(actualizar);
            } else {
                contador.textContent = valorFinal;
            }
        }

        requestAnimationFrame(actualizar);
    });
}

// ===== Observador para animaciones al hacer scroll =====
const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');

            // Activar contadores cuando la sección sea visible
            if (entrada.target.classList.contains('estadisticas')) {
                animarContadores();
            }

            observador.unobserve(entrada.target);
        }
    });
}, {
    threshold: 0.15
});

// Observar los elementos que se van a animar
document.querySelectorAll(
    '.categoria-tarjeta, .testimonio-tarjeta, .caracteristica-tarjeta, .estadisticas'
).forEach(elemento => {
    elemento.classList.add('animar');
    observador.observe(elemento);
});

// ===== Navegación activa según la sección visible =====
const secciones = document.querySelectorAll('section[id]');
const enlacesNav = document.querySelectorAll('.nav-enlaces a');

window.addEventListener('scroll', () => {
    let posicionActual = window.scrollY + 100;

    secciones.forEach(seccion => {
        const seccionTop = seccion.offsetTop;
        const seccionAltura = seccion.offsetHeight;
        const seccionId = seccion.getAttribute('id');

        if (posicionActual >= seccionTop && posicionActual < seccionTop + seccionAltura) {
            enlacesNav.forEach(enlace => {
                enlace.classList.remove('activo');
                if (enlace.getAttribute('href') === '#' + seccionId) {
                    enlace.classList.add('activo');
                }
            });
        }
    });
});

// ===== Formulario del boletín con validación directa =====
const formBoletin = document.getElementById('formBoletin');

if (formBoletin) {
    const inputEmail = document.getElementById('inputEmail');

    if (inputEmail) {
        inputEmail.addEventListener('input', () => {
            inputEmail.style.borderColor = '';
            const msg = formBoletin.querySelector('.error-boletin-msg');
            if (msg) msg.remove();
        });
    }

    formBoletin.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = inputEmail ? inputEmail.value.trim() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            if (inputEmail) {
                inputEmail.style.borderColor = '#ef4444';
                const msgPrev = formBoletin.querySelector('.error-boletin-msg');
                if (msgPrev) msgPrev.remove();

                const span = document.createElement('span');
                span.className = 'error-boletin-msg';
                span.style.cssText = 'color:#ef4444;font-size:0.8rem;margin-top:6px;display:block;font-weight:600;';
                span.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ingresa un correo electrónico válido.';
                formBoletin.appendChild(span);
            }
            return;
        }

        const btnSuscribir = formBoletin.querySelector('.btn-suscribir');
        const textoOriginal = btnSuscribir.textContent;

        btnSuscribir.innerHTML = '<i class="fas fa-check"></i> ¡Suscrito con Éxito!';
        btnSuscribir.style.backgroundColor = '#10b981';

        setTimeout(() => {
            btnSuscribir.textContent = textoOriginal;
            btnSuscribir.style.backgroundColor = '';
            if (inputEmail) inputEmail.value = '';
            const msg = formBoletin.querySelector('.error-boletin-msg');
            if (msg) msg.remove();
        }, 3000);
    });
}

// ===== Buscador en encabezado con validación =====
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

// ===== Scroll suave para los enlaces internos =====
document.querySelectorAll('a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        e.preventDefault();
        const destino = document.querySelector(enlace.getAttribute('href'));
        if (destino) {
            destino.scrollIntoView({ behavior: 'smooth' });
        }

        // Cerrar menú móvil si está abierto
        if (window.innerWidth <= 968) {
            navEnlaces.style.display = 'none';
            menuAbierto = false;
        }
    });
});
