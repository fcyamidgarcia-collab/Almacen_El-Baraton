// ========== CLIENTES ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const tbody = document.getElementById('cuerpoTablaClientes');
    const modal = document.getElementById('modalCliente');
    const btnNuevo = document.getElementById('btnNuevoCliente');
    const btnCerrar = document.getElementById('btnCerrarModalCliente');
    const btnCancelar = document.getElementById('btnCancelarCliente');
    const form = document.getElementById('formularioCliente');

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    async function cargar() {
        try {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando clientes...</td></tr>`;
            datos = await API.getClientes();
            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:25px;color:#64748b">No hay clientes registrados.</td></tr>`;
            return;
        }
        datos.forEach(c => {
            const tr = document.createElement('tr');
            const estado = c.estado === 'activo'
                ? '<span class="estado estado-enviado">● Activo</span>'
                : '<span class="estado estado-pendiente">● Inactivo</span>';
            tr.innerHTML = `
                <td>
                    <span class="nombre-cliente-tabla">${c.nombre} ${c.apellido || ''}</span>
                    <span class="nit-cliente-tabla">Doc: ${c.documento_identidad || 'N/A'}</span>
                </td>
                <td><strong>${c.nombre} ${c.apellido || ''}</strong><br><small style="color:#64748b">${c.correo || 'Sin correo'}</small></td>
                <td>${c.ciudad || 'N/A'}</td>
                <td>${c.telefono || 'Sin teléfono'}</td>
                <td><span class="insignia" style="background:#f1f5f9;color:#334155">${c.total_pedidos || 0} pedidos</span></td>
                <td>${estado}</td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-cli" data-id="${c.id_cliente}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion btn-desactivar-cli" data-id="${c.id_cliente}" title="Desactivar" style="color:#ef4444"><i class="fas fa-user-slash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-editar-cli').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const cli = datos.find(c => c.id_cliente === id);
                if (!cli) return;
                modoEdicion = id;
                document.getElementById('cliNombre').value = cli.nombre || '';
                document.getElementById('cliNit').value = cli.documento_identidad || '';
                const cliContacto = document.getElementById('cliContacto');
                if (cliContacto) cliContacto.value = cli.telefono || '';
                const cliEmail = document.getElementById('cliEmail');
                if (cliEmail) cliEmail.value = cli.correo || '';
                const cliCiudad = document.getElementById('cliCiudad');
                if (cliCiudad) cliCiudad.value = cli.ciudad || '';
                modal.classList.add('activo');
            });
        });

        document.querySelectorAll('.btn-desactivar-cli').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('¿Desactivar este cliente?')) return;
                try {
                    await API.eliminarCliente(id);
                    await cargar();
                } catch (err) { alert('Error: ' + err.message); }
            });
        });
    }

    btnNuevo?.addEventListener('click', () => { modoEdicion = null; form.reset(); modal.classList.add('activo'); });
    btnCerrar?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    form?.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            nombre: document.getElementById('cliNombre').value.trim(),
            apellido: document.getElementById('cliApellido')?.value.trim() || '',
            documento_identidad: document.getElementById('cliNit').value.trim(),
            telefono: document.getElementById('cliContacto')?.value.trim() || '',
            ciudad: document.getElementById('cliCiudad')?.value.trim() || '',
            estado: 'activo'
        };
        try {
            if (modoEdicion) {
                await API.actualizarCliente(modoEdicion, payload);
                alert('¡Cliente actualizado!');
            } else {
                await API.crearCliente(payload);
                alert('¡Cliente registrado en MySQL!');
            }
            modal.classList.remove('activo');
            form.reset();
            modoEdicion = null;
            await cargar();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargar();
});
