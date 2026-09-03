// CONFIGURACIÓN JS - CON VALIDACIONES DIRECTAS Y PERSISTENCIA
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioConfiguracion');
    if (!formulario) return;

    const elEmpresa = document.getElementById('confEmpresa');
    const elNit = document.getElementById('confNit');
    const elEmail = document.getElementById('confEmail');
    const elPbx = document.getElementById('confPbx');
    const elIva = document.getElementById('confIva');

    // Cargar ajustes guardados previamente si existen
    const guardado = JSON.parse(localStorage.getItem('baraton_ajustes_empresa') || 'null');
    if (guardado) {
        if (elEmpresa && guardado.empresa) elEmpresa.value = guardado.empresa;
        if (elNit && guardado.nit) elNit.value = guardado.nit;
        if (elEmail && guardado.email) elEmail.value = guardado.email;
        if (elPbx && guardado.pbx) elPbx.value = guardado.pbx;
        if (elIva && guardado.iva !== undefined) elIva.value = guardado.iva;
    }

    // Helpers de error
    function mostrarErrorConf(input, msg) {
        limpiarErrorConf(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-conf-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:4px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorConf(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-conf-msg')) sig.remove();
    }

    [elEmpresa, elNit, elEmail, elPbx, elIva].forEach(el => {
        if (el) el.addEventListener('input', () => limpiarErrorConf(el));
    });

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        const empresa = elEmpresa ? elEmpresa.value.trim() : '';
        const nit = elNit ? elNit.value.trim() : '';
        const email = elEmail ? elEmail.value.trim() : '';
        const pbx = elPbx ? elPbx.value.trim() : '';
        const ivaRaw = elIva ? elIva.value.trim() : '';
        const iva = parseFloat(ivaRaw);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pbxRegex = /^[+]?[\d\s()-]{7,20}$/;
        let esValido = true;

        if (!empresa || empresa.length < 3) {
            mostrarErrorConf(elEmpresa, 'El nombre de la empresa debe tener al menos 3 caracteres.');
            esValido = false;
        } else {
            limpiarErrorConf(elEmpresa);
        }

        if (!nit || nit.length < 5) {
            mostrarErrorConf(elNit, 'El NIT o identificación fiscal es obligatorio (mínimo 5 caracteres).');
            esValido = false;
        } else {
            limpiarErrorConf(elNit);
        }

        if (!email || !emailRegex.test(email)) {
            mostrarErrorConf(elEmail, 'Ingresa un correo institucional válido.');
            esValido = false;
        } else {
            limpiarErrorConf(elEmail);
        }

        if (!pbx || !pbxRegex.test(pbx)) {
            mostrarErrorConf(elPbx, 'Ingresa un número telefónico o PBX válido.');
            esValido = false;
        } else {
            limpiarErrorConf(elPbx);
        }

        if (ivaRaw === '' || isNaN(iva) || iva < 0 || iva > 100) {
            mostrarErrorConf(elIva, 'La tasa de IVA debe ser un porcentaje entre 0 y 100.');
            esValido = false;
        } else {
            limpiarErrorConf(elIva);
        }

        if (!esValido) return;

        // Guardar en localStorage para persistencia real
        const nuevaConfiguracion = {
            empresa,
            nit,
            email,
            pbx,
            iva
        };
        localStorage.setItem('baraton_ajustes_empresa', JSON.stringify(nuevaConfiguracion));

        const btn = formulario.querySelector('button[type="submit"]');
        const originalHTML = btn ? btn.innerHTML : 'Guardar Cambios';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> ¡Ajustes Guardados con Éxito!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2500);
        }
    });
});
