// ========== CONTACTO JS - PREMIUM (VALIDACIONES INTEGRADAS) ==========

// --- Formulario de contacto y validaciones directas ---
const formContacto = document.getElementById('formContacto');

if (formContacto) {
    const inputNombre = document.getElementById('nombreCompleto');
    const inputEmail = document.getElementById('emailCorporativo');
    const inputTelefono = document.getElementById('telefono');
    const selectAsunto = document.getElementById('asunto');
    const textareaMensaje = document.getElementById('mensaje');

    // Funciones de error visual en el archivo
    function mostrarErrorContacto(input, mensaje) {
        limpiarErrorContacto(input);
        const grupo = input.closest('.campo-grupo') || input.parentElement;
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';

        const span = document.createElement('span');
        span.className = 'error-contacto-msg';
        span.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 5px; display: flex; align-items: center; gap: 4px; font-weight: 500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        grupo.appendChild(span);
    }

    function limpiarErrorContacto(input) {
        const grupo = input.closest('.campo-grupo') || input.parentElement;
        input.style.borderColor = '';
        input.style.boxShadow = '';
        const msg = grupo.querySelector('.error-contacto-msg');
        if (msg) msg.remove();
    }

    // Limpiar errores mientras el usuario escribe
    [inputNombre, inputEmail, inputTelefono, selectAsunto, textareaMensaje].forEach(campo => {
        if (campo) {
            campo.addEventListener('input', () => limpiarErrorContacto(campo));
            campo.addEventListener('change', () => limpiarErrorContacto(campo));
        }
    });

    // Validar en tiempo real los caracteres permitidos
    if (inputNombre) {
        inputNombre.addEventListener('input', function() {
            this.value = this.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    if (inputTelefono) {
        inputTelefono.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9\+\-\s\(\)]/g, '');
        });
    }

    // --- Autorrellenar datos del usuario logueado ---
    async function autorrellenarPerfil() {
        try {
            let usuario = null;
            if (window.API && API.getUsuarioActual) {
                usuario = API.getUsuarioActual();
            } else {
                const data = localStorage.getItem('baraton_user');
                usuario = data ? JSON.parse(data) : null;
            }

            if (!usuario) return;

            // Rellenar Nombre
            if (inputNombre && !inputNombre.value) {
                const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
                if (nombreCompleto) inputNombre.value = nombreCompleto;
            }

            // Rellenar Email
            if (inputEmail && !inputEmail.value) {
                const correo = usuario.correo || usuario.email || '';
                if (correo) inputEmail.value = correo;
            }

            // Rellenar Teléfono (desde usuario o consultando el cliente)
            if (inputTelefono && !inputTelefono.value) {
                if (usuario.telefono) {
                    inputTelefono.value = usuario.telefono;
                } else if (usuario.id_usuario && window.API && API.getClientePorUsuario) {
                    try {
                        const cliente = await API.getClientePorUsuario(usuario.id_usuario);
                        if (cliente && cliente.telefono) {
                            inputTelefono.value = cliente.telefono;
                        }
                    } catch (_) {}
                }
            }
        } catch (error) {
            console.warn('No se pudo autorrellenar el perfil en contacto:', error);
        }
    }

    autorrellenarPerfil();

    formContacto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = inputNombre ? inputNombre.value.trim() : '';
        const email = inputEmail ? inputEmail.value.trim() : '';
        const tel = inputTelefono ? inputTelefono.value.trim() : '';
        const asuntoTexto = selectAsunto && selectAsunto.selectedIndex >= 0
            ? selectAsunto.options[selectAsunto.selectedIndex].text
            : (selectAsunto ? selectAsunto.value : 'Otro');
        const mensaje = textareaMensaje ? textareaMensaje.value.trim() : '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;

        let esValido = true;

        // 1. Validar Nombre
        if (!nombre) {
            mostrarErrorContacto(inputNombre, 'Por favor ingresa tu nombre completo.');
            esValido = false;
        } else if (nombre.length < 3) {
            mostrarErrorContacto(inputNombre, 'El nombre debe tener al menos 3 caracteres.');
            esValido = false;
        } else {
            limpiarErrorContacto(inputNombre);
        }

        // 2. Validar Email Corporativo
        if (!email) {
            mostrarErrorContacto(inputEmail, 'El correo electrónico corporativo es obligatorio.');
            esValido = false;
        } else if (!emailRegex.test(email)) {
            mostrarErrorContacto(inputEmail, 'Formato de correo no válido (ej. contacto@empresa.com).');
            esValido = false;
        } else {
            limpiarErrorContacto(inputEmail);
        }

        // 3. Validar Teléfono (opcional, pero si se escribe debe ser válido)
        if (tel && !telefonoRegex.test(tel)) {
            mostrarErrorContacto(inputTelefono, 'Número de teléfono inválido (mínimo 7 dígitos).');
            esValido = false;
        } else if (inputTelefono) {
            limpiarErrorContacto(inputTelefono);
        }

        // 4. Validar Asunto
        if (!asuntoTexto) {
            mostrarErrorContacto(selectAsunto, 'Selecciona un asunto para tu consulta.');
            esValido = false;
        } else {
            limpiarErrorContacto(selectAsunto);
        }

        // 5. Validar Mensaje
        if (!mensaje) {
            mostrarErrorContacto(textareaMensaje, 'Por favor redacta tu mensaje.');
            esValido = false;
        } else if (mensaje.length < 10) {
            mostrarErrorContacto(textareaMensaje, 'El mensaje debe contener al menos 10 caracteres explicativos.');
            esValido = false;
        } else {
            limpiarErrorContacto(textareaMensaje);
        }

        if (!esValido) {
            const primerError = formContacto.querySelector('.error-contacto-msg');
            if (primerError) {
                primerError.parentElement.querySelector('input, select, textarea')?.focus();
            }
            return;
        }

        const btn = formContacto.querySelector('.btn-enviar');
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enviando mensaje...</span>';
        btn.disabled = true;

        // Guardar mensaje en base de datos / API
        try {
            if (window.API && API.enviarMensajeContacto) {
                await API.enviarMensajeContacto({
                    nombre_completo: nombre,
                    email: email,
                    telefono: tel,
                    asunto: asuntoTexto,
                    mensaje: mensaje
                });
            }
        } catch (error) {
            console.warn('Error al guardar mensaje:', error.message);
        }

        // Animación del botón tras envío exitoso
        btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>¡Consulta Enviada con Éxito!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        btn.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.35)';

        btn.style.transform = 'scale(1.03)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 200);

        setTimeout(() => {
            btn.innerHTML = textoOriginal;
            btn.style.background = '';
            btn.style.boxShadow = '';
            btn.disabled = false;
            formContacto.reset();
        }, 3200);
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
