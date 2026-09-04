// =======================================================
// LOGIN SCRIPT - Almacen El Baraton (VALIDACIONES INTEGRADAS)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-acceso');
    if (!form) return;

    const inputCorreo = document.getElementById('correo');
    const inputContrasena = document.getElementById('contrasena');
    const btnSubmit = document.getElementById('btn-submit-login') || form.querySelector('button[type="submit"]');

    // Funciones de validación visual directa
    function mostrarError(input, mensaje) {
        limpiarError(input);
        const contenedor = input.closest('.grupo-entrada') || input.parentElement;
        const envoltorio = input.closest('.envoltorio-entrada') || input;
        envoltorio.style.borderColor = '#ef4444';
        envoltorio.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';

        const spanError = document.createElement('span');
        spanError.className = 'error-validacion-msg';
        spanError.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 5px; display: flex; align-items: center; gap: 4px; font-weight: 500;';
        spanError.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size: 0.85rem;"></i> ${mensaje}`;
        contenedor.appendChild(spanError);
    }

    function limpiarError(input) {
        const contenedor = input.closest('.grupo-entrada') || input.parentElement;
        const envoltorio = input.closest('.envoltorio-entrada') || input;
        envoltorio.style.borderColor = '';
        envoltorio.style.boxShadow = '';
        const msgPrevio = contenedor.querySelector('.error-validacion-msg');
        if (msgPrevio) msgPrevio.remove();
    }

    // Limpieza al escribir
    if (inputCorreo) {
        inputCorreo.addEventListener('input', () => limpiarError(inputCorreo));
    }
    if (inputContrasena) {
        inputContrasena.addEventListener('input', () => limpiarError(inputContrasena));
    }

    // Botón ver/ocultar contraseña
    const btnToggle = document.getElementById('btn-toggle-password');
    const iconoToggle = document.getElementById('icono-toggle-password');
    if (btnToggle && inputContrasena && iconoToggle) {
        btnToggle.addEventListener('click', () => {
            const esPassword = inputContrasena.type === 'password';
            inputContrasena.type = esPassword ? 'text' : 'password';
            iconoToggle.classList.toggle('fa-eye', !esPassword);
            iconoToggle.classList.toggle('fa-eye-slash', esPassword);
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const correo = inputCorreo.value.trim();
        const contrasena = inputContrasena.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let esValido = true;

        // Validación de correo
        if (!correo) {
            mostrarError(inputCorreo, 'Por favor ingresa tu correo electrónico corporativo.');
            esValido = false;
        } else if (!emailRegex.test(correo)) {
            mostrarError(inputCorreo, 'Formato de correo inválido (ejemplo: usuario@empresa.com).');
            esValido = false;
        } else {
            limpiarError(inputCorreo);
        }

        // Validación de contraseña
        if (!contrasena) {
            mostrarError(inputContrasena, 'Por favor ingresa tu contraseña.');
            esValido = false;
        } else if (contrasena.length < 6) {
            mostrarError(inputContrasena, 'La contraseña debe tener al menos 6 caracteres.');
            esValido = false;
        } else {
            limpiarError(inputContrasena);
        }

        if (!esValido) {
            const primerInvalido = form.querySelector('.error-validacion-msg')?.previousElementSibling || inputCorreo;
            primerInvalido?.focus();
            return;
        }

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando credenciales...';
            }
            const data = await API.login(correo, contrasena);

            // Sincronizar carrito de invitado a la base de datos si existe
            try {
                const guestCart = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
                if (guestCart.length > 0) {
                    for (const item of guestCart) {
                        if (item.id_producto) {
                            await API.agregarAlCarrito(item.id_producto, item.cantidad || 1);
                        }
                    }
                    localStorage.removeItem('carrito_invitado');
                }
            } catch (eCart) {
                console.warn('No se pudo sincronizar carrito de invitado:', eCart.message);
            }

            // Redirigir según el rol del usuario (comparación case-insensitive)
            const rol = (data.usuario?.rol_nombre || data.usuario?.nombre_rol || data.usuario?.rol || '').toLowerCase().trim();
            const idRol = data.usuario?.id_rol;

            if (rol === 'administrador' || idRol === 1) {
                window.location.href = '../admin/dashboard.html';
            } else if (rol === 'empleado' || rol === 'vendedor' || idRol === 2) {
                window.location.href = '../vendedor/dashboard.html';
            } else {
                window.location.href = '../perfil/perfil.html';
            }
        } catch (error) {
            mostrarError(inputContrasena, error.message || 'Credenciales no coinciden.');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'INICIAR SESIÓN';
            }
        }
    });
});
