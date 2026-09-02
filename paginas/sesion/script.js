// =======================================================
// LOGIN SCRIPT - ALMACEN EL BARATON
// =======================================================

document.getElementById('formulario-acceso').addEventListener('submit', async function(e) {
    e.preventDefault();
    const correo = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const btnSubmit = document.getElementById('btn-submit-login') || this.querySelector('button[type="submit"]');
    
    if (!correo || !contrasena) {
        alert('Por favor, ingresa tu correo y contraseña.');
        return;
    }

    try {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Verificando...';

        const data = await API.login(correo, contrasena);
        
        // Redirigir según el rol del usuario (comparación case-insensitive)
        const rol = (data.usuario?.rol_nombre || data.usuario?.rol || '').toLowerCase().trim();
        
        if (rol === 'administrador' || rol === 'empleado' || rol === 'supervisor' || rol === 'vendedor') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = '../perfil/perfil.html';
        }
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'INICIAR SESIÓN';
    }
});
