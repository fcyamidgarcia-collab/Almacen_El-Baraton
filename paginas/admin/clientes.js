// ========== CLIENTES ADMIN - CONECTADO A MYSQL (COMPLETO EDITAR / ELIMINAR) ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const tbody = document.getElementById('cuerpoTablaClientes');
    const modal = document.getElementById('modalCliente');
    const modalTitulo = document.getElementById('modalClienteTitulo');
    const btnNuevo = document.getElementById('btnNuevoCliente');
    const btnCerrar = document.getElementById('btnCerrarModalCliente');
    const btnCancelar = document.getElementById('btnCancelarCliente');
    const form = document.getElementById('formularioCliente');

    const kpiTotales = document.getElementById('kpiClientesTotales');
    const kpiActivos = document.getElementById('kpiClientesActivos');
    const kpiInactivos = document.getElementById('kpiClientesInactivos');

    async function cargar() {
        try {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando clientes desde MySQL...</td></tr>`;
            const [clientes, pedidos, prods] = await Promise.all([
                API.getClientes(),
                API.getPedidos().catch(() => []),
                API.getProductos({ estado: 'activo' }).catch(() => [])
            ]);

            datos = clientes || [];

            // Actualizar KPIs
            const total = datos.length;
            const activos = datos.filter(c => (c.estado || 'activo') === 'activo').length;
            const inactivos = total - activos;

            if (kpiTotales) kpiTotales.textContent = total;
            if (kpiActivos) kpiActivos.textContent = activos;
            if (kpiInactivos) kpiInactivos.textContent = inactivos;

            // Insignias del Sidebar
            const bCli = document.getElementById('insigniaClientesBarra');
            const bPed = document.getElementById('insigniaPedidosBarra');
            const bProd = document.getElementById('insigniaProductosBarra');
            if (bCli) bCli.textContent = total;
            if (bPed) bPed.textContent = pedidos.length;
            if (bProd) bProd.textContent = prods.length;

            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error al conectar con MySQL: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:25px;color:#64748b">No hay clientes registrados en la base de datos.</td></tr>`;
            return;
        }

        datos.forEach(c => {
            const tr = document.createElement('tr');
            const esActivo = (c.estado || 'activo') === 'activo';
            const badgeEstado = esActivo
                ? '<span class="estado estado-enviado">● Activo</span>'
                : '<span class="estado estado-cancelado">● Inactivo</span>';

            tr.innerHTML = `
                <td>
                    <strong class="nombre-cliente-tabla">${c.nombre} ${c.apellido || ''}</strong>
                </td>
                <td><code>${c.documento_identidad || 'Sin documento'}</code></td>
                <td>
                    <strong>${c.telefono || 'Sin teléfono'}</strong><br>
                    <small style="color:#64748b">${c.correo || 'Sin correo registrado'}</small>
                </td>
                <td>${c.ciudad || 'Bogotá D.C.'}</td>
                <td><small style="color:#475569">${c.direccion || 'Sin dirección'}</small></td>
                <td><span class="insignia" style="background:#f1f5f9;color:#334155">${c.total_pedidos || 0} pedidos</span></td>
                <td>${badgeEstado}</td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-cli" data-id="${c.id_cliente}" title="Editar Cliente"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion btn-eliminar-cli" data-id="${c.id_cliente}" title="Eliminar Cliente" style="color:#ef4444"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Botones de editar
        document.querySelectorAll('.btn-editar-cli').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const cli = datos.find(c => c.id_cliente === id);
                if (!cli) return;

                modoEdicion = id;
                if (modalTitulo) modalTitulo.textContent = `Editar Cliente #${id}`;

                document.getElementById('cliNombre').value = cli.nombre || '';
                document.getElementById('cliApellido').value = cli.apellido || '';
                document.getElementById('cliNit').value = cli.documento_identidad || '';
                document.getElementById('cliContacto').value = cli.telefono || '';
                document.getElementById('cliDireccion').value = cli.direccion || '';
                document.getElementById('cliCiudad').value = cli.ciudad || '';

                modal.classList.add('activo');
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar-cli').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const cli = datos.find(c => String(c.id_cliente) === String(id));
                const nombre = cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : `#${id}`;

                if (!confirm(`¿Estás seguro de eliminar al cliente "${nombre}" de la base de datos MySQL? Esta acción no se puede deshacer.`)) return;

                try {
                    await API.eliminarCliente(id);
                    alert(`¡Cliente "${nombre}" eliminado exitosamente!`);
                    await cargar();
                } catch (err) {
                    alert('Error al eliminar cliente: ' + err.message);
                }
            });
        });
    }

    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            modoEdicion = null;
            if (modalTitulo) modalTitulo.textContent = 'Registrar Nuevo Cliente';
            form.reset();
            modal.classList.add('activo');
        });
    }

    if (btnCerrar) btnCerrar.addEventListener('click', () => modal.classList.remove('activo'));
    if (btnCancelar) btnCancelar.addEventListener('click', () => modal.classList.remove('activo'));

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btnGuardarCliente');
            const originalHTML = btnSubmit.innerHTML;

            const payload = {
                nombre: document.getElementById('cliNombre').value.trim(),
                apellido: document.getElementById('cliApellido').value.trim(),
                documento_identidad: document.getElementById('cliNit').value.trim(),
                telefono: document.getElementById('cliContacto').value.trim(),
                direccion: document.getElementById('cliDireccion').value.trim(),
                ciudad: document.getElementById('cliCiudad').value.trim(),
                estado: 'activo'
            };

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                if (modoEdicion) {
                    await API.actualizarCliente(modoEdicion, payload);
                    alert('¡Cliente actualizado exitosamente en MySQL!');
                } else {
                    await API.crearCliente(payload);
                    alert('¡Cliente registrado exitosamente en MySQL!');
                }

                modal.classList.remove('activo');
                form.reset();
                modoEdicion = null;
                await cargar();
            } catch (err) {
                alert('Error al procesar cliente: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    await cargar();
});
