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
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Verificando...';
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
        alert('Error al iniciar sesión: ' + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'INICIAR SESIÓN';
    }
});
