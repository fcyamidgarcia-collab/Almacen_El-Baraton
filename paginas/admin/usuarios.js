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
                <td><span class="${esActivo ? 'texto-verde' : 'texto-rojo'}">● ${u.estado}</span></td>
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

    btnNuevo?.addEventListener('click', () => {
        modoEdicion = null;
        form.reset();
        const titulo = document.getElementById('tituloModalUsuario');
        if (titulo) titulo.textContent = 'Crear Nuevo Usuario';
        modal.classList.add('activo');
    });
    btnCerrar?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    form?.addEventListener('submit', async e => {
        e.preventDefault();
        const nombre = document.getElementById('usrNombre').value.trim();
        const apellido = document.getElementById('usrApellido')?.value.trim() || '';
        const correo = document.getElementById('usrEmail').value.trim();
        const contrasena = document.getElementById('usrPassword')?.value.trim() || '';
        const id_rol = parseInt(document.getElementById('usrRol')?.value) || 3;
        const telefono = document.getElementById('usrTelefono')?.value.trim() || '';

        if (!modoEdicion && !contrasena) {
            alert('La contraseña es obligatoria para crear un usuario.');
            return;
        }

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
