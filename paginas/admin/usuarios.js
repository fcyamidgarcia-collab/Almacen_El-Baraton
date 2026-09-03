// ========== USUARIOS ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const tbody = document.getElementById('cuerpoTablaUsuarios');
    const modal = document.getElementById('modalUsuario');
    const btnNuevo = document.getElementById('btnNuevoUsuario');
    const btnCerrar = document.getElementById('btnCerrarModalUsuario');
    const btnCancelar = document.getElementById('btnCancelarUsuario');
    const form = document.getElementById('formularioUsuario');

    // Mapa de roles de la BD
    const ROLES = { 1: 'administrador', 2: 'empleado', 3: 'cliente' };
    const ROLES_ID = { 'administrador': 1, 'empleado': 2, 'cliente': 3 };

    async function cargar() {
        try {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>`;
            datos = await API.getUsuarios();
            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:25px;color:#64748b">No hay usuarios registrados.</td></tr>`;
            return;
        }

        datos.forEach(u => {
            const tr = document.createElement('tr');
            const esActivo = u.estado === 'activo';
            const rolNombre = u.nombre_rol || ROLES[u.id_rol] || 'cliente';
            const fecha = u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-CO') : 'N/A';
            tr.innerHTML = `
                <td><span class="nombre-usuario-tabla">${u.nombre} ${u.apellido || ''}</span></td>
                <td>${u.correo}</td>
                <td><span class="insignia-rol">${rolNombre}</span></td>
                <td>${fecha}</td>
                <td><span class="${esActivo ? 'texto-verde' : 'texto-rojo'}">${u.estado}</span></td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-usr" data-id="${u.id_usuario}" title="Editar Usuario"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion btn-toggle-usr" data-id="${u.id_usuario}" title="${esActivo ? 'Desactivar' : 'Activar'}" style="color:${esActivo ? '#f59e0b' : '#22c55e'}">
                        <i class="fas ${esActivo ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                    <button class="boton-accion btn-eliminar-usr" data-id="${u.id_usuario}" title="Eliminar Usuario" style="color:#ef4444">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Editar
        document.querySelectorAll('.btn-editar-usr').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const usr = datos.find(u => u.id_usuario === id);
                if (!usr) return;
                modoEdicion = id;
                document.getElementById('usrNombre').value = usr.nombre || '';
                document.getElementById('usrApellido').value = usr.apellido || '';
                document.getElementById('usrEmail').value = usr.correo || '';
                document.getElementById('usrPassword').value = '';
                document.getElementById('usrRol').value = usr.id_rol || 3;
                const telEl = document.getElementById('usrTelefono');
                if (telEl) telEl.value = usr.telefono || '';
                const titulo = document.getElementById('tituloModalUsuario');
                if (titulo) titulo.textContent = 'Editar Usuario';
                modal.classList.add('activo');
            });
        });

        // Toggle activo/inactivo
        document.querySelectorAll('.btn-toggle-usr').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    await API.toggleEstadoUsuario(id);
                    await cargar();
                } catch (err) { alert('Error: ' + err.message); }
            });
        });

        // Eliminar Usuario
        document.querySelectorAll('.btn-eliminar-usr').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const usr = datos.find(u => String(u.id_usuario) === String(id));
                const nombre = usr ? `${usr.nombre} (${usr.correo})` : `#${id}`;
                if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}" de la base de datos MySQL?`)) return;

                try {
                    await API.eliminarUsuario(id);
                    alert(`¡Usuario "${nombre}" eliminado exitosamente!`);
                    await cargar();
                } catch (err) { alert('Error al eliminar usuario: ' + err.message); }
            });
        });
    }

    // Helper de error en modal usuario
    function mostrarErrorUsr(input, msg) {
        limpiarErrorUsr(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-usr-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorUsr(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-usr-msg')) sig.remove();
    }

    ['usrNombre', 'usrApellido', 'usrEmail', 'usrPassword', 'usrTelefono'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => limpiarErrorUsr(el));
    });

    btnNuevo?.addEventListener('click', () => {
        modoEdicion = null;
        form.reset();
        ['usrNombre', 'usrApellido', 'usrEmail', 'usrPassword', 'usrTelefono'].forEach(id => {
            const el = document.getElementById(id);
            if (el) limpiarErrorUsr(el);
        });
        const titulo = document.getElementById('tituloModalUsuario');
        if (titulo) titulo.textContent = 'Crear Nuevo Usuario';
        modal.classList.add('activo');
    });
    btnCerrar?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    form?.addEventListener('submit', async e => {
        e.preventDefault();

        const elNombre = document.getElementById('usrNombre');
        const elApellido = document.getElementById('usrApellido');
        const elEmail = document.getElementById('usrEmail');
        const elPass = document.getElementById('usrPassword');
        const elRol = document.getElementById('usrRol');
        const elTel = document.getElementById('usrTelefono');

        const nombre = elNombre.value.trim();
        const apellido = elApellido?.value.trim() || '';
        const correo = elEmail.value.trim();
        const contrasena = elPass?.value.trim() || '';
        const id_rol = parseInt(elRol?.value) || 3;
        const telefono = elTel?.value.trim() || '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;
        let esValido = true;

        if (!nombre || nombre.length < 2) {
            mostrarErrorUsr(elNombre, 'El nombre debe tener al menos 2 caracteres.');
            esValido = false;
        } else {
            limpiarErrorUsr(elNombre);
        }

        if (!correo || !emailRegex.test(correo)) {
            mostrarErrorUsr(elEmail, 'Ingresa un correo electrónico corporativo válido.');
            esValido = false;
        } else {
            limpiarErrorUsr(elEmail);
        }

        if (!modoEdicion && (!contrasena || contrasena.length < 6)) {
            mostrarErrorUsr(elPass, 'La contraseña es obligatoria (mínimo 6 caracteres).');
            esValido = false;
        } else if (modoEdicion && contrasena && contrasena.length < 6) {
            mostrarErrorUsr(elPass, 'La nueva contraseña debe tener al menos 6 caracteres.');
            esValido = false;
        } else if (elPass) {
            limpiarErrorUsr(elPass);
        }

        if (telefono && !telefonoRegex.test(telefono)) {
            mostrarErrorUsr(elTel, 'Teléfono inválido (mínimo 7 dígitos).');
            esValido = false;
        } else if (elTel) {
            limpiarErrorUsr(elTel);
        }

        if (!esValido) return;

        const payload = { nombre, apellido, correo, id_rol, estado: 'activo' };
        if (telefono) payload.telefono = telefono;
        if (contrasena) payload.contrasena = contrasena;

        try {
            if (modoEdicion) {
                await API.actualizarUsuario(modoEdicion, payload);
                alert('¡Usuario actualizado exitosamente!');
            } else {
                await API.crearUsuario(payload);
                alert('¡Usuario creado exitosamente en MySQL!');
            }
            modal.classList.remove('activo');
            form.reset();
            modoEdicion = null;
            await cargar();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargar();
});
