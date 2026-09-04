// =======================================================
// REGISTRO SCRIPT - Almacen El Baraton (VALIDACIONES INTEGRADAS)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-registro');
    if (!form) return;

    const inputNombres = document.getElementById('nombres');
    const inputApellidos = document.getElementById('apellidos');
    const selectTipoDoc = document.getElementById('tipo_doc');
    const inputNumDoc = document.getElementById('num_doc');
    const inputTelefono = document.getElementById('telefono');
    const inputCorreo = document.getElementById('correo_reg');
    const inputContra = document.getElementById('contra_reg');
    const inputContraConf = document.getElementById('contra_conf');
    const checkTerminos = document.getElementById('terminos');
    const btnSubmit = document.getElementById('btn-submit-registro') || form.querySelector('button[type="submit"]');

    // --- Helpers de error visual directo en el archivo ---
    function mostrarError(input, mensaje) {
        limpiarError(input);
        const contenedor = input.closest('.grupo-entrada') || input.closest('.caja-terminos') || input.parentElement;
        const envoltorio = input.closest('.envoltorio-entrada') || input;
        
        if (envoltorio !== input) {
            envoltorio.style.borderColor = '#ef4444';
            envoltorio.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        } else {
            input.style.outline = '2px solid #ef4444';
        }

        const spanError = document.createElement('span');
        spanError.className = 'error-validacion-msg';
        spanError.style.cssText = 'color: #ef4444; font-size: 0.78rem; margin-top: 4px; display: flex; align-items: center; gap: 4px; font-weight: 500;';
        spanError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        contenedor.appendChild(spanError);
    }

    function limpiarError(input) {
        const contenedor = input.closest('.grupo-entrada') || input.closest('.caja-terminos') || input.parentElement;
        const envoltorio = input.closest('.envoltorio-entrada') || input;
        
        if (envoltorio !== input) {
            envoltorio.style.borderColor = '';
            envoltorio.style.boxShadow = '';
        } else {
            input.style.outline = '';
        }

        const msgPrevio = contenedor.querySelector('.error-validacion-msg');
        if (msgPrevio) msgPrevio.remove();
    }

    // Limpieza en tiempo real al interactuar (quitar borde rojo)
    [inputNombres, inputApellidos, selectTipoDoc, inputNumDoc, inputTelefono, inputCorreo, inputContra, inputContraConf].forEach(el => {
        if (el) {
            el.addEventListener('input', () => limpiarError(el));
            el.addEventListener('change', () => limpiarError(el));
        }
    });
    if (checkTerminos) {
        checkTerminos.addEventListener('change', () => limpiarError(checkTerminos));
    }

    // --- Restringir caracteres permitidos en tiempo real (evitar que se escriban) ---
    if (inputNombres) {
        inputNombres.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
        });
    }
    if (inputApellidos) {
        inputApellidos.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
        });
    }
    if (inputNumDoc) {
        inputNumDoc.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
    if (inputTelefono) {
        inputTelefono.addEventListener('input', function() {
            this.value = this.value.replace(/[^\d\s\-\+]/g, '');
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nombres = inputNombres ? inputNombres.value.trim() : '';
        const apellidos = inputApellidos ? inputApellidos.value.trim() : '';
        const tipoDoc = selectTipoDoc ? selectTipoDoc.value : '';
        const numDoc = inputNumDoc ? inputNumDoc.value.trim() : '';
        const telefono = inputTelefono ? inputTelefono.value.trim() : '';
        const correo = inputCorreo ? inputCorreo.value.trim() : '';
        const contrasena = inputContra ? inputContra.value : '';
        const confirmarContrasena = inputContraConf ? inputContraConf.value : '';
        const aceptoTerminos = checkTerminos ? checkTerminos.checked : false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;
        const soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

        const soloNumerosRegex = /^[0-9]+$/;

        let esValido = true;

        // 1. Validar Nombres
        if (!nombres) {
            mostrarError(inputNombres, 'El nombre es obligatorio.');
            esValido = false;
        } else if (nombres.length < 2) {
            mostrarError(inputNombres, 'Debe tener al menos 2 caracteres.');
            esValido = false;
        } else if (!soloLetrasRegex.test(nombres)) {
            mostrarError(inputNombres, 'Solo se permiten letras y espacios.');
            esValido = false;
        } else {
            limpiarError(inputNombres);
        }

        // 2. Validar Apellidos
        if (!apellidos) {
            mostrarError(inputApellidos, 'El apellido es obligatorio.');
            esValido = false;
        } else if (apellidos.length < 2) {
            mostrarError(inputApellidos, 'Debe tener al menos 2 caracteres.');
            esValido = false;
        } else if (!soloLetrasRegex.test(apellidos)) {
            mostrarError(inputApellidos, 'Solo se permiten letras y espacios.');
            esValido = false;
        } else {
            limpiarError(inputApellidos);
        }

        // 3. Validar Tipo de Documento
        if (!tipoDoc) {
            mostrarError(selectTipoDoc, 'Selecciona un tipo de documento.');
            esValido = false;
        } else {
            limpiarError(selectTipoDoc);
        }

        // 4. Validar Número de Documento
        if (!numDoc) {
            mostrarError(inputNumDoc, 'El número de documento es obligatorio.');
            esValido = false;
        } else if (numDoc.length < 5) {
            mostrarError(inputNumDoc, 'Debe tener al menos 5 dígitos.');
            esValido = false;
        } else if (!soloNumerosRegex.test(numDoc)) {
            mostrarError(inputNumDoc, 'Solo se permiten números.');
            esValido = false;
        } else {
            limpiarError(inputNumDoc);
        }

        // 5. Validar Teléfono
        if (!telefono) {
            mostrarError(inputTelefono, 'El teléfono de contacto es obligatorio.');
            esValido = false;
        } else if (!telefonoRegex.test(telefono)) {
            mostrarError(inputTelefono, 'Número de teléfono inválido (mínimo 7 dígitos).');
            esValido = false;
        } else {
            limpiarError(inputTelefono);
        }

        // 6. Validar Correo
        if (!correo) {
            mostrarError(inputCorreo, 'El correo electrónico es obligatorio.');
            esValido = false;
        } else if (!emailRegex.test(correo)) {
            mostrarError(inputCorreo, 'Formato de correo no válido (ej. usuario@empresa.com).');
            esValido = false;
        } else {
            limpiarError(inputCorreo);
        }

        // 7. Validar Contraseña
        if (!contrasena) {
            mostrarError(inputContra, 'La contraseña es obligatoria.');
            esValido = false;
        } else if (contrasena.length < 6) {
            mostrarError(inputContra, 'La contraseña debe tener al menos 6 caracteres.');
            esValido = false;
        } else {
            limpiarError(inputContra);
        }

        // 8. Validar Confirmación de Contraseña
        if (!confirmarContrasena) {
            mostrarError(inputContraConf, 'Confirma tu contraseña.');
            esValido = false;
        } else if (contrasena !== confirmarContrasena) {
            mostrarError(inputContraConf, 'Las contraseñas no coinciden.');
            esValido = false;
        } else {
            limpiarError(inputContraConf);
        }

        // 9. Validar Términos
        if (!aceptoTerminos) {
            mostrarError(checkTerminos, 'Debes aceptar los Términos y Condiciones para continuar.');
            esValido = false;
        } else {
            limpiarError(checkTerminos);
        }

        if (!esValido) {
            const primerError = form.querySelector('.error-validacion-msg');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const textoOriginalBtn = btnSubmit ? btnSubmit.innerHTML : 'Crear Cuenta';

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando usuario...';
            }

            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const nit = numDoc ? `${tipoDoc.toUpperCase()}: ${numDoc}` : null;

            await API.registro({
                nombre: nombreCompleto,
                email: correo,
                password: contrasena,
                telefono,
                nit,
                tipo_documento: tipoDoc.toUpperCase(),
                numero_documento: numDoc,
                documento_identidad: numDoc
            });

            // Notificación visual de éxito en el botón antes de redirigir
            if (btnSubmit) {
                btnSubmit.style.background = '#10b981';
                btnSubmit.innerHTML = '✓ ¡Registro Exitoso!';
            }

            setTimeout(() => {
                window.location.href = '../perfil/perfil.html';
            }, 1200);

        } catch (error) {
            mostrarError(inputCorreo, error.message || 'Error al registrar usuario.');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginalBtn;
                btnSubmit.style.background = '';
            }
        }
    });
});
