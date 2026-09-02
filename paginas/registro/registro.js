// =======================================================
// REGISTRO SCRIPT - ALMACEN EL BARATON
// =======================================================

document.getElementById('formulario-registro').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nombres = document.getElementById('nombres').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const tipoDoc = document.getElementById('tipo_doc').value;
    const numDoc = document.getElementById('num_doc').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo_reg').value.trim();
    const contrasena = document.getElementById('contra_reg').value;
    const confirmarContrasena = document.getElementById('contra_conf').value;
    const btnSubmit = document.getElementById('btn-submit-registro') || this.querySelector('button[type="submit"]');

    if (contrasena !== confirmarContrasena) {
        alert('Las contraseñas no coinciden. Por favor verifica.');
        return;
    }

    if (contrasena.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Creando cuenta...';

        const nombreCompleto = `${nombres} ${apellidos}`.trim();
        const nit = numDoc ? `${tipoDoc.toUpperCase()}: ${numDoc}` : null;

        const data = await API.registro({
            nombre: nombreCompleto,
            email: correo,
            password: contrasena,
            telefono,
            nit
        });

        alert(`¡Registro exitoso! Bienvenido, ${nombreCompleto}.`);
        window.location.href = '../perfil/perfil.html';
    } catch (error) {
        alert('Error al registrar usuario: ' + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Crear Cuenta <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }
});
